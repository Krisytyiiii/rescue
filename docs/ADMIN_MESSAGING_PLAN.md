# Admin — Messaging (`/admin/messaging`)

**Status:** planned
**Module metadata:** `ADMIN_MODULES.messaging` (`apps/web/src/lib/admin/modules.ts`)
**Route:** `apps/web/src/app/admin/(console)/messaging/page.tsx `  
**Group:** Community
**Replaces:** the placeholder rendered by `(console)/[module]/page.tsx`

**Design direction:** a **communications desk**. Every resident/rescuer message
about a report, adoption, or general question lands in one inbox, grouped by the
record it belongs to. The admin can read, reply, hand off, and close threads
without losing the animal/report/application context. A second view is the
**outbound notification log**, so the team can see what the system sent and to
whom.

---

## 1. Objective & purpose

**Feature objective:** integrate in-app communication between **adopters**,
**rescuers**, and **administrators** so coordination happens in one place instead
of scattered calls, texts, and social messages.

One surface where an admin can:

- See every conversation with unread state and latest activity.
- Reply to an adopter, rescuer, or community member in a thread, with the linked
record in view.
- Coordinate rescue dispatch, adoption interviews, and follow-ups without
leaving the console.
- Filter by context (report, adoption, general), status, and "needs reply".
- Close or reopen conversations and assign ownership to an admin.
- Review the notification fan-out (status updates, assignments, new messages).
- Keep moderation visible: soft-deleted messages, closed threads, audit trail.

Data model already exists (`Conversation`, `ConversationParticipant`, `Message`,
`Notification`); this page is the missing UI plus a small number of schema/API
additions listed in §6.

### 1.1 Who talks to whom

| Conversation context | Participants | Primary use |
| --- | --- | --- |
| **Report** (`report`) | Reporter (community/adopter), assigned rescuer, admins | Clarify location, access, animal condition, rescue ETA |
| **Adoption** (`adoption_request`) | Adopter, admins (optionally the assigned rescuer) | Interview scheduling, missing documents, home-visit coordination, release updates |
| **General** (`general`) | Community member or rescuer, admins | Account questions, lost & found, policy questions |

Rules:

- A conversation always includes at least one admin and one non-admin.
- The admin may add the assigned rescuer to a report or adoption thread so all
three parties coordinate in the same history.
- Participants only see conversations they belong to; admins see all.
- System notifications never notify the sender and are suppressed for the acting
admin.

### 1.2 Coordination flows to support

1. **Rescue dispatch:** admin opens the report-linked thread with reporter +

   assigned rescuer; rescuer confirms ETA and asks for directions in-thread; the
    admin replies and the exchange is attached to the report.
2. **Adoption interview:** admin messages the adopter from the application thread

   with the City Vet Building time, reschedules if needed, and logs the outcome.
3. **Follow-up:** admin checks in with the adopter after release; the rescuer can

   be added for a home visit.
4. **Hand-off:** assign a thread to another admin so coverage continues; the

   assignee and "Assigned to me" filter keep ownership clear.

---

## 2. Data available

From `prisma/schema.prisma`:

- **Conversation:** `id`, `contextType` (`report | adoption_request | general`),
`contextId`, `subject`, `status` (`open | closed`), `createdAt`, `updatedAt`,
`deletedAt`.
- **Participant:** `conversationId`, `userId`, `lastReadAt`.
- **Message:** `id`, `conversationId`, `senderUserId`, `messageBody`,
`attachmentUrl`, `sentAt`, `isDeleted`.
- **Notification:** `recipientUserId`, `notificationType`, `title`, `body`,
`referenceType`, `referenceId`, `channel`, `isRead`, `readAt`, `sentAt`.

Derived for the UI:

- Last message + timestamp per conversation.
- Unread count per conversation = messages after the admin's `lastReadAt`.
- "Needs reply" = last non-deleted message is from a participant, not from the
admin.
- Linked context summary (report code/location, adoption request code/animal).

---

## 3. Page layout

Two views inside the page, switched by primary `TabFilters`:
**Inbox** and **Notifications**.

### 3.1 Header

- Title: **Messaging**
- Subtitle: read and reply to community conversations, then audit what the
system sent.
- Right side: search input beside the view tabs (same pattern as Rescues).
- Optional "Mark all read" secondary action (confirm inline, not a global
mutation without feedback).

### 3.2 Stat cards (Inbox view)

| Card | Count |
| --- | --- |
| Open conversations | `status = open` |
| Unread messages | unread messages across open threads |
| Needs reply | last message not from an admin |
| Closed this week | `status = closed` within 7 days |

Cards act as filters where meaningful.

### 3.3 Inbox skeleton (three-pane desk)

On desktop, a 2-column layout (list + thread), with an optional context panel:

