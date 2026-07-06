import type { ModuleContent } from "@/lib/types";

const expressValidation: ModuleContent = {
  id: "express-validation",
  title: "Request validation",
  category: "APIs & Data",
  order: 9,
  explanation: `
\`req.body\` is just whatever bytes the client happened to send, parsed
into JavaScript values — Express has no idea whether it matches the
shape your route actually expects. If a client omits a required field,
sends a string where you expected a number, or sends nothing at all,
and your handler doesn't check, that bad data flows straight into your
business logic (and often your database), where the resulting bug is
much harder to trace back to "a request with no \`name\` field."
**Validation** means checking the shape of incoming data *before* you
trust it.

### Validating by hand

The simplest form of validation is a handful of \`if\` checks at the top
of a route handler:

\`\`\`js
app.post("/users", (req, res) => {
  const errors = [];
  if (typeof req.body.name !== "string") errors.push("name is required");
  if (req.body.age !== undefined && typeof req.body.age !== "number") {
    errors.push("age must be a number");
  }
  if (errors.length > 0) {
    return res.status(400).json({ errors }); // stop — don't run the real logic
  }
  // ... safe to use req.body.name / req.body.age from here on
});
\`\`\`

This works, but it's repetitive across every route, and it's easy to
forget a field. Real projects usually reach for a **schema validation
library** (like \`zod\` or \`joi\`) that lets you describe the shape once
— \`{ name: string, age: number.optional() }\` — and get the same
errors-array behavior generated for you, consistently, everywhere.

### Fail fast, with a clear status code

However you implement it, the response shape should stay consistent:
a validation failure is a client mistake, not a server one, so it
gets \`400 Bad Request\` (not \`500\`), plus a body describing exactly
what was wrong — good error messages save the person calling your API
a debugging session.

### Where validation fits in the pipeline

Validation is a perfect fit for the middleware pattern from earlier:
a \`validate(schema)\` middleware can run *before* your route handler,
check \`req.body\` against a schema, and either call \`next()\` (valid —
proceed) or respond with \`400\` itself (invalid — stop), keeping the
actual route handler free to assume its input is already well-formed:

\`\`\`js
function validate(schema) {
  return (req, res, next) => {
    const errors = validateBody(schema, req.body);
    if (errors.length > 0) return res.status(400).json({ errors });
    next();
  };
}

app.post("/users", validate(userSchema), (req, res) => {
  // req.body is guaranteed to match userSchema here
});
\`\`\`

### Why this matters

Every field that reaches your database, gets rendered back into HTML,
or gets passed to another service started as untrusted input from a
request body. Validating it as early as possible — right at the edge,
before any business logic runs — means every line of code after that
point can simply *assume* the data is well-formed, instead of
re-checking it defensively everywhere it's used.
`.trim(),
  codeExamples: [
    {
      title: "A reusable validation middleware",
      code: `app.post("/users", validate(userSchema), (req, res) => {
  createUser(req.body); // safe: already validated
  res.status(201).send("created");
});`,
    },
    {
      title: "Responding with a clear 400",
      code: `if (errors.length > 0) {
  return res.status(400).json({ errors });
}`,
    },
  ],
  challenge: {
    functionName: "validateBody",
    prompt: `Write validateBody(schema, body) that checks "body" against
"schema", a plain object mapping field names to a rule
{ type, required } (type is "string", "number", or "boolean";
required is a boolean). Return an array of error strings, one per
problem found, in the same order the fields appear in "schema":

- If a required field is missing from "body" (or is undefined), add
  "\${field} is required".
- If a field IS present in "body" but typeof body[field] doesn't match
  rule.type, add "\${field} must be a \${rule.type}".
- A field that isn't required and is missing from "body" is skipped
  entirely — no error.

Return an empty array if the body is fully valid.`,
    starterCode: `function validateBody(schema, body) {
  // your code here
}`,
    solutionCode: `function validateBody(schema, body) {
  const errors = [];
  for (const field of Object.keys(schema)) {
    const rule = schema[field];
    const value = body[field];
    if (value === undefined) {
      if (rule.required) errors.push(\`\${field} is required\`);
      continue;
    }
    if (typeof value !== rule.type) {
      errors.push(\`\${field} must be a \${rule.type}\`);
    }
  }
  return errors;
}`,
    testCases: [
      {
        name: "valid body produces no errors",
        args: () => [{ name: { type: "string", required: true }, age: { type: "number", required: false } }, { name: "Ada" }],
        expected: [],
      },
      {
        name: "missing required field",
        args: () => [{ name: { type: "string", required: true }, age: { type: "number", required: false } }, {}],
        expected: ["name is required"],
      },
      {
        name: "wrong type on an optional field",
        args: () => [
          { name: { type: "string", required: true }, age: { type: "number", required: false } },
          { name: "Ada", age: "30" },
        ],
        expected: ["age must be a number"],
      },
      {
        name: "multiple missing required fields, in schema order",
        args: () => [{ a: { type: "string", required: true }, b: { type: "number", required: true } }, {}],
        expected: ["a is required", "b is required"],
      },
      {
        name: "wrong boolean type",
        args: () => [{ active: { type: "boolean", required: true } }, { active: "yes" }],
        expected: ["active must be a boolean"],
      },
    ],
  },
};

export default expressValidation;
