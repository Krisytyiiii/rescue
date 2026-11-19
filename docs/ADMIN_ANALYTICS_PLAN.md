# Admin — Analytics (`/admin/analytics`)

**Status:** planned (route currently resolves through the `ADMIN_MODULES` placeholder at `apps/web/src/app/admin/(console)/[module]/page.tsx`)
**Route:** `apps/web/src/app/admin/(console)/analytics/page.tsx` (new), replacing the placeholder for this slug
**Metadata:** `apps/web/src/lib/admin/modules.ts` → `analytics`
**Nav:** `apps/web/src/components/admin/admin-sidebar.tsx` → Insights → "Analytics"
**Group:** Insights
**Objective:** #5 — Generate descriptive analytical reports and statistics on adoption trends, rescue efficiency, and geographic distribution of cases.
**Related:** `docs/ADMIN_REPORTS_PLAN.md`, `docs/ADMIN_ADOPTIONS_PLAN.md`, `docs/COMMUNITY_FEED_PLAN.md`

---

## 1. Goal

A read-only reporting workspace that turns existing operational data into clear
descriptive statistics. It answers three questions for the city vet office:

1. **Adoption trends** — are animals moving into homes, how fast, and where do
   applications succeed or stall?
2. **Rescue efficiency** — how quickly do reports become verified, assigned,
   reached, and resolved?
3. **Geographic distribution** — which barangays generate cases, and where are
   rescues and adoptions concentrated?

This is descriptive analytics only. No forecasting or ML. Every number must be
traceable to records the admin already uses (reports, rescue operations,
adoptions, animals, barangays).

---

## 2. Global controls

A single filter bar sits at the top of the page and applies to every tab:

- **Date range** — presets `7d`, `30d`, `90d`, `12m`, `All`, plus a custom range
  picker. Default `30d`.
- **Barangay** — multi-select, default all.
- **Species** — `All` / `Dogs` / `Cats` / `Other`.
- **Compare** — toggle to overlay the previous equivalent period (dashed line).
- **Export** — current tab as CSV; "Generate report" for a saved PDF/CSV record.
- URL state: filters live in search params so views are shareable and survive
  refresh.

All timestamps use Asia/Manila (`en-PH`) and day boundaries at local midnight.

---

## 3. Tabs and metrics

### 3.1 Overview (landing)

KPI `StatCard` row for the selected range, with trend deltas vs. the previous
period:

| KPI | Definition |
| --- | --- |
| Reports received | `Report` rows with `submittedAt` in range |
| Rescue success rate | Completed rescues ÷ assigned rescues |
| Animals adopted | `AdoptionRequest` with `status = approved/released` and `releaseDate` in range |
| Median time to adoption | median(`releaseDate − createdAt`) for released adoptions |
| Avg response hours | mean(`RescueOperation.arrivedAt − Report.submittedAt`) |
| Active barangays | distinct `barangayId` with at least one report in range |

Below the KPIs: a small activity sparkline (reports vs. adoptions) and a
barangay hotspot mini-map linking to the Geography tab.

### 3.2 Adoption trends

**Charts**

1. **Applications over time** — stacked area/line: submitted, under review,
   approved, rejected. Previous-period comparison.
2. **Funnel** — submitted → under review → interview scheduled → approved →
   released, with conversion % between stages.
3. **Time to adoption** — distribution (histogram) of days from application to
   `releaseDate`, split by species.
4. **Adoption rate by species** — adopted ÷ animals available in range.
5. **Follow-up health** — share of released adoptions with a completed
   `AdoptionFollowup`, and average follow-ups per adoption.

**Table** — adoptions by barangay: applications, approvals, approval rate,
median days to adoption.

**Definitions**

- Approved = `AdoptionStatus.approved` (and `released` once released).
- Rejected = `rejected` / `withdrawn` / `cancelled`.
- Time to adoption uses `releaseDate` when present, otherwise `reviewedAt`.
- Deleted requests (`deletedAt`) are excluded everywhere.

### 3.3 Rescue efficiency

**Charts**

1. **Report → rescue funnel** — submitted → verified → assigned → in progress →
   rescued; rejected and unable-to-locate shown as exits.
2. **Stage durations** — horizontal bars for mean and median hours:
   - verification: `Report.verifiedAt − submittedAt`
   - dispatch: `RescueOperation.assignedAt − Report.verifiedAt`
   - travel: `RescueOperation.arrivedAt − assignedAt`
   - field time: `completedAt − arrivedAt`
   - total resolution: `completedAt − submittedAt`
3. **Weekly throughput** — reports resolved vs. operations completed.
4. **Outcome mix** — donut: rescued, unable to locate, rejected, still open.
5. **Rescuer workload** — assignments per rescuer per week (bars), plus
   completion rate.

**Table** — per barangay: received, verified, rescued, avg response hours,
median resolution hours, open backlog.

**Definitions**

- "Response" = time from report submission to first rescuer arrival.
- "Resolution" = time from submission to the operation's `completedAt`.
- Open backlog = reports in `submitted`, `verified`, `assigned`, `in_progress`.
- Duplicate reports (`duplicateOfReportId`) are excluded from efficiency ratios
  but still counted in raw volume.

### 3.4 Geographic distribution

**Visual**

1. **Barangay heat map** — Leaflet choropleth-style density layer using report
   coordinates, respecting the existing heat-map rules (additive blobs,
   blue→red ramp, `requestAnimationFrame`). Toggle: reports / rescues /
   adoptions.
2. **Barangay ranking** — horizontal bars of case counts, top 10.
3. **Species split by barangay** — small stacked bars.
4. **Urgency mix by barangay** — low / medium / high / critical.
5. **Coverage gaps** — barangays with high reports but low rescue completion,
   flagged with a warning tone.

