# Mobile app - Resident & Rescuer screens

**Status:** planned
**Platform:** Expo (SDK 58, expo-router) - `apps/mobile`
**Roles:** `community_user` (resident) and `rescuer` only
**Out of scope:** the admin console stays web-only (`apps/web/admin`)

**Design direction:** a field-first companion app, not a shrunken website. Big
touch targets, one-thumb reach, camera/location in the first tap, and screens
that stay readable in bright sunlight. Rescuers get an operational shell;
residents get a calm report/adopt/learn shell. Both share auth, messaging,
notifications, and profile screens.

---

## 1. Roles and what each can do

| Capability | Resident | Rescuer |
| --- | --- | --- |
| Sign up / sign in | yes, active immediately | yes, account pending until admin approval |
| Submit an animal report | yes | yes |
| Follow own reports | yes | yes |
| Browse adoptable animals | yes | yes |
| Apply to adopt | yes | yes |
| Message staff / other participants | yes | yes |
| Notifications | yes | yes |
| Learning modules | yes, published only | yes, published only |
| Edit own profile | yes | yes |
| Assigned rescue queue | no | yes |
| Advance a rescue (accept, en route, on site, complete) | no | yes |
| Field photos + outcome notes | no (report photos only) | yes |
| Rescue history / workload | own reports | own completed ops |
| Favorites | phase 4 | phase 4 |
| Community adoption feed | phase 4 (backend not built) | phase 4 |

Rescuer screens are hidden unless `user.role === "rescuer"` and
`accountStatus === "active"`. A pending rescuer is routed to a blocking
"waiting for approval" screen, matching the web signup flow.

---

## 2. Navigation model

### 2.1 Resident shell (bottom tabs)

```
[ Home ] [ Adopt ] [ + Report ] [ Learn ] [ Profile ]
```

- **Report** is a raised center button that opens the report flow as a modal
  stack, not a tab destination.
- Messages and notifications live in the Home header (bell + chat with unread
  badges) so the five tabs stay uncluttered.

### 2.2 Rescuer shell (bottom tabs)

```
[ Today ] [ Map ] [ Queue ] [ Messages ] [ Profile ]
```

- **Today** - assignments for the signed-in rescuer, grouped by live state.
- **Map** - nearby verified reports and own active assignment markers.
- **Queue** - verified/unassigned reports in the city (read-only; dispatch stays
  with admins).
- **Messages** - conversations plus a notifications segment.
- **Profile** - account, workload stats, history link, sign out.
- Learning is reachable from Profile on the rescuer shell (not a primary tab).

### 2.3 Shared screens and stacks

```txt
app/
  _layout.tsx                     root: theme + session gate + toast host
  (auth)/
    welcome.tsx                   brand intro, Sign in / Create account
    login.tsx
    signup.tsx                    resident or rescuer intent
    pending.tsx                   rescuer awaiting admin approval
    complete-profile.tsx          Google onboarding hand-off (phase 4)
  (resident)/
    _layout.tsx                   tabs: home, adopt, report, learn, profile
    index.tsx                     Home
    report/
      index.tsx                   step 1: type / species / urgency
      details.tsx                 step 2: description + animal count
      location.tsx                step 3: map pin + landmark + barangay
      photos.tsx                  step 4: camera / library, 1-5 photos
      review.tsx                  step 5: confirm + duplicate warning
      success.tsx                 report code + track CTA
    reports/
      index.tsx                   My reports
      [id].tsx                    Report detail + timeline
    animals/
      index.tsx                   Browse adoptable animals
      [id].tsx                    Animal profile + Apply
    adopt/
      apply/[animalId].tsx        Adoption application form
      applications.tsx            My applications
      applications/[id].tsx       Application detail + interview + withdraw
    learn/
      index.tsx                   Published modules
      [id].tsx                    Module detail + lesson list + progress
      [id]/lesson/[lessonId].tsx  Lesson player
    messages/
      index.tsx                   Inbox
      [id].tsx                    Thread
    notifications.tsx
    profile/
      index.tsx
      edit.tsx
  (rescuer)/
    _layout.tsx                   tabs: today, map, queue, messages, profile
    index.tsx                     Today
    assignments/[id].tsx          Assignment detail + field actions
    map.tsx
    queue.tsx
    history.tsx
    learn.tsx                     reuses resident learn stack
    messages/...                  reuses resident message stack
    profile/...
  (shared)/
    notifications.tsx
    settings.tsx
```

