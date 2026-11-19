import "dotenv/config";
import { prisma } from "../packages/core/src/index.ts";

/**
 * Seeds a few realistic in-app conversations between a community member, a
 * rescuer, and an admin so /admin/messaging can be reviewed locally.
 *
 * Idempotent: conversations are matched by subject and reused.
 * Run with: npm run db:seed-messaging
 */

const SEEDS = [
  {
    subject: "Missing document for the home visit",
    contextType: "adoption_request" as const,
    messages: [
      { from: "community", body: "Hi! I submitted my application but I think my home photo did not upload. Can I send it here?" },
      { from: "admin", body: "Hello! Yes, please attach the photo here or upload it again from your application page. We'll review it before the interview." },
      { from: "community", body: "Thank you! I'll send it tonight after work." },
    ],
  },
  {
    subject: "Rescue ETA — Dahican shoreline",
    contextType: "report" as const,
    messages: [
      { from: "admin", body: "Hi team, the reporter says the dog is near the shoreline path behind the barangay hall. Can you confirm your ETA?" },
      { from: "rescuer", body: "We're 10 minutes away. Bringing a catch pole and a blanket." },
      { from: "community", body: "I can stay here and guide you to the exact spot. The dog is limping but friendly." },
      { from: "admin", body: "Perfect, thank you both. Keep the thread updated once the dog is secured." },
    ],
  },
  {
    subject: "Question about the adoption process",
    contextType: "general" as const,
    messages: [
      { from: "community", body: "Good day! How long does the interview usually take, and what should I bring?" },
      { from: "admin", body: "The meet-and-greet takes about 30 minutes at the City Vet Building. Bring a valid ID and, if you have other pets, their vaccination records." },
    ],
  },
];

async function main() {
  const [admin, rescuer, community] = await Promise.all([
    prisma.user.findFirst({
      where: { role: { roleName: "admin" }, accountStatus: "active", deletedAt: null },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findFirst({
      where: { role: { roleName: "rescuer" }, accountStatus: "active", deletedAt: null },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findFirst({
      where: {
        role: { roleName: "community_user" },
        accountStatus: "active",
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!admin) throw new Error("No active admin account found");
  if (!community) throw new Error("No active community account found");

  const [report, adoption] = await Promise.all([
    prisma.report.findFirst({
      where: { deletedAt: null },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.adoptionRequest.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const people = { admin, rescuer, community } as const;

  for (const seed of SEEDS) {
    const existing = await prisma.conversation.findFirst({
      where: { subject: seed.subject },
    });
    if (existing) {
      console.log(`exists   ${seed.subject}`);
      continue;
    }

    const participantIds = new Set<string>([admin.id, community.id]);
    if (seed.contextType === "report" && rescuer) participantIds.add(rescuer.id);

    const contextId =
      seed.contextType === "adoption_request"
        ? adoption?.id
        : seed.contextType === "report"
          ? report?.id
          : null;

    const conversation = await prisma.conversation.create({
      data: {
        contextType: seed.contextType,
        contextId: contextId ?? null,
        subject: seed.subject,
        status: "open",
        participants: {
          create: [...participantIds].map((userId) => ({ userId })),
        },
      },
    });

    const base = Date.now() - seed.messages.length * 45 * 60_000;
    await Promise.all(
      seed.messages.map((message, index) => {
        const sender = people[message.from as keyof typeof people];
        if (!sender) return Promise.resolve();
        return prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderUserId: sender.id,
            messageBody: message.body,
            sentAt: new Date(base + index * 45 * 60_000),
          },
        });
      }),
    );

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    console.log(`created  ${seed.subject}`);
  }

  // Seed the notification log so the Notifications view has content to review.
  const existingConversationNotifications = await prisma.notification.count({
    where: { referenceType: "conversation" },
  });
  if (existingConversationNotifications === 0) {
    const seeded = await prisma.conversation.findMany({
      where: { subject: { in: SEEDS.map((seed) => seed.subject) } },
      include: { participants: true },
    });
    const rows = seeded.flatMap((conversation, index) =>
      conversation.participants
        .filter((participant) => participant.userId !== admin.id)
        .map((participant) => ({
          recipientUserId: participant.userId,
          notificationType: "new_message" as const,
          title: "New message from FuRescue",
          body: `New activity in “${conversation.subject ?? "your conversation"}”.`,
          referenceType: "conversation",
          referenceId: conversation.id,
          isRead: index === 0,
          readAt: index === 0 ? new Date() : null,
          sentAt: new Date(Date.now() - (index + 1) * 30 * 60_000),
        })),
    );
    await prisma.notification.createMany({ data: rows });
    console.log(`created  ${rows.length} notifications`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
