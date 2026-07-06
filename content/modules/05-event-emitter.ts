import type { ModuleContent } from "@/lib/types";

const eventEmitterModule: ModuleContent = {
  id: "event-emitter",
  title: "EventEmitter & custom events",
  category: "Async & Concurrency",
  order: 5,
  explanation: `
### The problem: how do different parts of your code react to "something happened"?

Imagine a doorbell. You don't sit and stare at the door waiting for
someone to arrive — you install a doorbell, and whenever it's pressed,
whoever is around reacts (the dog barks, you get up, the porch light
turns on). Nobody had to check the door in a loop. They just said
"let me know when the bell rings" ahead of time.

That's exactly the pattern Node uses to let code react to things like
"a new HTTP request arrived," "a chunk of a file finished reading," or
"a button was clicked" (in the browser, this is the same idea behind
\`addEventListener\`). The building block for this pattern in Node is a
class called \`EventEmitter\`, which lives in the built-in \`node:events\`
module. It's so fundamental that servers, streams, and a huge number of
npm packages are built on top of it.

### The two core moves: subscribing and firing

An \`EventEmitter\` is basically an object that can (1) remember a list of
"doorbells" (called **events**, just string names like \`"data"\` or
\`"error"\`) and the functions that should run when each one is pressed
(called **listeners**), and (2) "press" one of those doorbells whenever
you want.

- \`emitter.on(event, listener)\` — **subscribe**. "When \`event\` happens,
  run \`listener\`." You can call \`.on\` more than once for the same event
  to attach several listeners; all of them will run.
- \`emitter.emit(event, ...args)\` — **fire the event**. This runs every
  listener that was registered for \`event\`, passing along any extra
  arguments you give it. It returns \`true\` if at least one listener was
  called, \`false\` otherwise.
- \`emitter.once(event, listener)\` — like \`.on\`, but the listener
  automatically unsubscribes itself after running one time. Handy for
  things like "the first time this connects, log a message" — you don't
  want that message every time.
- \`emitter.off(event, listener)\` (also called \`removeListener\`) —
  **unsubscribe** a specific listener you added earlier.

\`\`\`js
const { EventEmitter } = require("events");

const doorbell = new EventEmitter();

// Subscribe: "when 'ring' happens, run this function"
doorbell.on("ring", (visitor) => {
  console.log(\`Someone's here: \${visitor}\`);
});

// Fire the event — this runs the listener(s) right away
doorbell.emit("ring", "the mail carrier");
// logs: "Someone's here: the mail carrier"
\`\`\`

One important detail: emitting is **synchronous**. When you call
\`.emit()\`, every matching listener runs immediately, one after another,
in the order they were attached — nothing gets deferred to "later." Your
code that called \`emit\` won't move on to its next line until every
listener has finished running.

### The one event you should never ignore: \`"error"\`

Most event names are just plain strings you make up — \`"ring"\`,
\`"data"\`, \`"finished"\`, whatever fits your app. But Node treats one
event name specially: \`"error"\`.

If an \`EventEmitter\` emits \`"error"\` and **nobody is listening for it**,
Node doesn't just quietly drop the error — it throws it, and by default
that crashes your whole process. This isn't a bug; it's a deliberate
safety net so that errors can never be silently swallowed and ignored.

\`\`\`js
const emitter = new EventEmitter();
emitter.emit("error", new Error("boom")); // no listener → this crashes the process!
\`\`\`

The takeaway: **any time you work with an emitter that might emit
\`"error"\`** (streams are a classic example), attach an \`.on("error", ...)\`
listener for it, even if it just logs the problem. That one line of
defensive code can save you from a surprise crash in production.

### Why this matters

You'll see this exact \`.on\` / \`.emit\` pattern constantly once you start
writing real Node code — HTTP servers emit \`"request"\`, streams emit
\`"data"\` and \`"end"\`, child processes emit \`"exit"\`. Once you recognize
"oh, this is just an EventEmitter," you already know how to use it: hook
up listeners with \`.on\` before anything interesting happens, and always
remember to listen for \`"error"\`.
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
