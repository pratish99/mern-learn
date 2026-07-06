import type { ModuleContent } from "@/lib/types";

const jsThisBindingModule: ModuleContent = {
  id: "js-this-binding",
  title: "this & explicit binding",
  category: "Functions & Scope",
  order: 6,
  explanation: `
### The problem: \`this\` isn't fixed — it depends on how you call the function

In some languages, "this" (or "self") always means "the object this method
was defined on," full stop. JavaScript doesn't work that way. Inside a
regular function, \`this\` is decided fresh **every time the function is
called**, based on *how* it was called — not where it was written. That
disconnect is the source of one of the most common JS bugs: you take a
perfectly working method like \`obj.method\`, pass it somewhere else as a
plain callback (an event handler, a \`setTimeout\`, a \`.map()\` callback),
and suddenly \`this\` inside it is \`undefined\` or the wrong object entirely.
The method "detached" from \`obj\` the moment it stopped being called as
\`obj.method()\`.

To fix bugs like that, you first need to know the rules for how \`this\`
gets assigned. There are four of them.

### 1. Plain call — \`this\` is \`undefined\` (or the global object)

If you call a function with no object in front of it at all:

\`\`\`js
function whoAmI() {
  return this;
}

whoAmI(); // undefined in strict mode ("use strict" or inside a module/class);
          // the global object (e.g. globalThis) in old-style sloppy mode
\`\`\`

This is the **default binding**. Nothing set \`this\` to anything useful, so
JS falls back to \`undefined\` (strict mode, which is the default in ES
modules and classes) or the global object (sloppy mode, mostly a legacy
concern now).

### 2. Implicit binding — calling through an object sets \`this\` to that object

When you call a function as a property of an object — \`obj.method()\` —
\`this\` inside \`method\` is set to \`obj\` for that call:

\`\`\`js
const user = {
  name: "Ada",
  greet() {
    return \`Hi, I'm \${this.name}\`;
  },
};

user.greet(); // "Hi, I'm Ada" — this === user, because it was called as user.greet()
\`\`\`

The important word is *called*. It's not that \`greet\` "belongs" to
\`user\` forever — it's that \`this\` gets bound to whatever is immediately
to the left of the \`.\` **at the moment of the call**. Pull that same
function out into a bare variable and call it on its own, and the
\`user.\` part is gone — so \`this\` falls back to the default binding
(rule 1), not \`user\`:

\`\`\`js
const detached = user.greet;
detached(); // this is undefined (strict mode) — "Cannot read properties of undefined"
            // user.name never even gets reached
\`\`\`

This is exactly the "detached method" bug: the function object itself is
identical either way — only *how it's called* changed.

### 3. Explicit binding — \`.call\`, \`.apply\`, and \`.bind\`

Since \`this\` is just "whatever the call site set it to," JavaScript gives
you a way to override the call site and set \`this\` yourself, using three
methods every function has:

- **\`fn.call(thisArg, arg1, arg2, ...)\`** — calls \`fn\` immediately, with
  \`this\` set to \`thisArg\`, passing the rest of the arguments individually.
- **\`fn.apply(thisArg, [arg1, arg2, ...])\`** — does exactly the same thing
  as \`.call\`, with one difference: the arguments are passed as a single
  **array** instead of listed one by one. (Handy when you already have an
  array of arguments rather than separate variables.)
- **\`fn.bind(thisArg, arg1, ...)\`** — the odd one out: it does **not**
  call \`fn\` at all. Instead it returns a **new function** that, whenever
  it's eventually called, always calls the original with \`this\`
  permanently locked to \`thisArg\` (regardless of how that new function
  itself gets called later).

\`\`\`js
function greet(greeting) {
  return \`\${greeting}, \${this.name}\`;
}

const user = { name: "Ada" };

greet.call(user, "Hi");         // "Hi, Ada" — calls now, this = user
greet.apply(user, ["Hi"]);      // "Hi, Ada" — same, but args as an array

const boundGreet = greet.bind(user);
boundGreet("Hello");            // "Hello, Ada" — this = user forever, called later
\`\`\`

\`.call\`/\`.apply\` fix a detached call on the spot; \`.bind\` fixes it
*ahead of time*, which is why it's the standard tool for "I'm about to
hand this method off somewhere else that will call it for me."

### 4. Arrow functions — no own \`this\` at all

Arrow functions break all three rules above on purpose: they never have
their own \`this\`. Instead, an arrow function simply reads \`this\` from
the **enclosing scope** where it was written — the same \`this\` that
surrounded it at definition time — and none of \`.call\`, \`.apply\`, or
\`.bind\` can override that.

\`\`\`js
const user = {
  name: "Ada",
  delayedGreet() {
    setTimeout(() => {
      // arrow function: this is inherited from delayedGreet's this, i.e. user
      console.log(\`Hi, \${this.name}\`);
    }, 0);
  },
};

user.delayedGreet(); // logs "Hi, Ada"
\`\`\`

If \`delayedGreet\` had used a regular \`function () {}\` for the callback
instead, that inner function would get its own \`this\` via the default
binding (rule 1) when \`setTimeout\` calls it — losing \`user\` entirely.
This is why arrow functions are so popular for callbacks nested inside
methods.

### Why this matters

The "detached method" bug from rule 2 is one of the most common real-world
\`this\` mistakes: pulling a method off an object — often because you're
passing it as a callback, like an event handler (\`element.addEventListener
("click", this.handleClick)\`) or a \`.map\`/\`.forEach\` argument — and
watching it fail because \`this\` no longer points where you expect. The
fix is always the same idea this challenge asks you to practice: reattach
the right \`this\` explicitly with \`.call\`/\`.apply\`, or lock it in ahead
of time with \`.bind\` (or sidestep the whole problem with an arrow
function, when that's an option).
`.trim(),
  codeExamples: [
    {
      title: "The detached-method bug, and fixing it with .bind",
      code: `const counter = {
  count: 0,
  increment() {
    this.count++;
  },
};

const handler = counter.increment; // pulled out — now "detached" from counter
// setTimeout(handler, 0); // BUG: this is undefined inside increment when it fires

const boundHandler = counter.increment.bind(counter); // this is locked to counter
setTimeout(boundHandler, 0); // works correctly: counter.count becomes 1`,
    },
    {
      title: "Arrow functions inherit this; regular functions don't",
      code: `const team = {
  name: "Rockets",
  membersRegular: function (names) {
    return names.map(function (n) {
      return \`\${this.name}: \${n}\`; // this is undefined here (default binding) — breaks
    });
  },
  membersArrow: function (names) {
    return names.map((n) => \`\${this.name}: \${n}\`); // this is inherited from membersArrow's this
  },
};`,
    },
  ],
  challenge: {
    functionName: "callDetached",
    prompt: `Write callDetached(obj, methodName, arg) that calls obj[methodName](arg)
in a way that correctly preserves "this" as obj — even though, inside your
function, you must first pull the method out into its own variable (simulating
what happens when a method gets passed around as a plain callback and "detaches"
from its object, losing its this). Use .call (or .apply/.bind) to reattach the
right this when you invoke it.`,
    starterCode: `function callDetached(obj, methodName, arg) {
  // your code here
}`,
    solutionCode: `function callDetached(obj, methodName, arg) {
  const fn = obj[methodName]; // extracted — calling fn(arg) directly here would lose "this"
  return fn.call(obj, arg);
}`,
    testCases: [
      {
        name: "preserves this for a simple method",
        args: () => {
          const obj = { value: 5, addTo(n: number) { return this.value + n; } };
          return [obj, "addTo", 3];
        },
        expected: 8,
      },
      {
        name: "works with a different object shape",
        args: () => {
          const obj = { prefix: "Mr. ", greet(name: string) { return this.prefix + name; } };
          return [obj, "greet", "Smith"];
        },
        expected: "Mr. Smith",
      },
      {
        name: "works when the method ignores its argument",
        args: () => {
          const obj = { value: 42, getValue() { return this.value; } };
          return [obj, "getValue", undefined];
        },
        expected: 42,
      },
    ],
  },
};

export default jsThisBindingModule;
