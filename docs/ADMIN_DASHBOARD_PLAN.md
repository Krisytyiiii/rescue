# Admin Dashboard — Content & Layout Plan

> Working brainstorm for `/admin`. Goal: a dashboard that answers "what needs my
> attention right now?" in the first five seconds, then lets the admin act without
> leaving the page.

---

## 1. Purpose & audience

**Who:** program admins (Mati City animal welfare program).
**When:** start of shift, between field tasks, end-of-day review.
**Top questions the page must answer:**

1. What is waiting on me? (approvals, reports, adoption requests)
2. Is the rescue pipeline healthy? (backlog, staleness, throughput)
3. Is the team covered? (roles, barangays, workload)
4. What changed recently? (trends, new animals, outcomes)

**Non-goals:** full CRUD, deep analytics, report authoring. Those live in the
module pages; the dashboard links out.

---

## 2. Current state (what already exists)

| Area | Content | Notes |
| --- | --- | --- |
| Header | Greeting, date, system status | Static "System operational" chip |
| KPI row | Pending rescuers, open reports, animals in care, adoption requests | Counts only |
| Charts | Reports activity (30d), animal population (dogs/cats) | Good baseline |
| Program at a glance | Report pipeline, animal lifecycle | Bar breakdowns |
| Operations workspace | Quick actions (6 tiles) | Compact grid |
| Approvals + team | Rescuer approvals list, roles/coverage | Recently redesigned |

**Gaps spotted:** no "needs attention / aging" signal, no recent activity feed,
no rescue outcome metrics, no barangay-level coverage detail, no time-range
control, KPIs have no comparison (vs yesterday / last week).

---

## 3. Guiding principles

- **Action first.** Anything pending gets a one-click path to act.
- **One screen, one story.** Top → bottom: *urgent → health of program → navigate*.
- **Progressive density.** Calm surfaces, detail on hover/expand.
- **No dead space.** Equal-height rows; empty states that explain the next step.
- **Link, don't duplicate.** Cards summarize; module pages own the detail.

---

## 4. Proposed layout (top → bottom)

### Row 0 — Page header
- Greeting + date (keep).
- **Time-range selector** for trend/chart sections: 7d / 30d / 90d.
- System status chip (keep), optionally show last data refresh time.
- Primary actions: `New report`?, `Review approvals`, `View rescue board`.

### Row 1 — "Needs attention" strip (new, high value)
A compact, horizontal attention bar with 3–4 actionable counters:

- **Pending rescuer approvals** — count + oldest wait time, CTA "Review".
- **Reports awaiting verification** — count + oldest age, CTA "Verify".
- **Stale in-progress reports** — open > 48h without status change.
- **Adoption requests pending review** — count + CTA.
- Optional: **Health checkups due today/this week**.

Why: turns passive KPI numbers into a to-do list.

### Row 2 — KPI cards (refine existing)
Keep four headline metrics, add **delta** vs previous period and sparkline:

1. Open reports (+ new today)
2. Animals in care
3. Pending rescuer approvals
4. Adoption requests

Optional fifth/sixth: **Rescues completed (30d)**, **Adoptions finalized (30d)**.

### Row 3 — Trends
- **Reports activity** (existing) — stacked by status over time, not just volume.
- **Rescue outcomes** — rescued / reunited / adopted / deceased trend.
- Optional: **Response time** — report submitted → first assignment.

### Row 4 — Operations (3 cards, keep current structure)
1. **Quick actions** — module shortcuts (keep compact 2×3 grid).
2. **Rescuer approvals** — profile-style cards, latest pending accounts,
   approve inline, "View all".
3. **Team & coverage** — accounts by role, barangays covered, animals on record.

### Row 4.5 — Resident reports intake (new)
Surface what residents are actually sending in, not just totals:

- **Intake summary:** reports today / this week, broken by `reportType`
  (stray, injured, abandoned) and `urgencyLevel` (critical/high first).
- **Verification queue:** unverified resident submissions, newest first, as
  compact cards with photo thumb, species, urgency chip, barangay + landmark,
  time since submitted, and `Verify` / `Reject` / `Mark duplicate` actions.
- **Quality signals:** missing photo, no barangay match, possible duplicates,
  anonymous/walk-in reports (nullable `reporterUserId`).
- **Reporter context:** full name/email of the resident (or "Anonymous" when
  `reporterUserId` is null), number of prior reports, and a small trust flag for
  repeat/spam reporters.
- **Coverage heat:** which barangays are reporting (top 5) — feeds the
  coverage table later.
- **Inline actions:** verify, reject with a fixed reason (duplicate,
  insufficient info, not an emergency, false/spam), or mark as duplicate.
- **Summary strip:** small counts for today, critical/high urgency, and
  unverified at the top of the card — secondary to the action queue.

Why: resident reports are the program's front door. Admins should triage the
inbox from the dashboard instead of discovering it inside `/admin/reports`.

### Row 5 — Program health (existing, refine)
- **Report pipeline** breakdown with counts + aging.
- **Animal lifecycle** breakdown with counts.
- Consider merging into a single "Pipeline" card with tabs.

### Row 6 — Recent activity (new)
Unified feed: new report verified, rescuer approved, animal intake, adoption
submitted, status change. Each row: actor, action, subject, time, link.
Why: gives the dashboard a "pulse" and helps handoff between admins.

### Row 7 — Coverage table (later)
- Barangay table with report counts, open cases, last activity.
- No map — table only (decided).

---

## 5. Brainstorm backlog

