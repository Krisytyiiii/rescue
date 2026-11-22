# Mobile Google Sign-In — Unfinished Task

**Status:** partially implemented, blocked at the OAuth return-to-app step
**Date:** 2026-11-21
**Scope:** Expo app (`apps/mobile`) + Next.js API (`apps/web`) + Supabase Auth + Vercel

---

## Goal

Make Google sign-in and sign-up work inside the mobile app:

- Google login:
  - account exists + active → sign in and store the Bearer token
  - account does not exist → show “No FuRescue account is linked…” and offer sign-up
  - pending rescuer → show “waiting for admin approval”
- Google sign-up:
  - account already exists → message and go back to login
  - new account → collect profile details (name, phone, barangay, role, terms)
  - resident → active immediately
  - rescuer → pending admin approval

---

## Current symptom

After choosing a Google account, the user still ends up in the **browser**
instead of returning to the mobile app.

The flow must end at:

```
Google → Supabase → https://furescue.vercel.app/api/auth/google/callback
       → 307 → <app deep link>?status=...
```

If the last redirect does not reopen the app, the browser stays visible.

---

## What is already implemented

### Backend (deployed to Vercel)

- `apps/web/src/app/api/auth/google/start/route.ts`
  - accepts `client=mobile`
  - accepts `redirect=<deep link>` (Expo Go vs dev build)
  - forwards both through Supabase via the callback query string
- `apps/web/src/app/api/auth/google/callback/route.ts`
  - mobile branches for:
    - `active` (returns app Bearer token)
    - `not_registered` (login intent, no account)
    - `existing_account` (signup intent, account exists)
    - `pending` (rescuer awaiting approval)
    - `complete_profile` (onboarding token + Google name/email)
    - `cancelled` / `error`
  - redirects to the provided deep link, or `mobile://auth/google` by default
- `apps/web/src/app/api/auth/google/complete/route.ts`
  - accepts `onboardingToken` from mobile (`x-client: mobile`)
  - returns `token` + user on active; `pending` for rescuers
- `apps/web/src/lib/auth/mobile-redirect.ts`
  - `safeMobileRedirect()` only allows `mobile://` and `exp://`
  - `mobileAuthRedirect()` builds the final deep link
- `apps/web/src/lib/auth/session.ts`
  - `readOnboardingToken()` for mobile onboarding JWTs
- Vercel production env: `MOBILE_APP_SCHEME=mobile`

### Mobile

- `src/data/google-browser.ts`
  - uses `WebBrowser.openAuthSessionAsync`
  - builds redirect with `Linking.createURL("auth/google")`
    - Expo Go: `exp://<host>/--/auth/google`
    - dev/production build: `mobile://auth/google`
- `src/data/auth-gateway.ts` / `auth-repository.ts`
  - `googleAuthUrl(intent, redirectUrl)`
  - parses the deep-link result and saves the session
  - `completeGoogleSignup()` posts the remaining profile
- `src/features/auth/useLoginViewModel.ts`
  - real Google login + no-account/pending messages
- `src/features/auth/useSignupViewModel.ts`
  - existing-account message → returns to login with notice
  - duplicate manual email → same behavior
  - Google profile completion form (names, phone, barangay, role, terms)
  - resident active, rescuer pending approval
- `src/app/signup.tsx` / `src/app/login.tsx`
  - Google spinner, notices, Google profile form
  - `app.json`:
    - `scheme: "mobile"`
    - `web.output` changed `server` → `single` (stops SSR “operation was aborted” spam)
  - `_layout.tsx`: `unstable_settings.anchor` instead of deprecated `initialRouteName`

### Mobile environment

`apps/mobile/.env`:

```
EXPO_PUBLIC_API_URL=https://furescue.vercel.app
```

---

## Verified

`start` endpoint (production):

```
GET https://furescue.vercel.app/api/auth/google/start?intent=login&client=mobile&redirect=exp%3A%2F%2F192.168.56.1%3A8081%2F--%2Fauth%2Fgoogle
→ 307 to Supabase
→ redirect_to contains intent=login, client=mobile, redirect=<encoded exp://…>
```

