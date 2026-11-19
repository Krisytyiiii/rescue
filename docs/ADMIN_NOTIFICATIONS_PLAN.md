# Admin — Notifications (`/admin/notifications`)

**Status:** implemented (phases 1–3, plus the Phase 4 triage queue and retention sweep; preferences, digest batching, and push/email delivery remain future work)
**Route:** `apps/web/src/app/admin/(console)/notifications/page.tsx`
**Components:** `apps/web/src/components/admin/notifications/notifications-console.tsx`
**Service:** `packages/core/src/modules/notifications/notifications.service.ts`, `packages/core/src/modules/messaging/messaging.service.ts` (notification list/counts live here today)
**Realtime:** `apps/web/src/components/admin/supabase-realtime.tsx`, `prisma/migrations/20261119000001_messaging_realtime_triggers/migration.sql`
**Group:** Community
**Related:** `docs/ADMIN_MESSAGING_PLAN.md`

**Design direction:** a **notification center**, not an outbound log. Every
adopter, rescuer, and administrator should see the updates that concern *them* —
adoption progress, rescue activity, and report decisions — as they happen, with
a clear path back to the record that changed.

---

## 1. Objective & purpose

**Feature objective:** notify the right people in real time when an adoption
request, rescue operation, or reported case changes, and give both admins and
the admin console a single live surface to review those notifications.

The page must answer three questions at a glance:

1. **What changed?** (event + plain-language summary)
2. **Which record?** (adoption request, rescue, report, conversation)
3. **What should I do next?** (open the record, reply, verify, dispatch)

### 1.1 Recipients and scopes

| Role | Receives | Examples |
| --- | --- | --- |
| **Adopter / community user** | Updates to their own adoption requests, reports, and conversations | application received, documents needed, interview scheduled, report verified, new admin message |
| **Rescuer** | Rescue operations assigned to them and related report changes | new rescue assignment, report location update, rescue cancelled, intake recorded |
| **Administrator** | Work that needs a decision + operational awareness | new adoption request, new report, rescue failed/cancelled, pending rescuer account, exception |

Rules:

- Never notify the person who performed the action.
- Admin fan-out uses `notifyAdmins` and respects active, non-deleted accounts.
- Non-admin recipients only receive notifications for records they own or are
  assigned to.
- Notifications are grouped by role and record type, never shown to the wrong
  recipient.
- Barangay-scoped staff only see notifications tied to their barangay when the
  reference record has one.

### 1.2 Current state (audit)

What already exists:

- `Notification` model with `recipientUserId`, `notificationType`, `title`,
  `body`, `referenceType`, `referenceId`, `channel`, `isRead`, `readAt`,
  `sentAt` (`prisma/schema.prisma`).
- Notification creation in reports, rescues, adoptions, health, auth, and
  messaging services (`notificationsService.notify` / `notifyAdmins`).
- `NotificationsConsole` renders a filterable list, mark-read toggle, type
  badges, and a deep link for conversation references.
- Navbar unread badge, fed by the admin console layout.
- Realtime broadcast triggers on the `notifications` table; the page subscribes
  through `AdminSupabaseRealtime` and refreshes on changes.
- Read endpoints: `POST /api/admin/notifications/[id]/read`.

Gaps blocking the objective:

1. **No recipient scoping.** `messagingService.listNotifications` and
   `getNotificationCounts` query every row in the table, so one admin sees (and
   can mark read) notifications sent to other admins and to adopters/rescuers.
   The navbar badge is therefore also wrong.
2. **The page is a log, not an inbox.** It is organized around recipients
   ("who was notified") instead of the signed-in user's work.
3. **No real-time UX.** The list updates only after the whole server page
   refreshes; there is no toast, no "new" highlight, and no live unread badge if
   the user stays on the page.
4. **Incomplete event coverage.** Some transitions notify admins but not the
   affected adopter/rescuer, and some transitions notify nobody. `system` is used
   as a catch-all instead of specific user-facing events.
5. **Weak deep links.** Only `referenceType: "conversation"` resolves to a link;
   reports, adoptions, rescues, and animals have no destination.
