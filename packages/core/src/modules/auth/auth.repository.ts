import type { Prisma, RoleName } from "../../generated/prisma/client.ts";
import { prisma, type Db } from "../../db/prisma.ts";

const authUserInclude = {
  role: true,
} satisfies Prisma.UserInclude;

export type UserWithRole = Prisma.UserGetPayload<{ include: typeof authUserInclude }>;

const adminUserInclude = {
  role: true,
  barangay: { select: { name: true } },
  _count: {
    select: {
      reports: true,
      verifiedReports: true,
      rescueAssignments: true,
      adoptionRequests: true,
    },
  },
} satisfies Prisma.UserInclude;

export type UserWithAdminRelations = Prisma.UserGetPayload<{
  include: typeof adminUserInclude;
}>;

export interface AdminUserFilters {
  search?: string;
  role?: RoleName;
  status?: "pending" | "active" | "suspended" | "deactivated";
  barangayId?: number;
}

export class AuthRepository {
  constructor(private readonly db: Db = prisma) {}

  findByEmail(email: string): Promise<UserWithRole | null> {
    return this.db.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: authUserInclude,
    });
  }

  findById(id: string): Promise<UserWithRole | null> {
    return this.db.user.findFirst({
      where: { id, deletedAt: null },
      include: authUserInclude,
    });
  }

  findRoleByName(roleName: RoleName) {
    return this.db.role.findUnique({ where: { roleName } });
  }

  create(data: {
    roleId: number;
    email: string;
    passwordHash: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    phoneNumber?: string;
    barangayId?: number;
    emailVerifiedAt?: Date;
    accountStatus?: "pending" | "active";
  }): Promise<UserWithRole> {
    return this.db.user.create({
      data: {
        roleId: data.roleId,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        barangayId: data.barangayId,
        emailVerifiedAt: data.emailVerifiedAt,
        accountStatus: data.accountStatus ?? "active",
      },
      include: authUserInclude,
    });
  }

  /** Invalidate older codes and issue a fresh one for this user. */
  async createEmailVerification(
    userId: string,
    codeHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.db.$transaction([
      this.db.emailVerification.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.db.emailVerification.create({
        data: { userId, codeHash, expiresAt },
      }),
    ]);
  }

  findLatestEmailVerification(userId: string) {
    return this.db.emailVerification.findFirst({
      where: { userId, usedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  incrementVerificationAttempts(id: string) {
    return this.db.emailVerification.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  consumeEmailVerification(id: string) {
    return this.db.emailVerification.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  markEmailVerified(userId: string): Promise<UserWithRole> {
    return this.db.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
      include: authUserInclude,
    });
  }

  listPendingByRole(roleName: RoleName): Promise<UserWithRole[]> {    return this.db.user.findMany({
      where: {
        deletedAt: null,
        accountStatus: "pending",
        role: { roleName },
      },
      include: authUserInclude,
      orderBy: { createdAt: "asc" },
    });
  }

  listActiveByRole(roleName: RoleName): Promise<UserWithRole[]> {
    return this.db.user.findMany({
      where: {
        deletedAt: null,
        accountStatus: "active",
        role: { roleName },
      },
      include: authUserInclude,
      orderBy: { firstName: "asc" },
    });
  }

  async listUsers(
    filters: AdminUserFilters,
    pagination: { skip: number; take: number },
  ): Promise<{ rows: UserWithAdminRelations[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(filters.role ? { role: { roleName: filters.role } } : {}),
      ...(filters.status ? { accountStatus: filters.status } : {}),
      ...(filters.barangayId ? { barangayId: filters.barangayId } : {}),
      ...(filters.search
        ? {
            OR: [
              { firstName: { contains: filters.search, mode: "insensitive" } },
              { lastName: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
              { phoneNumber: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.db.user.findMany({
        where,
        include: adminUserInclude,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.db.user.count({ where }),
    ]);

    return { rows, total };
  }

  findAdminById(id: string): Promise<UserWithAdminRelations | null> {
    return this.db.user.findFirst({
      where: { id, deletedAt: null },
      include: adminUserInclude,
    });
  }

  countActiveAdmins(): Promise<number> {
    return this.db.user.count({
      where: {
        deletedAt: null,
        accountStatus: "active",
        role: { roleName: "admin" },
      },
    });
  }

  setAccountStatus(
    id: string,
    accountStatus: "pending" | "active" | "suspended" | "deactivated",
  ): Promise<UserWithRole> {
    return this.db.user.update({
      where: { id },
      data: { accountStatus },
      include: authUserInclude,
    });
  }

  touchLastLogin(id: string) {
    return this.db.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  updatePasswordHash(id: string, passwordHash: string) {
    return this.db.user.update({ where: { id }, data: { passwordHash } });
  }
}

export const authRepository = new AuthRepository();
