# Admin — Health records (`/admin/health`)

**Status:** planned
**Module metadata:** `ADMIN_MODULES.health` (`apps/web/src/lib/admin/modules.ts`)
**Route:** `apps/web/src/app/admin/(console)/health/page.tsx`
**Group:** Welfare
**Replaces:** the placeholder rendered by `(console)/[module]/page.tsx`

**Design direction:** a **welfare desk**, not a duplicate of the animal drawer.
The animals page already owns one animal's history. This page answers the
cross-animal questions: *who needs a vet, whose vaccine is overdue, whose heart
rate is abnormal, and what follow-ups are coming?*

---

## 1. Purpose

One surface where an admin or rescuer can:

- See every animal under care and what its health needs are right now.
- Work the vaccination schedule (due now, overdue) without opening each profile.
- Review medical records across all animals (checkups, illness, injury, surgery…).
- Monitor heart-rate readings and the readings flagged outside the species range.
- Add a visit, a vaccine dose, or a heart-rate reading from one place.
- Catch follow-ups that are due or missed.

Per-animal editing stays in the Animals drawer (`AnimalHealthPanel`,
`HealthEntryDialog`). This page links to it and reuses the same dialogs.

---

## 2. Layout concept

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Animal health                                                                │
│ Medical visits, vaccinations, and heart-rate monitoring for animals in care. │
│                                              [ + Add health entry ]           │
├──────────────────────────────────────────────────────────────────────────────┤
│ STAT CARDS                                                                   │
│  Animals under care 36 │ Vaccinations due 8 │ Overdue 3 │ Flagged heart 2    │
├──────────────────────────────────────────────────────────────────────────────┤
│ WATCHLIST (default tab)                                                      │
│ Status rail: All 47 │ Overdue 3 │ Due soon 8 │ Follow-ups 5 │ Heart flags 2  │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ⚠ RPT… ANM-2026-0012 · Bunso · Aspin · at the city vet                  │ │
│ │    Distemper booster overdue since Nov 12 · 7 days late   [ Add dose ]   │ │
│ ├──────────────────────────────────────────────────────────────────────────┤ │
│ │ ⚑ ANM-2026-0021 · Ming · Puspin · ready for adoption                    │ │
│ │    214 bpm (cat range 140–220) · under stress · Nov 18    [ View log ]   │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ TABS: Watchlist │ Vaccinations │ Medical records │ Heart rate              │
│ TOOLBAR: [Search] [Species ▾] [Status ▾] [Date range]   N results · Page x  │
├──────────────────────────────────────────────────────────────────────────────┤
│ TABLE / CARD LIST (12 per page, local filter)                                │
│ ┌ Animal ─────────────┬ Detail ────────────────────────────┬ Date ── Action ┐ │
│ │ ANM-2026-0012 Bunso │ Distemper · dose 2 · overdue      │ Nov 12  [Edit] │ │
│ └─────────────────────┴────────────────────────────────────┴────────────────┘ │
│ Showing 1–12 of 47                              [ Previous ] [ Next ]        │
└──────────────────────────────────────────────────────────────────────────────┘
```

Behaviour:

- **≥ 1280 px:** stat row + full-width console.
- **768–1279 px:** stats wrap to 2 columns; table columns collapse into the animal
  cell (detail moves under the name).
- **< 768 px:** single column; stats become a horizontally scrollable count rail;
  table rows become cards; toolbar wraps.

No map on this page. This is a work queue and registry.

---

## 3. Header

| Element | Content |
| --- | --- |
| Title | `Animal health` — `font-display`, same scale as Animals |
| Description | “Medical visits, vaccinations, and heart-rate monitoring for animals in care.” |
| Primary action | **Add health entry** → dialog (animal picker, then record / vaccination / heart rate) |
| Verification chip | `Health checks for every animal` (matches Animals page) |
| Last refresh | Quiet line “Updated just now” from `AdminLiveRefresh` |

The primary action opens the existing `HealthEntryDialog`, extended with an
animal-selection step when no animal is preselected.

---

## 4. Stat cards

Four `StatCard`s, each link filters the console:

| Card | Value | Hint | Link |
| --- | --- | --- | --- |
| Animals under care | animals with lifecycle `rescued` / `under_care` | “Rescued or at the city vet” | `?lifecycle=in_care` |
| Vaccinations due | `due` + `overdue` statuses | “Next 7 days and late” | `?tab=vaccinations&status=due` |
| Overdue | `overdue` count | “Past the due date” | `?tab=vaccinations&status=overdue` |
| Flagged heart rate | `isFlagged = true` readings in the last 30 days | “Outside species range” | `?tab=heart_rate&flagged=1` |

Optional fifth/fourth swap: **Follow-ups due** (records with `followUpDate <= today
+ 7d` and no later record for that animal). Use four cards only; follow-ups live
in the watchlist rail.

Tones: under care `moss`, due `amber`, overdue `red`, flagged `forest` (or red
outline — never colour alone; each card has a label).

---

## 5. Tabs

A single console with four tabs. Tab state lives in the URL (`?tab=`).

### 5.1 Watchlist (default)

One prioritized queue, grouped by reason, instead of raw tables:

1. **Overdue vaccinations** — red edge; vaccine, dose, days late, animal status.
2. **Due within 7 days** — amber edge; next due date.
3. **Follow-ups** — records where `followUpDate` is today or earlier and there is
   no newer record for that animal; show the original diagnosis.
4. **Flagged heart rate** — readings outside `HEART_RATE_RANGES[species]` in the
   last 30 days; show bpm, expected range, context, measured date.
5. **No health check yet** — animals `under_care` for > 48 h with zero records.

Each row is a card with a status stripe, the animal identity block
(photo, code, name, species/breed, lifecycle badge), the reason line, and one
contextual action:

- Overdue / due → **Add dose** (opens vaccination dialog prefilled).
- Follow-up → **Add visit**.
- Flagged heart rate → **Review** (opens the animal health drawer at Heart rate).
- No check → **Add checkup**.

A **reason** rail (segmented) filters the queue: All · Overdue · Due soon ·
Follow-ups · Heart flags · No check.

Empty state (all clear): moss check icon, “Nothing needs attention — every animal
under care is up to date.”

### 5.2 Vaccinations

Flat table of every vaccination record, newest `dateGiven` first.

| Column | Content |
| --- | --- |
| Animal | Photo thumb, animal code (mono), name, species/breed |
| Vaccine | Name, dose number chip |
| Given | Date |
| Next due | Date + computed status pill (`completed` moss, `due` amber, `overdue` red) |
| Batch | Lot number or dash |
| Administered by | Staff name or dash |
| Actions | **Edit** (opens `HealthEntryDialog` in edit mode) |

Filters: status (all/completed/due/overdue), species, date range, search
(animal code, name, vaccine, batch). Local filter, 12 rows per page.
Row click opens the animal health drawer on the Health tab.

### 5.3 Medical records

Flat timeline of every `HealthRecord`, newest `recordDate` first.

| Column | Content |
| --- | --- |
| Animal | Photo, code, name, lifecycle badge |
| Type | `Badge` tone per type (checkup, illness, injury, treatment, surgery, deworming, spay/neuter, other) |
| Date | Visit date |
| Diagnosis | Truncated one line, full text on expand |
| Treatment / medication | Short summary |
| Weight | kg (if recorded) |
| Follow-up | Date + “due”/“missed” chip |
| Attended by | Staff name or dash |
| Actions | **Edit** |

Expandable rows (grid-rows animation) reveal treatment, medication, remarks, and
linked heart-rate readings. Filters: record type, species, date range, search.

### 5.4 Heart rate

All readings, newest `measuredAt` first, with a per-animal context strip.

| Column | Content |
| --- | --- |
| Animal | Photo, code, name, species |
| Reading | `NNN bpm` in tabular numerals, red when flagged |
| Expected | Species range (dog 60–140, cat 140–220) |
| Context | Resting / during exam / after activity / under stress |
| Measured | Date/time |
| Notes | Short text |
| Actions | **Edit** |

Toolbar: **Flagged only** toggle, species filter, date range, search.
Optional per-animal sparkline in an expanded row (last 10 readings) drawn with a
plain SVG polyline — no new chart dependency.

---

## 6. Detail drawer

Clicking any row opens a right-side drawer (reuse the Animals drawer pattern and
`OverlayCard` semantics, non-blocking) with:

1. **Summary** — photo, code, name, species/breed, age, weight, lifecycle and
   listing badges, link to `/admin/animals?focus=…`.
2. **Health panel** — the existing `AnimalHealthPanel`, so the drawer is the same
   experience as the Animals page (records, vaccinations, heart rates, edit
   pencils).
3. **Add entry** — the three actions (Medical note, Vaccination, Heart rate)
   opened with that animal preselected.
4. **Quick facts** — last visit, next vaccine due, latest heart rate.

One drawer at a time. Switching tabs preserves the open drawer.

---

## 7. Add / edit flows

- Use the existing `HealthEntryDialog` for create; keep its three-step wizard.
- Editing reuses the existing PATCH `/api/admin/animals/[id]/health` endpoint
  (`kind: record | vaccination | heart_rate`, `entryId`).
- When opened from this page without a preselected animal, prepend an
  **animal picker** step (searchable list of animals under care with photo, code,
  name, species). Selecting one continues into the usual wizard.
- Validation and toasts stay identical to the Animals page.
- Mutations: overlay closes instantly, the table row updates optimistically,
  request runs in the background, success toast, revert + error toast on failure,
  refresh after success (`router.refresh()`).
- Destructive follow-up for planned delete: confirm in `ConfirmDialog`, remove
  row optimistically, restore on failure, audit entry.

---

## 8. Search and filters

Shared behaviour across tabs:

- `SearchInput` — instant local filtering; matches animal code, name, vaccine,
  diagnosis, treatment, batch, notes, staff name.
- Controlled `Select`s for species, status, record type.
- Date range with two `DatePicker`s.
- Filters reset pagination to page 1.
- `SearchEmpty` for “no match” and a separate first-run empty state per tab
  (e.g. “No vaccinations recorded yet”).
- Page size **12**, matching Animals. Footer: `Page x of y · N records` with
  Previous/Next.

---

## 9. Data plan

### 9.1 Read models (`apps/web/src/components/admin/health/health-types.ts`)

```ts
export interface HealthAnimalRow {
  id: string;
  animalCode: string;
  name: string | null;
  species: "dog" | "cat";
  breedType: string;
  sex: string;
  estimatedAgeMonths: number | null;
  weightKg: string | null;
  lifecycleStatus: LifecycleStatus;
  listingStatus: ListingStatus;
  primaryPhotoUrl: string | null;
  hasHealthCheck: boolean;
}

