import type { ModuleContent } from "@/lib/types";

const eventEmitterModule: ModuleContent = {
  id: "event-emitter",
  title: "EventEmitter & custom events",
  category: "Async & Concurrency",
  order: 5,
  explanation: `
\`EventEmitter\` (from \`node:events\`) is the backbone of Node's
non-stream async APIs — servers, streams, and countless libraries extend
it. It's a synchronous pub/sub implementation: \`emit\` calls every
registered listener **in the order they were added**, synchronously, on
the current call stack.

### Core API

- \`emitter.on(event, listener)\` — subscribe (repeatable calls; a listener
  is called every time the event fires)
- \`emitter.once(event, listener)\` — subscribe for a single invocation,
  then auto-removed
- \`emitter.emit(event, ...args)\` — synchronously invoke all listeners for
  \`event\` with \`args\`; returns \`true\` if there were listeners
- \`emitter.off(event, listener)\` (alias \`removeListener\`) — unsubscribe

### The special \`"error"\` event

If an \`EventEmitter\` emits \`"error"\` and there is **no listener** for it,
Node throws the error and (by default) crashes the process. This is
deliberate — errors must not be silently swallowed. Always attach an
\`error\` listener on emitters that might emit one.

\`\`\`js
const emitter = new EventEmitter();
emitter.emit("error", new Error("boom")); // throws — no listener attached
\`\`\`

### Listener order & synchronous execution

Because \`emit\` runs listeners synchronously and in registration order, a
slow listener blocks the others — and blocks whatever called \`emit\` from
continuing until every listener returns.
`.trim(),
  codeExamples: [
    {
      title: "Basic pub/sub",
      code: `const { EventEmitter } = require("events");

const bus = new EventEmitter();
bus.on("greet", (name) => console.log(\`Hello, \${name}\`));
bus.emit("greet", "Ada"); // "Hello, Ada" — synchronous, immediate`,
    },
    {
      title: "once() vs on()",
      code: `const emitter = new EventEmitter();
let calls = 0;
emitter.once("ready", () => calls++);

emitter.emit("ready"); // calls === 1
emitter.emit("ready"); // calls still === 1, listener was removed`,
    },
  ],
  challenge: {
    functionName: "sumEmittedValues",
    prompt: `Write sumEmittedValues(values) where values is an array of numbers.
Create your own EventEmitter (the EventEmitter class is available
globally), attach a listener on the "data" event that adds each emitted
number to a running total, then emit a "data" event for every number in
values, in order, via emitter.emit("data", n). Return the final total
after all events have been emitted.`,
    starterCode: `function sumEmittedValues(values) {
  // your code here
}`,
    solutionCode: `function sumEmittedValues(values) {
  const emitter = new EventEmitter();
  let total = 0;
  emitter.on("data", (n) => {
    total += n;
  });
  for (const value of values) {
    emitter.emit("data", value);
  }
  return total;
}`,
    testCases: [
      { name: "sums emitted values", args: () => [[1, 2, 3]], expected: 6 },
      { name: "returns 0 for no events", args: () => [[]], expected: 0 },
      {
        name: "handles negative values",
        args: () => [[10, -2, 5]],
        expected: 13,
      },
      {
        name: "works with a single event",
        args: () => [[42]],
        expected: 42,
      },
    ],
  },
};

export default eventEmitterModule;
