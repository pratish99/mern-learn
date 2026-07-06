import type { ModuleContent } from "@/lib/types";

const mongodbValidationMiddleware: ModuleContent = {
  id: "mongodb-validation-middleware",
  title: "Mongoose validation & middleware (hooks)",
  category: "Mongoose & Production",
  order: 11,
  explanation: `
The last module's casting is intentionally permissive — Mongoose tries
to coerce values rather than reject them. **Validation** is the
stricter check layered on top: rules a document must satisfy before
Mongoose will let it save at all.

### Schema-level validators

\`\`\`js
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  age: { type: Number, min: 0, max: 120 },
});

const user = new User({ age: 200 });
await user.save(); // throws a ValidationError — 200 exceeds "max"
\`\`\`

\`required\`, \`min\`, \`max\`, and a \`validate\` function for arbitrary
custom rules all run automatically on \`.save()\` — this is the same
"reject bad data before it reaches the database" idea from Express's
request validation module, just enforced at the model layer instead of
the route layer, so it applies no matter which route (or script, or
seed file) tries to save an invalid document.

### Hooks: running code before/after an operation

Separately from validation, Mongoose lets a schema register **hooks**
(also called middleware) that run automatically around an operation
like \`save\`:

\`\`\`js
userSchema.pre("save", function (next) {
  this.email = this.email.toLowerCase(); // normalize before saving
  next();
});

userSchema.post("save", function (doc) {
  console.log(\`User \${doc._id} was saved\`); // side effect, doesn't change the doc
});
\`\`\`

\`pre("save")\` hooks run *before* the document is written, and can
still transform it (lowercase an email, hash a password) — this
should feel familiar: it's the same "run before the real handler,
optionally short-circuit or transform" shape as Express middleware,
just scoped to model operations instead of HTTP requests. \`post("save")\`
hooks run *after* the write succeeds, typically for side effects like
logging or triggering a notification — by that point the document is
already saved, so a post hook isn't meant to change what got written.

### Hooks run in registration order

Register two \`pre("save")\` hooks, and they run in the order you
registered them, each receiving the document as transformed by the one
before it — the same "ordered chain, each step builds on the last"
rule that governed Express middleware.

### Why this matters

Validators and hooks are how cross-cutting document rules — "this
field is always required," "always lowercase this before saving,"
"always log after saving" — get defined exactly once, on the schema,
instead of being copy-pasted into every route handler that might
create or update a document.
`.trim(),
  codeExamples: [
    {
      title: "Validators reject an invalid save",
      code: `const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  age: { type: Number, min: 0, max: 120 },
});

const user = new User({ age: 200 });
try {
  await user.save();
} catch (err) {
  console.log(err.errors.age.message); // "Path \`age\` (200) is more than maximum allowed value (120)."
}`,
    },
    {
      title: "A pre-save hook that transforms the document",
      code: `userSchema.pre("save", function (next) {
  this.email = this.email.toLowerCase();
  next();
});

const user = new User({ email: "ADA@EXAMPLE.COM" });
await user.save();
console.log(user.email); // "ada@example.com"`,
    },
  ],
  challenge: {
    functionName: "runSaveHooks",
    prompt: `Write runSaveHooks(doc, preHooks, postHooks), simulating Mongoose's
pre("save") / post("save") hook chain around a save.

- Run each function in "preHooks", in order. Each receives the current
  document and returns the (possibly transformed) document to pass to
  the next pre-hook — this final transformed document is what gets
  "saved".
- Then run each function in "postHooks", in order, passing each one
  the saved document. Post-hooks do NOT transform the document; each
  one's return value is instead collected into a "log" array, in call
  order.

Return { saved, log } where "saved" is the document after all
pre-hooks have run, and "log" is the array of post-hook return values.`,
    starterCode: `function runSaveHooks(doc, preHooks, postHooks) {
  // your code here
}`,
    solutionCode: `function runSaveHooks(doc, preHooks, postHooks) {
  let saved = doc;
  for (const hook of preHooks) {
    saved = hook(saved);
  }

  const log = [];
  for (const hook of postHooks) {
    log.push(hook(saved));
  }

  return { saved, log };
}`,
    testCases: [
      {
        name: "a single pre-hook transforms the document before saving",
        args: () => [{ email: "ADA@EXAMPLE.COM" }, [(d: { email: string }) => ({ ...d, email: d.email.toLowerCase() })], []],
        expected: { saved: { email: "ada@example.com" }, log: [] },
      },
      {
        name: "multiple pre-hooks run in order, chaining their output",
        args: () => [
          { name: " Ada " },
          [(d: { name: string }) => ({ ...d, name: d.name.trim() }), (d: { name: string }) => ({ ...d, name: d.name.toUpperCase() })],
          [],
        ],
        expected: { saved: { name: "ADA" }, log: [] },
      },
      {
        name: "post-hooks run after saving and their results are collected",
        args: () => [{ name: "Ada" }, [], [(d: { name: string }) => `saved ${d.name}`]],
        expected: { saved: { name: "Ada" }, log: ["saved Ada"] },
      },
      {
        name: "pre-hooks and post-hooks both run, each in their own order",
        args: () => [
          { name: "ada" },
          [(d: { name: string }) => ({ ...d, name: d.name.toUpperCase() })],
          [(d: { name: string }) => `logged ${d.name}`, (d: { name: string }) => `audited ${d.name}`],
        ],
        expected: { saved: { name: "ADA" }, log: ["logged ADA", "audited ADA"] },
      },
      {
        name: "no hooks at all just passes the document through",
        args: () => [{ name: "Ada" }, [], []],
        expected: { saved: { name: "Ada" }, log: [] },
      },
    ],
  },
};

export default mongodbValidationMiddleware;
