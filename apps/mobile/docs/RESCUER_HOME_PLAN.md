# Rescuer Home ("Today") - Plan

**Scope:** mobile-only design plan for `apps/mobile`
**Screen:** rescuer home / Today (`src/app/(tabs)/index.tsx` -> `src/features/rescuer/RescuerHomeView.tsx`)
**Related:** `docs/MOBILE_PLAN.md` §3.3 (F1-F8), `packages/core/src/modules/rescues`, `prisma/schema.prisma`

---

## 1. Ground truth

### Role & access

- `user.role === "rescuer"` **and** `accountStatus === "active"` -> rescuer shell.
- Pending rescuers are blocked by a "waiting for approval" screen (matches the web signup flow).
- Mobile already branches on role in `(tabs)/index.tsx` and renders `RescuerHomeView`.

### Data model (schema is the source of truth)

`Report.status`:

```txt
submitted -> verified -> assigned -> in_progress -> rescued | unable_to_locate -> closed
rejected
```

`RescueOperation.assignmentStatus`:

```txt
pending -> accepted -> en_route -> on_site -> completed
                                  \-> failed
pending -> declined
```

`RescueOperation` fields: `reportId`, `rescuerUserId`, `assignedBy`,
`assignmentStatus`, `assignedAt`, `acceptedAt`, `arrivedAt`, `completedAt`,
`outcomeNotes`, `animalsRescued`.

There is **no `is_on_duty` field**, so an availability/duty toggle is deferred
(a `users.is_on_duty` column or `rescuer_availability` table would be needed).

### Backend reality

- `rescuesService` currently exposes only `console()` (admin read model),
  `cancel`, `markFailed`, `createIntake`.
- There is **no `listMine`** and **no rescuer-facing transitions** yet.
- All rescue API routes are admin-scoped (`/api/admin/rescues/...`).
  `/api/rescues/mine` does not exist.
- `apps/mobile/src/data/rescuer-home.ts` is hardcoded **mock** data.

Conclusion: design against the **target contract** below, then land the backend
prerequisites before switching off the mock.

---

## 2. Home = "Today" at a glance

**Purpose:** answer *"What do I do next, right now?"* in under two seconds.
Field-first: big targets, one-thumb reach, sunlight-readable.

### Layout

```txt
┌ Safe area ────────────────────────────────┐
│ Today                       [date] [bell]  │  compact header, unread badge
│                                            │
│ ┌ Banner card (dark glass) ───────────────┐│
│ │  Assigned   In progress   Completed today││  glass gradient stat cards
│ │     3           1              2         ││
│ │  ── active assignment strip ──────────── ││
│ │  FR-2481 · Critical · Dog · 2.4 km       ││
│ │  [ Next action ]                         ││
│ └──────────────────────────────────────────┘│
│                                            │
│ Pending offers (2)          needs response │
│  • card ... [Accept] [Decline]             │
│                                            │
│ En route (1)                               │
│  • card ... [Mark on site]                 │
│                                            │
│ On site (1)                                │
│  • card ... [Complete]                     │
│                                            │
│ Completed today (2)          view history  │
│                                            │
│ Quick actions: [Map] [Queue] [Messages]    │
└────────────────────────────────────────────┘
```

### Rules

- No logo/wordmark, no duty pill, no greeting (per current design direction).
- Banner answers "how is my shift going?" (stats) and "what is the one thing
  now?" (active assignment strip + CTA).
- Sections are grouped by the real `AssignmentStatus` state machine, shown only
  when non-empty, capped (e.g. 3) with a "View all" link.
- One primary CTA per active operation, derived from state (§4).
- Status chips use text + color, never color alone.
- Quick actions: Map, Queue, Messages. History is reachable from Profile and
  "Completed today".

---

## 3. Domain contract to build toward

Replace the mock shape with something derived from `RescueOperationRow` + report.

```ts
type NextAction =
  | "accept"
  | "decline"
  | "start_en_route"
  | "mark_on_site"
  | "complete";

interface RescuerHomeSummary {
  date: string;
  stats: {
    assigned: number;        // active assignments owned by me
    inProgress: number;      // accepted | en_route | on_site
    completedToday: number;  // completed with completedAt = today
  };
  activeAssignment: RescuerAssignment | null; // highest urgency / earliest
  pendingOffers: RescuerAssignment[];          // assignmentStatus = pending
  enRoute: RescuerAssignment[];                // accepted | en_route
  onSite: RescuerAssignment[];                 // on_site
  completedToday: RescuerAssignment[];         // completed
  unreadNotifications: number;
  unreadMessages: number;
  queueCount: number;                          // verified/unassigned (read-only)
}

interface RescuerAssignment {
  id: string;
  reportId: string;
  reportCode: string;
  status: AssignmentStatus;       // exact schema values
  reportStatus: ReportStatus;
  urgency: UrgencyLevel;          // low | medium | high | critical
  species: ReportSpecies;
  reportType: ReportType;
  description: string;
  barangay: string | null;
  landmark: string | null;
  distanceKm: number | null;      // computed from device location
  assignedAt: string;
  elapsedLabel: string;           // presentation only ("18 min ago")
  nextAction: NextAction;
}
```

### Corrections to the current mock

- `urgency: "critical" | "urgent" | "routine"` does **not** match the schema.
  Use `low | medium | high | critical`.
- The mock `completed: 12` is a lifetime count. Home should show
  **completed today**; lifetime totals belong on Profile/History.
- Presentation strings (`distanceKm`, `elapsedLabel`) should be derived in the
  view model, not stored in the domain.

