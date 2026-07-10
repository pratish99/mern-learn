import type { ModuleContent } from "@/lib/types";

const mongodbSchemaDesign: ModuleContent = {
  id: "mongodb-schema-design",
  title: "Schema design & data modeling",
  category: "Schema Design & Modeling",
  order: 5,
  explanation: `
The first module mentioned that MongoDB doesn't enforce a shape on the
documents in a collection. That's a statement about the *database* —
it says nothing about whether your *application* should still design
one. It should. "Schema-less" means "the schema lives in your
application and your discipline," not "there is no schema."

### Model around your queries, not around normalization

Relational database design usually starts from normalization: split
data into small tables to avoid duplication, and join them back
together at query time. MongoDB documents encourage the opposite
starting question: **"what does a single screen/API response need to
show, and can that be one document?"** If a product page always shows
the product's reviews together, storing reviews embedded inside the
product document can mean one query instead of a join. This is a real
trade-off, not a free lunch — covered in depth in the next module.

\`\`\`mermaid
flowchart TD
  subgraph Embed["Embedding: one document"]
    P1["Product: { _id: 1, name: Keyboard, reviews: [ ... ] }"]
  end
  subgraph Ref["Referencing: two documents linked by id"]
    P2["Product: { _id: 1, name: Keyboard }"]
    R1["Review: { _id: 9, productId: 1, text: Great! }"]
    R1 -- "productId references _id" --> P2
  end
\`\`\`

### Enforcing structure with $jsonSchema

If you do want the database itself to reject malformed documents, a
collection can be created with a **validator** expressed as
\`$jsonSchema\`:

\`\`\`js
await db.createCollection("products", {
  validator: {
    $jsonSchema: {
      required: ["name", "price"],
      properties: {
        name: { bsonType: "string" },
        price: { bsonType: "double" },
        tags: { bsonType: "array" },
      },
    },
  },
});
\`\`\`

This makes MongoDB reject an \`insertOne\`/\`updateOne\` that violates
the schema, the same way a SQL \`NOT NULL\` column would — but it's
opt-in, not the default.

### An anti-pattern: unbounded arrays

A common mistake when first modeling documents is embedding data that
grows without bound — e.g. storing every comment ever made on a post
as an array field inside the post document. BSON documents have a
16MB size limit, and even well before that limit, a document that
keeps growing gets slower to read and write in full every time you
touch *any* field on it. "Embed data that's small, bounded, and always
read together; keep unbounded or independently-growing data in its
own collection" is the rule of thumb the next module builds on.

### Why this matters

Every modeling decision in MongoDB — embed vs. reference, one big
document vs. many small ones — comes back to this same question:
"how will this data actually be read and written?" Get comfortable
asking that question now, because it's the deciding factor in every
relationship the next module walks through.
`.trim(),
  codeExamples: [
    {
      title: "Enforcing a schema with $jsonSchema",
      code: `await db.createCollection("products", {
  validator: {
    $jsonSchema: {
      required: ["name", "price"],
      properties: {
        name: { bsonType: "string" },
        price: { bsonType: "double" },
      },
    },
  },
});
// insertOne({ price: 49 }) is now rejected — "name" is required`,
    },
    {
      title: "An unbounded embedded array is a red flag",
      code: `// risky: this array has no natural upper bound
{ _id: 1, title: "My Post", comments: [ /* could be thousands */ ] }

// safer: comments live in their own collection, referencing the post
{ _id: 501, postId: 1, text: "Nice post!" }`,
    },
  ],
  challenge: {
    functionName: "validateAgainstSchema",
    prompt: `Write validateAgainstSchema(schema, doc), simulating MongoDB's
$jsonSchema document validator. "schema" is
{ required: string[], properties: { [field]: { bsonType } } }.

Return an array of error strings, built in this order:
- For each field in "schema.required" (in order), if doc[field] is
  undefined, add "\${field} is required".
- Then, for each field in "schema.properties" (in order), if
  doc[field] is NOT undefined, check its BSON type: "string" (typeof
  === "string"), "int" or "double" (typeof === "number"), "bool"
  (typeof === "boolean"), "array" (Array.isArray), "object" (a
  non-null, non-array object). If it doesn't match, add
  "\${field} must be a \${bsonType}". A field missing from "doc" is
  skipped here — that's what the required check above is for.

Return an empty array if "doc" is fully valid.`,
    starterCode: `function validateAgainstSchema(schema, doc) {
  // your code here
}`,
    solutionCode: `function validateAgainstSchema(schema, doc) {
  const errors = [];
  const required = schema.required || [];
  const properties = schema.properties || {};

  for (const field of required) {
    if (doc[field] === undefined) {
      errors.push(\`\${field} is required\`);
    }
  }

  for (const field of Object.keys(properties)) {
    const value = doc[field];
    if (value === undefined) continue;
    const bsonType = properties[field].bsonType;
    const matches =
      (bsonType === "string" && typeof value === "string") ||
      ((bsonType === "int" || bsonType === "double") && typeof value === "number") ||
      (bsonType === "bool" && typeof value === "boolean") ||
      (bsonType === "array" && Array.isArray(value)) ||
      (bsonType === "object" && typeof value === "object" && !Array.isArray(value) && value !== null);
    if (!matches) {
      errors.push(\`\${field} must be a \${bsonType}\`);
    }
  }

  return errors;
}`,
    testCases: [
      {
        name: "a fully valid document produces no errors",
        args: () => [
          { required: ["name"], properties: { name: { bsonType: "string" }, age: { bsonType: "int" } } },
          { name: "Ada", age: 30 },
        ],
        expected: [],
      },
      {
        name: "a missing required field is reported",
        args: () => [
          { required: ["name"], properties: { name: { bsonType: "string" }, age: { bsonType: "int" } } },
          { age: 30 },
        ],
        expected: ["name is required"],
      },
      {
        name: "a present field with the wrong bsonType is reported",
        args: () => [
          { required: ["name"], properties: { name: { bsonType: "string" }, age: { bsonType: "int" } } },
          { name: "Ada", age: "30" },
        ],
        expected: ["age must be a int"],
      },
      {
        name: "multiple missing required fields, in schema order",
        args: () => [{ required: ["a", "b"], properties: {} }, {}],
        expected: ["a is required", "b is required"],
      },
      {
        name: "array bsonType checked with Array.isArray",
        args: () => [
          { required: [], properties: { tags: { bsonType: "array" } } },
          { tags: "not-an-array" },
        ],
        expected: ["tags must be a array"],
      },
    ],
  },
};

export default mongodbSchemaDesign;
