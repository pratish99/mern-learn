import type { ModuleContent } from "@/lib/types";

const reactContext: ModuleContent = {
  id: "react-context",
  title: "Context API",
  category: "Data Flow & Composition",
  order: 8,
  explanation: `
Lifting state up (previous module) solves sibling coordination, but it
has a cost: the shared value has to be threaded down as props through
every intermediate component, even ones that don't care about it and
only pass it along to their own children. A deeply nested tree turns
into "prop drilling" — a \`theme\` prop repeated on ten components just so
the eleventh one can read it.

Context is React's escape hatch for values that many components at
different depths need, without manually forwarding props through every
level: a \`Provider\` makes a value available to its entire subtree, and
any descendant can read it directly.

\`\`\`jsx
const ThemeContext = createContext("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Sidebar />
    </ThemeContext.Provider>
  );
}

function Sidebar() {
  return <Button />; // doesn't need to know or forward the theme
}

function Button() {
  const theme = useContext(ThemeContext); // "dark" — read directly, no prop drilling
  return <button className={theme}>Click</button>;
}
\`\`\`

\`Sidebar\` never touches \`theme\` at all — it doesn't need to know context
exists. Only \`Button\`, the component that actually needs the value,
reads it.

### Nested providers shadow, they don't merge

A component reads whatever value the **nearest** enclosing \`Provider\`
supplies, walking up the tree from where it's rendered. Nesting a second
\`Provider\` with a different value inside the tree overrides the value
for everything below it, without affecting components in sibling
branches that stay under the outer \`Provider\`:

\`\`\`jsx
<ThemeContext.Provider value="light">
  <Sidebar />                              {/* sees "light" */}
  <ThemeContext.Provider value="dark">
    <Modal />                              {/* sees "dark" */}
  </ThemeContext.Provider>
</ThemeContext.Provider>
\`\`\`

If a component isn't wrapped in *any* matching \`Provider\`, \`useContext\`
falls back to the default value passed to \`createContext\` — which is why
that default exists at all: it's what every consumer sees in the absence
of a provider, not just an initial placeholder.

### Why this matters

Context doesn't replace props or lifted state — it solves a narrower
problem: broadcasting a value to an entire subtree without every
component in between having to know or care. Reach for it for
genuinely cross-cutting values (theme, locale, the current logged-in
user) — using it for everything turns "data flows down as props" into
an implicit, harder-to-trace global, which is exactly the problem prop
drilling was annoying about, just relocated rather than solved.
`.trim(),
  codeExamples: [
    {
      title: "Providing and reading a context value",
      code: `const ThemeContext = createContext("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  const theme = useContext(ThemeContext);
  return <div className={theme}>...</div>;
}`,
    },
    {
      title: "A nested provider only overrides its own subtree",
      code: `<ThemeContext.Provider value="light">
  <Header />                          {/* "light" */}
  <ThemeContext.Provider value="dark">
    <Modal />                         {/* "dark" */}
  </ThemeContext.Provider>
  <Footer />                          {/* still "light" — sibling of the nested provider */}
</ThemeContext.Provider>`,
    },
  ],
  challenge: {
    functionName: "resolveContextTree",
    prompt: `Write resolveContextTree(node, inheritedValue) that simulates how a
context value propagates through a component tree. "node" is
{ id, value?, children? }: "value" is the context value provided at that
node (if the node renders a Provider), and "children" is an array of
child nodes (treat a missing children field as no children). Return a
flat array of { id, value } pairs in the same order the tree would render
(the node itself, then each child's results in order, recursively): each
node's effective value is its own "value" if it provides one, otherwise
whatever value it inherited from its nearest ancestor (starting from
inheritedValue at the root).`,
    starterCode: `function resolveContextTree(node, inheritedValue) {
  // your code here
}`,
    solutionCode: `function resolveContextTree(node, inheritedValue) {
  const value = node.value !== undefined ? node.value : inheritedValue;
  const entries = [{ id: node.id, value }];
  for (const child of node.children || []) {
    entries.push(...resolveContextTree(child, value));
  }
  return entries;
}`,
    testCases: [
      {
        name: "value cascades until a nested provider overrides it",
        args: () => [
          {
            id: "root",
            value: "light",
            children: [
              { id: "sidebar", children: [{ id: "button-a", children: [] }] },
              { id: "main", value: "dark", children: [{ id: "button-b", children: [] }] },
            ],
          },
          "light",
        ],
        expected: [
          { id: "root", value: "light" },
          { id: "sidebar", value: "light" },
          { id: "button-a", value: "light" },
          { id: "main", value: "dark" },
          { id: "button-b", value: "dark" },
        ],
      },
      {
        name: "a single node with no own value uses the inherited default",
        args: () => [{ id: "only", children: [] }, "fallback"],
        expected: [{ id: "only", value: "fallback" }],
      },
      {
        name: "an override several levels deep propagates further down",
        args: () => [
          { id: "a", value: "x", children: [{ id: "b", value: "y", children: [{ id: "c", children: [] }] }] },
          "default",
        ],
        expected: [
          { id: "a", value: "x" },
          { id: "b", value: "y" },
          { id: "c", value: "y" },
        ],
      },
      {
        name: "a missing children field is treated as a leaf",
        args: () => [{ id: "leaf" }, "v"],
        expected: [{ id: "leaf", value: "v" }],
      },
      {
        name: "sibling overrides don't affect each other",
        args: () => [
          { id: "root", children: [{ id: "left", value: "L", children: [] }, { id: "right", value: "R", children: [] }] },
          "D",
        ],
        expected: [
          { id: "root", value: "D" },
          { id: "left", value: "L" },
          { id: "right", value: "R" },
        ],
      },
    ],
  },
};

export default reactContext;