```
┌───────────────┬──────────────────────────────────────────────┬──────────────┐
│ Filters       │ Thread header                                 │ Context      │
│ Search        │ subject · context chip · participants         │ Report/ADO   │
│ Conversation  │ status · assignee · close/reopen              │ summary      │
│ list          │ ────────────────────────────────────────────  │ contact info │
│ (scroll)      │ day dividers · message bubbles                │ quick links  │
│               │ ────────────────────────────────────────────  │              │
│               │ composer: textarea · attach · canned · send   │              │
└───────────────┴──────────────────────────────────────────────┴──────────────┘
```

- **Left column (≈340px):** search + status/context filters + conversation list.
- **Center:** the active thread. Empty state when nothing is selected.
- **Right column (≈280px,** `xl` **only):** linked record + participant card;
collapses into a "Details" drawer on smaller screens.
- On mobile: list and thread are separate states with a back control.

### 3.4 Conversation list

Each row:

- Context icon (`FileWarning` report, `HeartHandshake` adoption, `MessageSquare`
general) tinted by context.
- Subject, or participant names when no subject.
- Last message preview (1 line), prefixed with the sender's first name.
- Relative timestamp (`2h`, `Yesterday`, `Nov 12`).
- Unread dot/count.
- Small context code (`FR-2026-0005`, `ADO-2026-00001`) and status dot.

Filters above the list:

- Secondary `TabFilters`: `All · Reports · Adoptions · General · Closed`
with counts.
- Secondary row: `Unread · Needs reply · Assigned to me` toggles.
- Search: subject, participant name/email, message body, linked code.

### 3.5 Thread view

**Header**

- Subject (fallback: "Conversation with …").
- Context chip that links to the report/adoption detail.
- Participant avatars/initials with names and roles (`Adopter`, `Rescuer`,
`Community`, `Admin`).
- Status badge (`Open`/`Closed`), assignee.
- Actions: `Add participant` (assigned rescuer / adopter lookup), `Assign to me`, `Mark read`, `Close`/`Reopen` (confirm dialog with consequence copy and
toast feedback).

**Messages**

- Day dividers (`Today`, `Nov 18`).
- Incoming bubbles left with sender avatar and role tag; admin messages right in
ink surface.
- Sender name, role tag (`Admin`, `Rescuer`, `Adopter`, `Community`), time.
- Attachment chip with file link; deleted messages render as "Message removed"
placeholder (never blank).
- Auto-scroll to newest; "New messages" pill if the user is scrolled up.

**Composer**

- Textarea with auto-grow, `Enter` to send, `Shift+Enter` newline.
- Attach button (reuses upload endpoint/limits), disabled for closed threads.
- Canned replies dropdown ("Interview reminder", "Missing documents",
"Rescue en route") — static presets first, editable in a later phase.
- Send is optimistic: bubble appears immediately, toast on failure, input
restored with the unsent text.
- Draft text preserved per conversation in local state.

### 3.6 Context panel

- Linked record summary card (report location/status or adoption applicant/animal)
with a "View record" link.
- Thread participants list grouped by role (Adopters, Rescuers, Admins) with
contact info and an add/remove control (admins only).
- Participant contact card: email, phone, barangay, role.
- Conversation metadata: opened date, assignee, message count.
- Quick actions scoped to context (open report, open application, assign
rescuer).

### 3.7 Notifications view

A read-only log of `Notification` rows, newest first:

- Type badge (`Report status`, `Rescue assignment`, `Adoption status`,
`New message`, `Vaccination due`, `Announcement`, `System`).
- Title + body, recipient (name/email), channel (`In-app`, `Push`, `Email`),
read state, sent time, linked record.
- Filters: type, read/unread, channel; search by recipient or title.
- Row click opens the recipient or linked record.
- Optional later action: "Resend in-app" (confirm; audited).

---

## 4. UX rules

- Reuse shared components: `TabFilters`, `SecondaryTabFilters`, `SearchInput`,
`ScrollArea`, `Pagination`/infinite scroll, `Badge`, `Tooltip`,
`ConfirmDialog`, `OverlayCard`, `Button`, `useToast`.
- **No inline action banners**; success/failure is always a toast and optimistic
state rolls back on failure.
- Closing a conversation, deleting a message, or resending a notification is a
confirmed action (overlay with consequence copy).
- Loading: skeleton conversation rows and message placeholders.
- Empty states: no conversations, no results with filters, no selection, closed
thread (composer replaced by "Reopen to reply").
- Live data: keep `AdminLiveRefresh`, or poll the thread endpoint every 10–15s
while open; pause polling when the tab is hidden.
- Accessibility: list rows are buttons/links with `aria-current`, unread counts
have text labels, Escape clears search, focus returns to the list on mobile
back.

---

## 5. Keyboard & power-user details