export interface HealthRecordRow {
  id: string;
  animalId: string;
  animal: HealthAnimalRow;
  recordType: HealthRecordType;
  recordDate: string;
  diagnosis: string | null;
  treatment: string | null;
  medication: string | null;
  weightKg: string | null;
  followUpDate: string | null;
  remarks: string | null;
  attendedBy: { id: string; name: string } | null;
  heartRates: HeartRateRow[];
}

export interface VaccinationRow {
  id: string;
  animalId: string;
  animal: HealthAnimalRow;
  vaccineName: string;
  doseNumber: number | null;
  dateGiven: string;
  nextDueDate: string | null;
  batchLotNo: string | null;
  status: "completed" | "due" | "overdue" | null;
  administeredBy: { id: string; name: string } | null;
}

export interface HeartRateRow {
  id: string;
  animalId: string;
  animal: HealthAnimalRow;
  heartRateBpm: number;
  measurementContext: string | null;
  measuredAt: string;
  isFlagged: boolean;
  notes: string | null;
}

export interface HealthCounts {
  underCare: number;
  due: number;
  overdue: number;
  flagged: number;
  followUpsDue: number;
  noCheck: number;
}
```

### 9.2 Service methods (`packages/core/src/modules/health`)

- `healthService.listRecordRows(query)` — all records + animal + attended user +
  heart rates; ordered `recordDate desc`.
- `healthService.listVaccinationRows(query)` — all vaccinations + animal +
  admin user; ordered `dateGiven desc`.
- `healthService.listHeartRateRows(query)` — all logs + animal; ordered
  `measuredAt desc`.
- `healthService.counts()` — the five watchlist numbers plus `underCare`
  (grouped queries, one round trip).
- `healthService.watchlist()` — overdue/due/follow-up/flagged/no-check buckets.
- Existing `getAnimalHealth`, `addRecord`, `addVaccination`, `logHeartRate`,
  `updateRecord`, `updateVaccination`, `updateHeartRate` are reused.
- `healthService.removeRecord/Vaccination/HeartRate` — only if delete ships;
  otherwise omit from phase 1.

Vaccination status is recomputed on read with `VACCINATION_DUE_WINDOW_DAYS = 7`
so tables never show stale statuses, and `refreshVaccinationReminders` still runs
on the admin live refresh.

### 9.3 Routes

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/admin/health` | Counts + watchlist payload |
| GET | `/api/admin/health/records` | Paged medical records (optional; server page can load all) |
| GET | `/api/admin/health/vaccinations` | Paged vaccination rows |
| GET | `/api/admin/health/heart-rates` | Paged heart-rate rows |

