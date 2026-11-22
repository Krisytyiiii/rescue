import { prisma } from "../packages/core/src/db/prisma.ts";

/**
 * Development helper: clear verification state for one email so the signup
 * flow can be retried from scratch.
 *
 * Usage: npx tsx scripts/reset-email-verification.ts you@example.com
 */
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npx tsx scripts/reset-email-verification.ts <email>");
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    console.error(`No account found for ${email}`);
    process.exitCode = 1;
    return;
  }

  await prisma.$transaction([
    prisma.emailVerification.deleteMany({ where: { userId: user.id } }),
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: null },
    }),
  ]);

  console.log(`Reset verification for ${email}. You can sign up again.`);
}

main().finally(() => prisma.$disconnect());
