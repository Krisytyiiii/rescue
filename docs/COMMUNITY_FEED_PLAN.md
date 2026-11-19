# Community Feed — Adoption Posts (`/community`)

**Status:** planned (navbar banner + placeholder page implemented)
**Requirement:** #7 — Enable community members to post animals for adoption through the system.
**Public route:** `apps/web/src/app/community/page.tsx`
**Admin route (planned):** `apps/web/src/app/admin/(console)/community/page.tsx`
**Group:** Community
**Related:** `docs/ADMIN_LEARNING_PLAN.md`, `docs/ADMIN_MESSAGING_PLAN.md`, `docs/ADMIN_NOTIFICATIONS_PLAN.md`

---

## 1. Goal

Give residents of Mati City a safe, moderated place to post animals that need
homes. The feed is written and owned by the community; the admin team is a
**read-only moderator** — it can hide harmful posts but cannot edit or delete
what residents wrote.

### Roles

| Actor | Can do |
| --- | --- |
| Visitor | Browse visible posts, open a post, report a post |
| Community user / rescuer | Everything above, plus create, edit, and delete **their own** posts |
| Admin | Read every post, hide/unhide a post with a reason, resolve reports. **No editing or deleting resident content.** |

### Non-goals

- Replacing the official adoption records (`Animal`, `AdoptionRequest`).
- Direct messaging inside a post (reuse Messaging).
- Payments, donations, or fees.
- Admin-authored community posts.

---

## 2. Content model

A post represents one animal offered for adoption by a resident.

Fields:

- **Animal:** name, species (dog/cat/other), breed (optional), sex, approximate
  age, size, color/markings.
- **Listing:** barangay, short summary, full story, adoption status
  (`available` / `adopted` / `removed`).
- **Media:** 1–5 photos, first photo is the cover.
- **Contact:** preferred contact channel (`message` / phone / email) and optional
  note. Never expose private contact details publicly; reveal on request through
  the existing messaging system.
- **Author:** user id, display name, barangay, created/updated timestamps.
- **Moderation:** visibility (`visible` / `hidden`), hidden reason (internal),
  hidden by, hidden at.

### Prisma additions

Add to `prisma/schema.prisma` and generate a migration:

```prisma
enum CommunityPostStatus {
  available
  adopted
  removed
}

enum CommunityPostVisibility {
  visible
  hidden
}

model CommunityPost {
  id            Int     @id @default(autoincrement())
  authorId      String
  animalName    String
  species       String
  breed         String?
  sex           String?
  ageLabel      String?
  size          String?
  barangay      String
  summary       String
  story         String?
  status        CommunityPostStatus     @default(available)
  visibility    CommunityPostVisibility @default(visible)
  hiddenReason  String?
  hiddenById    String?
  hiddenAt      DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  author  User                @relation(fields: [authorId], references: [id])
  hiddenBy User?              @relation("PostHiddenBy", fields: [hiddenById], references: [id])
  media   CommunityPostMedia[]
  reports CommunityPostReport[]

  @@index([visibility, createdAt])
  @@index([authorId])
  @@index([species])
}

model CommunityPostMedia {
  id        Int    @id @default(autoincrement())
  postId    Int
  url       String
  sortOrder Int    @default(0)
  post      CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId, sortOrder])
}

model CommunityPostReport {
  id          Int      @id @default(autoincrement())
  postId      Int
  reporterId  String
  reason      String
  detail      String?
  resolvedAt  DateTime?
  resolvedById String?
  createdAt   DateTime @default(now())

  post       CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  reporter   User          @relation(fields: [reporterId], references: [id])
  resolvedBy User?         @relation("ReportResolvedBy", fields: [resolvedById], references: [id])

  @@unique([postId, reporterId])
  @@index([postId, resolvedAt])
}
```

**Rule:** a post hidden by an admin can never be shown in public queries,
regardless of author action. Only unhide returns it to the feed.

---

## 3. Public page — `/community`

### Layout

1. **Page header** — eyebrow, title, one-line description, primary CTA
   ("Post an animal") for signed-in residents, sign-in prompt otherwise.
2. **Filter bar** — species chips (`All` / `Dogs` / `Cats` / `Other`), barangay
   select, search, sort (`Newest` / `Oldest`).
3. **Feed grid** — responsive 1/2/3 columns of post cards.
4. **Pagination** — 12 per page, shared `Pagination`; hides itself on one page.
5. **Empty states** — no posts yet vs no matches, using `SearchEmpty`.

### Post card

- Cover photo (4:3), status badge, species tag.
- Animal name, age/size line, barangay.
- Two-line summary, author name, relative time.
- Unavailable (`adopted` / `removed`) posts stay visible but are dimmed and
  labelled; hidden posts are excluded entirely.

### Post detail

- Route `/community/[id]` with an overlay-style reader (reuse `OverlayCard`
  patterns).
- Photo gallery, full story, animal facts, barangay, author.
- Actions: **Contact via message** (sign-in required), **Report**, and
  **Edit/Delete** for the owner only.
- Hidden or removed posts show a polite unavailable state; hidden posts are
  treated as not found for non-owners.

### Composer — `/community/new` (step wizard)

Reuse the Add-animal stepper pattern:

