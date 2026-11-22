import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { prisma } from "@furescue/core";

import { AdminLiveRefresh } from "@/components/admin/admin-live-refresh";
import { formatAge, formatDate } from "@/components/admin/animals/animals-utils";
import {
  CommunityConsole,
  type CommunityPost,
} from "@/components/admin/community/community-console";
import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Community feed — FuRescue admin",
  robots: { index: false, follow: false },
};

const BREED_LABELS: Record<string, string> = {
  aspin: "Aspin",
  puspin: "Puspin",
  mixed: "Mixed breed",
  other: "Other",
};

const SIZE_LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

function sexLabel(sex: string) {
  if (sex === "male") return "Male";
  if (sex === "female") return "Female";
  return "Sex unknown";
}

export default async function AdminCommunityPage() {
  const session = await readSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  const rows = await prisma.animal.findMany({
    where: { deletedAt: null, originType: "community_post" },
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
      colorMarkings: true,
      temperament: true,
      description: true,
      primaryPhotoUrl: true,
      isNeutered: true,
      listingStatus: true,
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
          barangay: { select: { name: true } },
        },
      },
    },
  });

  const posts: CommunityPost[] = rows.map((post) => ({
    id: post.id,
    animalCode: post.animalCode,
    name: post.name ?? post.animalCode,
    image: post.primaryPhotoUrl ?? post.media[0]?.fileUrl ?? null,
    species: post.species === "dog" ? "Dog" : "Cat",
    breed: BREED_LABELS[post.breedType] ?? post.breedType,
    age: formatAge(post.estimatedAgeMonths),
    sex: sexLabel(post.sex),
    size: post.size ? (SIZE_LABELS[post.size] ?? post.size) : null,
    colorMarkings: post.colorMarkings,
    temperament: post.temperament,
    description: post.description,
    isNeutered: post.isNeutered,
    vaccinated: post.vaccinations.length > 0,
    barangay: post.postedBy?.barangay?.name ?? "Mati City",
    postedByName: post.postedBy
      ? `${post.postedBy.firstName} ${post.postedBy.lastName}`.trim()
      : "Community member",
    postedLabel: formatDate(post.createdAt.toISOString()),
    listingStatus: post.listingStatus,
  }));

  const pendingCount = posts.filter(
    (post) => post.listingStatus === "pending_review",
  ).length;

  return (
    <div className="w-full min-w-0">
      <AdminLiveRefresh />

      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(1.9rem,4.5vw,2.6rem)] leading-[1.04] tracking-[-0.03em] text-ink">
            Community feed
          </h1>
          <p className="mt-2 max-w-[68ch] text-[0.9375rem] leading-[1.65] text-ink/55">
            Review adoption posts submitted by residents, then publish or hide them
            from the public feed. The panel on the right shows what residents see.
          </p>
        </div>

        <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-[0.75rem] font-medium text-ink/60">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c99a4e]" />
          {pendingCount} {pendingCount === 1 ? "post" : "posts"} awaiting review
        </span>
      </div>

      <CommunityConsole initialPosts={posts} />
    </div>
  );
}
