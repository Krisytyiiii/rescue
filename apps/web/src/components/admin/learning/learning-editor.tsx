"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  ImagePlus,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { LearningCategory, LessonContentType } from "@furescue/core";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { OverlayCard } from "@/components/ui/overlay-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select } from "@/components/ui/select";

import {
  CATEGORY_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  type LearningModuleDto,
  type LearningSubmit,
} from "./learning-types";

interface LessonDraft {
  key: string;
  id?: number;
  title: string;
  contentType: LessonContentType;
  contentBody: string;
  mediaUrl: string;
  durationMinutes: string;
  file: File | null;
}

const STEPS = [
  {
    id: "details",
    label: "Course details",
    hint: "Name the course and explain what learners will take away.",
  },
  {
    id: "lessons",
    label: "Lessons and files",
    hint: "Add the lessons. Upload a PDF, image, or video for each one.",
  },
  {
    id: "thumbnail",
    label: "Thumbnail",
    hint: "Upload the cover image shown in the course catalog.",
  },
] as const;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

let draftKey = 0;
function nextKey() {
  draftKey += 1;
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${draftKey}`;
  return `draft-${random}`;
}

function emptyLesson(): LessonDraft {
  return {
    key: nextKey(),
    title: "",
    contentType: "text",
    contentBody: "",
    mediaUrl: "",
    durationMinutes: "5",
    file: null,
  };
}

function initialLessons(module: LearningModuleDto | null): LessonDraft[] {
  if (!module || module.lessons.length === 0) return [emptyLesson()];
  return module.lessons.map((lesson) => ({
    key: `lesson-${lesson.id}`,
    id: lesson.id,
    title: lesson.title,
    contentType: lesson.contentType,
    contentBody: lesson.contentBody ?? "",
    mediaUrl: lesson.mediaUrl ?? "",
    durationMinutes: lesson.durationMinutes ? String(lesson.durationMinutes) : "",
    file: null,
  }));
}

interface LearningEditorProps {
  module: LearningModuleDto | null;
  onClose: () => void;
  onSubmit: (payload: LearningSubmit) => void;
}

export function LearningEditor({ module, onClose, onSubmit }: LearningEditorProps) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [title, setTitle] = useState(module?.title ?? "");
  const [category, setCategory] = useState<LearningCategory>(
    module?.category ?? "responsible_ownership",
  );
  const [description, setDescription] = useState(module?.description ?? "");
  const [isPublished, setIsPublished] = useState(module?.isPublished ?? false);
  const [lessons, setLessons] = useState<LessonDraft[]>(() => initialLessons(module));
  const [thumbnail, setThumbnail] = useState<{ file: File; preview: string } | null>(
    null,
  );
  const [existingThumbnail, setExistingThumbnail] = useState(
    module?.coverImageUrl ?? "",
  );
  const thumbnailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (thumbnail) URL.revokeObjectURL(thumbnail.preview);
    };
  }, [thumbnail]);

  function updateLesson(key: string, patch: Partial<LessonDraft>) {
    setLessons((current) =>
      current.map((lesson) => (lesson.key === key ? { ...lesson, ...patch } : lesson)),
    );
  }

  function moveLesson(index: number, direction: -1 | 1) {
    setLessons((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function chooseThumbnail(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Images must be 5 MB or smaller.");
      return;
    }
    if (thumbnail) URL.revokeObjectURL(thumbnail.preview);
    setThumbnail({ file, preview: URL.createObjectURL(file) });
    setError("");
  }

  function removeThumbnail() {
    if (thumbnail) URL.revokeObjectURL(thumbnail.preview);
    setThumbnail(null);
    setExistingThumbnail("");
    if (thumbnailRef.current) thumbnailRef.current.value = "";
  }

  function validateStep(index: number): boolean {
    if (index === 0) {
      if (!title.trim()) {
        setError("Give the course a title.");
        return false;
      }
    }
    if (index === 1) {
      if (lessons.length === 0) {
        setError("Add at least one lesson.");
        return false;
      }
      if (lessons.some((lesson) => !lesson.title.trim())) {
        setError("Every lesson needs a title.");
        return false;
      }
    }
    setError("");
    return true;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function handleBack() {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  function handleSubmit() {
    for (let index = 0; index < STEPS.length; index += 1) {
      if (!validateStep(index)) {
        setStep(index);
        return;
      }
    }

    const input = {
      id: module?.id,
      title: title.trim(),
      category,
      description: description.trim() || null,
      coverImageUrl: existingThumbnail.trim() || null,
      isPublished,
      lessons: lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title.trim(),
        contentType: lesson.contentType,
        contentBody: lesson.contentBody.trim() || null,
        mediaUrl: lesson.mediaUrl.trim() || null,
        durationMinutes: lesson.durationMinutes ? Number(lesson.durationMinutes) : null,
      })),
    };

    onSubmit({
      input,
      thumbnail: thumbnail?.file ?? null,
      lessonFiles: lessons.map((lesson) => lesson.file),
    });
  }

  const isLast = step === STEPS.length - 1;
  const preview = thumbnail?.preview || existingThumbnail;

  return (
    <OverlayCard
      onClose={onClose}
      labelledBy="learning-editor-title"
      eyebrow="E-learning"
      title={module ? "Edit course" : "New course"}
      titleClassName="text-[1rem] font-semibold text-ink"
      panelClassName="sm:max-w-2xl"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <span className="hidden text-[0.6875rem] text-ink/40 sm:inline">
            Step {step + 1} of {STEPS.length}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={step === 0 ? onClose : handleBack}
            >
              {step === 0 ? (
                "Cancel"
              ) : (
                <>
                  <ChevronLeft className="h-3 w-3" strokeWidth={2} />
                  Back
                </>
              )}
            </Button>
            {isLast ? (
              <Button variant="primary" size="md" onClick={handleSubmit}>
                {module ? "Save changes" : "Create course"}
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={handleNext}>
                Next
                <ChevronRight className="h-3 w-3" strokeWidth={2} />
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="border-b border-ink/[0.07] px-4 py-3">
        <ol className="flex items-center gap-1.5">
          {STEPS.map((item, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <li key={item.id} className="flex min-w-0 flex-1 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (index < step) {
                      setStep(index);
                      setError("");
                    }
                  }}
                  disabled={index > step}
                  aria-current={active ? "step" : undefined}
                  className={`flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-left transition-colors ${
                    index < step ? "cursor-pointer hover:bg-ink/[0.04]" : ""
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.5625rem] font-bold ${
                      done
                        ? "bg-moss text-white"
                        : active
                          ? "bg-ink text-paper"
                          : "bg-ink/[0.07] text-ink/35"
                    }`}
                  >
                    {done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : index + 1}
                  </span>
                  <span
                    className={`truncate text-[0.6875rem] font-medium ${
                      active ? "text-ink" : done ? "text-ink/60" : "text-ink/35"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`h-px min-w-2 flex-1 ${done ? "bg-moss/40" : "bg-ink/10"}`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <ScrollArea className="max-h-[calc(92vh-13rem)]">
        <div className="space-y-4 px-4 py-4">
          <div>
            <h3 className="text-[0.8125rem] font-semibold text-ink">
              {STEPS[step].label}
            </h3>
            <p className="mt-0.5 text-[0.6875rem] leading-[1.5] text-ink/45">
              {STEPS[step].hint}
            </p>
          </div>

          <FormAlert message={error} />

          <div className={step === 0 ? "block" : "hidden"}>
            <div className="grid gap-3">
              <Field label="Title">
                <input
                  className={inputClass}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Responsible Pet Ownership 101"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Category">
                  <Select
                    name="category"
                    value={category}
                    onChange={(value) => setCategory(value as LearningCategory)}
                    options={CATEGORY_OPTIONS.map(([value, meta]) => ({
                      value,
                      label: meta.label,
                    }))}
                    size="compact"
                    className="mt-1"
                  />
                </Field>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-[0.75rem] font-medium text-ink/65">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(event) => setIsPublished(event.target.checked)}
                      className="h-3.5 w-3.5 rounded border-ink/25 accent-moss"
                    />
                    Published
                  </label>
                </div>
              </div>

              <Field label="Summary" hint="Shown on the learner catalog card.">
                <textarea
                  className={`${inputClass} h-auto resize-y py-2`}
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What will learners take away from this course?"
                />
              </Field>
            </div>
          </div>

          <div className={step === 1 ? "block" : "hidden"}>
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <p className="text-[0.6875rem] font-semibold text-ink/60">Lessons</p>
                <span className="rounded-full bg-ink/[0.06] px-1.5 py-px text-[0.5625rem] font-semibold tabular-nums text-ink/45">
                  {lessons.length}
                </span>
              </div>
              <Button
                size="xs"
                variant="secondary"
                onClick={() => setLessons((current) => [...current, emptyLesson()])}
              >
                <Plus className="h-3 w-3" strokeWidth={2} />
                Add lesson
              </Button>
            </div>

            <div className="space-y-2.5">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.key}
                  className="overflow-hidden rounded-xl border border-ink/[0.09] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.03)] transition-colors focus-within:border-clay/30"
                >
                  <div className="flex items-center gap-2 border-b border-ink/[0.06] bg-ink/[0.015] py-1.5 pl-2 pr-1.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ink/[0.06] text-[0.625rem] font-semibold tabular-nums text-ink/45">
                      {index + 1}
                    </span>
                    <input
                      className="h-7 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 text-[0.8125rem] font-medium text-ink outline-none transition-colors placeholder:text-ink/30 hover:border-ink/10 focus:border-clay focus:bg-white focus:ring-2 focus:ring-clay/15"
                      value={lesson.title}
                      onChange={(event) =>
                        updateLesson(lesson.key, { title: event.target.value })
                      }
                      placeholder="Lesson title"
                      aria-label={`Lesson ${index + 1} title`}
                    />
                    <div className="flex shrink-0 items-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Move lesson up"
                        disabled={index === 0}
                        onClick={() => moveLesson(index, -1)}
                      >
                        <ArrowUp className="h-3 w-3" strokeWidth={2} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Move lesson down"
                        disabled={index === lessons.length - 1}
                        onClick={() => moveLesson(index, 1)}
                      >
                        <ArrowDown className="h-3 w-3" strokeWidth={2} />
                      </Button>
                      <Button
                        size="icon"
                        variant="dangerGhost"
                        aria-label="Remove lesson"
                        disabled={lessons.length === 1}
                        onClick={() =>
                          setLessons((current) =>
                            current.filter((item) => item.key !== lesson.key),
                          )
                        }
                      >
                        <Trash2 className="h-3 w-3" strokeWidth={2} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2.5 p-2.5">
                    <div className="grid grid-cols-[minmax(0,1fr)_6rem_minmax(0,1.35fr)] items-end gap-2">
                      <div className="min-w-0">
                        <FieldLabel>Content type</FieldLabel>
                        <Select
                          name={`lesson-type-${lesson.key}`}
                          value={lesson.contentType}
                          onChange={(value) =>
                            updateLesson(lesson.key, {
                              contentType: value as LessonContentType,
                            })
                          }
                          options={CONTENT_TYPE_OPTIONS.map(([value, label]) => ({
                            value,
                            label,
                          }))}
                          size="compact"
                          className="mt-1"
                        />
                      </div>
                      <div className="min-w-0">
                        <FieldLabel>Minutes</FieldLabel>
                        <input
                          className={inputClass}
                          type="number"
                          min={0}
                          value={lesson.durationMinutes}
                          onChange={(event) =>
                            updateLesson(lesson.key, {
                              durationMinutes: event.target.value,
                            })
                          }
                          placeholder="0"
                          aria-label="Duration in minutes"
                        />
                      </div>
                      <div className="min-w-0">
                        <FieldLabel>File</FieldLabel>
                        <input
                          type="file"
                          className="sr-only"
                          id={`lesson-file-${lesson.key}`}
                          onChange={(event) =>
                            updateLesson(lesson.key, {
                              file: event.target.files?.[0] ?? null,
                            })
                          }
                        />
                        {lesson.file || lesson.mediaUrl ? (
                          <div className="flex h-8 items-center gap-1.5 rounded-lg border border-ink/15 bg-white pl-2 pr-1">
                            <FileText
                              className="h-3.5 w-3.5 shrink-0 text-clay"
                              strokeWidth={1.9}
                            />
                            <span className="min-w-0 flex-1 truncate text-[0.6875rem] font-medium text-ink/65">
                              {lesson.file?.name ?? "Current file"}
                            </span>
                            <Button
                              size="icon"
                              variant="dangerGhost"
                              aria-label="Remove lesson file"
                              onClick={() =>
                                updateLesson(lesson.key, { file: null, mediaUrl: "" })
                              }
                            >
                              <Trash2 className="h-3 w-3" strokeWidth={2} />
                            </Button>
                          </div>
                        ) : (
                          <label
                            htmlFor={`lesson-file-${lesson.key}`}
                            className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-ink/20 bg-white px-2 text-ink/45 transition-colors hover:border-clay/50 hover:bg-clay/[0.03] hover:text-ink/65"
                          >
                            <ImagePlus className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
                            <span className="truncate text-[0.6875rem] font-medium">
                              Upload file
                            </span>
                          </label>
                        )}
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Lesson description</FieldLabel>
                      <textarea
                        className={`${inputClass} h-auto resize-y py-2 leading-[1.6]`}
                        rows={3}
                        value={lesson.contentBody}
                        onChange={(event) =>
                          updateLesson(lesson.key, { contentBody: event.target.value })
                        }
                        placeholder="What should learners read or watch in this lesson?"
                        aria-label={`Lesson ${index + 1} content`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={step === 2 ? "block" : "hidden"}>
            <input
              ref={thumbnailRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => chooseThumbnail(event.target.files?.[0])}
            />

            {preview ? (
              <div className="overflow-hidden rounded-xl border border-ink/15 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Course thumbnail preview"
                  className="h-48 w-full object-cover"
                />
                <div className="flex items-center justify-between gap-2 p-2.5">
                  <p className="min-w-0 truncate text-[0.6875rem] text-ink/50">
                    {thumbnail?.file.name ?? "Current thumbnail"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => thumbnailRef.current?.click()}
                    >
                      Replace
                    </Button>
                    <Button size="sm" variant="dangerGhost" onClick={removeThumbnail}>
                      <Trash2 className="h-3 w-3" strokeWidth={2} />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => thumbnailRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink/20 bg-ink/[0.012] px-4 py-12 transition-colors hover:border-clay/50 hover:bg-clay/[0.03]"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink/[0.05] text-ink/40">
                  <ImagePlus className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span className="text-[0.8125rem] font-medium text-ink/70">
                  Upload a course thumbnail
                </span>
                <span className="text-[0.6875rem] text-ink/40">
                  PNG, JPG, or WebP up to 5 MB.
                </span>
              </button>
            )}

            <div className="mt-4 rounded-xl border border-ink/[0.08] bg-ink/[0.012] p-3">
              <p className="text-[0.6875rem] font-semibold text-ink/70">Review</p>
              <p className="mt-1 text-[0.6875rem] leading-[1.6] text-ink/50">
                {title || "Untitled course"} · {lessons.length}{" "}
                {lessons.length === 1 ? "lesson" : "lessons"} ·{" "}
                {isPublished ? "will be published" : "saved as a draft"}
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </OverlayCard>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[0.6875rem] font-medium text-ink/60">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[0.625rem] text-ink/35">{hint}</span>}
    </label>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[0.5625rem] font-semibold uppercase tracking-[0.09em] text-ink/35">
      {children}
    </span>
  );
}

const inputClass =
  "mt-1 h-8 w-full rounded-lg border border-ink/15 bg-white px-2.5 text-[0.75rem] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-clay focus:ring-2 focus:ring-clay/15";
