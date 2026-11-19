<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Fast working style (read this first)

Optimize for a fast, correct answer — not for exploring the repository. Respond as fast as possible.

- **Never scan or read the repo at session start.** No tree walks, no "getting oriented", no reading `README`/config/layout/other components unless the request names them. Open only the file(s) named in the request, plus at most one or two files you must touch.
- **Never re-explore between turns.** The user's request is the scope; use what is already in context. If a symbol is unknown, do one targeted `grep`; do not broaden from there.
- **Batch independent reads/searches in one step.** Fire all needed `read`/`grep`/`glob` calls together instead of one at a time.
- **Never read `node_modules/`, `.next/`, or the whole repo.** Limit searches to `src/` and use one narrow `grep`/glob for a specific symbol or string instead of walking directories.
- **Read the exact region you need.** Use offset/limit for large files instead of loading a whole file when only a section matters.
- **Do not re-read files already in context** and do not verify an edit by re-reading the file; trust the edit result.
- **Only open the Next.js docs** when you are about to use a framework API you are not sure of (routing, metadata, caching, config). Skip it for plain JSX/TSX/CSS edits.
- **Make the smallest change that fixes the issue, then stop.** No refactors, no cleanup passes, no unrelated improvements, no summary tour of the codebase.
- **Edit first, verify last.** Do not read a file just to confirm an edit landed; trust the tool result. Never run a verification loop over multiple files.
- **Skip `build`/`lint`/dev-server runs unless the change is risky or the user asks.** If a build is needed, run it once.
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
- **Toast for feedback, never inline banners for actions.** Successful and failed actions report through `useToast` (`@/components/ui/toast`, mounted by the admin layout): one short, plain-language title plus one brief detail sentence. Do not leave a spinner or "Saving…" state in the closed overlay. Success acknowledges what changed (e.g. "Status updated — FR-2026-0012 is now ready for adoption."); failure explains what did not happen and that the user can retry.
- **Revert + report failures.** If the request fails, roll the optimistic update back to the previous value and show an error toast. Never leave the UI showing a change that did not persist. Never use raw error codes, status codes, or stack messages in user-facing text.
- **No stacked modals/prompts.** One confirmation at a time, closed on confirm, Escape, backdrop click, or Cancel. Keep optimistic keyed state scoped to the affected row so other rows are unaffected.

## Admin console UI conventions

Reuse the shared components before writing new markup — consistency is the point of the `src/components/ui` set.

- **Scroll containers:** always use `ScrollArea` (`@/components/ui/scroll-area`), never raw `overflow-y-auto`, for lists and panels. Its thin scrollbar only shows while the nearest `group` ancestor is hovered/focused, so add `group` to the surrounding column when it has no other group.
- **Tooltips:** use `Tooltip` (`@/components/ui/tooltip`) for DOM hover hints. For map overlays, reuse the exported `TOOLTIP_BUBBLE` class on the overlay bubble so it matches the dark ink surface, radius, padding, and shadow. Do not style custom white tooltips.
- **Badges/status:** map statuses to `Badge` tones and shared meta helpers (`reportStatusMeta`, `urgencyMeta`, `ASSIGNMENT_META`) instead of ad-hoc colors.
- **Cards/banners:** report cards use a banner treatment — status-colored top rule plus a subtle tinted gradient in the status color, an eyebrow label, monospace code, and a status badge. Keep hover/selection states subtle and reuse the same recipe for expanded detail panels.
- **Collapsibles:** animate with `grid-rows-[0fr]`/`grid-rows-[1fr]` + opacity, expose `aria-expanded`, rotate the chevron, and make the trigger a real toggle (clicking an open row collapses it). Never leave a row permanently stuck open.
- **Maps (Leaflet):** markers are `divIcon` dots colored by status; hover content is a React overlay positioned with `latLngToContainerPoint`, hidden on `dragstart`/`zoomstart`. Heat mode must be a real density map — additive radial blobs (`globalCompositeOperation = "lighter"`), colourised through a blue→cyan→green→yellow→red ramp, rendered at reduced resolution and upscaled with smoothing. Coalesce heat repaints with `requestAnimationFrame`; do not repaint synchronously on every `move`.
- **Map focus:** effects that pan/fly to a selected pin must depend only on `selectedId` (read the current reports from a ref) and only pan when the pin is off-screen, keeping the user's zoom. Depending on `reports` makes live refreshes yank the map around.
- **Live data:** server pages rerender through `AdminLiveRefresh` (`/api/admin/live`); treat the server result as truth after a successful mutation, and keep client optimistic state keyed per row.
- **Verification:** for multi-file or non-trivial edits, run `npx tsc --noEmit -p apps/web/tsconfig.json` once from the repo root. Do not start the dev server just to check types.
