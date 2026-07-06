import type { ModuleContent } from "@/lib/types";

const mongodbQueryOperators: ModuleContent = {
  id: "mongodb-query-operators",
  title: "Query operators ($gt, $in, $and, $or)",
  category: "Querying & CRUD",
  order: 3,
  explanation: `
The last module's filters could only ask "does this field equal this
exact value?" Real queries usually need more: "price between 20 and
100," "category is one of these three," "either this or that
condition." MongoDB answers all of these with **query operators** —
special keys (always prefixed with \`$\`) that replace a plain equality
value inside a filter.

### Comparison operators

Instead of a literal value, a field can map to an object of operators:

\`\`\`js
await products.find({ price: { $gt: 20, $lt: 100 } }).toArray();
// price > 20 AND price < 100 — multiple operators on one field are ANDed together
\`\`\`

The common ones: \`$gt\` / \`$gte\` (greater than / or equal), \`$lt\` /
\`$lte\` (less than / or equal), \`$ne\` (not equal), \`$in\` (matches any
value in an array):

\`\`\`js
await products.find({ category: { $in: ["electronics", "office"] } }).toArray();
\`\`\`

### Logical operators: $and / $or

Every filter you've seen so far already ANDs its top-level keys
together implicitly. \`$and\` and \`$or\` let you combine whole
*sub-filters* explicitly — \`$or\` in particular has no equivalent
without it, since there's no way to express "either of these" using
plain key/value pairs:

\`\`\`js
await products.find({
  $or: [{ price: { $lt: 10 } }, { featured: true }],
}).toArray();
// matches anything cheap OR anything featured, regardless of price
\`\`\`

\`$and\` is mostly useful when you need two conditions on the *same*
field that a plain object can't express (object keys must be unique,
so \`{ price: { $lt: 10 }, price: { $gt: 0 } }\` isn't valid JS) — you'd
write \`{ $and: [{ price: { $lt: 10 } }, { price: { $gt: 0 } }] }\`
instead.

### Why this matters

Every operator you'll meet from here on — in \`find\`, in
\`updateOne\`'s \`$set\`, in aggregation's \`$match\` stage — follows the
same shape: a \`$\`-prefixed key replacing what would otherwise be a
plain value, read the same way a normal object key would be. Once
comparison and logical operators feel natural, the aggregation
pipeline (a few modules from now) is mostly the same vocabulary
applied across multiple documents at once instead of one field at a
time.
`.trim(),
  codeExamples: [
    {
      title: "Comparison operators",
      code: `await products.find({ price: { $gt: 20, $lt: 100 } }).toArray();
await products.find({ category: { $in: ["electronics", "office"] } }).toArray();
await products.find({ status: { $ne: "archived" } }).toArray();`,
    },
    {
      title: "$or across unrelated fields",
      code: `await products.find({
  $or: [{ price: { $lt: 10 } }, { featured: true }],
}).toArray();`,
    },
  ],
  challenge: {
    functionName: "matchesQuery",
    prompt: `Write matchesQuery(doc, filter) that checks whether a single document
matches a MongoDB-style filter, and returns true/false.

Support these filter shapes:
- A plain value for a field means equality: { name: "Mouse" } matches
  doc.name === "Mouse".
- An object value for a field means every one of its operator keys
  must hold against doc[field]: $gt, $gte, $lt, $lte, $ne (compare
  doc[field] against the operator's value) and $in (doc[field] must be
  one of the values in the operator's array).
- A top-level "$and" key maps to an array of sub-filters — ALL must
  match (recursively).
- A top-level "$or" key maps to an array of sub-filters — AT LEAST ONE
  must match (recursively).
- All other top-level keys in "filter" are combined with AND, same as
  a plain equality filter.`,
    starterCode: `function matchesQuery(doc, filter) {
  // your code here
}`,
    solutionCode: `function matchesQuery(doc, filter) {
  return Object.keys(filter).every((key) => {
    const condition = filter[key];
    if (key === "$and") return condition.every((sub) => matchesQuery(doc, sub));
    if (key === "$or") return condition.some((sub) => matchesQuery(doc, sub));

    if (condition !== null && typeof condition === "object" && !Array.isArray(condition)) {
      return Object.keys(condition).every((op) => {
        const value = condition[op];
        switch (op) {
          case "$gt": return doc[key] > value;
          case "$gte": return doc[key] >= value;
          case "$lt": return doc[key] < value;
          case "$lte": return doc[key] <= value;
          case "$ne": return doc[key] !== value;
          case "$in": return value.includes(doc[key]);
          default: return false;
        }
      });
    }

    return doc[key] === condition;
  });
}`,
    testCases: [
      {
        name: "plain equality match",
        args: () => [{ name: "Mouse", price: 20 }, { name: "Mouse" }],
        expected: true,
      },
      {
        name: "$gt and $lt combine as a range",
        args: () => [{ price: 50 }, { price: { $gt: 20, $lt: 100 } }],
        expected: true,
      },
      {
        name: "$in matches any listed value",
        args: () => [{ category: "office" }, { category: { $in: ["electronics", "office"] } }],
        expected: true,
      },
      {
        name: "$ne excludes the matching value",
        args: () => [{ status: "archived" }, { status: { $ne: "archived" } }],
        expected: false,
      },
      {
        name: "$or matches when at least one branch is true",
        args: () => [{ price: 5, featured: false }, { $or: [{ price: { $lt: 10 } }, { featured: true }] }],
        expected: true,
      },
      {
        name: "$and requires every branch to be true",
        args: () => [{ price: 5, featured: false }, { $and: [{ price: { $lt: 10 } }, { featured: true }] }],
        expected: false,
      },
      {
        name: "top-level fields and operators combine with implicit AND",
        args: () => [{ price: 50, category: "electronics" }, { price: { $gte: 50 }, category: "electronics" }],
        expected: true,
      },
    ],
  },
};

export default mongodbQueryOperators;
