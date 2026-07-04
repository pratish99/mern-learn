import type { ModuleContent } from "@/lib/types";

const eventLoopMicrotasks: ModuleContent = {
  id: "event-loop-microtasks",
  title: "Event loop phases & microtasks",
  category: "Async & Concurrency",
  order: 4,
  explanation: `
Node's event loop runs in **phases**, each with its own FIFO queue of
callbacks. A simplified pass through the loop looks like:

1. **timers** — \`setTimeout\`/\`setInterval\` callbacks whose time has elapsed
2. **pending callbacks** — some system-level callbacks deferred from the previous loop
3. **poll** — retrieve new I/O events; executes I/O callbacks (e.g. \`fs\`, sockets)
4. **check** — \`setImmediate\` callbacks
5. **close callbacks** — e.g. \`socket.on('close', ...)\`

### Microtasks aren't a phase — they run between everything

Promise \`.then\`/\`.catch\`/\`.finally\` callbacks and \`queueMicrotask\` go on
the **microtask queue**, which Node drains **completely** after the
current operation finishes and before moving to the next phase (and even
between each callback within a phase). Microtasks can starve the event
loop if they keep queuing more microtasks — the loop can't advance to
timers/I/O until the microtask queue is empty.

### Order of operations

\`\`\`js
console.log("1: sync");

setTimeout(() => console.log("4: macrotask (timer)"), 0);

Promise.resolve().then(() => console.log("3: microtask"));

console.log("2: sync");
// Output: 1, 2, 3, 4
\`\`\`

Synchronous code always finishes first (the call stack must be empty
before any queue is processed). Then **all** pending microtasks run.
Only then does the loop move to the next macrotask phase (here, timers).

\`process.nextTick()\` (not covered by the WHATWG spec, Node-specific) is
even higher priority than Promise microtasks — its queue is fully drained
before the Promise microtask queue on each pass.
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
