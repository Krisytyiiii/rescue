# Admin loading & skeleton audit

**Date:** 2026-11-19
**Scope:** every route under `apps/web/src/app/admin/(console)` and every overlay that fetches data client-side.
**Goal:** no admin surface should show stale content or a blank panel while data is in flight, and every skeleton should mirror the layout of the content it replaces.

---

## 1. How each page loads data

| Page | Route | Initial data | In-page skeleton | Route `loading.tsx` | Match |
| --- | --- | --- | --- | --- | --- |
| Dashboard | `/admin` | awaited on the server | none (whole page awaited) | added — heading, 4 KPIs, 2 chart panels | good |
| Reports | `/admin/reports` | awaited + `fetchAllPages` | stats streamed via `Suspense` (`ReportsStatsSkeleton`); cards use `ReportsResultsSkeleton` | added — heading, 4 KPIs, 6 report cards | good |
| Rescues | `/admin/rescues` | awaited on the server | none | added — heading, split list/map panel | good |
| Animals | `/admin/animals` | awaited + `fetchAllPages` | none | added — heading, 4 KPIs, table rows | good |
| Health | `/admin/health` | awaited + `fetchAllPages` | none | added — heading, 4 KPIs, table rows | good |
| Adoptions | `/admin/adoptions` | awaited + `fetchAllPages` | none | added — heading, 4 KPIs, split lists | good |
| Users | `/admin/users` | awaited + `fetchAllPages` | stats streamed via `Suspense` (`UsersStatsSkeleton`); `UsersResultsSkeleton` exists | added — heading, 4 KPIs, table rows | good |
| Messaging | `/admin/messaging` | awaited on the server | conversation thread skeleton (now header + thread + composer) | added — heading, split list/thread | good |
| Learning | `/admin/learning` | awaited on the server | per-row pending dot (mutation state only) | added — heading, 4 KPIs, card grid | good |
| Notifications | `/admin/notifications` | awaited + `fetchAllPages` | none | added — heading, table rows | good |
| Audit | `/admin/audit` | awaited on the server per filter/page | table skeleton matching columns; detail overlay skeleton | added — heading, 4 KPIs, table rows | good |

Notes:

- `fetchAllPages` pages are fully resolved before render, so their list skeletons only matter during navigation — covered by the new route-level `loading.tsx`.
- Reports and Users keep their streamed KPI skeletons; both already matched `StatCard` height (`h-[104px]`).
- `ReportsResultsSkeleton` and `UsersResultsSkeleton` remain available for future streamed list rendering. They are currently unused because the lists are awaited.

---

## 2. Overlay / drawer audit

| Overlay | Fetch on open | Loading treatment | Match |
| --- | --- | --- | --- |
| Audit entry detail (`audit-detail.tsx`) | yes (`/api/admin/audit/:id`) | structured skeleton: actor/source cards, record block, change table rows, footer | fixed in this pass |
| User detail drawer (`user-detail-drawer.tsx`) | yes (`/api/admin/users/:id`) | header/identity render from the row fallback immediately; Activity renders 4 stat skeletons while counts load | good |
| Messaging thread (`messaging-console.tsx`) | yes (`/api/admin/messaging/:id`) | skeleton now mirrors header, alternating bubbles, and composer | fixed in this pass |
| Animal health panel (`animal-health-panel.tsx`) | yes (`/api/admin/animals/:id/health`) | panel-level skeleton with photo, title, and record bars | good |
| Animal details (`animal-details-dialog.tsx`) | no — data passed in | not needed | n/a |
| Report details (`reports-grid.tsx`) | no — data passed in | not needed | n/a |
| Adoption detail (`adoption-detail.tsx`) | no — data passed in | not needed | n/a |
| Adoption animal detail (`adoptions-animals-list.tsx`) | no — data passed in | not needed | n/a |
| Animal profile drawer (`animals-console.tsx`) | no — data passed in | not needed | n/a |
| Rescue report detail (`rescues-console.tsx`) | no — data passed in | not needed | n/a |
| Health entry / intake dialogs | no — form overlays | not needed | n/a |

Action confirmations (`ConfirmDialog`) are excluded: they close synchronously and report through toasts per the action UX rules, so they never need a loading skeleton.

---

## 3. Findings

1. **No route-level loading UI existed.** Every admin page awaited its server data before rendering, so navigating between pages could leave the previous screen visible or show a blank content area until the response landed. Fixed with a shared `AdminPageSkeleton` and a `loading.tsx` for every console route.
2. **Skeletons were page-specific and sometimes generic.** The audit detail overlay used three abstract bars; the messaging thread used four unrelated blocks. Both now follow the real layout (cards/table/composer).
3. **List skeletons existed but never rendered.** `ReportsResultsSkeleton` and `UsersResultsSkeleton` were defined but the pages await their lists. They are kept for a future streamed-list refactor; navigation is now covered by route skeletons.
4. **Overlays that receive data as props need no skeleton.** Reports, rescues, adoptions, and animal profile drawers are server-rendered data passed down, so the only delay is opening the client overlay, which is synchronous.
5. **Mutation states are not skeleton cases.** Per-row pending dots (learning), optimistic status changes (reports/adoptions/users), and toast feedback follow the action UX rules; they should not block the surface with a skeleton.

---

## 4. What changed

- New shared component: `apps/web/src/components/admin/page-skeleton.tsx`
  - Props: `stats`, `variant` (`table` / `grid` / `split` / `dashboard`), `filters`, `rows`, `cards`, `label`.
  - Renders the common heading, optional KPI strip, optional filter bar, and a body that matches the page type.
- New `loading.tsx` for:
  - `(console)` dashboard, `reports`, `rescues`, `animals`, `health`, `adoptions`, `users`, `messaging`, `learning`, `notifications`, `audit`.
  - Each route picks the closest variant and KPI count so the skeleton does not reflow when real content arrives.
- Audit detail overlay: replaced the generic bars with a layout-matched skeleton.
- Messaging thread: replaced the generic bars with a header + bubble + composer skeleton.

---

## 5. Convention for new pages and overlays

1. **Server-fetched page** → add `loading.tsx` using `AdminPageSkeleton` with the page's real KPI count and body variant.
2. **Streamed section** → add a local skeleton next to the section (see `ReportsStatsSkeleton`) and wrap it in `Suspense`.
3. **Client-fetched overlay/drawer** → render a skeleton that matches the final sections, not generic bars. Prefer showing fallback row data immediately (as the user drawer does) and skeletonize only the fields that arrive from the API.
4. **Prop-driven overlay** → no skeleton; opening is synchronous.
5. **Mutations** → optimistic update + toast. Never a full-surface skeleton or blocking spinner.
6. **Sizing** → mirror the real element's height/columns (for example `h-[104px]` for `StatCard`, same column count for tables) so content does not jump.

---

## 6. Verification

```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```

Passes after the changes above.
