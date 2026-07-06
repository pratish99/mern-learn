import type { ModuleContent } from "@/lib/types";

const mongodbProjectionsSorting: ModuleContent = {
  id: "mongodb-projections-sorting",
  title: "Projections, sorting & pagination",
  category: "Querying & CRUD",
  order: 4,
  explanation: `
Filters (the last two modules) decide *which* documents come back. The
rest of a query is about shaping that result: which *fields* you get
back, what *order* they arrive in, and how many you get at once.

### Projections: choosing fields

By default, \`find\` returns whole documents. A **projection** — a
second argument to \`find\` — lets you ask for only the fields you
actually need, which matters once documents get large:

\`\`\`js
await products.find({}, { projection: { name: 1, price: 1, _id: 0 } }).toArray();
// -> [{ name: "Keyboard", price: 49 }, ...] — every other field is dropped
\`\`\`

\`1\` means "include this field," \`0\` means "exclude it." You can mix
inclusion with excluding \`_id\` specifically (it's included by
default), but you generally can't mix inclusion and exclusion for
other fields in the same projection — pick one mode or the other.

### Sorting

\`\`\`js
await products.find().sort({ price: -1 }).toArray(); // most expensive first
\`\`\`

\`1\` means ascending, \`-1\` means descending. Sorting on a field that
isn't indexed (covered a few modules from now) means MongoDB has to
load and sort every matching document in memory — fine for small
result sets, worth watching for large ones.

### Pagination: skip and limit

\`\`\`js
await products.find().sort({ price: -1 }).skip(20).limit(10).toArray();
// page 3, 10 results per page
\`\`\`

\`limit\` caps how many documents come back; \`skip\` throws away that
many documents from the front of the (already sorted) result before
applying the limit. Together they're the standard way to paginate: page
\`n\` (1-indexed, page size \`p\`) is \`skip((n - 1) * p).limit(p)\`.

\`skip\` has a real cost worth knowing about: MongoDB still has to walk
past every skipped document internally, so \`skip(100000)\` on a huge
collection is noticeably slower than \`skip(10)\` — it doesn't jump
straight to an offset the way an array index would.

### Why this matters

Sort, skip, and limit compose in a fixed pipeline order — filter, then
sort, then skip, then limit — and getting that order backwards
(imagine limiting *before* sorting) would silently produce the wrong
page of results. Internalizing that fixed order now pays off directly
in the aggregation pipeline modules ahead, which are built from
exactly these same building blocks, explicitly ordered as pipeline
stages.
`.trim(),
  codeExamples: [
    {
      title: "Projection: only the fields you need",
      code: `await products.find({}, { projection: { name: 1, price: 1, _id: 0 } }).toArray();
// [{ name: "Keyboard", price: 49 }, { name: "Mouse", price: 20 }, ...]`,
    },
    {
      title: "Sort, skip, and limit chained together",
      code: `await products
  .find()
  .sort({ price: -1 })
  .skip(20)  // page 3
  .limit(10) // 10 per page
  .toArray();`,
    },
  ],
  challenge: {
    functionName: "sortAndPaginate",
    prompt: `Write sortAndPaginate(collection, sort, skip, limit) that simulates
.find().sort(...).skip(...).limit(...) over an in-memory "collection"
(an array of documents).

"sort" is { field, direction } where direction is 1 (ascending) or -1
(descending), comparing documents by doc[field]. After sorting, skip
the first "skip" documents, then return at most "limit" of what
remains (fewer if the collection doesn't have that many left). Do not
mutate the original "collection" array.`,
    starterCode: `function sortAndPaginate(collection, sort, skip, limit) {
  // your code here
}`,
    solutionCode: `function sortAndPaginate(collection, sort, skip, limit) {
  const docs = [...collection].sort((a, b) => {
    if (a[sort.field] < b[sort.field]) return -1 * sort.direction;
    if (a[sort.field] > b[sort.field]) return 1 * sort.direction;
    return 0;
  });
  return docs.slice(skip, skip + limit);
}`,
    testCases: [
      {
        name: "sorts ascending by the given field",
        args: () => [
          [
            { _id: 1, name: "A", price: 30 },
            { _id: 2, name: "B", price: 10 },
            { _id: 3, name: "C", price: 20 },
          ],
          { field: "price", direction: 1 },
          0,
          10,
        ],
        expected: [
          { _id: 2, name: "B", price: 10 },
          { _id: 3, name: "C", price: 20 },
          { _id: 1, name: "A", price: 30 },
        ],
      },
      {
        name: "sorts descending by the given field",
        args: () => [
          [
            { _id: 1, name: "A", price: 30 },
            { _id: 2, name: "B", price: 10 },
            { _id: 3, name: "C", price: 20 },
          ],
          { field: "price", direction: -1 },
          0,
          10,
        ],
        expected: [
          { _id: 1, name: "A", price: 30 },
          { _id: 3, name: "C", price: 20 },
          { _id: 2, name: "B", price: 10 },
        ],
      },
      {
        name: "skip and limit select the middle page",
        args: () => [
          [
            { _id: 1, price: 30 },
            { _id: 2, price: 10 },
            { _id: 3, price: 20 },
          ],
          { field: "price", direction: 1 },
          1,
          1,
        ],
        expected: [{ _id: 3, price: 20 }],
      },
      {
        name: "a limit larger than what's left just returns the rest",
        args: () => [
          [
            { _id: 1, price: 30 },
            { _id: 2, price: 10 },
          ],
          { field: "price", direction: 1 },
          1,
          10,
        ],
        expected: [{ _id: 1, price: 30 }],
      },
      {
        name: "skipping past the end returns an empty array",
        args: () => [[{ _id: 1, price: 30 }], { field: "price", direction: 1 }, 10, 5],
        expected: [],
      },
    ],
  },
};

export default mongodbProjectionsSorting;
