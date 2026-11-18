# FurRescue Architecture

Modular monolith for the City of Mati animal rescue, adoption, and welfare platform.

```
furescue/
├─ apps/
│  ├─ web/                     Next.js 16 — public site + admin/rescuer console + API
│  └─ mobile/                  Expo — community + rescuer field app
├─ packages/
│  └─ core/                    @furescue/core — the monolith's domain layer
│     ├─ prisma/               (see root prisma/ — single schema owner)
│     └─ src/
│        ├─ config/env.ts      Validated runtime configuration
│        ├─ db/prisma.ts       Single Prisma client (pg driver adapter)
│        ├─ generated/prisma/  Generated Prisma client — do not edit
│        ├─ shared/            errors, authz, pagination, audit, API envelope
│        └─ modules/
│           ├─ auth/           roles, registration, login, JWT
│           ├─ reports/        reporting, verification, assignment, lifecycle
│           ├─ animals/        intake, profiles, listing moderation, lifecycle
│           ├─ adoptions/      applications, review, approval, follow-ups
│           ├─ health/         medical records, vaccinations, heart rate
│           └─ notifications/  in-app fan-out (admin + user)
├─ prisma/
│  ├─ schema.prisma            Full data dictionary (Supabase PostgreSQL)
│  ├─ migrations/              Applied with `prisma migrate deploy`
│  └─ seed.ts                  Roles + 26 Mati barangays
├─ prisma.config.ts            Prisma 7 config (schema, migrations, env)
└─ docs/ARCHITECTURE.md
```

## Layering rules

```
HTTP route (apps/web/src/app/api/**)  ·  Expo screen
        │
        ▼
   zod schema  →  service  →  repository  →  Prisma  →  Supabase
```

- **Route / controller** — parse input with the module's zod schema, build an
  `Actor` from the JWT, call one service method, map `AppError` to a response.
  No SQL, no business rules.
- **Service** (`*.service.ts`) — the only layer allowed to enforce rules:
  permissions, lifecycle transitions, duplicate detection, notifications,
  audit trails, multi-table transactions.
- **Repository** (`*.repository.ts`) — thin, typed Prisma queries. No rules.
- **Types** (`*.types.ts`) — DTOs, include shapes, transition maps.
- **Schema** (`*.schema.ts`) — zod contracts shared by web and mobile.
- **Index** (`index.ts`) — the module's public surface.

Nothing in `@furescue/core` imports HTTP. Every client is a thin shell over the
same services, so web and mobile can never drift apart.

## Module template

```
modules/<domain>/
├─ <domain>.types.ts        DTOs, Prisma include consts, transition maps
├─ <domain>.schema.ts       zod input contracts
├─ <domain>.repository.ts   data access only
├─ <domain>.service.ts      business rules + transactions + audit
└─ index.ts                 public exports
```

## Wiring a Next.js route

```ts
// apps/web/src/app/api/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  createReportSchema,
  listReportsSchema,
  reportsService,
  isAppError,
  ok,
  fail,
} from "@furescue/core";

export async function POST(request: NextRequest) {
  try {
    const input = createReportSchema.parse(await request.json());
    const report = await reportsService.create(input);
    return NextResponse.json(ok(report), { status: 201 });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(fail(error.code, error.message, error.details), {
        status: error.statusCode,
      });
    }
    throw error;
  }
}
```

Add `transpilePackages: ["@furescue/core"]` to `apps/web/next.config.ts` because
the core ships TypeScript source. Mobile uses the same package for types and
schemas; HTTP calls go to the web app's `/api` routes.

### Authentication

`authService.login()` returns an HS256 JWT signed with `JWT_SECRET`
(`sub`, `role`, `type: "access"`). The route layer verifies it with
`verifyAccessToken()` and builds:

```ts
const actor = { userId: payload.sub, role: payload.role, barangayId };
```

`authService.register()` only allows `community_user` and `rescuer` roles.
Admin accounts are created by an existing admin (User & Access Management).

#### Account approval

- **Resident (`community_user`)** — active immediately; signup returns an
  `active` result and a session cookie.
- **Rescuer** — created with `account_status = 'pending'`. No session is issued.
  The client is sent to `/signup/pending`, which explains that an administrator
  must approve the account. Admins receive an in-app notification.
- A pending rescuer who tries to sign in gets:
  *“Your rescuer account is waiting for admin approval.”*
- Admin queue:
  - `GET /api/admin/rescuers` — pending rescuer accounts
  - `POST /api/admin/rescuers/:id/approve` — activates the account and notifies
    the rescuer
- Approval is enforced in the service (`approveRescuer`), not the route.

#### Google sign-in / sign-up

Supabase Auth handles the Google OAuth handshake; FurRescue still issues its own
JWT session cookie.

| Route | Behaviour |
|---|---|
| `GET /api/auth/google/start?intent=login\|signup` | Redirects to Google via Supabase. |
| `GET /api/auth/google/callback?intent=…` | Exchanges the code, looks up the email in `users`. |
| `POST /api/auth/google/complete` | Creates the account from the verified email + profile form. |

- **Login intent** — if the Google email is not in `users`, the callback
  redirects to `/signup?reason=not_registered` with an explanatory message.
