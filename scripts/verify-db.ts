import "dotenv/config";
import { prisma } from "../packages/core/src/index.ts";

async function main() {
  const [users, roles, barangays] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.barangay.count(),
  ]);

  console.log(`Users: ${users}`);
  console.log(`Roles: ${roles}`);
  console.log(`Barangays: ${barangays}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
