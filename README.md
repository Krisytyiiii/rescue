# FurRescue

Animal rescue, health monitoring, and adoption platform for Mati City, Davao Oriental.

## Stack

- **Web + API**: Next.js 16 (`apps/web`)
- **Mobile**: Expo (`apps/mobile`)
- **Domain layer**: `@furescue/core` — modular monolith (services, repositories, types)
- **Database**: Supabase PostgreSQL, owned by Prisma 7
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Requirements

- Node.js 20.9 or later
- npm
- A Supabase project

## Install

```bash
npm install
```

`postinstall` generates the Prisma client.

## Environment

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` — pooled Postgres connection (Supabase session/transaction pooler)
- `DIRECT_URL` — direct connection used by migrations and seeding
- `JWT_SECRET` — 32+ character signing secret
- Supabase public keys and `SUPABASE_SERVICE_ROLE_KEY` (server only)

Never commit `.env`. It is git-ignored.

## Database

```bash
npm run db:deploy     # apply prisma/migrations to Supabase (needs port 5432)
npm run db:apply-init # fallback: apply prisma/supabase-init.sql over port 6543
npm run db:seed       # seed roles + 26 Mati barangays
npm run db:verify     # print table count, roles, barangay count
npm run db:studio     # browse data
npm run db:migrate    # create a new migration during development
```

To provision a fresh environment, run `db:deploy` then `db:seed`.

## Google sign-in

1. Enable **Google** under Supabase → Authentication → Providers.
2. Add the callback URLs under Authentication → URL Configuration:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://your-domain.com/api/auth/google/callback`
3. In Google Cloud Console use `https://<project-ref>.supabase.co/auth/v1/callback`
   as the authorised redirect URI.

Login with Google checks `users` first and sends unknown emails to sign-up;
sign-up with Google signs existing accounts in immediately and otherwise
continues to `/signup/complete`.

## Run

```bash
npm run dev:web       # http://localhost:3000
npm run dev:mobile    # Expo — scan QR or press w
npm run build:web
npm run typecheck:core
```

## Project layout

```
apps/web            Next.js site, admin/rescuer console, API routes
apps/mobile         Expo app
packages/core       Domain modules: auth, reports, animals, adoptions, health, notifications
prisma/schema.prisma  Full data dictionary → Supabase
docs/ARCHITECTURE.md  Layering, conventions, integration guide
```
