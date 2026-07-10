import type { ModuleContent } from "@/lib/types";

const mongodbDocumentsCollections: ModuleContent = {
  id: "mongodb-documents-collections",
  title: "Documents, collections & BSON",
  category: "Fundamentals",
  order: 1,
  explanation: `
Everything so far — Node, Express, React — has been about the parts of
an app that live in memory and disappear when the process restarts.
MongoDB is where the data actually persists. It's a **document
database**: instead of rows in fixed-column tables (the relational/SQL
model), MongoDB stores **documents** — JSON-like objects — grouped
into **collections**.

\`\`\`mermaid
flowchart TD
  DB["Database: shop"] --> C1["Collection: products"]
  DB --> C2["Collection: users"]
  C1 --> D1["Document (BSON): { _id, name: Keyboard, price: 49 }"]
  C1 --> D2["Document (BSON): { _id, name: Notebook, color: red }"]
  C2 --> D3["Document (BSON): { _id, name: Ada }"]
\`\`\`

### Documents are just (BSON) objects

A document looks exactly like a JavaScript object literal:

\`\`\`js
{
  _id: ObjectId("64f1a2b3c4d5e6f7a8b9c0d1"),
  name: "Keyboard",
  price: 49,
  tags: ["electronics", "input"],
}
\`\`\`

Under the hood it's stored as **BSON** (Binary JSON) — a binary-encoded
superset of JSON that adds types JSON can't represent natively, like
dates, binary data, and a dedicated \`ObjectId\` type. You never deal
with BSON bytes directly; the driver encodes/decodes it for you, so
from your code's perspective a document is just a plain object.

### The \`_id\` field

Every document has an \`_id\` field that uniquely identifies it within
its collection — MongoDB's equivalent of a primary key. If you don't
supply one on insert, MongoDB generates a 12-byte \`ObjectId\`
(timestamp + machine/process identifier + counter) automatically. You
*can* supply your own \`_id\` (a string, a number, anything comparable)
instead, and MongoDB will use that rather than generating one.

### Collections group documents, loosely

A **collection** is a named group of documents — roughly analogous to
a SQL table — but MongoDB does not enforce that every document in a
collection has the same shape. This document...

\`\`\`js
{ _id: 1, name: "Keyboard", price: 49, category: "electronics" }
\`\`\`

...and this one...

\`\`\`js
{ _id: 2, name: "Notebook", price: 3, color: "red" }
\`\`\`

...can coexist in the same \`products\` collection even though one has
a \`category\` field and no \`color\`, and the other has the reverse.
This is what people mean by MongoDB being "schema-less" — the
*database* won't stop you from inserting mismatched shapes. That
flexibility is powerful (you can evolve your data model without a
migration), but it also means **your application code** is the only
thing enforcing consistency, a theme the next few modules keep coming
back to.

### Why this matters

Almost every operation you'll learn from here on — \`find\`,
\`updateOne\`, aggregation pipelines, indexes — is fundamentally about
locating and transforming documents inside a collection. Getting the
mental model right early (a collection is an array-like bag of
JSON-ish objects, each identified by \`_id\`) makes everything that
follows read as "yet another way to filter/reshape that array," not a
brand-new paradigm.
`.trim(),
  codeExamples: [
    {
      title: "Connecting and inserting a document",
      code: `const { MongoClient } = require("mongodb");
const client = new MongoClient(uri);
const db = client.db("shop");
const products = db.collection("products");

await products.insertOne({
  name: "Keyboard",
  price: 49,
  tags: ["electronics", "input"],
});
// MongoDB assigns _id automatically since we didn't provide one`,
    },
    {
      title: "Mismatched shapes in the same collection",
      code: `await products.insertOne({ name: "Keyboard", price: 49, category: "electronics" });
await products.insertOne({ name: "Sticker", price: 2, color: "red" });
// Both documents live in "products" — MongoDB never compares their shapes`,
    },
  ],
  challenge: {
    functionName: "insertDocument",
    prompt: `Write insertDocument(collection, doc, nextId) that simulates the
MongoDB driver's insertOne behavior on an in-memory "collection" (an
array of documents).

- If "doc" already has an "_id" property, insert it into the
  collection unchanged.
- Otherwise, insert a new document equal to "doc" plus an "_id" field
  set to "nextId".

Return { collection, insertedId } where "collection" is a NEW array
(the original collection plus the inserted document) and "insertedId"
is the "_id" of the document that was inserted. Do not mutate the
original "collection" array.`,
    starterCode: `function insertDocument(collection, doc, nextId) {
  // your code here
}`,
    solutionCode: `function insertDocument(collection, doc, nextId) {
  const toInsert = doc._id !== undefined ? doc : { ...doc, _id: nextId };
  return { collection: [...collection, toInsert], insertedId: toInsert._id };
}`,
    testCases: [
      {
        name: "assigns nextId as _id when the document has none",
        args: () => [[], { name: "Keyboard", price: 49 }, 1],
        expected: { collection: [{ name: "Keyboard", price: 49, _id: 1 }], insertedId: 1 },
      },
      {
        name: "keeps an explicit _id untouched",
        args: () => [[], { _id: "abc", name: "Mouse" }, 5],
        expected: { collection: [{ _id: "abc", name: "Mouse" }], insertedId: "abc" },
      },
      {
        name: "appends to an existing collection without mutating it",
        args: () => [[{ _id: 1, name: "Keyboard" }], { name: "Mouse" }, 2],
        expected: { collection: [{ _id: 1, name: "Keyboard" }, { _id: 2, name: "Mouse" }], insertedId: 2 },
      },
      {
        name: "documents with different shapes coexist fine",
        args: () => [[{ _id: 1, name: "Keyboard", price: 49 }], { name: "Sticker", color: "red" }, 2],
        expected: {
          collection: [
            { _id: 1, name: "Keyboard", price: 49 },
            { _id: 2, name: "Sticker", color: "red" },
          ],
          insertedId: 2,
        },
      },
    ],
  },
};

export default mongodbDocumentsCollections;