6. **No mark-all-read / bulk actions.**
7. **No duplicate protection.** Realtime refresh + fan-out can surface repeated
   events for the same record change.

---

## 2. Event catalog

Every domain mutation below should emit exactly one notification per recipient.
`referenceType` is the record kind; `referenceId` is its UUID.

### 2.1 Adoption requests (`adoption_status`)

| Event | Trigger | Recipients | Link |
| --- | --- | --- | --- |
| Application submitted | `adoptions.submit` | Admins | Adoption request |
| Application under review / documents needed | `adoptions.review` | Adopter (+ assigned rescuer) | Adoption request |
| Interview scheduled / rescheduled | review or follow-up update | Adopter + admins | Adoption request |
| Approved | `adoptions.complete` / review approve | Adopter | Adoption request |
| Rejected (with reason summary) | review reject | Adopter | Adoption request |
| Follow-up due / completed | `adoptions.followups` | Adopter + admins | Adoption request |

### 2.2 Rescue operations (`rescue_assignment`, `report_status`)

| Event | Trigger | Recipients | Link |
| --- | --- | --- | --- |
| Rescue assigned | `rescues.assign` / report assign | Rescuer | Rescue |
| Assignment accepted / en route | rescuer status update | Admins + reporter | Rescue |
| Rescue completed + intake | `rescues.intake` | Reporter + admins | Rescue / animal |
| Rescue failed | `rescues.fail` | Admins + reporter | Rescue |
| Rescue cancelled | `rescues.cancel` | Rescuer + reporter + admins | Rescue |

### 2.3 Reported cases (`report_status`)

| Event | Trigger | Recipients | Link |
| --- | --- | --- | --- |
| Report submitted | `reports.create` | Admins | Report |
| Report verified | `reports.verify` | Reporter | Report |
| Report rejected | `reports.reject` | Reporter | Report |
| Report assigned to rescuer | `reports.assign` | Rescuer (+ reporter) | Report |
| Report resolved | report/rescue completion | Reporter | Report |

### 2.4 Cross-cutting

| Event | Trigger | Recipients | Link |
| --- | --- | --- | --- |
| New direct message | `messaging.send` / `startConversation` | Other participants | Conversation |
| Pending rescuer signup | `auth.signup` (rescuer) | Admins | Rescuer account |
| Vaccination due | `health` scheduler / record | Admins (+ assigned rescuer) | Animal |

**Copy contract:** title ≤ 120 chars, body ≤ 255 chars, plain language, includes
the record code (e.g. `ADO-2026-00001`, `RPT-2026-00012`) and the outcome. Never
include stack traces, IDs, or raw enum values.

---

## 3. Real-time architecture

The broadcast pipeline already works:

```
domain mutation → notificationsService.notify / notifyAdmins → notifications row
      → DB trigger public.broadcast_admin_change() → realtime.send(
          { table: "notifications" }, "change", "admin-realtime", false )
      → AdminSupabaseRealtime (browser) → window "admin:realtime" + router.refresh()
```

Plan:

1. **Scope every query to `actor.userId`.** The page, the list API, unread
   counts, and reads operate on the signed-in admin's notifications only.
2. **Keep the trigger as the transport.** No API route needs to publish
   manually; any writer (web, mobile, seed, future service) is covered.
3. **Make the console listen directly.** On `admin:realtime` with
   `table === "notifications"`, refetch the current list (or call
   `router.refresh()`); show a toast and a temporary "New" marker instead of a
   silent full-page reload.
4. **Live unread badge.** Move the navbar count into a small client component
   that receives the server value and decrements/increments locally on
   `admin:realtime` and read toggles, so the badge does not wait for navigation.
5. **Coalescing.** Keep the existing 250 ms refresh debounce so a fan-out to five
   admins does not cause five renders.
6. **Reconnect behavior.** On `SUBSCRIBED` after a drop, refresh once to catch
   missed events.

---

## 4. UI / UX specification

### 4.1 Header

- Eyebrow "Notifications", title "Notification center".
- KPI strip: **Unread**, **Needs attention** (unread adoption/report/rescue
  types), **Today**, **Total**.
