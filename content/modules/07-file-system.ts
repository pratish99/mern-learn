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
Node's \`fs\` module has three flavors of every operation:

- **Sync** — \`fs.readFileSync()\` — blocks the event loop until done.
- **Callback** — \`fs.readFile(path, cb)\` — the original async API.
- **Promise** — \`fs.promises.readFile(path)\` (or \`require("fs/promises")\`)
  — the modern way, pairs naturally with \`async\`/\`await\`.

Prefer \`fs/promises\` in new code — it composes with \`try/catch\` instead of
manually checking an \`err\` parameter on every call.

\`\`\`js
const fs = require("fs/promises");

async function loadConfig(path) {
  try {
    const raw = await fs.readFile(path, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return {}; // missing file → defaults
    throw err; // anything else is a real problem — don't swallow it
  }
}
\`\`\`

### Errors carry a \`code\`

Node's \`fs\` errors are regular \`Error\` objects with a \`.code\` property —
\`"ENOENT"\` (not found), \`"EACCES"\` (permission denied), \`"EEXIST"\`
(already exists), etc. Branch on \`.code\`, not on parsing the message
string.

### Streams vs. whole-file reads

\`readFile\` loads the entire file into memory — fine for small config
files, wasteful (or impossible) for multi-gigabyte files. For those, use
\`fs.createReadStream()\` (see the Streams module) so you process data
incrementally instead.
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
