import type { Prisma, RoleName } from "../../generated/prisma/client.ts";
import { prisma, type Db } from "../../db/prisma.ts";

const authUserInclude = {
  role: true,
} satisfies Prisma.UserInclude;

export type UserWithRole = Prisma.UserGetPayload<{ include: typeof authUserInclude }>;

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

  listPendingByRole(roleName: RoleName): Promise<UserWithRole[]> {
    return this.db.user.findMany({
      where: {
        deletedAt: null,
        accountStatus: "pending",
        role: { roleName },
      },
      include: authUserInclude,
      orderBy: { createdAt: "asc" },
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
