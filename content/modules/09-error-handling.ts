import type { ModuleContent } from "@/lib/types";

const errorHandling: ModuleContent = {
  id: "error-handling",
  title: "Error handling",
  category: "Reliability & Tooling",
  order: 9,
  explanation: `
Node code has to handle errors from three distinct shapes of API, and
mixing them up is the most common source of unhandled crashes.

### 1. Synchronous throws

Caught with plain \`try/catch\`. If uncaught, they propagate up the call
stack and, if nothing catches them, crash the process.

### 2. Error-first callbacks

The callback receives \`(err, result)\` — check \`err\` before touching
\`result\`. A thrown error *inside* a callback is not caught by a
\`try/catch\` wrapped around the function that registered the callback,
since the callback runs later, on its own stack.

\`\`\`js
try {
  fs.readFile("a.txt", (err, data) => {
    if (err) throw err; // this throw is NOT caught below
  });
} catch (e) {
  // never reached for the async error above
}
\`\`\`

### 3. Rejected Promises

Caught with \`.catch()\` or \`try/catch\` around an \`await\`. Since Node 15,
an **unhandled Promise rejection terminates the process** by default —
always attach a rejection handler, even if it's just logging.

### Result-style handling

A popular pattern is to normalize outcomes into a plain value instead of
throwing, so callers can't forget to handle the error path:

\`\`\`js
async function toResult(promise) {
  try {
    return { ok: true, value: await promise };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const result = await toResult(fetchUser(id));
if (!result.ok) return renderError(result.error);
use(result.value);
\`\`\`

### Custom error classes

Extend \`Error\` for domain-specific errors so callers can branch on
\`instanceof\` or a \`.code\` property instead of parsing messages:

\`\`\`js
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}
\`\`\`
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
