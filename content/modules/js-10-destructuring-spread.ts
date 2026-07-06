import type { ModuleContent } from "@/lib/types";

const destructuringSpreadModule: ModuleContent = {
  id: "js-destructuring-spread",
  title: "Destructuring & spread/rest",
  category: "Data Structures & Iteration",
  order: 10,
  explanation: `
### The problem: too many \`obj.x\`, \`obj.y\` lines

Before destructuring existed, pulling a few values out of an object or
array meant writing one repetitive line per value:

\`\`\`js
const name = user.name;
const age = user.age;
\`\`\`

**Destructuring** is a shorthand for exactly that: it lets you unpack
several values out of an object or array in a single declarative line.
**Spread** and **rest** (they share the \`...\` syntax but do opposite
jobs) are its mirror-image twins — instead of *pulling values out*, they
handle *pulling remaining values together* or *pouring values back in*.
Once you're comfortable with all of these, you'll reach for them
constantly — they're everywhere in modern JS and React code.

### Object destructuring

Object destructuring pulls named properties out of an object into their
own variables, by matching variable names to property names:

\`\`\`js
const user = { name: "Ada", age: 30 };
const { name, age } = user;
// name === "Ada", age === 30
\`\`\`

### Array destructuring

Array destructuring works the same way but matches by **position**,
not by name — the first variable gets index 0, the second gets index 1,
and so on:

\`\`\`js
const [first, second] = [10, 20, 30];
// first === 10, second === 20 (30 is simply not captured)
\`\`\`

You can skip elements you don't need by leaving a gap between commas:

\`\`\`js
const [, second, , fourth] = ["a", "b", "c", "d"];
// second === "b", fourth === "d"
\`\`\`

### Renaming while destructuring

Sometimes the property name on the object isn't the variable name you
want in your code (maybe it clashes with something already declared, or
it's just not descriptive enough). Object destructuring lets you rename
on the spot with a colon — \`{ propertyName: newLocalName }\`:

\`\`\`js
const response = { id: 42 };
const { id: userId } = response;
// userId === 42 — there is no variable called "id" here at all
\`\`\`

(Array destructuring has no equivalent "rename" syntax, since there are
no property names to rename — you just pick whatever variable name you
want for each position.)

### Default values

Both object and array destructuring let you supply a fallback with
\`= someDefault\`. This is the detail people most often get wrong, so be
precise about when it kicks in: **a default is used only when the
extracted value is \`undefined\`** — whether that's because the property
is missing entirely, or because it's present but explicitly set to
\`undefined\`.

\`\`\`js
const { age = 18 } = {};              // age === 18 (key missing)
const { age = 18 } = { age: undefined }; // age === 18 (explicitly undefined)
const { age = 18 } = { age: 0 };      // age === 0  — 0 is NOT undefined!
const { age = 18 } = { age: null };   // age === null — null is NOT undefined either!
\`\`\`

A default does **not** trigger for other falsy values like \`0\`, \`""\`,
\`false\`, or \`null\` — only for \`undefined\`. This trips people up because
\`0\` and \`""\` "feel" empty, but destructuring defaults don't care about
falsiness, only about "was there actually a value here or not."

### Rest syntax: sweeping up "everything else"

Add \`...someName\` as the *last* item in a destructuring pattern to
collect whatever wasn't already pulled out by name (for objects) or by
position (for arrays) into a new plain object or array:

\`\`\`js
const { name, ...rest } = { name: "Ada", age: 30, active: true };
// name === "Ada", rest === { age: 30, active: true }

const [firstItem, ...others] = [1, 2, 3, 4];
// firstItem === 1, others === [2, 3, 4]
\`\`\`

This is called **rest** because it gathers "the rest of" the
properties/elements that weren't explicitly named. \`Object.keys(rest)\`
gives you those leftover property names, in the order they originally
appeared.

### Spread: the reverse operation

Where rest *collects* values into a new array/object, **spread** does
the opposite: it *expands* an existing array or object into individual
elements or properties, right where you use \`...\` — for example, when
building a new array/object literal:

\`\`\`js
const base = { name: "Ada", age: 30 };
const withEmail = { ...base, email: "ada@example.com" };
// withEmail === { name: "Ada", age: 30, email: "ada@example.com" }
// base itself is untouched — a new object was created
\`\`\`

Spread is how you copy or merge arrays/objects without mutating the
originals: \`{ ...objA, ...objB }\` merges two objects (with \`objB\`'s
properties overwriting \`objA\`'s on any name clash), and
\`[...arrA, ...arrB]\` concatenates two arrays into a new one.

### Why this matters

The challenge below — \`extractUserSummary\` — asks you to combine three
of these ideas in a single destructuring statement: pull \`name\` out
directly, give \`age\` a default of \`18\` for when it's missing, and sweep
every other property into a \`rest\` object with \`...rest\`, then read its
keys with \`Object.keys(rest)\`. Pay close attention to the "age: 0" test
case — it exists specifically to check that your default only fires on
\`undefined\`, not on any falsy value.
`.trim(),
  codeExamples: [
    {
      title: "Array destructuring with a default and a skipped element",
      code: `const [, second = "fallback", third] = ["a", undefined, "c"];
// second === "fallback" (the array literally has undefined at index 1)
// third === "c"
// index 0 was skipped entirely via the leading comma`,
    },
    {
      title: "Spread for merging objects (rightmost wins on conflicts)",
      code: `const defaults = { theme: "light", fontSize: 14 };
const overrides = { fontSize: 18 };

const settings = { ...defaults, ...overrides };
// settings === { theme: "light", fontSize: 18 }
// defaults and overrides are both left unmodified`,
    },
  ],
  challenge: {
    functionName: "extractUserSummary",
    prompt: `Write extractUserSummary(user) that takes a user object and, using object
destructuring in one step, pulls out "name" directly, pulls out "age" with a
default of 18 (in case it's missing), and collects every OTHER property into a
rest object. Return { name, age, extraKeys: Object.keys(rest) } — extraKeys
should list the property names that weren't name/age, in their original
order.`,
    starterCode: `function extractUserSummary(user) {
  // your code here
}`,
    solutionCode: `function extractUserSummary(user) {
  const { name, age = 18, ...rest } = user;
  return { name, age, extraKeys: Object.keys(rest) };
}`,
    testCases: [
      {
        name: "collects extra keys and keeps the given age",
        args: () => [{ name: "Ada", age: 30, email: "ada@example.com", active: true }],
        expected: { name: "Ada", age: 30, extraKeys: ["email", "active"] },
      },
      {
        name: "falls back to the default age when missing",
        args: () => [{ name: "Grace" }],
        expected: { name: "Grace", age: 18, extraKeys: [] },
      },
      {
        name: "keeps age 0 as given (not a missing value)",
        args: () => [{ name: "Baby", age: 0 }],
        expected: { name: "Baby", age: 0, extraKeys: [] },
      },
    ],
  },
};

export default destructuringSpreadModule;
