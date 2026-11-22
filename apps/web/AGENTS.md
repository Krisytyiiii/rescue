

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.



## Fast working style (read this first)

Optimize for a fast, correct answer — not for exploring the repository. Respond as fast as possible.

- **Never scan or read the repo at session start.** No tree walks, no "getting oriented", no reading `README`/config/layout/other components unless the request names them. Open only the file(s) named in the request, plus at most one or two files you must touch.
- **Never re-explore between turns.** The user's request is the scope; use what is already in context. If a symbol is unknown, do one targeted `grep`; do not broaden from there.
- **Batch independent reads/searches in one step.** Fire all needed `read`/`grep`/`glob` calls together instead of one at a time.
- **Never read** `node_modules/`**,** `.next/`**, or the whole repo.** Limit searches to `src/` and use one narrow `grep`/glob for a specific symbol or string instead of walking directories.
- **Read the exact region you need.** Use offset/limit for large files instead of loading a whole file when only a section matters.
- **Do not re-read files already in context** and do not verify an edit by re-reading the file; trust the edit result.
- **Only open the Next.js docs** when you are about to use a framework API you are not sure of (routing, metadata, caching, config). Skip it for plain JSX/TSX/CSS edits.
- **Make the smallest change that fixes the issue, then stop.** No refactors, no cleanup passes, no unrelated improvements, no summary tour of the codebase.
- **Edit first, verify last.** Do not read a file just to confirm an edit landed; trust the tool result. Never run a verification loop over multiple files.
- **Skip** `build`**/**`lint`**/dev-server runs unless the change is risky or the user asks.** If a build is needed, run it once.
- **Answer directly and briefly.** One short explanation plus the change; no long recaps, no per-file changelog, no code blocks for edits already applied.
- **Palette changes are CSS variables first.** Edit `src/app/globals.css` tokens, then only the handful of hardcoded colors (`hex`/`rgba`) that bypass them. Do not touch every component.

### Next.js hydration mismatches (this project)

- A server/client mismatch that shows *different text or class names* is almost always a stale bundle, not a code bug. Check whether the current source already contains the "server" version before editing.
- Verify with one grep in `src/`, then fix by stopping the dev server, deleting `apps/web/.next`, and restarting `npm run dev`. Ask the user to hard-refresh (Ctrl+Shift+R).
- Do not add `suppressHydrationWarning` to hide text/class mismatches; that masks the real cause.
- Only real SSR-safe problems need code changes: `Date.now()`, `Math.random()`, locale formatting, `typeof window` branches, and `useReducedMotion`/`useMediaQuery` used in initial render output.
- `useReducedMotion` returns `null` on the server and a boolean on the client, so never feed it into `initial`/`animate`/`className`/text. Use `MotionConfig reducedMotion="user"` for accessibility and keep those props deterministic; a hook value may only drive event handlers.

## Action UX rules (required for all mutations)

These apply to every state-changing admin action — verify, reject, approve, assign, resolve, archive, delete, etc.

- **Always confirm in an overlay.** No state-changing action fires directly from a button or from inline UI. Use the shared `ConfirmDialog` from `@/components/ui/confirm-dialog` (or `OverlayCard` for custom flows). The dialog states the action, the consequence, and the destructive tone. Actions that need extra input (for example a rejection reason) collect it inside the dialog.
- **Close immediately on confirm.** Call the optimistic update and close the dialog/overlay synchronously before awaiting the network. Never show a blocking spinner or disable the whole screen while the request runs.
- **Update the UI optimistically.** Apply the new status/value in local state (or a parent optimistic map) the instant the user confirms, so the change is visible while the backend processes. Also dismiss the parent detail modal on confirm (`onDone`).
- **Requests run in the background.** Fire the `fetch` without blocking the UI. Do not refetch or `router.refresh()` before the request resolves — that can race and restore stale server data. Refresh only after a successful response so the server state becomes the source of truth.
- **Revert + report failures.** If the request fails, roll the optimistic update back to the previous value and surface a non-blocking `FormAlert` (or the caller's `onActionError`). Never leave the UI showing a change that did not persist.
- **No stacked modals/prompts.** One confirmation at a time, closed on confirm, Escape, backdrop click, or Cancel. Keep optimistic keyed state scoped to the affected row so other rows are unaffected.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
