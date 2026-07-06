# Lesson content modules

Lesson content (explanation, code examples, and the hands-on challenge) is
**plain typed TypeScript data** — there is no CMS or database for it. Each
topic is one file in `content/modules/`, aggregated by `content/index.ts`
into a single `MODULES` array.

## Shape (`lib/types.ts`)

```ts
interface ModuleContent {
  id: string;
  title: string;
  category: string;
  order: number;
  explanation: string;       // markdown
  codeExamples: { title, code, note? }[];
  challenge: {
    functionName: string;
    prompt: string;
    starterCode: string;
    solutionCode: string;
    testCases: {
      name: string;
      args: () => unknown[];   // factory — see note below
      expected?: unknown;
      expectedError?: string;
    }[];
  };
}
```

**Why `args` is a factory, not a static value**: content modules are
singletons loaded once per server process. If a test case's arguments
included a stateful object (an `EventEmitter`, a stream, a mutable array)
built once at module-load time, that state would leak across separate test
runs and separate users. Building it fresh inside `args()` avoids that.

## Tracks, topics, and ordering (`lib/topics.ts`)

`TOPICS` is a separate array of lightweight metadata (`id`, `title`,
`category`, `order`, `track`) that drives the sidebar nav, category
grouping, and progress-percentage calculations. It is **not** derived from
`content/modules/*.ts` — the two must be kept in sync manually: a module's
`id` here must match its corresponding file's exported `id` in
`content/modules/`.

Five tracks exist: `node`, `javascript`, `express`, `react`, `mongodb`
(`Track` type in `lib/topics.ts`). Each track has its own ordered list of
categories in `CATEGORY_ORDER_BY_TRACK`.

## Adding a new module

1. Create `content/modules/<track-prefix>-NN-topic-name.ts` exporting a
   `ModuleContent` object (see an existing file in the same track for the
   pattern, e.g. `content/modules/js-05-closures.ts`).
2. Import and add it to the `MODULES` array in `content/index.ts`.
3. Add matching metadata (same `id`) to `TOPICS` in `lib/topics.ts`, under
   the right `track` and an existing (or new) `category`.
4. Run the content validator, which executes every challenge's own
   `solutionCode` against its `testCases` to catch typos/broken tests before
   they reach learners:
   ```bash
   node --experimental-strip-types --no-warnings scripts/validate-content.mjs
   ```

## Code execution sandbox

`app/api/run-code/route.ts` takes `{moduleId, code}`, looks up the module via
`getModuleById`, and runs the submitted code against `challenge.testCases`
using `lib/sandbox.ts`. Submitted code runs in a `node:vm` context exposing
only safe globals (`console`, timers, `Promise`, `EventEmitter`, `Buffer`,
stream classes) with a 2-second timeout per test case — it never touches the
filesystem, network, or `process`.

## A note on `content/modules/express-10-sessions-auth.ts` and `mongodb-*.ts`

These files teach sessions/cookies/auth and MongoDB/Mongoose concepts **as
curriculum** — code samples shown to the learner in the UI. They are not
connected to and have no bearing on the app's real authentication system;
see [`auth-and-progress.md`](./auth-and-progress.md) for that.
