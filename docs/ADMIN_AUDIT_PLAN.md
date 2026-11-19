# Admin — Audit logs (`/admin/audit`)

**Status:** implemented (phases 1–3: ledger, filters/detail, CSV export, and realtime "new events" pill; phase 4 hardening remains optional future work)
**Route:** `apps/web/src/app/admin/(console)/audit/page.tsx`
**Components:** `apps/web/src/components/admin/audit/audit-console.tsx`
**Service:** `packages/core/src/modules/audit/audit.{service,repository,types}.ts`
**Data source:** `prisma/schema.prisma` → `AuditLog`
**Group:** Insights
**Related:** `docs/ADMIN_USERS_PLAN.md`, `docs/ADMIN_REPORTS_PLAN.md`, `docs/ADMIN_MESSAGING_PLAN.md`

**Design direction:** an **accountability ledger**, not a debug dump. A city vet
administrator should be able to answer "who changed this, when, and from what to
what" in seconds, with enough context to trust the record but without reading raw
JSON.

---

## 1. Objective & purpose

**Feature objective:** give administrators a read-only, filterable, explainable
history of every administrative action recorded by `writeAuditLog`, and a clear
path back to the affected record.

The page must answer four questions per row:

1. **Who did it?** — actor name, role, and account link.
2. **What happened?** — a plain-language action label ("Report verified"), never
   `verify_report`.
3. **Which record?** — entity type, human code (e.g. `RPT-2026-00012`), and a link.
4. **What changed?** — a compact before → after diff, with sensitive fields
   redacted.

### 1.1 Audiences

| Role | Why they use it |
| --- | --- |
| **Administrator** | Accountability, dispute resolution, compliance reviews, and investigating unexpected changes |
| **City vet / program lead** (future) | Read-only oversight of approvals, rejections, and rescues |
| **Developer / support** | Trace a single entity's history or a single actor's session |

Nobody can create, edit, or delete an audit row from the UI. The audit trail is
append-only.

### 1.2 Current state (audit)

What already exists:

- `AuditLog` model with `userId`, `action`, `entityType`, `entityId`, `oldValue`,
  `newValue`, `ipAddress`, `createdAt`.
- Indexes already suited to this page: `(userId, createdAt)`,
  `(entityType, entityId)`, `(action, createdAt)`.
- `writeAuditLog` is called inside the same transaction as the mutation in auth,
  reports, rescues, animals, health, adoptions, and messaging services.
- Sidebar entry and module metadata already exist (`/admin/audit`, group
  "Insights", description "Read-only trail of every administrative action").

Gaps blocking the objective:

1. **No read path.** There is no audit repository, service, API route, or page —
   the route renders the generic `[module]` placeholder.
2. **Raw enum actions.** Values such as `update_animal_lifecycle` and
   `review_adoption_request` are stored as-is and need presentation mapping.
3. **No entity labels.** Rows carry UUID `entityId` but not the record code or
   title users recognize.
4. **Unstructured JSON.** `oldValue` / `newValue` are free-form and can include
   sensitive or noisy fields.
5. **No actor context in the list.** A `userId` alone is not useful without name,
   role, and account status.
6. **No pagination, filtering, search, export, or detail view.**

---

## 2. Action catalog (what the page must explain)

Presentation metadata should live in one map (`auditMeta`) shared by the list,
detail view, and filters. Initial coverage of every action currently written:

### 2.1 Authentication & accounts

| Action | Display label | Entity | Tone |
| --- | --- | --- | --- |
| `register` | Account registered | user | neutral |
| `register_oauth` | Account registered (OAuth) | user | neutral |
| `approve_rescuer` | Rescuer approved | user | success |

### 2.2 Reports

| Action | Display label | Entity | Tone |
| --- | --- | --- | --- |
| `create_report` | Report submitted | report | info |
| `verify_report` | Report verified | report | success |
| `reject_report` | Report rejected | report | danger |
| `assign_rescuer` | Rescuer assigned | report | info |
| `update_report_status` | Report status changed | report | neutral |