Per the “instant local filter” rule already used by Reports, Users, and Animals,
the server page loads the full datasets once with `fetchAllPages`, and the client
console filters, searches, and paginates in memory. API routes above are only
needed if the dataset grows beyond a safe size (e.g. > 2,000 rows), then switch
to server pagination for this page.

---

## 10. Interaction rules

- All mutations follow the project action UX rules: confirm in an overlay, close
  on confirm, optimistic row update, background request, toast feedback, revert
  on failure, refresh only after success.
- No blocking spinners. Row-level pending pulse only.
- Row hover shows the edit affordance (labeled **Edit** tertiary amber button,
  pencil icon) — consistent with the Animals health panel.
- Keyboard: `J/K` move row focus, `Enter` open drawer, `E` edit, `Esc` close.
- Tabs and filters in the URL: `?tab=vaccinations&status=overdue&species=cat&q=`.
- Respect `prefers-reduced-motion`; expand/collapse uses the grid-rows recipe.

---

## 11. Visual system

- Same shell as other consoles: white card on `paper`, `ink/[0.07]` hairlines,
  12 px radius family, `StatCard` row.
- Tones: moss = completed/healthy, amber = due soon, red = overdue/flagged,
  clay = primary actions, neutral = no data.
- Status always has a text label, not colour alone.
- Badges: `Badge` tones; vaccination status and heart-rate flag use the existing
  `VACCINATION_TONES` mapping.
