# Admin — E-learning (`/admin/learning`)

**Status:** implemented (stepper course authoring with file and thumbnail uploads, publishing, learner catalog/reader, lesson-based progress). Quizzes were removed from the module by request; the legacy quiz tables remain unused.
**Route:** `apps/web/src/app/admin/(console)/learning/page.tsx`
**Components:** `apps/web/src/components/admin/learning/learning-console.tsx`, `learning-editor.tsx`
**Service:** `packages/core/src/modules/learning/learning.service.ts`
**Learner routes:** `apps/web/src/app/learn/page.tsx`, `apps/web/src/app/learn/[id]/page.tsx`
**Uploads:** `apps/web/src/app/api/admin/learning/upload/route.ts`
**Seed:** `scripts/seed-learning.ts` (`npm run db:seed-learning`)
**Group:** Community
**Related:** `docs/ADMIN_NOTIFICATIONS_PLAN.md`

**Design direction:** an **education hub**, not a file library. The module teaches
responsible pet ownership through short, practical lessons on dog and cat
behavior and basic training, then checks understanding with quizzes and tracks
completion. Admins author and publish content; community users (especially
adopters) learn at their own pace and earn a completion record.

---

## 1. Objective & purpose

**Feature objective:** implement an e-learning module on responsible pet
ownership that delivers educational content on dog and cat behavior and basic
training, promoting proper animal care and awareness among users.

The page must answer three questions at a glance:

1. **What can people learn?** (courses → lessons → quizzes)
2. **How is the catalog doing?** (published vs. draft, learners, completion rate)
3. **What needs attention?** (drafts, unpublished changes, low-scoring lessons)

### 1.1 Audiences

| Audience | Surface | What they do |
| --- | --- | --- |
| **Administrator / staff** | `/admin/learning` | Author courses and lessons, build quizzes, publish, review learner progress and attempts |
| **Adopter / community user** | `/learn` (public) and `/dashboard/learning` (signed in) | Browse courses, read lessons, take quizzes, track progress, earn completion |
| **Rescuer / foster** | `/learn` | Complete pre-adoption/foster readiness courses (optional requirement) |

### 1.2 Scope

In scope:

- Course, lesson, and quiz authoring (admin).
- Publishing workflow (draft → published → archived).
- Learner catalog, lesson reader, quiz taking, and progress tracking.
- Completion records (per course, per user) with score and attempts.
- Admin analytics: enrollments, completion rate, average quiz score.
- Notification hooks: "course published", "course completed", "quiz failed — retry".

Out of scope (later):

- Video hosting/transcoding (use external URL or Mux/Supabase Storage link).
- Certificates as downloadable PDFs (start with an on-screen completion card).
- Paid courses, instructor accounts, discussion forums.
- Localization beyond English/Filipino copy.

---

## 2. Content plan

The catalog is organized as **courses → lessons → quizzes**. Every course is
short (10–20 minutes total), mobile-friendly, and written in plain language.

### 2.1 Course 1 — Responsible Pet Ownership 101

| Lesson | Key points |
| --- | --- |
| 1. What responsible ownership means | Lifelong commitment, time and cost, the animal's welfare needs (five freedoms) |
| 2. Before you adopt | Household readiness, landlord rules, budget, family agreement, adoption vs. buying |
| 3. Daily care basics | Food and water, shelter, exercise, grooming, sanitation, safe confinement |
| 4. Identification & containment | Collars/tags, microchip awareness, leash rules, preventing straying |
| 5. Lifelong responsibility | Spay/neuter, vaccination, vet visits, planning for emergencies and relocation |

**Quiz:** 5 single-choice questions, pass ≥ 80%.

### 2.2 Course 2 — Understanding Dog Behavior

| Lesson | Key points |
| --- | --- |
| 1. How dogs communicate | Body language: ears, tail, posture, whale eye, lip licking, stiffening |
| 2. Calm vs. stressed signals | Displacement behaviors, avoidance, threshold, trigger stacking |
| 3. Fear, anxiety, and aggression | Warning signs, why punishment backfires, when to seek a behavior professional |
| 4. Dog body language in the community | Approaching safely, reading a stray, bite prevention, supervising children |
| 5. Enrichment and mental health | Walks, sniffing, play, chew items, social contact, routine |

**Quiz:** scenario-based multiple choice (photo/illustration + "what is this dog telling you?").

### 2.3 Course 3 — Basic Dog Training (Positive Reinforcement)

