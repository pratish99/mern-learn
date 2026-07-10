import type { ModuleContent } from "@/lib/types";

const mongodbRelationships: ModuleContent = {
  id: "mongodb-relationships",
  title: "Relationships: embedding vs referencing",
  category: "Schema Design & Modeling",
  order: 6,
  explanation: `
The last module ended with a rule of thumb — embed data that's small,
bounded, and always read together. This module turns that into an
actual decision: for any relationship between two kinds of data, do
you **embed** one inside the other, or **reference** it by \`_id\` and
join at query time?

### Embedding: one document holds the related data

\`\`\`js
{
  _id: 1,
  title: "Wireless Keyboard",
  price: 49,
  reviews: [
    { author: "Ada", rating: 5, text: "Great!" },
    { author: "Bo", rating: 4, text: "Solid." },
  ],
}
\`\`\`

One query (\`findOne\`) gets the product *and* its reviews — no join
needed. This works well when the embedded data is small, bounded, and
you basically never need it without its parent (you'd never query
"reviews" as their own top-level resource here).

### Referencing: store an \`_id\`, look it up separately

\`\`\`js
// orders collection
{ _id: 501, userId: 10, total: 99.99 }

// users collection
{ _id: 10, name: "Ada", email: "ada@example.com" }
\`\`\`

An order stores the *id* of its user, not a copy of the user document.
Getting the full picture takes two queries (or a \`$lookup\`, covered
in a later module) — more work than embedding, but it avoids
duplicating the user's data across every order they've ever placed,
and it avoids the unbounded-array problem: a heavily-ordering customer
doesn't make any single document grow.

### Choosing between them

| Use embedding when...                          | Use referencing when...                        |
|-------------------------------------------------|-------------------------------------------------|
| The related data is small and bounded            | The related data is large or unbounded          |
| It's always read together with the parent        | It's often queried/updated independently        |
| It rarely changes independently of the parent     | Many documents need to share the same data      |

A product's reviews (usually a handful, always shown with the product)
lean toward embedding. A user's orders (potentially thousands over
time, often listed on their own) lean toward referencing. Most real
schemas end up as a mix of both, decided field by field.

\`\`\`mermaid
erDiagram
  PRODUCT ||--o{ REVIEW : embeds
  USER ||--o{ ORDER : references
\`\`\`

The \`PRODUCT\`-\`REVIEW\` relationship above is a one-to-many that's
**embedded** (reviews live inside the product document, as shown
earlier). The \`USER\`-\`ORDER\` relationship is also one-to-many, but
**referenced** (each order stores a \`userId\` pointing back at its
user). Same shape of relationship, two different storage strategies —
the deciding factor is the table above, not the cardinality itself.

### One-to-many and many-to-many both use references the same way

A single reference field (\`order.userId\`) models one-to-many (many
orders, one user each). An **array** of reference ids
(\`team.memberIds: [10, 20, 30]\`) models many-to-many the same way,
just with an array instead of a single value — the lookup logic on
the other end barely changes.

### Why this matters

Embedding vs. referencing is the single most consequential decision in
a MongoDB schema — it's much harder to change after the fact than
adding a field. Recognizing "is this bounded and always read
together?" as the deciding question, rather than reaching for
normalization out of SQL habit, is what separates a schema that scales
from one that needs a painful migration in six months.
`.trim(),
  codeExamples: [
    {
      title: "Embedding: reviews travel with the product",
      code: `{
  _id: 1,
  title: "Wireless Keyboard",
  reviews: [{ author: "Ada", rating: 5, text: "Great!" }],
}
// one findOne({ _id: 1 }) returns the product AND its reviews`,
    },
    {
      title: "Referencing: an order points at a user by id",
      code: `// orders collection
{ _id: 501, userId: 10, total: 99.99 }

// a separate query resolves the reference
const order = await orders.findOne({ _id: 501 });
const user = await users.findOne({ _id: order.userId });`,
    },
  ],
  challenge: {
    functionName: "populateReference",
    prompt: `Write populateReference(doc, field, foreignCollection, as) that
resolves a reference field on "doc" against "foreignCollection" (an
array of documents, each with an "_id"), similar to what Mongoose's
.populate() does.

- If doc[field] is an array of ids (a many-to-many reference), return
  a new document with doc[as] set to an array of the matching foreign
  documents, in the same order as the ids. An id with no match becomes
  null in that position.
- Otherwise (a single id, many-to-one or one-to-one reference), return
  a new document with doc[as] set to the single matching foreign
  document, or null if there's no match.

The original reference field (doc[field]) must remain on the returned
document alongside the new "as" field. Do not mutate "doc".`,
    starterCode: `function populateReference(doc, field, foreignCollection, as) {
  // your code here
}`,
    solutionCode: `function populateReference(doc, field, foreignCollection, as) {
  const value = doc[field];
  if (Array.isArray(value)) {
    const resolved = value.map((id) => foreignCollection.find((f) => f._id === id) ?? null);
    return { ...doc, [as]: resolved };
  }
  const resolved = foreignCollection.find((f) => f._id === value) ?? null;
  return { ...doc, [as]: resolved };
}`,
    testCases: [
      {
        name: "resolves a single reference (many-to-one)",
        args: () => [{ _id: 10, userId: 1 }, "userId", [{ _id: 1, name: "Ada" }, { _id: 2, name: "Bo" }], "user"],
        expected: { _id: 10, userId: 1, user: { _id: 1, name: "Ada" } },
      },
      {
        name: "a missing single reference resolves to null",
        args: () => [{ _id: 10, userId: 99 }, "userId", [{ _id: 1, name: "Ada" }], "user"],
        expected: { _id: 10, userId: 99, user: null },
      },
      {
        name: "resolves an array of references, preserving order",
        args: () => [
          { _id: 10, memberIds: [1, 2] },
          "memberIds",
          [{ _id: 1, name: "Ada" }, { _id: 2, name: "Bo" }],
          "members",
        ],
        expected: { _id: 10, memberIds: [1, 2], members: [{ _id: 1, name: "Ada" }, { _id: 2, name: "Bo" }] },
      },
      {
        name: "an id in the array with no match becomes null in that position",
        args: () => [{ _id: 10, memberIds: [1, 99] }, "memberIds", [{ _id: 1, name: "Ada" }], "members"],
        expected: { _id: 10, memberIds: [1, 99], members: [{ _id: 1, name: "Ada" }, null] },
      },
      {
        name: "the original reference field is kept alongside the resolved field",
        args: () => [{ _id: 10, userId: 1, total: 99 }, "userId", [{ _id: 1, name: "Ada" }], "user"],
        expected: { _id: 10, userId: 1, total: 99, user: { _id: 1, name: "Ada" } },
      },
    ],
  },
};

export default mongodbRelationships;
