import type { ModuleContent } from "@/lib/types";

const testingBasics: ModuleContent = {
  id: "testing-basics",
  title: "Testing basics (node:test)",
  category: "Reliability & Tooling",
  order: 15,
  explanation: `
Imagine you wrote a calculator function and you want to be *sure*
\`sum(2, 3)\` always gives \`5\` — not just today, but even after you
refactor the code next month. You could open the app and click around
by hand every time, but that's slow and you'll forget to check the
edge cases. **Testing** means writing small scripts that call your
code and check the result automatically, so a computer does that
checking for you, instantly, every single time.

The good news: since Node 18, Node ships a test runner built in. You
don't need to install any extra package to write and run basic tests.

### Your first test

A **test** is just a block of code with a description and some
checks inside it:

\`\`\`js
// sum.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const { sum } = require("./sum");

test("sum adds two numbers", () => {
  assert.strictEqual(sum(2, 3), 5);
});

test("sum handles negatives", async (t) => {
  await t.test("negative + positive", () => {
    assert.strictEqual(sum(-1, 5), 4);
  });
});
\`\`\`

Two new words here:

- **\`test(...)\`** registers one test case. The first argument is a
  human-readable label; the second is a function containing the
  actual check.
- **\`assert\`** is the module that does the checking. \`assert.strictEqual(a, b)\`
  says "these two values must be exactly equal — if not, blow up
  with an error."

Run this file with \`node --test\` from your terminal. Node
automatically finds any file named like \`*.test.js\` in your project,
runs every \`test(...)\` inside it, and prints a report saying which
ones passed and which failed.

### \`assert\` vs \`assert/strict\`: pick the strict one

Node actually has two flavors of the assert module: \`node:assert\` and
\`node:assert/strict\`. Always reach for \`node:assert/strict\`.

Here's why. Plain \`assert\` uses JavaScript's loose \`==\` comparison
for some checks — the same operator that thinks \`"1" == 1\` is true.
That means a bug could quietly slip through and your test would still
report "passed" even though the values weren't really the same. The
\`strict\` version uses \`===\` (and does a deep comparison for objects
and arrays), which matches what you actually mean 99% of the time:
"are these *really* the same value?"

### Grouping tests so they're easy to read

When you have many related tests, reading a flat list of \`test(...)\`
calls gets messy. \`describe\` and \`it\` (also built into \`node:test\`)
let you group tests under a shared label, similar to a folder
containing related files:

\`\`\`js
describe("Stack", () => {
  it("starts empty", () => { /* check a new Stack has length 0 */ });
  it("pops in LIFO order", () => { /* check last-in is first-out */ });
});
\`\`\`

\`describe("Stack", ...)\` is just a labeled container; \`it(...)\` is the
same idea as \`test(...)\`, just named to read like a sentence: "it
starts empty."

### Mocking: faking the parts you don't control

Sometimes the code you're testing depends on something slow or
unpredictable — a network request, the current time, or a
\`setTimeout\`. **Mocking** means temporarily swapping that real thing
for a fake, controllable stand-in, so your test stays fast and
predictable instead of actually waiting or hitting the network.

\`node:test\` includes a built-in mocking helper, \`t.mock\`, so you don't
need a separate library for simple cases:

\`\`\`js
test("uses a fake timer", (t) => {
  // Replace the real setTimeout with a fake one we can fast-forward.
  t.mock.timers.enable({ apis: ["setTimeout"] });
  // ... code that schedules a setTimeout ...
  t.mock.timers.tick(1000); // instantly "fast forward" 1000ms
});
\`\`\`

Without this, a test that waits on a real 1-second timer would
actually take a second to run. Multiply that by hundreds of tests and
your test suite becomes painfully slow.

### What's really happening under the hood

Strip away the test runner, the pretty pass/fail report, and the
mocking helpers, and every assertion boils down to one simple idea:

> Compare two values. If they don't match, throw an error that
> explains what you expected versus what you actually got.

That's it. Everything else — \`describe\`/\`it\` grouping, colorful
terminal output, mocking timers — is just tooling built around that
one core primitive to make writing and reading tests more pleasant.

**Why this matters:** every time you write a function, you can write
a short test file right next to it that calls the function with a
few inputs and asserts the outputs are correct. Run \`node --test\`
before you commit, and you'll catch broken code in seconds instead of
discovering it in production.
`.trim(),
  codeExamples: [
    {
      title: "A minimal test file",
      code: `const test = require("node:test");
const assert = require("node:assert/strict");

test("escapeHtml escapes angle brackets", () => {
  assert.strictEqual(escapeHtml("<b>"), "&lt;b&gt;");
});`,
    },
    {
      title: "What assert.strictEqual does internally (roughly)",
      code: `function strictEqual(actual, expected) {
  if (actual !== expected) {
    throw new Error(\`Expected \${expected} but got \${actual}\`);
  }
}`,
    },
  ],
  challenge: {
    functionName: "assertEqual",
    prompt: `Write assertEqual(actual, expected) — a minimal version of what
assert.strictEqual does. Compare the two values (using JSON.stringify to
compare arrays/objects by content, and direct comparison for primitives).
If they match, return true. If they don't, throw an Error whose message
contains the text "Expected" followed by the expected value.`,
    starterCode: `function assertEqual(actual, expected) {
  // your code here
}`,
    solutionCode: `function assertEqual(actual, expected) {
  const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
  if (!isEqual) {
    throw new Error(\`Expected \${JSON.stringify(expected)} but got \${JSON.stringify(actual)}\`);
  }
  return true;
}`,
    testCases: [
      { name: "passes for equal numbers", args: () => [2 + 2, 4], expected: true },
      { name: "passes for equal strings", args: () => ["a", "a"], expected: true },
      { name: "passes for deeply-equal objects", args: () => [{ a: 1 }, { a: 1 }], expected: true },
      {
        name: "throws a descriptive error for a mismatch",
        args: () => [1, 2],
        expectedError: "Expected",
      },
      {
        name: "throws for arrays of different length",
        args: () => [[1, 2], [1, 2, 3]],
        expectedError: "Expected",
      },
    ],
  },
};

export default testingBasics;
