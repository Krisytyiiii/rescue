import "dotenv/config";
import { prisma } from "../packages/core/src/index.ts";

/**
 * Seeds one demo notification per domain (adoption application, report case,
 * rescuer assignment) for the first admin, so /admin/notifications shows the
 * full range while reviewing locally.
 *
 * Idempotent: rows are matched by title and reused.
 * Run with: npm run db:seed-notifications
 */

async function main() {
const adminRole = await prisma.role.findFirst({ where: { roleName: "admin" } });
if (!adminRole) throw new Error("No admin role found");

const admin = await prisma.user.findFirst({
  where: { roleId: adminRole.id, deletedAt: null },
  select: { id: true },
});
if (!admin) throw new Error("No admin user found");

const [adoption, report, rescuer] = await Promise.all([
  prisma.adoptionRequest.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      animal: { select: { animalCode: true, name: true } },
      adopter: { select: { firstName: true, lastName: true } },
    },
  }),
  prisma.report.findFirst({
    orderBy: { submittedAt: "desc" },
    include: {
      barangay: { select: { name: true } },
      reporter: { select: { firstName: true, lastName: true } },
    },
  }),
  prisma.user.findFirst({
    where: { role: { roleName: "rescuer" }, deletedAt: null },
    select: { firstName: true, lastName: true },
  }),
]);

const SEEDS = [
  adoption
    ? {
        title: "New adoption application",
        body: `${adoption.requestCode} · ${adoption.adopter.firstName} ${adoption.adopter.lastName} applied for ${adoption.animal.animalCode}${adoption.animal.name ? ` (${adoption.animal.name})` : ""}`,
        notificationType: "adoption_status" as const,
        referenceType: "adoption_request",
        referenceId: adoption.id,
      }
    : null,
  report
    ? {
        title: "New report case",
        body: `${report.reportCode} · ${report.barangay?.name ?? "Unknown barangay"} · ${
          report.reporter
            ? `${report.reporter.firstName} ${report.reporter.lastName}`
            : "Anonymous"
        }: ${report.description}`.slice(0, 255),
        notificationType: "report_status" as const,
        referenceType: "report",
        referenceId: report.id,
      }
    : null,
  rescuer && report
    ? {
        title: "New rescue assignment",
        body: `${report.reportCode}: assigned to ${rescuer.firstName} ${rescuer.lastName}.`,
        notificationType: "rescue_assignment" as const,
        referenceType: "report",
        referenceId: report.id,
      }
    : null,
].filter((seed): seed is NonNullable<typeof seed> => seed !== null);

for (const seed of SEEDS) {
  const existing = await prisma.notification.findFirst({
    where: { recipientUserId: admin.id, title: seed.title },
    select: { id: true },
  });
  if (existing) {
    console.log(`skip ${seed.title}`);
    continue;
  }
  await prisma.notification.create({
    data: {
      recipientUserId: admin.id,
      notificationType: seed.notificationType,
      title: seed.title,
      body: seed.body,
      referenceType: seed.referenceType,
      referenceId: seed.referenceId,
      channel: "in_app",
    },
  });
  console.log(`created ${seed.title}`);
}

console.log(`Seeded notifications for admin ${admin.id}`);
await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
