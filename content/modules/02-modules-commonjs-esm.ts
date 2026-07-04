import type { ModuleContent } from "@/lib/types";

const modulesCjsEsm: ModuleContent = {
  id: "modules-commonjs-esm",
  title: "Modules (CommonJS vs ESM)",
  category: "Fundamentals",
  order: 2,
  explanation: `
Node supports two module systems: **CommonJS** (CJS, the original) and
**ES Modules** (ESM, the JS standard). They differ in more than syntax.

### CommonJS (\`require\`)

- Synchronous loading — \`require()\` blocks until the module is read,
  compiled, and executed.
- \`module.exports\` / \`exports\` object holds what's exported.
- Modules are **cached** by resolved file path — the second \`require\` of
  the same file returns the cached \`module.exports\`, the file is not
  re-executed.
- Has \`__dirname\`, \`__filename\`, \`require\`, \`module\` available
  automatically.

### ES Modules (\`import\`/\`export\`)

- Loaded asynchronously and **statically analyzed** before execution —
  imports/exports must be top-level (no conditional \`import\` statements,
  though the async \`import()\` function exists for dynamic loading).
- Enabled via \`"type": "module"\` in package.json, or a \`.mjs\` extension.
- No \`__dirname\`/\`__filename\`/\`require\` by default — reconstruct them
  from \`import.meta.url\` if needed.
- Named exports are **live bindings** — if the exporting module changes an
  exported variable, importers see the new value.

### The interop gotcha

When Node loads a CJS module from ESM \`import\`, the entire
\`module.exports\` becomes the **default export**. When bundlers/Babel let
CJS \`require()\` a transpiled ESM module, the ESM module's default export
often ends up on a \`.default\` property instead of being the object
itself — this is exactly why so much code has the
\`require('x').default\` pattern.

\`\`\`js
// esm-module.mjs
export default function greet() { return "hi"; }

// commonjs-consumer.js
const mod = require("./esm-module.mjs"); // if interop shims it:
mod.default(); // "hi" — not mod() directly
\`\`\`
`.trim(),
  codeExamples: [
    {
      title: "CommonJS caching",
      code: `// counter.js
let count = 0;
module.exports = { increment: () => ++count };

// main.js
const a = require("./counter");
const b = require("./counter"); // same cached object as 'a'
a.increment();
console.log(b.increment()); // 2 — they share state`,
    },
    {
      title: "ESM live bindings",
      code: `// state.mjs
export let value = 1;
export function bump() { value++; }

// main.mjs
import { value, bump } from "./state.mjs";
bump();
console.log(value); // 2 — the binding tracks the live export`,
    },
  ],
  challenge: {
    functionName: "resolveDefaultExport",
    prompt: `Write a function resolveDefaultExport(mod) that mimics the CJS/ESM
interop rule: if the given module object has an own property named
"default", return that property's value (this is what require() gives you
back for a transpiled/ESM module). Otherwise, the module has no default
export shim, so return the module object itself unchanged.`,
    starterCode: `function resolveDefaultExport(mod) {
  // your code here
}`,
    solutionCode: `function resolveDefaultExport(mod) {
  if (Object.prototype.hasOwnProperty.call(mod, "default")) {
    return mod.default;
  }
  return mod;
}`,
    testCases: [
      {
        name: "unwraps a default export",
        args: [{ default: 42, __esModule: true }],
        expected: 42,
      },
      {
        name: "returns object with no default export",
        args: [{ foo: "bar" }],
        expected: { foo: "bar" },
      },
      {
        name: "unwraps a falsy default export",
        args: [{ default: 0 }],
        expected: 0,
      },
      {
        name: "unwraps a null default export",
        args: [{ default: null }],
        expected: null,
      },
      {
        name: "unwraps a function-shaped default",
        args: [{ default: "greet-fn-placeholder" }],
        expected: "greet-fn-placeholder",
      },
    ],
  },
};

export default modulesCjsEsm;
