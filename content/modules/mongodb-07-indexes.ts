import type { ModuleContent } from "@/lib/types";

const mongodbIndexes: ModuleContent = {
  id: "mongodb-indexes",
  title: "Indexes & query performance",
  category: "Aggregation & Indexing",
  order: 7,
  explanation: `
Every \`find\` and \`filter\` so far has quietly assumed MongoDB can
locate matching documents efficiently. Without help, it can't: by
default, a query has to check *every* document in the collection one
by one — a **collection scan**. An **index** is a separate,
pre-sorted data structure (a B-tree, conceptually similar to the
index at the back of a book) that lets MongoDB jump straight to the
documents that match a field's value instead of scanning everything.

\`\`\`mermaid
flowchart TD
  subgraph Scan["Collection scan (no index)"]
    Q1["Query: category = electronics"] --> S1["Check doc 1"] --> S2["Check doc 2"] --> S3["Check doc 3"] --> S4["... check every remaining doc"]
  end
  subgraph Index["Index-supported lookup"]
    Q2["Query: category = electronics"] --> I1["Look up category in index"] --> I2["Jump straight to matching docs"]
  end
\`\`\`

### Creating an index

\`\`\`js
await products.createIndex({ category: 1 }); // 1 = ascending order
\`\`\`

Now a query filtering on \`category\` can use that index instead of
scanning the whole collection. \`_id\` is indexed automatically on
every collection — that's why \`findOne({ _id: ... })\` is always fast
regardless of collection size, without you doing anything.

### Compound indexes and the prefix rule

An index can cover multiple fields, in a specific order:

\`\`\`js
await products.createIndex({ category: 1, price: -1 });
\`\`\`

This compound index can serve a query that filters on \`category\`
alone, or on \`category\` **and** \`price\` together — but *not* a query
that filters on \`price\` alone. This is the **prefix rule**: a
compound index on \`[a, b, c]\` is usable for queries filtering on
\`a\`, or \`a\` and \`b\`, or \`a\`, \`b\`, and \`c\` — but never for a query
that skips \`a\` and jumps straight to \`b\` or \`c\`. Field *order* in a
compound index is a real design decision, not a cosmetic one.

### Unique indexes

\`\`\`js
await users.createIndex({ email: 1 }, { unique: true });
\`\`\`

A unique index does double duty: it speeds up lookups by \`email\` *and*
makes MongoDB reject any insert/update that would create a duplicate
value — the same guarantee a SQL \`UNIQUE\` constraint gives you.

### Seeing whether an index is used: explain()

\`\`\`js
await products.find({ category: "electronics" }).explain();
// look for "IXSCAN" (index scan, fast) vs "COLLSCAN" (collection scan, slow)
\`\`\`

\`explain()\` reports which strategy the query planner actually chose —
the go-to tool when a query that "should" be fast isn't.

### The trade-off

Indexes aren't free: every index has to be updated on every insert,
update, and delete that touches its field(s), so more indexes mean
slower writes and more disk/memory usage, in exchange for faster
reads. The practical rule: index fields you actually filter or sort on
frequently, and no more.

### Why this matters

Query operators and filters (a few modules back) tell MongoDB *what*
to find; indexes are what make finding it fast at scale. A filter that
works correctly on a thousand documents can grind to a halt on ten
million without the right index — and the prefix rule above is
exactly the kind of detail that turns "why is this compound index not
helping" into a five-minute fix instead of a mystery.
`.trim(),
  codeExamples: [
    {
      title: "Single-field and compound indexes",
      code: `await products.createIndex({ category: 1 });
await products.createIndex({ category: 1, price: -1 }); // compound, ordered
await users.createIndex({ email: 1 }, { unique: true });`,
    },
    {
      title: "Checking whether a query used an index",
      code: `const plan = await products.find({ category: "electronics" }).explain();
// plan.queryPlanner.winningPlan shows IXSCAN (used the index)
// or COLLSCAN (scanned every document instead)`,
    },
  ],
  challenge: {
    functionName: "indexPrefixLength",
    prompt: `Write indexPrefixLength(indexFields, filterFields) implementing the
compound-index "prefix rule": a compound index can only be used for
the LEADING, CONTIGUOUS fields of the query filter that match the
index's field order.

"indexFields" is an ordered array like ["category", "price"] (the
order the index was created with). "filterFields" is an array of the
field names present in a query's filter (order doesn't matter).

Walk "indexFields" in order and count how many of them are present in
"filterFields", stopping at the first index field that ISN'T in
"filterFields" — later index fields being present doesn't help once
an earlier one is missing. Return that count (0 if even the first
index field isn't filtered on).`,
    starterCode: `function indexPrefixLength(indexFields, filterFields) {
  // your code here
}`,
    solutionCode: `function indexPrefixLength(indexFields, filterFields) {
  const filterSet = new Set(filterFields);
  let count = 0;
  for (const field of indexFields) {
    if (!filterSet.has(field)) break;
    count++;
  }
  return count;
}`,
    testCases: [
      {
        name: "filtering on just the first index field uses 1 field's worth",
        args: () => [["category", "price"], ["category"]],
        expected: 1,
      },
      {
        name: "filtering on both fields uses the full compound index",
        args: () => [["category", "price"], ["category", "price"]],
        expected: 2,
      },
      {
        name: "filtering only on a non-leading field can't use the index at all",
        args: () => [["category", "price"], ["price"]],
        expected: 0,
      },
      {
        name: "a gap in the middle stops the count early",
        args: () => [["a", "b", "c"], ["a", "c"]],
        expected: 1,
      },
      {
        name: "an empty filter can't use the index",
        args: () => [["a", "b"], []],
        expected: 0,
      },
      {
        name: "a filter covering every index field uses all of it",
        args: () => [["a", "b", "c"], ["a", "b", "c"]],
        expected: 3,
      },
    ],
  },
};

export default mongodbIndexes;