### Quick wins (low effort, high clarity)
- Add deltas + "new today" to KPI cards.
- Rename pipeline labels to match real statuses; show 0 rows.
- Attention strip with counts + links.
- "Oldest pending" timestamps on approvals and reports.
- Consistent empty states with CTA.

### Medium
- Time-range toggle driving charts.
- Recent activity feed (derived from existing tables).
- Inline approve/reject on adoption requests.
- Stale-report highlight.
- Team workload: reports/assignments per rescuer.
- **Resident report triage panel** — verify/reject/duplicate inline.
- **Resident reporter profile** — prior report count, verified rate, last seen.
- **Report detail preview** on hover: photo, description, map pin, landmark.

### Resident-report specific ideas
- **Duplicate clustering:** group reports within ~100m and similar species so
  admins verify once (schema already has `duplicateOfReportId`).
- **Urgency SLA:** highlight critical reports not verified within 15 min.
- **Photo-first cards:** most triage decisions are made from the image.
- **Anonymous vs registered split:** registered reporters can be followed up;
  anonymous ones need landmark/barangay confidence.
- **"Reported by" strip:** top barangays and top reporters this week.
- **Rejection reasons:** quick pick (duplicate, insufficient info, not an
  animal emergency) to keep data clean.

### Larger / later
- Response-time and outcome funnel analytics.
- Barangay coverage table with drill-down.
- Assignment suggestions (nearest rescuer with capacity).
- Notifications / daily digest.
- Exportable weekly operations summary.

### Wild ideas (parking lot)
- "Today at a glance" printable shift brief.
- Health-check reminders surfaced on dashboard.
- Success stories / impact counters for stakeholders.
- Role-based dashboard variants (admin vs rescuer).

---

## 6. Data needed (per section)

| Section | Source (Prisma) | Notes |
| --- | --- | --- |
| Attention strip | `report.groupBy(status)`, `user` pending, `adoptionRequest.count`, timestamps | Need `updatedAt` ordering for staleness |
| KPI deltas | counted by date window | Reuse trend query |
| Reports trend | `report.createdAt` + status | Group by day + status |
| Rescue outcomes | `animal.lifecycleStatus` / `report.status` history | Needs status history or `updatedAt` |
| Approvals | `authService.listPendingRescuers()` | Keep |
| Resident reports intake | `report` (`reportType`, `urgencyLevel`, `status`, `barangayId`, `submittedAt`, `verifiedAt`, `reporterUserId`) | Filter `status = submitted` for queue |
| Report quality | `ReportMedia`, `duplicateOfReportId`, null `barangayId` | Photo presence + duplicate links |
| Reporter context | `user` + `report` count per reporter | Watch nullable `reporterUserId` |
| Team & coverage | `role`, `barangay`, `animal` counts | Keep |
| Activity feed | union of recent rows across tables | Needs a shared event shape |
| Barangay table | `barangay` + report join | Later |

**Watch-outs:** avoid N+1 queries; keep the page server-rendered and batch with
`Promise.all`; ensure counts use the same status constants as the module pages.

---

## 7. UX states to define

- **Empty:** no pending approvals → "Queue is clear" (exists); no reports today.
- **Loading:** skeleton per card, especially charts and attention strip.
- **Error:** partial failures should not blank the page; show a retry per card.
- **Zero vs unknown:** distinguish `0` from "not loaded".

---

## 8. Responsive & accessibility

- ≥1280px: 3-card row as designed.
- 768–1279px: KPI 2×2, cards stack 2-up, charts full width.
- <768px: single column, horizontal scroll avoided.
- Keyboard: all links/actions focusable; tooltips also on focus.
- Contrast: text `/45` and below should be checked against WCAG AA for small text.

---

## 9. Proposed rollout

1. **Phase 1 — decide & polish:** KPI deltas, needs-attention strip, resident
   verification queue (verify/reject with fixed reasons), empty/loading/error
   states, real health check + refresh time, header alignment.
2. **Phase 2 — pulse:** recent activity feed, auto-refresh controls, time-range
   toggle for charts.
3. **Phase 3 — insight:** outcome/response-time analytics, barangay coverage table.
4. **Phase 4 — automation:** digests, assignment suggestions, alerts.

---

## 10. Decisions log

| # | Question | Decision |
| --- | --- | --- |
| 1 | Open statuses | `submitted`, `verified`, `assigned`, `in_progress` (unchanged) |
| 2 | Staleness detection | Use `report.updatedAt` |
| 3 | Refresh behavior | Live push via SSE (`/api/admin/live`); client re-renders on change, no manual refresh |
| 4 | Role handling | One layout; hide sections by permission |
| 5 | Barangay coverage | Table only (no map) |
| 6 | System status chip | Real health check + last data refresh time |
| 7 | Reporter privacy | Show full identity to admins |
| 8 | Rejection reasons | Fixed list: duplicate, insufficient info, not an emergency, false/spam |
| 9 | Resident reports focus | Action queue first, summary stats secondary |
| 10 | Phase 1 scope | KPI deltas, needs-attention strip, resident verification queue, UX states, live status chip, header alignment |

### Still to confirm

- ~~Auto-refresh interval (proposal: 60s, pause when tab is hidden).~~ Implemented
  as a server-pushed SSE stream that checks for changes every 3s and re-renders
  the page automatically.
- Which permissions gate which sections (post-decision on role handling).
- Exact phase-1 KPI deltas baseline (yesterday vs previous 7-day average).
- Report detail preview: inline expand vs link to `/admin/reports`.
