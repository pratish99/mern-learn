import type { ModuleContent } from "@/lib/types";

const jsObjectDescriptorsModule: ModuleContent = {
  id: "js-object-descriptors",
  title: "Objects & property descriptors",
  category: "Objects & Prototypes",
  order: 7,
  explanation: `
### The problem: objects hide more than just "key: value"

Most people think of an object property as just a label and a value —
\`{ count: 10 }\` means "there's a thing called \`count\` and it's \`10\`."
That's true, but it's not the whole story. Behind every property JS
also keeps a little bit of hidden metadata called a **property
descriptor**, which controls things like whether the property can be
overwritten, deleted, or even seen by tools like \`Object.keys\`.

Think of it like a library book. The book itself (the value) is one
thing, but the library also keeps a card on file saying whether you're
allowed to write in the margins, whether the book can be checked out at
all, and whether it even shows up in the catalog search. Two books can
have identical text and still behave completely differently depending
on what's written on that card. Object properties work the same way.

### The three flags every data property has

When you create a property the normal way (\`obj.key = value\` or inside
an object literal), JS gives it a descriptor with three boolean flags,
all defaulting to \`true\`:

- **\`writable\`** — can the value be changed with a plain assignment
  (\`obj.key = newValue\`)? If \`false\`, assignments don't change
  anything.
- **\`enumerable\`** — does the property show up in things that iterate
  "normal" properties, like \`Object.keys\`, \`for...in\`, or
  \`JSON.stringify\`? If \`false\`, the property still exists and can be
  read directly (\`obj.key\`), it's just invisible to those iteration
  tools.
- **\`configurable\`** — can the property be deleted (\`delete obj.key\`),
  or can its descriptor be changed again later? If \`false\`, the
  property is stuck with whatever \`writable\`/\`enumerable\` it currently
  has (with one exception: a non-configurable, writable property can
  still flip to non-writable).

### Setting and reading descriptors explicitly

You rarely touch descriptors when just writing everyday code, but you
can set them precisely with \`Object.defineProperty\`:

\`\`\`js
const obj = { count: 10 };

Object.defineProperty(obj, "count", {
  writable: false, // lock the value
  enumerable: true, // still shows up in Object.keys, JSON.stringify, etc.
  configurable: false, // can't be deleted or redefined
});

obj.count = 999; // has no effect — writable is false
\`\`\`

To inspect what a property's descriptor currently looks like, use
\`Object.getOwnPropertyDescriptor\`:

\`\`\`js
Object.getOwnPropertyDescriptor(obj, "count");
// { value: 10, writable: false, enumerable: true, configurable: false }
\`\`\`

### A different kind of property: getters and setters

So far we've talked about **data properties** — the value is a value,
just stored with flags on top. JS also supports **accessor
properties**, where instead of storing a value directly, you store a
function that *computes* the value on read (a **getter**) and/or a
function that runs when someone assigns to it (a **setter**). These
also use \`Object.defineProperty\` (or the \`get\`/\`set\` shorthand inside
an object literal or class) — see the first code example below.

### Bulk shortcuts: \`Object.freeze\` and \`Object.seal\`

Setting descriptors one property at a time is verbose, so JS gives you
two shortcuts for locking down a whole object at once:

- **\`Object.freeze(obj)\`** — makes every existing property
  non-writable and non-configurable, and prevents new properties from
  being added at all. This is the strictest lock: nothing about the
  object's own properties can change.
- **\`Object.seal(obj)\`** — similar, but properties stay **writable**.
  You can still update existing values, you just can't add new
  properties, delete existing ones, or reconfigure them.

One catch worth remembering: both are **shallow**. Freezing an object
only locks its direct properties — if one of those properties holds
another object, that nested object is completely unaffected and can
still be mutated freely (see the second code example below).

### Strict mode changes the failure mode

Here's the detail that matters most for the challenge below: what
happens when you try to assign to a non-writable property depends on
whether you're in **strict mode**.

- In **non-strict mode** (the default for plain scripts and functions),
  the assignment is **silently ignored** — no error, the value just
  doesn't change.
- In **strict mode**, the same assignment **throws a \`TypeError\`**.

This isn't an edge case you can ignore: ES modules and class bodies are
*always* strict mode, so a lot of modern JS code runs under the
throwing behavior by default, even without an explicit
\`"use strict"\`.

### Why this matters

Property descriptors are how JS lets you build "read-only" data,
private-ish internal state, and computed properties without needing a
totally different language feature — it's all still plain objects
underneath, just with different rules attached. The challenge below has
you use \`Object.defineProperty\` to lock a property's value in place,
then attempt an overwrite and observe that — outside strict mode — it
just quietly fails, leaving the original value intact.
`.trim(),
  codeExamples: [
    {
      title: "Getter/setter pair (an accessor property)",
      code: `const person = {
  firstName: "Ada",
  lastName: "Lovelace",
  get fullName() {
    return \`\${this.firstName} \${this.lastName}\`;
  },
  set fullName(value) {
    [this.firstName, this.lastName] = value.split(" ");
  },
};

console.log(person.fullName); // "Ada Lovelace" — computed on read
person.fullName = "Grace Hopper"; // runs the setter
console.log(person.firstName); // "Grace"`,
    },
    {
      title: "Object.freeze is shallow",
      code: `const config = { theme: "dark", limits: { retries: 3 } };
Object.freeze(config);

config.theme = "light"; // silently ignored — top-level property is frozen
config.limits.retries = 99; // this WORKS — "limits" itself was never frozen

console.log(config.theme); // "dark"
console.log(config.limits.retries); // 99`,
    },
  ],
  challenge: {
    functionName: "lockProperty",
    prompt: `Write lockProperty(obj, key) that makes obj[key] read-only (non-writable) using
Object.defineProperty — keep it enumerable so the property still shows up
normally (e.g. in Object.keys or JSON.stringify), just not overwritable.
After locking it, attempt to overwrite obj[key] with the string
"attempted-overwrite" (this attempt should silently fail since we're not in
strict mode) and return obj so the caller can see the value didn't change.`,
    starterCode: `function lockProperty(obj, key) {
  // your code here
}`,
    solutionCode: `function lockProperty(obj, key) {
  Object.defineProperty(obj, key, {
    writable: false,
    configurable: false,
    enumerable: true,
  });
  obj[key] = "attempted-overwrite"; // silently ignored — the property is locked
  return obj;
}`,
    testCases: [
      { name: "blocks overwriting a number", args: () => [{ count: 10 }, "count"], expected: { count: 10 } },
      { name: "blocks overwriting a string", args: () => [{ status: "active" }, "status"], expected: { status: "active" } },
      {
        name: "leaves other keys untouched",
        args: () => [{ id: 1, name: "Ada" }, "id"],
        expected: { id: 1, name: "Ada" },
      },
    ],
  },
};

export default jsObjectDescriptorsModule;
