import "dotenv/config";
import { hash } from "bcryptjs";

import { animalsRepository, prisma } from "../packages/core/src/index.ts";

/**
 * Seeds five realistic community adoption posts authored by residents.
 *
 * Run with: npm run db:seed-community
 *
 * Idempotent: each post is keyed by its animal name plus author, so re-running
 * updates nothing and creates no duplicates.
 */

const RESIDENT_PASSWORD = "Resident123!";

const RESIDENTS = [
  {
    firstName: "Maria Angelica",
    middleName: "D.",
    lastName: "Dela Cruz",
    email: "angel.delacruz@furescue.demo",
    phoneNumber: "+639187654321",
    addressLine: "Purok 3, Brgy. Dahican, Mati City",
    barangayName: "Dahican",
  },
  {
    firstName: "Ronel",
    middleName: "B.",
    lastName: "Magbanua",
    email: "ronel.magbanua@furescue.demo",
    phoneNumber: "+639187654322",
    addressLine: "Purok 1, Brgy. Badas, Mati City",
    barangayName: "Badas",
  },
];

const POSTS = [
  {
    authorEmail: "angel.delacruz@furescue.demo",
    name: "Bantay",
    species: "dog" as const,
    breedType: "mixed" as const,
    sex: "male" as const,
    estimatedAgeMonths: 18,
    size: "medium" as const,
    colorMarkings: "Brown coat with a white chest and white paws",
    temperament: "Friendly, alert, and gentle with children",
    weightKg: 12.4,
    isNeutered: true,
    daysAgo: 2,
    photo:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80&auto=format&fit=crop",
    description:
      "Bantay showed up at our gate in Purok 3, Dahican about two months ago, thin and limping. We fed him, had him checked for a microchip, and he has since recovered completely. He now walks well on a leash, knows how to sit, and spends most of the day following us around the yard. We already have three dogs and cannot keep another, but he would do wonderfully with a family who has room for a calm, loyal companion.",
  },
  {
    authorEmail: "ronel.magbanua@furescue.demo",
    name: "Mingming",
    species: "cat" as const,
    breedType: "puspin" as const,
    sex: "female" as const,
    estimatedAgeMonths: 8,
    size: "small" as const,
    colorMarkings: "Gray tabby with a white chin and white socks",
    temperament: "Quiet, curious, and litter-trained",
    weightKg: 3.1,
    isNeutered: false,
    daysAgo: 5,
    photo:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&q=80&auto=format&fit=crop",
    description:
      "Mingming was the smallest kitten in a litter born behind our sari-sari store in Badas. She is now eight months old, fully weaned, and uses the litter box without accidents. She is shy for the first day or two, then becomes very affectionate and sleeps at the foot of the bed. Our landlord does not allow cats inside, so we are looking for a patient home where she can stay indoors and be part of the family.",
  },
  {
    authorEmail: "angel.delacruz@furescue.demo",
    name: "Choco",
    species: "dog" as const,
    breedType: "aspin" as const,
    sex: "male" as const,
    estimatedAgeMonths: 26,
    size: "medium" as const,
    colorMarkings: "Solid chocolate brown with a small white patch on the nose",
    temperament: "Playful, food-motivated, and good with other dogs",
    weightKg: 14.8,
    isNeutered: true,
    daysAgo: 8,
    photo:
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200&q=80&auto=format&fit=crop",
    description:
      "Choco belonged to a neighbor who moved to Davao City and could not bring him along. He has been with us for six weeks while we looked for his owner, but nobody came forward. He is house-trained, walks nicely beside you, and loves playing fetch with an old tennis ball. He is neutered and up to date on deworming. We are hoping to find him a home with a fenced yard and someone who enjoys daily walks.",
  },
  {
    authorEmail: "ronel.magbanua@furescue.demo",
    name: "Snow",
    species: "cat" as const,
    breedType: "mixed" as const,
    sex: "female" as const,
    estimatedAgeMonths: 14,
    size: "small" as const,
    colorMarkings: "All white with pale blue eyes",
    temperament: "Independent but affectionate in the evenings",
    weightKg: 3.9,
    isNeutered: true,
    daysAgo: 12,
    photo:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=1200&q=80&auto=format&fit=crop",
    description:
      "Snow was rescued from the roadside near the Badas bridge during a heavy rainstorm last year. She has been living indoors with us since then and is fully litter-trained and spayed. She is not a lap cat during the day, but every evening she curls up beside us on the sofa. We are moving to a smaller apartment in the city and cannot take her with us, so we want to meet adopters who will keep her indoors and give her time to settle in.",
  },
  {
    authorEmail: "angel.delacruz@furescue.demo",
    name: "Ligaya",
    species: "dog" as const,
    breedType: "aspin" as const,
    sex: "female" as const,
    estimatedAgeMonths: 10,
    size: "small" as const,
    colorMarkings: "Cream coat with light brown ears",
    temperament: "Bubbly, people-oriented, and learning basic commands",
    weightKg: 7.2,
    isNeutered: false,
    daysAgo: 18,
    photo:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&q=80&auto=format&fit=crop",
    description:
      "Ligaya was found wandering near the Dahican shoreline with a piece of rope around her neck. She is about ten months old, healthy, and full of energy. She already knows sit and come, sleeps through the night in her crate, and gets along with the children next door. She would thrive with an active family who can continue her training and take her on morning walks by the beach. She has not been spayed yet, and we are happy to coordinate with the City Vet for that.",
  },
];

