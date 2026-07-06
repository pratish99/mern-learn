import type { ModuleContent } from "@/lib/types";

const reactUseEffect: ModuleContent = {
  id: "react-useeffect",
  title: "useEffect & dependency arrays",
  category: "Hooks & State",
  order: 5,
  explanation: `
A component function's job is to return an element tree describing the
UI — it's meant to be free of side effects (no fetching, no subscribing
to sockets, no manually touching \`document\`) so React is free to call it
as often as it needs to. \`useEffect\` is the escape hatch: it schedules a
function to run **after** React has committed the render to the DOM,
which is the right time to do things that touch the outside world.

\`\`\`jsx
useEffect(() => {
  document.title = \`\${count} clicks\`;
});
\`\`\`

With no second argument, this effect re-runs after **every** render —
useful sometimes, but usually wasteful and occasionally dangerous (an
effect that starts a subscription would resubscribe on every render).

### The dependency array controls when it reruns

\`\`\`jsx
useEffect(() => {
  document.title = \`\${count} clicks\`;
}, [count]);
\`\`\`

The array is a list of values the effect actually depends on. React
compares each entry against its value from the previous render using
\`Object.is\` (essentially \`===\`, but treating \`NaN\` as equal to itself —
one edge case plain \`===\` gets wrong). If every entry is unchanged, the
effect is skipped entirely for that render. An empty array (\`[]\`) means
"nothing it depends on ever changes," so it effectively runs once, right
after the first render — the classic pattern for "fetch data on mount."

### The "new object every render" trap

\`Object.is\` compares by reference for objects, arrays, and functions —
not by deep equality. This is a frequent source of effects that fire on
every render despite looking like they shouldn't:

\`\`\`jsx
useEffect(() => {
  fetchResults(filters);
}, [filters]); // filters = { category: "books" } created fresh in the parent every render
\`\`\`

Even if \`filters\` looks identical in shape every time, a new object
literal is a new reference, so the dependency is "changed" on every
render and the effect refires constantly. The fix is either to depend on
the object's primitive fields directly (\`[filters.category]\`) or to
memoize the object itself (covered in the memoization module) so its
reference stays stable when its contents don't change.

### Cleanup

If the function passed to \`useEffect\` returns another function, React
calls that returned function right before the effect runs again (and on
unmount) — this is how subscriptions, timers, and event listeners get
torn down so they don't leak or double-fire.

### Why this matters

The dependency array isn't a list of "things that trigger the effect" in
some declarative sense — it's the literal input to an \`Object.is\`
comparison against last render's values. Once that clicks, "why does my
effect run every render" almost always traces back to a new
object/array/function reference being recreated on every render and
handed to the dependency array.
`.trim(),
  codeExamples: [
    {
      title: "Dependency array shapes and their meaning",
      code: `useEffect(() => { sync(); });          // no array: runs after every render
useEffect(() => { sync(); }, []);      // empty array: runs once, after mount
useEffect(() => { sync(count); }, [count]); // runs only when "count" changes`,
    },
    {
      title: "A new object reference defeats the dependency check",
      code: `// Bug: { category } is a brand-new object every render
useEffect(() => fetchResults({ category }), [{ category }]);

// Fix: depend on the primitive value instead
useEffect(() => fetchResults({ category }), [category]);`,
    },
  ],
  challenge: {
    functionName: "shouldRerunEffect",
    prompt: `Write shouldRerunEffect(prevDeps, nextDeps) that mimics React's dependency
comparison for useEffect. prevDeps is null on the first render (the effect
must always run). If nextDeps is undefined, there is no dependency array,
so the effect always reruns. Otherwise, compare prevDeps and nextDeps
element-by-element using Object.is (so NaN counts as equal to itself, but
two different object references never do) — return true if the arrays
differ in length or in any element, and false if every element is
unchanged.`,
    starterCode: `function shouldRerunEffect(prevDeps, nextDeps) {
  // your code here
}`,
    solutionCode: `function shouldRerunEffect(prevDeps, nextDeps) {
  if (prevDeps === null) return true;
  if (nextDeps === undefined) return true;
  if (prevDeps.length !== nextDeps.length) return true;
  return nextDeps.some((dep, i) => !Object.is(dep, prevDeps[i]));
}`,
    testCases: [
      {
        name: "first render always runs",
        args: () => [null, [1, 2]],
        expected: true,
      },
      {
        name: "identical deps skip the effect",
        args: () => [[1, 2], [1, 2]],
        expected: false,
      },
      {
        name: "a changed dependency reruns the effect",
        args: () => [[1, 2], [1, 3]],
        expected: true,
      },
      {
        name: "no dependency array runs every render",
        args: () => [[], undefined],
        expected: true,
      },
      {
        name: "empty dependency array runs only once",
        args: () => [[], []],
        expected: false,
      },
      {
        name: "NaN is stable via Object.is",
        args: () => [[NaN], [NaN]],
        expected: false,
      },
      {
        name: "a new object reference reruns the effect even with the same shape",
        args: () => [[{ a: 1 }], [{ a: 1 }]],
        expected: true,
      },
    ],
  },
};

export default reactUseEffect;
