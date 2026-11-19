# Admin — Rescue operations (`/admin/rescues`)

**Status:** planned
**Module metadata:** `ADMIN_MODULES.rescues` (`apps/web/src/lib/admin/modules.ts`)
**Route:** `apps/web/src/app/admin/(console)/rescues/page.tsx`
**Group:** Operations
**Replaces:** the placeholder rendered by `(console)/[module]/page.tsx`

**Design direction:** a **rescue command center**, not another stats-plus-table
page. Map-first, live, keyboard-driven, with the dispatch queue and field
progress visible at the same time. No standalone stat-card row.

---

## 1. Purpose

One operational surface where an admin can:

- Watch field operations live on a map.
- Dispatch verified reports to idle rescuers without leaving the page.
- Follow dispatch → accepted → en route → on site → completed.
- Rescue stalled, declined, failed, or overdue assignments.
- Read outcomes and hand completed rescues into animal intake.

Report verification stays on `/admin/reports`. This page is execution only.

---

## 2. Layout concept

A full-width console that fills the content area, with three cooperating
panes instead of a vertical stack of cards:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ COMMAND BAR                                                                  │
│ Rescue operations            ● Live · 3 in field · 2 unassigned   [⌘K Search] │
│ Wed, Nov 19 · 14:32          [ Map ] [ Board ] [ List ]        [ + Dispatch ] │
├──────────────────────────────────────────────────────────────────────────────┤
│ STATUS RAIL (segmented, doubles as tabs — not stat cards)                    │
│  All 42 │ Unassigned 5 │ Pending 3 │ En route 2 │ On site 1 │ Done 31 │ Issues│
├───────────────────────┬──────────────────────────────────┬───────────────────┤
│ DISPATCH QUEUE        │ OPERATIONS CANVAS                │ LIVE FEED          │
│ 5 verified reports    │ map | kanban | table             │ activity stream    │
│ ┌───────────────────┐ │   ╭──────────────────────────╮   │ 14:31 Ana accepted │
│ │ RPT-0001 · Injured│ │   │  ●   ●        ●          │   │        RPT-0004    │
│ │ Dahican · 12m ago │ │   │      ●    ◉ selected     │   │ 14:28 Ben on site  │
│ │ [ Assign ▾ ]      │ │   │  ●        ●              │   │ 14:12 Dispatch…    │
│ └───────────────────┘ │   ╰──────────────────────────╯   │                   │
│ ┌───────────────────┐ │   hover preview · cluster count  │  Rescuer capacity  │
│ │ RPT-0002 · Stray  │ │                                  │  Ana ▓▓▓░ 2 open   │
│ └───────────────────┘ │                                  │  Ben ▓▓░░ 1 open   │
├───────────────────────┴──────────────────────────────────┴───────────────────┤
│ BOTTOM DRAWER (collapsed by default) — selected operation detail / timeline  │
└──────────────────────────────────────────────────────────────────────────────┘
```

Behaviour:

- **≥ 1440 px:** three panes visible (queue · canvas · feed).
- **1024–1439 px:** queue collapses to a toggleable left sheet; map + feed stay.
- **< 1024 px:** single column. Map on top, then status rail, then list. Queue
  and feed become tabs below the map.
- Panes resize independently; the canvas is always the visual anchor.

The page intentionally has **no hero header** and **no four stat cards**. The
status rail carries counts and filtering at once.

---

## 3. Command bar

| Element | Detail |
| --- | --- |
| Title | `Rescue operations` — `font-display`, one line |
| Live line | Pulsing moss dot + `Live · {inField} in field · {unassigned} unassigned` |
| Clock | Local time + date, updated client-side (suppress only the seconds) |
| View switch | Segmented control: **Map · Board · List** (URL `?view=`) |
| Search | `⌘K` / `Ctrl+K` command palette (reports, rescuers, operations) |
| Primary action | **Dispatch** → opens the dispatch composer |
| Alerts | Amber chip when `Issues > 0`, links to the Issues filter |

Command palette commands: “Dispatch report…”, “Find rescuer…”, “Open
operation…”, “Show overdue”, “Toggle feed”, “Switch to board/map”.

---

## 4. Status rail

A horizontal segmented rail. Each segment is a filter, a live count, and an
indicator colour. It replaces the stat cards entirely.

| Segment | Filter | Tone |
| --- | --- | --- |
| All | none | neutral |
| Unassigned | verified reports without an operation | clay |
| Pending | `assignmentStatus = pending` | amber |
| En route | `en_route` | teal |
| On site | `on_site` | teal strong |
| Done | `completed` | moss |
| Issues | `declined`, `failed`, overdue | red |

Counts animate on live updates; the active segment uses a filled pill. On
mobile the rail scrolls horizontally with a fade edge.

---

## 5. Pane 1 — Dispatch queue

A focused list of **verified reports with no open operation**, ready to send.

- Card rows: report code, type + species chips, urgency edge, barangay,
  landmark snippet, “verified {x} min ago”, distance hint.
- Hover expands a mini-map thumbnail of the report location.
- **Assign ▾** opens an inline rescuer picker (not a page navigation):
  - Rescuer rows with avatar, open-count meter, distance to scene.
  - Selecting a rescuer opens `ConfirmDialog` -> closes instantly, row leaves
    the queue optimistically, canvas pin flips to Pending.
- **Dispatch** in the command bar opens a composer for multi-select dispatch:
  pick reports on the left, rescuer on the right, confirm once.
- Empty state: “Queue clear — nothing waiting for dispatch” with a quiet check
  mark, not a dead panel.
- Sort: oldest verified first by default; toggle by urgency/distance.

---

## 6. Pane 2 — Operations canvas

Three interchangeable views, same data and selection state.

### 6.1 Map view (default)

- Reuses the Leaflet map language from `ReportLocationMap` (Esri street tiles,
  light theme), extended to multi-pin operations.
- Pin colour = assignment status tone (amber, blue, teal, green, red).
- Selected pin grows with a halo; hover shows a floating preview card
  (report code, rescuer, status, elapsed, quick actions).
- Cluster pins at low zoom with counts; click a cluster to zoom in.
- “Your location” blue dot and locate button retained.
- Legend in the corner; overlays for traffic-style urgency rings are optional.
- Click a pin -> opens the bottom detail drawer, map recenters smoothly.

### 6.2 Board view

Kanban columns: **Unassigned · Pending · Accepted · En route · On site ·
Completed · Issues**.

- Cards show report code, rescuer avatar, elapsed timer, urgency edge.
- Drag a card between **Pending → Accepted → En route → On site → Completed**
  is **not** allowed for admins (field state belongs to the rescuer). Instead:
  - Drag **Unassigned → a rescuer lane** dispatches.
  - Drag an issue card to **Reassign** opens the picker.
- Column headers show counts; collapsed columns become slim rails on narrow
  screens.
- Keyboard alternative: focus a card, `M` opens a “move” menu.

### 6.3 List view

A dense table for audit work, not the default.

| Column | Content |
| --- | --- |
| Operation | Report code + type |
| Rescuer | Avatar + name / “Unassigned” |
| Status | Pill with correct tone |
| Assigned | Date/time |
| Elapsed | Live ticking duration |
| Barangay | Name or dash |
| Actions | Contextual (Assign, Reassign, Intake, View) |

Sticky header; row click selects and opens the drawer.

---

## 7. Pane 3 — Live feed

Vertical activity stream driven by the admin live channel plus optimistic
actions:

- Entries: `Ana accepted RPT-0004`, `Ben arrived on site`, `Dispatch sent`,
  `Intake created for RPT-0011`, `Assignment declined`.
- Each entry has an actor avatar, relative time, and a link to the operation.
- New entries slide in; the pane does not scroll-jump while the user reads.
- `Pause` / `Resume` control and a filter for “mine / all”.
- Below the feed: **Rescuer capacity** — compact avatar rows with a small
  capacity meter and open count; clicking filters the canvas and list.

---

## 8. Bottom drawer — operation detail

Slides up from the bottom over the canvas (max height 60vh, drag handle);
on wide screens it can dock to the right side instead. Uses `OverlayCard`
semantics for focus/Escape but is not a blocking modal.

Sections, arranged in tabs inside the drawer:

1. **Overview** — report summary, landmark, mini map, urgency, reporter.
2. **Timeline** — assigned → accepted → en route → arrived → completed with
   actor and timestamp, plus report status history.
3. **Field notes** — `outcomeNotes`, `animalsRescued`, failure/decline reason.
4. **Hand-off** — link to resulting animal or **Create intake**.
5. **Actions** — reassign, cancel, mark failed (confirmed).

The drawer persists while switching map/board/list, so selection is never lost.

---

## 9. Interaction rules

- Every write confirms in `ConfirmDialog`, closes instantly, updates the card,
  pin, rail count, and feed optimistically, then runs the request in the
  background. Revert + `FormAlert` on failure.
- No blocking spinners over the canvas. Busy work shows as a subtle pulse on
  the affected card/pin only.
- Selection, view, and filters live in the URL (`?view=&focus=&status=`), so a
  reload or shared link restores the exact console.
- Keyboard: `⌘K` palette, `J/K` move selection, `Enter` open drawer,
  `A` assign selected, `Esc` close, `?` shortcuts overlay.
- Motion: 150–200 ms pane/drawer transitions; respect `prefers-reduced-motion`
  via `MotionConfig reducedMotion="user"`.
- Empty, loading, and error states are pane-level, so one failing pane never
  blanks the console. Loading uses shimmer rows/pins, not full-page skeletons.

---

## 10. Responsive rules

| Width | Behaviour |
| --- | --- |
| ≥ 1440 | 3 panes; drawer docks right |
| 1024–1439 | queue as left sheet; feed collapsible |
| 768–1023 | map on top; rail below; list/board tabs; feed tab |
| < 768 | single column; sticky command bar; bottom sheet detail; horizontal rail |

Touch targets ≥ 40 px; drag interactions have non-drag alternatives.

---

## 11. Data & API plan

### 11.1 Read models

`RescueConsoleItem`:

```ts
{
  id: string | null;                 // null = unassigned report
  reportId: string;
  reportCode: string;
  reportType: "stray" | "injured" | "abandoned";
  reportStatus: ReportStatus;
  species: "dog" | "cat" | "unknown";
  urgencyLevel: "low" | "medium" | "high" | "critical";
  barangay: string | null;
  locationLandmark: string | null;
  latitude: number;
  longitude: number;
  rescuer: { id: string; fullName: string } | null;
  assignedBy: string | null;
  assignmentStatus: AssignmentStatus | "unassigned";
  assignedAt: string | null;
  completedAt: string | null;
  animalsRescued: number | null;
  outcomeNotes: string | null;
  resultingAnimalCode: string | null;
  elapsedSeconds: number | null;
}
```

`RescueFeedEntry`, `RescuerCapacity`, and `RescueDetail` (timeline + notes)
are separate streamed payloads so panes hydrate independently.

### 11.2 Service methods (packages/core)

- `rescuesService.console(query)` — panes payload: queue, operations,
  counts, workload (single round trip).
- `rescuesService.feed(since)` — recent activity entries.
- `rescuesService.getById(id)` — detail + timeline.
- `rescuesService.assign(actor, reportId, rescuerUserId)` — reuse
  `reportsService.assignRescuer`.
- `rescuesService.cancel(actor, id)` / `markFailed(actor, id, reason)`.
- `rescuesService.createIntake(actor, id)` — idempotent per operation.

All mutations: audit log + status history + rescuer/reporter notification.

### 11.3 Routes

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/admin/rescues` | Console payload (`view`, `focus`, filters) |
| GET | `/api/admin/rescues/feed` | Feed entries since cursor (SSE optional) |
| GET | `/api/admin/rescues/[id]` | Detail + timeline |
| POST | `/api/admin/rescues/[id]/cancel` | Cancel assignment |
| POST | `/api/admin/rescues/[id]/fail` | Mark failed (reason) |
| POST | `/api/admin/rescues/[id]/intake` | Create animal intake |