1. **Animal** — name, species, breed, sex, age, size.
2. **Story** — summary, description, barangay.
3. **Photos** — 1–5 images with cover selection (reuse upload endpoint).
4. **Review & publish** — preview card, contact preference, submit.

Validation: required name, species, barangay, summary, at least one photo.
Rate limit: 5 active posts per user, then require an old post to be removed.

---

## 4. Admin page — `/admin/community`

Read-only by design.

### Header

- Title "Community feed", short subtitle, KPI `StatCard`s:
  total posts, visible, hidden, open reports.

### List

- Read-only cards/rows: cover, animal name, author, barangay, status,
  visibility, report count, created date.
- Filters: `All`, `Visible`, `Hidden`, `Reported` using `TabFilters`.
- Search by animal name, author, barangay.
- Pagination 10 per page.
- Row click opens a read-only detail overlay (author content is not editable).

### Moderation actions

- **Hide post** — opens `ConfirmDialog`, requires a reason (select from
  guidelines: harmful content, scam, animal cruelty, wrong category, other +
  note). On confirm: optimistic `visibility = hidden`, close dialog, toast.
- **Unhide post** — confirmation, optimistic, toast.
- **Resolve report** — mark the report handled; hiding is a separate action.
- No edit, no delete, no republishing on behalf of the resident.

### Audit

- Every hide/unhide/resolve writes an admin audit entry (actor, post id, reason,
  timestamp) so moderation is traceable.

---

## 5. APIs

### Public / member

| Method | Route | Notes |
| --- | --- | --- |
| `GET` | `/api/community/posts` | Visible only; filter, search, pagination |
| `GET` | `/api/community/posts/[id]` | Visible detail; owner can fetch own hidden post |
| `POST` | `/api/community/posts` | Auth required; creates a post |
| `PUT` | `/api/community/posts/[id]` | Owner only |
| `DELETE` | `/api/community/posts/[id]` | Owner only (soft delete) |
| `POST` | `/api/community/posts/[id]/report` | Auth required; one report per user |
| `POST` | `/api/community/uploads` | Auth required; image upload |

### Admin

| Method | Route | Notes |
| --- | --- | --- |
| `GET` | `/api/admin/community/posts` | All posts, including hidden |
| `POST` | `/api/admin/community/posts/[id]/hide` | Requires reason |
| `POST` | `/api/admin/community/posts/[id]/unhide` | Restores visibility |
| `POST` | `/api/admin/community/reports/[id]/resolve` | Marks report handled |

All admin mutations broadcast `community_posts` through
`broadcastAdminChange` and refresh through `AdminLiveRefresh`.

---

## 6. Core module

```
packages/core/src/modules/community/
  community.types.ts        # DTOs + input schemas
  community.schema.ts       # zod inputs
  community.repository.ts   # Prisma queries
  community.service.ts      # authorization, moderation, listing
  index.ts
```

Service responsibilities:

- `listPublicPosts(filters)` — always filters `visibility = visible` and
  `deletedAt = null`.
- `createPost`, `updatePost`, `deletePost` — assert ownership.
- `hidePost`, `unhidePost` — admin role required; store reason + actor.
- `reportPost`, `resolveReport`.
- Never expose `hiddenReason`, reporter identity, or private contact details in
  public DTOs.

---

## 7. Files

**Public**

- `apps/web/src/app/community/page.tsx`
- `apps/web/src/app/community/[id]/page.tsx`
- `apps/web/src/app/community/new/page.tsx`
- `apps/web/src/components/community/community-feed.tsx`
- `apps/web/src/components/community/post-card.tsx`
- `apps/web/src/components/community/post-detail.tsx`
- `apps/web/src/components/community/post-composer.tsx`

**Admin**

- `apps/web/src/app/admin/(console)/community/page.tsx`
- `apps/web/src/components/admin/community/community-console.tsx`
- `apps/web/src/components/admin/community/community-detail.tsx`
- `apps/web/src/components/admin/community/hide-dialog.tsx`

**Nav / seed**

- `apps/web/src/components/admin/admin-sidebar.tsx` → Community → "Community feed"
- `apps/web/src/lib/admin/modules.ts` → `community` metadata
- `scripts/seed-community.ts` (`npm run db:seed-community`)

---

## 8. Phases

1. **Data + core** — schema migration, core module, ownership rules, seed.
2. **Public feed** — `/community` grid, filters, pagination, detail state.
3. **Composer** — stepper, image upload, validation, rate limit.
4. **Admin moderation** — read-only console, hide/unhide with reason, audit.
5. **Reports** — resident reporting, admin report queue, resolve.
6. **Polish** — empty states, notifications on hide, accessibility pass.

---

## 9. Acceptance criteria

- A signed-in community member can publish an adoption post with photos and
  animal details, then see it in `/community`.
- The post author can edit or delete only their own post.
- Admin viewers see every post but have **no edit or delete control**.
- Admin can hide a post with a reason; it immediately disappears from the public
  feed and detail pages for residents.
- Admin can unhide a post and it returns to the feed.
- Hidden posts never appear in public list or search results.
- Residents can report a post; reports surface in the admin console.
- Every hide/unhide is optimistically reflected in the admin UI and confirmed by
  a toast.
