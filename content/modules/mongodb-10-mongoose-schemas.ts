import type { ModuleContent } from "@/lib/types";

const mongodbMongooseSchemas: ModuleContent = {
  id: "mongodb-mongoose-schemas",
  title: "Mongoose schemas & models",
  category: "Mongoose & Production",
  order: 10,
  explanation: `
Everything so far has used the raw MongoDB driver, where a document is
just a plain object and nothing stops you from inserting mismatched
shapes. In a real Express app, most teams reach for **Mongoose**, a
library that sits on top of the driver and gives your application the
schema discipline MongoDB itself doesn't enforce.

### Defining a schema and a model

\`\`\`js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, default: 18 },
  isActive: { type: Boolean, default: true },
});

const User = mongoose.model("User", userSchema);
\`\`\`

A \`Schema\` describes the shape you expect \`User\` documents to have:
field types, which fields are required, and default values for fields
that are left out. \`mongoose.model(name, schema)\` turns that
description into a **model** — a class-like object with methods
(\`User.find()\`, \`User.create()\`, ...) that wrap the underlying driver
calls, applying the schema on the way in and out.

### Defaults fill in missing fields

\`\`\`js
const user = new User({ name: "Ada" }); // age and isActive are omitted
console.log(user.age);      // 18 — filled in from the schema's default
console.log(user.isActive); // true
\`\`\`

If a field is omitted entirely, Mongoose fills in its \`default\`
(a fixed value, or a function computed at creation time) before the
document is saved — the raw driver would have just left the field
missing.

### Casting: Mongoose tries to coerce values to match the type

\`\`\`js
const user = new User({ name: "Ada", age: "30" }); // age arrives as a string
console.log(typeof user.age); // "number" — Mongoose cast "30" to 30
\`\`\`

This is convenient for data coming from places that don't preserve
types well (form submissions, query strings) but worth knowing about:
a schema field typed \`Number\` will silently *try* to convert
whatever you give it, rather than rejecting a wrong type outright —
the next module covers Mongoose's actual validation, which is a
separate, stricter check.

### Why this matters

A Mongoose model is the layer that turns "MongoDB accepts anything"
back into "this application only ever writes well-formed \`User\`
documents" — schemas, defaults, and casting all happen automatically,
every time, instead of being re-implemented by hand in every route
handler the way the raw driver would require.
`.trim(),
  codeExamples: [
    {
      title: "Schema, model, and instantiation",
      code: `const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, default: 18 },
});

const User = mongoose.model("User", userSchema);
const user = new User({ name: "Ada" });
await user.save();`,
    },
    {
      title: "Defaults and casting at a glance",
      code: `new User({ name: "Ada" }).age;          // 18 (from the schema's default)
new User({ name: "Ada", age: "30" }).age; // 30, cast from a string to a Number`,
    },
  ],
  challenge: {
    functionName: "applySchemaDefaults",
    prompt: `Write applySchemaDefaults(schema, input), simulating how Mongoose
prepares a document from raw input before saving. "schema" maps field
names to { type, default? } ("type" is "String" or "Number").

For each field defined in "schema" (in schema order):
- If input[field] is undefined and the schema has a "default", use the
  default value.
- If input[field] is undefined and there's no default, omit that field
  from the result entirely.
- Otherwise, use input[field], cast to match "type": if type is
  "Number" and the value isn't already a number, convert it with
  Number(value); if type is "String" and the value isn't already a
  string, convert it with String(value).

Return the resulting object.`,
    starterCode: `function applySchemaDefaults(schema, input) {
  // your code here
}`,
    solutionCode: `function applySchemaDefaults(schema, input) {
  const result = {};
  for (const field of Object.keys(schema)) {
    const def = schema[field];
    let value = input[field];

    if (value === undefined) {
      if (def.default !== undefined) value = def.default;
      else continue;
    }

    if (def.type === "Number" && typeof value !== "number") value = Number(value);
    if (def.type === "String" && typeof value !== "string") value = String(value);

    result[field] = value;
  }
  return result;
}`,
    testCases: [
      {
        name: "a missing field with a default gets filled in",
        args: () => [{ name: { type: "String", required: true }, age: { type: "Number", default: 18 } }, { name: "Ada" }],
        expected: { name: "Ada", age: 18 },
      },
      {
        name: "a missing field with no default is omitted",
        args: () => [{ name: { type: "String" }, nickname: { type: "String" } }, { name: "Ada" }],
        expected: { name: "Ada" },
      },
      {
        name: "casts a numeric string to a Number",
        args: () => [{ age: { type: "Number" } }, { age: "25" }],
        expected: { age: 25 },
      },
      {
        name: "casts a number to a String",
        args: () => [{ id: { type: "String" } }, { id: 42 }],
        expected: { id: "42" },
      },
      {
        name: "an explicitly provided value overrides the default",
        args: () => [{ age: { type: "Number", default: 18 } }, { age: 30 }],
        expected: { age: 30 },
      },
    ],
  },
};

export default mongodbMongooseSchemas;
