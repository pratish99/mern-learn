# Auth & progress tracking

Learner progress (which modules were viewed/attempted/completed, the daily
streak, and the active track) can be tracked two ways:

- **Guest mode** (default): stored only in browser `localStorage` via a
  Zustand `persist` store. Nothing leaves the browser.
- **Signed-in mode**: stored in MongoDB, scoped to the user's account, synced
  across devices.

Guest mode was the *only* mechanism before this system was added — there was
no backend, database, or user model in the app previously. The design
explicitly keeps guest mode fully working and unchanged; auth is additive.

## Stack choices (and why)

| Concern | Choice | Why |
|---|---|---|
| DB access | `mongoose` | The app's MongoDB lesson content already teaches Mongoose; free schema validation. |
| Password hashing | `bcryptjs` | Pure JS — no native bindings to fight with Next.js's bundler/Edge runtime. |
| Session | `jose` (JWT) in an httpOnly, `secure` (prod), `sameSite=lax` cookie | Minimal, transparent, Edge-compatible. No `next-auth`/`Auth.js` — too much surface area for one email/password flow. |

**Out of scope by design**: password reset, email verification, refresh-token
rotation, rate limiting, OAuth. Session JWTs expire after 7 days with no
refresh — an expired session just silently falls back to guest mode.

## Environment variables

Set in `.env.local` (gitignored; see `.env.local.example` for the template):

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/mern-learn?retryWrites=true&w=majority
JWT_SECRET=<random 32+ byte string, e.g. `openssl rand -base64 32`>
```

`lib/db.ts` exposes `connectDB()`, a hot-reload-safe cached Mongoose
connection (standard Next.js singleton pattern using `global._mongooseCache`).

## Data model

`models/User.ts` — progress is **embedded in the User document**, not a
separate collection, because it's always read/written as one unit and is
small (well under MongoDB's size limits):

```
User {
  email: string (unique, lowercase)
  passwordHash: string
  createdAt: Date
  progress: {
    modules: Map<string, { viewed, attempted, completed: boolean }>
    streak: { count: number, lastVisitDate: string | null }
    activeTrack: string
  }
}
```

This mirrors the shape of the client-side `ProgressState`
(`store/progress-store.ts`) almost exactly, so no transformation is needed
beyond `Map` ↔ plain-object conversion (`lib/progress-shape.ts`).

## API routes

All follow the same pattern as the pre-existing `app/api/run-code/route.ts`:
parse JSON → validate → business logic in try/catch → `NextResponse.json`.

**Auth** (`app/api/auth/**`):
| Route | Method | Behavior |
|---|---|---|
| `signup` | POST | `{email, password}` (password ≥ 8 chars) → creates user, sets session cookie |
| `login` | POST | `{email, password}` → verifies, sets session cookie. Same generic 401 for "no such user" and "wrong password" |
| `logout` | POST | Clears the session cookie |
| `me` | GET | Returns `{user: null}` (not an error) if no/invalid session, else `{user: {id, email}}` |

**Progress** (`app/api/progress/**`), all require a valid session:
| Route | Method | Behavior |
|---|---|---|
| `progress` | GET | Returns the user's `progress`, shaped like `ProgressState` |
| `progress` | PUT | Overwrites `progress` with the request body (full replace) |
| `progress/merge` | POST | One-shot merge of guest progress into the account's existing progress (see below) |

Every write scopes by the userId decoded from the verified JWT — never from
the request body — so there's no cross-user write risk.

## Client-side integration

- **`store/auth-store.ts`**: plain Zustand store (no `persist` — the session
  lives in the httpOnly cookie, nothing to persist client-side). Holds
  `{user, status}` where `status` is `"loading" | "guest" | "authenticated"`.
- **`components/AuthLoader.tsx`**: non-visual, rendered in `app/layout.tsx`.
  On mount, calls `GET /api/auth/me` and populates `auth-store`.
- **`lib/session-bridge.ts`**: a tiny standalone module holding the current
  userId, so `progress-store.ts` can check "is someone logged in" without
  importing `auth-store.ts` (avoids a circular import).
- **`store/progress-store.ts`**: unchanged public API (`markViewed`,
  `markAttempted`, `markCompleted`, `recordVisit`, `resetProgress`,
  `setActiveTrack`) — existing consumers (`Sidebar.tsx`, `VisitTracker.tsx`,
  `ChallengeEditor.tsx`, `app/progress/page.tsx`) needed **zero changes**.
  What changed under the hood:
  - Every mutating action now also calls a debounced (~800ms) `scheduleSync`,
    which `PUT`s the full state to `/api/progress` **only if**
    `session-bridge`'s `getCurrentUserId()` is non-null (i.e., silently a
    no-op for guests).
  - A new `hydrateFromServer(serverState)` action, called only by the
    login/signup/merge flow, overwrites local state with the server's.
  - `hydrateFromServer` is only ever called after
    `useProgressStore.persist.hasHydrated()` resolves, so localStorage
    rehydration can never race with and clobber freshly-applied server state.
- **`app/login/page.tsx`, `app/signup/page.tsx`**: simple email/password
  forms. On success, they call `lib/merge-progress.ts#runMergeAndSync()`
  before redirecting home.
- **`components/AccountControl.tsx`**: rendered in `Sidebar.tsx`'s bottom
  block (and thus in `MobileNav.tsx`'s drawer too, since it renders
  `Sidebar`). Shows sign-in/sign-up links when logged out, email + log-out
  when logged in.

## Guest → account merge algorithm

Run once, client-driven, right after a successful login or signup, before
the guest's localStorage data is cleared (`lib/merge-progress.ts`):

1. Wait for the progress store's `persist.hasHydrated()`.
2. Read the guest's current state. If it has no modules at all, skip
   straight to fetching the server's progress and hydrating — nothing to
   merge.
3. Otherwise `POST` the guest state to `/api/progress/merge`. The server:
   - **Per module**: takes the **union (`OR`)** of each boolean field
     (`viewed`/`attempted`/`completed`) between guest and server. Since these
     flags are monotonic (never regress), a union is exactly
     "most-progressed-wins" and is safe to run repeatedly (idempotent).
   - **Streak**: `count = max(guest, server)`, `lastVisitDate` = the later of
     the two dates.
   - **`activeTrack`**: keeps the server's value if the account already had
     progress (a returning user), otherwise uses the guest's (a brand-new
     account).
4. The client applies the merged result via `hydrateFromServer`, then clears
   the `"node-revision-progress"` localStorage key
   (`useProgressStore.persist.clearStorage()`) so a later logout doesn't
   resurrect stale pre-merge guest data.

On logout (`auth-store.ts#logout`), the progress store is explicitly reset
(`resetProgress()`) so a fresh guest session on the same browser doesn't
inherit the logged-out account's data.

## Local development without Atlas

For quick local testing without a real MongoDB Atlas cluster, a local
`mongod` works fine — just point `MONGODB_URI` at it, e.g.:

```
MONGODB_URI=mongodb://127.0.0.1:27017/mern-learn
```
