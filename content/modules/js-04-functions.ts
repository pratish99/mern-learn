import type { ModuleContent } from "@/lib/types";

const jsFunctionsModule: ModuleContent = {
  id: "js-functions",
  title: "Functions: declarations, expressions & arrow functions",
  category: "Functions & Scope",
  order: 4,
  explanation: `
### The problem: JavaScript gives you several ways to write "a function"

If you've written even a little JS, you've probably seen \`function foo() {}\`,
\`const foo = function () {}\`, and \`const foo = () => {}\` all used to mean
roughly the same thing: "here's some reusable code." They're not
interchangeable, though — they differ in when they become available, and in
how they handle \`this\` (the object a function is "attached to" when it runs
as a method). Picking the wrong one is a common source of confusing bugs, so
it's worth knowing exactly how each behaves.

### Function declarations: hoisted, and have their own \`this\`

A **function declaration** is the classic \`function name() { ... }\` form,
written as its own statement.

\`\`\`js
function greet(name) {
  return \`Hello, \${name}\`;
}
\`\`\`

Function declarations are **hoisted** — JavaScript moves the *entire*
function definition to the top of its containing scope before any code
runs. That means you can call \`greet()\` on a line *above* where it's
written in the file, and it still works. (This is different from \`var\`
hoisting, where only the variable name is hoisted, not its value.)

Function declarations also get their **own \`this\`**: when called as a
method on an object (\`obj.greet()\`), \`this\` inside the function refers to
\`obj\`. Called as a plain function (\`greet()\`), \`this\` is \`undefined\` in
strict mode (or the global object otherwise).

### Function expressions: not hoisted the same way

A **function expression** is a function created as part of an expression,
most commonly by assigning it to a variable:

\`\`\`js
const greet = function (name) {
  return \`Hello, \${name}\`;
};
\`\`\`

Here, only the variable \`greet\` is hoisted (as an uninitialized \`const\`/
\`let\` binding, or as \`undefined\` if declared with \`var\`) — the function
*value* isn't assigned to it until that line actually executes. Call
\`greet()\` before this line runs and you'll get an error, not the function.
Like declarations, a plain function expression still gets its own \`this\`
when called as a method.

### Arrow functions: no own \`this\`, no own \`arguments\`, never a constructor

**Arrow functions** (\`=>\`) look similar but behave differently in a few
important ways:

- They don't have their own \`this\`. Instead, \`this\` inside an arrow
  function is whatever \`this\` was in the surrounding (enclosing) scope —
  it's "inherited," not rebound. This is why arrow functions are so
  popular for callbacks inside methods: they let you refer to the outer
  \`this\` without it getting overwritten.
- They don't have their own \`arguments\` object either (the array-like
  object that plain functions get, listing every argument passed in).
- They **can't be used as constructors** — writing \`new someArrowFn()\`
  throws an error, whereas \`new\` works fine on declarations and regular
  function expressions.

Arrow functions also come in two body styles:

\`\`\`js
const double = (x) => x * 2;              // concise body: implicitly returns x * 2
const doubleVerbose = (x) => {            // block body: needs an explicit return
  return x * 2;
};
\`\`\`

The **concise body** (no curly braces) automatically returns the
expression's value. The **block body** (curly braces) behaves like a
normal function body — nothing is returned unless you write \`return\`
yourself.

### Default parameters: they trigger on \`undefined\`, not on "was an argument passed"

A **default parameter** gives a parameter a fallback value to use when the
caller doesn't supply one:

\`\`\`js
function greet(name = "friend") {
  return \`Hello, \${name}\`;
}

greet();          // "Hello, friend"  — no argument at all
greet(undefined); // "Hello, friend"  — argument explicitly undefined
greet("Ada");      // "Hello, Ada"
\`\`\`

The key detail: JavaScript doesn't have a separate concept of "no argument
was passed" versus "the argument is \`undefined\`" — they're the same thing.
Omitting an argument simply *is* passing \`undefined\` for it. So a default
parameter kicks in whenever the value received is \`undefined\`, whether
that's because the caller left it out entirely or passed \`undefined\`
explicitly. (Passing \`null\`, \`0\`, or \`""\` does *not* trigger the default —
only \`undefined\` does.)

### Rest parameters vs the spread operator: mirror images of each other

These two use the exact same \`...\` syntax but do opposite things, and
mixing them up is a common source of confusion.

- **Rest parameters** *collect* multiple individual arguments into a
  single array, inside a function's parameter list:

  \`\`\`js
  function sum(...nums) {
    // nums is a real array, e.g. sum(1, 2, 3) -> nums === [1, 2, 3]
    return nums.reduce((total, n) => total + n, 0);
  }
  \`\`\`

- The **spread operator** does the reverse: it *expands* an array (or
  object) out into individual elements (or key/value pairs), wherever
  you use it — a function call, an array literal, or an object literal:

  \`\`\`js
  const nums = [1, 2, 3];
  sum(...nums); // spreads the array into three separate arguments: sum(1, 2, 3)

  const combined = [0, ...nums, 4]; // [0, 1, 2, 3, 4]

  const merged = { ...{ a: 1 }, ...{ b: 2 } }; // { a: 1, b: 2 }
  \`\`\`

For plain objects, spreading one object's keys into another — as in
\`merged\` above — is a fast way to copy and combine properties without
mutating the originals. When the same key appears in more than one
spread, whichever one comes **last** wins, since each key simply gets
overwritten by later assignments as the spread expands left to right.

### Why this matters

Merging a caller-supplied "overrides" object on top of a "defaults"
object is one of the most common patterns you'll write in real code —
configuring a library, setting options for an API call, filling in form
state. The combination you'll use for it is exactly what's in this
challenge: a **default parameter** (so the function still works if the
caller doesn't pass an overrides object at all) plus **object spread**
(to merge the two objects immutably, with later keys winning). Once this
pattern clicks, you'll recognize it everywhere.
`.trim(),
  codeExamples: [
    {
      title: "Hoisting: declaration vs expression vs arrow",
      code: `console.log(declared()); // works — "hi" (hoisted with its full body)

function declared() {
  return "hi";
}

console.log(typeof expressed); // "undefined" — the binding exists, but no value yet
// expressed(); // TypeError: expressed is not a function (if called here)

const expressed = function () {
  return "hi";
};

const arrow = () => "hi"; // same hoisting behavior as the expression above`,
    },
    {
      title: "Rest parameters vs spread operator",
      code: `function logAll(first, ...rest) {
  // rest COLLECTS remaining args into an array
  console.log(first, rest); // logAll(1, 2, 3) -> 1 [2, 3]
}

const parts = [2, 3];
logAll(1, ...parts); // spread EXPANDS the array back into args: logAll(1, 2, 3)`,
    },
  ],
  challenge: {
    functionName: "withDefaults",
    prompt: `Write withDefaults(overrides, defaults) that merges two plain objects,
where any key present in overrides wins over the same key in defaults. Use a
default parameter so that calling withDefaults with overrides omitted (or
explicitly undefined) still works and just returns defaults. Use object
spread syntax to do the merge (don't mutate either input object).`,
    starterCode: `function withDefaults(overrides = {}, defaults = {}) {
  // your code here
}`,
    solutionCode: `function withDefaults(overrides = {}, defaults = {}) {
  return { ...defaults, ...overrides };
}`,
    testCases: [
      {
        name: "overrides win over defaults",
        args: () => [{ b: 2 }, { a: 1, b: 0 }],
        expected: { a: 1, b: 2 },
      },
      {
        name: "falls back to defaults when overrides is undefined",
        args: () => [undefined, { a: 1 }],
        expected: { a: 1 },
      },
      {
        name: "falls back to an empty object when both are omitted",
        args: () => [],
        expected: {},
      },
      {
        name: "keeps keys from overrides not present in defaults",
        args: () => [{ c: 3 }, { a: 1 }],
        expected: { a: 1, c: 3 },
      },
    ],
  },
};

export default jsFunctionsModule;