### 2.3 Rescues

| Action | Display label | Entity | Tone |
| --- | --- | --- | --- |
| `cancel_rescue_assignment` | Rescue assignment cancelled | rescue | danger |
| `fail_rescue_operation` | Rescue operation failed | rescue | danger |
| `create_rescue_intake` | Rescue intake recorded | animal / rescue | success |

### 2.4 Animals

| Action | Display label | Entity | Tone |
| --- | --- | --- | --- |
| `create_animal` | Animal profile created | animal | success |
| `update_animal` | Animal profile updated | animal | neutral |
| `update_animal_lifecycle` | Lifecycle status changed | animal | info |
| `moderate_animal_listing` | Listing moderated | animal | info |
| `archive_animal` | Animal archived | animal | neutral |

### 2.5 Health

| Action | Display label | Entity | Tone |
| --- | --- | --- | --- |
| `create_health_record` | Health record added | health record | success |
| `update_health_record` | Health record updated | health record | neutral |
| `create_vaccination` | Vaccination recorded | vaccination | success |
| `update_vaccination` | Vaccination updated | vaccination | neutral |
| `log_heart_rate` | Heart rate logged | animal | info |
| `update_heart_rate` | Heart rate updated | animal | neutral |

### 2.6 Adoptions

| Action | Display label | Entity | Tone |
| --- | --- | --- | --- |
| `submit_adoption_request` | Adoption application submitted | adoption | info |
| `review_adoption_request` | Adoption application reviewed | adoption | info |
| `complete_adoption` | Adoption completed | adoption | success |
| `withdraw_adoption_request` | Adoption application withdrawn | adoption | neutral |
| `record_adoption_followup` | Adoption follow-up recorded | adoption | info |

### 2.7 Messaging

| Action | Display label | Entity | Tone |
| --- | --- | --- | --- |
| `start_conversation` | Conversation started | conversation | neutral |
| `add_participant` | Participant added | conversation | info |
| `remove_participant` | Participant removed | conversation | info |
| `delete_message` | Message removed | message | danger |

**Fallback:** any unknown action renders as `humanize(action)` with an `info`
tone, so new write sites appear without breaking the page.

---

## 3. What the page displays

### 3.1 Header

- Eyebrow "Insights", title "Audit logs".
- One-line caption: "Every administrative action, who performed it, and what changed."
- Right-side utilities:
  - **Live** indicator when realtime is subscribed (optional phase 3).
  - **Export CSV** (respects the active filters).
- Read-only notice: "Audit entries are append-only and cannot be edited or deleted."

### 3.2 Summary strip

Four compact KPI cards, scoped to the selected date range and filters:

| Card | Value | Purpose |
| --- | --- | --- |
| **Events** | total matching rows | volume check |
| **Administrators active** | distinct `userId`s | who is operating |
| **Sensitive changes** | deletes, rejects, cancellations, archive | quick risk scan |
| **Last activity** | relative time | freshness |

The strip is derived server-side from the filtered query, not from the current
page of rows.

### 3.3 Filter bar

Use shared components, no hand-rolled controls:

- **Date range**: `Select` (compact) with `Today`, `Last 7 days`, `Last 30 days`,
  `Last 90 days`, `All time`. Default `Last 7 days`.
- **Domain**: `TabFilters` or `SecondaryTabFilters` — `All`, `Reports`, `Rescues`,
  `Animals`, `Health`, `Adoptions`, `Messaging`, `Accounts`. Domain maps to the
  action groups in §2. Counts reflect the date range.
- **Actor**: searchable `Select` of admins/users who appear in the range (value =
  `userId`, label = name + role). Include "System / unknown" for `userId = null`.
- **Action**: searchable `Select` populated from actions present in the range,
  labelled with the display names above.
- **Search**: `SearchInput` for record code, entity title, action text, and actor
  name. Placeholder: "Search code, record, or person".