- Primary action: **Mark all read** (optimistic, confirmed via toast).
- Live indicator ("Live" dot) when the realtime channel is subscribed.

### 4.2 Filters

Use shared components only:

- `SecondaryTabFilters` for read state: `All`, `Unread`, `Read`.
- `TabFilters` for the domain: `All`, `Adoptions`, `Rescues`, `Reports`,
  `Messages`, `System` (map to `NotificationType`). Counts come from the current
  admin's rows.
- `SearchInput` for title/body/record-code search (in-memory).
- Optional date grouping headers: Today / Yesterday / Earlier.

### 4.3 Notification row

- Type icon + tone from the existing `notificationTone` map.
- Title, body, record code, and relative time.
- Type `Badge` and a **record link** resolved from `referenceType`:

| `referenceType` | Destination |
| --- | --- |
| `conversation` | `/admin/messaging?conversation=<id>` |
| `report` | `/admin/reports?q=<code>` |
| `adoption_request` | `/admin/adoptions?q=<code>` |
| `rescue` | `/admin/rescues?q=<code>` |
| `animal` | `/admin/animals?q=<code>` |
| `user` | `/admin/users?q=<email>` |

- Read/unread toggle with optimistic state and rollback.
- Unread rows: subtle clay tint, left accent, `BellRing` icon.
- "New" chip on rows that arrived while the page was open.
- Row click opens the record; the toggle button stays independent.
- Empty state uses `SearchEmpty` ("You're all caught up").

### 4.4 Admin-only context

Admins may need the fan-out view for debugging. Keep it behind an explicit
**Delivery log** secondary tab that shows `recipientName`, `recipientRole`, and
channel, clearly labelled as an audit view — never mixed into the personal
inbox. This preserves the current table data without confusing the default
experience.

### 4.5 Mobile

- Single column, sticky filter bar, full-width rows.
- Mark-all-read and filters remain reachable; no horizontal scroll.
- Respect `prefers-reduced-motion` for the new-row highlight.

---

## 5. Data model & API changes

### 5.1 Schema

Minimal additions (one migration):

- `Notification.actionUrl String? @map("action_url") @db.VarChar(255)` — resolved
  destination when the reference alone is not enough.
- `Notification.dedupeKey String? @map("dedupe_key") @db.VarChar(120)` with a
  unique index on `(recipientUserId, dedupeKey)` — prevents duplicate fan-out
  for retried mutations.
- Optional `Notification.metadata Json?` for record code/status snapshots used by
  the row copy.

No changes to `NotificationType` are required for phase 1; the domain tabs map
existing values. Add `adoption_followup` only if the follow-up events need a
distinct icon.

### 5.2 Service layer

Refactor notification reads out of `messaging.service.ts` into
`notifications.service.ts`:

```ts
listForAdmin(actor, query)          // recipientUserId = actor.userId
countsForAdmin(actor)               // unread / today / needsAttention / total
markRead(id, actor)                 // ownership check: recipientUserId === actor.userId
markAllRead(actor)                  // recipientUserId = actor.userId
listDeliveryLog(actor, query)       // admin-only fan-out audit
```

Repository filters: `recipientUserId`, `notificationType`, `isRead`, `q`
(title/body), `from`/`to` for Today.

### 5.3 API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/notifications` | Current admin's rows + meta (extend existing) |
| `GET` | `/api/admin/notifications/unread-count` | Live badge value |
| `POST` | `/api/admin/notifications/[id]/read` | Own row only (add ownership guard) |
| `POST` | `/api/admin/notifications/mark-all-read` | Bulk mark read |
| `GET` | `/api/admin/notifications/delivery-log` | Admin-only fan-out audit |

Every mutation broadcasts through the existing DB trigger; no manual
`broadcastAdminChange("notifications")` calls are needed once triggers are live.

### 5.4 Event emission helpers

Add one helper per domain in `notifications.service.ts` so callers cannot drift:

```ts
notifyAdoptionEvent(kind, request, recipients)
notifyReportEvent(kind, report, recipients)
notifyRescueEvent(kind, rescue, recipients)
notifyMessageEvent(conversation, sender, recipients)
```