| Lesson | Key points |
| --- | --- |
| 1. Why positive reinforcement works | Reward timing, marker words, treats vs. praise, avoiding aversive tools |
| 2. Name recognition and attention | Charging a name, eye contact, short sessions, low-distraction starts |
| 3. Sit, down, and stay | Luring → hand signal → verbal cue → duration and distance |
| 4. Recall and loose-leash walking | Recall safety, long line, reward history, stop-pull-release technique |
| 5. Crate and house training | Crate as a safe space, schedule, supervision, accident response |
| 6. Socialization and manners | Puppy windows, gradual exposure, polite greetings, resource guarding basics |

**Quiz:** skill-order and scenario questions, pass ≥ 80%.

### 2.4 Course 4 — Understanding Cat Behavior & Care

| Lesson | Key points |
| --- | --- |
| 1. How cats communicate | Tail, ears, pupils, vocalizations, scent marking, slow blink |
| 2. Stress and hiding | Safe spaces, vertical territory, litter box hygiene, multi-cat households |
| 3. Scratching and play | Why cats scratch, appropriate posts, wand play, avoiding hands-as-toys |
| 4. Litter box and feeding basics | Box count rule, placement, wet vs. dry food, fresh water, routine |
| 5. Handling and vet visits | Carrier training, low-stress handling, signs of pain or illness |

**Quiz:** 5 single-choice questions, pass ≥ 80%.

### 2.5 Course 5 — Health, Safety & Community Awareness

| Lesson | Key points |
| --- | --- |
| 1. Vaccination and anti-rabies | Core vaccines, schedule, RA 9482 responsibilities, bite reporting |
| 2. Spay/neuter and population control | Benefits, myths, recovery care, barangay programs |
| 3. Parasite prevention and grooming | Deworming, fleas/ticks, bathing, nail and ear care |
| 4. Recognizing illness and emergencies | Warning signs, first steps, when to go to a vet |
| 5. Animal welfare law and reporting | RA 8485 (as amended by RA 10631), neglect/abuse signs, how to report to the barangay or FuRescue |
| 6. Being a responsible community member | Leash and waste rules, noise, strays, humane treatment, volunteering |

**Quiz:** 8 questions, pass ≥ 80%.

### 2.6 Writing rules

- One idea per lesson; 150–300 words plus an image or diagram.
- Use "you" and concrete examples; avoid jargon.
- Every lesson ends with a one-line "Try this today" action.
- Quiz explanations are mandatory and reference the lesson.
- All medical/legal claims reviewed by the admin team before publishing.

---

## 3. Data model

The schema already defined the e-learning tables in the init migration. The
service uses them as-is:

- `LearningModule` — course, category, description, cover, `isPublished`, soft delete.
- `Lesson` — ordered text/video/image/PDF content under a module.
- `Quiz` + `QuizQuestion` — one final quiz per course; `optionsJson` holds the
  option list and `correctOption` is the index of the correct answer.
- `UserLearningProgress` — per-user lesson completion (`not_started` / `in_progress` / `completed`).
- `QuizAttempt` — server-scored attempts with score percentage and pass flag.

Add to `prisma/schema.prisma`:

```prisma
enum LessonStatus {
  draft
  published
  archived
}

model Course {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String
  summary         String
  description     String   @db.Text
  level           String   @default("beginner") // beginner | intermediate
  estimatedMinutes Int     @default(15)
  coverImageUrl   String?
  status          LessonStatus @default(draft)
  sortOrder       Int      @default(0)
  passScore       Int      @default(80)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  lessons         Lesson[]
  progress        CourseProgress[]
  attempts        QuizAttempt[]

  @@index([status, sortOrder])
}

model Lesson {
  id          String   @id @default(cuid())
  courseId    String
  slug        String
  title       String
  summary     String?
  body        String   @db.Text // markdown or TipTap JSON
  mediaUrl    String?
  sortOrder   Int      @default(0)
  status      LessonStatus @default(draft)
  updatedAt   DateTime @updatedAt

  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  questions   QuizQuestion[]
  completions LessonCompletion[]

  @@unique([courseId, slug])
  @@index([courseId, sortOrder])
}

model QuizQuestion {
  id          String   @id @default(cuid())
  lessonId    String?  // null = course-level final quiz
  courseId    String
  prompt      String   @db.Text
  type        String   @default("single") // single | multiple | true_false
  options     Json     // [{ id, label }]
  correctIds  Json     // ["a"]
  explanation String   @db.Text
  sortOrder   Int      @default(0)

  lesson      Lesson?  @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@index([courseId, sortOrder])
}
```