Both shells import the same feature components; only tab order and visible
actions differ. A single `useSession()` hook decides which shell mounts.

---

## 3. Screen catalogue

Legend for **Backend**:
- **Ready** - core service + API route already work for this role.
- **Route** - core service exists; a public/user API route must be added.
- **Core** - core service needs new methods before the screen is useful.
- **Missing** - no service or schema support yet; deferred.

### 3.1 Auth (shared)

| # | Screen | Purpose | Key contents | Backend |
| --- | --- | --- | --- | --- |
| A1 | Welcome | Explain the app in one screen | Brand, two value props (report, adopt), Sign in / Create account | Ready (UI only) |
| A2 | Login | Email + password | Email, password show/hide, inline errors, "pending approval" state for rescuers, Google button (phase 4) | Route - login currently returns no token (httpOnly cookie only) |
| A3 | Sign up | Create resident or rescuer | First/middle/last, email, phone, barangay picker, password + strength, role choice (resident/rescuer), terms | Route - signup returns active/pending; mobile needs token for residents |
| A4 | Pending approval | Block pending rescuers | Status explanation, "check again" (re-login), contact admin note | Ready (result status `pending`) |
| A5 | Complete profile | Finish Google onboarding | Names, phone, barangay, role | Missing for mobile (web-only OAuth cookie flow; phase 4) |
| A6 | Forgot password | Deferred | - | Missing (no reset flow in core yet) |

**Auth rule:** the app must store the JWT in `expo-secure-store` and send it as
`Authorization: Bearer <token>` on every request. Today only the httpOnly cookie
is checked server-side (see section 4.1), so this is the first backend change.

---

### 3.2 Resident screens

#### R1 - Home (tab)

**Purpose:** answer "what should I do right now?" in under two seconds.

- Greeting + barangay.
- Primary action card: **Report an animal** (camera and location ready).
- "My active report" card when one exists: code, status badge, last update,
  Track button.
- Horizontal **Animals looking for a home** rail (3-5 published animals).
- **Continue learning** card (next unpublished-progress module).
- Recent notifications (max 3) with unread dot.
- Emergency contact strip (City Vet hotline) as a static config value.

**States:** first-run empty (no report, no application), loading skeleton,
offline banner with last-sync time.
**Backend:** Route - needs `/api/reports/mine`, `/api/animals`, `/api/notifications`.
Optionally one aggregated `/api/mobile/home` endpoint to avoid four round trips.

#### R2 - Report flow (modal stack, 5 steps)

**Purpose:** file a usable rescue report in under 90 seconds, even with weak
signal.

1. **Type** - stray / injured / abandoned; species dog / cat / unknown;
   urgency low / medium / high / critical (with short helper text).
2. **Details** - description (required, 20+ chars), animal count stepper.
3. **Location** - use current GPS, drag pin, landmark text, barangay picker.
   Show accuracy radius; block submit if permission denied without a manual pin.
4. **Photos** - camera or library, up to 5, client-side resize to <= 1 MB,
   remove/reorder, optional short caption.
