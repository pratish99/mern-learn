import type { ModuleContent } from "@/lib/types";

const runtimeBasics: ModuleContent = {
  id: "runtime-basics",
  title: "Node.js runtime basics",
  category: "Fundamentals",
  order: 1,
  explanation: `
Node.js is not a language feature — it's a **runtime**: V8 (Chrome's JS
engine) plus **libuv** (a C library providing the event loop, thread pool,
and async I/O). V8 compiles and executes your JavaScript; libuv handles
everything that talks to the OS (files, sockets, timers, DNS).

### Single-threaded, but not single-tasking

Your JS callbacks all run on **one thread** — the event loop. There's no
implicit parallelism between callbacks; only one runs at a time, to
completion, before the next one starts ("run-to-completion").

Async I/O doesn't block that thread. libuv delegates blocking work (disk
reads, some DNS lookups, crypto) to a small **thread pool** (default size
4) behind the scenes, and queues a callback on the event loop once it's
done. Network I/O typically uses the OS's async primitives (epoll/kqueue/
IOCP) directly, without needing the thread pool at all.

### Why this matters

Because JS execution is single-threaded, a long synchronous computation
**blocks everything** — timers, incoming requests, I/O callbacks — until it
finishes. There's no time-slicing between two synchronous functions the
way there is between OS threads.

\`\`\`js
console.log("start");
for (let i = 0; i < 1e9; i++) {} // blocks the event loop
console.log("done"); // nothing else can run until this line
\`\`\`

This is the core trade-off of Node: excellent for I/O-bound workloads
(many concurrent connections, mostly waiting on network/disk), poor for
CPU-bound work on the main thread (use worker threads or child processes
for that — covered later).
`.trim(),
  codeExamples: [
    {
      title: "The runtime split",
      code: `// V8: parses and executes this synchronous JS
const user = { name: "Ada" };
console.log(\`Hello, \${user.name}\`);

// libuv: schedules this, runs the callback on the event loop
// once the OS reports the timer fired — no thread is "waiting"
setTimeout(() => console.log("scheduled via libuv"), 0);`,
    },
    {
      title: "Blocking vs. non-blocking",
      code: `const fs = require("fs");

// Blocking: this thread does nothing else until the read finishes
const data = fs.readFileSync("/etc/hosts", "utf8");

// Non-blocking: libuv's thread pool does the read; this thread
// keeps running other JS while it waits
fs.readFile("/etc/hosts", "utf8", (err, data) => {
  console.log("file read complete");
});`,
      note: "Prefer the async variants in real apps — the sync ones block every other request being served by the process.",
    },
  ],
  challenge: {
    functionName: "blockingSum",
    prompt: `Write a function blockingSum(n) that synchronously sums the
integers from 1 to n (inclusive) using a loop — not the closed-form
formula. This is deliberately the kind of code that occupies the single JS
thread until it returns, illustrating Node's run-to-completion model.
Return 0 for n <= 0.`,
    starterCode: `function blockingSum(n) {
  // your code here
}`,
    solutionCode: `function blockingSum(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  return total;
}`,
    testCases: [
      { name: "sums 1..5", args: [5], expected: 15 },
      { name: "sums 1..100", args: [100], expected: 5050 },
      { name: "zero for n = 0", args: [0], expected: 0 },
      { name: "zero for negative n", args: [-10], expected: 0 },
      { name: "single element", args: [1], expected: 1 },
    ],
  },
};

export default runtimeBasics;
