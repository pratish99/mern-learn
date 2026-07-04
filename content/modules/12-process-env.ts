import type { ModuleContent } from "@/lib/types";

const processEnv: ModuleContent = {
  id: "process-env",
  title: "process & env vars",
  category: "Fundamentals",
  order: 12,
  explanation: `
\`process\` is a global object (no \`require\` needed) describing the
current Node process.

### Common properties

- \`process.argv\` — \`[execPath, scriptPath, ...args]\`; your CLI args
  start at index 2.
- \`process.env\` — a plain object of environment variables. **Values are
  always strings** — \`process.env.PORT\` is \`"3000"\`, not \`3000\`; parse
  it yourself (\`Number(process.env.PORT)\`).
- \`process.cwd()\` — current working directory (differs from
  \`__dirname\`, which is the *script's* directory).
- \`process.platform\`, \`process.version\` — OS and Node version info.

### Exiting

- Set \`process.exitCode = 1\` and let the event loop drain naturally —
  the process exits with that code once there's nothing left to do. This
  is the safer choice; pending writes (like a log line to stdout) get a
  chance to flush.
- \`process.exit(1)\` exits **immediately**, which can truncate pending
  async I/O (e.g., a \`console.log\` that hasn't flushed to a piped
  stdout yet). Reserve it for cases where you genuinely need to stop now.

### Reading env vars safely

Since everything in \`process.env\` is a string or \`undefined\`, always
handle the missing/malformed case explicitly:

\`\`\`js
const port = Number(process.env.PORT) || 3000;
const isDebug = process.env.DEBUG === "true";
\`\`\`

\`NODE_ENV\` is a long-standing (not built-in-enforced) convention —
frameworks and libraries check \`process.env.NODE_ENV === "production"\`
to disable dev-only checks/warnings.

### \`global\` vs \`globalThis\`

\`global\` is Node's global object (like \`window\` in browsers).
\`globalThis\` is the standard, environment-agnostic way to reference it —
prefer \`globalThis\` in code that might run in multiple JS environments.
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