Each helper owns title/body copy, `referenceType`, `referenceId`, `actionUrl`,
and dedupe key. Domain services call the helper instead of hand-building rows.

---

## 6. Files to touch

- `prisma/schema.prisma` + new migration (`notification action_url/dedupe_key/metadata`)
- `packages/core/src/modules/notifications/notifications.{service,repository,types}.ts`
- `packages/core/src/modules/{reports,rescues,adoptions,health,messaging,auth}/*.service.ts` — use helpers, fill missing events
- `packages/core/src/modules/messaging/messaging.service.ts` — remove notification list/counts responsibilities
- `apps/web/src/app/admin/(console)/notifications/page.tsx` — scoped server data, live subscription
- `apps/web/src/components/admin/notifications/notifications-console.tsx` — inbox UI, filters, links, optimistic reads, realtime listener
- `apps/web/src/components/admin/admin-navbar.tsx` + `admin-shell.tsx` — live unread badge client component
- `apps/web/src/app/api/admin/notifications/**` — scoped list, unread count, mark-all-read, delivery log
- `apps/web/src/lib/notifications/links.ts` — `referenceType` → `href` resolver
- `scripts/seed-notifications.ts` — demo rows for each role/event

---

## 7. Implementation phases

### Phase 1 — Correct scoping (blocking)

- Scope list and counts to `actor.userId`; fix the navbar badge.
- Enforce ownership on mark-read; add mark-all-read.
- Replace the recipient-centric row copy with the personal inbox layout.
- Add the reference → link resolver.
- Acceptance: an admin only ever sees and mutates their own notifications.

### Phase 2 — Event coverage

- Add the four event helpers and route every domain mutation through them.
- Fill missing adopter/rescuer notifications in adoptions, rescues, and reports.
- Add dedupe keys and integration tests for recipient sets.
- Acceptance: each row in §2 produces exactly one notification per intended
  recipient and none for the actor.

### Phase 3 — Real-time UX

- Console listens to `admin:realtime`, shows an inline "new notifications" toast,
  highlights new rows, and updates the badge live.
- Refresh-on-reconnect; keep the 250 ms coalescing.
- Acceptance: a change caused in another tab or client appears within ~1 s
  without a manual refresh, on the list and the badge.

### Phase 4 — Delivery and scale

- **Done:** "Needs attention" triage filter + KPI, live unread badge, and the
  retention sweep (`npm run db:prune-notifications`).
- **Remaining:** notification preferences per role, digest batching.
- Push/email channels through `NotificationChannel` (out of scope for the inbox
  itself).

---

## 8. Acceptance criteria

1. `/admin/notifications` shows only the signed-in admin's notifications; the
   delivery log is a separate, clearly labelled tab.
2. Unread count in the navbar matches the admin's actual unread rows and updates
   without navigation.
3. New adoption, rescue, and report events produce notifications for the right
   adopters, rescuers, and admins; the actor is never notified.
4. Each row links to its report, adoption, rescue, animal, conversation, or user
   record.
5. A notification created by another client appears live (list + badge) in under
   ~1 s; no manual refresh.
6. Mark read / unread / mark all read are optimistic, roll back on failure, and
   toast the result.
7. Empty, loading, and error states use the shared UI components; no raw error
   text.
8. `npx tsc --noEmit -p apps/web/tsconfig.json` passes.

---

## 9. Verification

- Seed one adoption approval, one rescue assignment, one report verification,
  and one direct message; confirm the recipient rows and live updates.
- Sign in as adopter, rescuer, and admin in separate client sessions; verify each
  sees only their own inbox and badge.
- Use the delivery log to confirm fan-out counts for a single mutation.
- Test with the realtime channel disconnected: the page still loads, and
  reconnecting refreshes once.
- Run the typecheck from the repo root.

---

## 10. Out of scope (for this plan)

- Email, SMS, and push delivery providers.
- Notification templates/editing UI.
- Cross-barangay analytics and delivery metrics.
- Replacing the messaging notification rows (`new_message`) — those stay, but
  they are scoped and linked through this center.
