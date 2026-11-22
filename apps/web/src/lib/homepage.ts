import { prisma } from "@furescue/core";

import type { HeroStat, Pet, RescuerProfile } from "@/lib/site";

const RESCUED_STATUSES = [
  "rescued",
  "under_care",
  "available",
  "adoption_pending",
  "adopted",
  "returned_to_owner",
] as const;

const breedLabels: Record<string, string> = {
  aspin: "Aspin",
  puspin: "Puspin",
  mixed: "Mixed breed",
  other: "Other",
};

const sizeLabels: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

function ageLabel(months: number | null) {
  if (months === null) return "Age unknown";
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest > 0
    ? `${years} ${years === 1 ? "year" : "years"} ${rest}mo`
    : `${years} ${years === 1 ? "year" : "years"}`;
}

function sizeLabel(size: string | null, weightKg: unknown) {
  const label = size ? (sizeLabels[size] ?? size) : "Size unknown";
  const weight = weightKg === null ? null : Number(weightKg);
  return weight && Number.isFinite(weight)
    ? `${label} · ${weight.toFixed(weight % 1 === 0 ? 0 : 1)} kg`
    : label;
}

function toPet(animal: {
  id: string;
  animalCode: string;
  name: string | null;
  species: "dog" | "cat";
  breedType: string;
  sex: string;
  estimatedAgeMonths: number | null;
  size: string | null;
  weightKg: unknown;
  temperament: string | null;
  description: string | null;
  primaryPhotoUrl: string | null;
  lifecycleStatus: string;
  isNeutered: boolean;
  media: { fileUrl: string }[];
  vaccinations: { id: string }[];
  postedBy: { barangay: { name: string } | null } | null;
  sourceReport: { barangay: { name: string } | null } | null;
}): Pet {
  const name = animal.name ?? animal.animalCode;
  const barangay =
    animal.sourceReport?.barangay?.name ??
    animal.postedBy?.barangay?.name ??
    "Mati City";

  const tags: string[] = [];
  if (animal.vaccinations.length > 0) tags.push("Vaccinated");
  if (animal.isNeutered) {
    tags.push(animal.sex === "female" ? "Spayed" : "Neutered");
  }

  return {
    id: animal.id,
    name,
    species: animal.species,
    breed: breedLabels[animal.breedType] ?? animal.breedType,
    age: ageLabel(animal.estimatedAgeMonths),
    sex:
      animal.sex === "male"
        ? "Male"
        : animal.sex === "female"
          ? "Female"
          : "Unknown",
    size: sizeLabel(animal.size, animal.weightKg),
    image: animal.primaryPhotoUrl ?? animal.media[0]?.fileUrl ?? null,
    alt: `Photo of ${name}`,
    status:
      animal.lifecycleStatus === "adoption_pending"
        ? "Reserved"
        : "Ready for adoption",
    tags,
    note: animal.temperament ?? "Our team is still getting to know them.",
    story:
      animal.description ??
      "This animal is in our care and looking for a home. Contact our team to arrange a visit.",
    barangay,
  };
}

/** Public homepage data, sourced directly from the database. */
export async function getHomepageData() {
  const [
    rescued,
    adopted,
    available,
    spayNeuter,
    healthRecords,
    completedAdoptions,
    reports,
    animals,
    latestUpdate,
    rescuers,
  ] = await Promise.all([
    prisma.animal.count({
      where: { deletedAt: null, lifecycleStatus: { in: [...RESCUED_STATUSES] } },
    }),
    prisma.animal.count({
      where: { deletedAt: null, lifecycleStatus: "adopted" },
    }),
    prisma.animal.count({
      where: {
        deletedAt: null,
        lifecycleStatus: "available",
        listingStatus: "published",
      },
    }),
    prisma.healthRecord.count({
      where: { recordType: "spay_neuter", animal: { deletedAt: null } },
    }),
    prisma.healthRecord.count({
      where: { animal: { deletedAt: null } },
    }),
    prisma.adoptionRequest.count({
      where: { status: "completed", deletedAt: null },
    }),
    prisma.report.count({
      where: { deletedAt: null, status: { notIn: ["rejected"] } },
    }),
    prisma.animal.findMany({
      where: {
        deletedAt: null,
        listingStatus: "published",
        lifecycleStatus: {
          notIn: ["adopted", "returned_to_owner", "deceased"],
        },
      },
      orderBy: [{ intakeDate: "desc" }, { createdAt: "desc" }],
      take: 6,
      select: {
        id: true,
        animalCode: true,
        name: true,
        species: true,
        breedType: true,
        sex: true,
        estimatedAgeMonths: true,
        size: true,
        weightKg: true,
        temperament: true,
        description: true,
        primaryPhotoUrl: true,
        lifecycleStatus: true,
        isNeutered: true,
        media: {
          where: { mediaType: "photo" },
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { fileUrl: true },
        },
        vaccinations: { take: 1, select: { id: true } },
        postedBy: {
          select: { barangay: { select: { name: true } } },
        },
        sourceReport: {
          select: { barangay: { select: { name: true } } },
        },
      },
    }),
    prisma.animal.findFirst({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.user.findMany({
      where: {
        deletedAt: null,
        accountStatus: "active",
        role: { roleName: "rescuer" },
      },
      orderBy: [{ createdAt: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        profilePhotoUrl: true,
        createdAt: true,
        barangay: { select: { name: true } },
        rescueAssignments: {
          where: { assignmentStatus: "completed" },
          select: { id: true },
        },
      },
    }),
  ]);

  const heroStats: HeroStat[] = [
    { value: rescued, label: "Animals rescued", suffix: "" },
    { value: adopted, label: "Found families", suffix: "" },
    { value: available, label: "Ready now", suffix: "" },
  ];

  const rescuerProfiles: RescuerProfile[] = rescuers.map((rescuer) => ({
    id: rescuer.id,
    name: [rescuer.firstName, rescuer.middleName, rescuer.lastName]
      .filter(Boolean)
      .join(" "),
    photo: rescuer.profilePhotoUrl,
    barangay: rescuer.barangay?.name ?? "Mati City",
    rescues: rescuer.rescueAssignments.length,
    memberSince: new Intl.DateTimeFormat("en-PH", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Manila",
    }).format(rescuer.createdAt),
  }));

  return {
    heroStats,
    homesFound: adopted,
    rescuers: rescuerProfiles,
    missionStats: [
      { value: rescued, label: "Animals rescued", note: "all time" },
      {
        value: spayNeuter,
        label: "Spay & neuter",
        note: "free community clinics",
      },
      {
        value: completedAdoptions,
        label: "Adoptions completed",
        note: "reviewed by our team",
      },
    ],
    processDetails: [
      `${reports.toLocaleString("en-US")} rescue reports logged`,
      `${healthRecords.toLocaleString("en-US")} care records logged`,
      `${completedAdoptions.toLocaleString("en-US")} adoptions completed`,
    ],
    pets: animals.map(toPet),
    lastUpdated: latestUpdate?.updatedAt ?? null,
  };
}
