# FurRescue

Animal rescue, health monitoring, and adoption platform for Mati City, Davao Oriental.

FurRescue connects residents, rescuers, and administrators in one system: residents
report animals in need and apply to adopt, rescuers get assigned cases and update them
in the field, and admins verify reports, manage animals, review adoptions, and monitor
community health. The same domain logic powers both the web app and the mobile app.

---

## What the system does

| Area | Description |
| --- | --- |
| **Accounts & auth** | Email/password and Google sign-in, OTP email verification, pending-account approval, JWT sessions, role-based access (resident, rescuer, admin). |
| **Rescue reports** | Residents submit reports with photos, location, and details. Admins verify or reject them; verified reports are assigned to rescuers and tracked through a lifecycle (pending → verified → assigned → in progress → resolved). |
| **Rescues** | Field cases for rescuers, including assignment, status updates, and case history. |
| **Animals** | Intake records, profiles, photos, listing moderation, and lifecycle (available, reserved, adopted, etc.). |
| **Adoptions** | Applications, review and approval, and post-adoption follow-ups. |
| **Health** | Medical records, vaccinations, treatments, and heart-rate logging for animals under care. |
| **Community** | Posts, comments, and interactions from residents and rescuers. |
| **Messaging** | Conversations between residents, rescuers, and admins, with assignment and realtime updates. |
| **Learning** | Articles and resources on animal care and welfare. |
| **Notifications** | In-app notifications for users and admins, with email support. |
| **Analytics & audit** | Admin dashboards plus an audit trail of sensitive actions. |
| **Settings** | Platform and account configuration. |

### Architecture at a glance

FurRescue is a **modular monolith**:

```
HTTP route (apps/web/src/app/api/**)  ·  Expo screen
        │
        ▼
   zod schema  →  service  →  repository  →  Prisma  →  Supabase PostgreSQL
```

- **Route / controller** parses input and calls a service. No SQL, no business rules.
- **Service** enforces permissions, lifecycle transitions, validation, notifications,
  audit trails, and transactions.
- **Repository** holds thin, typed Prisma queries.
- **Shared schemas** (`zod`) are used by both web and mobile, so the clients can't drift.
- All business logic lives in `@furescue/core`; nothing there imports HTTP.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for layering rules and the module template.

---

## Tech stack

### Web (`apps/web`)

| Layer | Technology |
| --- | --- |
| Framework | **Next.js 16** (App Router, React Server Components) |
| UI runtime | **React 19** |
| Language | **TypeScript 5** |
| Styling | **Tailwind CSS 4** with the Turbopack integration |
| Animation | **Framer Motion** |
| Icons | **Lucide React** |
| Maps | **Leaflet** (report locations, rescue maps) |
| Auth / storage | **Supabase SSR** + **supabase-js** (Google OAuth, media buckets) |
| Sessions | **jsonwebtoken** (JWT) |
| Validation | **zod** |
| API | Next.js Route Handlers under `src/app/api/**` |
| Linting | **ESLint 9** + `eslint-config-next` |
| Domain layer | `@furescue/core` (workspace package) |

The web app includes the public site, the resident experience, the admin console
(dashboard, reports, rescues, animals, adoptions, health, users, messaging, community,
learning, notifications, analytics, audit, settings), and the REST API.

### Mobile (`apps/mobile`)

| Layer | Technology |
| --- | --- |
| Framework | **Expo SDK 58** (managed workflow, prebuild support) |
| Runtime | **React Native 0.88** + **react-native-web** (browser target) |
| UI runtime | **React 19** |
| Language | **TypeScript 6** |
| Navigation | **Expo Router** (file-based routing) |
| Native UI | **@expo/ui**, **expo-symbols**, **expo-glass-effect**, **expo-linear-gradient**, **expo-status-bar**, **expo-system-ui**, **expo-splash-screen** |
| Native plumbing | **react-native-safe-area-context**, **react-native-screens**, **react-native-svg**, **react-native-worklets**, **expo-device**, **expo-build-properties** |
| Animation | **React Native Reanimated 4** + **Gesture Handler** |
| Maps / location | **react-native-maps**, **expo-location** |
| Media | **expo-image**, **expo-image-picker**, **expo-file-system** |
| Secure storage | **expo-secure-store** (session tokens) |
| Fonts / assets | **expo-font**, **@expo-google-fonts** (Geist, Instrument Serif, Material Symbols) |
| Linking / OAuth | **expo-linking**, **expo-web-browser**, **expo-constants** |
| Builds | **EAS** (`eas.json`) + `expo run:android` / `expo run:ios` |
| Domain layer | `@furescue/core` (shared services and contracts) |

The mobile app covers resident and rescuer flows: onboarding, auth, report submission,
assignments, field rescue updates, animal browsing, adoptions, community, chat, learning,
and profile — laid out under `src/features/*` and `src/app/*`.

### Shared / backend

| Layer | Technology |
| --- | --- |
| Domain core | `@furescue/core` — modular monolith (services, repositories, schemas, types) |
| ORM | **Prisma 7** (`@prisma/client`, `@prisma/adapter-pg`) |
| Database | **Supabase PostgreSQL** (pooled + direct connections) |
| Auth primitives | **bcryptjs**, **jsonwebtoken** |
| Email | **Nodemailer** (SMTP, OTP verification) |
| Realtime | **Supabase Realtime** (messaging, audit) |
| Storage | **Supabase Storage** (animal/report media) |
| Validation | **zod 4** |
| Runtime | **Node.js 20.9+**, **npm workspaces** |
| Tooling | **tsx** (scripts), **Prisma Studio**, **ESLint**, **TypeScript** |

