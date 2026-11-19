"use client";

import {
  BookOpen,
  Copy,
  GraduationCap,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { OverlayCard } from "@/components/ui/overlay-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchEmpty } from "@/components/ui/search-empty";
import { SearchInput } from "@/components/ui/search-input";
import { TabFilters } from "@/components/ui/tab-filters";
import { useToast } from "@/components/ui/toast";

import { LearningEditor } from "./learning-editor";
import {
  CATEGORY_META,
  CONTENT_TYPE_LABEL,
  formatMinutes,
  type LearningModuleDto,
  type LearningSubmit,
} from "./learning-types";

const PAGE_SIZE = 10;

type StatusTab = "all" | "published" | "draft";

interface LearningConsoleProps {
  modules: LearningModuleDto[];
}

export function LearningConsole({ modules }: LearningConsoleProps) {
  const toast = useToast();
  const [items, setItems] = useState(modules);
  const [tab, setTab] = useState<StatusTab>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{ module: LearningModuleDto | null } | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<LearningModuleDto | null>(null);
  const [publishTarget, setPublishTarget] = useState<{
    module: LearningModuleDto;
    next: boolean;
  } | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<number>>(() => new Set());
  const [detail, setDetail] = useState<LearningModuleDto | null>(null);
  const tempIdRef = useRef(0);

  useEffect(() => {
    setItems(modules);
  }, [modules]);

  const publishedCount = items.filter((item) => item.isPublished).length;
  const draftCount = items.length - publishedCount;
  const lessonCount = items.reduce((total, item) => total + item.lessons.length, 0);
  const completionRate = useMemo(() => {
    const active = items.filter((item) => item.isPublished && item.stats.learners > 0);
    if (active.length === 0) return 0;
    return Math.round(
      active.reduce((total, item) => total + item.stats.completionRate, 0) /
        active.length,
    );
  }, [items]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (tab === "published" && !item.isPublished) return false;
      if (tab === "draft" && item.isPublished) return false;
      if (!needle) return true;
      return [item.title, item.description ?? "", CATEGORY_META[item.category].label]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [items, query, tab]);

  useEffect(() => {
    setPage(1);
  }, [query, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function replaceItem(saved: LearningModuleDto, tempId?: number) {
    setItems((current) => {
      const withoutTemp =
        tempId !== undefined
          ? current.filter((item) => item.id !== tempId)
          : current;
      return withoutTemp.some((item) => item.id === saved.id)
        ? withoutTemp.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...withoutTemp];
    });
  }

  function nextTempId() {
    tempIdRef.current -= 1;
    return tempIdRef.current;
  }

  function markPending(id: number, pending: boolean) {
    setPendingIds((current) => {
      const next = new Set(current);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function optimisticFromPayload(
    payload: LearningSubmit,
    target: LearningModuleDto | null,
    id: number,
  ): LearningModuleDto {
    return {
      id,
      title: payload.input.title,
      category: payload.input.category,
      description: payload.input.description,
      coverImageUrl: payload.thumbnail
        ? URL.createObjectURL(payload.thumbnail)
        : payload.input.coverImageUrl,
      isPublished: payload.input.isPublished,
      createdAt: target?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lessons: payload.input.lessons.map((lesson, index) => ({
        id: lesson.id ?? -(index + 1),
        title: lesson.title,
        contentType: lesson.contentType,
        contentBody: lesson.contentBody,
        mediaUrl: lesson.mediaUrl,
        durationMinutes: lesson.durationMinutes,
        sortOrder: index,
      })),
      stats: target?.stats ?? { learners: 0, completions: 0, completionRate: 0 },
    };
  }

  async function uploadFile(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/admin/learning/upload", {
      method: "POST",
      body: form,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.ok) {
      throw new Error(body?.error?.message ?? "A file could not be uploaded.");
    }
    return body.data.url as string;
  }

  function handleSave(payload: LearningSubmit) {
    const target = editor?.module ?? null;
    setEditor(null);

    const method = target ? "PUT" : "POST";
    const url = target
      ? `/api/admin/learning/modules/${target.id}`
      : "/api/admin/learning/modules";

    const tempId = target ? target.id : nextTempId();
    const optimistic = optimisticFromPayload(payload, target, tempId);

    // Show the change immediately; the network write happens in the background.
    setItems((current) =>
      target
        ? current.map((item) => (item.id === target.id ? optimistic : item))
        : [optimistic, ...current],
    );
    markPending(tempId, true);

    void (async () => {
      try {
        const coverImageUrl = payload.thumbnail
          ? await uploadFile(payload.thumbnail)
          : payload.input.coverImageUrl;

        const lessonUrls = await Promise.all(
          payload.lessonFiles.map((file, index) =>
            file ? uploadFile(file) : Promise.resolve(payload.input.lessons[index].mediaUrl),
          ),
        );

        const input = {
          ...payload.input,
          coverImageUrl,
          lessons: payload.input.lessons.map((lesson, index) => ({
            ...lesson,
            mediaUrl: lessonUrls[index] ?? lesson.mediaUrl,
          })),
        };

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.ok) {
          throw new Error(body?.error?.message ?? "The course was not saved.");
        }
        markPending(tempId, false);
        replaceItem(body.data as LearningModuleDto, target ? undefined : tempId);
        toast.success(target ? "Course updated" : "Course created", {
          description: input.isPublished
            ? "It is live in the learner catalog."
            : "It is saved as a draft.",
        });
      } catch (error) {
        markPending(tempId, false);
        setItems((current) =>
          target
            ? current.map((item) => (item.id === target.id ? target : item))
            : current.filter((item) => item.id !== tempId),
        );
        toast.error("Couldn't save this course", {
          description:
            error instanceof Error && error.message
              ? error.message
              : "Nothing changed. Please try again.",
        });
      }
    })();
  }

  function handleDelete(module: LearningModuleDto) {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== module.id));

    void (async () => {
      try {
        const response = await fetch(`/api/admin/learning/modules/${module.id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error();
        toast.success("Course deleted", {
          description: `"${module.title}" was removed from the catalog.`,
        });
      } catch {
        setItems(previous);
        toast.error("Couldn't delete this course", {
          description: "It is still in the catalog. Please try again.",
        });
      }
    })();
  }

  function handlePublish(module: LearningModuleDto, next: boolean) {
    const previous = items;
    setItems((current) =>
      current.map((item) =>
        item.id === module.id ? { ...item, isPublished: next } : item,
      ),
    );

    void (async () => {
      try {
        const response = await fetch(`/api/admin/learning/modules/${module.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublished: next }),
        });
        if (!response.ok) throw new Error();
        toast.success(next ? "Course published" : "Course unpublished", {
          description: next
            ? `"${module.title}" is now visible to learners.`
            : `"${module.title}" is hidden from learners.`,
        });
      } catch {
        setItems(previous);
        toast.error("Couldn't update this course", {
          description: "Its visibility did not change. Please try again.",
        });
      }
    })();
  }

  function handleDuplicate(module: LearningModuleDto) {
    const tempId = nextTempId();
    const optimistic: LearningModuleDto = {
      ...module,
      id: tempId,
      title: `${module.title} (copy)`,
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: { learners: 0, completions: 0, completionRate: 0 },
    };
    setItems((current) => [optimistic, ...current]);
    markPending(tempId, true);

    void (async () => {
      try {
        const response = await fetch(
          `/api/admin/learning/modules/${module.id}/duplicate`,
          { method: "POST" },
        );
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.ok) throw new Error();
        markPending(tempId, false);
        replaceItem(body.data as LearningModuleDto, tempId);
        toast.success("Course duplicated", {
          description: "The copy is saved as a draft.",
        });
      } catch {
        markPending(tempId, false);
        setItems((current) => current.filter((item) => item.id !== tempId));
        toast.error("Couldn't duplicate this course", {
          description: "Nothing was created. Please try again.",
        });
      }
    })();
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.4rem)] leading-[1.04] tracking-[-0.03em] text-ink">
            E-learning
          </h1>
          <p className="mt-1 max-w-[62ch] text-[0.8125rem] leading-[1.6] text-ink/55">
            Publish responsible ownership, behavior, and training courses, then
            track how learners progress.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setEditor({ module: null })}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          New course
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Published" value={publishedCount} tone="moss" />
        <Kpi label="Drafts" value={draftCount} tone="warning" />
        <Kpi label="Lessons" value={lessonCount} tone="ink" />
        <Kpi label="Completion" value={`${completionRate}%`} tone="ink" />
      </div>

      <section className="overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
        <div className="flex flex-col gap-2 border-b border-ink/[0.07] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-ink/[0.07] bg-ink/[0.02] text-ink/40">
                <GraduationCap className="h-3.5 w-3.5" strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-[0.75rem] font-semibold text-ink/75">
                  Course catalog
                </p>
                <p className="text-[0.625rem] text-ink/40">
                  {items.length} {items.length === 1 ? "course" : "courses"} ·{" "}
                  {lessonCount} lessons
                </p>
              </div>
            </div>
            <SearchInput
              value={query}
              onValueChange={setQuery}
              showIcon={false}
              label="Search courses"
              placeholder="Title or category"
              className="w-56"
            />
          </div>

          <TabFilters
            options={[
              { id: "all", label: "All", count: items.length },
              { id: "published", label: "Published", count: publishedCount },
              { id: "draft", label: "Drafts", count: draftCount },
            ]}
            value={tab}
            onChange={setTab}
            ariaLabel="Filter courses by status"
          />
        </div>

        {filtered.length === 0 ? (
          <SearchEmpty
            icon={BookOpen}
            title={items.length === 0 ? "No courses yet" : "No courses match"}
            description={
              items.length === 0
                ? "Create the first course to start teaching responsible pet ownership."
                : "Try a different search or status filter."
            }
            onClear={query ? () => setQuery("") : undefined}
            clearLabel="Clear search"
          />
        ) : (
          <div>
            <ul className="divide-y divide-ink/[0.05]">
              {paginated.map((module) => {
                const meta = CATEGORY_META[module.category];
                const pending = pendingIds.has(module.id);
                return (
                  <li
                    key={module.id}
                    className={`relative flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-ink/[0.015] focus-within:bg-ink/[0.02] ${
                      pending ? "opacity-60" : ""
                    } sm:flex-row sm:items-start`}
                  >
                    <button
                      type="button"
                      data-row-link
                      aria-label={`View ${module.title}`}
                      onClick={() => setDetail(module)}
                      className="absolute inset-0 z-0 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-clay/35"
                    />
                    <div className="pointer-events-none flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start">
                      {module.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={module.coverImageUrl}
                          alt=""
                          className="h-10 w-14 shrink-0 rounded-lg border border-ink/[0.08] object-cover"
                        />
                      ) : (
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink/[0.03] text-ink/40">
                          <BookOpen className="h-4 w-4" strokeWidth={1.8} />
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[0.8125rem] font-semibold text-ink/85">
                            {module.title}
                          </span>
                          <Badge tone={module.isPublished ? "success" : "warning"} surface="light">
                            {module.isPublished ? "Published" : "Draft"}
                          </Badge>
                          <Badge tone={meta.tone} surface="light">
                            {meta.label}
                          </Badge>
                          {pending && (
                            <span className="inline-flex items-center gap-1 text-[0.625rem] font-medium text-ink/40">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay" />
                              Saving…
                            </span>
                          )}
                        </div>

                        {module.description && (
                          <p className="mt-1 line-clamp-2 max-w-[70ch] text-[0.6875rem] leading-[1.55] text-ink/50">
                            {module.description}
                          </p>
                        )}

                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.625rem] text-ink/40">
                          <span>
                            {module.lessons.length}{" "}
                            {module.lessons.length === 1 ? "lesson" : "lessons"}
                          </span>
                          <span>
                            {formatMinutes(
                              module.lessons.reduce(
                                (total, lesson) => total + (lesson.durationMinutes ?? 0),
                                0,
                              ),
                            )}
                          </span>
                          <span>{module.stats.learners} learners</span>
                          <span>{module.stats.completionRate}% completion</span>
                        </p>
                      </div>
                    </div>

                    <div className="relative z-10 grid w-full shrink-0 grid-cols-[4.5rem_5.25rem_6rem_2rem] items-center justify-items-stretch gap-1 sm:w-auto">
                      <Button
                        size="xs"
                        variant="tertiary"
                        disabled={pending}
                        className="justify-center"
                        onClick={() => setEditor({ module })}
                      >
                        <Pencil className="h-3 w-3" strokeWidth={2} />
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        disabled={pending}
                        className="justify-center"
                        onClick={() =>
                          setPublishTarget({ module, next: !module.isPublished })
                        }
                      >
                        {module.isPublished ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        disabled={pending}
                        className="justify-center"
                        onClick={() => handleDuplicate(module)}
                      >
                        <Copy className="h-3 w-3" strokeWidth={2} />
                        Duplicate
                      </Button>
                      <Button
                        size="icon"
                        variant="dangerGhost"
                        disabled={pending}
                        className="justify-self-center"
                        aria-label={`Delete ${module.title}`}
                        onClick={() => setDeleteTarget(module)}
                      >
                        <Trash2 className="h-3 w-3" strokeWidth={2} />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          itemLabel="courses"
          onPageChange={setPage}
          className="border-t border-ink/[0.07] px-4 py-2.5"
        />
      </section>

      {editor && (
        <LearningEditor
          module={editor.module}
          onClose={() => setEditor(null)}
          onSubmit={handleSave}
        />
      )}

      {detail && (
        <CourseDetail
          course={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            const target = detail;
            setDetail(null);
            setEditor({ module: target });
          }}
          onTogglePublish={() => {
            const target = detail;
            setDetail(null);
            setPublishTarget({ module: target, next: !target.isPublished });
          }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this course?"
        description={
          deleteTarget ? (
            <>
              <strong className="font-semibold text-ink/75">
                {deleteTarget.title}
              </strong>{" "}
              and its lessons will be removed from the catalog. Learner progress is
              kept for reporting but the course can no longer be opened.
            </>
          ) : null
        }
        tone="danger"
        confirmLabel="Delete course"
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
        }}
      />

      <ConfirmDialog
        open={publishTarget !== null}
        onOpenChange={(open) => !open && setPublishTarget(null)}
        title={publishTarget?.next ? "Publish this course?" : "Unpublish this course?"}
        description={
          publishTarget ? (
            publishTarget.next ? (
              <>
                <strong className="font-semibold text-ink/75">
                  {publishTarget.module.title}
                </strong>{" "}
                will appear in the learner catalog and can be opened by anyone.
              </>
            ) : (
              <>
                <strong className="font-semibold text-ink/75">
                  {publishTarget.module.title}
                </strong>{" "}
                will be hidden from learners. Existing progress is kept.
              </>
            )
          ) : null
        }
        tone={publishTarget?.next ? "success" : "default"}
        confirmLabel={publishTarget?.next ? "Publish" : "Unpublish"}
        onConfirm={() => {
          if (publishTarget) handlePublish(publishTarget.module, publishTarget.next);
        }}
      />
    </div>
  );
}

function CourseDetail({
  course,
  onClose,
  onEdit,
  onTogglePublish,
}: {
  course: LearningModuleDto;
  onClose: () => void;
  onEdit: () => void;
  onTogglePublish: () => void;
}) {
  const meta = CATEGORY_META[course.category];
  const totalMinutes = course.lessons.reduce(
    (total, lesson) => total + (lesson.durationMinutes ?? 0),
    0,
  );

  return (
    <OverlayCard
      onClose={onClose}
      labelledBy="course-detail-title"
      eyebrow={meta.label}
      title={course.title}
      titleClassName="text-[1rem] font-semibold text-ink"
      panelClassName="sm:max-w-2xl"
      meta={
        <>
          <Badge tone={course.isPublished ? "success" : "warning"} surface="light">
            {course.isPublished ? "Published" : "Draft"}
          </Badge>
          <Badge tone={meta.tone} surface="light">
            {meta.label}
          </Badge>
        </>
      }
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button variant="secondary" size="md" onClick={onTogglePublish}>
            {course.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" size="md" onClick={onEdit}>
              <Pencil className="h-3 w-3" strokeWidth={2} />
              Edit course
            </Button>
          </div>
        </div>
      }
    >
      <ScrollArea className="max-h-[calc(92vh-13rem)]">
        <div className="space-y-4 px-5 py-4">
          {course.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.coverImageUrl}
              alt=""
              className="h-44 w-full rounded-xl border border-ink/[0.08] object-cover"
            />
          ) : (
            <div className="grid h-32 w-full place-items-center rounded-xl border border-dashed border-ink/15 bg-ink/[0.015] text-ink/25">
              <BookOpen className="h-7 w-7" strokeWidth={1.6} />
            </div>
          )}

          <p className="text-[0.8125rem] leading-[1.65] text-ink/60">
            {course.description || "No summary has been added for this course yet."}
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DetailStat label="Lessons" value={course.lessons.length} />
            <DetailStat label="Duration" value={formatMinutes(totalMinutes)} />
            <DetailStat label="Learners" value={course.stats.learners} />
            <DetailStat label="Completion" value={`${course.stats.completionRate}%`} />
          </div>

          <div>
            <p className="mb-1.5 text-[0.6875rem] font-semibold text-ink/60">Lessons</p>
            <ol className="space-y-1.5">
              {course.lessons.map((lesson, index) => (
                <li
                  key={lesson.id}
                  className="flex items-center gap-2.5 rounded-lg border border-ink/[0.07] bg-white px-2.5 py-2"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ink/[0.05] text-[0.625rem] font-semibold tabular-nums text-ink/45">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.75rem] font-medium text-ink/75">
                      {lesson.title}
                    </p>
                    <p className="text-[0.625rem] text-ink/40">
                      {CONTENT_TYPE_LABEL[lesson.contentType]}
                      {lesson.durationMinutes
                        ? ` · ${formatMinutes(lesson.durationMinutes)}`
                        : ""}
                      {lesson.mediaUrl ? " · File attached" : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <p className="text-[0.625rem] text-ink/35">
            Created {shortDate(course.createdAt)} · Updated {shortDate(course.updatedAt)}
          </p>
        </div>
      </ScrollArea>
    </OverlayCard>
  );
}

function shortDate(iso: string): string {
  return iso.slice(0, 10);
}

function DetailStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-ink/[0.07] bg-ink/[0.012] px-2.5 py-2">
      <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.09em] text-ink/35">
        {label}
      </p>
      <p className="mt-0.5 text-[0.875rem] font-semibold tabular-nums text-ink/80">
        {value}
      </p>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "moss" | "warning" | "ink";
}) {
  const toneClass =
    tone === "moss" ? "text-moss" : tone === "warning" ? "text-[#a04a35]" : "text-ink";
  return (
    <div className="rounded-xl border border-ink/[0.08] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
      <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-ink/40">
        {label}
      </p>
      <p className={`mt-0.5 text-[1.125rem] font-semibold tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