- **Signup intent** — if the email already exists, the user is signed in
  directly. Otherwise a short-lived `furescue_oauth_onboarding` cookie carries
  the verified email/name to `/signup/complete`, where the remaining profile
  fields are collected and `authService.registerOAuth()` creates the account
  with a random unusable password.

Setup in Supabase:

1. **Authentication → Providers → Google**: enable and paste the Google OAuth
   client ID/secret.
2. **Authentication → URL Configuration → Redirect URLs**: add
   `http://localhost:3000/api/auth/google/callback` (and the production URL).
3. In Google Cloud Console, the authorised redirect URI is the Supabase
   callback: `https://<project-ref>.supabase.co/auth/v1/callback`.

No Supabase session is kept after the callback — only the FurRescue JWT cookie.


### Error contract

Services throw `AppError` subclasses (`NotFoundError`, `ConflictError`, …).
Routes return `{ ok: false, error: { code, message, details } }` with the right
status code. Success is always `{ ok: true, data, meta? }`.

## Database

- PostgreSQL via Supabase, owned by **Prisma** (`prisma/schema.prisma`).
- snake_case tables/columns (`@@map`/`@map`), UUID primary keys, `timestamptz(6)`.
- Soft deletes (`deleted_at`) on users, reports, animals, adoption requests,
  conversations, and learning modules. Child rows cascade.
- Human-readable codes come from Postgres sequences, not `count()+1`:
  `RPT-2026-00001`, `FR-2026-0001`, `ADO-2026-00001`.
- Recommended indexes from the plan are created:
  `reports(status, barangay_id, submitted_at)`,
  `animals(lifecycle_status, species)`,
  `notifications(recipient_user_id, is_read)`, plus geo and FK indexes.
- Duplicate detection uses a haversine query inside `ReportsRepository
  .findNearby()` (50 m / 24 h). When you need scale, enable PostGIS using the
  commented SQL at the end of the initial migration and switch to `ST_DWithin`.

### Data dictionary notes

- `reports.resulting_animal_id` is **not** duplicated. The one-to-zero/one link
  is stored once, as `animals.source_report_id` (unique). This removes the
  circular foreign key and keeps a single source of truth.
- `favorites` has a composite primary key and a `created_at` (no `updated_at`;
  the row is immutable).
- `audit_logs` and `quiz_attempts` are append-only (`created_at` only).
- Heart-rate flag thresholds live in `modules/health/health.types.ts`
  (dog 60–140, cat 140–220) and should be confirmed by the City Vet.
- `receipt_reference_no` is included on adoption requests for over-the-counter
  payments. No online payment fields exist, per scope.

## Environment contract

| Variable | Scope | Purpose |
|---|---|---|
| `NODE_ENV` | server | runtime mode |
| `APP_NAME`, `APP_URL`, `API_BASE_URL` | server | app metadata and links |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | server only | access-token signing |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | client key (RLS enforced) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | new-style publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | bypasses RLS; never in bundles |
| `DATABASE_URL` | server only | pooled Prisma connection |
| `DIRECT_URL` | server only | migrations/seeding connection |
| `SUPABASE_STORAGE_BUCKET` | server | media bucket |
| `MAX_IMAGE_SIZE_MB`, `MAX_VIDEO_DURATION_SECONDS` | server/public config | upload limits |

All server variables are validated at boot by `config/env.ts`; the app refuses
to start with an invalid configuration. `.env` is git-ignored; `.env.example`
is the contract.

## Supabase setup checklist

1. **Apply the schema**
   ```bash
   npm run db:deploy      # prisma migrate deploy
   npm run db:seed        # roles + 26 barangays
   ```
2. **Storage buckets**
   - `furescue-media` (public read): animal photos, 3D models, learning assets.
   - `furescue-private` (no public read): valid IDs, home photos. Access only
     through short-lived signed URLs issued by the server.
3. **RLS** — Prisma uses the service role/`postgres` connection. Keep the REST
   API closed by default with RLS policies; the server enforces authorization in
   services. Never expose `SUPABASE_SERVICE_ROLE_KEY` to `NEXT_PUBLIC_*`.
4. **Connection pooling** — `DATABASE_URL` should use the transaction pooler
   (port `6543`) for the running app/serverless functions. Use the session
   pooler (port `5432`) or the direct host for `DIRECT_URL` (migrations/seed).
   Some networks block `5432`; in that case run migrations with the session
   pooler from another network, or apply `prisma/supabase-init.sql` in the
   Supabase SQL Editor and mark it with `prisma migrate resolve --applied`.

## What is implemented

- Full schema for all 29 tables and 29 enums.
- Role/user foundation with JWT auth.
- Reports: create, verify, reject, assign rescuer, status transitions, duplicate
  flagging, notifications, audit.
- Animals: intake, profile updates, listing moderation, lifecycle transitions.
- Adoptions: apply, review, interview, approve (auto-closes other applicants),
  complete, withdraw, follow-ups.
- Health: records, vaccinations with due/overdue reminders, heart-rate flagging.
- Notifications: per-user and admin fan-out.

Next modules follow the same pattern: `messaging`, `learning`, `analytics`,
`audit` (read API), plus scheduled jobs for nightly snapshots and 24-hour
unanswered-report reminders.