---

## Requirements

- **Node.js 20.9 or later**
- **npm** (workspace-aware; npm 10+ recommended)
- A **Supabase** project (PostgreSQL + Storage + Auth)
- Optional: an SMTP account (Gmail app password works) for OTP emails
- Optional: Android Studio / Xcode or the Expo Go app for mobile
- Optional: a Google Cloud OAuth client for Google sign-in

---

## Install

```bash
git clone <repo-url>
cd furescue
npm install
```

`npm install` is a monorepo install (npm workspaces) and the `postinstall` hook
generates the Prisma client automatically.

---

## Environment setup

Copy the template and fill in real values:

```bash
cp .env.example .env        # macOS / Linux
copy .env.example .env      # Windows
```

Required values:

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Base URL of the web app (e.g. `http://localhost:3000`). |
| `API_BASE_URL` | API root used by clients (e.g. `http://localhost:3000/api`). |
| `JWT_SECRET` | 32+ character signing secret for sessions. |
| `DATABASE_URL` | Pooled Postgres connection used by the running app (Supabase pooler, port `6543`). |
| `DIRECT_URL` | Direct/session connection used for migrations and seeding. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (safe for clients). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe for clients). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — **server only, never expose to clients**. |
| `SUPABASE_STORAGE_BUCKET` | Bucket for uploaded media. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Outgoing email for OTP verification. |

Notes:

- URL-encode special characters in the database password.
- In development, if `SMTP_HOST` is empty the OTP code is printed to the server console
  instead of being emailed.
- Never commit `.env`; it is git-ignored. `.env.example` is the template.
- The mobile app has its own `.env`/`.env.example` under `apps/mobile` for client-side
  configuration (API base URL, Supabase keys, app scheme).

---

## Database

```bash
npm run db:generate    # regenerate the Prisma client
npm run db:deploy      # apply prisma/migrations to Supabase (needs port 5432)
npm run db:apply-init  # fallback: apply prisma/supabase-init.sql over port 6543
npm run db:seed        # seed roles + 26 Mati barangays
npm run db:seed-clinic # demo data for a small vet clinic (staff, animals, cases)
npm run db:verify      # print table count, roles, barangay count
npm run db:studio      # browse data in Prisma Studio
npm run db:migrate     # create a new migration during development
npm run db:reset       # reset the database (development only)
```

To provision a fresh environment, run `db:deploy` then `db:seed`.

Additional demo/seed scripts:

```bash
npm run db:seed-report        # pending rescue report
npm run db:seed-adoption      # adoption application
npm run db:seed-messaging     # conversations and messages
npm run db:seed-notifications # sample notifications
npm run db:seed-learning      # learning articles
npm run db:seed-community     # community posts
npm run db:create-admin       # create an admin account
```

---

## Run

```bash
npm run dev:web       # web app → http://localhost:3000
npm run dev:mobile    # Expo → scan the QR code, or press w for web

npm run build:web     # production build of the web app
npm run typecheck:core # type-check the shared domain package
```

Useful mobile commands (from `apps/mobile`):

```bash
npm run android
npm run ios
npm run web
npm run lint
```

---

## Google sign-in

1. Enable **Google** under Supabase → Authentication → Providers.
2. Add the callback URLs under Authentication → URL Configuration:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://your-domain.com/api/auth/google/callback`
3. In Google Cloud Console, use `https://<project-ref>.supabase.co/auth/v1/callback`
   as the authorised redirect URI.

Login with Google checks the `users` table first and sends unknown emails to sign-up;
sign-up with Google signs existing accounts in immediately and otherwise continues to
`/signup/complete`. Google OAuth started from mobile returns through the app's custom
scheme (`MOBILE_APP_SCHEME`, default `mobile`).

---

## Project layout

```
apps/web              Next.js site, resident experience, admin/rescuer console, API routes
apps/mobile           Expo app (resident + rescuer field app)
packages/core         @furescue/core — domain modules: auth, reports, rescues, animals,
                      adoptions, health, messaging, community, learning, notifications,
                      analytics, audit, settings
prisma/schema.prisma  Full data dictionary → Supabase
prisma/migrations     Versioned schema migrations
prisma/seed.ts        Roles + 26 Mati barangays
scripts/              Seed, verification, admin and migration helper scripts
docs/ARCHITECTURE.md  Layering, conventions, integration guide
```

---

## Roles

| Role | Capabilities |
| --- | --- |
| **Resident** | Report animals, apply to adopt, message, post in community, read learning content, receive notifications. |
| **Rescuer** | Everything a resident can do, plus assigned rescues, field status updates, and health logging. |
| **Admin** | Verify/reject reports, assign rescues, manage animals and listings, review adoptions, manage users and settings, view analytics and audit logs. |

---

## Troubleshooting

- **Prisma client errors after pulling changes** — run `npm run db:generate`.
- **Cannot connect during migrations** — `db:deploy` needs the direct connection
  (`DIRECT_URL`); on restricted networks use `db:apply-init` over the pooled port.
- **OTP email never arrives** — with Gmail SMTP, `SMTP_FROM` must match `SMTP_USER` or a
  verified alias. Leave `SMTP_HOST` empty locally to log codes to the console.
- **Mobile can't reach the API** — set the API base URL to your machine's LAN IP, not
  `localhost`, when testing on a physical device.
- **Google sign-in redirect error** — confirm the callback URLs in both Supabase and
  Google Cloud Console match the running origin.