async function main() {
  const communityRole = await prisma.role.findUnique({
    where: { roleName: "community_user" },
  });
  if (!communityRole) throw new Error('Role "community_user" is not seeded');

  const passwordHash = await hash(RESIDENT_PASSWORD, 12);
  const authors = new Map<string, { id: string; firstName: string; lastName: string }>();

  for (const resident of RESIDENTS) {
    const barangay =
      (await prisma.barangay.findUnique({
        where: { name: resident.barangayName },
      })) ?? (await prisma.barangay.findFirst({ orderBy: { name: "asc" } }));

    const user = await prisma.user.upsert({
      where: { email: resident.email },
      update: {
        roleId: communityRole.id,
        barangayId: barangay?.id,
        accountStatus: "active",
        deletedAt: null,
      },
      create: {
        roleId: communityRole.id,
        barangayId: barangay?.id,
        firstName: resident.firstName,
        middleName: resident.middleName,
        lastName: resident.lastName,
        email: resident.email,
        phoneNumber: resident.phoneNumber,
        addressLine: resident.addressLine,
        passwordHash,
        accountStatus: "active",
        emailVerifiedAt: new Date(),
      },
    });

    authors.set(resident.email, {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  }

  let created = 0;
  let skipped = 0;

  for (const post of POSTS) {
    const author = authors.get(post.authorEmail);
    if (!author) throw new Error(`Missing author for ${post.authorEmail}`);

    const existing = await prisma.animal.findFirst({
      where: {
        name: post.name,
        originType: "community_post",
        postedByUserId: author.id,
        deletedAt: null,
      },
    });

    if (existing) {
      skipped += 1;
      console.log(`  skipped ${existing.animalCode} (${post.name}) - already seeded`);
      continue;
    }

    const animalCode = await animalsRepository.nextAnimalCode();
    const createdAt = new Date(Date.now() - post.daysAgo * 24 * 60 * 60 * 1000);

    const animal = await prisma.animal.create({
      data: {
        animalCode,
        name: post.name,
        species: post.species,
        breedType: post.breedType,
        sex: post.sex,
        estimatedAgeMonths: post.estimatedAgeMonths,
        size: post.size,
        colorMarkings: post.colorMarkings,
        temperament: post.temperament,
        weightKg: post.weightKg,
        isNeutered: post.isNeutered,
        originType: "community_post",
        postedByUserId: author.id,
        lifecycleStatus: "available",
        listingStatus: "published",
        primaryPhotoUrl: post.photo,
        description: post.description,
        createdAt,
        media: {
          create: [
            {
              mediaType: "photo",
              fileUrl: post.photo,
              caption: `${post.name} waiting for a home`,
              sortOrder: 0,
              uploadedBy: author.id,
            },
          ],
        },
      },
    });

    created += 1;
    console.log(
      `  created ${animal.animalCode} - ${post.name} (${post.species}) by ${author.firstName} ${author.lastName}`,
    );
  }

  console.log("");
  console.log(`Community feed seeded: ${created} created, ${skipped} already present.`);
  console.log("Resident logins (password: Resident123!):");
  for (const resident of RESIDENTS) {
    console.log(`  ${resident.email}`);
  }
}

main()
  .catch((error) => {
    console.error("FAILED:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
