# Node.js Concept Revision App — Build Prompts

Paste these into Claude Code **one phase at a time**, in order. Let each phase
finish and actually run before moving to the next — don't batch them.

**Stack assumptions:** Next.js 14 (App Router) + TypeScript + Tailwind CSS +
Framer Motion (animations) + Monaco Editor (code editor) + Zustand (progress
state) + a sandboxed Node `vm` module running in an API route for code
execution (safe, no extra infra). If you'd rather execute code fully
client-side via WebContainers, tell Claude that in Phase 4 instead.

---

## Phase 0 — Project brief (paste first, before any scaffolding)

```
I'm building an interactive Next.js app to help me revise Node.js concepts
by reading short explanations and then writing/running real code challenges.

Stack: Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion for
animations, Monaco Editor for the code editor, Zustand for client state.

Topics to cover (each is a "module" with: explanation, 1-2 short code
examples, and 1 hands-on coding challenge with automated test cases):
1. Node.js runtime basics (V8, libuv, single-threaded event loop)
2. Modules (CommonJS vs ESM, require vs import)
3. Async programming (callbacks -> Promises -> async/await)
4. Event loop phases & the microtask queue
5. EventEmitter & custom events
6. Streams & Buffers (readable/writable/duplex/transform)
7. File system (fs, fs/promises)
8. HTTP module & building a raw server
9. Error handling (try/catch, error-first callbacks, unhandledRejection)
10. Child processes & worker threads
11. npm, package.json, semver
12. process, env vars, and the global object
13. Basic debugging & performance (event loop lag, profiling)
14. Security basics (input validation, avoiding eval, safe deps)
15. Testing basics (writing a test with Node's built-in test runner)

Don't write any code yet. First propose:
- The folder structure
- The data model for a "module" (explanation + examples + challenge + test cases)
- How code execution/testing will work safely on the server (sandboxed vm,
  timeout, no filesystem/network access)
- The main pages/routes and navigation structure

Wait for my approval before scaffolding.
```

---

## Phase 1 — Scaffold the project

```
Scaffold the Next.js app per the plan we agreed on:
- Next.js 14 App Router + TypeScript + Tailwind, strict mode on
- Install and configure: framer-motion, zustand, @monaco-editor/react
- Folder structure: /app, /components, /lib, /content (module data as
  TypeScript files, not a database — this should work with zero backend
  setup beyond the code-execution API route)
- Set up a clean design system in tailwind.config: a dark, code-editor-like
  color palette (not default Tailwind blue/gray), a monospace font for code
  and a distinct sans font for body text
- Add a root layout with a sidebar (topic list) and main content area
- Get it running with `npm run dev` and confirm no errors
```

---

## Phase 2 — Content data model + first 3 modules

```
Create the content data model in /content (TypeScript, strongly typed):
- Module { id, title, category, explanation (markdown string), codeExamples[],
  challenge: { prompt, starterCode, solutionCode, testCases[] } }
- Write out the full content for the first 3 modules only for now:
  "Node.js runtime basics", "Modules (CommonJS vs ESM)", "Async programming"
- Each explanation should be concise (a competent dev revising, not learning
  from scratch) with a short code snippet or two
- Each challenge should be a small, self-contained function the user writes
  in the editor, testable via simple input/output assertions

Render module content on a page (no code execution yet, just reading).
```

---

## Phase 3 — Code editor + safe execution

```
Now wire up the coding challenge experience:
- Add Monaco Editor pre-filled with each module's starterCode
- Create a /api/run-code route that executes submitted code safely:
  Node's built-in `vm` module (or `node:vm2`-style isolation if you prefer),
  a strict timeout (e.g. 2s), no fs/network/process access exposed
- Run the challenge's testCases against the user's code server-side, return
  pass/fail + actual vs expected output per test case, plus any thrown error
- Display results in the UI: which tests passed/failed and why
- Handle infinite loops / timeouts gracefully with a clear error message

Test this end to end with the 3 existing modules' challenges.
```

---

## Phase 4 — Animations & interaction polish

```
Add Framer Motion animations throughout:
- Sidebar: animate active module highlight, smooth expand/collapse for
  categories
- Content transitions: fade/slide when switching modules
- Code test results: animate each test case result in (stagger), green
  check / red X with a subtle bounce
- On all tests passing a challenge: a small celebratory animation (confetti
  or a checkmark burst — keep it tasteful, not gimmicky)
- Progress bar in the sidebar per topic and overall, animated on update
- Loading state while code executes (small spinner/skeleton in the editor
  panel, not a full-page blocker)

Keep animations snappy (150-300ms), not distracting.
```

---

## Phase 5 — Remaining modules (content bulk-fill)

```
Using the same data model and quality bar as the first 3 modules, write
full content (explanation + examples + challenge + test cases) for the
remaining 12 modules:
4. Event loop phases & microtask queue
5. EventEmitter & custom events
6. Streams & Buffers
7. File system (fs/promises)
8. HTTP module & raw server
9. Error handling
10. Child processes & worker threads
11. npm, package.json, semver
12. process & env vars
13. Debugging & performance basics
14. Security basics
15. Testing basics (node:test)

Keep explanations equally concise. Make sure challenges are runnable in the
sandboxed vm (no real fs/network access needed — simulate where necessary,
e.g. an in-memory "fake fs" object for the fs module challenge).
```

---

## Phase 6 — Progress persistence & gamification

```
Add state persistence with Zustand + localStorage:
- Track per-module: viewed / attempted / completed
- Track a simple streak (days visited) and total challenges completed
- Add a small stats/progress page: overall completion %, per-category
  breakdown (animated progress rings or bars), streak counter
- Add a "reset progress" option

Keep this entirely client-side — no backend/auth needed.
```

---

## Phase 7 — Final polish & responsiveness

```
Final pass:
- Full responsive check: sidebar collapses to a drawer on mobile, editor
  panel stacks below explanation on small screens
- Dark mode is default; add a light mode toggle if it's low-effort, skip if not
- Keyboard shortcut to run code (Cmd/Ctrl+Enter) in the editor
- Empty/error states: what happens if the run-code API fails or times out
- Quick accessibility pass: focus states, semantic headings, alt text
- Add a simple README explaining how to run the project locally

Do a final full click-through of every module and confirm nothing is broken.
```

---

### Notes
- Run phases in order; each depends on the previous one being working, not
  just written.
- If Claude Code drifts on scope in any phase, redirect it back to just that
  phase's bullet list rather than letting it "helpfully" jump ahead.
- If you want real Node execution instead of the simulated fs/vm sandbox
  (e.g. actually running arbitrary Node code in-browser), swap Phase 3 for
  a WebContainers-based approach — that needs `Cross-Origin-Embedder-Policy`
  / `Cross-Origin-Opener-Policy` headers set in `next.config.js` and only
  works on Vercel/self-hosted (not all static hosts support the required
  headers).