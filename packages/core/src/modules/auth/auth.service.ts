import { compare, hash } from "bcryptjs";
import { randomBytes } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.ts";
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "../../shared/errors.ts";
import { prisma } from "../../db/prisma.ts";
import { writeAuditLog } from "../../shared/audit.ts";
import { AuthRepository, authRepository, type UserWithRole } from "./auth.repository.ts";
import type {
  AuthSession,
  AuthUser,
  JwtPayload,
  LoginInput,
  OAuthRegisterInput,
  RegisterInput,
  RegistrationResult,
} from "./auth.types.ts";

const SALT_ROUNDS = 12;

function toAuthUser(user: UserWithRole): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    fullName: [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" "),
    phoneNumber: user.phoneNumber,
    role: user.role.roleName,
    accountStatus: user.accountStatus,
    barangayId: user.barangayId,
    profilePhotoUrl: user.profilePhotoUrl,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  };
}

function signAccessToken(user: AuthUser): string {
  const payload: JwtPayload = { sub: user.id, role: user.role, type: "access" };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: env.APP_NAME,
  });
}

function buildSession(user: UserWithRole): AuthSession {
  if (user.accountStatus === "pending") {
    throw new ForbiddenError(
      "Your rescuer account is waiting for admin approval. You can sign in once it is approved.",
    );
  }
  if (user.accountStatus !== "active") {
    throw new ForbiddenError("This account is not active. Contact an administrator.");
  }
  const authUser = toAuthUser(user);
  return { token: signAccessToken(authUser), expiresIn: env.JWT_EXPIRES_IN, user: authUser };
}

function buildRegistrationResult(user: UserWithRole): RegistrationResult {
  if (user.accountStatus === "pending") {
    return { status: "pending", user: toAuthUser(user), session: null };
  }
  return { status: "active", user: toAuthUser(user), session: buildSession(user) };
}

/** Rescuers need an admin's approval; residents are active immediately. */
function initialStatus(roleName: string): "pending" | "active" {
  return roleName === "rescuer" ? "pending" : "active";
}

async function notifyAdminsOfPendingRescuer(user: UserWithRole): Promise<void> {
  const admins = await prisma.user.findMany({
    where: {
      deletedAt: null,
      accountStatus: "active",
      role: { roleName: "admin" },
    },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      recipientUserId: admin.id,
      notificationType: "system" as const,
      title: "New rescuer awaiting approval",
      body: `${user.firstName} ${user.lastName} applied as a rescuer.`,
      referenceType: "user",
      referenceId: user.id,
    })),
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { issuer: env.APP_NAME });
    if (typeof decoded === "string" || decoded.type !== "access") {
      throw new UnauthorizedError("Invalid access token");
    }
    return decoded as JwtPayload;
  } catch {
    throw new UnauthorizedError("Invalid or expired access token");
  }
}

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  async register(input: RegisterInput): Promise<RegistrationResult> {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) throw new ConflictError("An account with this email already exists");

    const roleName = input.role ?? "community_user";
    const role = await this.repo.findRoleByName(roleName);
    if (!role) throw new Error(`Role "${roleName}" is not seeded`);

    const accountStatus = initialStatus(roleName);
    const passwordHash = await hash(input.password, SALT_ROUNDS);
    const user = await this.repo.create({
      roleId: role.id,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      barangayId: input.barangayId,
      accountStatus,
    });

    await writeAuditLog(prisma, {
      userId: user.id,
      action: "register",
      entityType: "user",
      entityId: user.id,
      newValue: { email: user.email, role: roleName, status: accountStatus },
    });

    if (accountStatus === "pending") await notifyAdminsOfPendingRescuer(user);

    return buildRegistrationResult(user);
  }

  /**
   * Google has already verified the email. If a local account with that email
   * exists, sign in; otherwise create it with a random password that is never
   * exposed (the user authenticates with Google).
   */
  async registerOAuth(input: OAuthRegisterInput): Promise<RegistrationResult> {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) return buildRegistrationResult(existing);

    const roleName = input.role ?? "community_user";
    const role = await this.repo.findRoleByName(roleName);
    if (!role) throw new Error(`Role "${roleName}" is not seeded`);

    const accountStatus = initialStatus(roleName);
    const passwordHash = await hash(randomBytes(32).toString("base64url"), SALT_ROUNDS);
    const user = await this.repo.create({
      roleId: role.id,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      barangayId: input.barangayId,
      emailVerifiedAt: new Date(),
      accountStatus,
    });

    await writeAuditLog(prisma, {
      userId: user.id,
      action: "register_oauth",
      entityType: "user",
      entityId: user.id,
      newValue: { email: user.email, role: roleName, provider: "google", status: accountStatus },
    });

    if (accountStatus === "pending") await notifyAdminsOfPendingRescuer(user);

    return buildRegistrationResult(user);
  }

  /** Existing account for a Google email, including pending rescuers. */
  async findRegistrationByEmail(email: string): Promise<RegistrationResult | null> {
    const user = await this.repo.findByEmail(email);
    if (!user) return null;
    return buildRegistrationResult(user);
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const user = await this.repo.findByEmail(input.email);
    // Constant-ish response to avoid account enumeration.
    if (!user || !(await compare(input.password, user.passwordHash))) {
      throw new UnauthorizedError("Invalid email or password");
    }
    if (user.accountStatus !== "active") {
      throw new ForbiddenError("This account is not active. Contact an administrator.");
    }

    await this.repo.touchLastLogin(user.id);
    return buildSession(user);
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.repo.findById(userId);
    if (!user) throw new UnauthorizedError("Account no longer exists");
    return toAuthUser(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.repo.findById(userId);
    if (!user) throw new UnauthorizedError();
    if (!(await compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedError("Current password is incorrect");
    }
    await this.repo.updatePasswordHash(userId, await hash(newPassword, SALT_ROUNDS));
  }

  /** Admin queue: rescuers waiting for access. */
  async listPendingRescuers(): Promise<AuthUser[]> {
    const users = await this.repo.listPendingByRole("rescuer");
    return users.map(toAuthUser);
  }

  async approveRescuer(actorRole: string, userId: string): Promise<AuthUser> {
    if (actorRole !== "admin") {
      throw new ForbiddenError("Only administrators can approve rescuer accounts");
    }

    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError("Account");
    if (user.role.roleName !== "rescuer") {
      throw new ForbiddenError("Only rescuer accounts can be approved here");
    }

    const approved = await this.repo.setAccountStatus(userId, "active");

    await writeAuditLog(prisma, {
      userId: user.id,
      action: "approve_rescuer",
      entityType: "user",
      entityId: user.id,
      newValue: { status: "active" },
    });

    await prisma.notification.create({
      data: {
        recipientUserId: user.id,
        notificationType: "system",
        title: "Rescuer account approved",
        body: "Your rescuer access has been approved. You can now sign in and accept rescue assignments.",
        referenceType: "user",
        referenceId: user.id,
      },
    });

    return toAuthUser(approved);
  }
}

export const authService = new AuthService();