`callback` endpoint with a fake code:

```
GET /api/auth/google/callback?...&code=fake-code
→ 307 Location: exp://192.168.56.1:8081/--/auth/google?status=error&message=...
```

So the backend bridge itself is correct.

---

## Remaining blockers / next steps

### 1. Supabase redirect allowlist (required)

Supabase → **Authentication → URL Configuration → Redirect URLs** must contain:

```
https://furescue.vercel.app/**
```

(and optionally the exact callback)

Without it, Supabase silently replaces `redirect_to` with the **Site URL**
(`https://web-erud.vercel.app`) and the flow ends on the web app.

### 2. Expo Go cannot reliably handle OAuth callbacks (main suspect)

`expo-linking` itself warns that `exp://` URLs from Expo Go are not stable for
authorization callbacks:

> “If a stable URL is needed, for example in authorization callbacks, a build
> (or development build) of your application should be used and the scheme
> provided.”

Expo Go uses `exp://<host>/--/auth/google`. The browser may not hand control
back to Expo Go, leaving the user in the browser.

**Recommended:** test with a development build instead of Expo Go:

```bash
cd apps/mobile
npx expo run:android
# or
npx expo run:ios
```

In a development build the redirect is `mobile://auth/google`, which the OS
routes back to the app.

### 3. Metro host reachability

The current QR shows `exp://192.168.56.1:8081` (a VirtualBox/host-only address).
Phones usually cannot reach that IP. If using Expo Go for now:

```bash
npx expo start --tunnel -c
```

But prefer the development build for the OAuth return.

### 4. Restart Metro after env/config changes

`EXPO_PUBLIC_*` values are inlined at bundle time:

```bash
npx expo start -c
```

### 5. Confirm what the browser shows when it fails

When it happens again, capture the **final URL** in the browser:

- ends on `web-erud.vercel.app` → Supabase allowlist/Site URL fallback
- stays on `furescue.vercel.app/api/auth/google/callback?status=…` →
  OS is not opening the deep link (Expo Go / scheme registration)
- shows “site can’t be reached” for `mobile://` or `exp://` →
  custom scheme not registered or host unreachable (use dev build)

---

## Notes / gotchas

- `web-erud.vercel.app` is serving an **older deployment** without the mobile
  bridge. Do not point the app or Supabase redirects there.
- The Google app Bearer token is passed in the deep-link query string for now.
  Acceptable for this prototype; a one-time code exchange would be stronger.
- Google onboarding token is a 15-minute JWT (`type: oauth_onboarding`).
- `safeMobileRedirect()` blocks arbitrary custom schemes (open-redirect guard).
- Web Google flow is unchanged (cookie session).
- Vercel project: `tres-projects2/furescue`, root directory `apps/web`.
- Production URL: `https://furescue.vercel.app`.

---

## Relevant files

```
apps/mobile/src/data/google-browser.ts
apps/mobile/src/data/auth-gateway.ts
apps/mobile/src/data/auth-repository.ts
apps/mobile/src/data/index.ts
apps/mobile/src/domain/auth.ts
apps/mobile/src/domain/ports.ts
apps/mobile/src/domain/auth-validation.ts
apps/mobile/src/features/auth/useLoginViewModel.ts
apps/mobile/src/features/auth/useSignupViewModel.ts
apps/mobile/src/app/login.tsx
apps/mobile/src/app/signup.tsx
apps/mobile/src/app/_layout.tsx
apps/mobile/app.json
apps/mobile/.env

apps/web/src/app/api/auth/google/start/route.ts
apps/web/src/app/api/auth/google/callback/route.ts
apps/web/src/app/api/auth/google/complete/route.ts
apps/web/src/lib/auth/mobile-redirect.ts
apps/web/src/lib/auth/session.ts
.env.example  (MOBILE_APP_SCHEME)
```
