import type { ModuleContent } from "@/lib/types";

const runtimeBasics: ModuleContent = {
  id: "runtime-basics",
  title: "Node.js runtime basics",
  category: "Fundamentals",
  order: 1,
  explanation: `
### The problem: JavaScript alone can't touch your hard drive

Imagine JavaScript as a chef who is brilliant at following recipes but
has no arms — it can *decide* what to do, but it can't actually open a
file, talk to a network, or set a timer by itself. Something else has to
do the physical work. That "something else" is **Node.js**.

Node isn't a new programming language. It's a **runtime** — a program
that takes your JavaScript and gives it hands. Under the hood, Node is
really two pieces glued together:

- **V8** — the same JS engine Chrome uses. It reads your JavaScript and
  runs it.
- **libuv** — a C library that knows how to talk to the operating system:
  reading files, opening network sockets, running timers, looking things
  up over DNS.

So when your code calls \`fs.readFile(...)\`, V8 isn't the one reading the
file — it hands that job to libuv, which asks the OS to do it.

### One thread, one task at a time

Here's the part beginners trip over: **all of your JavaScript runs on a
single thread**, called the **event loop**. A "thread" is just a single
line of execution — one thing happening at a time, in order. There is
only one of these for your JS code, no matter how many things your app
seems to be doing "at once."

This means:

- Only one piece of your JS code runs at any given instant.
- Once a function starts running, it runs **to completion** before the
  next thing gets a turn — nobody can interrupt it partway through.

That sounds limiting, but Node is still great at handling thousands of
things "at once" (think: a web server with many visitors). It manages
this trick by keeping the *waiting* off the JS thread, not the running.

### Async work happens somewhere else, then reports back

When you ask Node to do something slow — read a file, query a database,
wait for a timer — it doesn't make your JS thread sit there twiddling its
thumbs. Instead:

1. Node hands the slow task to libuv.
2. libuv either asks the OS to watch for it (common for network requests)
   or runs it on a small background **thread pool** (a handful of extra
   threads, 4 by default, used for things like file reads or some
   encryption work).
3. Your JS thread is immediately free to keep running other code.
4. When the slow task finishes, libuv places your callback function into
   a queue, and the event loop picks it up and runs it — on that same
   single JS thread, in its turn.

So "asynchronous" doesn't mean "runs at the same time as your other
code." It means "runs *later*, once the slow part is done, without
making everything else wait for it."

### Why a single thread can still be a trap

Because there is only one thread for your JS, a function that takes a
long time to *compute* (not just to wait) will freeze everything else —
timers won't fire, other requests won't be handled, nothing moves —
until that function returns.

\`\`\`js
console.log("start");

// This is a synchronous, CPU-bound loop — libuv can't help here,
// because there's no I/O to hand off. V8 just has to grind through it.
for (let i = 0; i < 1e9; i++) {}

console.log("done"); // literally nothing else can run until this fires
\`\`\`

Contrast that with waiting on a file or a network call: that's I/O
(input/output), and Node can delegate the *waiting* part, so your thread
stays free.

### Why this matters

Node's whole personality follows from this design: it's excellent at
juggling many slow, I/O-heavy tasks (serving lots of web requests that
are mostly waiting on a database or network), and bad at doing heavy
number-crunching directly on the main thread, because that blocks
everyone else. When you genuinely need heavy computation, you reach for
worker threads or separate processes instead (covered in a later
module) — but for everyday app code, the lesson is simpler: keep your
synchronous code short, and let async APIs (callbacks, promises,
async/await) do the waiting for you.
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
      { name: "sums 1..5", args: () => [5], expected: 15 },
      { name: "sums 1..100", args: () => [100], expected: 5050 },
      { name: "zero for n = 0", args: () => [0], expected: 0 },
      { name: "zero for negative n", args: () => [-10], expected: 0 },
      { name: "single element", args: () => [1], expected: 1 },
    ],
  },
};

export default runtimeBasics;