Learner state:

```prisma
model LessonCompletion {
  userId     String
  lessonId   String
  completedAt DateTime @default(now())

  lesson     Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, lessonId])
}

model QuizAttempt {
  id          String   @id @default(cuid())
  userId      String
  courseId    String
  score       Int      // 0–100
  passed      Boolean
  answers     Json     // [{ questionId, selectedIds, correct }]
  startedAt   DateTime @default(now())
  completedAt DateTime?

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course        Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@index([userId, courseId])
}

model CourseCompletion {
  userId      String
  courseId    String
  bestScore   Int
  completedAt DateTime @default(now())

  @@id([userId, courseId])
}
```

Notes:

- `body` stores markdown to keep the admin editor simple; render with a shared
  `MarkdownContent` component and sanitize on write.
- Quiz scoring is server-side only; never send `correctIds` or `explanation`
  before submission.
- Reuse the existing auth session resolver and role checks used by other admin
  services.

---

## 4. Admin page UX (`/admin/learning`)

### 4.1 Layout

```
Admin shell (sidebar, search, live refresh)
└─ Page header: group eyebrow "Community", title "E-learning", description
   └─ KPI strip (4 cards)
   └─ Catalog section
      ├─ Toolbar: SearchInput, status TabFilters, "New course" Button
      ├─ Course table/cards inside ScrollArea
      └─ Pagination
```

**KPI strip** (reuse the `Kpi` recipe from notifications):

| KPI | Value | Tone |
| --- | --- | --- |
| Published courses | count where status = published | success |
| Drafts | count where status = draft | warning |
| Learners | distinct users with ≥ 1 completion | ink |
| Completion rate | completed / enrolled (%) | ink |

**Catalog rows:** cover thumbnail, title, lesson count, estimated time, status
`Badge`, learners, average score, updated date, row actions.

**Tabs:** `TabFilters` — All / Published / Drafts / Archived with counts.

**Row actions:** Edit, Preview, Duplicate, Publish/Unpublish, Archive, Delete.
All state changes go through `ConfirmDialog` with optimistic updates and toasts.

### 4.2 Course editor (overlay)

Use `OverlayCard` with a two-column layout:

- **Left:** course details (title, slug, summary, description, level, estimated
  minutes, pass score, cover image URL) and status.
- **Right:** lesson list (drag to reorder, add/remove) and per-lesson editor.
- Lesson editor: title, summary, markdown body with preview, media URL, and quiz
  questions (prompt, type, options, correct answer, explanation).
- Save as draft / Publish. Validation: at least one lesson, final quiz has ≥ 3
  questions, every question has an explanation and a correct answer.
- Unsaved-changes guard before closing.

### 4.3 Learner progress (admin tab)

- Filter by course and completion status.
- Table: learner name, course, lessons completed, best score, attempts, last
  activity.
- Row expansion shows attempt answers and the failed questions.
- Export CSV (stretch).

---

## 5. Learner experience (public `/learn`)

- Catalog cards: cover, title, summary, level, duration, progress ring when signed in.
- Course page: lesson list, mark-complete, final quiz.
- Lesson reader: markdown content, optional media, "Try this today" callout,
  previous/next navigation.
- Quiz: one question at a time, progress dots, submit at the end, immediate
  score with explanations, retry allowed.
- Completion card: course title, score, date; shareable (later).
- Signed-out users can read `preview` lessons but must sign in to track progress
  or take quizzes.
- Mobile-first; no horizontal scrolling; tap targets ≥ 44 px.

Suggested routes:

```
/learn                         → catalog
/learn/[courseSlug]            → course detail
/learn/[courseSlug]/[lessonSlug] → lesson reader + quiz
```

### 5.1 Entry points

- Admin dashboard card ("Continue learning").
- Adopter dashboard: "Prepare for your pet" banner linking to Course 1 + 4.
- Post-adoption notification: "Start Responsible Pet Ownership 101".
- Adoption form completion screen: optional learning path.

---

## 6. API routes

