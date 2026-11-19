import "dotenv/config";
import { hash } from "bcryptjs";
import { prisma } from "../packages/core/src/index.ts";

/**
 * Seeds one realistic adoption application from a resident on an animal that is
 * currently open for adoption. Idempotent: re-running returns the existing
 * open application instead of creating duplicates.
 *
 * Run with: npx tsx scripts/seed-adoption-application.ts
 */

const RESIDENT = {
  firstName: "Jose Miguel",
  middleName: "Ramos",
  lastName: "Bautista",
  email: "josemiguel.bautista@example.com",
  phoneNumber: "+639184562317",
  addressLine: "Purok 5, Brgy. Dahican, Mati City, Davao Oriental",
  barangayName: "Dahican",
  password: "Resident123!",
};

const APPLICATION = {
  housingType: "house" as const,
  isOwnedProperty: true,
  hasFencedArea: true,
  householdMembers: 4,
  hasOtherPets: true,
  otherPetsDetails:
    "One 3-year-old male aspin named Totoy, neutered and up to date with vaccinations. He is friendly with other dogs and sleeps inside the house.",
  priorPetExperience:
    "I grew up with dogs at home and have cared for Totoy for the past three years, including his vaccinations and regular check-ups at the city vet.",
  reasonForAdopting:
    "Our family has been looking for a companion for Totoy and for my two children, ages 8 and 11. We have a fenced yard, someone is home during the day, and we can commit to feeding, walking, and vet visits. We would love to give a rescue dog a permanent home.",
  validIdUrl:
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
  homePhotoUrl:
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
  submittedDaysAgo: 2,
};

async function main() {
  const communityRole = await prisma.role.findUnique({
    where: { roleName: "community_user" },
  });
  if (!communityRole) throw new Error('Role "community_user" is not seeded');

  const barangay =
    (await prisma.barangay.findUnique({ where: { name: RESIDENT.barangayName } })) ??
    (await prisma.barangay.findFirst({ orderBy: { name: "asc" } }));
  if (!barangay) throw new Error("No barangay is seeded");

  const passwordHash = await hash(RESIDENT.password, 12);
  const resident = await prisma.user.upsert({
    where: { email: RESIDENT.email },
    update: {
      roleId: communityRole.id,
      barangayId: barangay.id,
      accountStatus: "active",
      deletedAt: null,
    },
    create: {
      roleId: communityRole.id,
      barangayId: barangay.id,
      firstName: RESIDENT.firstName,
      middleName: RESIDENT.middleName,
      lastName: RESIDENT.lastName,
      email: RESIDENT.email,
      phoneNumber: RESIDENT.phoneNumber,
      addressLine: RESIDENT.addressLine,
      passwordHash,
      accountStatus: "active",
      emailVerifiedAt: new Date(),
    },
  });

  const existing = await prisma.adoptionRequest.findFirst({
    where: {
      adopterUserId: resident.id,
      deletedAt: null,
      status: {
        in: ["submitted", "under_review", "interview_scheduled", "approved"],
      },
    },
    include: { animal: true },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    console.log(`Open application already exists for ${resident.email}: ${existing.requestCode}`);
    console.log(`  animal: ${existing.animal.animalCode}${existing.animal.name ? ` (${existing.animal.name})` : ""}`);
    console.log(`  status: ${existing.status}`);
    console.log(`  createdAt: ${existing.createdAt.toISOString()}`);
    return;
  }

  const animal = await prisma.animal.findFirst({
    where: {
      deletedAt: null,
      lifecycleStatus: { in: ["available", "adoption_pending"] },
      listingStatus: "published",
    },
    orderBy: { createdAt: "desc" },
  });
  if (!animal) {
    throw new Error(
      "No published animal is open for adoption. Mark an animal ready for adoption first.",
    );
  }

  const rows = await prisma.$queryRaw<Array<{ code: string }>>`
    SELECT 'ADO-' || to_char(now(), 'YYYY') || '-' ||
           lpad(nextval('adoption_request_code_seq')::text, 5, '0') AS code
  `;
  const requestCode = rows[0]?.code;
  if (!requestCode) throw new Error("Failed to generate adoption request code");

  const createdAt = new Date(
    Date.now() - APPLICATION.submittedDaysAgo * 24 * 60 * 60 * 1000,
  );

  const request = await prisma.adoptionRequest.create({
    data: {
      requestCode,
      animalId: animal.id,
      adopterUserId: resident.id,
      housingType: APPLICATION.housingType,
      isOwnedProperty: APPLICATION.isOwnedProperty,
      hasFencedArea: APPLICATION.hasFencedArea,
      householdMembers: APPLICATION.householdMembers,
      hasOtherPets: APPLICATION.hasOtherPets,
      otherPetsDetails: APPLICATION.otherPetsDetails,
      priorPetExperience: APPLICATION.priorPetExperience,
      reasonForAdopting: APPLICATION.reasonForAdopting,
      validIdUrl: APPLICATION.validIdUrl,
      homePhotoUrl: APPLICATION.homePhotoUrl,
      status: "submitted",
      createdAt,
    },
    include: { animal: true },
  });

  console.log("Seeded adoption application:");
  console.log(`  code: ${request.requestCode}`);
  console.log(`  animal: ${request.animal.animalCode}${request.animal.name ? ` (${request.animal.name})` : ""}`);
  console.log(`  adopter: ${resident.firstName} ${resident.lastName} <${resident.email}>`);
  console.log(`  barangay: ${barangay.name}`);
  console.log(`  status: ${request.status}`);
  console.log(`  createdAt: ${request.createdAt.toISOString()}`);
}

main()
  .catch((error) => {
    console.error("FAILED:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
