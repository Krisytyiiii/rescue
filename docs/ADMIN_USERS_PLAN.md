# Admin — Users & Access (`/admin/users`)

**Status:** planned
**Module metadata:** `ADMIN_MODULES.users` (`apps/web/src/lib/admin/modules.ts`)
**Route:** `apps/web/src/app/admin/(console)/users/page.tsx`
**Group:** Community
**Replaces:** the placeholder rendered by `(console)/[module]/page.tsx`

---

## 1. Purpose

Give administrators one place to:

- Approve new rescuer applications.
- See every account (community users, rescuers, admins) and its status.
- Search, filter, and inspect accounts.
- Suspend, reactivate, or deactivate accounts.
- Review per-account activity (reports, rescues, adoptions, audit trail).

The page is about **access management**, not profile editing. Sensitive
identity data stays read-only here.

---

## 2. Page layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Community reports-style page header                                  │
│  H1 "Users & access"                                                 │
│  Subtitle: manage applications, roles, and account status.           │
│                              [ Live user feed ] [ Search users ]     │
├──────────────────────────────────────────────────────────────────────┤
│ Stat cards (4)                                                       │
│  [ Awaiting approval ] [ Active rescuers ] [ Community users ]       │
│  [ Suspended ]                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ Pending rescuer queue (collapsible, only when > 0)                   │
│  ┌ card ──────────────────────────────────────────────────────────┐  │
│  │ JC  Juan Cruz · juan@email.com              Pending            │  │
│  │ Applied Nov 19, 2026                     [ Approve ] [ Review ]│  │
│  └────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│ Accounts panel                                                        │
│  Tabs: All · Rescuers · Community · Admins · Pending · Suspended     │
│  Toolbar: search · role · status · barangay · sort · clear           │
│  ┌ table ──────────────────────────────────────────────────────────┐  │
│  │ User | Role | Barangay | Status | Joined | Last login | Actions│  │
│  │ rows …                                                          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  Footer: Showing 1–10 of 248        [ Previous ]  Page 1 of 25 [ Next]│
└──────────────────────────────────────────────────────────────────────┘
```

Responsive behaviour:

- **≥ xl:** 4 stat cards in one row; table with all columns.
- **sm–lg:** 2×2 stat cards; table hides `Joined`, shows role/status/actions.
- **< sm:** table becomes stacked cards (avatar + name + email, role/status
  badges, last login, actions row). Toolbar filters wrap and stay reachable.

---

## 3. Header

| Element | Detail |
| --- | --- |
| Eyebrow | `Community` (clay, uppercase) |
| Title | `Users & access` — `font-display`, same scale as reports |
| Description | “Approve rescuer applications, manage roles and account status, and keep access auditable.” |
| Right badge | `Live user feed` with muted dot (mirrors reports page) |

---

## 4. Stat cards

Use the shared `StatCard` component.

| Card | Source | Tone / icon |
| --- | --- | --- |
| Awaiting approval | `count(accountStatus = pending)` | clay / `ClipboardCheck` |
| Active rescuers | `count(role = rescuer, status = active)` | moss / `UserCheck` |
| Community users | `count(role = community_user, status = active)` | amber / `Users` |
| Suspended | `count(accountStatus = suspended)` | forest? use danger-neutral / `UserX` |

Counts are **global** and do not change when filters change (matches the
reports page). Stream them in a Suspense boundary so the shell paints first.

---

## 5. Pending rescuer queue

Reuses the existing `PendingRescuerList` component, upgraded to the shared
confirmation pattern:

- Shows up to 3 pending applications with a “View all pending” link that sets
  the table filter to `status=pending&role=rescuer`.
- Section is hidden when the queue is empty; show a quiet “Queue is clear”
  line instead of a large empty card.
- **Approve** opens `ConfirmDialog` (“Approve this rescuer?”). On confirm the
  dialog closes immediately, the row flips to *Approved* optimistically, and
  the POST runs in the background. On failure, revert + `FormAlert`.
- **Review** opens the user detail drawer (read-only).

---

## 6. Accounts panel

### 6.1 Tabs

Client-side tabs that update the URL (`?role=…&status=…`), seeded from search
params so the view is shareable.

| Tab | Query |
| --- | --- |
| All | none |
| Rescuers | `role=rescuer` |
| Community | `role=community_user` |
| Admins | `role=admin` |
| Pending | `status=pending` |
| Suspended | `status=suspended` |

Tabs show live counts in a subtle pill when available.

### 6.2 Toolbar

- **Search** (debounced 250–300 ms): name, email, phone number.
- **Role** select: Any role · Community · Rescuer · Admin.
- **Status** select: Any status · Pending · Active · Suspended · Deactivated.
- **Barangay** select: “Any barangay” + list (reuse `Select`).
- **Sort**: Newest · Oldest · Name A–Z · Last login.
- **Clear filters** appears only when a filter is active.

Every change pushes the URL and immediately swaps the table for a skeleton
(keyed Suspense or client fetch), never leaving stale rows visible.

### 6.3 Table columns

| Column | Content | Notes |
| --- | --- | --- |
| User | Avatar/initials, full name, email | Primary identity cell |
| Role | Badge: Community / Rescuer / Admin | Tone per role |
| Barangay | Name or “Unassigned” | Muted |
| Status | Badge: Pending / Active / Suspended / Deactivated | Tone per status |
| Contact | Phone number, verified marker | Hidden `< lg` |
| Joined | `createdAt` formatted `MMM d, yyyy` | Hidden `< md` |
| Last login | Relative (“2h ago”) with absolute tooltip | “Never” when null |
| Actions | Row action menu (see 6.4) | Right-aligned |

Row click opens the detail drawer. Keyboard: `Enter` opens, focus ring visible.

Badge tones (existing `Badge` component):

- Roles: community `neutral`, rescuer `info`, admin `pending`/clay.
- Status: pending `pending`, active `success`, suspended `danger`,
  deactivated `neutral`.

### 6.4 Row actions

All actions confirm in an overlay and update optimistically (AGENTS.md rules).

| Status | Actions |
| --- | --- |
| pending + rescuer | **Approve**, **Deactivate** |
| active | **Suspend**, **View details** |
| suspended | **Reactivate**, **Deactivate**, **View details** |
| deactivated | **Reactivate**, **View details** |
| own account | No destructive actions; show “You” marker |

**Role changes are not inline.** Changing a role requires the detail drawer and
a typed confirmation because it changes authorization scope.

### 6.5 Pagination

10 rows per page. Footer: “Showing 1–10 of 248” + Previous/Next, same pattern
as the reports page. Server-driven; preserve active filters in the URL.

---

## 7. User detail drawer (or overlay card)

Opens from a row; width ~480px on desktop, full-height sheet on mobile. Uses
the shared `OverlayCard` shell.

Sections:

1. **Identity** — avatar, full name, email, phone, barangay, joined date,
   email verified, last login.
2. **Access** — role, account status, admin-only “You” indicator.
3. **Activity summary**
   - Reports submitted / verified
   - Rescue assignments (rescuer) or assignments made (admin)
   - Adoption applications / reviews
   - Latest 5 audit entries for this user
4. **Danger zone** — Suspend / Reactivate / Deactivate, each behind a
   `ConfirmDialog` with a consequence sentence.

No password or token data is ever shown.

---

## 8. Confirmation dialog copy

| Action | Title | Description | Confirm |
| --- | --- | --- | --- |
| Approve | Approve this rescuer? | “{Name} will be granted rescuer access and can claim assignments.” | Approve rescuer |
| Suspend | Suspend this account? | “{Name} will be signed out and cannot sign in until reactivated.” | Suspend account |
| Reactivate | Reactivate this account? | “{Name} will be able to sign in again.” | Reactivate |
| Deactivate | Deactivate this account? | “Access is removed permanently for this account. History is kept.” | Deactivate |
| Role change | Change role to {role}? | “This changes what {Name} can access immediately.” | Change role |

Tone: approve `success`, suspend/deactivate `danger`, reactivate `default`.

---

## 9. Data & API plan

### 9.1 Read model

`UserListRow`:

```ts
{
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: "community_user" | "rescuer" | "admin";
  accountStatus: "pending" | "active" | "suspended" | "deactivated";
  barangay: string | null;
  profilePhotoUrl: string | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}
