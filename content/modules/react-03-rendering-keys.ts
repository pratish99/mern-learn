import type { ModuleContent } from "@/lib/types";

const reactRenderingKeys: ModuleContent = {
  id: "react-rendering-keys",
  title: "Rendering lists & reconciliation",
  category: "Fundamentals",
  order: 3,
  explanation: `
Every time state or props change, a component function runs again and
returns a brand-new element tree — a fresh set of plain \`{ type, props }\`
objects, from the previous two modules. React doesn't throw the old DOM
away and rebuild it from scratch on every render; that would be far too
slow. Instead it **reconciles**: it compares the new element tree against
the previous one and computes the minimal set of real DOM changes needed
to make the browser match.

### Lists need a stable identity, not just a position

When you render an array with \`.map()\`:

\`\`\`jsx
{todos.map((todo) => (
  <li key={todo.id}>{todo.text}</li>
))}
\`\`\`

React needs to answer a question the element tree alone can't answer:
"is this \`<li>\` the *same* logical item as one from last render, just
possibly in a different position — or is it a new one?" Without an
explicit hint, React's default reconciliation for lists compares by
**index** — position 0 to position 0, position 1 to position 1. That
falls apart the moment items are inserted, removed, or reordered: every
item after the change point gets misattributed to the wrong previous
element, causing React to patch content that didn't actually move and
sometimes carry component state (like a focused text input) to the
wrong row.

The \`key\` prop fixes this by giving React an explicit, stable identity
for each item, independent of array position. With keys, React matches
elements from the old tree to the new tree **by key**, not by index —
so it can tell "reused" (same key, keep this DOM node and its internal
state) apart from "added" (a key that's new) and "removed" (a key that's
gone).

### What a good key looks like

A key must be:

- **Stable** across renders for the same logical item (a database id, not
  \`Math.random()\` computed during render — that would make every item
  look "new" every time).
- **Unique** among siblings in that list (it doesn't need to be globally
  unique, just unique within that \`.map()\`).

Using the array index as a key technically satisfies "a key was
provided," but for lists that can reorder or have items removed from the
middle, it reintroduces the exact position-based mismatching that keys
exist to prevent — it's really no better than having no key at all.

### Why this matters

Reconciliation is why React feels fast without you manually diffing the
DOM yourself, and \`key\` is the one piece of information *you* provide
that the algorithm can't infer on its own. Get it right and reordering,
inserting, and deleting list items preserves component state and skips
unnecessary DOM work; get it wrong (missing keys, or index-as-key on a
reorderable list) and you get subtle bugs like input values or checkbox
states "sticking" to the wrong row after a reorder.
`.trim(),
  codeExamples: [
    {
      title: "Keying a rendered list",
      code: `function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}`,
    },
    {
      title: "Index-as-key breaks on reorder",
      code: `// Before: ["Buy milk", "Walk dog"]  keyed by index -> [0, 1]
// After sorting alphabetically: ["Walk dog", "Buy milk"]  still keyed by index -> [0, 1]
// React sees the same keys (0, 1) and assumes nothing moved,
// so it patches content in place instead of reordering DOM nodes —
// any per-item state (like a focused <input>) stays on the wrong row.`,
    },
  ],
  challenge: {
    functionName: "diffKeyedList",
    prompt: `Write diffKeyedList(oldKeys, newKeys) that simulates the key-based part of
React's list reconciliation. Given the keys rendered on the previous pass
(oldKeys) and the keys being rendered now (newKeys), return
{ added, removed, reused }: "added" is the newKeys not present in
oldKeys (in newKeys order), "removed" is the oldKeys not present in
newKeys (in oldKeys order), and "reused" is the newKeys that were also
present in oldKeys (in newKeys order — reused items keep their identity
even if their position changed).`,
    starterCode: `function diffKeyedList(oldKeys, newKeys) {
  // your code here
}`,
    solutionCode: `function diffKeyedList(oldKeys, newKeys) {
  const oldSet = new Set(oldKeys);
  const newSet = new Set(newKeys);
  const added = newKeys.filter((k) => !oldSet.has(k));
  const removed = oldKeys.filter((k) => !newSet.has(k));
  const reused = newKeys.filter((k) => oldSet.has(k));
  return { added, removed, reused };
}`,
    testCases: [
      {
        name: "identical lists reuse everything",
        args: () => [["a", "b", "c"], ["a", "b", "c"]],
        expected: { added: [], removed: [], reused: ["a", "b", "c"] },
      },
      {
        name: "adds new keys, removes missing ones",
        args: () => [["a", "b", "c"], ["b", "c", "d"]],
        expected: { added: ["d"], removed: ["a"], reused: ["b", "c"] },
      },
      {
        name: "everything is added from an empty list",
        args: () => [[], ["x", "y"]],
        expected: { added: ["x", "y"], removed: [], reused: [] },
      },
      {
        name: "everything is removed down to an empty list",
        args: () => [["x", "y"], []],
        expected: { added: [], removed: ["x", "y"], reused: [] },
      },
      {
        name: "reordering keeps identity without add/remove",
        args: () => [["a", "b"], ["b", "a"]],
        expected: { added: [], removed: [], reused: ["b", "a"] },
      },
    ],
  },
};

export default reactRenderingKeys;
