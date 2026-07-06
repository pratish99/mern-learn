import type { ModuleContent } from "@/lib/types";

const reactMemoPerformance: ModuleContent = {
  id: "react-memo-performance",
  title: "React.memo, useMemo & useCallback",
  category: "Performance & Patterns",
  order: 11,
  explanation: `
By default, when a component re-renders, React also re-renders every
component nested inside it — even ones whose props didn't actually
change. Usually that's cheap enough not to matter, since re-rendering a
component just means calling its function again and diffing the result
(the reconciliation module); it's not the same cost as touching the real
DOM. But for expensive subtrees, skipping unnecessary re-renders is
worth doing deliberately.

\`React.memo\` wraps a component so that React skips re-rendering it when
its props are the same as last time:

\`\`\`jsx
const ExpensiveRow = React.memo(function ExpensiveRow({ label, value }) {
  // ...expensive rendering work...
});
\`\`\`

"The same" here means a **shallow** comparison: each prop is compared
with \`Object.is\` (the same reference-equality check the dependency array
uses), one level deep. It does not recursively compare object contents.

### Why new references defeat memo

This shallow check is exactly why wrapping a component in \`React.memo\`
sometimes appears to do nothing:

\`\`\`jsx
<ExpensiveRow
  label="Total"
  value={5}
  style={{ color: "red" }}       // a NEW object every render
  onClick={() => doSomething()}  // a NEW function every render
/>
\`\`\`

\`style\` and \`onClick\` are freshly created on every render of the parent,
so \`Object.is\` sees them as different every time, no matter that they
"look" the same — \`React.memo\` correctly does its job and detects a
prop change, because there genuinely was one (a new reference), even
though nothing meaningful changed.

### useMemo and useCallback stabilize references

\`useMemo\` and \`useCallback\` don't make anything faster on their own —
they exist purely to give a value or function a **stable reference**
across renders, so that shallow-equality checks (in \`React.memo\`, or in
a \`useEffect\` dependency array) can actually see "unchanged":

\`\`\`jsx
const style = useMemo(() => ({ color: "red" }), []);       // same object every render
const handleClick = useCallback(() => doSomething(), []);  // same function every render

<ExpensiveRow label="Total" value={5} style={style} onClick={handleClick} />
\`\`\`

Now \`ExpensiveRow\`'s \`React.memo\` check sees the same references it saw
last time (as long as the dependency arrays of the \`useMemo\`/\`useCallback\`
calls haven't changed) and correctly skips the re-render.

### Why this matters

None of this is free — \`useMemo\`/\`useCallback\` themselves cost a bit of
memory and a comparison on every render, and \`React.memo\`'s prop
comparison isn't free either. Reach for them when profiling actually
shows a component re-rendering expensively and unnecessarily, not
reflexively on every component — "optimize by default" here often costs
more than the re-renders it prevents.
`.trim(),
  codeExamples: [
    {
      title: "A new inline object defeats React.memo",
      code: `// Every render creates a new {} — memo's shallow check always sees a change
<ExpensiveRow style={{ color: "red" }} />

// useMemo keeps the same reference across renders (while deps are unchanged)
const style = useMemo(() => ({ color: "red" }), []);
<ExpensiveRow style={style} />`,
    },
    {
      title: "useCallback for stable event handler references",
      code: `// New function every render, even though its behavior never changes
<ExpensiveRow onClick={() => doSomething(id)} />

// Stable reference — changes only if "id" changes
const onClick = useCallback(() => doSomething(id), [id]);
<ExpensiveRow onClick={onClick} />`,
    },
  ],
  challenge: {
    functionName: "shallowEqual",
    prompt: `Write shallowEqual(objA, objB), the comparison React.memo uses by default
to decide whether props changed. First check objA and objB with Object.is
directly (handles identical references and matching primitives, including
NaN). If that fails and either isn't a non-null object, return false.
Otherwise compare their own keys: same number of keys, and every value in
objA equal to the corresponding value in objB via Object.is (one level
deep — do not recurse into nested objects).`,
    starterCode: `function shallowEqual(objA, objB) {
  // your code here
}`,
    solutionCode: `function shallowEqual(objA, objB) {
  if (Object.is(objA, objB)) return true;
  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false;
  }
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(
    (key) => Object.prototype.hasOwnProperty.call(objB, key) && Object.is(objA[key], objB[key])
  );
}`,
    testCases: [
      {
        name: "same keys and values",
        args: () => [{ a: 1, b: 2 }, { a: 1, b: 2 }],
        expected: true,
      },
      {
        name: "a differing value",
        args: () => [{ a: 1, b: 2 }, { a: 1, b: 3 }],
        expected: false,
      },
      {
        name: "nested objects are compared by reference, not shape",
        args: () => [{ a: { x: 1 } }, { a: { x: 1 } }],
        expected: false,
      },
      {
        name: "NaN is equal to itself via Object.is",
        args: () => [{ a: NaN }, { a: NaN }],
        expected: true,
      },
      {
        name: "different key counts",
        args: () => [{ a: 1 }, { a: 1, b: 2 }],
        expected: false,
      },
      {
        name: "primitives compare directly",
        args: () => [5, 5],
        expected: true,
      },
    ],
  },
};

export default reactMemoPerformance;
