import { hash } from "bcryptjs";

import { prisma } from "../packages/core/src/db/prisma.ts";

/**
 * Removes an account while preserving related rescue records.
 *
 * Hard-deleting a user is blocked by `rescue_operations.rescuer_user_id` and
 * would destroy rescue history. Instead we tombstone the account: it can no
 * longer sign in, its email/phone are released, and the original email is free
 * to register again.
 *
 * Usage: npx tsx scripts/delete-user.ts <email>
 */
async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  if (!email) {
    console.error("Usage: npx tsx scripts/delete-user.ts <email>");
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    console.log(`No account found for ${email}`);
    return;
  }

  const passwordHash = await hash(`deleted-${user.id}-${Date.now()}`, 10);
  const tombstone = `deleted+${user.id}@furescue.invalid`;

  await prisma.$transaction([
    prisma.emailVerification.deleteMany({ where: { userId: user.id } }),
    prisma.passwordReset.deleteMany({ where: { userId: user.id } }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        email: tombstone,
        phoneNumber: null,
        passwordHash,
        accountStatus: "deactivated",
        deletedAt: new Date(),
      },
    }),
  ]);

  console.log(`Deleted account ${email}; the address is free to register again.`);
}

main()
  .catch((error) => {
    console.error("Delete failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