---

## 4. Action mapping (must match schema)

| Assignment state | Primary action | Report status effect | Secondary |
|---|---|---|---|
| `pending` | **Accept** | `assigned -> in_progress` | Decline (reason) |
| `accepted` | **Start driving** (`en_route`) | `in_progress` | Report problem |
| `en_route` | **Mark on site** (`on_site`, sets `arrivedAt`) | `in_progress` | Report problem |
| `on_site` | **Complete** (photos, notes, animals rescued) | `in_progress -> rescued` | Report problem (`failed` -> `unable_to_locate`) |
| `completed` | - (read-only, link to intake) | `rescued` | - |

Rules:

- All transitions scoped to `assignment.rescuerUserId === actor.userId` -> 403
  otherwise.
- Each transition writes status history + audit + notifies reporter/admin.
- Confirm every state change in a bottom sheet; optimistic update then revert
  with inline error on failure.

---

## 5. Navigation implication

Current mobile tabs are `Home / Explore / Create / Messages / Profile`
(resident shell). The design doc calls for a rescuer shell:
`Today / Map / Queue / Messages / Profile`.

Options:

1. **Role-aware tab bar (recommended):** rescuers get Today/Map/Queue/Messages/
   Profile; residents keep their tabs.
2. **Minimal v1:** keep one `index` tab as Today; expose Queue and History as
   stack screens from Today/Profile.

New rescuer routes:

- `(tabs)/index` -> Today (this screen)
- `assignments/[id]` -> detail + field actions
- `queue` -> read-only verified reports awaiting dispatch
- `history` -> completed/failed grouped by month
- `map` -> later phase

---

## 6. Screen states (design now, not default)

- **Loading:** skeleton for banner + 2 assignment cards.
- **Empty:** "No assignments yet. The dispatch team will send rescues here."
  with a Queue link.
- **Pending offers:** highlighted and actionable.
- **Offline:** banner with last-sync time; queued field updates show
  "Pending sync".
- **Error/5xx:** inline retry; keep cached data.
- **401:** sign out to login.
- **403:** "This assignment isn't yours."
- **Pending approval:** blocking screen before the shell.

---

## 7. Backend prerequisites (blocking, ordered)

1. **Bearer token auth** (`MOBILE_PLAN.md` §4.1) - mobile cannot rely on the web
   httpOnly cookie.
2. **`rescuesService.listMine(actor)`** returning active + today's completed
   with report joins (photos, reporter contact once assigned).
3. **Rescuer transitions:** `acceptAssignment`, `declineAssignment`,
   `startEnRoute`, `markOnSite`, `completeOperation`, `reportProblem`, each
   ownership-checked, audited, and notifying.
4. **Routes:** `GET /api/rescues/mine`,
   `POST /api/rescues/:id/{accept,decline,en-route,on-site,complete,fail}`,
   `GET /api/rescues/markers`.
5. **Unread counts:** notifications + conversations.
6. **Media upload** for field photos (§4.3).

Until 1-4 land, the screen stays mocked, structured to the contract above so only
`data/rescuer-home.ts` changes.

---

## 8. Implementation phases (mobile)

### Phase A - Contract + view model (no backend)

- Expand `domain/rescuer.ts` to the real enums/shape.
- `useRescuerHomeViewModel` computes stats, active assignment, and `nextAction`
  via derived selectors (no business logic in views - MVVM/SRP).
- Keep the mock data source but make it schema-realistic (today counts).

### Phase B - Today UI

- Header, banner (stats + active strip), state-grouped sections, quick actions.
- Skeleton/empty/offline/error components.

### Phase C - Assignment detail + actions

- `assignments/[id]`: timeline, map/navigate/call, field capture.
- Transitions behind a repository port (DIP), optimistic updates.

### Phase D - Queue / History / Profile stats

- Read-only queue, history grouped by month, workload stats on Profile.

### Phase E - Wire real API

- Swap the data source implementation; delete the mock.

---

## 9. Acceptance criteria

- Rescuer sees only their own assignments (plus read-only queue).
- Banner stats reconcile with the sections:
  - `assigned` = active owned assignments
  - `inProgress` = `accepted | en_route | on_site`
  - `completedToday` = `completed` with today's `completedAt`
- Active assignment shows the correct `nextAction` for its state.
- Accept -> en route -> on site -> complete works and updates the reporter.
- Loading, empty, offline, error, 401, 403 states are all designed.
- No admin-only action reachable; no invented status values.

---

## 10. Implementation status

- **Phase A (contract + mock + view model):** done.
- **Phase B (Today UI):** done - header, glass banner + active strip, sections,
  loading/empty states.
- **Phase C (assignment detail + actions):** done against an in-memory
  repository port; optimistic transitions with revert.
- **Phase D (Queue + History):** done - read-only queue and month-grouped
  history screens.
- **Phase E (wire real API):** done - `HttpRescuerGateway` talks to
  `GET /api/rescues/mine[?scope=history]`, `GET /api/rescues/:id`,
  `POST /api/rescues/:id/{accept|decline|start_en_route|mark_on_site|complete|fail}`
  and `GET /api/reports?status=verified`. The mobile app uses the API by
  default; set `EXPO_PUBLIC_RESCUER_API=false` to fall back to the in-memory
  placeholder.

---

## 11. Open decisions

1. **Banner contents:** stats only (current UI) or stats + compact
   active-assignment strip + CTA (recommended)?
2. **Tab bar:** role-aware rescuer tabs now, or keep current tabs and expose
   Queue/History via stack for v1?