- `j`/`k` to move through conversations (optional, guarded against inputs).
- `Enter` send, `Shift+Enter` newline, `Esc` close details/overlay.
- "Next unread" button in the thread header.
- Search persists in the URL (`?q=&context=&view=`) so refreshes keep state.

---

## 6. Backend plan

### 6.1 New core module

`packages/core/src/modules/messaging/` following the adoptions/health pattern:

- `messaging.types.ts` — list/filter/thread DTOs, notification DTOs.
- `messaging.schema.ts` — zod input schemas.
- `messaging.repository.ts` — Prisma queries, context summaries, unread counts.
- `messaging.service.ts` — authorization, send, read, assign, status, notify.
- export from `modules/messaging/index.ts` and `packages/core/src/index.ts`.

### 6.2 Schema additions (small)

- `Conversation.assignedToUserId String? @db.Uuid` (+ relation, index).
- `Message.deletedAt DateTime?`, `Message.deletedBy String?` (soft delete audit;
keep `isDeleted`).
- Optional `CannedResponse` table (`id`, `label`, `body`, `isActive`,
`createdBy`).
- Optional `MessageAttachment` metadata table if multiple attachments are needed
later (today it is one `attachmentUrl`).

### 6.3 API routes

- `GET /api/admin/conversations` — filters: `status`, `context`, `q`,
`assigned`, `unread`, `cursor`.
- `GET /api/admin/conversations/[id]` — thread + messages + context summary.
- `POST /api/admin/conversations/[id]/messages` — `{ body, attachmentUrl? }`;
updates participant `lastReadAt`, emits `new_message` notification to others.
- `POST /api/admin/conversations/[id]/read` — mark up to now.
- `POST /api/admin/conversations/[id]/status` — `{ status: open | closed }`,
audited.
- `POST /api/admin/conversations/[id]/assign` — `{ userId | null }`, audited.
- `POST /api/admin/conversations/[id]/participants` — add an adopter or assigned
rescuer to a thread; `DELETE` variant removes a non-owner participant, audited.
- `DELETE /api/admin/messages/[id]` — soft delete + audit.
- `GET /api/admin/notifications` — type/read/channel filters, paginated.
- `POST /api/admin/notifications/[id]/read` — mark read.

Every mutation: `requireRole(actor, "admin")`, `writeAuditLog`, notification
fan-out that never notifies the sender.

### 6.5 Access & roles

| Actor | In-app messaging rights |
| --- | --- |
| **Admin** | See all threads; reply, close/reopen, assign, add/remove participants, soft-delete messages, view notification log |
| **Rescuer** | See threads they participate in (report/adoption/general); reply; mark read; cannot close, assign, or moderate |
| **Adopter / community** | See their own threads; reply; mark read; cannot see other participants' contact details beyond what the public profile exposes |

- Enforced server-side on every conversation and message route (participant
check, not just UI hiding).
- Admin-only routes return a friendly `Forbidden` message surfaced as a toast.
- Audit entries record actor, action (`send_message`, `close_conversation`,
`assign_conversation`, `add_participant`, `delete_message`), and target id.

### 6.4 Counts

`getMessagingCounts()` returns open, unread, needsReply, closedThisWeek; reuse
the same counts for sidebar badge (see users badge pattern).

---

## 7. Acceptance criteria

- `/admin/messaging` replaces the placeholder and matches the admin shell.
- Inbox lists conversations with unread state, context, last message, and
relative time; search and filters narrow instantly.
- Adopter, rescuer, and admin participants all appear with role tags; an admin
can add the assigned rescuer to a report/adoption thread and the new
participant receives it.
- Selecting a thread shows full history and the linked record; replying appears
immediately and persists.
- Close/reopen, assign, mark read, and delete mesh with confirm dialogs and
toasts; failures revert optimistic changes.
- Notifications view lists fan-out with filters and read state.
- Works on mobile (list ↔ thread), keyboard accessible, no horizontal overflow.
- `npx tsc --noEmit -p apps/web/tsconfig.json` passes; production build passes.

---

## 8. Non-goals (for the first release)

- Real-time websocket chat (poll/refresh first).
- Rich text, reactions, typing indicators, or group management.
- Citizen-facing inbox redesign — this plan only covers the admin console.
- SMS/email delivery infrastructure beyond the existing `channel` field.
- Canned-response management UI (presets can be hardcoded initially).

---

## 9. Suggested delivery phases

1. **Read-only inbox** — list, filters, thread view, context panel, counts.
2. **Reply loop** — optimistic send, read state, notifications, toasts.
3. **Moderation & ownership** — close/reopen, assign, soft delete, audit log.
4. **Notification log** — second view with filters.
5. **Polish** — canned replies, URL state, keyboard shortcuts, realtime upgrade.