```

### 9.2 Service methods (packages/core)

- `authService.listUsers(query, pagination)` — search by name/email/phone,
  filter by role, status, barangayId; sort; returns `Paginated<AuthUser>`.
- `authService.listUserById(id)` — identity + counts for the drawer.
- `authService.setAccountStatus(actor, id, status)` — existing repository
  method, add actor authorization + audit log + notification.
- `authService.changeRole(actor, id, roleName)` — guarded; cannot demote the
  last admin or self-demote.

### 9.3 Routes (apps/web/src/app/api/admin/users)

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/admin/users` | Paginated list (`q`, `role`, `status`, `barangay`, `page`) |
| GET | `/api/admin/users/[id]` | Detail + activity summary |
| POST | `/api/admin/users/[id]/approve` | Approve pending rescuer (can reuse rescuers route) |
| POST | `/api/admin/users/[id]/suspend` | Suspend |
| POST | `/api/admin/users/[id]/reactivate` | Reactivate |
| POST | `/api/admin/users/[id]/deactivate` | Deactivate |
| POST | `/api/admin/users/[id]/role` | Change role (admin only) |

Every mutation: admin session required, `writeAuditLog`, notification to the
affected user, and a typed success payload `{ ok: true, data }`.

Keep the existing `/api/admin/rescuers?status=active` and
`/api/admin/rescuers/[id]/approve` endpoints working; the users page can call
them until they are consolidated.

