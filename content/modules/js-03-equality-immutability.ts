import type { ModuleContent } from "@/lib/types";

const jsEqualityImmutabilityModule: ModuleContent = {
  id: "js-equality-immutability",
  title: "Equality & immutability",
  category: "Language Basics",
  order: 3,
  explanation: `
### The problem: JS has more than one notion of "equal"

Here's a classic surprise: \`NaN === NaN\` is \`false\`. Not "sometimes
false" or "false in edge cases" — always false, on purpose, per the
language spec. If you've ever written a bug where a value that was
clearly "not a number" refused to compare equal to itself, this is why.
JavaScript actually has *four* different equality algorithms, and
picking the wrong one causes real, if usually small, bugs. This module
untangles them.

### \`==\` vs \`===\`

\`==\` ("loose equality") converts its operands to a common type before
comparing, using a set of coercion rules that are easy to get wrong —
\`"" == 0\` is \`true\`, \`null == undefined\` is \`true\`, \`"0" == false\` is
\`true\`. \`===\` ("strict equality") never coerces: the types must already
match, or the result is immediately \`false\`. Because loose equality's
rules are hard to hold in your head, the near-universal convention is:
default to \`===\`, and only reach for \`==\` if you have a specific,
well-understood reason to want coercion (comparing against \`null\` to
catch both \`null\` and \`undefined\` is about the only common one).

### The NaN quirk

\`NaN\` stands for "Not a Number," and by spec, \`NaN\` is never equal to
anything — including itself — under either \`==\` or \`===\`. This is why
you can't write \`if (x === NaN)\` to check for it; it will never be
true. Instead, use \`Number.isNaN(x)\`, which asks "is this specific value
NaN?" directly instead of trying to compare it.

### \`Object.is\` (SameValue) vs SameValueZero

\`Object.is(a, b)\` implements an algorithm called **SameValue**. It's
almost identical to \`===\`, with two deliberate differences: it
considers \`NaN\` equal to itself (\`Object.is(NaN, NaN)\` is \`true\`), and
it treats \`-0\` and \`+0\` as *different* values (\`Object.is(-0, 0)\` is
\`false\`, even though \`-0 === 0\` is \`true\`).

There's a fourth algorithm, **SameValueZero**, which JS uses internally
for things like \`Set\`, \`Map\` keys, and \`Array.prototype.includes()\`.
SameValueZero is identical to SameValue/\`Object.is\` in every way
*except* one: it treats \`-0\` and \`+0\` as **equal**, matching \`===\`'s
behavior on that point. So to be precise:

- \`===\`: \`NaN\` is never equal to itself. \`-0 === +0\` is \`true\`.
- SameValue (\`Object.is\`): \`NaN\` **is** equal to itself. \`-0\` and \`+0\`
  are **different**.
- SameValueZero (\`Set\`/\`Map\`/\`includes\`): \`NaN\` **is** equal to itself.
  \`-0\` and \`+0\` are **equal** (same as \`===\` on this specific point).

In other words, SameValueZero is "\`===\`, but with \`NaN\` fixed to equal
itself" — nothing more, nothing less. That's exactly why
\`[NaN].includes(NaN)\` returns \`true\` even though \`NaN === NaN\` is
\`false\`: \`includes\` uses SameValueZero, not \`===\`.

### Immutability basics: reference vs value semantics

Primitives (numbers, strings, booleans, \`null\`, \`undefined\`, symbols,
bigints) are compared and copied **by value** — two separate variables
holding \`5\` are just... \`5\`, with no relationship to each other.
Objects and arrays, though, are compared and copied **by reference**: a
variable holding an object actually holds a pointer to it in memory, so
copying the variable just copies the pointer, not the object itself.

\`\`\`js
const a = { count: 1 };
const b = a; // b points at the same object as a
b.count = 2;
console.log(a.count); // 2 — mutating b also "mutated" a, because they're the same object
console.log(a === b); // true — same reference
\`\`\`

### \`Object.freeze\` — and its shallow trap

\`Object.freeze(obj)\` locks \`obj\` so its existing properties can't be
reassigned, added, or removed (silently failing outside strict mode).
This sounds like "deep immutability," but it isn't: freezing only
affects the object's own top-level properties. Any object *nested*
inside it is completely unaffected and still fully mutable — a very
common trap.

### Copying instead of mutating: the spread pattern

Rather than mutating an object or array in place (which anyone else
holding a reference to it will also see), the idiomatic pattern is to
build a *new* one with the change applied, using spread syntax:
\`{ ...obj, key: newValue }\` for objects, or \`[...arr, newItem]\` for
arrays. This leaves the original untouched and gives you a fresh
reference with the update — the foundation of how state updates work
in frameworks like React.

### Why this matters

Equality bugs hide in the gap between "what I assumed \`===\` does" and
what it actually does — especially around \`NaN\`. The challenge below
asks you to implement SameValueZero yourself: start from \`===\`, then
carve out the one case where it disagrees with what \`Set\`/\`Map\`/
\`includes\` actually do — treating \`NaN\` as equal to itself. Reasoning
through that one exception, instead of reaching for \`Object.is\` as a
shortcut, is the whole point.
`.trim(),
  codeExamples: [
    {
      title: "===, Object.is, and SameValueZero disagree on NaN and -0",
      code: `console.log(NaN === NaN);        // false
console.log(Object.is(NaN, NaN)); // true  (SameValue)
console.log([NaN].includes(NaN)); // true  (SameValueZero, used internally)

console.log(-0 === 0);            // true
console.log(Object.is(-0, 0));    // false (SameValue distinguishes -0/+0)
console.log([-0].includes(0));    // true  (SameValueZero treats -0/+0 as equal)`,
    },
    {
      title: "Object.freeze only protects the top level",
      code: `const config = Object.freeze({
  name: "app",
  limits: { maxRetries: 3 },
});

config.name = "renamed";        // silently ignored, still "app"
config.limits.maxRetries = 999; // NOT ignored! nested object is still mutable
console.log(config.limits.maxRetries); // 999

// To update safely without mutating, copy instead:
const updated = { ...config, name: "renamed" };`,
    },
  ],
  challenge: {
    functionName: "isSameValueZero",
    prompt: `Write isSameValueZero(a, b) that implements the "SameValueZero" equality
algorithm — the one JS itself uses internally for Set, Map, and
Array.prototype.includes(). It behaves like === with one difference: it
considers NaN equal to itself (=== says NaN === NaN is false). Do not use
Object.is or === directly as a shortcut for the whole thing — reason through
the NaN case explicitly. Return a boolean.`,
    starterCode: `function isSameValueZero(a, b) {
  // your code here
}`,
    solutionCode: `function isSameValueZero(a, b) {
  if (typeof a === "number" && typeof b === "number" && Number.isNaN(a) && Number.isNaN(b)) {
    return true;
  }
  return a === b;
}`,
    testCases: [
      { name: "NaN is considered equal to itself", args: () => [NaN, NaN], expected: true },
      { name: "regular numbers compare normally", args: () => [1, 2], expected: false },
      { name: "equal numbers", args: () => [5, 5], expected: true },
      { name: "-0 and +0 are equal (same as ===)", args: () => [0, -0], expected: true },
      { name: "NaN is not equal to a real number", args: () => [NaN, 1], expected: false },
      { name: "strings compare normally", args: () => ["a", "a"], expected: true },
    ],
  },
};

export default jsEqualityImmutabilityModule;
