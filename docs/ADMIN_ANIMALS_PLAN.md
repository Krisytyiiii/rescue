# Admin — Animals (`/admin/animals`)

**Status:** implemented (phase 1–5)
**Module metadata:** `ADMIN_MODULES.animals` (`apps/web/src/lib/admin/modules.ts`)
**Route:** `apps/web/src/app/admin/(console)/animals/page.tsx`
**Group:** Operations
**Replaces:** the placeholder rendered by `(console)/[module]/page.tsx`
**Core module:** `packages/core/src/modules/animals/*`

---

## 1. Objectives

Give administrators and rescuers one workspace to manage every animal the
organization knows about, from intake to adoption or archive.

Primary objectives:

1. **Single source of truth** — every rescued, surrendered, born-in-care, or
   community-posted animal has one profile with a human-readable code
   (`FR-YYYY-NNNN`).
2. **Lifecycle control** — move animals through the allowed state machine
   (`reported → rescued → under_care → available → adoption_pending → adopted`,
   plus `returned_to_owner` and `deceased`) with the reason recorded and audited.
3. **Moderation** — review community-submitted adoption posts (`pending_review`)
   before they become public, and reject or archive them with a reason.
4. **Intake efficiency** — create a rescue intake from a verified report in a
   few fields, carrying the report code, photos, and location context forward.
5. **Welfare visibility** — surface health records, vaccinations, weight, and
   adoption activity on the animal profile without leaving the page.
6. **Auditability** — every lifecycle change, listing decision, edit, and
   archive is written to the audit log with before/after values.

Success looks like: an admin can finish a rescue intake, publish an adoption
listing, and move an animal to `adopted` using only `/admin/animals`, with each
action confirmed and reflected immediately.

### Non-goals

- Authoring full health records (that stays in `/admin/health`; this page shows
  a read-only summary and links out).
