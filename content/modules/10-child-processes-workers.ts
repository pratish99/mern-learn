import type { ModuleContent } from "@/lib/types";

const childProcessesWorkers: ModuleContent = {
  id: "child-processes-workers",
  title: "Child processes & worker threads",
  category: "Async & Concurrency",
  order: 10,
  explanation: `
Node is single-threaded for **your JS**, but two built-in modules give
you real parallelism when you need it.

### \`child_process\` — separate OS processes

Use this to run other programs or isolate CPU-heavy/untrusted work in a
fully separate process (own memory, own event loop).

- \`exec(cmd, cb)\` — runs a shell command, buffers all output, callback
  gets \`(err, stdout, stderr)\`. Fine for small output; avoid for large
  output (it's all buffered in memory).
- \`spawn(cmd, args)\` — streams stdout/stderr instead of buffering; better
  for long-running processes or big output.
- \`fork(modulePath)\` — spawns another **Node** process running the given
  module, with a built-in IPC channel (\`.send()\`/\`.on("message")\`) for
  passing messages back and forth.

### \`worker_threads\` — threads within one process

Real OS threads, but each has its **own V8 instance and event loop** —
they don't share memory by default (except via \`SharedArrayBuffer\`).
Communicate via \`postMessage\`/\`on("message")\`, same shape as \`fork\`'s
IPC. Cheaper to start than a child process; best for CPU-bound work
(hashing, image processing, parsing) that would otherwise block the main
thread.

\`\`\`js
const { Worker } = require("worker_threads");

const worker = new Worker("./hash-worker.js", { workerData: { input } });
worker.on("message", (result) => console.log(result));
worker.on("error", (err) => console.error(err));
\`\`\`

### The common shape: a worker pool

Whichever mechanism you use, you rarely want to spawn one worker per
task — you cap concurrency to a **fixed pool** (matching CPU core count,
say) and feed tasks through it, since spawning threads/processes has real
overhead.
`.trim(),
  codeExamples: [
    {
      title: "spawn() streams output",
      code: `const { spawn } = require("child_process");

const child = spawn("ls", ["-la"]);
child.stdout.on("data", (chunk) => process.stdout.write(chunk));
child.on("close", (code) => console.log(\`exited with \${code}\`));`,
    },
    {
      title: "worker_threads message passing",
      code: `// main.js
const worker = new Worker("./worker.js");
worker.postMessage({ n: 40 });
worker.on("message", (fib) => console.log(fib));

// worker.js
const { parentPort } = require("worker_threads");
parentPort.on("message", ({ n }) => parentPort.postMessage(fib(n)));`,
    },
  ],
  challenge: {
    functionName: "distributeWork",
    prompt: `Write async function distributeWork(tasks, workerCount, runTask) that
simulates a fixed-size worker pool: process tasks in batches of at most
workerCount at a time (running each batch's tasks concurrently via
runTask, which may return a plain value or a Promise), and return a
Promise resolving to an array of results in the SAME order as the
original tasks — not the order they finish in.`,
    starterCode: `async function distributeWork(tasks, workerCount, runTask) {
  // your code here
}`,
    solutionCode: `async function distributeWork(tasks, workerCount, runTask) {
  const results = [];
  for (let i = 0; i < tasks.length; i += workerCount) {
    const batch = tasks.slice(i, i + workerCount);
    const batchResults = await Promise.all(batch.map((task) => runTask(task)));
    results.push(...batchResults);
  }
  return results;
}`,
    testCases: [
      {
        name: "processes tasks in batches, preserving order",
        args: () => [[1, 2, 3, 4, 5], 2, (n: number) => n * 2],
        expected: [2, 4, 6, 8, 10],
      },
      {
        name: "returns an empty array for no tasks",
        args: () => [[], 3, (n: number) => n],
        expected: [],
      },
      {
        name: "workerCount of 1 runs fully sequentially",
        args: () => [["a", "b", "c"], 1, (s: string) => s.toUpperCase()],
        expected: ["A", "B", "C"],
      },
      {
        name: "supports async runTask functions",
        args: () => [[1, 2, 3], 2, (n: number) => Promise.resolve(n + 1)],
        expected: [2, 3, 4],
      },
    ],
  },
};

export default childProcessesWorkers;
