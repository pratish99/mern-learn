import type { ModuleContent } from "@/lib/types";

const jsSymbolsModule: ModuleContent = {
  id: "js-symbols",
  title: "Symbols & well-known symbols",
  category: "Metaprogramming & Patterns",
  order: 13,
  explanation: `
### The problem: guaranteeing a property key that can never collide

Imagine two different libraries both decide to stash some metadata on an
object you pass around, and both pick the property name \`"type"\`. Whichever
one writes last silently overwrites the other's value — no error, no
warning, just quietly wrong behavior. Regular string keys are just text;
JavaScript has no way to tell "my \`"type"\`" apart from "your \`"type"\`."

\`Symbol\` is a primitive type that exists to solve exactly this problem. A
symbol is a value you create that is guaranteed to be unique — nothing else
in the universe of your program will ever equal it, so it makes an ideal
property key when you need to be *sure* nothing else will accidentally read
or overwrite it.

### Symbols are always unique — even with the same description

You create a symbol by calling \`Symbol()\`, optionally with a short
description string for debugging (the description doesn't affect
uniqueness at all — it's purely a label, similar to a variable name in a
stack trace):

\`\`\`js
const a = Symbol("id");
const b = Symbol("id");

a === b; // false — two separate, unique values, despite the identical description
\`\`\`

This is the core guarantee: every call to \`Symbol()\` returns a brand-new,
one-of-a-kind value, even if you pass it the exact same description string
twice. Compare that to strings, where \`"id" === "id"\` is always \`true\` —
that's precisely the collision problem symbols avoid.

### Symbols as "hidden" property keys

You can use a symbol as an object's property key just like a string:

\`\`\`js
const idKey = Symbol("id");
const user = { name: "Ada", [idKey]: 42 };

user[idKey]; // 42
\`\`\`

The interesting part is what happens when you try to discover that
property through the normal, everyday tools: \`Object.keys(user)\`,
\`for...in\`, and \`JSON.stringify(user)\` all skip symbol-keyed properties
entirely. They only ever see \`"name"\`. This makes symbols a natural fit for
attaching metadata to an object that ordinary code — and anything that
serializes the object — shouldn't stumble across or accidentally iterate
over. It's not true privacy (anyone holding a reference to \`idKey\` can still
read or write \`user[idKey]\`), but it is invisible to code that doesn't
already know the symbol exists.

### Well-known symbols: how you plug into the language itself

Symbols aren't only for your own metadata. JavaScript defines a handful of
built-in symbols — called **well-known symbols** — that live as static
properties on the global \`Symbol\` object (e.g. \`Symbol.iterator\`). The
language itself looks for these specific symbols on objects to decide how
to treat them. Implement the right one, and your plain object suddenly
opts into built-in behavior, the same way any built-in array or string
would.

The best example is \`Symbol.iterator\`. It's the exact method name that
\`for...of\` loops, the spread operator (\`[...x]\`), and array destructuring
all look for when they're handed something to iterate over. If an object
has a \`Symbol.iterator\` method, all three "just work" on it — no special
casing, no inheritance, no built-in class required.

A \`Symbol.iterator\` method must return an **iterator**: an object with a
\`next()\` method that, each time it's called, returns \`{ value, done }\` —
the next value plus a boolean saying whether iteration is finished.

\`\`\`js
const countdown = {
  [Symbol.iterator]() {
    let n = 3;
    return {
      next() {
        if (n > 0) return { value: n--, done: false };
        return { value: undefined, done: true };
      },
    };
  },
};

for (const num of countdown) {
  console.log(num); // 3, 2, 1
}
\`\`\`

Once \`Symbol.iterator\` is defined, \`[...countdown]\` produces \`[3, 2, 1]\`
too — the spread operator uses the identical protocol.

### Other well-known symbols, briefly

\`Symbol.iterator\` isn't a one-off special case — it's one instance of a
general mechanism. A few other well-known symbols hook into different
language features the same way:

- \`Symbol.toPrimitive\` — lets an object control what value it produces
  when JavaScript needs to coerce it to a number, string, or in a generic
  context (e.g. during \`+obj\` or template-literal interpolation).
- \`Symbol.hasInstance\` — lets an object customize what \`instanceof\`
  reports for it, instead of the default prototype-chain check.

You won't need either of those for this challenge, but recognizing the
pattern is the point: "define a method under this specific well-known
symbol, and some built-in operator or syntax starts respecting it."

### Why this matters

The upcoming challenge asks you to make a plain object iterable from
scratch. That means implementing \`Symbol.iterator\` so it returns an object
with a working \`next()\`, and then relying on the fact that the spread
operator already knows how to consume anything shaped that way. There's no
special "iterable" base class to extend — just one correctly named method,
because \`Symbol.iterator\` is a symbol the language itself already knows to
look for.
`.trim(),
  codeExamples: [
    {
      title: "Two symbols with the same description are never equal",
      code: `const first = Symbol("token");
const second = Symbol("token");

console.log(first === second); // false
console.log(first.toString()); // "Symbol(token)" — description is just a label`,
    },
    {
      title: "A minimal custom iterable, used with for...of",
      code: `const evens = {
  [Symbol.iterator]() {
    let n = 0;
    return {
      next() {
        n += 2;
        return n <= 6 ? { value: n, done: false } : { value: undefined, done: true };
      },
    };
  },
};

for (const value of evens) {
  console.log(value); // 2, then 4, then 6
}`,
    },
  ],
  challenge: {
    functionName: "collectRange",
    prompt: `Write collectRange(start, end) that creates a plain object made
iterable by implementing the well-known Symbol.iterator method — the same
protocol that powers for...of and the spread operator. Symbol.iterator should
return an iterator object with a next() method that yields every integer from
start to end (inclusive), then reports done. Once your object implements
Symbol.iterator, use the spread operator on it and return the resulting
array.`,
    starterCode: `function collectRange(start, end) {
  // your code here
}`,
    solutionCode: `function collectRange(start, end) {
  const range = {
    [Symbol.iterator]() {
      let current = start;
      return {
        next() {
          if (current <= end) {
            return { value: current++, done: false };
          }
          return { value: undefined, done: true };
        },
      };
    },
  };
  return [...range];
}`,
    testCases: [
      { name: "collects a range of several numbers", args: () => [2, 5], expected: [2, 3, 4, 5] },
      { name: "collects a single-number range", args: () => [7, 7], expected: [7] },
      { name: "returns an empty array when start > end", args: () => [5, 2], expected: [] },
      { name: "handles negative numbers", args: () => [-2, 1], expected: [-2, -1, 0, 1] },
    ],
  },
};

export default jsSymbolsModule;
