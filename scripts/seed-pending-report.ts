import "dotenv/config";
import { hash } from "bcryptjs";
import { prisma } from "../packages/core/src/index.ts";

/**
 * Seeds one realistic pending resident report for dashboard/report testing.
 * Idempotent: re-running returns the existing pending report instead of
 * creating duplicates.
 *
 * Run with: npx tsx scripts/seed-pending-report.ts
 */

const RESIDENT = {
  firstName: "Angela",
  middleName: "Mae",
  lastName: "Dela Cruz",
  email: "angela.delacruz@example.com",
  phoneNumber: "+639171234567",
  addressLine: "Purok 3, Brgy. Dahican, Mati City",
  barangayName: "Dahican",
  password: "Resident123!",
};

const REPORT = {
  reportType: "injured" as const,
  species: "dog" as const,
  urgencyLevel: "high" as const,
  animalCount: 1,
  latitude: 6.9421,
  longitude: 126.2537,
  locationLandmark:
    "Under the parked tricycle beside the sari-sari store, ~80 m from the Dahican barangay hall",
  description:
    "Brown aspin with a deep cut on its left hind leg was seen limping near the Dahican barangay hall. The wound looks infected and the dog is visibly thin. It stays under a parked tricycle beside the sari-sari store and is approachable when offered food. Residents say it has been there for three days.",
  photoUrl:
    "https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&q=80",
  submittedHoursAgo: 3,
};

async function main() {
  const communityRole = await prisma.role.findUnique({
    where: { roleName: "community_user" },
  });
  if (!communityRole) throw new Error('Role "community_user" is not seeded');

  const barangay = await prisma.barangay.findUnique({
    where: { name: RESIDENT.barangayName },
  });
  if (!barangay) throw new Error(`Barangay "${RESIDENT.barangayName}" is not seeded`);

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

  const existing = await prisma.report.findFirst({
    where: {
      reporterUserId: resident.id,
      status: "submitted",
      deletedAt: null,
    },
    orderBy: { submittedAt: "desc" },
  });

  if (existing) {
    console.log(`Pending report already exists for ${resident.email}: ${existing.reportCode}`);
    console.log(`  status: ${existing.status}`);
    console.log(`  submittedAt: ${existing.submittedAt.toISOString()}`);
    return;
  }

  const rows = await prisma.$queryRaw<Array<{ code: string }>>`
    SELECT 'RPT-' || to_char(now(), 'YYYY') || '-' ||
           lpad(nextval('report_code_seq')::text, 5, '0') AS code
  `;
  const reportCode = rows[0]?.code;
  if (!reportCode) throw new Error("Failed to generate report code");

  const submittedAt = new Date(Date.now() - REPORT.submittedHoursAgo * 60 * 60 * 1000);

  const report = await prisma.report.create({
    data: {
      reportCode,
      reporterUserId: resident.id,
      reportType: REPORT.reportType,
      species: REPORT.species,
      description: REPORT.description,
      urgencyLevel: REPORT.urgencyLevel,
      animalCount: REPORT.animalCount,
      latitude: REPORT.latitude,
      longitude: REPORT.longitude,
      barangayId: barangay.id,
      locationLandmark: REPORT.locationLandmark,
      status: "submitted",
      submittedAt,
      syncedAt: submittedAt,
      media: {
        create: {
          mediaType: "photo",
          fileUrl: REPORT.photoUrl,
          fileSizeKb: 184,
        },
      },
      statusHistory: {
        create: {
          newStatus: "submitted",
          changedAt: submittedAt,
          remarks: "Report submitted",
        },
      },
    },
    include: { media: true },
  });

  console.log("Seeded pending resident report:");
  console.log(`  code: ${report.reportCode}`);
  console.log(`  reporter: ${resident.firstName} ${resident.lastName} <${resident.email}>`);
  console.log(`  barangay: ${barangay.name}`);
  console.log(`  status: ${report.status}`);
  console.log(`  urgency: ${report.urgencyLevel}`);
  console.log(`  submittedAt: ${report.submittedAt.toISOString()}`);
  console.log(`  media: ${report.media.map((item) => item.fileUrl).join(", ")}`);
}

main()
  .catch((error) => {
    console.error("FAILED:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