- Reviewing adoption applications (owned by `/admin/adoptions`; this page shows
  the count/status and links to the animal's applications).
- Editing community users or rescuers (owned by `/admin/users`).
- Uploading large 3D models here — the schema supports `model3dUrl`, but the
  first phase only displays an existing model link.

---

## 2. Page layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Page header                                                          │
│  H1 "Animals"                                                        │
│  Subtitle: manage profiles, intake, lifecycle, and adoption listings.│
│                          [ Live animal feed ] [ New intake ]         │
├──────────────────────────────────────────────────────────────────────┤
│ Stat cards (4)                                                       │
│  [ In care ] [ Available ] [ Adoption pending ] [ Pending review ]   │
├──────────────────────────────────────────────────────────────────────┤
│ Moderation queue (collapsible, only when pending_review > 0)         │
│  ┌ card ──────────────────────────────────────────────────────────┐  │
│  │ 🐕 FR-2026-0031 · Brownie          Community post · Pending    │  │
│  │ Posted by Angela Dela Cruz · Nov 19, 2026                      │  │
│  │                          [ Review ] [ Publish ] [ Reject ]     │  │
│  └────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│ Animals panel                                                        │
│  Tabs: All · In care · Available · Adoption pending · Adopted ·      │
│        Pending review · Archived                                     │
│  Toolbar: search · species · sex · size · lifecycle · listing · sort │
│  ┌ grid or table ──────────────────────────────────────────────────┐ │
│  │ Photo | Code/name | Species | Sex/Age | Lifecycle | Listing |   │ │
│  │ Origin | Intake | Actions                                       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  Footer: Showing 1–10 of 132        [ Previous ] Page 1 of 14 [ Next]│
└──────────────────────────────────────────────────────────────────────┘
```

Responsive behaviour:

- **≥ xl:** 4 stat cards in one row; table with all columns.
- **sm–lg:** 2×2 stat cards; table hides `Origin` and `Intake`.
- **< sm:** table becomes stacked animal cards (thumbnail + code/name,
  species/breed, lifecycle and listing badges, intake date, action row).
  Toolbar filters wrap and remain reachable.
- The list can also be viewed as a card grid (thumbnail-first) via a view
  toggle — reuse the banner-card language from the reports grid.

---

## 3. Header

| Element | Detail |
| --- | --- |
| Title | `Animals` — `font-display`, same scale as reports/rescues |
| Description | “Manage animal profiles, media, lifecycle state, and public listing moderation.” |
| Primary action | `New intake` button (admin/rescuer) opens the create overlay |
| Right badge | `Live animal feed` with muted dot, mirroring the other consoles |

Use `AdminLiveRefresh` so new intakes, listing submissions, and lifecycle
changes from other sessions appear without a manual reload.

---

## 4. Stat cards

Use the shared `StatCard` component. Counts are **global** (unfiltered) and
stream in a Suspense boundary so the shell paints first.

| Card | Source | Tone / icon |
| --- | --- | --- |
| In care | `lifecycleStatus ∈ {rescued, under_care}` | moss / `HeartPulse` |
| Available | `lifecycleStatus = available` | info / `Home` |
| Adoption pending | `lifecycleStatus = adoption_pending` | pending / `ClipboardList` |
| Pending review | `listingStatus = pending_review` | warning / `ShieldAlert` |

Existing `animalsService.getCounts()` returns `{ inCare, available, adopted }`.
Extend it (or add `getAdminCounts()`) to include `adoptionPending`,
`pendingReview`, `adopted`, and `total`; the card row can show `Adopted` as a
fifth card on wide screens or as the “Available” card subtitle.

---

## 5. Moderation queue

Community submissions (`originType = community_post`) are created with
`listingStatus = pending_review` and must be reviewed before they are public.

- Section is hidden when the queue is empty; show a quiet “Queue is clear” line
  instead of an empty card.
- Shows up to 3 oldest pending submissions: thumbnail, animal code, name,
  poster, submitted date, and a short description preview.
- “View all pending” sets the table filter to `listing=pending_review`.
- **Review** opens the animal detail drawer scrolled to the media/listing
  section.
- **Publish** opens `ConfirmDialog` (“Publish this listing?”) with the
  consequence that it becomes visible on the public site. On confirm the dialog
  closes immediately, the card is removed optimistically, and
  `POST /api/admin/animals/[id]/listing` runs in the background.
- **Reject** opens a dialog that collects a required reason, then calls the same
  endpoint with `rejected`. The poster is notified automatically by the service.

All three actions follow the optimistic + revert pattern in AGENTS.md.

---

## 6. Animals panel

### 6.1 Tabs

Client-side tabs that update the URL, seeded from search params so views are
shareable.

| Tab | Query |
| --- | --- |
| All | none |
| In care | `lifecycle=rescued,under_care` (or two requests merged) |
| Available | `lifecycle=available` |
| Adoption pending | `lifecycle=adoption_pending` |
| Adopted | `lifecycle=adopted` |
| Pending review | `listing=pending_review` |
| Archived | `listing=archived` |

Tabs show live counts in a subtle pill when available. “All” excludes
soft-deleted animals by default (repository already filters `deletedAt`).

### 6.2 Toolbar

- **Search** (debounced 250–300 ms): animal code, name, description.
- **Species**: Any · Dog · Cat.
- **Sex**: Any · Male · Female · Unknown.
- **Size**: Any · Small · Medium · Large.
- **Lifecycle**: Any · Reported · Rescued · Under care · Available ·
  Adoption pending · Adopted · Returned to owner · Deceased.
- **Listing**: Any · Draft · Pending review · Published · Rejected · Archived.
- **Sort**: Newest intake · Oldest intake · Recently updated · Code A–Z.
- **View**: table / cards toggle.
- **Clear filters** appears only when a filter is active.

Every change pushes the URL and immediately swaps the results for a skeleton
(keyed Suspense), never leaving stale rows visible.

### 6.3 Table columns

| Column | Content | Notes |
| --- | --- | --- |
| Animal | Thumbnail or species placeholder, `animalCode`, name | Primary cell; opens drawer |
| Species | Species + `breedType` (Aspin, Puspin, Mixed, Other) | Badge or muted text |
| Sex / age | Male/Female/Unknown · `estimatedAgeMonths` humanized (“1 yr 3 mo”) | “Unknown” when null |
| Lifecycle | Badge per `LifecycleStatus` | Tone per status |
| Listing | Badge per `ListingStatus` | Hidden `< lg` |
| Origin | Humanized `originType`; link to source report when present | Hidden `< xl` |
| Intake | `intakeDate` formatted `MMM d, yyyy` | Hidden `< md` |
| Actions | Row menu (see 6.4) | Right-aligned |

Row click opens the detail drawer. Keyboard: `Enter` opens, focus ring visible.

Badge tones (existing `Badge` component):

- Lifecycle: reported `pending`, rescued `info`, under_care `progress`,
  available `success`, adoption_pending `pending`, adopted `success`,
  returned_to_owner `neutral`, deceased `neutral`.
- Listing: draft `neutral`, pending_review `warning`, published `success`,
  rejected `danger`, archived `neutral`.

Icons per species: dog `Dog`, cat `Cat`; fall back to `PawPrint`.

### 6.4 Row actions

All actions confirm in an overlay and update optimistically (AGENTS.md rules).
Actions shown depend on role and current state.

| Actor / state | Actions |
| --- | --- |
| admin, any listing | **View**, **Edit**, **Change status**, **Archive** |
| admin, `pending_review` | **Review**, **Publish**, **Reject** |
| rescuer, `rescued`/`under_care`/`available` | **View**, **Edit**, **Change status** |
| rescuer, `pending_review` | **View**, **Review** only (no publish) |

`Edit` and `Change status` are disabled for `adopted`,
`returned_to_owner`, and `deceased` — those are terminal states in
`ANIMAL_LIFECYCLE_TRANSITIONS`. `Archive` is admin-only.

### 6.5 Pagination

10 rows per page. Footer: “Showing 1–10 of 132” + Previous/Next, same pattern
as the reports page. Server-driven; preserve active filters in the URL.

---

## 7. Animal detail drawer

Opens from a row or a moderation card; width ~560px on desktop, full-height
sheet on mobile. Uses the shared `OverlayCard` shell and `ScrollArea` body.

Header: photo, `animalCode`, name, species/breed badge, lifecycle badge,
listing badge, and a compact action bar (`Edit`, `Change status`, `Archive`).

Sections/tabs:

1. **Overview**
   - Identity: species, breed type, sex, estimated age, size, color/markings,
     temperament, weight, neutered, microchip.
   - Origin: `originType`, intake date, link to source report
     (`/admin/reports?q=<reportCode>`), poster (`/admin/users?q=<email>`).
   - Description.
   - Photo/video gallery (primary photo first; 3D model link if present).
2. **Lifecycle**
   - Current status and a vertical timeline of transitions
     (from audit entries: old → new, actor, remarks, timestamp).
   - Allowed next states rendered as buttons, derived from
     `ANIMAL_LIFECYCLE_TRANSITIONS` so the UI cannot request an invalid move.
3. **Health** (read-only summary)
   - Latest 5 `healthRecords` and `vaccinations` from `animalDetailInclude`.
   - Weight trend if multiple records exist.
   - “Open health records” link to `/admin/health?animal=<code>`.
4. **Adoptions**
   - Counts by status plus the most recent requests (animal name, applicant,
     status). “Open applications” links to `/admin/adoptions?animal=<code>`.
5. **Timeline**
   - Merged activity: created, edits, lifecycle changes, listing decisions,
     archive. Paginated or “show more” beyond 20 entries.

No PII beyond the poster's name is shown. Drawer actions use the same
confirmation overlays as the table.

---

## 8. New intake / edit form

Opens in an `OverlayCard` (or full-page on small screens) headed **New animal
intake** / **Edit animal**. Field groups:

1. **Intake** — origin (`rescue_report`, `community_post`, `surrender`,
   `born_in_care`), source report lookup by code (optional, unique), intake date
   (defaults today).
2. **Identity** — species*, breed type*, sex*, name, estimated age (months),
   size, color/markings, temperament.
3. **Medical** — weight (kg), neutered, microchip number.
4. **Listing** — listing status (admin only; rescuers default to
   `pending_review`), description, photos.
5. **Media** — upload photos with captions and sort order; set a primary photo.

Rules:

- `animalCode` is generated server-side (`FR-YYYY-NNNN`) and never editable.
- Community posts always start at `pending_review`; staff-created intakes
  default to `draft` (admin) or `pending_review` (rescuer) per the service.
- `rescue_report` origin should link a verified report; the code lookup shows
  the report code, species, barangay, and status before saving.
- Validation errors appear inline; the submit button is not disabled globally —
  use the existing form patterns and `FormAlert` for request failures.
- On success: close the overlay, optimistically prepend the new animal to the
  list, then refresh once the request resolves.

---

## 9. Change status dialog

A single dialog that lists only the legal next states from
`ANIMAL_LIFECYCLE_TRANSITIONS[current]`, each with a short consequence note:

| Target | Consequence copy |
| --- | --- |
| `rescued` | “Marks the animal as picked up and heading to care.” |
| `under_care` | “Animal is now in the shelter’s care.” |
| `available` | “Animal becomes eligible for adoption and can be listed publicly.” |
| `adoption_pending` | “Pauses new applications while one is being finalised.” |
| `adopted` | “Closes the case, sets the adoption date, and archives the listing.” |
| `returned_to_owner` | “Closes the case as returned; the profile becomes read-only.” |
| `deceased` | “Closes the case as deceased; the profile becomes read-only.” |

Required behaviour:

- Collect an optional remarks field; require it for `deceased` and
  `returned_to_owner`.
- Show the transition as a status banner (current → next) with tone colors.
- On confirm: close immediately, update the badge optimistically, fire
  `POST /api/admin/animals/[id]/lifecycle`, revert on failure.
- `adopted` additionally archives the listing — reflect both badges.

---

## 10. Confirmation copy

| Action | Title | Description | Confirm |
| --- | --- | --- | --- |
| Publish listing | Publish this listing? | “{Code} will be visible on the public adoption site immediately.” | Publish listing |
| Reject listing | Reject this listing? | “The poster will be notified with your reason. They can edit and resubmit.” | Reject listing |
| Archive | Archive this animal? | “{Code} is removed from active lists. History and health records are kept.” | Archive animal |
| Change status | Move {Code} to {status}? | Consequence line from §9. | Confirm status |
| Edit | Save changes to {Code}? | “Profile details will update immediately.” | Save changes |

Tone: publish `success`, reject/archive `danger`, status `default`, edit
`default`. Rejection must collect a reason inside the dialog.

---

## 11. Data & API plan

### 11.1 Read model

`AnimalListRow` (derived from `AnimalDetail`):

```ts
{
  id: string;
  animalCode: string;
  name: string | null;
  species: "dog" | "cat";
  breedType: "aspin" | "puspin" | "mixed" | "other";
  sex: "male" | "female" | "unknown";
  estimatedAgeMonths: number | null;
  size: "small" | "medium" | "large" | null;
  colorMarkings: string | null;
  temperament: string | null;
  weightKg: string | null;
  isNeutered: boolean;
  microchipNo: string | null;
  originType: "rescue_report" | "community_post" | "surrender" | "born_in_care";
  sourceReport: { id: string; reportCode: string; status: string } | null;
  postedBy: { id: string; firstName: string; lastName: string } | null;
  lifecycleStatus: LifecycleStatus;
  listingStatus: ListingStatus;
  intakeDate: string | null;
  adoptedDate: string | null;
  primaryPhotoUrl: string | null;
  media: Array<{ id: string; mediaType: "photo" | "video"; fileUrl: string; caption: string | null; sortOrder: number | null }>;
  healthRecords: Array<{ id: string; recordType: string; recordDate: string; diagnosis: string | null }>;
  vaccinations: Array<{ id: string; vaccineName: string; dateGiven: string; nextDueDate: string | null }>;
  createdAt: string;
  updatedAt: string;
}
```

### 11.2 Service methods (packages/core)

Already available in `animalsService`:

- `list(query, actor)` — paginated; staff sees all listing states.
- `getById(id, actor)` — detail include (media, source report, poster, health,
  vaccinations).
- `getByCode(code, actor)`.
- `create(input, actor)` — role-guarded; generates `animalCode`; audit + admin
  notification for community posts.
- `update(id, input, actor)` — admin/rescuer; listing changes admin-only; audit.
- `updateLifecycle(id, status, remarks, actor)` — transition-validated; sets
  `adoptedDate` and archives listing on `adopted`; audit.
- `moderateListing(id, status, remarks, actor)` — admin-only; notifies poster.
- `archive(id, actor)` — admin-only; soft delete + audit.
- `getCounts()` — global counts for the stat row; extend with pending review.

Add:

- `listPendingReview(limit)` — oldest community posts awaiting review.
- `getActivity(id)` — audit entries for the timeline.
- `getAdminCounts()` — total, inCare, available, adoptionPending, pendingReview.
- `media` helpers for add/remove/reorder (or handle in `update`).

### 11.3 Routes (apps/web/src/app/api/admin/animals)

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/admin/animals` | Paginated list (`q`, `species`, `sex`, `size`, `lifecycle`, `listing`, `page`, `sort`) |
| GET | `/api/admin/animals/[id]` | Detail + activity summary |
| POST | `/api/admin/animals` | Create intake |
| PATCH | `/api/admin/animals/[id]` | Edit profile/listing fields |
| POST | `/api/admin/animals/[id]/lifecycle` | Transition lifecycle with remarks |
| POST | `/api/admin/animals/[id]/listing` | Publish / reject / archive listing |
| POST | `/api/admin/animals/[id]/archive` | Archive animal |
| POST | `/api/admin/animals/[id]/media` | Add/reorder media (phase 2) |
| DELETE | `/api/admin/animals/[id]/media/[mediaId]` | Remove media (phase 2) |

Every mutation: admin session required (create/update/lifecycle also allow
rescuers), validate input with the existing schemas, write the audit log, and
return a typed payload `{ ok: true, data }`. Follow the optimistic/confirm rules
in AGENTS.md.

---

## 12. Lifecycle state machine (source of truth)

From `ANIMAL_LIFECYCLE_TRANSITIONS`:

```
reported          → rescued | under_care | returned_to_owner | deceased
rescued           → under_care | returned_to_owner | deceased
under_care        → available | adoption_pending | returned_to_owner | deceased
available         → adoption_pending | under_care | deceased
adoption_pending  → adopted | available | under_care
adopted           → (terminal)
returned_to_owner → (terminal)
deceased          → (terminal)
```

The UI must derive next states from this map, never hard-code a different list.
Invalid transitions are rejected server-side with `ConflictError`.

---

## 13. Loading, empty, and error states

- **Loading:** skeleton stat cards + skeleton table rows (8) or cards (6), not a
  spinner. Use the existing `ReportsResultsSkeleton` pattern.
- **Empty (no animals):** “No animals yet” + a **New intake** action.
- **Empty (filtered):** “No animals match these filters” + **Clear filters**.
- **Queue clear:** compact success row, not a large empty card.
- **Request error:** inline `FormAlert` above the list with a retry action.
- **Action error:** optimistic change reverts; a non-blocking alert keyed to the
  affected animal; the rest of the list stays interactive.
- **Stale refresh:** a live refresh must not clear optimistic state for rows
  whose request has not resolved yet.

---

## 14. Accessibility

- Table uses real `<table>` semantics or a labelled grid with a caption.
- Row actions reachable by keyboard; menus close on Escape and outside click.
- Confirmation dialogs use `role="alertdialog"` with labelled title and
  description (shared `ConfirmDialog`).
- Status is never conveyed by color alone — always a text label.
- Focus returns to the triggering control after a dialog closes.
- The detail drawer traps focus, restores it on close, and closes on Escape.
- Photos have meaningful alt text (“Photo of FR-2026-0031, Brownie”).
- Reduced motion: respect `MotionConfig reducedMotion="user"`; no animation that
  changes content.

---

## 15. Security & guardrails

- Only `admin` and `rescuer` sessions can read this page; `community_user`
  sessions are redirected.
- Listing publish/reject and archive are **admin-only**.
- Lifecycle transitions are validated server-side against the map above.
- `animalCode` and `microchipNo` are unique; surface conflicts as field errors,
  not 500s.
- Soft delete only (`deletedAt`) — never hard-delete animals.
- The source report link never exposes reporter contact data beyond what the
  reports page already shows.
- All mutations are audit-logged with old/new values and remarks.
- Media uploads validate type and size before sending (limits shared with
  `ADMIN_MODULES.settings`).

---

## 16. UI conventions (required)

Follow `apps/web/AGENTS.md`:

- Banner-style cards: status-colored top rule + tinted gradient, eyebrow,
  monospace code, status badge, collapsible detail body with `aria-expanded`.
- `ScrollArea` for the drawer body and list, never raw `overflow-y-auto`.
- `Badge` + shared meta maps for lifecycle/listing tones.
- `ConfirmDialog` for every state change; optimistic update, immediate close,
  background request, revert + `FormAlert` on failure.
- `AdminLiveRefresh` for live updates.
- Skeletons keyed by filters; no stale rows during navigation.
- Same header scale, spacing, and type tokens as `/admin/reports` and
  `/admin/rescues`.

---

## 17. Implementation phases

1. **Read-only list** — `animals/page.tsx`, server query with filters/pagination,
   stat cards, table/card views, detail drawer (overview + media + lifecycle
   timeline).
2. **Create & edit** — New intake overlay, edit form, media upload, source-report
   lookup, optimistic insertion.
3. **Lifecycle actions** — status dialog driven by the transitions map,
   confirmation, audit remarks, optimistic badges.
4. **Listing moderation** — pending-review queue, publish/reject with reason,
   poster notification, archive.
5. **Welfare integration** — health/vaccination summaries, adoption request
   counts, deep links into `/admin/health` and `/admin/adoptions`.
6. **Polish** — skeletons, responsive cards, empty states, keyboard and
   screen-reader pass, live refresh, admin-only count extension.

---

## 18. Acceptance criteria

- `/admin/animals` no longer renders the placeholder module page.
- Animals list filters by search, species, sex, size, lifecycle, and listing;
  the URL reflects the active view and stale results are never shown.
- A new intake can be created with a generated `FR-YYYY-NNNN` code and appears
  in the list immediately; community submissions are created as
  `pending_review`.
- Lifecycle changes only offer legal next states, require remarks where noted,
  update optimistically, and revert on failure.
- Publishing or rejecting a community listing requires a confirmation, notifies
  the poster, and writes an audit entry.
- Archiving is admin-only, soft-deletes the animal, and keeps history.
- The detail drawer shows overview, media, lifecycle timeline, health summary,
  and adoption activity, with correct links to the source report, poster, health,
  and adoption consoles.
- Layout matches the reports/rescues language: same header scale, `StatCard`,
  `Badge`, `FormAlert`, `ConfirmDialog`, `OverlayCard`, `ScrollArea`, and
  skeleton patterns.
- Works at 360 px, 768 px, and 1280 px widths.

---

## 19. Implementation notes

Implemented files:

- **Page:** `apps/web/src/app/admin/(console)/animals/page.tsx`
- **Components:** `apps/web/src/components/admin/animals/`
  - `animals-console.tsx` — banner cards, workflow actions, profile drawer
  - `animal-health-panel.tsx` — medical history, vaccinations, heart-rate log
  - `animal-intake-dialog.tsx` — new intake form
  - `animals-stats.tsx`, `animals-toolbar.tsx`, `animals-results.tsx`
  - `animals-types.ts`, `animals-utils.ts`, `animals-data.ts`
- **API:**
  - `POST /api/admin/animals`
  - `PATCH /api/admin/animals/[id]`
  - `POST /api/admin/animals/[id]/lifecycle`
  - `POST /api/admin/animals/[id]/listing`
  - `POST /api/admin/animals/[id]/archive`
  - `GET | POST /api/admin/animals/[id]/health`
- **Core:** `animalsService.getAdminCounts()` and `listPendingReview()`.

Workflow as built:

1. Rescue intake or **New intake** creates an animal `under_care`.
2. The primary card action becomes **Ready for adoption**, which moves the
   animal to `available` and publishes the listing in one confirmed step.
3. **Mark adopted** closes an `adoption_pending` case and archives the listing.
4. Admin-posted community animals start at `reported` / `pending_review` and
   need **Publish listing** or **Reject listing** with a reason.

Health monitoring:

- The drawer's **Health monitoring** tab loads live data from the health module.
- Medical records capture type, date, diagnosis, treatment, medication, weight,
  follow-up date, and remarks; recording weight also updates the animal.
- Vaccinations store dose, given/next-due dates, batch lot, and a computed
  `completed | due | overdue` status.
- Heart-rate readings store bpm, context, timestamp, notes, and are flagged
  automatically against the species resting range (dog 60–140, cat 140–220).
  Flagged readings notify admins through the health service.
