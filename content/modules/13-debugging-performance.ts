import type { ModuleContent } from "@/lib/types";

const debuggingPerformance: ModuleContent = {
  id: "debugging-performance",
  title: "Debugging & performance basics",
  category: "Reliability & Tooling",
  order: 13,
  explanation: `
### Debugging

- \`node --inspect index.js\` opens a Chrome DevTools-compatible debug
  port — attach via \`chrome://inspect\` or your editor's Node debugger.
  \`--inspect-brk\` pauses on the first line, useful for debugging startup
  code.
- \`console.log\` is still the fastest feedback loop for most bugs, but
  \`console.time(label)\` / \`console.timeEnd(label)\` gives quick timing
  without a full profiler.
- \`node --trace-warnings\` prints stack traces for process warnings
  (e.g. deprecations) instead of a one-line summary.

### Measuring event loop lag

The event loop should tick roughly on schedule. If a \`setTimeout(fn, 0)\`
actually fires 200ms late, something synchronous is hogging the thread.
\`perf_hooks\`'s \`monitorEventLoopDelay()\` measures this over time; a
cheap ad-hoc check schedules a timer and measures the drift between
expected and actual fire time.

\`\`\`js
const { monitorEventLoopDelay } = require("perf_hooks");
const h = monitorEventLoopDelay();
h.enable();
// later:
console.log(h.mean, h.max); // nanoseconds
\`\`\`

### CPU profiling

\`node --prof index.js\` writes a V8 tick profile you process with
\`node --prof-process\`; \`0x\` and \`clinic\` wrap this into flamegraphs.
The workflow is always the same: **measure before optimizing** — guessing
where time goes is usually wrong.

### Timing an operation precisely

\`process.hrtime.bigint()\` (or the newer \`performance.now()\` from
\`perf_hooks\`, monotonic and sub-millisecond) avoids the pitfalls of
\`Date.now()\`, which can jump if the system clock is adjusted.

\`\`\`js
const start = process.hrtime.bigint();
doWork();
const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
\`\`\`
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
