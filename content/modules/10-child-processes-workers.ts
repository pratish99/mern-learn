import type { ModuleContent } from "@/lib/types";

const childProcessesWorkers: ModuleContent = {
  id: "child-processes-workers",
  title: "Child processes & worker threads",
  category: "Async & Concurrency",
  order: 10,
  explanation: `
Picture a kitchen with exactly one chef. That chef can only do one thing
at a time — chop a carrot, then stir the pot, then plate the dish. That's
how Node.js runs **your JavaScript**: on a single thread, one instruction
at a time. Node is very good at *waiting* efficiently (for a database
call, a file read, a network request) while doing other things in the
meantime — but it can only run one piece of your actual JS code at any
given instant.

That's fine for most work. But what happens when one task needs real,
sustained CPU time — resizing a huge image, hashing a password, parsing
a massive file? While that one chef is stuck chopping, nobody else in
the restaurant gets served. Your whole app freezes until it's done.

Node gives you two tools for getting real, simultaneous work done:

- **\`child_process\`** — call in outside help: start a whole separate
  program to do the work.
- **\`worker_threads\`** — hire an extra chef for your own kitchen: a
  separate thread inside the same Node process.

### \`child_process\`: run a separate program

A **process** is a fully independent running program, with its own
memory and its own everything — nothing is shared automatically.
\`child_process\` lets your Node app start one of these. It could be
another Node script, or it could be a completely different program, like
\`ls\`, \`git\`, or an image-conversion tool.

This is useful when you want to:
1. Run an external command-line tool.
2. Run heavy or risky JS work in full isolation — if it crashes, it
   doesn't take your main app down with it.

There are three functions worth knowing:

- **\`exec(command, callback)\`** — runs a shell command and waits until
  it's completely done, then hands you *all* the output at once:
  \`callback(err, stdout, stderr)\`. Simple to use, but it holds the
  entire output in memory before giving it to you — fine for a quick
  \`git status\`, risky for a command that could print gigabytes of text.

  \`\`\`js
  const { exec } = require("child_process");
  exec("ls -la", (err, stdout, stderr) => {
    if (err) return console.error(err);
    console.log(stdout); // the whole output, all at once
  });
  \`\`\`

- **\`spawn(command, args)\`** — runs a command too, but instead of
  waiting and buffering everything, it gives you the output as a
  **stream** — small chunks as they arrive. Better for long-running
  commands or ones that produce a lot of output, since you never have to
  hold it all in memory at once.

- **\`fork(modulePath)\`** — a specialized version of \`spawn\` just for
  starting *another Node.js file*. It automatically wires up a
  communication channel between parent and child, so the two processes
  can pass messages back and forth with \`.send()\` and
  \`.on("message")\`, like passing notes between two separate programs.

### \`worker_threads\`: a helper thread in the same process

**Threads** are lighter-weight than full processes — think of them as
extra chefs working in the *same* kitchen (the same Node process),
rather than calling someone in from a different building entirely.

Each worker thread gets its **own JS engine and its own event loop**, so
it can crunch through CPU-heavy code without freezing your main thread.
But by default a worker does *not* share memory with the main thread
(the exception is \`SharedArrayBuffer\`, an advanced tool for sharing raw
memory directly — not something you'll need day to day). Instead, you
talk to a worker by sending messages, the same \`postMessage\` /
\`on("message")\` pattern used by \`fork\`.

\`\`\`js
const { Worker } = require("worker_threads");

// Start a worker and hand it some initial data
const worker = new Worker("./hash-worker.js", { workerData: { input } });

worker.on("message", (result) => console.log(result)); // it finished — here's the answer
worker.on("error", (err) => console.error(err));        // it threw an error
\`\`\`

\`\`\`mermaid
flowchart LR
  Main["Main process (your app)"] -->|"fork(modulePath) / new Worker(file)"| Child["Child process / worker thread"]
  Main -->|"child.send(data) / worker.postMessage(data)"| Child
  Child -->|"process.send(result) / parentPort.postMessage(result)"| Main
  Child -->|"on('exit') / on('error')"| Main
\`\`\`

Threads are cheaper to start than whole processes, which makes
\`worker_threads\` the usual choice for CPU-bound work — hashing, parsing
large files, image processing — that would otherwise block your main
thread while it runs.

### The pattern you'll actually use: a worker pool

In real apps you almost never spawn a brand-new process or thread for
every single task — starting one has real overhead, like hiring and
training a new chef just to chop one carrot. Instead, you create a
**fixed-size pool**: a small, reusable set of workers (often matching the
number of CPU cores on the machine), and feed tasks through it a batch
at a time. As soon as a worker finishes one task, it picks up the next
one waiting in line.

### Why this matters

Whenever you catch yourself about to run something CPU-heavy — parsing a
big JSON file, resizing images, hashing passwords in a loop — directly
inside a request handler, that's your signal to reach for
\`worker_threads\` (or \`child_process\` if you're calling out to another
program) instead of running it inline and freezing your server for
everyone else.
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