Admin (session + `admin` role required):

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/admin/learning/courses` | List with filters, counts, pagination |
| POST | `/api/admin/learning/courses` | Create course |
| PATCH | `/api/admin/learning/courses/[id]` | Update details/status/order |
| DELETE | `/api/admin/learning/courses/[id]` | Delete (confirm, cascade) |
| POST | `/api/admin/learning/courses/[id]/duplicate` | Duplicate as draft |
| GET/POST | `/api/admin/learning/courses/[id]/lessons` | List/create lessons |
| PATCH/DELETE | `/api/admin/learning/lessons/[id]` | Update/delete lesson |
| POST | `/api/admin/learning/lessons/[id]/questions` | Upsert questions |
| GET | `/api/admin/learning/progress` | Learner progress + attempts |

Learner (authenticated where noted):

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/learning/courses` | Published catalog |
| GET | `/api/learning/courses/[slug]` | Course + published lessons (no answers) |
| POST | `/api/learning/lessons/[id]/complete` | Mark lesson complete (auth) |
| POST | `/api/learning/courses/[id]/quiz` | Score submitted answers (auth) |
| GET | `/api/learning/progress` | Current user's progress (auth) |

Validation with the existing schema library; return typed error envelopes used
elsewhere in the app. Rate-limit quiz submissions per user.

---

## 7. Reuse & conventions

- `Badge` tones: success = published/passed, warning = draft, danger = archived/failed, info = in review.
- `ScrollArea` for catalog and progress lists; add `group` to the surrounding column.
- `Pagination` for catalog and progress tables.
- `TabFilters` for status; `SearchInput` for title/summary search.
- `ConfirmDialog` for publish/archive/delete and quiz reset.
- `useToast` for all mutation feedback; optimistic updates keyed per course.
- `AdminLiveRefresh` for server truth after successful mutations.
- Empty states via `SearchEmpty`; loading states as skeletons, not spinners.
- Palette via `globals.css` tokens; no new hardcoded hex values.

---

## 8. Notifications integration

Emit notifications through `notificationsService`:

| Event | Recipient | Title |
| --- | --- | --- |
| Course published | all community users (batched) | "New course: Responsible Pet Ownership 101" |
| Course completed | the learner | "You completed {course} — {score}%" |
| Quiz failed | the learner | "Keep going — review and retry {course}" |
| Adoption approved | adopter | "Prepare for your new pet: start Course 1" |

Avoid notifying the admin who performed the publish. Respect existing
recipient scoping and read-state behavior.

---

## 9. Implementation phases

### Phase 1 — Schema & admin catalog

- Prisma models + migration + seed with the five courses and lessons.
- Admin service + list/create/update/delete routes.
- Replace the `/admin/learning` placeholder with the real page: KPIs, tabs,
  search, list, pagination, empty states.

### Phase 2 — Authoring

- Course editor overlay with lesson markdown editor and reordering.
- Quiz builder with validation.
- Publish/archive workflow, duplicate, preview.
- Optimistic UI + confirmations + toasts.

### Phase 3 — Learner experience

- Public catalog and course pages.
- Lesson reader, mark-complete, quiz taking and scoring.
- Progress tracking and completion cards.
- Sign-in gating for quizzes and progress.

### Phase 4 — Insights & notifications

- Admin progress tab with attempts and CSV export.
- Course KPI accuracy (completion rate, average score).
- Notification hooks and dashboard entry points.

---

## 10. Acceptance criteria

1. An admin can create a course, add lessons and quiz questions, and publish it
   from `/admin/learning` without touching the database.
2. Drafts never appear in the learner catalog.
3. A signed-in learner can complete lessons, pass a quiz (≥ pass score), and see
   their progress persist across sessions.
4. Quiz answers are never exposed to the client before submission; scoring is
   server-side and attempts are stored.
5. Admin KPIs and progress lists match the stored data after a refresh.
6. All destructive actions confirm first, update optimistically, and roll back
   with an error toast on failure.
7. The page follows the shared admin UI conventions (Badge tones, ScrollArea,
   Pagination, TabFilters, ConfirmDialog, toast feedback).
8. Mobile layout is usable at 360 px wide with no horizontal scroll.
9. Seeded content covers responsible ownership, dog behavior, basic dog
   training, cat behavior/care, and health/community awareness.

---

## 11. Risks & decisions

| Risk | Mitigation |
| --- | --- |
| Content accuracy (medical/legal) | Require admin review before publish; cite RA 8485 and RA 9482; date-stamp lessons |
| Quiz cheating | Server-side scoring, rate limiting, randomized option order |
| Large media | Store URLs only; upload to Supabase Storage with size limits |
| Scope creep | Ship text + image lessons first; video hosting later |
| Low engagement | Short lessons, progress nudges, entry points from adoption flow |
| Markdown XSS | Sanitize on write and render with a safe renderer |
