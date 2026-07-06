import type { ModuleContent } from "@/lib/types";

const modulesCjsEsm: ModuleContent = {
  id: "modules-commonjs-esm",
  title: "Modules (CommonJS vs ESM)",
  category: "Fundamentals",
  order: 2,
  explanation: `
Imagine two people writing a shared shopping list, but one of them insists on
reading the *entire* list out loud, start to finish, before adding a single
new item — and the other can glance at just the parts they need while more
items are still being added. That's roughly the difference between Node's two
ways of splitting code into files, called **module systems**. A "module" is
just a fancy word for "a single JS file that can share code with other
files." Node actually supports two competing systems for doing that sharing:
the original one, **CommonJS** (CJS), and the newer JavaScript-standard one,
**ES Modules** (ESM). You'll see both in real codebases, so it's worth
knowing how each one behaves — especially where they surprise you.

### CommonJS: the original, "require it and go" system

CommonJS is what Node has used since the beginning. You pull in another
file with \`require()\`, and you expose things from your own file by
assigning to \`module.exports\`.

\`\`\`js
// math.js
function add(a, b) {
  return a + b;
}
module.exports = { add }; // this is what other files receive

// main.js
const { add } = require("./math"); // reads, runs, and returns math.js's exports
console.log(add(2, 3)); // 5
\`\`\`

A few things worth knowing about how it behaves under the hood:

- **It's synchronous.** \`require()\` doesn't return until the file has been
  fully read, compiled, and run. Nothing else happens while that's going on.
- **It's cached.** The first time you \`require("./math")\`, Node runs the
  file and remembers the result (keyed by the file's resolved path). Every
  later \`require("./math")\` from anywhere in your app just hands back that
  same cached object — the file's code does *not* run again.
- **Some globals are handed to you for free**: \`__dirname\` (the folder the
  current file lives in), \`__filename\` (the full path to the current file),
  plus \`require\` and \`module\` themselves.

### ES Modules: the JavaScript-standard system

ESM is the \`import\`/\`export\` syntax defined by the JavaScript language
itself (not just Node) — the same syntax you may have seen in frontend
frameworks. You turn it on in Node either by adding \`"type": "module"\` to
your \`package.json\`, or by naming the file with a \`.mjs\` extension.

\`\`\`js
// math.mjs
export function add(a, b) {
  return a + b;
}

// main.mjs
import { add } from "./math.mjs";
console.log(add(2, 3)); // 5
\`\`\`

How it differs from CommonJS:

- **Imports/exports must be top-level.** You can't hide an \`import\` inside
  an \`if\` block the way you technically could with \`require()\`. This is
  because ESM is **statically analyzed** — the JS engine scans and maps out
  all the imports/exports *before* running any code, which is also what lets
  tools like bundlers optimize your code more aggressively. (If you truly
  need to load a module conditionally, there's an async \`import()\`
  function for that.)
- **No \`__dirname\`, \`__filename\`, or \`require\` by default.** If you need
  them, you rebuild them yourself from \`import.meta.url\`, a built-in value
  that tells you the current file's own URL.
- **Named exports are "live bindings."** This is a subtle but real
  difference: if module A exports a variable and later changes its value,
  every file that imported it sees the *updated* value automatically — the
  import isn't a one-time snapshot, it's a live link back to the original.

\`\`\`js
// counter.mjs
export let count = 0;
export function increment() { count++; }

// main.mjs
import { count, increment } from "./counter.mjs";
increment();
console.log(count); // 1 — the import "sees" the change, not a stale copy
\`\`\`

### The interop gotcha: mixing the two systems

Because both systems exist in the wild, you'll sometimes need CJS code to
use an ESM module, or vice versa. Node and build tools bridge the gap with a
convention, but it trips people up constantly:

When Node's ESM \`import\` loads a CommonJS file, it treats that file's
entire \`module.exports\` object as the **default export**. Separately, many
bundlers (tools that transpile ESM down to CommonJS, like Babel or webpack)
do the mirror-image thing: they take an ESM module's \`export default\` and
tuck it away on a \`.default\` property of the object \`require()\` gets back,
rather than handing it back directly.

\`\`\`js
// esm-module.mjs
export default function greet() { return "hi"; }

// commonjs-consumer.js
const mod = require("./esm-module.mjs"); // if the interop shims it this way:
mod.default(); // "hi" — note it's mod.default(), not mod() directly
\`\`\`

This is exactly why you'll spot \`require("some-package").default\`
scattered through real-world code — it's not a mistake, it's the seam
between the two module systems showing through.

### Why this matters

You don't get to choose module systems in a vacuum — the file extension,
your \`package.json\`, and the packages you depend on all decide it for you.
Recognizing whether a file is CJS or ESM (and knowing that caching and live
bindings behave differently between them) will save you real debugging time
the first time an import doesn't behave the way you expect.
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
        args: () => [{ default: 42, __esModule: true }],
        expected: 42,
      },
      {
        name: "returns object with no default export",
        args: () => [{ foo: "bar" }],
        expected: { foo: "bar" },
      },
      {
        name: "unwraps a falsy default export",
        args: () => [{ default: 0 }],
        expected: 0,
      },
      {
        name: "unwraps a null default export",
        args: () => [{ default: null }],
        expected: null,
      },
      {
        name: "unwraps a function-shaped default",
        args: () => [{ default: "greet-fn-placeholder" }],
        expected: "greet-fn-placeholder",
      },
    ],
  },
};

export default modulesCjsEsm;
