import "dotenv/config";
import { hash } from "bcryptjs";
import { prisma } from "../packages/core/src/index.ts";

/**
 * Creates or updates an administrator account.
 * Usage (PowerShell):
 *   $env:ADMIN_EMAIL="admin@example.com"; $env:ADMIN_PASSWORD="…"; npx tsx scripts/create-admin.ts
 */
async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!email) throw new Error("ADMIN_EMAIL is required");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters");

  const role = await prisma.role.findUnique({ where: { roleName: "admin" } });
  if (!role) throw new Error('Role "admin" is not seeded');

  const passwordHash = await hash(password, 12);
  const existing = await prisma.user.findFirst({ where: { email } });

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          roleId: role.id,
          passwordHash,
          accountStatus: "active",
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
          deletedAt: null,
        },
      })
    : await prisma.user.create({
        data: {
          roleId: role.id,
          email,
          passwordHash,
          firstName: "FurRescue",
          lastName: "Administrator",
          accountStatus: "active",
          emailVerifiedAt: new Date(),
        },
      });

  console.log(existing ? "UPDATED admin:" : "CREATED admin:", user.email);
}

main()
  .catch((error) => {
    console.error("FAILED:", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
