import type { ModuleContent } from "@/lib/types";

const mongodbAggregationPipeline: ModuleContent = {
  id: "mongodb-aggregation-pipeline",
  title: "Aggregation pipeline: $match, $group, $sort",
  category: "Aggregation & Indexing",
  order: 8,
  explanation: `
\`find\` answers "which documents match?" It can't answer "what's the
total sales per category?" — that requires combining many documents
into a summary, which is a different kind of operation entirely. The
**aggregation pipeline** is MongoDB's tool for that: an array of
**stages**, each one transforming the stream of documents that comes
out of the stage before it, exactly like piping commands together in a
shell.

### A pipeline is just stages in order

\`\`\`js
await orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  { $sort: { total: -1 } },
]).toArray();
\`\`\`

Read it top to bottom: keep only completed orders, then group what's
left by category (computing a running total and a count per group),
then sort the groups by total, highest first. Each stage only ever
sees the *output* of the previous one — \`$group\` never sees the
orders that \`$match\` already filtered out.

### $match: filtering, as a stage

\`{ $match: { status: "completed" } }\` uses the exact same filter
syntax as \`find\` — it's the familiar filter object, just written as a
pipeline stage so it can be combined with the stages below.

### $group: collapsing many documents into one per key

\`{ $group: { _id: "$category", total: { $sum: "$amount" } } }\` creates
one output document per distinct value of the grouping expression
(here, each distinct \`category\`). \`"$category"\` — a string starting
with \`$\` — means "the value of this field on each document," the same
way a template literal might reference a variable. The fields besides
\`_id\` are **accumulators**: \`$sum\` adds up a field across the group
(or just counts documents, if you sum the literal \`1\`), \`$avg\`
averages a field across the group. Grouping by \`_id: null\` collapses
*everything* into a single summary document.

### $sort and $limit, same as before

These behave exactly like \`.sort()\`/\`.limit()\` on a \`find\` cursor —
they're just written as pipeline stages so they can slot in after a
\`$group\` has reshaped the data (you can't \`.sort()\` a \`find\` cursor
by a field that only exists after grouping).

### Why this matters

The aggregation pipeline is how "reporting" queries — totals,
averages, top-N lists, dashboards — get built without pulling every
document back into your application and computing the summary in
JavaScript. Once \`$match\`/\`$group\`/\`$sort\` feel natural, the next
module's \`$lookup\`/\`$unwind\` are just two more stages in the same
pipeline, letting you join in data from another collection mid-stream.
`.trim(),
  codeExamples: [
    {
      title: "Total and count per category",
      code: `await orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  { $sort: { total: -1 } },
]).toArray();
// [{ _id: "electronics", total: 1250, count: 8 }, { _id: "office", total: 300, count: 3 }]`,
    },
    {
      title: "Grouping everything into one summary document",
      code: `await orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
]).toArray();
// [{ _id: null, totalRevenue: 1550 }]`,
    },
  ],
  challenge: {
    functionName: "runPipeline",
    prompt: `Write runPipeline(docs, pipeline) implementing a small aggregation
engine over an in-memory array of documents. "pipeline" is an array of
stages, applied in order, each stage's output feeding the next:

- { $match: filter } — keep only documents where every key in "filter"
  equals the document's value for that key (plain equality, like the
  find filters from an earlier module).
- { $group: { _id: groupExpr, ...accumulators } } — groupExpr is
  either null (one group for everything) or a string like "$category"
  (group by doc.category). Each other key is an accumulator with
  either { $sum: "$field" } (sum that field across the group),
  { $sum: 1 } (count documents in the group), or { $avg: "$field" }
  (average that field across the group). Output one document per
  group: { _id: <group key>, ...computed accumulator fields }, groups
  in the order their key was first encountered.
- { $sort: { field: 1 | -1 } } — sort ascending (1) or descending (-1)
  by "field".
- { $limit: n } — keep only the first n documents.

Return the final array of documents after all stages have run.`,
    starterCode: `function runPipeline(docs, pipeline) {
  // your code here
}`,
    solutionCode: `function runPipeline(docs, pipeline) {
  let data = docs;

  for (const stage of pipeline) {
    if (stage.$match) {
      const filter = stage.$match;
      const keys = Object.keys(filter);
      data = data.filter((doc) => keys.every((key) => doc[key] === filter[key]));
    } else if (stage.$group) {
      const spec = stage.$group;
      const groups = new Map();

      for (const doc of data) {
        const key = spec._id === null ? null : doc[spec._id.slice(1)];
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(doc);
      }

      data = Array.from(groups.entries()).map(([key, groupDocs]) => {
        const result = { _id: key };
        for (const [field, accumulator] of Object.entries(spec)) {
          if (field === "_id") continue;
          const [op, expr] = Object.entries(accumulator)[0];
          if (op === "$sum") {
            result[field] = expr === 1
              ? groupDocs.length
              : groupDocs.reduce((sum, d) => sum + d[expr.slice(1)], 0);
          } else if (op === "$avg") {
            const total = groupDocs.reduce((sum, d) => sum + d[expr.slice(1)], 0);
            result[field] = total / groupDocs.length;
          }
        }
        return result;
      });
    } else if (stage.$sort) {
      const [field, direction] = Object.entries(stage.$sort)[0];
      data = [...data].sort((a, b) => (a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0) * direction);
    } else if (stage.$limit !== undefined) {
      data = data.slice(0, stage.$limit);
    }
  }

  return data;
}`,
    testCases: [
      {
        name: "$match filters out non-matching documents",
        args: () => [
          [
            { category: "a", amount: 10, status: "completed" },
            { category: "a", amount: 20, status: "completed" },
            { category: "b", amount: 5, status: "completed" },
            { category: "b", amount: 100, status: "pending" },
          ],
          [{ $match: { status: "completed" } }],
        ],
        expected: [
          { category: "a", amount: 10, status: "completed" },
          { category: "a", amount: 20, status: "completed" },
          { category: "b", amount: 5, status: "completed" },
        ],
      },
      {
        name: "$group with $sum totals a field per group",
        args: () => [
          [
            { category: "a", amount: 10, status: "completed" },
            { category: "a", amount: 20, status: "completed" },
            { category: "b", amount: 5, status: "completed" },
            { category: "b", amount: 100, status: "pending" },
          ],
          [{ $match: { status: "completed" } }, { $group: { _id: "$category", total: { $sum: "$amount" } } }],
        ],
        expected: [{ _id: "a", total: 30 }, { _id: "b", total: 5 }],
      },
      {
        name: "$sum: 1 counts documents per group",
        args: () => [
          [
            { category: "a", amount: 10 },
            { category: "a", amount: 20 },
            { category: "b", amount: 5 },
            { category: "b", amount: 100 },
          ],
          [{ $group: { _id: "$category", count: { $sum: 1 } } }],
        ],
        expected: [{ _id: "a", count: 2 }, { _id: "b", count: 2 }],
      },
      {
        name: "$avg averages a field per group",
        args: () => [
          [
            { category: "a", amount: 10, status: "completed" },
            { category: "a", amount: 20, status: "completed" },
            { category: "b", amount: 5, status: "completed" },
            { category: "b", amount: 100, status: "pending" },
          ],
          [{ $match: { status: "completed" } }, { $group: { _id: "$category", avgAmount: { $avg: "$amount" } } }],
        ],
        expected: [{ _id: "a", avgAmount: 15 }, { _id: "b", avgAmount: 5 }],
      },
      {
        name: "$sort reorders groups after $group",
        args: () => [
          [
            { category: "a", amount: 5 },
            { category: "b", amount: 50 },
          ],
          [{ $group: { _id: "$category", total: { $sum: "$amount" } } }, { $sort: { total: -1 } }],
        ],
        expected: [{ _id: "b", total: 50 }, { _id: "a", total: 5 }],
      },
      {
        name: "$limit caps the number of results",
        args: () => [
          [
            { category: "a", amount: 10 },
            { category: "b", amount: 5 },
          ],
          [{ $limit: 1 }],
        ],
        expected: [{ category: "a", amount: 10 }],
      },
    ],
  },
};

export default mongodbAggregationPipeline;
