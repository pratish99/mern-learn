import type { ModuleContent } from "@/lib/types";

const jsIteratorsGeneratorsModule: ModuleContent = {
  id: "js-iterators-generators",
  title: "Iterators & generators",
  category: "Data Structures & Iteration",
  order: 12,
  explanation: `
### The problem: what if you don't want the whole list up front?

Sometimes you want a sequence of values without computing (or even
knowing) the whole thing in advance. Maybe the sequence is huge, maybe
it's expensive to produce each value, or maybe it genuinely never ends
(think: "the next natural number," forever). Building an array that
holds all of it just isn't an option.

A good mental model is a vending machine. A vending machine doesn't
dump its entire inventory in your lap when you walk up — it hands you
exactly one item per button press, and it's perfectly happy to sit
there, unopened, until you press the button again. **Generators** are
the JavaScript feature that lets a function behave like that: it can
pause mid-execution, hand back a single value, and later resume from
exactly where it left off — as many times as you ask.

### The iterator protocol: what makes something "steppable"

Before generators, there's a simpler idea underneath them: the
**iterator protocol**. An object is an "iterator" if it has a
\`.next()\` method, and calling that method returns an object shaped
like \`{ value, done }\`:

- \`value\` — the next item in the sequence.
- \`done\` — \`false\` while there are more values to produce, \`true\`
  once the sequence is finished (at which point \`value\` is usually
  \`undefined\`).

That's the entire contract. Nothing fancier is required — any object
with a \`.next()\` method shaped like that counts as an iterator, and
anything that consumes iterators (like \`for...of\`) knows how to work
with it.

### Symbol.iterator: what makes something usable in \`for...of\`

Separately, there's the question of what makes a value usable with
\`for...of\` in the first place — arrays, strings, Maps, and Sets all
work with \`for...of\`, but plain objects don't. The answer is a special
method named with the built-in \`Symbol.iterator\`: if an object has a
\`[Symbol.iterator]()\` method that returns an iterator (something with
\`.next()\`, as above), then it's "iterable," and \`for...of\` (along with
spread syntax, destructuring, \`Array.from\`, etc.) knows how to consume
it. This module won't dig deeper into \`Symbol.iterator\` itself — a
later module in this track covers building custom iterables with it in
detail — but it's worth knowing the two ideas are connected: a
generator function, covered next, automatically produces something
that satisfies both the iterator protocol *and* is iterable.

### Generator functions: pausing and resuming with \`function*\` and \`yield\`

A **generator function** is declared with an asterisk — \`function*
name() { ... }\` — and instead of running start-to-finish the moment
you call it, calling it just returns a **generator object** (an
iterator) without running any of the body yet. Nothing happens until
you call \`.next()\` on it.

Inside the function body, the \`yield\` keyword is where execution
pauses: it hands back a value (wrapped as \`{ value, done: false }\`
from that \`.next()\` call) and freezes the function exactly there —
local variables, loop counters, everything — until the *next* call to
\`.next()\`, at which point it picks back up right after the \`yield\` and
keeps going until it hits another \`yield\`, or a \`return\`, or falls off
the end (either of which produces \`{ value, done: true }\`).

That "remembers exactly where it was, including its local state,
between separate calls" behavior is really just closures — a concept
you've likely already met elsewhere in this track — applied in a
particularly elegant way. The generator's local variables are captured
in a scope that persists across calls, the same way a closure keeps a
variable alive after its enclosing function has returned.

\`\`\`js
function* countTo(max) {
  for (let i = 1; i <= max; i++) {
    yield i;
  }
}

const it = countTo(3);
it.next(); // { value: 1, done: false }
it.next(); // { value: 2, done: false }
it.next(); // { value: 3, done: false }
it.next(); // { value: undefined, done: true }
\`\`\`

\`\`\`mermaid
sequenceDiagram
  participant Caller
  participant Gen as Generator
  Caller->>Gen: next()
  Gen->>Gen: runs until it hits yield
  Gen-->>Caller: "{ value, done: false }"
  Caller->>Gen: next()
  Gen->>Gen: resumes right after yield, runs to next yield
  Gen-->>Caller: "{ value, done: false }"
  Caller->>Gen: next()
  Gen->>Gen: resumes and runs to completion
  Gen-->>Caller: "{ value: undefined, done: true }"
\`\`\`

### Infinite generators are fine — as long as something knows when to stop

Because a generator only computes the next value when asked, there's
nothing wrong with a generator that could, in principle, run forever —
\`while (true) { yield i++; }\` is a perfectly valid generator body. It
never tries to produce "all" its values at once, so it never hangs by
itself. The only danger is on the *consuming* side: a \`for...of\` loop
keeps calling \`.next()\` until \`done\` is \`true\`, and an infinite
generator's \`done\` is never \`true\` — so looping over one with
\`for...of\` (or spreading it into an array) would simply never stop.

The fix is to take control of the pulling yourself: call \`.next()\`
manually, in a loop that *you* bound (a \`for\` loop that runs a fixed
number of times, for example), and stop pulling whenever you've got
enough. That's exactly the shape of the challenge below — an infinite
generator of natural numbers is completely safe to use as long as you
only ever ask it for a known, finite number of values.

### Why this matters

Generators let you describe a sequence — even an unbounded one — as
simple, readable step-by-step code, and hand control of *how many*
values get produced to whoever's consuming it. In the challenge,
\`naturals()\` never has to know or care how many numbers anyone
actually wants; it just yields the next one whenever asked.
\`sumFirstN\` is the one deciding "stop after \`n\`," by calling \`.next()\`
exactly \`n\` times instead of looping over the generator directly.
`.trim(),
  codeExamples: [
    {
      title: "A finite generator, consumed with for...of",
      code: `function* colors() {
  yield "red";
  yield "green";
  yield "blue";
}

for (const color of colors()) {
  console.log(color);
}
// logs "red", then "green", then "blue"
// for...of automatically stops once done becomes true`,
    },
    {
      title: "Pulling values manually with .next()",
      code: `function* countUp() {
  let n = 1;
  while (true) {
    yield n++;
  }
}

const it = countUp();
console.log(it.next()); // { value: 1, done: false }
console.log(it.next()); // { value: 2, done: false }
console.log(it.next()); // { value: 3, done: false }
// it.next() would keep going forever — the caller decides when to stop`,
    },
  ],
  challenge: {
    functionName: "sumFirstN",
    prompt: `Write sumFirstN(n) using a generator function. Define a generator
naturals() that lazily yields 1, 2, 3, 4, ... forever (while (true) yield i++,
starting i at 1). Inside sumFirstN, create an iterator from naturals(), call
.next() exactly n times, add up the .value from each call, and return the
total. (Don't use a for...of loop over the generator directly — since it
never finishes on its own, that would loop forever. Pulling values manually
with .next() lets you control exactly how many you take.)`,
    starterCode: `function sumFirstN(n) {
  // your code here
}`,
    solutionCode: `function* naturals() {
  let i = 1;
  while (true) {
    yield i++;
  }
}

function sumFirstN(n) {
  const it = naturals();
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += it.next().value;
  }
  return total;
}`,
    testCases: [
      { name: "sums the first 5 naturals", args: () => [5], expected: 15 },
      { name: "sums the first 1 natural", args: () => [1], expected: 1 },
      { name: "returns 0 for n = 0", args: () => [0], expected: 0 },
      { name: "sums the first 10 naturals", args: () => [10], expected: 55 },
    ],
  },
};

export default jsIteratorsGeneratorsModule;
