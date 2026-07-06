import type { ModuleContent } from "@/lib/types";

function makeFakeFs(files: Record<string, string>) {
  return {
    readFile: (path: string) =>
      new Promise<string>((resolve, reject) => {
        if (Object.prototype.hasOwnProperty.call(files, path)) {
          resolve(files[path]);
        } else {
          reject(new Error(`ENOENT: no such file, open '${path}'`));
        }
      }),
  };
}

const fileSystem: ModuleContent = {
  id: "file-system",
  title: "File system (fs/promises)",
  category: "I/O & Networking",
  order: 7,
  explanation: `
Imagine you keep a notebook on your desk. To read what's in it, you have to
physically open it, wait for your eyes to scan the page, and only then can
you use the information. Reading a file from disk works the same way:
Node has to go ask the operating system to fetch the data, and that takes
real time — much longer than, say, adding two numbers in memory. The \`fs\`
module ("file system") is Node's toolkit for that: reading files, writing
files, making folders, and so on.

### Why there are three ways to do the same thing

Because reading a file takes time, Node has to decide: should the rest of
your program wait, or should it keep running and get notified later? Over
the years Node grew three different answers to that question, and you'll
still see all three in real code:

- **Sync** — \`fs.readFileSync()\`. This one makes your whole program stop
  and wait until the file is fully read. Simple to reason about, but if
  this runs on a web server, *every other request freezes too* while it
  waits. Fine for quick scripts, risky in a running app.
- **Callback** — \`fs.readFile(path, cb)\`. This is the original
  "don't wait" approach: you hand Node a function (the callback) to run
  once the file is ready, and your program keeps going in the meantime.
  It works, but nesting many of these gets messy fast (sometimes called
  "callback hell").
- **Promise** — \`fs.promises.readFile(path)\`, usually imported as
  \`require("fs/promises")\`. This is the modern, easiest-to-read version.
  A **promise** is just an object that represents "a value that will show
  up later, or an error if something went wrong." Promises pair naturally
  with the \`async\`/\`await\` keywords, so your asynchronous file-reading
  code can look almost as clean as normal step-by-step code.

For new code, reach for \`fs/promises\`. The big win: errors show up in a
plain \`try/catch\` block, instead of you having to remember to check an
\`err\` argument by hand on every single call.

\`\`\`js
const fs = require("fs/promises");

async function loadConfig(path) {
  try {
    const raw = await fs.readFile(path, "utf8"); // "utf8" = read it as text, not raw bytes
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return {}; // missing file → just use defaults
    throw err; // anything else is a real problem — don't hide it
  }
}
\`\`\`

Read that step by step: \`await\` pauses *this function* (not your whole
program) until \`readFile\` finishes, then hands you the file's contents as
a string. If anything goes wrong — the file doesn't exist, you don't have
permission, etc. — control jumps straight to the \`catch\` block instead of
crashing your app.

### Errors carry a \`code\`, so check that instead of guessing from text

When something goes wrong, Node doesn't just say "error" — it gives you a
regular \`Error\` object with an extra \`.code\` property that tells you
exactly what happened:

- \`"ENOENT"\` — the file or folder doesn't exist ("Error, No ENTry").
- \`"EACCES"\` — you don't have permission to access it.
- \`"EEXIST"\` — you tried to create something that's already there.

Always branch on \`err.code\`, never on trying to match pieces of the error
message text — the message is meant for humans to read, the code is meant
for your program to check.

### Reading a whole file vs. reading it in pieces

\`fs.readFile\` is convenient because it hands you the *entire* file's
contents in one go — great for a small config file that's a few kilobytes.
But what if the file is 10 gigabytes? Loading all of that into memory at
once could crash your program, or at least make it painfully slow.

For big files, Node offers \`fs.createReadStream()\`, which reads the file
in small chunks and lets you process each chunk as it arrives — like
reading a book one page at a time instead of trying to memorize it all
before you turn the first page. (The Streams module covers this in
detail.)

**Why this matters:** almost every real app needs to load a config file,
write a log, or save some user data to disk — and \`fs/promises\` combined
with \`try/catch\` and \`err.code\` checks is the pattern you'll reach for
every time you do.
`.trim(),
  codeExamples: [
    {
      title: "Reading with a fallback",
      code: `async function readConfig(path, fallback) {
  try {
    const raw = await fs.readFile(path, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}`,
    },
    {
      title: "Writing and creating directories",
      code: `await fs.mkdir("logs", { recursive: true });
await fs.writeFile("logs/out.txt", "hello\\n", "utf8");
await fs.appendFile("logs/out.txt", "more\\n", "utf8");`,
    },
  ],
  challenge: {
    functionName: "readConfig",
    prompt: `Write an async function readConfig(fakeFs, path, fallback) that
mimics loading a JSON config file with fs/promises: await
fakeFs.readFile(path) to get the raw string, then JSON.parse it and
return the result. If the read rejects (file missing) or the JSON is
malformed, catch the error and return fallback instead — never throw.`,
    starterCode: `async function readConfig(fakeFs, path, fallback) {
  // your code here
}`,
    solutionCode: `async function readConfig(fakeFs, path, fallback) {
  try {
    const raw = await fakeFs.readFile(path);
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}`,
    testCases: [
      {
        name: "parses an existing config file",
        args: () => [makeFakeFs({ "/config.json": '{"debug":true}' }), "/config.json", {}],
        expected: { debug: true },
      },
      {
        name: "falls back when the file is missing",
        args: () => [makeFakeFs({}), "/missing.json", { debug: false }],
        expected: { debug: false },
      },
      {
        name: "falls back on malformed JSON",
        args: () => [makeFakeFs({ "/bad.json": "{not valid" }), "/bad.json", { safe: true }],
        expected: { safe: true },
      },
      {
        name: "returns an array config as-is",
        args: () => [makeFakeFs({ "/list.json": "[1,2,3]" }), "/list.json", []],
        expected: [1, 2, 3],
      },
    ],
  },
};

export default fileSystem;
