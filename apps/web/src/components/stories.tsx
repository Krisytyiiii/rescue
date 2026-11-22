import { prisma } from "@furescue/core";
import { ArrowUpRight, PawPrint } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/ui/reveal";

const breedLabels: Record<string, string> = {
  aspin: "Aspin",
  puspin: "Puspin",
  mixed: "Mixed breed",
  other: "Other",
};

function monthYear(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(date);
}

/**
 * The latest community adoption posts that an administrator has approved for
 * the public feed. Only published listings are shown, newest first.
 */
async function getFieldNotes() {
  const where = {
    deletedAt: null,
    originType: "community_post" as const,
    listingStatus: "published" as const,
  };

  const [posts, total] = await Promise.all([
    prisma.animal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        animalCode: true,
        name: true,
        breedType: true,
        description: true,
        primaryPhotoUrl: true,
        createdAt: true,
        media: {
          where: { mediaType: "photo" },
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { fileUrl: true },
        },
        postedBy: {
          select: {
            firstName: true,
            lastName: true,
            barangay: { select: { name: true } },
          },
        },
      },
    }),
    prisma.animal.count({ where }),
  ]);

  return { posts, total };
}

export async function Stories() {
  const { posts, total } = await getFieldNotes();

  return (
    <section id="stories" className="relative py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <div className="flex items-center justify-between border-b border-ink/15 pb-5">
            <span className="label text-ink/55">(05) - Field notes</span>
            <span className="label text-ink/35">Reviewed by our team</span>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <h2 className="max-w-[16ch] text-balance font-display text-[clamp(2.6rem,5.2vw,4.9rem)] leading-[0.98] tracking-[-0.032em]">
              Small rescues.{" "}
              <span className="font-display-italic text-clay">
                Long stories.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-4 lg:col-start-9">
            <p className="max-w-[38ch] text-pretty text-[1.0625rem] leading-[1.7] text-ink/65">
              The latest adoption posts from the community, approved by our team
              and waiting for the right family.
            </p>
          </Reveal>
        </div>

        {posts.length > 0 ? (
          <div className="mt-14 grid gap-x-6 gap-y-14 lg:grid-cols-12 lg:gap-y-0">
            {posts.map((post, index) => {
              const name = post.name ?? post.animalCode;
              const barangay = post.postedBy?.barangay?.name ?? "Mati City";
              const image = post.primaryPhotoUrl ?? post.media[0]?.fileUrl ?? null;

              return (
                <Reveal
                  key={post.id}
                  delay={index * 0.06}
                  className={
                    index === 0
                      ? "lg:col-span-4"
                      : index === 1
                        ? "lg:col-span-4 lg:mt-12"
                        : "lg:col-span-4 lg:mt-24"
                  }
                >
                  <article className="group">
                    <div
                      className={`relative overflow-hidden bg-sand ${
                        index === 1 ? "aspect-square" : "aspect-[4/5]"
                      }`}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={`Photo of ${name}`}
                          className="h-full w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.035]"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-ink/20">
                          <PawPrint className="h-10 w-10" strokeWidth={1.4} />
                          <span className="sr-only">No photo attached</span>
                        </span>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-paper/92 px-3 py-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-ink/70 backdrop-blur-sm">
                        Approved · {monthYear(post.createdAt)}
                      </span>
                    </div>

                    <h3 className="mt-5 max-w-[24ch] text-pretty font-display text-[1.55rem] leading-[1.12] tracking-[-0.015em] sm:text-[1.7rem]">
                      {name} is looking for a home.
                    </h3>
                    <p className="mt-3 max-w-[40ch] text-[0.875rem] leading-[1.7] text-ink/55">
                      {post.description ??
                        `Posted by a neighbour in ${barangay}. Open the community feed to meet ${name}.`}
                    </p>
                    <p className="label mt-4 text-[0.5rem] text-ink/35">
                      {name} · {breedLabels[post.breedType] ?? post.breedType} ·{" "}
                      {barangay}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <Reveal delay={0.08}>
            <div className="mt-14 border border-dashed border-ink/20 px-6 py-14 text-center">
              <p className="font-display text-[1.5rem] tracking-[-0.02em]">
                No approved adoption posts yet.
              </p>
              <p className="mx-auto mt-2 max-w-[40ch] text-[0.875rem] leading-relaxed text-ink/55">
                New community posts appear here once our team has reviewed
                them.
              </p>
            </div>
          </Reveal>
        )}

        <div className="mt-24 border-t border-ink/15 pt-5 lg:mt-32">
          <Reveal>
            <div className="flex items-center justify-between">
              <span className="label text-ink/55">
                (06) - From the community
              </span>
              <span className="label text-ink/35">
                {total} approved {total === 1 ? "post" : "posts"}
              </span>
            </div>
          </Reveal>

          <div className="mt-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <p className="max-w-[52ch] text-[0.9375rem] leading-relaxed text-ink/55">
              Every community post is reviewed by our team before it appears on
              the board. Read the full stories and meet the animals in person.
            </p>
            <Link
              href="/community"
              className="group inline-flex items-center gap-2 text-[0.875rem] font-medium"
            >
              Open the community feed
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45"
                strokeWidth={1.7}
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
