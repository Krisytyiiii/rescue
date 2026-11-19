# Admin — Adoptions (`/admin/adoptions`)

**Status:** implemented
**Module metadata:** `ADMIN_MODULES.adoptions` (`apps/web/src/lib/admin/modules.ts`)
**Route:** `apps/web/src/app/admin/(console)/adoptions/page.tsx`
**Group:** Welfare
**Replaces:** the placeholder rendered by `(console)/[module]/page.tsx`

**Design direction:** an **adoption pipeline desk**. Applications arrive from the
public adoption site; this page moves them from *submitted* to *reviewed* to
*interview* to *approved* to *released*, and keeps the post-adoption follow-ups
visible. Only one applicant can be approved per animal, and the backend already
enforces that.

---

## 1. Purpose

One surface where an admin can:

- See every adoption application and where it sits in the pipeline.
- Review an application without opening the animal profile.
- Schedule an interview, approve an adopter, or reject with a reason.
- Complete an adoption and record the release date.
- Log post-adoption welfare checks (in-app, phone, visit).
- Search by request code, adopter, or animal.

Backend support already exists in `packages/core/src/modules/adoptions`
(`adoptionsService.list`, `getById`, `getCounts`, `review`, `complete`,
`addFollowup`). This page is the missing UI.

---

## 2. Data available

`adoptionsService.list()` returns each request with:

- **Request:** `requestCode` (`ADO-YYYY-NNNNN`), `status`, `createdAt`, `reviewedAt`.
- **Animal:** photo, name, `animalCode`, species, lifecycle status.
- **Adopter:** first/last name, email, phone number.
- **Review:** reviewer name, `decisionRemarks`, `interviewSchedule`, `releaseDate`.
- **Home/lifestyle:** `housingType`, `isOwnedProperty`, `hasFencedArea`,
  `householdMembers`, `hasOtherPets`, `otherPetsDetails`, `priorPetExperience`,
  `reasonForAdopting`, `validIdUrl`, `homePhotoUrl`.
- **Follow-ups:** date, method, animal condition, remarks.

`getCounts()` returns `pending`, `approved`, `completed`.

---

## 3. Page layout

### 3.1 Header

- Title: **Adoptions**
- Subtitle: review applications, interview, approve one adopter per animal, and
  follow up after release.
- No global "New" button — applications are submitted from the public site.

### 3.2 Stat cards

| Card | Count |
| --- | --- |
| Pending review | `submitted` + `under_review` |
| Interviews scheduled | `interview_scheduled` |
| Approved · awaiting release | `approved` |
| Completed adoptions | `completed` |

Cards link into the matching status tab.

### 3.3 Status tabs

With live counts:

`All` · `Submitted` · `Under review` · `Interview` · `Approved` · `Completed` · `Closed`

`Closed` groups `rejected` and `withdrawn`.

### 3.4 Toolbar

- Search: request code, adopter name/email, animal name/code.
- Species filter (All / Dogs / Cats).
- Sort: newest first (default) or interview date.
- Clear filters when any filter is active.

### 3.5 Table rows (aligned columns)

Same treatment as the Health page: sticky-feeling header row on desktop, stacked
cards on mobile.

| Column | Content |
| --- | --- |
| Application | `ADO-2026-00042` (mono) + received date + reviewer name when reviewed |
| Animal | photo, name, animal code, species |
| Adopter | name, email, phone |
| Home | housing type, owned/fenced, household size, other pets |
| Key date | contextual (see below) |
| Status | colored badge |
| Action | next-step button + View |

Key date by status:

- `submitted` → "Awaiting review"
- `under_review` → last review date
- `interview_scheduled` → interview date/time
- `approved` → approved date
- `completed` → release date
- `rejected` / `withdrawn` → decision date

Status tones (reuse `Badge`):

| Status | Tone |
| --- | --- |
| submitted | info |
| under_review | warning |
| interview_scheduled | info |
| approved | success |
| completed | success |
| rejected | danger |
| withdrawn | neutral |

---

## 4. Actions

| Status | Allowed actions |
| --- | --- |
| submitted | **Start review**, Reject |
| under_review | **Schedule interview**, Approve, Reject |
| interview_scheduled | Approve, Reject |
| approved | **Complete adoption** |
| completed | Add follow-up |
| rejected / withdrawn | none (view only) |

All actions follow the project's action rules: confirm in an overlay, apply the
change optimistically, close immediately, report via toast, and roll back on
failure.

- **Start review** — `submitted` → `under_review`.
- **Schedule interview** — requires a date/time; `under_review` →
  `interview_scheduled`.
- **Approve** — confirm dialog warns that other open applications for the same
  animal will be auto-rejected and the animal becomes `adoption_pending`.
- **Reject** — collects a required reason; stored in `decisionRemarks`.
- **Complete adoption** — requires a release date; warns that the animal becomes
  `adopted` and its listing is archived.
- **Add follow-up** — only for `approved` / `completed`; date, method (in-app /
  phone / visit), animal condition, remarks.

`scheduled` → rescheduling is **not supported** by the current status machine
(`interview_scheduled` can only move to approved, rejected, or withdrawn), so it
is out of scope unless the service is extended.

---

## 5. Detail drawer

Opening a row shows the full application:

- Header: request code, status badge, submitted date.
- Animal card (photo, name, code, species, lifecycle).
- Applicant card (name, email, phone).
- Living situation: housing type, owned/fenced, household members, other pets,
  prior experience.
- Motivation: `reasonForAdopting`.
- Documents: ID and home photo as links (not inline, for privacy).
- Timeline: submitted → reviewed → interview → approved → released, with
  reviewer and decision remarks.
- Follow-up history + **Add follow-up** when eligible.
- Footer action buttons for the allowed next steps.

---

## 6. Build order

1. `adoptions/page.tsx` (server) — load list + counts, map to client rows
   (`adoptions-data.ts`, `adoptions-types.ts`).
2. `adoptions-workbench.tsx` — stat cards, tabs, toolbar, aligned table,
   pagination.
3. `adoption-detail.tsx` — drawer with timeline and follow-ups.
4. Action dialogs — review / interview / approve / reject / complete / follow-up.
5. Add the route so it overrides the `[module]` placeholder.

Reuse shared UI: `Badge`, `Button`, `Select`, `SearchInput`, `SearchEmpty`,
`OverlayCard`, `ConfirmDialog`, `ScrollArea`, `StatCard`, `useToast`.

---

## 7. Open questions

- Should an admin be able to withdraw/close an application on the adopter's
  behalf? The service only allows the adopter to `withdraw`.
- Should rejected applications stay visible forever, or be archived after a
  period?
- Do we need bulk actions (e.g. auto-reject stale applications), or is
  one-at-a-time review enough for v1?
