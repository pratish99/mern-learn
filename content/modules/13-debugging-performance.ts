import type { ModuleContent } from "@/lib/types";

const debuggingPerformance: ModuleContent = {
  id: "debugging-performance",
  title: "Debugging & performance basics",
  category: "Reliability & Tooling",
  order: 13,
  explanation: `
Imagine your app is a car that suddenly starts making a weird noise, or
just feels sluggish going uphill. You have two different jobs: figuring
out *why* it's broken (debugging), and figuring out *where* the time is
going when it's slow (performance measurement). Node gives you built-in
tools for both, so you don't have to guess.

### Debugging: watching your code run, step by step

"Debugging" just means finding the cause of unexpected behavior — a
crash, a wrong value, code that never runs. The simplest debugging tool
you already know is \`console.log\`: print a value, see what it actually
is. That's still the fastest way to check most bugs, so don't feel bad
about reaching for it first.

When \`console.log\` isn't enough — say, you need to pause execution and
inspect variables one line at a time — Node has a real debugger built
in:

- \`node --inspect index.js\` starts your app and opens a **debug
  port**, basically a door that a debugging tool can knock on. Open
  Chrome and go to \`chrome://inspect\`, or use your editor's built-in
  Node debugger, and you can set breakpoints, step through lines, and
  inspect variables live — like Chrome DevTools, but for your
  server-side code instead of a webpage.
- \`node --inspect-brk index.js\` does the same thing, but pauses on the
  very first line before anything runs. Useful when the bug happens
  during startup, before you'd have time to attach a debugger otherwise.
- \`node --trace-warnings index.js\` makes Node print a full stack trace
  whenever it emits a warning (e.g. "this API is deprecated"), instead
  of a single vague line. A stack trace tells you exactly which line of
  *your* code triggered the warning, which saves a lot of guesswork.

For quick timing without firing up a whole profiler, pair
\`console.time(label)\` with \`console.timeEnd(label)\` — wrap them around
any block of code and Node prints how long it took:

\`\`\`js
console.time("parse");
JSON.parse(largeJsonString);
console.timeEnd("parse"); // prints: parse: 42.315ms
\`\`\`

### Measuring event loop lag: is the app keeping up?

Node runs your JavaScript on a single thread using something called the
**event loop** — a loop that keeps checking "is there work to do?" and
runs it. It's supposed to tick along on a predictable schedule. If you
schedule \`setTimeout(fn, 0)\` (run \`fn\` as soon as possible) and it
actually fires 200ms late, that's a sign something else is hogging the
thread — a long synchronous loop, a huge JSON.parse, something blocking
everyone else from getting a turn. This delay is called **event loop
lag**, and it's one of the first things to check when a Node app feels
slow under load.

Node's \`perf_hooks\` module has a built-in tool for this,
\`monitorEventLoopDelay()\`, which watches the drift between when a timer
*should* fire and when it *actually* fires, over time:

\`\`\`js
const { monitorEventLoopDelay } = require("perf_hooks");
const h = monitorEventLoopDelay();
h.enable();
// ... let your app run for a while ...
console.log(h.mean, h.max); // average and worst lag, in nanoseconds
\`\`\`

### CPU profiling: finding where the time actually goes

If the app is slow and you're not sure why, resist the urge to guess and
optimize the first thing that looks suspicious — that's usually wrong.
Instead, **measure before optimizing**. A CPU profiler records which
functions were running at each moment while your program executes, so
you can see exactly where the time went.

\`node --prof index.js\` runs your app and writes out a raw "tick
profile" (a log of what the V8 engine was doing, tick by tick). You then
turn that into something readable with \`node --prof-process\`. Tools
like \`0x\` and \`clinic\` do the heavy lifting for you and turn the same
data into a **flamegraph** — a visual chart where wider bars mean
"more time spent here" — so slow spots jump out visually instead of
requiring you to read a text log.

### Timing an operation precisely

For rough timing, \`console.time\`/\`console.timeEnd\` is fine. But if you
need an accurate number *inside* your code (say, to log how long a
database query took), avoid \`Date.now()\` — it reads the system's wall
clock, which can jump backward or forward if the computer's clock gets
adjusted (e.g. by NTP sync), giving you a nonsense duration.

Instead use \`process.hrtime.bigint()\`, or \`performance.now()\` from
\`perf_hooks\`. Both are **monotonic**, meaning they only ever move
forward at a steady rate — they measure elapsed time, not "what time is
it," so they can't jump:

\`\`\`js
const start = process.hrtime.bigint();
doWork();
const end = process.hrtime.bigint();
const durationMs = Number(end - start) / 1e6; // nanoseconds -> milliseconds
\`\`\`

**Why this matters:** when a real app misbehaves in production, you
won't get a neat error message pointing at the bug — you'll get a vague
report like "it's slow" or "it crashed sometimes." Knowing how to attach
a debugger, measure event loop lag, and time specific operations turns
that vague report into a concrete, fixable finding instead of a guess.
`.trim(),
  codeExamples: [
    {
      title: "console.time",
      code: `console.time("parse");
const data = JSON.parse(largeJsonString);
console.timeEnd("parse"); // parse: 42.315ms`,
    },
    {
      title: "Aggregating timing samples",
      code: `const samples = [
  { label: "db", ms: 12 },
  { label: "db", ms: 18 },
  { label: "render", ms: 4 },
];
// group by label to see where time actually goes, not just totals`,
    },
  ],
  challenge: {
    functionName: "summarizeTimings",
    prompt: `Write summarizeTimings(samples) where samples is an array of
{ label, ms } entries (like profiler output). Group them by label and
return an object mapping each label to { count, totalMs, avgMs }, where
totalMs is the sum of ms for that label, count is how many samples it
had, and avgMs is totalMs / count.`,
    starterCode: `function summarizeTimings(samples) {
  // your code here
}`,
    solutionCode: `function summarizeTimings(samples) {
  const summary = {};
  for (const { label, ms } of samples) {
    if (!summary[label]) {
      summary[label] = { count: 0, totalMs: 0, avgMs: 0 };
    }
    summary[label].count += 1;
    summary[label].totalMs += ms;
  }
  for (const label of Object.keys(summary)) {
    summary[label].avgMs = summary[label].totalMs / summary[label].count;
  }
  return summary;
}`,
    testCases: [
      {
        name: "groups and averages by label",
        args: () => [
          [
            { label: "db", ms: 10 },
            { label: "db", ms: 20 },
            { label: "render", ms: 5 },
          ],
        ],
        expected: {
          db: { count: 2, totalMs: 30, avgMs: 15 },
          render: { count: 1, totalMs: 5, avgMs: 5 },
        },
      },
      {
        name: "returns an empty object for no samples",
        args: () => [[]],
        expected: {},
      },
      {
        name: "computes a fractional average",
        args: () => [
          [
            { label: "x", ms: 1 },
            { label: "x", ms: 2 },
          ],
        ],
        expected: { x: { count: 2, totalMs: 3, avgMs: 1.5 } },
      },
    ],
  },
};

export default debuggingPerformance;