**Table** — barangay roster: reports, open cases, rescued, adopted, avg response
hours, last activity date. Sortable, exportable.

Unassigned coordinates (`barangayId = null`) roll into "Unspecified" and are
listed separately so coverage gaps are visible.

### 3.5 Generated reports

Uses the existing `GeneratedReport` model.

- Choose **kind** (`adoption_summary`, `rescue_efficiency`,
  `geographic_distribution`, `monthly_operations`), date range, and format
  (CSV / PDF placeholder).
- Generation runs server-side, stores `fileUrl`, `generatedBy`, and timestamps.
- History table: kind, range, format, generated by, created at, download link.
- Re-running the same kind/range creates a new record (audit-friendly).

---

## 4. Data sources

| Metric group | Primary tables |
| --- | --- |
| Adoption trends | `AdoptionRequest`, `AdoptionFollowup`, `Animal` |
| Rescue efficiency | `Report`, `ReportStatusHistory`, `RescueOperation` |
| Geographic distribution | `Report` (lat/lng + `barangayId`), `Barangay` |
| Cached long ranges | `AnalyticsSnapshot` (daily by barangay/species) |
| Saved exports | `GeneratedReport` |

### Live vs. snapshot

- Ranges ≤ 90 days: query live tables (accurate, cheap at current volume).
- Ranges > 90 days or "All": read `AnalyticsSnapshot` aggregates, falling back
  to live queries when a snapshot day is missing.
- A nightly job writes `AnalyticsSnapshot` rows (one per barangay × species per
  day) so long-range charts stay fast.

### Query rules

- Always exclude `deletedAt != null`.
- Use `submittedAt` for report cohorts and `createdAt` for adoption cohorts.
- Round percentages to whole numbers; hours to one decimal.
- Return empty-safe shapes so charts render a friendly empty state, never NaN.

---

## 5. API

Read endpoints (admin role required):

| Method | Route | Notes |
| --- | --- | --- |
| `GET` | `/api/admin/analytics/overview` | KPIs + deltas |
| `GET` | `/api/admin/analytics/adoptions` | series, funnel, distributions, table |
| `GET` | `/api/admin/analytics/rescues` | funnel, durations, throughput, workload |
| `GET` | `/api/admin/analytics/geography` | barangay aggregates + points |
| `GET` | `/api/admin/analytics/reports` | generated report history |
| `POST` | `/api/admin/analytics/reports` | create a `GeneratedReport` |
| `GET` | `/api/admin/analytics/export` | stream CSV for a tab + filters |

All endpoints accept `from`, `to`, `barangayIds`, `species`, and `compare`.
Computation lives in the core service; routes are thin.

---

## 6. Core module

```
packages/core/src/modules/analytics/
  analytics.types.ts        # DTOs (series, funnel, tables, filters)
  analytics.schema.ts       # zod filters and export input
  analytics.repository.ts   # Prisma aggregations + snapshots
  analytics.service.ts      # metric formulas, comparison, rounding
  index.ts
```

Service guarantees:

- One `AnalyticsFilter` type shared by every tab.
- Pure helper functions for averages, medians, rates, and deltas (unit-testable).
- No PII in outputs — counts only, never reporter or adopter identities.
- Consistent empty results: `{ value: 0, series: [] }`, never `null` charts.

---

## 7. Files

- `apps/web/src/app/admin/(console)/analytics/page.tsx`
- `apps/web/src/components/admin/analytics/analytics-console.tsx`
- `apps/web/src/components/admin/analytics/analytics-filters.tsx`
- `apps/web/src/components/admin/analytics/overview-tab.tsx`
- `apps/web/src/components/admin/analytics/adoption-trends-tab.tsx`
- `apps/web/src/components/admin/analytics/rescue-efficiency-tab.tsx`
- `apps/web/src/components/admin/analytics/geography-tab.tsx`
- `apps/web/src/components/admin/analytics/generated-reports-tab.tsx`
- Charts reuse the existing `apps/web/src/components/admin/charts/` patterns.
- `apps/web/src/app/api/admin/analytics/*/route.ts`
- `packages/core/src/modules/analytics/*`
- `packages/core/src/index.ts` export
- `scripts/snapshot-analytics.mjs` for the nightly rollup

Reuse shared UI: `StatCard`, `TabFilters`, `SecondaryTabFilters`, `Pagination`,
`SearchEmpty`, `ConfirmDialog` (for report generation), `Tooltip`, `ScrollArea`.

---

## 8. Phases

1. **Foundations** — core module, filter type, live queries, overview KPIs.
2. **Adoption trends** — charts, funnel, distribution, barangay table.
3. **Rescue efficiency** — stage durations, throughput, workload.
4. **Geography** — heat map, ranking, coverage-gap table.
5. **Generated reports** — create/save/download, history table.
6. **Snapshots + polish** — nightly job, long-range fallback, empty states,
   mobile layout, CSV export.

---

## 9. Acceptance criteria

- Every tab responds to the global date range, barangay, and species filters and
  reflects them in the URL.
- Adoption trends show applications, approvals, rejections, and time to
  adoption, with totals matching the Adoptions console for the same range.
- Rescue efficiency shows verification, dispatch, travel, field, and total
  resolution times derived from real timestamps.
- Geographic distribution plots reports by barangay and lists coverage gaps.
- No chart renders `NaN`, `Infinity`, or a blank canvas on empty data.
- CSV export downloads the currently filtered dataset.
- Generated reports are stored in `GeneratedReport` with the actor and range and
  appear in history.
- All figures exclude soft-deleted records and never expose personal data.
