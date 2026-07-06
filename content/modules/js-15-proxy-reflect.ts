import type { ModuleContent } from "@/lib/types";

const proxyReflectModule: ModuleContent = {
  id: "js-proxy-reflect",
  title: "Proxy & Reflect",
  category: "Metaprogramming & Patterns",
  order: 15,
  explanation: `
### The problem: watching or controlling an object without changing it

Imagine a translator standing between you and someone who only speaks a
language you don't understand. Every question you ask, every answer you
get back, passes through the translator first. The translator can just
relay things faithfully — or they can write down every question in a
notebook, refuse to pass along certain ones, or quietly change an answer
before handing it to you. The person on the other side never has to
change how they talk; the translator sits invisibly in between.

A \`Proxy\` is that translator, but for objects. It lets you wrap an
existing object (the **target**) and intercept fundamental operations on
it — reading a property, writing one, checking \`in\`, deleting a key —
without touching the original object at all. Code that uses the proxy
just thinks it's using a normal object.

### Creating a Proxy: target + handler

You create one with \`new Proxy(target, handler)\`:

- \`target\` — the real object being wrapped.
- \`handler\` — a plain object whose methods are called **traps**. Each
  trap corresponds to one operation you can intercept. \`get(target,
  prop, receiver)\` traps property reads, \`set(target, prop, value,
  receiver)\` traps writes, \`has(target, prop)\` traps the \`in\` operator,
  \`deleteProperty(target, prop)\` traps \`delete\`, and there are several
  more. If a trap isn't defined, that operation just falls through to the
  target's normal behavior automatically. This module's challenge only
  needs the \`get\` trap.

\`\`\`js
const target = { name: "Ada" };

const proxy = new Proxy(target, {
  get(target, prop, receiver) {
    console.log(\`reading "\${prop}"\`);
    return target[prop];
  },
});

proxy.name; // logs: reading "name"  → returns "Ada"
\`\`\`

### Forwarding correctly: why Reflect exists

Notice the trap above still has to do *something* to produce the actual
value — it manually wrote \`return target[prop]\`. That works for a
simple \`get\`, but as soon as you're dealing with trickier cases
(inheritance, getters defined with \`this\`, etc.), hand-rolling the
"default" behavior gets easy to get subtly wrong. If your trap forwards
incorrectly, you silently break the object every piece of code
downstream now sees.

\`Reflect\` solves this. It's a built-in object that exposes the *exact
same* set of low-level operations that plain object syntax normally
triggers — but as explicit function calls instead of syntax. \`Reflect.get(target,
prop, receiver)\` does exactly what \`target[prop]\` would do by default.
\`Reflect.set\`, \`Reflect.has\`, \`Reflect.deleteProperty\`, and others mirror
the rest of the traps one-for-one. So inside a trap, the idiomatic move
is: do your custom logic (log it, validate it, whatever), then call the
matching \`Reflect\` method to actually carry out the operation on the
real target — guaranteeing you reproduce the exact default behavior you
didn't want to reinvent.

\`\`\`js
const proxy = new Proxy(target, {
  get(target, prop, receiver) {
    console.log(\`reading "\${prop}"\`);
    return Reflect.get(target, prop, receiver); // the "correct" default read
  },
});
\`\`\`

The \`receiver\` argument matters for correctness with inherited getters,
but the pattern to remember is simple: **intercept, then forward via the
matching \`Reflect\` call.**

### Realistic use cases

- **Logging / tracing** — record every property access for debugging or
  analytics, exactly like this module's challenge.
- **Validation** — reject a \`set\` if the new value is the wrong type or
  out of range, before it ever reaches the real object.
- **Reactive state** — libraries like Vue's reactivity system use a
  \`set\` trap to notice "this property changed" and automatically
  re-render anything that depends on it.

### Why this matters

\`Proxy\` lets you intercept the basic operations on an object, and
\`Reflect\` gives you the safe, explicit way to still perform those
operations after you've done your own logic — instead of reimplementing
default object behavior by hand. In the challenge, you'll build exactly
this pair: a \`get\` trap that logs every property name accessed through
the proxy, then hands off to \`Reflect.get\` so the proxy keeps behaving
like a normal object underneath.
`.trim(),
  codeExamples: [
    {
      title: "A set trap that validates before allowing a write",
      code: `const user = { age: 30 };

const guarded = new Proxy(user, {
  set(target, prop, value, receiver) {
    if (prop === "age" && (typeof value !== "number" || value < 0)) {
      throw new TypeError("age must be a non-negative number");
    }
    return Reflect.set(target, prop, value, receiver);
  },
});

guarded.age = 31; // fine
guarded.age = -5; // throws TypeError, user.age is untouched`,
    },
    {
      title: "Reflect standing on its own, with no Proxy involved",
      code: `const config = { host: "localhost", port: 3000 };

Reflect.has(config, "port"); // true, same as "port" in config
Reflect.ownKeys(config); // ["host", "port"], like Object.keys but includes symbols
Reflect.get(config, "host"); // "localhost", same as config.host`,
      note: "Reflect methods work directly on any object — they're useful any time you want the 'operation as a function call' instead of syntax, not just inside a Proxy trap.",
    },
  ],
  challenge: {
    functionName: "trackAccess",
    prompt: `Write trackAccess(obj, keysToAccess) that wraps obj in a Proxy with a
get trap: every time a property is read through the proxy, push the property
name (as a string) onto a log array, then use Reflect.get to actually perform
the read (forwarding to the normal default behavior) so the proxy still works
like the original object. Then read each key in keysToAccess (in order) off
the proxy, and return the log array.`,
    starterCode: `function trackAccess(obj, keysToAccess) {
  // your code here
}`,
    solutionCode: `function trackAccess(obj, keysToAccess) {
  const log = [];
  const proxy = new Proxy(obj, {
    get(target, prop, receiver) {
      log.push(String(prop));
      return Reflect.get(target, prop, receiver);
    },
  });
  for (const key of keysToAccess) {
    proxy[key];
  }
  return log;
}`,
    testCases: [
      { name: "logs each accessed key in order", args: () => [{ a: 1, b: 2 }, ["a", "b"]], expected: ["a", "b"] },
      { name: "logs repeated accesses", args: () => [{ a: 1, b: 2 }, ["a", "b", "a"]], expected: ["a", "b", "a"] },
      { name: "handles no accesses", args: () => [{ a: 1 }, []], expected: [] },
      { name: "handles accessing the same key repeatedly", args: () => [{ x: 10 }, ["x", "x", "x"]], expected: ["x", "x", "x"] },
    ],
  },
};

export default proxyReflectModule;
