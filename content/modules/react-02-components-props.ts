import type { ModuleContent } from "@/lib/types";

const reactComponentsProps: ModuleContent = {
  id: "react-components-props",
  title: "Components & props",
  category: "Fundamentals",
  order: 2,
  explanation: `
A React component is nothing more than a function that takes a single
argument — conventionally called \`props\` — and returns a React element
(the plain \`{ type, props }\` object from the previous module). That's the
entire contract:

\`\`\`jsx
function Greeting(props) {
  return <p>Hello, {props.name}</p>;
}

<Greeting name="Ada" />;
// compiles to: React.createElement(Greeting, { name: "Ada" })
\`\`\`

Notice \`type\` here is the *function itself*, not a string. When React
walks the element tree and finds a function \`type\`, it calls that
function with \`props\` and recurses into whatever element it returns.
Host elements (\`"div"\`, \`"p"\`, ...) are the leaves where this recursion
bottoms out into real DOM nodes; components are just more indirection on
top of the same tree of plain objects.

Props only ever flow one way — down the tree, from parent to child:

\`\`\`mermaid
flowchart TD
  Parent["Parent (owns the data)"] -->|"props: title"| ChildA["ChildA"]
  Parent -->|"props: title, isActive"| ChildB["ChildB"]
\`\`\`

\`ChildA\` and \`ChildB\` each receive whatever \`Parent\` decides to pass
them; neither child can reach back up and hand a value to \`Parent\`, and
neither can see what the other received. That asymmetry is the whole
reason the next section's rule ("never mutate props") is safe to rely
on — a child could never make its mutation visible to anyone upstream
even if it tried.

### Props are read-only inputs, not internal state

A component must never reassign or mutate the \`props\` object it
receives — that's the same rule as "don't mutate a function's
arguments" in plain JavaScript, and for the same reason: the caller
(usually a parent component, sometimes React itself on a re-render) owns
that data and may reuse the same object across renders. Treat \`props\`
the way you'd treat any function parameter you didn't create.

### Composition over configuration

Because components are just functions, "reusing UI" is just "calling a
function with different arguments" — there's no separate templating or
inheritance system to learn. A \`Card\` component doesn't need a dozen
props for every possible layout; it can accept a \`children\` prop (the
same \`children\` from the JSX-elements module) and let the caller decide
what goes inside:

\`\`\`jsx
function Card({ children }) {
  return <div className="card">{children}</div>;
}

<Card>
  <h2>Title</h2>
  <p>Body text.</p>
</Card>;
\`\`\`

This is the same "slot" pattern you'd reach for in any component-based
UI system, expressed with nothing but a prop named \`children\`.

### Filling in defaults

Callers often omit optional props entirely. The convention for filling
those gaps — whether via a component's \`defaultProps\` field or a
default parameter in a destructured function signature
(\`function Button({ size = "md" }) {}\`) — is specifically to treat
**\`undefined\`** as "not provided." An explicit \`false\`, \`0\`, \`""\`, or
even \`null\` is a real value the caller chose on purpose and must be
respected, not silently replaced by a default. This mirrors how default
parameters work everywhere else in JavaScript: \`function f(x = 1) {}\`
only substitutes \`1\` when \`x\` is exactly \`undefined\`.

### Why this matters

"Component" isn't a special React concept bolted onto JavaScript — it's
"pure function of props, returning UI-describing data." Every rule about
props (read-only, only \`undefined\` triggers defaults, composition via
\`children\`) falls out of treating components as ordinary functions with
one argument.
`.trim(),
  codeExamples: [
    {
      title: "A component is a function returning an element",
      code: `function Avatar({ src, alt }) {
  return <img src={src} alt={alt} className="avatar" />;
}

<Avatar src="/me.png" alt="Profile photo" />;`,
    },
    {
      title: "Only undefined falls back to a default",
      code: `function Button({ disabled = false, label }) {
  return <button disabled={disabled}>{label}</button>;
}

<Button label="Save" />;               // disabled -> false (default)
<Button label="Save" disabled={false} />; // disabled -> false (explicit, same value)
<Button label="Delete" disabled={true} />; // disabled -> true (explicit, respected)`,
    },
  ],
  challenge: {
    functionName: "withDefaults",
    prompt: `Write withDefaults(defaultProps, props) that mimics how a component fills
in missing props with defaults. Return a new object containing every key
from defaultProps, overridden by the corresponding key in props — but only
when that value in props is not undefined. An explicit false, 0, "", or
null in props must be kept as-is (it is a real value the caller chose),
and any key present in props but absent from defaultProps must pass
through unchanged.`,
    starterCode: `function withDefaults(defaultProps, props) {
  // your code here
}`,
    solutionCode: `function withDefaults(defaultProps, props) {
  const result = Object.assign({}, defaultProps);
  for (const key of Object.keys(props || {})) {
    result[key] = props[key] === undefined ? defaultProps[key] : props[key];
  }
  return result;
}`,
    testCases: [
      {
        name: "explicit prop overrides default",
        args: () => [{ color: "blue", size: "md" }, { size: "lg" }],
        expected: { color: "blue", size: "lg" },
      },
      {
        name: "explicit undefined falls back to default",
        args: () => [{ color: "blue" }, { color: undefined }],
        expected: { color: "blue" },
      },
      {
        name: "explicit false overrides a truthy default",
        args: () => [{ disabled: false }, { disabled: true }],
        expected: { disabled: true },
      },
      {
        name: "explicit 0 is a real value, not treated as missing",
        args: () => [{ count: 5 }, { count: 0 }],
        expected: { count: 0 },
      },
      {
        name: "explicit null is kept, not defaulted",
        args: () => [{ label: "Submit" }, { label: null }],
        expected: { label: null },
      },
      {
        name: "extra prop passes through, missing ones keep their default",
        args: () => [{ a: 1, b: 2 }, { c: 3 }],
        expected: { a: 1, b: 2, c: 3 },
      },
    ],
  },
};

export default reactComponentsProps;
