import type { ModuleContent } from "@/lib/types";

const jsTypesCoercionModule: ModuleContent = {
  id: "js-types-coercion",
  title: "Types & coercion",
  category: "Language Basics",
  order: 2,
  explanation: `
### The problem: JS converts types even when you didn't ask it to

You write \`if (someValue)\` expecting a clean true/false check, and JS
happily accepts a string, a number, an array, \`null\` — anything — and
silently decides for itself whether that counts as "yes" or "no." You
compare two things with \`==\` and get a result that makes no sense until
you remember JS quietly converted one side to match the other. This
silent, automatic converting-between-types is called **coercion**, and
it's one of the most common sources of "wait, why did that happen?"
bugs in JavaScript. The fix isn't to memorize every edge case — it's to
learn the handful of rules that actually come up, so the behavior stops
being a surprise.

### The primitive types

JavaScript has a small set of **primitive types** (plain values that
aren't objects):

- \`number\` — e.g. \`42\`, \`3.14\`, \`NaN\` (yes, "Not a Number" is itself a
  number type)
- \`string\` — e.g. \`"hello"\`
- \`boolean\` — \`true\` or \`false\`
- \`undefined\` — a variable that's been declared but never given a value
- \`null\` — an intentional "no value," set by you
- \`symbol\` and \`bigint\` — less common, used for unique identifiers and
  arbitrarily large integers respectively

Everything else — objects, arrays, functions, dates — is an **object**
under the hood, even though arrays and functions feel like their own
thing.

### \`typeof\`: mostly reliable, with one famous quirk

The \`typeof\` operator tells you a value's type as a string, e.g.
\`typeof 42\` is \`"number"\` and \`typeof "hi"\` is \`"string"\`. It's handy,
but it has a well-known historical wart:

\`\`\`js
typeof null; // "object" — not "null"!
\`\`\`

This is a decades-old bug baked into the language that can never be
fixed without breaking the web, so it just... stays. \`null\` is not an
object conceptually (it's its own primitive type), but \`typeof\` will
tell you otherwise. If you need to check specifically for \`null\`, use
\`value === null\` instead of trusting \`typeof\`.

A couple of other quirks worth knowing: \`typeof undeclaredVariable\` is
\`"undefined"\` (it doesn't throw), and \`typeof function(){}\` is
\`"function"\` even though functions are technically objects too.

### Truthy and falsy: the rule behind every \`if\`

Whenever a value is used somewhere JS expects a boolean — an \`if\`
condition, a \`while\` loop, the \`&&\`/\`||\` operators — JS coerces it to
\`true\` or \`false\` using a fixed rule. A value that coerces to \`false\` is
called **falsy**; everything else is **truthy**.

There are exactly **six falsy values** in JavaScript, and this is the
complete list — nothing else is falsy:

- \`false\`
- \`0\` (and \`-0\`)
- \`""\` (the empty string)
- \`null\`
- \`undefined\`
- \`NaN\`

That's it. Every other value — no matter how "empty" or "zero-ish" it
feels — is truthy. The classic surprises:

- \`[]\` (an empty array) is **truthy**. It's an object, and all objects
  are truthy, even ones with nothing in them.
- \`{}\` (an empty object) is **truthy**, for the same reason.
- \`"0"\` (the string containing a zero character) is **truthy** — it's a
  non-empty string, and only the *empty* string \`""\` is falsy.
- \`" "\` (a string with just a space) is **truthy** too — it has a
  character in it, so it's not empty.

\`\`\`js
if ([]) {
  console.log("this runs — [] is truthy!");
}
if ("0") {
  console.log("this runs too — \\"0\\" is a non-empty string");
}
\`\`\`

### Implicit coercion in \`==\` and \`+\`

JavaScript has two equality operators: \`===\` (**strict equality**, no
type conversion — the types must already match) and \`==\` (**loose
equality**, which converts one or both sides to a common type before
comparing). That conversion is where \`==\` gets its bad reputation: it
follows a set of conversion rules that are easy to forget and often
produce results that don't match intuition (for example, \`"" == 0\` is
\`true\`, and \`null == undefined\` is \`true\` but \`null == 0\` is \`false\`).
Rather than memorize that whole table, the widely-used rule of thumb is
simple: **default to \`===\`**, and only reach for \`==\` in the rare cases
where you deliberately want the conversion.

The \`+\` operator coerces too, but in the opposite direction from what
you might expect when a string is involved — it converts numbers to
strings and concatenates, rather than converting strings to numbers:

\`\`\`js
1 + "1"; // "11" — the number 1 is coerced to a string
1 + 1; // 2 — both numbers, normal addition
"5" - 1; // 4 — minus has no string meaning, so "5" is coerced to a number instead
\`\`\`

### Why this matters

Once you know the exact six falsy values and can spot the common traps
— \`[]\`, \`{}\`, \`"0"\`, and \`" "\` are all truthy — you can look at almost
any value and predict, without running the code, exactly how JS will
treat it in a boolean context. That's precisely the skill the challenge
below is testing: converting a mixed bag of values to their real
truthiness, no guessing required.
`.trim(),
  codeExamples: [
    {
      title: "typeof surprises",
      code: `typeof null;        // "object" — a long-standing quirk, not a real object
typeof undefined;    // "undefined"
typeof NaN;          // "number" — NaN is still of type "number"
typeof [1, 2, 3];    // "object" — arrays are objects
typeof function () {}; // "function"`,
    },
    {
      title: "== vs === coercion",
      code: `0 == false;   // true  — == coerces false to 0 before comparing
0 === false;  // false — === requires the same type, no conversion

"" == 0;      // true  — == coerces "" to 0
"" === 0;     // false

null == undefined;  // true  — == treats these as equal
null === undefined; // false — different types, no coercion`,
    },
  ],
  challenge: {
    functionName: "toBooleans",
    prompt: `Write toBooleans(values) that converts every element of the values array
to its boolean truthiness (the same result JS uses in an if-condition) and
returns the array of booleans. Some of the inputs are intentionally tricky —
think carefully about which values are actually falsy in JS (there are only
six: false, 0, "", null, undefined, and NaN — everything else, including
empty arrays and objects, is truthy).`,
    starterCode: `function toBooleans(values) {
  // your code here
}`,
    solutionCode: `function toBooleans(values) {
  return values.map((value) => Boolean(value));
}`,
    testCases: [
      {
        name: "handles the six falsy values plus a few truthy ones",
        args: () => [[0, 1, "", "0", null, undefined, NaN, [], {}]],
        expected: [false, true, false, true, false, false, false, true, true],
      },
      { name: "handles an empty array", args: () => [[]], expected: [] },
      {
        name: "handles negative numbers as truthy",
        args: () => [[-1, -0.5]],
        expected: [true, true],
      },
      {
        name: "handles whitespace string as truthy",
        args: () => [[" "]],
        expected: [true],
      },
    ],
  },
};

export default jsTypesCoercionModule;