- Dense typography (11–13 px), `tabular-nums` for bpm, weights, and counts.
- Icons: `lucide-react` (Stethoscope, Syringe, HeartPulse, CalendarClock,
  ShieldAlert, ClipboardList), 1.8–2 stroke.
- Scroll containers use `ScrollArea`; hover reveals scrollbars.

---

## 12. Empty / loading / error states

| State | Treatment |
| --- | --- |
| No animals under care | Page-level calm empty state with a link to Animals |
| Tab has no records | Tab-level illustration + “Add first record” action |
| Search/filter has no match | `SearchEmpty` with Clear filters |
| Watchlist clear | Moss check, “Every animal under care is up to date.” |
| Loading | Shimmer table rows / stat placeholders, never a full-page spinner |
| Query failure | Inline `FormAlert` in the console; other tabs keep working |
| Stale data | `AdminLiveRefresh` refreshes server data; local overrides clear on refresh |

---

## 13. Implementation phases

1. **Data layer** — global list + counts + watchlist methods in core, unit
   coverage for overdue/due/flag rules.
2. **Page shell** — route, header, stat cards, tabs, URL state, responsive layout.
3. **Vaccinations tab** — table, status pills, filters, search, pagination,
   edit via existing dialog.
4. **Medical records tab** — table, type badges, expandable details, follow-up
   chips.
5. **Heart rate tab** — flags, expected range, flagged-only toggle, sparkline.
6. **Watchlist** — prioritized queue, reason rail, contextual actions that open
   the right dialog.
7. **Drawer** — reuse `AnimalHealthPanel`, quick facts, deep link to Animals.
8. **Add entry from page** — animal picker step, then the existing wizard.
9. **Polish** — empty/loading/error states, keyboard, mobile pass, a11y labels.

---

## 14. Acceptance criteria

- `/admin/health` is a cross-animal welfare desk, not a copy of the animal drawer.
- Stat cards and the watchlist agree on counts, and every card links to a
  filtered view.
- Vaccination rows show live-computed `completed` / `due` / `overdue`, matching
  the 7-day window used by the core service.
- Heart-rate rows show the expected species range and flag readings outside it;
  the flagged card matches the heart-rate tab filter.
- Search, filters, tabs, and pagination are instant (no fetch per keystroke) and
  live in the URL.
- Adding or editing an entry closes the overlay immediately, updates the row
  optimistically, toasts the result, and reverts on failure.
- The drawer opens the same `AnimalHealthPanel` used on the Animals page and
  deep links back to `/admin/animals?focus=<id>`.
- Works at 360 px, 768 px, 1280 px, and 1600 px widths.