---

## 10. Loading, empty, and error states

- **Loading:** skeleton stat cards + skeleton table rows (8), not a spinner.
- **Empty (no accounts):** “No accounts yet” + guidance.
- **Empty (filtered):** “No users match these filters” + **Clear filters**.
- **Queue clear:** compact success row, not a large empty card.
- **Request error:** inline `FormAlert` above the table, retry button.
- **Action error:** optimistic change reverts; non-blocking alert keyed to the
  row; the rest of the table stays interactive.

---

## 11. Accessibility

- Table uses real `<table>` semantics or `role="table"` grid with captions.
- Row actions reachable by keyboard; menus close on Escape and outside click.
- Confirmation dialogs use `role="alertdialog"` with labelled title and
  description (shared `ConfirmDialog`).
- Status is never conveyed by color alone — always a text label.
- Focus returns to the triggering button after a dialog closes.

---

## 12. Security & guardrails

- Only `admin` sessions can read or mutate this page.
- Admins cannot suspend/deactivate/delete their own account.
- The last active admin cannot be demoted, suspended, or deactivated.
- Email and phone are displayed but not editable here.
- All mutations are audit-logged with before/after values.
- No password hashes, reset tokens, or session tokens are ever serialized.

---

## 13. Implementation phases

1. **Read-only list** — `users/page.tsx`, `authService.listUsers`, stat cards,
   tabbed filters, table, pagination, detail drawer (identity + activity).
2. **Approval flow** — move `PendingRescuerList` into the page with the shared
   confirmation dialog + optimistic approve.
3. **Status actions** — suspend / reactivate / deactivate with confirmation,
   audit log, notification, optimistic revert-on-failure.
4. **Role management** — guarded role changes in the drawer.
5. **Polish** — skeletons, responsive card layout, empty states, keyboard and
   screen-reader pass, live refresh via `AdminLiveRefresh`.

---

## 14. Acceptance criteria

- `/admin/users` no longer renders the placeholder module page.
- Pending rescuers can be approved from the queue or the table, with a
  confirmation overlay that closes instantly and updates the row optimistically.
- The table filters by search, role, status, and barangay; the URL reflects the
  active view and stale results are never shown.
- Suspend/reactivate/deactivate all require confirmation, revert on failure, and
  write an audit entry.
- Admins cannot act destructively on their own account or remove the last admin.
- Layout matches the reports page language: same header scale, `StatCard`,
  `Badge`, `FormAlert`, `ConfirmDialog`, `OverlayCard`, and skeleton patterns.
- Works at 360 px, 768 px, and 1280 px widths.