Assignment reuses `POST /api/admin/reports/[id]/assign`.

---

## 12. Visual system

- Surfaces: white panes on the `paper` canvas, `ink/[0.07]` hairlines, one
  shared 12 px radius family.
- Accent: clay for primary/dispatch, moss for success/completed, amber for
  pending, teal for in-field, red for issues.
- Status colours always paired with a text label.
- Dense typography: 11–13 px labels, tabular numerals for timers.
- No gradients beyond the photo overlay used by report cards.
- Icons: `lucide-react`, 1.8–2 stroke, reused consistently.

---

## 13. Implementation phases

1. **Console shell** — route, command bar, status rail, 3-pane layout,
   responsive collapse, URL state.
2. **Canvas** — map view with status pins, clusters, selection, mini preview;
   list view for fallback.
3. **Dispatch** — queue pane, inline rescuer picker, optimistic dispatch,
   multi-select composer.
4. **Board + drawer** — kanban view, bottom/side detail drawer with timeline.
5. **Live** — feed pane, rescuer capacity, live refresh, feed pause.
6. **Outcomes** — cancel, fail, intake hand-off.
7. **Polish** — skeleton states, keyboard shortcuts, palette, motion,
   reduced-motion, mobile pass, empty/error states.

---

## 14. Acceptance criteria

- `/admin/rescues` is a three-pane command center, not a stat-row + table page.
- Map, board, and list share selection and URL state; switching views never
  loses the focused operation.
- Verified unassigned reports can be dispatched from the queue or composer;
  the overlay closes instantly and every pane updates optimistically.
- Status tones match meaning (pending amber, accepted blue, in-field teal,
  completed green, declined amber, failed red).
- Live feed updates without scroll-jumping; capacities update after assignment.
- Completed rescues hand off to intake exactly once.
- Cancel/fail require confirmation and a reason, revert on failure, and write
  audit entries.
- Keyboard-first: palette, pane navigation, drawer open/close, shortcuts help.
- Works at 360 px, 768 px, 1280 px, and 1600 px widths.
