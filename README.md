# Node.js, JavaScript & Express Concept Revision

An interactive app for revising Node.js, JavaScript, and Express.js
fundamentals: read a short
explanation, look at a couple of code examples, then solve a hands-on
coding challenge in an in-browser editor with automated tests.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Framer Motion for animations
- Monaco Editor for the code editor
- Zustand (+ localStorage) for client-side progress tracking
- Node's built-in `vm` module, in an API route, for sandboxed code execution

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## How code execution works

Submitted code never touches the filesystem, network, or `process` — it
runs in a `node:vm` context exposing only safe globals (`console`,
timers, `Promise`, `EventEmitter`, `Buffer`, stream classes, etc.), with a
2-second execution timeout per test case. See `lib/sandbox.ts` and
`app/api/run-code/route.ts`.

## Content

Module content (explanation, examples, challenge, test cases) lives in
`content/modules/*.ts` as plain typed data — no database or CMS. A dev
script validates that every challenge's reference solution actually
passes its own test cases:

```bash
node --experimental-strip-types --no-warnings scripts/validate-content.mjs
```
