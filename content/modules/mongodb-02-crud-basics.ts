import type { ModuleContent } from "@/lib/types";

const mongodbCrudBasics: ModuleContent = {
  id: "mongodb-crud-basics",
  title: "CRUD basics: insert, find, update, delete",
  category: "Fundamentals",
  order: 2,
  explanation: `
The previous module covered \`insertOne\`. The rest of everyday MongoDB
work is three more operations — read, update, delete — plus one idea
that ties all of them together: the **filter**.

### The filter object

Every read, update, and delete operation takes a filter: a plain
object describing which documents to target. A filter's keys are
field names, and its values are what those fields must equal — every
key in the filter must match for a document to be selected (an
implicit AND):

\`\`\`js
{ category: "electronics" }              // category must equal "electronics"
{ category: "electronics", price: 49 }   // both must match
{}                                        // matches every document
\`\`\`

(The next module covers filters that compare with \`$gt\`, \`$in\`, etc.
instead of plain equality — for now, equality is enough to read every
other CRUD method.)

### Reading: find vs findOne

\`\`\`js
await products.find({ category: "electronics" }).toArray(); // all matches, as an array
await products.findOne({ _id: 1 });                          // one document, or null
\`\`\`

\`find\` returns a **cursor** (\`.toArray()\` drains it into a plain
array); \`findOne\` returns a single document or \`null\` if nothing
matched — never an array, and never throws just because nothing was
found.

### Updating: updateOne and $set

\`\`\`js
await products.updateOne({ _id: 1 }, { $set: { price: 39 } });
\`\`\`

The first argument is the filter (which document(s) to touch — by
default only the *first* match); the second is an **update document**,
not a replacement. \`$set\` means "change just these fields, leave
everything else on the document alone" — a crucial distinction from
overwriting the whole document.

### Deleting: deleteOne

\`\`\`js
await products.deleteOne({ _id: 1 });
\`\`\`

Same filter-first shape as everything else. If no document matches,
this quietly does nothing (it doesn't throw) — the result object tells
you \`deletedCount: 0\` if you want to check.

### Why this matters

Insert, find, update, and delete are four different verbs, but they
all share the same filter vocabulary. Once you're fluent in "describe
the documents you want with a plain object," you can already read
almost any snippet of MongoDB code you'll come across — the only thing
that changes between methods is what happens to the documents the
filter matches.
`.trim(),
  codeExamples: [
    {
      title: "The full CRUD set on one collection",
      code: `const products = db.collection("products");

await products.insertOne({ name: "Keyboard", price: 49 });
const all = await products.find({}).toArray();
const one = await products.findOne({ name: "Keyboard" });
await products.updateOne({ name: "Keyboard" }, { $set: { price: 39 } });
await products.deleteOne({ name: "Keyboard" });`,
    },
    {
      title: "$set only touches the fields you name",
      code: `// document before: { _id: 1, name: "Keyboard", price: 49, category: "electronics" }
await products.updateOne({ _id: 1 }, { $set: { price: 39 } });
// document after:  { _id: 1, name: "Keyboard", price: 39, category: "electronics" }
// "name" and "category" were never touched`,
    },
  ],
  challenge: {
    functionName: "findDocuments",
    prompt: `Write findDocuments(collection, filter) that simulates find(filter)
over an in-memory "collection" (an array of documents), using
equality-only matching: a document matches if, for every key in
"filter", doc[key] === filter[key]. An empty filter object matches
every document. Return an array of the matching documents, in their
original order.`,
    starterCode: `function findDocuments(collection, filter) {
  // your code here
}`,
    solutionCode: `function findDocuments(collection, filter) {
  const keys = Object.keys(filter);
  return collection.filter((doc) => keys.every((key) => doc[key] === filter[key]));
}`,
    testCases: [
      {
        name: "filters by a single field",
        args: () => [
          [
            { _id: 1, name: "Keyboard", category: "electronics" },
            { _id: 2, name: "Mouse", category: "electronics" },
            { _id: 3, name: "Desk", category: "furniture" },
          ],
          { category: "electronics" },
        ],
        expected: [
          { _id: 1, name: "Keyboard", category: "electronics" },
          { _id: 2, name: "Mouse", category: "electronics" },
        ],
      },
      {
        name: "an empty filter returns every document",
        args: () => [[{ _id: 1, name: "Keyboard" }, { _id: 2, name: "Mouse" }], {}],
        expected: [{ _id: 1, name: "Keyboard" }, { _id: 2, name: "Mouse" }],
      },
      {
        name: "multiple filter fields are combined with AND",
        args: () => [
          [
            { _id: 1, name: "Keyboard", category: "electronics" },
            { _id: 2, name: "Mouse", category: "electronics" },
          ],
          { category: "electronics", name: "Mouse" },
        ],
        expected: [{ _id: 2, name: "Mouse", category: "electronics" }],
      },
      {
        name: "no match returns an empty array",
        args: () => [[{ _id: 1, category: "electronics" }], { category: "toys" }],
        expected: [],
      },
      {
        name: "a field the documents don't have excludes everything",
        args: () => [[{ _id: 1, category: "electronics" }], { inStock: true }],
        expected: [],
      },
    ],
  },
};

export default mongodbCrudBasics;
