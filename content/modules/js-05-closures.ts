import type { ModuleContent } from "@/lib/types";

const jsClosuresModule: ModuleContent = {
  id: "js-closures",
  title: "Closures",
  category: "Functions & Scope",
  order: 5,
  explanation: `
### The backpack every function carries

Imagine a function is a person heading out the door. Before it leaves,
it packs a backpack with the variables it might need later — stuff from
the place it was created. No matter where that function travels or how
long after it actually gets called, it can always reach into that
backpack and find those variables, still there, still up to date.

That backpack is a **closure**. More precisely: a closure is a function
that remembers the variables from the scope it was created in, even
after that outer scope has already finished running. This isn't some
exotic feature you opt into — every function in JavaScript automatically
gets a closure over its surrounding variables. You use closures constantly
whether you notice it or not.

### Lexical scope: captured at creation, not at call

The key word above is "created." JavaScript uses **lexical scoping**,
which means a function's access to outer variables is determined by
*where it's written in the code*, not by who calls it or when.

\`\`\`js
function outer() {
  const secret = "shh";
  function inner() {
    console.log(secret); // inner can see secret because of WHERE it was defined
  }
  return inner;
}

const revealSecret = outer(); // outer() has already returned!
revealSecret(); // logs "shh" — inner still remembers secret
\`\`\`

Notice that \`outer()\` has already finished and returned by the time we
call \`revealSecret()\`. Normally you'd expect \`secret\` to be gone —
local variables are supposed to disappear once a function returns. But
because \`inner\` closed over \`secret\` when it was created, JavaScript
keeps \`secret\` alive in \`inner\`'s backpack for as long as \`inner\` might
still need it. This is the whole trick behind closures: the variable
isn't copied, it's *remembered by reference*, tied to the exact scope
where the function was defined.

\`\`\`mermaid
flowchart TD
  A["outer() is called"] --> B["secret = 'shh' created in outer's scope"]
  B --> C["inner() defined here - closes over secret"]
  C --> D["outer returns inner (as revealSecret)"]
  D --> E["outer() finishes - its scope would normally be gone"]
  E --> F["but inner keeps a live reference to secret"]
  F --> G["revealSecret() called later"]
  G --> H["logs 'shh' - secret is still reachable"]
\`\`\`

### The classic example: a counter with private state

Closures are how JavaScript fakes "private" variables without needing a
class at all.

\`\`\`js
function makeCounter() {
  let count = 0; // only the functions created here can ever touch this
  return function () {
    count += 1;
    return count;
  };
}

const counter = makeCounter();
counter(); // 1
counter(); // 2
counter(); // 3
\`\`\`

There is no way to reach \`count\` from outside \`makeCounter\` — no
\`counter.count\`, no global variable, nothing. The only door into that
variable is the function that closed over it. Every call to
\`makeCounter()\` creates a *brand new* \`count\` and a brand new closure
around it, so two counters never interfere with each other. This is
"private state" achieved with nothing more than a function and a
variable — no \`class\`, no \`this\`, no special syntax required.

### The "once" pattern: closures for "did I already do this?"

A second extremely common use of closures is making sure something
happens **at most once** — run an expensive setup step, fetch some
config, or compute a result the first time it's needed, and then just
hand back the cached answer on every later call, no matter what
arguments come in.

\`\`\`js
function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (!called) {
      result = fn(...args); // only runs the real work the first time
      called = true;
    }
    return result; // every later call just returns the cached value
  };
}
\`\`\`

The \`called\` flag and the \`result\` value both live in the backpack that
the returned function carries around. There's no other way for the
returned function to "remember" across separate calls that it already
ran — no global variable needed, just the closure. This is exactly the
shape of the challenge below: you'll wrap a function so its real work
only ever happens on the first call, and every subsequent call — even
with completely different arguments — just returns whatever was cached
the first time.

### Why this matters

Closures are the mechanism behind private counters, memoized (cached)
computations, "run setup exactly once" guards, and countless callback
patterns you'll meet constantly in real code. In the challenge,
\`callAtMostOnce\` builds a wrapped function that checks "have I already
run?" and "what did I return?" — and the only reason it can check that
across two separate calls is that the closure keeps those two variables
alive in memory between them.
`.trim(),
  codeExamples: [
    {
      title: "makeCounter(): private state via closure",
      code: `function makeCounter() {
  let count = 0;
  return function () {
    count += 1;
    return count;
  };
}

const counterA = makeCounter();
const counterB = makeCounter();
counterA(); // 1
counterA(); // 2
counterB(); // 1 — counterB has its own separate "count" backpack`,
    },
    {
      title: "A minimal \"once\" wrapper",
      code: `function once(fn) {
  let called = false;
  let result;
  return (...args) => {
    if (!called) {
      result = fn(...args);
      called = true;
    }
    return result;
  };
}

const setup = once(() => {
  console.log("running setup...");
  return "ready";
});

setup(); // logs "running setup...", returns "ready"
setup(); // no log this time — just returns the cached "ready"`,
    },
  ],
  challenge: {
    functionName: "callAtMostOnce",
    prompt: `Write callAtMostOnce(fn, argsA, argsB) that wraps fn so it only ever
actually runs once: the first call runs fn with the arguments in argsA and
caches the result; every call after that (including a second call with
different arguments) returns the CACHED result instead of calling fn again.
Inside callAtMostOnce, call your wrapped version once with argsA and once
with argsB, and return [firstResult, secondResult]. This is the classic
"once" pattern, and it only works because a closure lets your wrapped
function remember "have I already run?" and "what did I return?" across
separate calls.`,
    starterCode: `function callAtMostOnce(fn, argsA, argsB) {
  // your code here
}`,
    solutionCode: `function callAtMostOnce(fn, argsA, argsB) {
  let called = false;
  let cached;

  function once(...args) {
    if (!called) {
      cached = fn(...args);
      called = true;
    }
    return cached;
  }

  const first = once(...argsA);
  const second = once(...argsB);
  return [first, second];
}`,
    testCases: [
      {
        name: "second call reuses the cached result from the first",
        args: () => [(a: number, b: number) => a + b, [1, 2], [100, 200]],
        expected: [3, 3],
      },
      {
        name: "works with a function that has side effects (only fires once)",
        args: () => {
          let calls = 0;
          const fn = (n: number) => {
            calls += 1;
            return n * calls;
          };
          return [fn, [5], [5]];
        },
        expected: [5, 5],
      },
      {
        name: "works with zero-argument calls",
        args: () => [() => "hello", [], []],
        expected: ["hello", "hello"],
      },
    ],
  },
};

export default jsClosuresModule;
