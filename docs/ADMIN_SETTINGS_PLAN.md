# Admin — Settings (`/admin/settings`)

**Status:** phase 1 implemented (overview probes, integrations, audit panel, account profile editing + password change); phases 2–4 remain planned
**Route:** `apps/web/src/app/admin/(console)/settings/page.tsx`
**Components:** `apps/web/src/components/admin/settings/*`
**Service:** `packages/core/src/modules/settings/settings.{service,repository,types,schema}.ts`
**Data source:** `prisma/schema.prisma` → `SystemSetting` (new), `Barangay`, `User`, plus read-only runtime config
**Group:** System
**Related:** `docs/ADMIN_AUDIT_PLAN.md`, `docs/ADMIN_USERS_PLAN.md`, `docs/ADMIN_ANALYTICS_PLAN.md`

**Design direction:** a **configuration workspace**, not a developer console. Everyday
operational values should be editable and explained in plain language; secrets and
infrastructure details should be visibly read-only, with their source ("set via
environment") and health ("configured / not configured") shown without leaking values.

---

## 1. Objective & purpose

Give an administrator one trustworthy place to:

1. Confirm the system is healthy and correctly wired (environment, storage, realtime, database).
2. Adjust operational defaults that are currently hard-coded in the domain layer.
3. Maintain barangay reference data used by reports, users, and analytics.
4. Manage their own account and password.
5. See where to review the history of configuration changes.

The page must never expose secrets, never allow destructive configuration, and every
write must be audited.

### 1.1 Audiences

| Role | Why they use it |
| --- | --- |
| **Administrator** | Day-to-day configuration, account maintenance, and health checks |
| **City vet / program lead** (future) | Read-only oversight of operational defaults |
| **Developer / support** | Confirm environment wiring without opening the server shell |

### 1.2 Current state (settings)

What already exists:

- Sidebar footer item and account-menu link both point to `/admin/settings`.
- `ADMIN_MODULES.settings` describes the intended scope: barangay reference data,
  notification defaults, upload limits, and environment status.
- The route has no page — it renders the generic `[module]` placeholder.
- No settings table, service, API route, or audit actions exist.
- Operational values are currently hard-coded:
  - `INTERVIEW_VENUE = "City Vet Building"` (`adoptions.types.ts`)
  - `VACCINATION_DUE_WINDOW_DAYS = 7` (`health.types.ts`)
  - `MAX_IMAGE_SIZE_MB`, `MAX_VIDEO_DURATION_SECONDS`, `SUPABASE_STORAGE_BUCKET` (`config/env.ts`, partly unused)
  - Admin list page size `10`, audit page size `10` (per-page constants)
- Barangays exist in the schema (`Barangay` with center coordinates and GeoJSON) with no
  admin editor.
- Password change exists in `authService.changePassword` but has no admin UI or route.

---

## 2. Page contents

The page is a single route with a **section rail** (desktop) / **secondary tabs** (mobile).
Each section is a card or a small stack of cards. Only sections with real data are shown
in phase 1; later phases fill in the editable panels.

### 2.1 Header

- Eyebrow: "System"
- Title: "Settings"
- Caption: "Configuration, reference data, and integration status for the FuRescue admin console."
- Right utilities:
  - **Environment badge**: `Development` / `Staging` / `Production` (from `NODE_ENV`)
  - **Last changed** relative timestamp (most recent `SystemSetting.updatedAt`)
  - Link: **View audit history** → `/admin/audit?domain=system`

### 2.2 Section rail

| Section | Purpose | Phase |
| --- | --- | --- |
| **Overview** | Health + environment summary and quick links | 1 |
| **General** | Organization identity and contact defaults | 2 |
| **Operations** | Rescue, health, and adoption defaults | 2 |
| **Notifications** | Reminder and delivery defaults | 2 |
| **Media & storage** | Upload limits and storage status | 2 |
| **Barangays** | Reference data table and editor | 3 |
| **Account & security** | Signed-in admin profile and password | 1 |
| **Integrations** | Read-only wiring and capability status | 1 |
| **Audit & retention** | Audit link and retention policy status | 1 |

Phase 1 sections are read-only except **Account & security** (password change). A
"Read-only" badge sits on every environment-derived value with the tooltip
"Set via environment variables".

### 2.3 Overview

A two-row summary.

**Status strip (4 cards):**

| Card | Value | Meaning |
| --- | --- | --- |
| **Database** | `Connected` + latency ms | A single `SELECT 1` probe on page load |
| **Storage** | `Connected` / `Not configured` | Supabase URL + key present and bucket reachable |
| **Realtime** | `Live` / `Off` | Broadcast config present; link to how the audit/messaging live pill works |
| **Audit trail** | `Recording` + events in last 24h | Last `AuditLog.createdAt` and 24-hour count |

**Environment card:** app name, environment, app URL, timezone (`Asia/Manila`),
runtime version, and current admin role. Values are display-only.

Quick links: **Users & access**, **Audit logs**, **Analytics**.

### 2.4 General (phase 2)

Editable values stored in `SystemSetting`:

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| Organization display name | string, 2–80 | `APP_NAME` (`FurRescue`) | Shown in email/notification copy |
| Public contact email | email | empty | Displayed on public-facing error pages |
| Support phone | PH phone | empty | Optional; validated with `phone-input` rules |
| Timezone | read-only | `Asia/Manila` | Single-city deployment; no picker |

Read-only rows: app URL, API base URL, environment.

### 2.5 Operations (phase 2)

| Field | Type | Default | Used by |
| --- | --- | --- | --- |
| Adoption interview venue | string, 2–120 | `City Vet Building` | Adoption scheduling copy |
| Vaccination due window | integer 1–30 days | `7` | `refreshVaccinationReminders`, health watchlist |
| Adoption follow-up lead days | integer 1–30 days | `3` | Future follow-up reminders |
| Default report range | `7d` / `30d` / `90d` | `7d` | Analytics/report landing filter (preference, not data) |

Each field has a one-line helper explaining the operational effect, e.g. "Vaccinations
due within this window are marked **due** and raise an admin reminder."

### 2.6 Notifications (phase 2)

Toggles plus lead times. Only the `in_app` channel exists today; email/SMS appear as
disabled rows labelled "Not configured" rather than fake switches.

| Field | Type | Default |
| --- | --- | --- |
| Vaccination reminders | boolean | on |
| Adoption follow-up reminders | boolean | on |
| New report alerts to admins | boolean | on |
| Daily admin digest | boolean | off (future scheduler) |
| Reminder send time | time (`time-picker`) | `08:00` |

### 2.7 Media & storage (phase 2)

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| Max image size | integer 1–25 MB | `MAX_IMAGE_SIZE_MB` (5) | Applies to report, animal, and learning uploads |
| Max video duration | integer 5–300 seconds | `MAX_VIDEO_DURATION_SECONDS` (30) | Reports only |
| Allowed image types | read-only chips | `jpg`, `png`, `webp` | Validation lives in code |
| Storage bucket | read-only | `SUPABASE_STORAGE_BUCKET` | Never show credentials |
| Storage mode | read-only | `Local uploads` / `Supabase Storage` | Detected from config |

Include a link to the upload routes' behaviour, not raw paths. Do not show bucket
policies, signed URLs, or service-role status details beyond `configured`.

### 2.8 Barangays (phase 3)

A searchable table, newest/updated first:

| Column | Content |
| --- | --- |
| **Barangay** | Name |
| **Center** | `lat, lng` or "Not set" |
| **Boundary** | `GeoJSON` / "Not set" |
| **Users** | account count (link to `/admin/users?barangay=`) |
| **Reports** | report count (link to `/admin/reports?barangay=`) |
| **Updated** | relative time |

Row action: **Edit** overlay with name, latitude, longitude, and an optional GeoJSON
textarea with validation. **Add barangay** in the toolbar.

Rules:

- Name is unique; duplicate names fail with a field error, not a toast-only failure.
- Latitude/longitude must be valid decimal degrees and must be set together.
- Delete is only offered when the barangay has zero users and zero reports; otherwise
  the action explains what still references it. Deletion requires `ConfirmDialog`.
- Every create/update/delete writes an audit entry.

### 2.9 Account & security (phase 1)

Split into two cards.

**Profile (read-only in phase 1):** full name, email, role, assigned barangay, last
login, account status. Each row links to `/admin/users?q=<email>` for the full record.
Editing another admin's account stays on the Users page — this section is self-service.

**Password:** "Change password" opens an `OverlayCard` with current password, new
password, and confirmation. Uses the shared `PasswordStrength` component. Validation:

- Current password must verify.
- New password follows the existing auth schema minimum.
- Confirmation must match.
- Submitting closes the overlay immediately, shows a success toast, and never blocks
  the page. Failure reopens with a plain-language error.

Session info (read-only): JWT expiry (`JWT_EXPIRES_IN`), last login, and a note that
signing out ends this browser session.

### 2.10 Integrations (phase 1, read-only)

A compact definition list. Never render secret values; show status and masked host.

| Row | Display |
| --- | --- |
| Database | `Connected` / `Unreachable` + masked host (`db.****.supabase.co`) |
| Supabase URL | `Configured` + masked host |
| Supabase anon key | `Configured` / `Missing` (never the key) |
| Service role key | `Configured` / `Missing` (never the key) |
| Storage bucket | Bucket name |
| Realtime broadcasts | `Enabled` when URL + key exist |
| JWT expiry | e.g. `7 days` |
| Map tiles | Public provider name (Leaflet) |

Each row has a `Tooltip` explaining what breaks when it is missing. The section carries
a persistent note: "Values are set through environment variables. Changes require a
redeploy."

### 2.11 Audit & retention (phase 1)

- Link to `/admin/audit?domain=system` and a short explanation of what is recorded.
- **Retention policy:** read-only for now — "Kept indefinitely (append-only)".
- **Export history:** link to the audit CSV export.
- Phase 4 may add an editable retention window, but only with an export-before-prune
  confirmation.

---

## 3. Layout and interaction

### 3.1 Desktop

```
┌ Header: System / Settings / env badge / audit link ┐
├ Section rail (220px) │ Active section cards         ┤
│ Overview             │ - card title + description   │
│ General              │ - fields                     │
│ Operations           │ - helper text                │
│ Notifications        │ - footer save/reset          │
│ Media & storage      │                              │
│ Barangays            │                              │
│ Account & security   │                              │
│ Integrations         │                              │
│ Audit & retention    │                              │
└──────────────────────┴──────────────────────────────┘
```

- Rail is sticky under the admin navbar and uses a faint ink wash for the active item.
- Mobile switches to `SecondaryTabFilters` with a horizontally scrollable row.
- Section selection is URL-synced (`/admin/settings?section=operations`) so a link can
  open a specific panel.
- Each editable section has its own dirty state, **Save changes**, and **Reset**. Save is
  disabled until something changes. Leaving a dirty section via the rail prompts with a
  `ConfirmDialog` ("Discard unsaved changes?").
- Saves are per section, not one giant form, so one failing field never blocks unrelated
  configuration.
- Success and failure use `useToast`; no inline success banners. Field-level validation
  stays inline next to the input.
- Read-only rows use plain definition cells, not disabled inputs, so they cannot be
  mistaken for editable fields.

### 3.2 Loading and error states

- Route-level `loading.tsx` uses `AdminPageSkeleton` with the settings shape: heading,
  section rail, and two cards.
- Section skeletons mirror the real rows (label line + value line) — no generic bars.
- Integration probes render individual skeleton rows while pending; a failed probe
  shows `Unreachable` with a retry icon, never a stack trace.
- Empty barangays show `SearchEmpty` with "Add the first barangay".

### 3.3 Confirmation rules

| Action | Confirmation |
| --- | --- |
| Save section | none — button + toast |
| Reset section to defaults | `ConfirmDialog` |
| Change password | overlay form (submit is the confirmation) |
| Delete barangay | `ConfirmDialog` with reference consequences |
| Discard unsaved changes | `ConfirmDialog` |

All destructive confirms close immediately and report through toasts.

---

## 4. Data model

### 4.1 New table (phase 2)

```prisma
model SystemSetting {
  key             String   @id @db.VarChar(80)
  value           Json
  updatedByUserId String?  @map("updated_by_user_id") @db.Uuid

  updatedBy User? @relation("SystemSettingUpdater", fields: [updatedByUserId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("system_settings")
}
```

Add the inverse relation on `User`:

```prisma
systemSettingsUpdated SystemSetting[] @relation("SystemSettingUpdater")
```

Migration: `20261119000003_system_settings`.

Why a key/value table instead of one wide row:

- New defaults can ship without a migration.
- Each key is independently validated and audited.
- Unknown keys are ignored by the service, so downgrades are safe.

Values are validated by a code allowlist (`settings.schema.ts`) with Zod; the database
stores JSON only. Missing keys fall back to code defaults, so the table can stay sparse.

### 4.2 Setting catalog

| Key | Zod shape | Default |
| --- | --- | --- |
| `general.organizationName` | string 2–80 | `APP_NAME` |
| `general.contactEmail` | email | none |
| `general.supportPhone` | PH phone | none |
| `operations.interviewVenue` | string 2–120 | `City Vet Building` |
| `operations.vaccinationDueWindowDays` | int 1–30 | `7` |
| `operations.adoptionFollowupLeadDays` | int 1–30 | `3` |
| `operations.defaultReportRange` | enum `7d`/`30d`/`90d` | `7d` |
| `notifications.vaccinationReminders` | boolean | `true` |
| `notifications.adoptionFollowupReminders` | boolean | `true` |
| `notifications.newReportAlerts` | boolean | `true` |
| `notifications.dailyDigest` | boolean | `false` |
| `notifications.reminderTime` | `HH:mm` | `08:00` |
| `media.maxImageSizeMb` | int 1–25 | `MAX_IMAGE_SIZE_MB` |
| `media.maxVideoDurationSeconds` | int 5–300 | `MAX_VIDEO_DURATION_SECONDS` |

Secrets are **not** settings. `DATABASE_URL`, Supabase keys, and `JWT_SECRET` remain
environment-only and are never written to the database.

### 4.3 Service layer

Create `packages/core/src/modules/settings/`:

```ts
getOverview(actor)                 // admin only: status probes + counts + last change
getSettings(actor)                 // merged catalog values + metadata
updateSettings(actor, section, patch) // allowlist + validate + audit
listBarangays(actor, query)        // search + counts
createBarangay(actor, input)
updateBarangay(actor, id, input)
deleteBarangay(actor, id)          // rejects when referenced
changeAdminPassword(actor, input)  // wraps authService.changePassword
getIntegrationStatus(actor)        // booleans + masked hosts only
```

Implementation notes:

- `requireRole(actor, "admin")` at the service boundary for every method except
  `changeAdminPassword`, which uses the signed-in user id.
- `updateSettings` runs in one transaction: upsert changed keys, then `writeAuditLog`
  with `action: "update_settings"`, `entityType: "system_setting"`, and one old/new map
  for the section.
- Never return raw env values from `getIntegrationStatus`; return `{ configured, host }`.
- Barangay delete checks `user.count` and `report.count` in the same transaction and
  throws `ConflictError` with the counts when referenced.

### 4.4 Consumers of the new settings

Phase 2 must wire values into the domain, not just store them:

- `adoptionsService` reads `operations.interviewVenue` instead of `INTERVIEW_VENUE`.
- `healthService.refreshVaccinationReminders` reads `vaccinationDueWindowDays`.
- Upload routes validate against `media.maxImageSizeMb` / `maxVideoDurationSeconds`.
- Notification helpers check the three reminder toggles before sending.

Until wiring lands, the UI labels these as "Saved — applies after the next deploy" only
if that is true; otherwise the phase ships both together. Do not display a setting that
has no effect.

---

## 5. API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/settings` | Settings + integration status + overview |
| `PATCH` | `/api/admin/settings` | Validate and save one section |
| `GET` | `/api/admin/settings/barangays` | Searchable reference list with counts |
| `POST` | `/api/admin/settings/barangays` | Create |
| `PATCH` | `/api/admin/settings/barangays/[id]` | Update name/coordinates/GeoJSON |
| `DELETE` | `/api/admin/settings/barangays/[id]` | Delete when unreferenced |
| `POST` | `/api/admin/settings/password` | Change the signed-in admin's password |

All routes use `requireAdminActor()` and `apiError()`. Validation failures return `422`
with field errors; conflicts return `409`. Never echo environment values.

---

## 6. Files to touch

- `prisma/schema.prisma` — `SystemSetting`, `User` inverse relation
- `prisma/migrations/20261119000003_system_settings/`
- `packages/core/src/modules/settings/settings.types.ts`
- `packages/core/src/modules/settings/settings.schema.ts`
- `packages/core/src/modules/settings/settings.repository.ts`
- `packages/core/src/modules/settings/settings.service.ts`
- `packages/core/src/modules/settings/index.ts`
- `packages/core/src/index.ts` — export the module
- `packages/core/src/modules/audit/audit.types.ts` — add `system` domain and actions
- `apps/web/src/components/admin/audit/audit-meta.ts` — labels/icons for new actions
- `apps/web/src/app/admin/(console)/settings/page.tsx`
- `apps/web/src/app/admin/(console)/settings/loading.tsx`
- `apps/web/src/components/admin/settings/settings-console.tsx`
- `apps/web/src/components/admin/settings/settings-sections.tsx` (split as needed)
- `apps/web/src/components/admin/settings/barangay-editor.tsx`
- `apps/web/src/components/admin/settings/change-password-dialog.tsx`
- `apps/web/src/app/api/admin/settings/route.ts`
- `apps/web/src/app/api/admin/settings/barangays/route.ts`
- `apps/web/src/app/api/admin/settings/barangays/[id]/route.ts`
- `apps/web/src/app/api/admin/settings/password/route.ts`
- `docs/ADMIN_SETTINGS_PLAN.md` — this file

Reuse: `ScrollArea`, `SecondaryTabFilters`, `SearchInput`, `Select`, `OverlayCard`,
`ConfirmDialog`, `Tooltip`, `Toast`, `Badge`, `Button`, `StatCard`, `SearchEmpty`,
`FormAlert`, `PasswordStrength`, `TimePicker`, `Pagination`, `AdminPageSkeleton`.

---

## 7. Implementation phases

### Phase 1 — Read-only overview and account

- Replace the placeholder with the real route and section rail.
- Overview status strip, environment card, integrations table, audit/retention panel.
- Account & security: profile summary + working change-password overlay/API.
- Add the route `loading.tsx` skeleton.
- No schema change.
- Acceptance: an admin can confirm integration health and change their password
  without leaving the console.

### Phase 2 — Editable operational defaults

- Add `SystemSetting`, catalog schema, repository, service, `GET`/`PATCH` API.
- Build General, Operations, Notifications, and Media & storage panels with per-section
  save/reset and dirty-state guards.
- Wire each value into its consumer (adoptions, health reminders, uploads,
  notifications).
- Audit every section update under the new `system` domain.
- Acceptance: changing the interview venue or due window changes the generated copy
  and reminder behaviour after saving.

### Phase 3 — Barangay reference management

- List/search with counts, add/edit overlay, guarded delete.
- Validate coordinates and GeoJSON; unique names.
- Audit create/update/delete.
- Acceptance: a new barangay is immediately available on the Users and Reports filters.

### Phase 4 — Optional hardening

- Audit retention window with export-before-prune confirmation.
- Saved settings snapshots for compliance reviews.
- Storage usage meter.
- Email/SMS provider configuration (separate plan; secrets stay server-side).

---

## 8. Acceptance criteria

1. `/admin/settings` is a real page, visible only to admins, not the `[module]`
   placeholder.
2. Overview shows database, storage, realtime, and audit status without exposing any
   secret or full connection string.
3. Phase 2 fields save per section, validate inline, and show a toast on success or
   failure.
4. Reset-to-default and barangay deletion both require confirmation.
5. Unsaved changes are guarded when switching sections.
6. Barangay create/update/delete respects uniqueness and reference guards.
7. Password change verifies the current password and closes immediately on submit.
8. Every settings or barangay mutation writes an audit row and appears in
   `/admin/audit?domain=system`.
9. Loading skeletons mirror the section rows and cards (route-level and per probe).
10. No UI path can read a secret, edit an environment value, or delete a referenced
    barangay.
11. `npx tsc --noEmit -p apps/web/tsconfig.json` passes.

---

## 9. Verification

- Load `/admin/settings` with and without Supabase env vars; confirm status rows degrade
  to `Not configured` instead of crashing.
- Toggle each section's dirty state and confirm the discard prompt.
- Save a field with invalid input and confirm the inline error and no audit row.
- Change the vaccination due window, run `refreshVaccinationReminders`, and confirm the
  status horizon moved.
- Create, rename, and attempt to delete a referenced barangay.
- Change a password, sign out, and sign back in with the new one.
- Confirm every mutation appears in the audit ledger under the `system` domain.
- Run the typecheck from the repo root.

---

## 10. Out of scope (for this plan)

- Editing or viewing secrets, connection strings, or service-role keys.
- Role/permission matrix editing (roles stay fixed; account roles live on Users).
- Theme customization or personal display preferences.
- Backup, restore, or destructive data tools.
- Multi-city tenancy or timezone selection.
- Email/SMS provider setup (future, separate plan).