- **Clear filters** resets to the default range.
- All filters are URL-synced (`?range=7d&domain=reports&actor=<id>&action=...&q=...`)
  so a view can be shared or bookmarked.

### 3.4 Event table

One row per audit entry, newest first.

| Column | Content | Notes |
| --- | --- | --- |
| **When** | time (`2:14 PM`) + date (`Nov 19`) | full timestamp in `title`/detail |
| **Actor** | avatar (`profilePhotoUrl` or initials), full name, role badge | "System" when `userId` is null; "Deleted user" when the relation is gone |
| **Action** | icon + plain-language label, tone color | from `auditMeta` |
| **Record** | entity type label + human code/title + link | resolved by `entityType`/`entityId`; "No linked record" when unresolved |
| **Change** | compact summary, e.g. `status: submitted → verified`, `3 fields changed`, `Created`, `Removed` | first 1–2 meaningful fields, "+N more" |
| **Source** | masked IP (`203.177.0.0`) | full IP only in detail, admin-only |

Rules:

- Row click opens the **Event detail** overlay (not a route change).
- Record link is a separate anchor so opening the detail does not navigate.
- Unknown/missing entity resolution degrades gracefully; never show a raw UUID in
  the table.
- Destructive actions (`reject`, `fail`, `cancel`, `delete`, `archive`) carry a
  danger tint on the icon only — the row remains neutral for readability.
- Use `ScrollArea` for the table's vertical container; `Pagination` for pages
  (10 rows per page).
- Sticky header on desktop; horizontal scroll inside the table container on
  mobile (no page-level horizontal scroll).

### 3.5 Event detail (overlay)

Use `OverlayCard`. Sections:

1. **Summary** — action label, timestamp (absolute + relative), actor card
   (name, role, email, link to `/admin/users?q=...`), source IP.
2. **Record** — kind, code/title, link to the record, and a "View full history"
   action that closes the overlay and applies an `entityType + entityId` filter.
3. **Changes** — a two-column before/after diff rendered from `oldValue` /
   `newValue`:
   - Primitive fields: `Before` / `After` cells with strikethrough-free color
     cues (muted red for removed, muted green for added).
   - Nested objects: flattened to dot paths (`status`, `animal.lifecycleStatus`).
   - Arrays: item count plus a compact list (max 5 visible, then "Show all").
   - Long strings and URLs: truncated with expand.
   - `null` → value and value → `null` are rendered explicitly as "None".
4. **Raw payload** — collapsed `<details>` block with formatted JSON for support
   use, clearly labelled "Technical details".
5. **Redaction notice** when any field was filtered (see §5.3).

No edit, delete, or retry actions exist in this overlay.

### 3.6 Empty, loading, and error states

- **Empty with no data in range:** "No audit activity in this period." with a
  button to widen the range to All time.
- **Empty from filters:** `SearchEmpty` with "No events match these filters" and
  "Clear filters".
- **Loading:** skeleton rows that preserve column widths (no layout shift).
- **Error:** inline retry card; never raw status codes or stack messages.
- **Unauthorized:** the route is admin-only and 404s/redirects through the
  existing console guard.

### 3.7 Live updates (phase 3)

- Listen to the existing `admin:realtime` broadcast for `table === "audit_logs"`.
- Prepend a "N new events" pill instead of silently reshuffling the table; clicking
  it refreshes and scrolls to top.
- Do not auto-jump while the detail overlay is open; refresh only the background.
- Coalesce bursts with the existing 250 ms debounce.

---

## 4. Record resolution (human codes and links)

`entityId` is a UUID; users recognize codes. Resolve per `entityType` in the
service, with a small batched lookup:

