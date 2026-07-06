import type { ModuleContent } from "@/lib/types";

const errorHandling: ModuleContent = {
  id: "error-handling",
  title: "Error handling",
  category: "Reliability & Tooling",
  order: 9,
  explanation: `
Imagine three different ways a food delivery order can go wrong: the
kitchen catches fire while cooking your order (something breaks *right
now*), the delivery driver calls to say they can't find your address
(something breaks *later*, and someone has to tell you), or the app
just shows "order failed" with no call at all because nobody was
listening for that message (something breaks *later*, and nobody
finds out).

Node.js errors work the same way — they show up in three different
shapes, depending on what kind of code raised them. Mixing up which
shape you're dealing with is the single most common reason apps
crash unexpectedly. This module walks through each shape, then shows
two patterns for handling errors more predictably.

### 1. Synchronous throws — the "right now" error

A **synchronous** throw happens immediately, in the middle of running
a line of code — like the kitchen fire. You catch it with a
\`try/catch\` block, which just means "try running this code, and if
it throws, run this other code instead of crashing":

\`\`\`js
try {
  const data = JSON.parse(input); // throws if input isn't valid JSON
} catch (err) {
  console.log("Bad input:", err.message);
}
\`\`\`

If nothing catches it, the error travels back up through whichever
functions called the one that threw (this chain of "who called whom"
is called the **call stack**), and if it reaches the top with no
\`catch\` anywhere, Node crashes the whole process.

### 2. Error-first callbacks — the "phone call" error

Older Node APIs (like \`fs.readFile\`) don't throw. Instead they take a
**callback** — a function you hand over that gets called later, once
the work is done — and Node calls it with two arguments:
\`(err, result)\`. This is the "error-first callback" convention: the
first argument is either an error object or \`null\`, so you always
check \`err\` before you touch \`result\`.

Here's the part that trips people up: a callback runs later, as its
own separate turn of code, not while the original function is still
running. That means a \`try/catch\` wrapped around the *outer* call
cannot catch a throw that happens *inside* the callback — by the time
the callback runs, the \`try\` block has already finished:

\`\`\`js
try {
  fs.readFile("a.txt", (err, data) => {
    if (err) throw err; // this throw is NOT caught below
  });
} catch (e) {
  // never reached for the async error above
}
\`\`\`

The fix is simple once you see it: handle the error *inside* the
callback itself, right where \`err\` is available.

### 3. Rejected Promises — the "nobody was listening" error

A **Promise** is an object representing a value that will exist
later — either it succeeds (**resolves**) or fails (**rejects**). You
handle a rejection with \`.catch()\`, or with a \`try/catch\` wrapped
around an \`await\` (which pauses your function until the Promise
settles).

The dangerous case is a rejected Promise nobody is watching, which
is called an **unhandled rejection**. Since Node 15, an unhandled
rejection crashes the process by default, the same as an uncaught
throw. So: any time you create a Promise or call an \`async\` function,
make sure a \`.catch()\` or \`try/catch\` is attached somewhere — even
if it's only there to log the problem.

### Result-style handling — errors as data, not surprises

Throwing and rejecting both rely on the caller *remembering* to add a
\`catch\`. An alternative pattern sidesteps that: instead of throwing,
the function returns a plain object describing what happened. Callers
then can't "forget" to handle the failure case, because the success
value and the error are the same returned object:

\`\`\`js
async function toResult(promise) {
  try {
    return { ok: true, value: await promise };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const result = await toResult(fetchUser(id));
if (!result.ok) return renderError(result.error); // handled explicitly
use(result.value);
\`\`\`

Nothing here is magic — \`toResult\` just moves the \`try/catch\` inside
itself, so callers deal with a normal \`if\` statement instead of
remembering to wrap every call site.

### Custom error classes — errors with more to say

A plain \`Error\` only really carries a message string. Sometimes you
want an error that carries structured information too — which field
failed validation, what HTTP status code it should map to, and so on.
You get that by **extending** the built-in \`Error\` class (creating
your own class that's a more specific version of it):

\`\`\`js
class ValidationError extends Error {
  constructor(message, field) {
    super(message); // sets up the normal Error stuff (like .message)
    this.name = "ValidationError";
    this.field = field; // extra info specific to this kind of error
  }
}
\`\`\`

Callers can then check \`err instanceof ValidationError\` (or read
\`err.field\`) to react to specific failures, instead of trying to
parse meaning out of a message string.

### Why this matters

Every bug report that says "the server just crashed with no error
message" traces back to one of these three shapes going unhandled:
a throw with no \`try/catch\`, a callback error nobody checked, or a
rejected Promise nobody caught. Before you call any Node API, ask
"does this throw, take a callback, or return a Promise?" — that
answer tells you exactly which handling pattern it needs.
`.trim(),
  codeExamples: [
    {
      title: "process-level safety nets",
      code: `process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1); // fail fast rather than run in a corrupted state
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});`,
      note: "These are last-resort nets, not a substitute for handling errors where they occur.",
    },
    {
      title: "Custom error class",
      code: `class NotFoundError extends Error {
  constructor(resource) {
    super(\`\${resource} not found\`);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}`,
    },
  ],
  challenge: {
    functionName: "toResult",
    prompt: `Write an async function toResult(promise) that awaits the given
promise. If it resolves, return { ok: true, value }. If it rejects,
return { ok: false, error: err.message } — toResult itself must never
throw or leave a rejection unhandled.`,
    starterCode: `async function toResult(promise) {
  // your code here
}`,
    solutionCode: `async function toResult(promise) {
  try {
    const value = await promise;
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}`,
    testCases: [
      {
        name: "wraps a resolved value",
        args: () => [Promise.resolve(42)],
        expected: { ok: true, value: 42 },
      },
      {
        name: "wraps a rejected error",
        args: () => [Promise.reject(new Error("boom"))],
        expected: { ok: false, error: "boom" },
      },
      {
        name: "wraps a resolved string",
        args: () => [Promise.resolve("hi")],
        expected: { ok: true, value: "hi" },
      },
      {
        name: "wraps a different rejection message",
        args: () => [Promise.reject(new Error("missing field"))],
        expected: { ok: false, error: "missing field" },
      },
    ],
  },
};

export default errorHandling;
