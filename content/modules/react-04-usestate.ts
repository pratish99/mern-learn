import type { ModuleContent } from "@/lib/types";

const reactUseState: ModuleContent = {
  id: "react-usestate",
  title: "useState & state updates",
  category: "Hooks & State",
  order: 4,
  explanation: `
A component function re-running on every render (from the previous
module) raises an obvious question: where does data survive *between*
renders if the whole function runs again from scratch? A local
\`let count = 0\` inside the component body would just get reset to \`0\`
every time. \`useState\` is React's answer — it's a piece of storage that
lives outside the function body, tied to that specific component
instance, that survives across renders.

\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
\`\`\`

\`useState(0)\` returns a pair: the **current** value for *this* render,
and a setter function. Calling the setter doesn't mutate anything
immediately — it tells React "schedule a re-render of this component,
and next time, hand back this new value instead." The \`count\` variable
inside any single render is just a plain, immutable number; it never
changes mid-render. Only a fresh call to the component function (a new
render) can produce a different \`count\`.

### The stale closure trap

Because \`count\` inside a given render is fixed, this doesn't do what it
looks like it does:

\`\`\`jsx
function handleClick() {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
}
\`\`\`

All three calls close over the *same* \`count\` from this render. Each one
says "set state to \`count + 1\`" — the same instruction three times, not
"add one, three times." The button ends up +1, not +3.

### Functional updates fix it

\`setCount\` also accepts a function, which React calls with whatever the
**latest, most up-to-date** state is at the moment the update is applied
— not the value captured in this render's closure:

\`\`\`jsx
function handleClick() {
  setCount((prev) => prev + 1);
  setCount((prev) => prev + 1);
  setCount((prev) => prev + 1);
}
\`\`\`

Now each call reads the result of the one before it, so the button
correctly ends up +3. The rule of thumb: if a state update depends on
the *previous* state, use the functional form; if it's just setting an
independent new value (like the text from an input), passing the value
directly is fine.

### Why this matters

\`useState\` isn't a magic variable — it's a queue of "next value or
updater" instructions applied in order against the latest state,
resolved before the next render runs. Understanding that resolves both
the classic "clicking a button three times only adds one" bug and the
general question of why state "changes" never appear inside the same
render that triggered them.
`.trim(),
  codeExamples: [
    {
      title: "Direct value vs. functional update",
      code: `const [count, setCount] = useState(0);

setCount(5);              // direct: state becomes exactly 5
setCount((prev) => prev + 1); // functional: reads the latest state, whatever it is`,
    },
    {
      title: "The stale-closure bug and its fix",
      code: `// Bug: all three read the same closed-over "count"
setCount(count + 1);
setCount(count + 1);
setCount(count + 1); // net effect: +1, not +3

// Fix: each updater sees the previous updater's result
setCount((prev) => prev + 1);
setCount((prev) => prev + 1);
setCount((prev) => prev + 1); // net effect: +3`,
    },
  ],
  challenge: {
    functionName: "applyStateUpdates",
    prompt: `Write applyStateUpdates(initialValue, updates) that simulates a sequence of
setState calls applied to the same piece of state, the way React resolves
them before the next render. "updates" is an array where each entry is
either a plain value (a direct update, replacing the state outright) or a
function (a functional update, called with the current value to produce
the next one). Apply them in order and return the final value.`,
    starterCode: `function applyStateUpdates(initialValue, updates) {
  // your code here
}`,
    solutionCode: `function applyStateUpdates(initialValue, updates) {
  let value = initialValue;
  for (const updater of updates) {
    value = typeof updater === "function" ? updater(value) : updater;
  }
  return value;
}`,
    testCases: [
      {
        name: "direct values overwrite, last one wins",
        args: () => [0, [1, 2, 3]],
        expected: 3,
      },
      {
        name: "functional updates accumulate correctly",
        args: () => [0, [(c: number) => c + 1, (c: number) => c + 1, (c: number) => c + 1]],
        expected: 3,
      },
      {
        name: "mixing functional and direct updates",
        args: () => [5, [(c: number) => c * 2, 10, (c: number) => c + 1]],
        expected: 11,
      },
      {
        name: "works with non-number state",
        args: () => ["a", ["b", (s: string) => s + "c"]],
        expected: "bc",
      },
      {
        name: "no updates returns the initial value",
        args: () => [0, []],
        expected: 0,
      },
    ],
  },
};

export default reactUseState;
