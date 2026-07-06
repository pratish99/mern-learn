import type { ModuleContent } from "@/lib/types";

const eventLoopMicrotasks: ModuleContent = {
  id: "event-loop-microtasks",
  title: "Event loop phases & microtasks",
  category: "Async & Concurrency",
  order: 4,
  explanation: `
### The problem: one waiter, many tables

Imagine a restaurant with exactly **one waiter** (that's your JavaScript
program — it can only do one thing at a time). The waiter can't cook, so
when a table orders food, they drop the ticket in the kitchen and move on
to the next table instead of standing there waiting. When the kitchen
finishes an order, it doesn't interrupt the waiter mid-conversation — it
puts the finished plate on a pickup counter, and the waiter comes back to
it after finishing whatever they're currently doing.

That "one waiter, drop off the work, come back later" pattern is exactly
how Node.js works. The waiter is your code running on a single thread.
The kitchen is the underlying system doing slow things (reading files,
waiting on a timer, talking to a database). The **event loop** is the
loop the waiter runs: finish what's in hand, check the pickup counters,
handle what's ready, repeat forever. This is what lets Node handle timers,
network requests, and file reads without ever spawning extra threads for
your JS code.

### Two kinds of "pickup counters": macrotasks and microtasks

Not all pending work is treated equally. There are two queues (lines of
waiting work) that matter most for revision purposes:

- **Macrotasks** ("regular" tasks) — things like a \`setTimeout\` callback
  firing, or an I/O callback (e.g. a file finished reading). Node organizes
  these into ordered **phases** (timers, I/O callbacks, \`setImmediate\`,
  close callbacks, and a couple of internal ones). Each phase is its own
  FIFO (first-in-first-out) queue.
- **Microtasks** — smaller, higher-priority follow-up work, mainly Promise
  \`.then\`/\`.catch\`/\`.finally\` callbacks and anything you schedule with
  \`queueMicrotask()\`. These don't wait for a phase — they get squeezed in
  constantly.

The rule that trips people up: **after any single piece of code finishes
running, Node fully empties the microtask queue before doing anything
else** — before the next macrotask, and even before moving to the next
phase. So microtasks always cut in line ahead of macrotasks.

### Why this can bite you

Because the microtask queue must go completely empty before Node moves
on, a microtask that keeps scheduling *more* microtasks can block timers
and I/O from ever running — this is called **starving the event loop**.
It's a real bug pattern: an unbounded chain of \`.then()\` calls that keeps
adding more \`.then()\`s can delay a \`setTimeout\` indefinitely, even though
the timer "fired" long ago.

### Walking through an example

\`\`\`js
console.log("1: sync"); // runs immediately, top to bottom

setTimeout(() => console.log("4: macrotask (timer)"), 0); // goes to the timers phase queue

Promise.resolve().then(() => console.log("3: microtask")); // goes to the microtask queue

console.log("2: sync"); // still just running synchronously

// Output: 1, 2, 3, 4
\`\`\`

Read it in three passes:

1. **Synchronous code first.** Nothing else can run until every line of
   plain, non-async code has executed and the call stack (the "currently
   running code" stack) is empty. That's why both \`console.log\` lines
   print before anything else — \`setTimeout\` and \`.then()\` only *schedule*
   work, they don't run it right away.
2. **Then all microtasks, completely.** Once the synchronous code is
   done, Node drains the microtask queue. The \`.then()\` callback runs,
   printing \`"3: microtask"\`.
3. **Only then, the next macrotask.** With the microtask queue empty,
   Node finally lets the timers phase run, printing \`"4: macrotask (timer)"\`
   — even though it was scheduled with a \`0\`ms delay and was technically
   "ready" the whole time.

### One more wrinkle: \`process.nextTick()\`

Node has a Node-specific queue, \`process.nextTick()\`, that isn't part of
the official JavaScript spec (it's a Node-only extra). It jumps the queue
even ahead of Promise microtasks: on every pass, Node fully drains
\`process.nextTick()\` callbacks *before* touching the Promise microtask
queue. You'll see it in older Node codebases more than in modern
Promise-based code, but it's worth recognizing when you spot it.

### Why this matters

When you're debugging "why did my callback run in the wrong order?" or
"why is my \`setTimeout\` late?", the answer is almost always this
ordering: **sync code → all microtasks → next macrotask phase**. Knowing
that lets you predict output correctly and spot the "runaway microtask"
bug before it ships.
`.trim(),
  codeExamples: [
    {
      title: "Predicting the order",
      code: `console.log("start");

setTimeout(() => console.log("timeout"), 0);

Promise.resolve()
  .then(() => console.log("promise 1"))
  .then(() => console.log("promise 2"));

console.log("end");

// start, end, promise 1, promise 2, timeout`,
    },
    {
      title: "Microtasks can starve macrotasks",
      code: `function recurse() {
  Promise.resolve().then(recurse); // keeps re-queuing a microtask
}
recurse();
setTimeout(() => console.log("never runs promptly"), 0);
// the timer callback waits until the microtask queue empties`,
      note: "Contrived, but it's the same failure mode as an unbounded recursive .then() chain in real code.",
    },
  ],
  challenge: {
    functionName: "recordExecutionOrder",
    prompt: `Write recordExecutionOrder() that returns a Promise. It must record,
into an array (in this exact order), the string "sync" synchronously,
then "microtask" via a microtask (queueMicrotask or a Promise callback),
then "macrotask" via setTimeout. Resolve the returned Promise with that
array only after the macrotask callback has recorded its entry.`,
    starterCode: `function recordExecutionOrder() {
  // your code here
}`,
    solutionCode: `function recordExecutionOrder() {
  return new Promise((resolve) => {
    const order = [];
    order.push("sync");
    queueMicrotask(() => {
      order.push("microtask");
    });
    setTimeout(() => {
      order.push("macrotask");
      resolve(order);
    }, 0);
  });
}`,
    testCases: [
      {
        name: "records sync, microtask, macrotask in order",
        args: () => [],
        expected: ["sync", "microtask", "macrotask"],
      },
      {
        name: "works correctly when called twice in a row",
        args: () => [],
        expected: ["sync", "microtask", "macrotask"],
      },
    ],
  },
};

export default eventLoopMicrotasks;
