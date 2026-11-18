import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../packages/core/src/generated/prisma/client.ts";

/**
 * Seeds reference data only (roles + Mati City barangays). Idempotent.
 * Run with: npm run db:seed
 */
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ROLES = [
  {
    roleName: "community_user" as const,
    description: "Residents who report animals, adopt, and submit adoption posts",
  },
  {
    roleName: "rescuer" as const,
    description: "Field staff and partner volunteers handling assigned cases",
  },
  {
    roleName: "admin" as const,
    description: "City Vet / animal welfare office with full system access",
  },
];

/** Official barangays of Mati City, Davao Oriental (26). */
const BARANGAYS = [
  "Badas",
  "Bobon",
  "Buso",
  "Cabuaya",
  "Central (City Proper)",
  "Culian",
  "Dahican",
  "Danao",
  "Dawan",
  "Don Enrique Lopez",
  "Don Martin Marundan",
  "Don Salvador Lopez, Sr.",
  "Langka",
  "Lawigan",
  "Libudon",
  "Luban",
  "Macambol",
  "Mamali",
  "Matiao",
  "Mayo",
  "Sainz",
  "Sanghay",
  "Tagabakid",
  "Tagbinonga",
  "Taguibo",
  "Tamisan",
];

async function main() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { roleName: role.roleName },
      update: { description: role.description },
      create: role,
    });
  }

  for (const name of BARANGAYS) {
    await prisma.barangay.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const [roles, barangays] = await Promise.all([
    prisma.role.count(),
    prisma.barangay.count(),
  ]);
  console.log(`Seed complete: ${roles} roles, ${barangays} barangays.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