| `entityType` | Lookup | Display | Link |
| --- | --- | --- | --- |
| `report` | `Report.reportCode` | `RPT-2026-00012` | `/admin/reports?q=<code>` |
| `rescue` / `rescue_operation` | `RescueOperation` + report code | `RSC-…` or report code | `/admin/rescues?q=<code>` |
| `animal` | `Animal.animalCode` + name | `ANM-… · Brownie` | `/admin/animals?q=<code>` |
| `adoption` / `adoption_request` | `AdoptionRequest` + animal code | `ADO-… · Brownie` | `/admin/adoptions?q=<code>` |
| `health_record` | animal code + record type | `Health · ANM-…` | `/admin/health?q=<code>` |
| `vaccination` | animal code + vaccine | `Vaccination · ANM-…` | `/admin/health?q=<code>` |
| `conversation` | subject or participant names | conversation title | `/admin/messaging?conversation=<id>` |
| `message` | conversation title | "Message in …" | `/admin/messaging?conversation=<conversationId>` |
| `user` | name + email | `Angela Dela Cruz` | `/admin/users?q=<email>` |
| unknown | none | `entityType` label only | no link |

Batch lookups by entity type for the current page only (max 50 IDs per type) to
avoid N+1 queries. Cache the resolved labels for the request.

---

## 5. Data model & service design

### 5.1 Schema

**No migration required for phase 1.** The existing `AuditLog` columns and
indexes cover list, filters, detail, and export.

Optional phase 4 additions (only if operationally needed):

- `requestId String?` — group all rows written during one HTTP request.
- `userAgent String?` — browser/client context for security reviews.
- `AuditLog.action` remains a `VarChar(50)` string; do not convert it to an enum
  or historical rows and future write sites will break.

### 5.2 Service layer

Create `packages/core/src/modules/audit/`:

```ts
listAuditLogs(actor, query)   // admin only; paginated rows + total
auditSummary(actor, query)    // events, distinct actors, sensitive count, last activity
auditFacets(actor, query)     // actors and actions present in range, with counts
getAuditLog(id, actor)        // full old/new payload + resolved record
exportAuditCsv(actor, query)  // streamed, filtered, capped (e.g. 10k rows)
```

Repository query shape:

```ts
interface ListAuditQuery {
  range: "today" | "7d" | "30d" | "90d" | "all";
  domain?: ActionDomain | "all";
  actorId?: string | "system";
  action?: string;
  entityType?: string;
  entityId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}
```

Implementation notes:

- Always `orderBy: { createdAt: "desc" }` with `id` as a stable tiebreaker.
- Domain filtering maps to action allow-lists, not SQL `LIKE` on prefixes.
- `q` searches the resolved display fields, plus a narrow JSON text match only
  when needed; never full-scan unbounded JSON for every keystroke.
- Default range is 7 days; `all` is explicit.
- Enforce `requireRole(actor, "admin")` at the service boundary, not only in the
  route.

### 5.3 Redaction and safety

Before returning `oldValue` / `newValue`, strip or mask:

- Password hashes, reset tokens, session tokens, API keys, and OAuth secrets.
- Full IPs in the list (mask last octet/segment); full value only in detail.
- Media URLs containing signed query strings (strip the query).
- Any key matching `/password|secret|token|authorization|api[-_]?key/i`.

If anything was removed, set `redacted: true` and show the notice in the detail
overlay. Never mutate the stored row — redaction is presentation-only.

### 5.4 API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/audit` | Paginated, filtered rows + summary + facets |
| `GET` | `/api/admin/audit/[id]` | One event with full diff |
| `GET` | `/api/admin/audit/export` | CSV export for the active filters |

The page itself is a server component that calls the service directly for the
first render; the client console handles filter changes and pagination.

---

## 6. Files to touch

- `packages/core/src/modules/audit/audit.types.ts`
- `packages/core/src/modules/audit/audit.repository.ts`
- `packages/core/src/modules/audit/audit.service.ts`
- `packages/core/src/index.ts` (or the existing module barrel) — export the service
- `apps/web/src/app/admin/(console)/audit/page.tsx`
- `apps/web/src/components/admin/audit/audit-console.tsx`
- `apps/web/src/components/admin/audit/audit-detail.tsx`
- `apps/web/src/components/admin/audit/audit-meta.ts` (labels, tones, icons, domain map)
- `apps/web/src/app/api/admin/audit/route.ts`
- `apps/web/src/app/api/admin/audit/[id]/route.ts`
- `apps/web/src/app/api/admin/audit/export/route.ts`
- `scripts/seed-audit-logs.ts` — demo activity across every domain and actor

