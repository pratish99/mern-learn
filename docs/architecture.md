# Architecture

`mern-learn` is a single Next.js 16 (App Router) application — an interactive
revision/learning site for Node.js, JavaScript, Express.js, React,
MongoDB, and Docker concepts. It is **one app, not a collection of separate
practice projects**, despite commit history suggesting otherwise.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS 4
- React 19
- Framer Motion for animations
- Monaco Editor (`@monaco-editor/react`) for the in-browser code editor
- Zustand for client state (progress store, auth store)
- MongoDB + Mongoose for per-account progress persistence (see
  [`auth-and-progress.md`](./auth-and-progress.md))
- Node's built-in `vm` module, in an API route, for sandboxed code execution

## Folder layout

```
app/                    Next.js routes (App Router)
  page.tsx              Home / module list
  progress/page.tsx     Progress dashboard
  login/, signup/       Auth pages
  modules/[id]/         Individual lesson + challenge page
  api/
    run-code/           Sandboxed code execution endpoint
    auth/                signup, login, logout, me
    progress/            GET/PUT progress, POST merge
components/             UI components (Sidebar, MobileNav, ChallengeEditor, AccountControl, AuthLoader, ...)
content/
  modules/*.ts          Lesson content — plain typed data, one file per topic
  index.ts              Aggregates all modules into MODULES[]
lib/
  topics.ts             Topic/track metadata (id, title, category, order) — drives nav & progress %
  sandbox.ts            The `node:vm` sandbox used by the code-execution API route
  types.ts              ModuleContent / Challenge / TestCase types
  db.ts, auth.ts        MongoDB connection + password/JWT helpers
  progress-shape.ts     Shared progress JSON shape + validation, used by API routes
  merge-progress.ts     Guest → account progress merge, run after login/signup
  session-bridge.ts     Tiny bridge so progress-store can check "is a user logged in" without importing auth-store
  use-hydrated.ts        SSR/localStorage hydration-safety hook
store/
  progress-store.ts     Zustand store for module/streak/track progress (localStorage-backed, syncs to server when logged in)
  auth-store.ts         Zustand store for the current auth session
models/
  User.ts               Mongoose User schema (email, passwordHash, embedded progress)
scripts/
  validate-content.mjs  Verifies every challenge's reference solution passes its own tests
  e2e-check.mjs         Basic end-to-end smoke check
```

## Content vs. app code — don't confuse the two

`content/modules/*.ts` and `content/modules/express-10-sessions-auth.ts` /
`mongodb-*.ts` files are **curriculum text shown to learners** (explanations,
code samples, challenges) — not real application code. For example,
`express-10-sessions-auth.ts` teaches sessions/cookies conceptually; it has
no relationship to the actual auth system in `app/api/auth/**`. See
[`content-modules.md`](./content-modules.md) for how lesson content works.

## Path aliases

`tsconfig.json` maps `@/*` to the repo root, used everywhere (`@/lib/...`,
`@/components/...`, `@/store/...`).

## Route protection

There is no `middleware.ts`. No page requires gating a whole route from
guests — `/progress` works for both guests (localStorage) and logged-in
users (server-synced). The only things that need auth are the progress API
routes, which self-check the session cookie inline (see
`lib/auth.ts#getUserIdFromRequest`), consistent with how
`app/api/run-code/route.ts` validates everything inline rather than via
middleware.
