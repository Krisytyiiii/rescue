import { prisma } from "@furescue/core";

import { CommunityFeed, type CommunityAnimal } from "@/components/community-feed";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Community feed — FuRescue",
  description:
    "Residents of Mati City post animals looking for homes. Browse community adoption posts reviewed by our team.",
};

export const dynamic = "force-dynamic";

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
  if (months === null || months < 0) return "Age unknown";
  if (months < 1) return "Newborn";
  if (months < 12) return `${months} months old`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (rest === 0) return `${years} ${years === 1 ? "year" : "years"} old`;
  return `${years} yr ${rest} mo old`;
}

function postedDate(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(date);
}

async function getApprovedPosts(): Promise<{
  posts: CommunityAnimal[];
  total: number;
}> {
  const where = {
    deletedAt: null,
    originType: "community_post" as const,
    listingStatus: "published" as const,
  };

  const [rows, total] = await Promise.all([
    prisma.animal.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
        colorMarkings: true,
        temperament: true,
        description: true,
        primaryPhotoUrl: true,
        isNeutered: true,
        createdAt: true,
        media: {
          where: { mediaType: "photo" },
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { fileUrl: true },
        },
        vaccinations: { take: 1, select: { id: true } },
        postedBy: {
          select: {
            firstName: true,
            lastName: true,
            role: { select: { roleName: true } },
            barangay: { select: { name: true } },
          },
        },
      },
    }),
    prisma.animal.count({ where }),
  ]);

  const posts = rows.map((post): CommunityAnimal => {
    const name = post.name ?? post.animalCode;
    const weight = post.weightKg === null ? null : Number(post.weightKg);
    const size = post.size ? (sizeLabels[post.size] ?? post.size) : null;
    const sizeWithWeight =
      size && weight && Number.isFinite(weight)
        ? `${size} · ${weight} kg`
        : size;

    return {
      id: post.id,
      name,
      image: post.primaryPhotoUrl ?? post.media[0]?.fileUrl ?? null,
      animalCode: post.animalCode,
      speciesLabel: post.species === "dog" ? "Dog" : "Cat",
      breed: breedLabels[post.breedType] ?? post.breedType,
      age: ageLabel(post.estimatedAgeMonths),
      sex:
        post.sex === "male"
          ? "Male"
          : post.sex === "female"
            ? "Female"
            : "Sex unknown",
      size: sizeWithWeight,
      colorMarkings: post.colorMarkings,
      temperament: post.temperament,
      description: post.description,
      isNeutered: post.isNeutered,
      vaccinated: post.vaccinations.length > 0,
      barangay: post.postedBy?.barangay?.name ?? "Mati City",
      postedByName: post.postedBy
        ? `${post.postedBy.firstName} ${post.postedBy.lastName}`.trim()
        : "Community member",
      postedLabel: postedDate(post.createdAt),
      isResidentPost: post.postedBy?.role.roleName === "community_user",
    };
  });

  return { posts, total };
}

export default async function CommunityPage() {
  const { posts, total } = await getApprovedPosts();

  return (
    <div id="top" className="relative flex min-h-full flex-col">
      <SiteHeader />

      <main id="main" className="flex-1 px-5 pb-24 pt-32 sm:px-8 lg:px-12 lg:pt-40">
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-2xl">
            <p className="label text-clay">Community feed</p>
            <h1 className="mt-3 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.02] tracking-[-0.03em] text-ink">
              Pets looking for homes, posted by the people who know them.
            </h1>
            <p className="mt-5 text-[1rem] leading-[1.7] text-ink/55">
              Every post below has been reviewed and approved by our team. Read
              their stories, then reach out to arrange a meet-up.
            </p>
          </div>

          <CommunityFeed posts={posts} total={total} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
