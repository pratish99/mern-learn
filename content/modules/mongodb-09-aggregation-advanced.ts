import type { ModuleContent } from "@/lib/types";

const mongodbAggregationAdvanced: ModuleContent = {
  id: "mongodb-aggregation-advanced",
  title: "Aggregation joins: $lookup & $unwind",
  category: "Aggregation & Indexing",
  order: 9,
  explanation: `
The relationships module described referencing — storing an \`_id\`
and resolving it with a second query. \`$lookup\` is the aggregation
pipeline's built-in way to do that resolution *inside* MongoDB, in one
round trip, instead of your application code issuing a second query by
hand.

### $lookup: joining in another collection

\`\`\`js
await orders.aggregate([
  { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
]).toArray();
\`\`\`

For every order, this finds all documents in \`users\` where
\`_id === order.userId\`, and attaches them as an **array** in a new
\`user\` field — even if you know there's at most one match, \`$lookup\`
always produces an array, because in general the join could match
zero, one, or many foreign documents.

### $unwind: turning that array into individual documents

An array field is awkward to work with further down the pipeline (or
in your application code) when you know there's really one match per
order. \`$unwind\` flattens it: it takes an array field and produces
one output document per array element, with the field replaced by
that single element instead of the whole array:

\`\`\`js
await orders.aggregate([
  { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
  { $unwind: "$user" },
]).toArray();
// each order's "user" field is now a single object, not a one-item array
\`\`\`

By default, \`$unwind\` **drops** any document whose array was empty
(no match found) — there's nothing to "unwind" into, so it produces
zero output documents for that input document. This mirrors an inner
join in SQL, not a left join; MongoDB's \`$unwind\` does support an
option to keep unmatched documents instead, if you need that.

### One-to-many joins fan out

If the join can match multiple foreign documents (say, joining tags by
category instead of by a unique id), \`$unwind\` produces one output
document *per match* — the same input document appears multiple times
in the output, once per element it was unwound from.

### Why this matters

\`$lookup\` + \`$unwind\` is the aggregation pipeline's answer to "give
me orders with their user's name already attached" without a second
round trip from your application — the same shape of problem a SQL
\`JOIN\` solves, expressed as two composable pipeline stages instead of
a single query clause.
`.trim(),
  codeExamples: [
    {
      title: "Joining orders to their user",
      code: `await orders.aggregate([
  { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
  { $unwind: "$user" },
  { $project: { total: 1, "user.name": 1 } },
]).toArray();
// [{ _id: 501, total: 99.99, user: { name: "Ada" } }, ...]`,
    },
    {
      title: "An order with no matching user is dropped by $unwind",
      code: `// order { userId: 999 } has no match in "users"
// after $lookup: { userId: 999, user: [] }
// after $unwind: this document disappears from the output entirely`,
    },
  ],
  challenge: {
    functionName: "joinAndFlatten",
    prompt: `Write joinAndFlatten(docs, foreignCollection, localField, foreignField,
as), simulating a $lookup immediately followed by $unwind.

For each document in "docs", find every document in
"foreignCollection" where foreignDoc[foreignField] ===
doc[localField]. For each match, produce one output document: a copy
of the original doc with an extra field "as" set to that single
matching foreign document (not an array — this is already the
"unwound" shape). If a document has zero matches, it contributes
nothing to the output. Preserve the order of "docs", and within each
document's matches, the order they appear in "foreignCollection".`,
    starterCode: `function joinAndFlatten(docs, foreignCollection, localField, foreignField, as) {
  // your code here
}`,
    solutionCode: `function joinAndFlatten(docs, foreignCollection, localField, foreignField, as) {
  const result = [];
  for (const doc of docs) {
    const matches = foreignCollection.filter((f) => f[foreignField] === doc[localField]);
    for (const match of matches) {
      result.push({ ...doc, [as]: match });
    }
  }
  return result;
}`,
    testCases: [
      {
        name: "a one-to-one join embeds a single object, not an array",
        args: () => [
          [{ _id: 1, userId: 10, total: 99 }],
          [{ _id: 10, name: "Ada" }],
          "userId",
          "_id",
          "user",
        ],
        expected: [{ _id: 1, userId: 10, total: 99, user: { _id: 10, name: "Ada" } }],
      },
      {
        name: "no match drops the document entirely",
        args: () => [
          [{ _id: 1, userId: 99, total: 5 }],
          [{ _id: 10, name: "Ada" }],
          "userId",
          "_id",
          "user",
        ],
        expected: [],
      },
      {
        name: "a one-to-many join fans out into multiple documents",
        args: () => [
          [{ _id: 1, category: "a" }],
          [
            { _id: 100, category: "a", name: "x" },
            { _id: 101, category: "a", name: "y" },
          ],
          "category",
          "category",
          "tag",
        ],
        expected: [
          { _id: 1, category: "a", tag: { _id: 100, category: "a", name: "x" } },
          { _id: 1, category: "a", tag: { _id: 101, category: "a", name: "y" } },
        ],
      },
      {
        name: "multiple input documents each join independently",
        args: () => [
          [{ _id: 1, userId: 10 }, { _id: 2, userId: 20 }],
          [{ _id: 10, name: "A" }, { _id: 20, name: "B" }],
          "userId",
          "_id",
          "user",
        ],
        expected: [
          { _id: 1, userId: 10, user: { _id: 10, name: "A" } },
          { _id: 2, userId: 20, user: { _id: 20, name: "B" } },
        ],
      },
    ],
  },
};

export default mongodbAggregationAdvanced;
