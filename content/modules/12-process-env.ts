import type { ModuleContent } from "@/lib/types";

const processEnv: ModuleContent = {
  id: "process-env",
  title: "process & env vars",
  category: "Fundamentals",
  order: 12,
  explanation: `
Imagine you hand a friend a recipe card, but instead of baking it exactly
the same way every time, they can tape a sticky note to the fridge that
says "use 2 cups of sugar instead of 1" — without you rewriting the
recipe. That sticky note is basically what an **environment variable**
is: a setting that lives *outside* your code and can change depending on
where the code runs (your laptop, a teammate's laptop, a production
server).

In Node.js, the object that lets your program read those sticky notes —
and learn other facts about how it's being run — is called \`process\`.

### What is \`process\`?

\`process\` is a **global object**. "Global" means you don't need to
\`require\` or \`import\` it — it's just always there, automatically,
in every Node.js file. Think of it as the dashboard of the currently
running program: it tells you things like "what arguments was I started
with?" and "what folder am I running from?"

### Reading command-line arguments: \`process.argv\`

When you run a script like \`node app.js start --debug\`, Node needs a
way to hand you those extra words (\`start\`, \`--debug\`) inside your
code. That's what \`process.argv\` is — an array of strings.

\`\`\`js
// If you ran: node app.js start --debug
console.log(process.argv);
// [
//   "/usr/local/bin/node",  // [0] path to the node executable
//   "/home/you/app.js",     // [1] path to the script being run
//   "start",                // [2] your first real argument
//   "--debug",              // [3] your second real argument
// ]
\`\`\`

The first two entries are always "plumbing" (which program ran, which
file). **Your** arguments start at index 2 — that's the part you
usually care about.

### Environment variables: \`process.env\`

\`process.env\` is a plain JavaScript object holding all the "sticky
notes" (environment variables) that were set before your program
started — things like which port to listen on, or a secret API key.

\`\`\`js
console.log(process.env.PORT); // "3000" (if PORT was set to 3000)
\`\`\`

Here's the part that trips people up: **every single value in
\`process.env\` is a string, or \`undefined\` if it isn't set — never a
number, never a boolean.** So \`process.env.PORT\` is the *text*
\`"3000"\`, not the number \`3000\`. If you need a number, you must
convert it yourself:

\`\`\`js
const port = Number(process.env.PORT); // now it's really 3000
\`\`\`

And if you need a true/false flag, you have to compare against the exact
string:

\`\`\`js
const isDebug = process.env.DEBUG === "true"; // NOT just "if (process.env.DEBUG)"
\`\`\`

Why does that last comparison matter? Because the string \`"false"\` is
still a non-empty string, and non-empty strings are "truthy" in
JavaScript. So \`if (process.env.DEBUG)\` would be \`true\` even when
someone set \`DEBUG=false\`! Always compare to the exact expected string.

Because a variable might not be set at all, get in the habit of handling
the missing/malformed case on purpose:

\`\`\`js
const port = Number(process.env.PORT) || 3000; // fall back to 3000 if unset or not a number
const isDebug = process.env.DEBUG === "true";  // false unless it's exactly "true"
\`\`\`

One environment variable, \`NODE_ENV\`, is so widely used that it's
become an informal industry convention (Node itself doesn't enforce
anything about it). Libraries and frameworks check
\`process.env.NODE_ENV === "production"\` to decide whether to skip
slow dev-only checks and warnings.

### Where am I running from? \`process.cwd()\` vs \`__dirname\`

These two are easy to mix up because they both answer "where," but they
answer different questions:

- \`process.cwd()\` — the folder you were standing in (in your terminal)
  when you typed \`node ...\`. This is called the **current working
  directory**, and it can change based on how the user launches the
  script.
- \`__dirname\` — the folder where the *script file itself* lives on
  disk. This never changes no matter where you run the command from.

If your code reads a file using a relative path, pick the right one
deliberately — mixing them up is a common source of "works on my
machine" bugs.

### Other handy properties

- \`process.platform\` — the operating system, e.g. \`"darwin"\` (Mac),
  \`"win32"\`, or \`"linux"\`.
- \`process.version\` — the Node.js version running your code, e.g.
  \`"v20.11.0"\`.

### Stopping the program: exit codes

Every process ends with an **exit code** — a number the operating system
uses to tell whether the program succeeded (\`0\`) or failed (anything
else). There are two ways to set it, and they behave very differently:

- \`process.exitCode = 1;\` — sets the code but lets the program keep
  running until it naturally has nothing left to do (no pending timers,
  no open connections). Node then exits on its own with that code. This
  is the **safer** choice, because things like a \`console.log\` that
  hasn't fully written out yet get a chance to finish.
- \`process.exit(1);\` — stops the program **immediately**, right now,
  no matter what else was in progress. This can cut off pending
  output — for example, a log line that hasn't been flushed to the
  terminal yet might get lost.

Rule of thumb: prefer \`process.exitCode = ...\` and let things wind down
naturally. Only reach for \`process.exit()\` when you genuinely need the
program to stop this instant.

### \`global\` vs \`globalThis\`

Just like \`window\` is the "top-level object" in a browser (holding
things like \`window.alert\`), Node.js has its own top-level object
called \`global\`. \`globalThis\` is a newer, standardized name that
means "the top-level object, whatever this environment happens to be" —
it works the same in Node, in browsers, and anywhere else JavaScript
runs. Prefer \`globalThis\` in code that might not always run in Node.

### Why this matters

Almost every real Node app needs configuration that changes between your
laptop and a live server — a database URL, a port number, a feature
flag. \`process.env\` is *the* standard way that configuration reaches
your code, and \`process.argv\` is how command-line tools read what the
user typed. Getting comfortable reading (and safely parsing) both is a
skill you'll use in nearly every script you write.
`.trim(),
  codeExamples: [
    {
      title: "Parsing CLI args and env together",
      code: `const port = Number(process.env.PORT) || 3000;
const [, , command, ...rest] = process.argv;

if (command === "start") {
  console.log(\`starting on port \${port} with args\`, rest);
}`,
    },
    {
      title: "Exiting after cleanup",
      code: `process.on("SIGTERM", async () => {
  await server.close();
  process.exitCode = 0; // let pending I/O flush, then exit naturally
});`,
    },
  ],
  challenge: {
    functionName: "parseEnvFlag",
    prompt: `Write parseEnvFlag(env, key, defaultValue) that reads a boolean-ish
flag out of an env-vars-style object (all values are strings, like
process.env). Return true if env[key] is "true" or "1"; return false if
it's "false" or "0"; otherwise (missing key, or any other value) return
defaultValue.`,
    starterCode: `function parseEnvFlag(env, key, defaultValue) {
  // your code here
}`,
    solutionCode: `function parseEnvFlag(env, key, defaultValue) {
  if (!(key in env)) return defaultValue;
  const raw = env[key];
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return defaultValue;
}`,
    testCases: [
      { name: "\"true\" is truthy", args: () => [{ DEBUG: "true" }, "DEBUG", false], expected: true },
      { name: "\"0\" is falsy", args: () => [{ DEBUG: "0" }, "DEBUG", true], expected: false },
      { name: "missing key returns the default", args: () => [{}, "DEBUG", true], expected: true },
      {
        name: "unrecognized value returns the default",
        args: () => [{ DEBUG: "yes" }, "DEBUG", false],
        expected: false,
      },
      {
        name: "\"1\" is truthy",
        args: () => [{ FEATURE_X: "1" }, "FEATURE_X", false],
        expected: true,
      },
    ],
  },
};

export default processEnv;