5. **Review** - summary of all fields, duplicate warning if the API flags a
   nearby report within 50 m / 24 h ("RPT-2026-00031 was reported nearby. Is this
   the same animal?"), then Submit.

**Success:** big report code (`RPT-2026-00042`), status "Submitted", Track report
and Back home. Saved to an offline queue if the request fails; retry on reconnect.

**Backend:** Route - `POST /api/reports`, user media upload endpoint. Duplicate
detection already exists in the service (`findNearby`, 50 m / 24 h).

#### R3 - My reports

- Segmented filter: Active (submitted, verified, assigned, in_progress) /
  Closed (rescued, unable_to_locate, rejected, closed).
- Report card: cover photo, code, type, species, urgency chip, barangay,
  relative time, status badge.
- Pull to refresh; infinite scroll; empty state with "Report an animal".

**Backend:** Route - `GET /api/reports?reporter=me` (service needs a
`reporterUserId` filter or a dedicated `listMine`).

#### R4 - Report detail

- Photo carousel, report code, type/species/urgency, description.
- Static map with pin; landmark and barangay.
- Status timeline (from `statusHistory`): status, remarks, actor, timestamp.
- Assigned rescuer card (name + "Message" once a conversation exists).
- If rescued: link to the resulting animal profile.
- Actions: **Message staff**, **Cancel report** (submit -> withdrawn equivalent
  is not modelled; see non-goals), **Share** (code + location).

**Backend:** Route - `GET /api/reports/:id`; detail include already returns
status history, media, rescue operations, and resulting animal.

#### R5 - Animals (browse)

- Search + filters: species, sex, size, barangay/shelter, "available only".
- Card grid/feed: photo, name, breed, age label, sex, size, "Available" chip.
- Sort: newest, longest waiting.
- Pull to refresh; saved state; skeleton cards.

**Backend:** Route - `GET /api/animals?availableOnly=true&listingStatus=published`.
The service already supports all filters; the route must enforce
published/visible rows for non-admins.

#### R6 - Animal profile

- Swipeable photo gallery + caption.
- Name, code, species/breed, sex, age, size, color/markings, temperament,
  weight, neutered, intake date, description.
- Health summary chips: vaccinated, last checkup, heart-rate flag (read-only).
- Origin: rescued from report `RPT-...` (link if owned by the viewer).
- Sticky footer: **Apply to adopt** (disabled with reason if not available),
  **Message shelter**.
- Optional 3D model viewer if `model3dUrl` is present (phase 4).

**Backend:** Route - `GET /api/animals/:id`.

#### R7 - Adoption application

Multi-step form matching `CreateAdoptionInput`:

1. **Household** - housing type (house/apartment/condo/other), owned property,
   fenced area, household members.
2. **Experience** - other pets + details, prior pet experience, reason for
   adopting.
3. **Documents** - valid ID photo (required, camera), home photo (optional).
4. **Review** - animal summary, answers, fee/receipt reference note, submit.

Show interview expectations before submit ("If approved, meet-and-greet at City
Vet Building"). One open application per animal; duplicate attempts show the
existing application.

**Backend:** Route - `POST /api/adoptions`, user upload endpoint for ID/home
photos.

#### R8 - My applications

- Tabs: Open / Completed / Closed.
- Row: animal photo + name, status badge, submitted date, interview date if
  scheduled.
- Empty state with Adopt CTA.

**Backend:** Route - `GET /api/adoptions?adopter=me` (service already accepts
`adopterUserId`).

#### R9 - Application detail

- Status stepper: Submitted -> Under review -> Interview -> Approved -> Completed
  (Rejected/Withdrawn branch).
- Interview card with date/time, City Vet Building, "Add to calendar" and
  directions.
- Decision remarks from the reviewer, follow-up notes (read-only).
- Actions: **Withdraw** (confirm overlay) while submitted/under_review/
  interview_scheduled; **Message staff**; **View animal**.

**Backend:** Route - `GET /api/adoptions/:id`, `POST /api/adoptions/:id/withdraw`.

#### R10 - Messages (inbox + thread)

- Inbox: search, conversation rows with context chip (Report RPT-... / Adoption
  ADO-... / General), last message, unread badge, relative time.
- Thread: bubbles, sender role tag ("City Vet", "Rescuer"), attachment preview,
  day separators, read receipts where available, composer with photo/camera.
- Context banner at the top of the thread linking to the report or application.
- Poll or Supabase realtime while open; retry on send failure.

**Backend:** Route - `GET /api/conversations`, `GET /api/conversations/:id`,
`POST /api/conversations`, `POST /api/conversations/:id/messages`,
`POST /api/conversations/:id/read`. Core `messagingService` already supports all
of these but its routes are admin-scoped today.

#### R11 - Notifications

- Segments: All / Unread.
- Grouped by Today / This week / Earlier.
- Row icon per `notificationType` (report_status, adoption_status, new_message,
  vaccination_due, announcement, system), title, body, time, unread dot.
- Tap routes to the referenced screen (`referenceType` + `referenceId`).
- Mark one / mark all read.

**Backend:** Route - `GET /api/notifications`,
`GET /api/notifications/unread-count`, `POST /api/notifications/:id/read`,
`POST /api/notifications/mark-all-read`. Core methods exist under messaging.

#### R12 - Learn

- Module list: cover, title, category chip, lesson count, minutes, progress bar.
- Module detail: description, lesson list with completion checkmarks, progress.
- Lesson player: text / image / video / PDF renderer, previous/next, "Mark
  complete". Quiz support deferred (schema exists, UI does not).
- Completion triggers a small celebration + module progress update.

**Backend:** Ready (public routes exist) once Bearer auth is accepted:
`GET /api/learning/modules`, `GET /api/learning/modules/:id`,
`POST /api/learning/modules/:id/lessons/:lessonId/complete`.

#### R13 - Profile and settings

- Header: photo, full name, role chip, barangay, member since.
- Quick stats: reports filed, adoptions submitted, lessons completed.
- Edit profile: name, phone, barangay, photo upload.
- Change password (current + new + confirm, strength meter).
- Notification preferences (in-app / push - phase 4).
- About, privacy, terms, app version.
- Sign out (confirm overlay, clears secure storage and query cache).

**Backend:** Route - `GET /api/auth/me`, `PATCH /api/profile`,
`POST /api/profile/password`. Core `settingsService` already implements
`updateProfile` and `changePassword`.

#### R14 - Favorites (phase 4)

- Heart on animal cards; Favorites list in Profile.
**Backend:** Missing - only the `Favorite` table exists; needs a service module
and routes.

#### R15 - Community adoption feed (phase 4)

- Feed of resident-authored adoption posts, post detail, create/edit own post,
  report a post.
**Backend:** Missing - planned in `docs/COMMUNITY_FEED_PLAN.md`, not implemented.

---

### 3.3 Rescuer screens

#### F1 - Today (tab)

**Purpose:** the rescuer's shift at a glance.

- Duty header: date, live assignment count, completed today.
- **Active assignment** card first (largest): report code, urgency, species,
  distance, elapsed time, next action button ("Accept", "Start driving",
  "Mark on site", "Complete").
- Sections: Pending offers, En route, On site, Recently completed.
- Pull to refresh; badge count on tab icon.

**Backend:** Core - needs `rescuesService.listMine(actor)` returning assignments
for the signed-in rescuer (today's and active). Today only the admin console
read model exists.

#### F2 - Assignment detail

- Report block: photos, code, type, species, urgency, description, reporter
  display name, barangay, landmark.
- Map with route line to pin; **Navigate** opens the device maps app;
  **Call reporter** uses `tel:` (number revealed only to assigned rescuers).
- Timeline: assigned -> accepted -> en route -> on site -> completed/failed,
  with timestamps and notes.
- Actions by state:
  - `pending` -> Accept / Decline (reason)
  - `accepted` -> Start driving (en_route)
  - `en_route` -> Mark on site
  - `on_site` -> Add field photos, outcome notes, animals rescued, then Complete
  - any active -> Report problem (failed reason)
- Completion posts the outcome and (phase 4) offers "Create intake draft".

**Backend:** Core - `rescuesService` has no rescuer-facing transition methods.
Add `acceptAssignment`, `declineAssignment`, `startEnRoute`, `markOnSite`,
`completeOperation`, `reportProblem`, all scoped to `actor.userId` as the
assigned rescuer, each writing status history, audit, and a reporter
notification. Report status `in_progress` can already be set by a rescuer via
`reportsService.updateStatus`, but ownership is not checked - fix that in the
same pass.

#### F3 - Map (tab)

- Full-screen map with clustered markers: own active assignment (highlighted),
  verified/unassigned reports, verified reports assigned to others (muted).
- Filter chips: urgency, species, unassigned only.
- Bottom sheet on marker tap: report summary + "Open" (detail) or "Accept" if
  self-assignment is enabled (phase 4 policy).
- Location permission and "recenter" control.

**Backend:** Core/Route - needs a lightweight marker feed with a bounding box or
city-wide scope. `rescuesService.console()` returns markers but is admin-shaped
and heavy; add `GET /api/rescues/markers`.

#### F4 - Queue (tab)

- List of verified reports awaiting dispatch, grouped by urgency then age.
- Row: photo, code, species, urgency, barangay/landmark, time since verified,
  distance from current location.
- Read-only in v1; shows "Awaiting dispatch" so rescuers do not self-assign.
- Pull to refresh + auto-refresh every 60 s while foregrounded.

**Backend:** Route - `GET /api/reports?status=verified` plus geo sort; core list
supports the status filter, not distance sorting.

#### F5 - Rescue history

- Completed / failed operations, grouped by month.
- Row: report code, outcome, animals rescued, duration, date.
- Detail reuses F2 in read-only mode.
- Summary header: total rescues, completed this month, average response time.

**Backend:** Core - same `listMine` read model as F1 with a completed filter.

#### F6 - Field capture (within F2)

- Camera-first capture: multiple photos, optional short note, GPS stamp.
- Stored locally until the operation is submitted.
- Reuses the same uploader as reports.

**Backend:** Route - shared user media upload endpoint.

#### F7 - Rescuer profile

- Identity, barangay, contact, approval status.
- Workload: open assignments, completed today/month, acceptance rate (phase 4).
- Availability toggle - **deferred** (no schema field; would need
  `users.is_on_duty` or a `rescuer_availability` table).
- Links: History, Learning, Settings, Sign out.

**Backend:** Route - `GET /api/auth/me` plus rescuer stats endpoint.

#### F8 - Notifications and messages

Shared components with residents; the rescuer inbox also surfaces
`rescue_assignment` notifications with Accept/Decline shortcuts.

---

## 4. Backend prerequisites (blocking gaps)

These must land before or alongside the mobile screens. Ordered by impact.

### 4.1 Bearer token authentication (P0)

`apps/web/src/lib/auth/session.ts` only reads the `furescue_session` cookie, and
`/api/auth/login` returns the user but not the token. Mobile cannot use httpOnly
cookies reliably.

- Return `token` + `expiresIn` in the login/signup response (or add
  `/api/auth/mobile/login`).
- Accept `Authorization: Bearer <jwt>` in `readSession()` as a fallback to the
  cookie, verified with the same issuer/secret.
- Keep cookie auth for the web app unchanged.
- Store the token in `expo-secure-store`; clear it on 401.

### 4.2 User-facing API routes (P0)

All business logic exists in `@furescue/core`; the routes are missing. Add a
non-admin route group that builds `Actor` from the Bearer session:

```txt
POST   /api/reports                      GET /api/reports/mine
GET    /api/reports/:id                  (reporter or staff only)

GET    /api/animals                      GET /api/animals/:id
POST   /api/adoptions                    GET /api/adoptions/mine
GET    /api/adoptions/:id                POST /api/adoptions/:id/withdraw

GET    /api/conversations                GET /api/conversations/:id
POST   /api/conversations                POST /api/conversations/:id/messages
POST   /api/conversations/:id/read

GET    /api/notifications                GET /api/notifications/unread-count
POST   /api/notifications/:id/read       POST /api/notifications/mark-all-read

GET    /api/auth/me                      PATCH /api/profile
POST   /api/profile/password

GET    /api/rescues/mine                 GET /api/rescues/markers
POST   /api/rescues/:id/accept           POST /api/rescues/:id/decline
POST   /api/rescues/:id/en-route         POST /api/rescues/:id/on-site
POST   /api/rescues/:id/complete         POST /api/rescues/:id/fail
```

### 4.3 Media upload for residents and rescuers (P0)

Report photos, adoption IDs/home photos, field photos, and profile photos need a
non-admin upload endpoint. Reuse the existing Supabase storage plumbing behind
`/api/uploads` with size/type validation and per-user paths. Never expose the
service-role key.

### 4.4 Rescuer field transitions and ownership (P0)

`rescuesService` only exposes admin actions (`cancel`, `markFailed`,
`createIntake`) plus the admin console read model. Add the rescuer transitions
listed in F2, enforce `assignment.rescuerUserId === actor.userId`, and notify the
reporter plus admins. Also scope `reportsService.updateStatus` for rescuers to
reports they are assigned to.

### 4.5 Data filters (P0/P1)

- `ListReportsQuery.reporterUserId` or `listMine`.
- `GET /api/reports` must not leak other residents' reports to a resident.
- Animal list must force `listingStatus = published` for non-staff.
- Optional geo sort for the rescuer queue.

### 4.6 Push notifications (P2)

The schema has `NotificationChannel.push`, but there is no device-token table and
no sender. For v1, poll `unread-count` while foregrounded. For real push, add a
`DeviceToken` model (user, expo token, platform, last seen), register on login,
and send through Expo Push in `notificationsService.notify` when channel is
`push`.

### 4.7 Offline queue (P2)

Reports submitted in low-signal barangays should persist locally (AsyncStorage /
SQLite) and retry with an idempotency key. Add `clientReportId` to
`CreateReportInput` and dedupe server-side, or accept the existing duplicate
detection plus a client-side retry guard.

### 4.8 Deferred / not built

- Password reset (A6).
- Google sign-in deep link for mobile (A5).
- Favorites (R14).
- Community feed (R15).
- Rescuer availability / on-duty state (F7).
- Quiz UI (learning player is lessons-only).
- Online payments and donations - out of scope per product decisions.

---

## 5. Shared UX rules

- **One primary action per screen.** Sticky bottom CTA on flows; nothing
  critical hidden behind a menu.
- **Confirm every destructive/state-changing action** in a bottom sheet: what
  happens, consequence, destructive tone. Optimistic update, background request,
  revert + inline error on failure (mirrors the web action rules).
- **States are designed, not default:** loading skeleton, empty, offline,
  permission denied, 401 signed-out, 403 not-allowed, 5xx retry.
- **Status is always visible**: colored chips with text labels, never color
  alone. Status vocabulary matches the schema exactly.
- **Media is compressed on device** before upload (max width 1600 px, target
  <= 1 MB) and uploads show per-file progress.
- **Location permission** is requested in context (report flow / map), with a
  manual-pin fallback and a short rationale.
- **Offline banner** on Home, Report, and Today; queued items show a "Pending
  sync" chip.
- **Accessibility:** 44x44 minimum targets, dynamic type support, screen-reader
  labels on icon buttons, reduced-motion respected.

---

## 6. Design system mapping

Reuse the web palette so the product feels like one system. Replace the Expo
starter tokens in `apps/mobile/src/constants/theme.ts`:

| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#ffffff` | Screen background |
| `paper2` | `#f2faf4` | Cards, grouped lists |
| `ink` | `#10241a` | Primary text |
| `forest` | `#0f3a24` | Headings, dark surfaces |
| `moss` | `#16603b` | Primary buttons, active tabs |
| `clay` | `#1f7a4d` | Links, focus, report CTA |
| `claySoft` | `#7cc79a` | Progress, tinted chips |
| `sage` | `#b9dcc4` | Borders on tinted panels |
| `sand` | `#e3f1e6` | Section backgrounds |
| `line` | `rgba(16,36,26,0.14)` | Hairlines, dividers |

Typography: Instrument Serif (display headings only) + Geist/system sans for
body. Load via `@expo-google-fonts`; do not ship web fonts unsubsetted.

Status colors: neutral = sand/ink, in-progress = clay, success = moss,
warning = amber, danger = brick red. Define once in the theme and map every
`ReportStatus`, `AdoptionStatus`, `AssignmentStatus`, and `AccountStatus`.

---

## 7. Delivery phases

### Phase 0 - Foundation (1 sprint)

- Expo scaffold cleanup: remove starter screens, add `@furescue/core` dependency.
- Theme tokens, typography, base components (Button, Card, Chip, Field, Sheet,
  EmptyState, Skeleton, Toast).
- API client (base URL, envelope `{ ok, data, error }`, error mapping, 401
  handling), secure session store, `useSession`.
- Bearer auth + login/signup token response (4.1).
- Upload endpoint + image picker/compressor (4.3).
- Auth screens A1-A4 and both tab shells with placeholder screens.

**Exit:** a resident can sign up, sign in, restart the app, and stay signed in.

### Phase 1 - Resident core (2 sprints)

- Home, report flow (5 steps + offline retry), my reports, report detail.
- Notifications, profile/settings (R1-R4, R11-R13).
- Backend routes 4.2 for these screens + 4.5 privacy filters.

**Exit:** a resident files a report, tracks it to a status change, and receives a
notification on the phone.

### Phase 2 - Adoption and learning (2 sprints)

- Animal browse + profile, adoption application, my applications, application
  detail (R5-R9).
- Learning list/detail/player/complete (R12).
- Messages inbox/thread (R10).
- Media upload for ID/home photos.

**Exit:** a resident applies to adopt and messages the shelter inside the app.

### Phase 3 - Rescuer field app (2 sprints)

- Today, assignment detail with field transitions, map, queue, history
  (F1-F6, F8).
- Rescue service methods + ownership enforcement (4.4).
- Rescuer profile and stats (F7).

**Exit:** an assigned rescuer accepts, navigates, marks on site, and completes a
rescue with photos and notes; the reporter sees the update.

Phases 1 and 3 can swap if the pilot launches with rescuers first.

### Phase 4 - Polish and deferred features

- Push notifications (4.6), offline queue hardening (4.7).
- Google sign-in deep link, password reset.
- Favorites, community feed, intake drafts, 3D model viewer, quiz UI.
- Store assets, EAS build profiles, TestFlight / Play internal testing.

---

## 8. Acceptance criteria

**Resident**
- Can sign up as resident, stay signed in across restarts, and sign out.
- Can submit a report with location and photos in under 90 s; sees the code and
  can track status changes.
- Can browse only published, available animals and open a profile.
- Can submit one adoption application per animal, see its status and interview,
  and withdraw before approval.
- Can read and send messages and see unread badges.
- Can complete a lesson and see progress persist.

**Rescuer**
- Pending rescuers cannot enter the app; approved rescuers can.
- Sees only their assignments plus the read-only verified queue.
- Can accept/decline, go en route, mark on site, and complete with photos and
  notes; the reporter is notified at the right steps.
- Cannot act on an assignment that is not theirs (403).
- Sees completed history and stats.

**Cross-cutting**
- No admin-only screen or action is reachable from the app.
- Every network failure has a visible, recoverable state.
- Reports and applications survive a kill/restart while pending upload.
- Tokens never appear in logs or non-secure storage.

---

## 9. Non-goals (mobile v1)

- Admin, analytics, audit, user management, dispatch assignment, animal intake,
  health records authoring, learning authoring.
- Editing or deleting reports after submission; residents cancel by asking
  staff in the thread (unless a withdraw status is added to the schema).
- In-app payments, donations, or fees.
- Community-authored adoption posts.
- Offline-first for everything; only report submission is queued.
