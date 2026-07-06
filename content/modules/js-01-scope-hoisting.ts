import type { ModuleContent } from "@/lib/types";

const scopeHoistingModule: ModuleContent = {
  id: "js-scope-hoisting",
  title: "Scope, hoisting & the temporal dead zone",
  category: "Language Basics",
  order: 1,
  explanation: `
### The problem: when does a variable actually "exist"?

You've probably been told "declare variables before you use them." But
JavaScript quietly breaks that rule all the time — you can reference a
\`function\` before the line it's written on, and a \`var\` before its
declaration gives you \`undefined\` instead of a crash. Meanwhile, doing
the exact same thing with \`let\` or \`const\` throws an error. Same
language, three different behaviors. Understanding *why* comes down to
two ideas: **hoisting** (what the engine quietly does with declarations
before running your code) and **scope** (which region of code a
variable is visible in).

### Scope: \`var\` vs \`let\`/\`const\`

**Scope** just means "the region of code where a variable is visible
and usable." \`var\` is **function-scoped**: a \`var\` declared anywhere
inside a function belongs to the *whole function*, even if it's buried
inside an \`if\` block or a \`for\` loop. \`let\` and \`const\` are
**block-scoped**: they belong only to the nearest \`{ ... }\` block they
were declared in — an \`if\`, a \`for\` loop, or any bare \`{ }\`.

\`\`\`js
function example() {
  if (true) {
    var a = 1;
    let b = 2;
  }
  console.log(a); // 1 — var leaked out of the if-block
  console.log(b); // ReferenceError — b only exists inside the block
}
\`\`\`

This difference is the root of almost every \`var\`-related bug: people
expect the variable to be trapped inside the \`if\` or \`for\` block, but
with \`var\` it isn't.

### Hoisting: declarations are processed before your code runs

**Hoisting** describes how JavaScript sets up variables and functions
*before* it executes anything, line by line, in a given scope. In
practice, the engine scans a scope for declarations first and reserves
space for them — it's as if the declaration itself moved to the top,
even though the assignment stays where you wrote it. The three kinds of
declarations are hoisted differently:

- **\`function\` declarations** (\`function foo() {}\`) are hoisted
  completely — name *and* body. That's why you can call a function
  before its definition appears in the file.
- **\`var\`** is hoisted as a name only, and automatically initialized to
  \`undefined\`. So reading a \`var\` before its assignment doesn't throw —
  it just gives you \`undefined\`, which can hide bugs rather than
  surface them.
- **\`let\` and \`const\`** are also hoisted (their names are known to the
  scope from the start), but they are **not** initialized. Touching them
  before their declaration line throws a \`ReferenceError\` — see the next
  section.

\`\`\`js
console.log(typeof sayHi); // "function" — fully hoisted
console.log(x);            // undefined  — hoisted, not yet assigned
var x = 5;

function sayHi() {
  console.log("hi");
}
\`\`\`

### The temporal dead zone (TDZ)

Think of declaring a \`let\`/\`const\` variable like reserving a seat at a
theater that isn't open yet: the seat exists and has your name on it,
but you can't sit in it until the doors actually open. The **temporal
dead zone** is that waiting period — the stretch of code between the
start of the scope and the actual \`let\`/\`const\` line, during which the
variable is reserved but touching it throws a \`ReferenceError\` instead
of giving you \`undefined\`.

\`\`\`js
console.log(y); // ReferenceError: Cannot access 'y' before initialization
let y = 10;
\`\`\`

This is a deliberate safety improvement over \`var\`. Silently getting
\`undefined\` can let a typo or ordering mistake slide through unnoticed;
throwing immediately forces you to fix the ordering bug right away.

### The classic bug: \`var\` inside a loop, captured by a closure

This is where \`var\`'s function-scoping causes real, common bugs. Say
you create a handful of functions inside a \`for\` loop, each meant to
"remember" the loop index at the time it was created — a **closure**
(a function that keeps a reference to variables from the scope it was
defined in, even after that scope has finished running).

\`\`\`js
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i);
}
console.log(fns.map((f) => f())); // [3, 3, 3] — not [0, 1, 2]!
\`\`\`

Why \`[3, 3, 3]\`? Because \`var i\` is a *single* variable shared by the
entire function scope — there's only ever one \`i\`, and every closure
captured a reference to that same \`i\`, not a snapshot of its value.
By the time any of the arrow functions actually runs, the loop has
already finished and \`i\` is sitting at \`3\`.

\`let\` fixes this because a \`for\` loop with \`let\` creates a **fresh
binding of the loop variable for every single iteration** — effectively
a brand-new \`i\` each time around, initialized with the previous
iteration's value. Each closure captures its *own* \`i\`, not a shared
one:

\`\`\`js
const fns = [];
for (let i = 0; i < 3; i++) {
  fns.push(() => i);
}
console.log(fns.map((f) => f())); // [0, 1, 2] — each closure got its own i
\`\`\`

### Why this matters

"Use \`let\`/\`const\`, avoid \`var\`" isn't just a style preference — it's
because \`var\`'s function-scoping and silent \`undefined\`-hoisting make it
easy to write code that behaves differently than it reads, especially
around loops and closures. The TDZ turns "used a variable too early"
from a silent, confusing bug into an immediate, loud error. In the
challenge below, you'll build exactly the "getters from a loop" scenario
above — write it with \`let\` so each getter function ends up remembering
its own index, instead of every getter sharing whatever value the loop
variable landed on at the end.
`.trim(),
  codeExamples: [
    {
      title: "The temporal dead zone in action",
      code: `function demo() {
  console.log(typeof score); // "undefined" — score is a hoisted var
  console.log(score);        // undefined

  console.log(typeof total); // ReferenceError, not "undefined"!
  // total is hoisted but sits in the TDZ until this next line runs
  let total = 0;

  var score = 100;
}`,
    },
    {
      title: "var-in-loop bug vs the let fix",
      code: `// Buggy: one shared 'i', all closures see its final value
const buggy = [];
for (var i = 0; i < 3; i++) {
  buggy.push(() => i);
}
buggy.map((fn) => fn()); // [3, 3, 3]

// Fixed: a fresh 'i' binding per iteration
const fixed = [];
for (let i = 0; i < 3; i++) {
  fixed.push(() => i);
}
fixed.map((fn) => fn()); // [0, 1, 2]`,
    },
  ],
  challenge: {
    functionName: "makeIndexGetters",
    prompt: `Write makeIndexGetters(count) that creates an array of "getter" functions —
one per index from 0 to count - 1 — where each getter, when called, returns the
index it was created for. Then call every getter and return the array of their
results. (This is the classic "var vs let in a loop" problem: get it right with
let/a fresh binding per iteration, and each getter remembers its own index
instead of them all sharing the final loop value.)`,
    starterCode: `function makeIndexGetters(count) {
  // your code here
}`,
    solutionCode: `function makeIndexGetters(count) {
  const getters = [];
  for (let i = 0; i < count; i++) {
    getters.push(() => i);
  }
  return getters.map((getter) => getter());
}`,
    testCases: [
      { name: "returns sequential indexes", args: () => [3], expected: [0, 1, 2] },
      { name: "returns an empty array for count 0", args: () => [0], expected: [] },
      { name: "works for a single getter", args: () => [1], expected: [0] },
      { name: "works for a larger count", args: () => [5], expected: [0, 1, 2, 3, 4] },
    ],
  },
};

export default scopeHoistingModule;