Reuse: `ScrollArea`, `Pagination`, `SearchInput`, `Select`, `TabFilters` /
`SecondaryTabFilters`, `Badge`, `OverlayCard`, `ConfirmDialog` only if a future
retention action is added, `Tooltip`, `SearchEmpty`, `useToast`.

Do not add a new table component if an existing admin list pattern fits; follow
the DataTable treatment used on the analytics page for consistency.

---

## 7. Implementation phases

### Phase 1 — Read-only ledger (core)

- Add audit types, repository, and service with the default 7-day range.
- Map all current actions to labels, tones, and icons.
- Build the page header, summary strip, and paginated table.
- Resolve record codes/titles/links for the page in a batched lookup.
- Enforce admin-only access in the service.
- Acceptance: every existing audit row can be found, understood, and linked to
  its record without reading raw JSON.

### Phase 2 — Filters and detail

- URL-synced range, domain, actor, action, and search filters.
- Event detail overlay with before/after diff and technical details.
- Redaction pass and "redacted" notice.
- "View full history" filter by entity.
- Empty/loading/error states with shared components.
- Acceptance: an admin can trace one record's full history and one actor's recent
  activity in two clicks.

### Phase 3 — Scale and oversight

- CSV export with the active filters and a row cap.
- Summary/facets consistency across pages; index verification with `EXPLAIN`.
- Realtime "new events" pill.
- Acceptance: 100k-row audit table still filters and pages in under ~500 ms in
  local/staging conditions.

### Phase 4 — Optional hardening

- `requestId` / `userAgent` columns if security reviews require them.
- Retention/archival policy (export before pruning), with a documented window.
- Saved filter presets for compliance reviews.

---

## 8. Acceptance criteria

1. `/admin/audit` is a real page, not the `[module]` placeholder, and is visible
   only to admins.
2. The default view is the last 7 days, newest first, with 10 rows per page.
3. Every current action renders a human label and tone from `auditMeta`; unknown
   actions fall back to `humanize(action)` without breaking the page.
4. Each row shows when, who, what, which record, and a one-line change summary.
5. Record links resolve to the correct report, rescue, animal, adoption, health
   record, conversation, or user; unresolved entities degrade gracefully.
6. The detail overlay shows a readable before/after diff and a collapsed raw
   payload; sensitive fields are redacted with a visible notice.
7. Filters (range, domain, actor, action, search) compose, are URL-synced, and
   have a working "Clear filters".
8. Export downloads CSV matching the active filters.
9. Empty, loading, and error states use shared components; no raw error text.
10. No UI path can create, edit, or delete an audit row.
11. `npx tsc --noEmit -p apps/web/tsconfig.json` passes.

---

## 9. Verification

- Seed at least one row per action group from §2, including an unknown action and
  a row with `userId = null`.
- Confirm both `oldValue` and `newValue` render when present, and "Created" /
  "Removed" when only one side exists.
- Resolve a report, rescue, animal, adoption, conversation, and user record and
  click through each link.
- Filter by a single actor and confirm the summary strip and facet counts agree.
- Open a row with nested JSON and verify flattening, arrays, and long strings.
- Verify redaction by seeding a payload containing `password` and `token` keys.
- Run the export with filters applied and compare row count to the UI total.
- Run the typecheck from the repo root.

---

## 10. Out of scope (for this plan)

- Editing or deleting audit history.
- Restoring a record to a previous state from the audit diff.
- SIEM/export integrations, log shipping, or alerting rules.
- Non-admin self-service access to the audit trail.
- Cross-system identity events (SSO, password rotation from an external IdP).
