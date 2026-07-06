import type { ModuleContent } from "@/lib/types";

const jsArrayIterationModule: ModuleContent = {
  id: "js-array-iteration",
  title: "Array & object iteration methods",
  category: "Data Structures & Iteration",
  order: 11,
  explanation: `
### The problem: looping is easy to write, hard to read

Say you have a list of orders and you want the total quantity across all
of them. With a manual loop, that looks like:

\`\`\`js
let totalQty = 0;
for (let i = 0; i < orders.length; i++) {
  totalQty += orders[i].qty;
}
\`\`\`

That works, but notice what you had to invent to make it work: an index
variable \`i\`, a comparison to know when to stop, an increment step, and
an accumulator variable declared *outside* the loop. None of that is the
actual point — the point is "add up all the quantities." Every one of
those extra pieces is a place a bug can hide (off-by-one, forgetting to
reset the accumulator, mutating the wrong variable).

Array iteration methods exist to let you skip re-inventing that
boilerplate every time and instead name your *intent* directly: "transform
each item," "keep only some items," "combine everything into one value."
Once you recognize which of those three shapes your problem is, the method
to reach for falls out immediately.

### \`map\` — transform each element, one-to-one

\`array.map(callback)\` runs \`callback\` once per element and builds a
**new array** of the same length, made up of whatever each call returned.
Nothing is skipped, nothing is combined — it's a straight transformation.

\`\`\`js
const prices = [10, 20, 30];
const withTax = prices.map((price) => price * 1.1);
// withTax: [11, 22, 33] — same length as prices, each value transformed
\`\`\`

The original array (\`prices\`) is untouched — \`map\` always returns a new
array.

### \`filter\` — keep only some elements

\`array.filter(callback)\` runs \`callback\` (called a **predicate** — a
function that returns \`true\` or \`false\`) once per element, and builds a
new array containing only the elements where the callback returned
\`true\`. The result can be shorter than the original (or empty, or the
same length if everything passes).

\`\`\`js
const nums = [1, 2, 3, 4, 5];
const evens = nums.filter((n) => n % 2 === 0);
// evens: [2, 4]
\`\`\`

### \`reduce\` — combine everything into a single value

\`reduce\` is the one people find hardest, because unlike \`map\` and
\`filter\` it doesn't build a same-shaped array — it walks the whole array
and boils it down to one final value (a number, a string, an object,
whatever you need).

\`array.reduce((accumulator, current) => ..., initialValue)\` takes two
arguments:

- A callback that receives the **accumulator** (the running result so
  far) and the **current** element, and returns the *new* accumulator
  value for the next iteration.
- An **initial value** — the accumulator's starting value, used for the
  very first call (when there's no "previous" result yet).

\`\`\`js
const nums = [1, 2, 3, 4];
const sum = nums.reduce((acc, n) => acc + n, 0);
// step by step: acc starts at 0
//   acc=0, n=1 -> returns 1
//   acc=1, n=2 -> returns 3
//   acc=3, n=3 -> returns 6
//   acc=6, n=4 -> returns 10
// sum: 10
\`\`\`

Think of the accumulator as a box you're carrying through the loop,
updating on every step, and \`initialValue\` as what's in the box before
you've looked at anything. Forgetting the initial value (or picking the
wrong one) is the most common \`reduce\` bug — for a sum you start at
\`0\`, for something built by combining strings you might start at
\`""\`, for something built by combining objects you might start at
\`{}\`.

\`map\`, \`filter\`, and \`reduce\` all skip empty slots and don't mutate the
original array — they're intended to be chained: filter down to what you
want, map it into the shape you want, then reduce it to a final answer.

### \`for...of\` — iterating values directly

Sometimes you don't want a transformation or a combined value, you just
want to *do something* with each item (log it, push it somewhere else,
await something asynchronous). \`for...of\` iterates over the **values**
of anything **iterable** — arrays, strings, \`Map\`s, \`Set\`s, and more —
without any index bookkeeping:

\`\`\`js
for (const item of ["pen", "mug", "notebook"]) {
  console.log(item); // "pen", then "mug", then "notebook"
}
\`\`\`

Contrast this with \`for...in\`, which iterates over an object's **keys**
(or an array's **indices**, as strings) rather than its values:

\`\`\`js
const arr = ["a", "b", "c"];
for (const index in arr) {
  console.log(index); // "0", "1", "2" — strings, and easy to misuse
}
\`\`\`

For arrays, \`for...in\` is almost always the wrong tool — it gives you
string indices instead of values, and it can also pick up inherited
enumerable properties you didn't expect. Reach for \`for...of\` (or
\`map\`/\`filter\`/\`reduce\`) on arrays, and save \`for...in\` for the rare case
you genuinely want an object's enumerable keys.

### Iterating plain objects: \`Object.keys\`, \`Object.values\`, \`Object.entries\`

Plain objects (\`{ a: 1, b: 2 }\`) aren't iterable on their own — you can't
\`for...of\` them directly. Instead, you convert them to an array first:

- \`Object.keys(obj)\` → array of the object's key names.
- \`Object.values(obj)\` → array of the object's values.
- \`Object.entries(obj)\` → array of \`[key, value]\` pairs, which pairs
  nicely with \`for...of\` and array destructuring.

\`\`\`js
const stock = { pen: 12, mug: 4 };

for (const [item, count] of Object.entries(stock)) {
  console.log(\`\${item}: \${count}\`);
}
// "pen: 12"
// "mug: 4"
\`\`\`

Because \`Object.entries\` (and \`.keys\`/\`.values\`) return real arrays, you
can chain \`map\`/\`filter\`/\`reduce\` onto them too — the same three
building blocks work for objects once you've pulled their data out into
an array.

### Why this matters

The \`summarizeOrders\` challenge is exactly this toolkit in miniature:
\`reduce\` to add up every order's \`qty\` into one total, \`reduce\` again to
combine \`qty * price\` across every order into a total cost, and \`map\`
(paired with a \`Set\` to dedupe) to pull out the unique item names in the
order they first appeared. Once you see "sum everything" as a \`reduce\`
and "pull one field out of every item" as a \`map\`, the implementation
almost writes itself — no index variables, no accumulator declared three
lines above where it's used.
`.trim(),
  codeExamples: [
    {
      title: "Chaining filter -> map -> reduce",
      code: `const orders = [
  { item: "pen", qty: 2, price: 1.5, inStock: true },
  { item: "mug", qty: 1, price: 8, inStock: false },
  { item: "notebook", qty: 3, price: 4, inStock: true },
];

const availableTotal = orders
  .filter((order) => order.inStock) // keep only in-stock orders
  .map((order) => order.qty * order.price) // transform to line totals
  .reduce((sum, lineTotal) => sum + lineTotal, 0); // combine into one number

console.log(availableTotal); // 2*1.5 + 3*4 = 15`,
    },
    {
      title: "Object.entries for iterating a plain object",
      code: `const inventory = { pen: 12, mug: 4, notebook: 7 };

const lowStock = Object.entries(inventory)
  .filter(([, count]) => count < 10)
  .map(([item]) => item);

console.log(lowStock); // ["mug", "notebook"]

// for...of pairs naturally with the [key, value] pairs entries() returns
for (const [item, count] of Object.entries(inventory)) {
  console.log(\`\${item}: \${count} in stock\`);
}`,
    },
  ],
  challenge: {
    functionName: "summarizeOrders",
    prompt: `Write summarizeOrders(orders) where orders is an array of
{ item, qty, price } objects. Using array iteration methods (reduce, map — no
manual for-loops), return { totalQty, totalCost, items }, where totalQty is
the sum of every order's qty, totalCost is the sum of qty * price across every
order, and items is the list of unique item names in the order they first
appear (use a Set to dedupe, then spread it back into an array).`,
    starterCode: `function summarizeOrders(orders) {
  // your code here
}`,
    solutionCode: `function summarizeOrders(orders) {
  const totalQty = orders.reduce((sum, order) => sum + order.qty, 0);
  const totalCost = orders.reduce((sum, order) => sum + order.qty * order.price, 0);
  const items = [...new Set(orders.map((order) => order.item))];
  return { totalQty, totalCost, items };
}`,
    testCases: [
      {
        name: "sums quantities and cost, dedupes item names",
        args: () => [[
          { item: "pen", qty: 2, price: 1.5 },
          { item: "pen", qty: 1, price: 1.5 },
          { item: "mug", qty: 1, price: 8 },
        ]],
        expected: { totalQty: 4, totalCost: 12.5, items: ["pen", "mug"] },
      },
      {
        name: "handles a single order",
        args: () => [[{ item: "notebook", qty: 3, price: 4 }]],
        expected: { totalQty: 3, totalCost: 12, items: ["notebook"] },
      },
      {
        name: "handles an empty order list",
        args: () => [[]],
        expected: { totalQty: 0, totalCost: 0, items: [] },
      },
    ],
  },
};

export default jsArrayIterationModule;
