import type { ModuleContent } from "@/lib/types";

const testingBasics: ModuleContent = {
  id: "testing-basics",
  title: "Testing basics (node:test)",
  category: "Reliability & Tooling",
  order: 15,
  explanation: `
Since Node 18, a test runner ships in core — no dependency needed for
basic unit tests.

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

Run with \`node --test\` — it discovers \`*.test.js\` (and similar)
patterns automatically and prints a TAP-based report.

### \`assert\` vs \`assert/strict\`

Prefer \`node:assert/strict\` — its equality checks use \`===\`/deep-strict
comparison, matching what you almost always want. The non-strict
\`assert\` module uses \`==\` for some checks, a frequent source of
false-positive passes.

### Structuring tests

\`describe\`/\`it\` (also available from \`node:test\`) group related tests
for readable output:

\`\`\`js
describe("Stack", () => {
  it("starts empty", () => { /* ... */ });
  it("pops in LIFO order", () => { /* ... */ });
});
\`\`\`

### Mocking

\`node:test\`'s built-in \`t.mock\` can stub functions and timers without a
separate mocking library:

\`\`\`js
test("uses a fake timer", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  // ...
  t.mock.timers.tick(1000);
});
\`\`\`

### What an assertion actually does

At its core, an assertion is just: compare two values, and throw a
descriptive error if they don't match. Everything else (test runners,
reporters, mocking) is built around that one primitive.
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
