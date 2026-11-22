"use client";

/* eslint-disable @next/next/no-img-element */
import {
  Archive,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  Compass,
  Eye,
  EyeOff,
  Globe2,
  Home,
  LayoutGrid,
  MapPin,
  MessageSquare,
  PawPrint,
  Plus,
  ShieldAlert,
  User,
  UserRound,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { OverlayCard } from "@/components/ui/overlay-card";
import { SearchEmpty } from "@/components/ui/search-empty";
import { SearchInput } from "@/components/ui/search-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatCard } from "@/components/ui/stat-card";
import { TabFilters } from "@/components/ui/tab-filters";
import { useToast } from "@/components/ui/toast";

export interface CommunityPost {
  id: string;
  animalCode: string;
  name: string;
  image: string | null;
  species: string;
  breed: string;
  age: string;
  sex: string;
  size: string | null;
  colorMarkings: string | null;
  temperament: string | null;
  description: string | null;
  isNeutered: boolean;
  vaccinated: boolean;
  barangay: string;
  postedByName: string;
  postedLabel: string;
  listingStatus: string;
}

type FilterId = "all" | "pending" | "published" | "rejected" | "archived";
type ActionKind = "publish" | "reject" | "hide";

const STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  pending_review: { label: "Awaiting review", tone: "pending" },
  published: { label: "Live", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  archived: { label: "Hidden", tone: "neutral" },
  draft: { label: "Draft", tone: "neutral" },
};

const ACTION_META: Record<
  ActionKind,
  {
    title: string;
    description: string;
    confirmLabel: string;
    tone: "danger" | "success";
    status: "published" | "rejected" | "archived";
    success: string;
    successBody: string;
  }
> = {
  publish: {
    title: "Publish this post?",
    description: "It will appear in the public community feed right away.",
    confirmLabel: "Publish post",
    tone: "success",
    status: "published",
    success: "Post published",
    successBody: "Residents can now see it in the community feed.",
  },
  reject: {
    title: "Reject this post?",
    description:
      "The resident is notified and can correct the post. Add a short reason for them.",
    confirmLabel: "Reject post",
    tone: "danger",
    status: "rejected",
    success: "Post rejected",
    successBody: "The resident can see your reason.",
  },
  hide: {
    title: "Hide this post?",
    description:
      "It disappears from the public feed immediately. You can restore it later.",
    confirmLabel: "Hide post",
    tone: "danger",
    status: "archived",
    success: "Post hidden",
    successBody: "It no longer appears in the community feed.",
  },
};

function statusOf(post: CommunityPost) {
  return STATUS_META[post.listingStatus] ?? {
    label: post.listingStatus.replaceAll("_", " "),
    tone: "neutral" as BadgeTone,
  };
}

function matches(post: CommunityPost, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    post.name,
    post.animalCode,
    post.breed,
    post.species,
    post.barangay,
    post.postedByName,
    post.description,
    post.temperament,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export function CommunityConsole({ initialPosts }: { initialPosts: CommunityPost[] }) {
  const router = useRouter();
  const toast = useToast();
  const [posts, setPosts] = useState(initialPosts);
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ post: CommunityPost; kind: ActionKind } | null>(
    null,
  );
  const [remarks, setRemarks] = useState("");

  // Fresh server data replaces optimistic local state.
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const counts = useMemo(() => {
    const base = { all: posts.length, pending: 0, published: 0, rejected: 0, archived: 0 };
    for (const post of posts) {
      if (post.listingStatus === "pending_review") base.pending += 1;
      else if (post.listingStatus === "published") base.published += 1;
      else if (post.listingStatus === "rejected") base.rejected += 1;
      else if (post.listingStatus === "archived") base.archived += 1;
    }
    return base;
  }, [posts]);

  const filtered = useMemo(() => {
    const rank: Record<string, number> = {
      pending_review: 0,
      published: 1,
      rejected: 2,
      archived: 3,
    };
    return posts
      .filter((post) => {
        if (!matches(post, query)) return false;
        if (filter === "pending") return post.listingStatus === "pending_review";
        if (filter === "published") return post.listingStatus === "published";
        if (filter === "rejected") return post.listingStatus === "rejected";
        if (filter === "archived") return post.listingStatus === "archived";
        return true;
      })
      .sort(
        (a, b) =>
          (rank[a.listingStatus] ?? 4) - (rank[b.listingStatus] ?? 4),
      );
  }, [posts, filter, query]);

  const livePosts = useMemo(
    () => posts.filter((post) => post.listingStatus === "published"),
    [posts],
  );

  const selected = posts.find((post) => post.id === selectedId) ?? null;
  const selectedMeta = selected ? statusOf(selected) : null;

  function openAction(post: CommunityPost, kind: ActionKind) {
    setSelectedId(null);
    setRemarks("");
    setPending({ post, kind });
  }

  function confirmAction() {
    if (!pending) return;
    const { post, kind } = pending;
    const meta = ACTION_META[kind];
    const previous = post.listingStatus;

    // Close and update the UI before the request starts.
    setPending(null);
    setPosts((current) =>
      current.map((item) =>
        item.id === post.id ? { ...item, listingStatus: meta.status } : item,
      ),
    );

    void (async () => {
      try {
        const response = await fetch(`/api/admin/animals/${post.id}/listing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingStatus: meta.status,
            ...(kind === "reject" ? { remarks: remarks.trim() } : {}),
          }),
        });
        const json = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(json?.error?.message ?? "The request could not be completed");
        }
        toast.success(meta.success, { description: meta.successBody });
        router.refresh();
      } catch (error) {
        setPosts((current) =>
          current.map((item) =>
            item.id === post.id ? { ...item, listingStatus: previous } : item,
          ),
        );
        toast.error("Could not update the post", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
      }
    })();
  }

  const requiresReason = pending?.kind === "reject";
  const confirmDisabled = Boolean(requiresReason) && remarks.trim().length === 0;

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Awaiting review"
          value={counts.pending}
          hint="Resident posts in the queue"
          icon={ShieldAlert}
          tone="amber"
        />
        <StatCard
          label="Live in feed"
          value={counts.published}
          hint="Visible to residents"
          icon={Globe2}
          tone="moss"
        />
        <StatCard
          label="Hidden"
          value={counts.rejected + counts.archived}
          hint="Rejected or taken down"
          icon={EyeOff}
          tone="forest"
        />
        <StatCard
          label="All posts"
          value={counts.all}
          hint="Resident submissions"
          icon={MessageSquare}
          tone="clay"
        />
      </div>

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* Command center */}
        <section className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)] xl:max-h-[calc(100dvh-7rem)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.07] px-4 py-3.5">
            <div className="min-w-0">
              <h2 className="text-[0.9375rem] font-semibold text-ink">Review console</h2>
              <p className="mt-0.5 text-[0.75rem] text-ink/45">
                Approve, reject, or hide resident adoption posts.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#c99a4e]/14 px-2.5 py-1 text-[0.6875rem] font-semibold text-[#7a5212]">
              <Clock3 className="h-3 w-3" strokeWidth={2} />
              {counts.pending} pending
            </span>
          </div>

          <div className="space-y-3 border-b border-ink/[0.07] p-3 sm:p-4">
            <SearchInput
              value={query}
              onValueChange={setQuery}
              label="Search community posts"
              placeholder="Search a pet, code, resident, or barangay"
              className="w-full"
            />
            <div className="-mx-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabFilters<FilterId>
                ariaLabel="Filter community posts"
                value={filter}
                onChange={setFilter}
                options={[
                  { id: "all", label: "All", icon: LayoutGrid, count: counts.all },
                  { id: "pending", label: "Pending", icon: Clock3, count: counts.pending },
                  {
                    id: "published",
                    label: "Live",
                    icon: Globe2,
                    count: counts.published,
                  },
                  {
                    id: "rejected",
                    label: "Rejected",
                    icon: XCircle,
                    count: counts.rejected,
                  },
                  {
                    id: "archived",
                    label: "Hidden",
                    icon: Archive,
                    count: counts.archived,
                  },
                ]}
              />
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1 p-3 sm:p-4">
            {filtered.length === 0 ? (
              <SearchEmpty
                className="py-14"
                icon={query || filter !== "all" ? undefined : PawPrint}
                title={
                  query || filter !== "all"
                    ? "No posts match these filters"
                    : "No community posts yet"
                }
                description={
                  query || filter !== "all"
                    ? "Try another name, code, or status."
                    : "Resident submissions will appear here for review."
                }
                onClear={
                  query || filter !== "all"
                    ? () => {
                        setQuery("");
                        setFilter("all");
                      }
                    : undefined
                }
                clearLabel="Clear filters"
              />
            ) : (
              <ul className="min-w-0 space-y-2.5">
                {filtered.map((post) => {
                  const meta = statusOf(post);
                  return (
                    <li
                      key={post.id}
                      className="min-w-0 rounded-xl border border-ink/[0.08] bg-white p-3"
                    >
                      <div className="flex min-w-0 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedId(post.id)}
                          aria-label={`Open ${post.name}`}
                          className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-sand text-ink/25"
                        >
                          {post.image ? (
                            <img
                              src={post.image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <PawPrint className="h-5 w-5" strokeWidth={1.6} />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedId(post.id)}
                              className="min-w-0 text-left"
                            >
                              <p className="truncate text-[0.875rem] font-semibold text-ink">
                                {post.name}
                              </p>
                              <p className="mt-0.5 truncate text-[0.75rem] text-ink/50">
                                {post.animalCode} · {post.species} · {post.breed}
                              </p>
                            </button>
                            <Badge tone={meta.tone} surface="light" className="shrink-0">
                              {meta.label}
                            </Badge>
                          </div>

                          {post.description && (
                            <p className="mt-1.5 line-clamp-2 text-[0.75rem] leading-[1.6] text-ink/55">
                              {post.description}
                            </p>
                          )}

                          <p className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[0.6875rem] text-ink/40">
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <UserRound className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                              <span className="max-w-[18ch] truncate">
                                {post.postedByName}
                              </span>
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                              <span className="max-w-[16ch] truncate">
                                {post.barangay}
                              </span>
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="whitespace-nowrap">{post.postedLabel}</span>
                          </p>

                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            {post.listingStatus === "pending_review" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => openAction(post, "publish")}
                                >
                                  <Check className="h-3 w-3" strokeWidth={2.2} />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="dangerGhost"
                                  onClick={() => openAction(post, "reject")}
                                >
                                  <XCircle className="h-3 w-3" strokeWidth={2.1} />
                                  Reject
                                </Button>
                              </>
                            )}

                            {post.listingStatus === "published" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => openAction(post, "hide")}
                              >
                                <EyeOff className="h-3 w-3" strokeWidth={2} />
                                Hide from feed
                              </Button>
                            )}

                            {(post.listingStatus === "rejected" ||
                              post.listingStatus === "archived") && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => openAction(post, "publish")}
                              >
                                <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                                Restore to feed
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedId(post.id)}
                            >
                              <Eye className="h-3 w-3" strokeWidth={1.9} />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </section>

        {/* Resident-facing preview */}
        <section className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)] xl:sticky xl:top-4 xl:h-[calc(100dvh-7rem)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.07] px-4 py-3.5">
            <div className="min-w-0">
              <h2 className="text-[0.9375rem] font-semibold text-ink">Resident preview</h2>
              <p className="mt-0.5 text-[0.75rem] text-ink/45">
                Live mobile app feed as residents see it.
              </p>
            </div>
            <a
              href="/community"
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-2.5 py-1.5 text-[0.6875rem] font-medium text-ink/55 transition-colors hover:border-ink/25 hover:text-ink"
            >
              Open feed
              <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
            </a>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#eaf2ec] p-3 sm:p-5">
            {/* The resident app feed, matching the mobile app screen. */}
            <div className="flex h-[560px] w-full max-w-[340px] flex-col rounded-[2.6rem] border border-ink/15 bg-ink p-[6px] shadow-[0_40px_80px_-36px_rgba(16,36,26,0.55)] sm:h-[620px] xl:h-full xl:max-h-[700px]">
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2.15rem] bg-paper-2">
                <div
                  aria-hidden="true"
                  className="absolute left-1/2 top-2 z-20 h-4 w-16 -translate-x-1/2 rounded-full bg-ink sm:h-5 sm:w-20"
                />
                <div className="flex h-full min-h-0 flex-col pt-7">
                  <div className="flex items-center justify-between px-4 pb-1 text-[8px] font-medium tracking-wide text-ink/60 sm:text-[9px]">
                    <span>9:41</span>
                    <span className="flex items-center gap-1" aria-hidden="true">
                      <span className="h-1.5 w-1.5 rounded-full bg-ink/50" />
                      <span className="h-1.5 w-1.5 rounded-full bg-ink/50" />
                      <span className="h-1.5 w-3 rounded-[1px] border border-ink/50" />
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-4 pb-2 pt-1">
                    <div>
                      <p className="font-display text-[26px] leading-none tracking-[-0.03em] text-ink">
                        Feed
                      </p>
                      <p className="mt-1 text-[8px] uppercase tracking-[0.15em] text-ink/45">
                        {livePosts.length} adoption {livePosts.length === 1 ? "post" : "posts"}
                      </p>
                    </div>
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-ink/10 bg-paper text-ink/70">
                      <Bell className="h-3.5 w-3.5" strokeWidth={1.7} />
                    </span>
                  </div>

                  <ScrollArea className="min-h-0 flex-1 px-3.5 pb-1">
                    <div className="rounded-lg bg-sage/40 px-3 py-2.5">
                      <p className="text-[7px] font-medium uppercase tracking-[0.14em] text-moss sm:text-[8px]">
                        Adoption feed
                      </p>
                      <p className="mt-1 text-[8px] leading-[1.5] text-ink/60 sm:text-[9.5px]">
                        Animals posted by residents looking for a home.
                      </p>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2 rounded-full border border-dashed border-clay/35 bg-paper px-3 py-2">
                      <Plus className="h-3 w-3 text-clay" strokeWidth={2} />
                      <span className="text-[8px] font-medium text-clay sm:text-[9.5px]">
                        Share an animal for adoption
                      </span>
                    </div>

                    {livePosts.length === 0 ? (
                      <div className="mt-3 rounded-xl border border-dashed border-ink/20 bg-paper px-4 py-10 text-center">
                        <PawPrint
                          className="mx-auto h-6 w-6 text-ink/20"
                          strokeWidth={1.5}
                        />
                        <p className="mt-2 text-[11px] font-semibold text-ink">
                          Nothing live yet
                        </p>
                        <p className="mx-auto mt-1 max-w-[26ch] text-[8.5px] leading-relaxed text-ink/50">
                          Approve a resident post to see it here.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2.5 space-y-2.5 pb-2">
                        {livePosts.map((post) => (
                          <article
                            key={post.id}
                            className="min-w-0 overflow-hidden rounded-xl border border-ink/10 bg-paper shadow-[0_10px_24px_-16px_rgba(16,36,26,0.4)]"
                          >
                            <div className="relative h-[148px] bg-sand">
                              {post.image ? (
                                <img
                                  src={post.image}
                                  alt={`Photo of ${post.name}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="grid h-full w-full place-items-center text-ink/20">
                                  <PawPrint className="h-8 w-8" strokeWidth={1.4} />
                                </span>
                              )}
                              <span className="absolute left-2 top-2 rounded-full bg-paper/90 px-2 py-0.5 text-[6.5px] font-medium uppercase tracking-[0.1em] text-moss sm:text-[7.5px]">
                                Ready for adoption
                              </span>
                            </div>

                            <div className="px-3 pb-2.5 pt-2">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-[13px] font-semibold text-ink">
                                  {post.name}
                                </p>
                                <span className="shrink-0 text-[7px] uppercase tracking-[0.1em] text-ink/40">
                                  {post.postedLabel}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-[9px] text-ink/50">
                                {post.breed}
                                {post.age ? ` · ${post.age}` : ""}
                                {post.sex ? ` · ${post.sex}` : ""}
                                {post.barangay ? ` · ${post.barangay}` : ""}
                              </p>
                              <p className="mt-1.5 line-clamp-2 text-[9.5px] leading-[1.45] text-ink/65">
                                {post.description ??
                                  post.temperament ??
                                  "Posted by a neighbour in Mati City."}
                              </p>
                              <div className="mt-2 flex items-center justify-between border-t border-ink/10 pt-1.5">
                                <span className="text-[8.5px] font-medium text-clay">
                                  Apply to adopt
                                </span>
                                <ArrowUpRight
                                  className="h-3 w-3 text-clay"
                                  strokeWidth={1.8}
                                />
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="mt-auto flex shrink-0 items-center justify-around border-t border-ink/10 bg-paper px-3 pb-3 pt-2">
                    {[
                      { icon: Home, label: "Feed", active: true },
                      { icon: Compass, label: "Explore", active: false },
                      { icon: Plus, label: "Report", active: false },
                      { icon: User, label: "Profile", active: false },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <span
                          key={item.label}
                          className={`flex flex-col items-center gap-0.5 text-[7px] ${
                            item.active ? "text-moss" : "text-ink/35"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                          {item.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {selected && selectedMeta && (
        <OverlayCard
          onClose={() => setSelectedId(null)}
          labelledBy="community-post-title"
          eyebrow="Community post"
          title={selected.name}
          titleClassName="font-display text-[clamp(1.6rem,4vw,2.2rem)] leading-none tracking-[-0.03em] text-ink"
          meta={
            <Badge tone={selectedMeta.tone} surface="light">
              {selectedMeta.label}
            </Badge>
          }
          panelClassName="max-w-[860px]"
          footer={
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedId(null)}
              >
                Close
              </Button>
              {selected.listingStatus === "pending_review" && (
                <>
                  <Button
                    size="sm"
                    variant="dangerGhost"
                    onClick={() => openAction(selected, "reject")}
                  >
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => openAction(selected, "publish")}>
                    Approve &amp; publish
                  </Button>
                </>
              )}
              {selected.listingStatus === "published" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openAction(selected, "hide")}
                >
                  Hide from feed
                </Button>
              )}
              {(selected.listingStatus === "rejected" ||
                selected.listingStatus === "archived") && (
                <Button size="sm" onClick={() => openAction(selected, "publish")}>
                  Restore to feed
                </Button>
              )}
            </>
          }
        >
          <ScrollArea className="min-h-0 flex-1">
            <div className="grid gap-0 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="relative min-h-[220px] bg-sand sm:min-h-[280px] md:min-h-full">
                {selected.image ? (
                  <img
                    src={selected.image}
                    alt={`Photo of ${selected.name}`}
                    className="h-[260px] w-full object-cover sm:h-[320px] md:absolute md:inset-0 md:h-full"
                  />
                ) : (
                  <span className="grid h-full min-h-[220px] w-full place-items-center text-ink/20">
                    <PawPrint className="h-10 w-10" strokeWidth={1.4} />
                  </span>
                )}
              </div>

              <div className="min-w-0 p-4 sm:p-6">
                <p className="label text-[0.5625rem] text-ink/40">
                  {selected.species} · {selected.barangay}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.8125rem] text-ink/60">
                  <span>{selected.breed}</span>
                  <span aria-hidden="true" className="h-3 w-px bg-ink/20" />
                  <span>{selected.age}</span>
                  <span aria-hidden="true" className="h-3 w-px bg-ink/20" />
                  <span>{selected.sex}</span>
                  {selected.size && (
                    <>
                      <span aria-hidden="true" className="h-3 w-px bg-ink/20" />
                      <span>{selected.size}</span>
                    </>
                  )}
                </div>

                <p className="mt-4 text-pretty text-[0.875rem] leading-[1.7] text-ink/65">
                  {selected.description ??
                    selected.temperament ??
                    "Posted by a neighbour in Mati City."}
                </p>

                <dl className="mt-5 grid gap-4 border-t border-ink/10 pt-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="label text-[0.5rem] text-ink/35">
                      Colour &amp; markings
                    </dt>
                    <dd className="mt-1 truncate text-[0.8125rem] text-ink/65">
                      {selected.colorMarkings ?? "Not provided"}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="label text-[0.5rem] text-ink/35">Temperament</dt>
                    <dd className="mt-1 text-[0.8125rem] text-ink/65">
                      {selected.temperament ?? "Not provided"}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="label text-[0.5rem] text-ink/35">Health</dt>
                    <dd className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-ink/12 px-2.5 py-1 font-mono text-[0.5625rem] tracking-[0.04em] text-ink/55">
                        <Check
                          className={`h-2.5 w-2.5 ${
                            selected.vaccinated ? "text-moss" : "text-ink/25"
                          }`}
                          strokeWidth={2.2}
                        />
                        {selected.vaccinated ? "Vaccinated" : "Vaccine status unknown"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-ink/12 px-2.5 py-1 font-mono text-[0.5625rem] tracking-[0.04em] text-ink/55">
                        <Check
                          className={`h-2.5 w-2.5 ${
                            selected.isNeutered ? "text-moss" : "text-ink/25"
                          }`}
                          strokeWidth={2.2}
                        />
                        {selected.isNeutered ? "Neutered / spayed" : "Not neutered"}
                      </span>
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="label text-[0.5rem] text-ink/35">Posted by</dt>
                    <dd className="mt-1 truncate text-[0.8125rem] text-ink/65">
                      {selected.postedByName} · {selected.postedLabel}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </ScrollArea>
        </OverlayCard>
      )}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={pending ? ACTION_META[pending.kind].title : ""}
        description={
          pending ? (
            <>
              {ACTION_META[pending.kind].description}
              <span className="mt-1 block font-medium text-ink/70">
                {pending.post.name} · {pending.post.animalCode}
              </span>
            </>
          ) : null
        }
        confirmLabel={pending ? ACTION_META[pending.kind].confirmLabel : "Confirm"}
        tone={pending ? ACTION_META[pending.kind].tone : "default"}
        confirmDisabled={confirmDisabled}
        onConfirm={confirmAction}
      >
        {pending?.kind === "reject" && (
          <label className="block">
            <span className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink/45">
              Reason for rejection
            </span>
            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows={3}
              maxLength={400}
              placeholder="e.g. The photos are unclear, or the post is missing health details."
              className="w-full resize-none rounded-lg border border-ink/12 bg-white px-3 py-2 text-[0.8125rem] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-clay/45 focus:ring-2 focus:ring-clay/15"
            />
            <span className="mt-1 block text-[0.625rem] text-ink/35">
              {remarks.length}/400
            </span>
          </label>
        )}
      </ConfirmDialog>
    </>
  );
}
