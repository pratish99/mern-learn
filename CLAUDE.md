# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single Next.js 16 (App Router) app — an interactive revision tool for
Node.js, JavaScript, Express.js, React, and MongoDB concepts. Despite git
history reading like separate modules ("added express.js", "added react
module"), this is **one app, not separate practice projects**. See
`docs/architecture.md` for the full folder layout.

Read `docs/` before making non-trivial changes:
- `docs/architecture.md` — stack, folder layout, route protection
- `docs/auth-and-progress.md` — auth system, MongoDB progress sync, guest→account merge algorithm
- `docs/content-modules.md` — lesson content shape, tracks/topics, adding a new module

## Commands

```bash
npm run dev     # Next.js dev server (Turbopack)
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

Content validation (no test runner/framework — these are standalone scripts):

```bash
# Verifies every challenge's reference solution passes its own test cases,
# via a sandbox equivalent to lib/sandbox.ts (no server needed)
node --experimental-strip-types --no-warnings scripts/validate-content.mjs

# Same idea but through the real API route — requires `npm run dev` running first
node scripts/e2e-check.mjs
```

There is no per-module/per-test filter flag on either script — they always
run every module in `content/modules/`.

## Environment

Copy `.env.local.example` to `.env.local` and fill in:
- `MONGODB_URI` — MongoDB Atlas connection string (a local `mongod` also works for dev, see `docs/auth-and-progress.md`)
- `JWT_SECRET` — random secret for signing session JWTs

## Architecture essentials

**Content vs. app code**: `content/modules/*.ts` files are curriculum data
(explanation + code samples + challenge) shown to learners — including ones
that *talk about* auth, Express routing, or MongoDB/Mongoose as teaching
material. They are not wired into the app and have no bearing on how the
real app works. Don't confuse a lesson file like
`content/modules/express-10-sessions-auth.ts` with the actual auth
implementation in `app/api/auth/**` and `lib/auth.ts`.

**Two sources of truth that must stay in sync manually**: `content/index.ts`
(the `MODULES` array, aggregating `content/modules/*.ts`) and `lib/topics.ts`
(the `TOPICS` array, driving nav/progress-% UI). A module's `id` must match
between both. There's no build-time codegen linking them.

**Progress tracking is dual-mode**: guests get localStorage only
(`store/progress-store.ts` wrapped in Zustand's `persist`); signed-in users
get the same store additionally debounce-synced to MongoDB. The sync/merge
logic is intentionally layered on top without changing the store's public
API — `Sidebar.tsx`, `VisitTracker.tsx`, `ChallengeEditor.tsx`, and
`app/progress/page.tsx` all consume `useProgressStore` exactly as before auth
existed. See `docs/auth-and-progress.md` before touching
`store/progress-store.ts`, `store/auth-store.ts`, or `lib/session-bridge.ts`
— there's a deliberate one-directional dependency (progress-store only reads
`session-bridge`, never `auth-store`) to avoid a circular import, and a
hydration-race guard (`persist.hasHydrated()`) that's easy to accidentally
break.

**No middleware.ts**: auth is enforced per-route inside API handlers
(`getUserIdFromRequest` in `lib/auth.ts`), not via Next.js middleware —
consistent with how the pre-existing `app/api/run-code/route.ts` validates
everything inline.

**Code execution sandbox**: `app/api/run-code/route.ts` runs learner-submitted
code in a `node:vm` context (`lib/sandbox.ts`) exposing only safe globals,
with a 2-second timeout per test case — no filesystem/network/`process`
access.
