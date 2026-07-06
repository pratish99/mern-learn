import type { ModuleContent } from "@/lib/types";

const reactCustomHooks: ModuleContent = {
  id: "react-custom-hooks",
  title: "Custom hooks",
  category: "Performance & Patterns",
  order: 10,
  explanation: `
\`useState\`, \`useEffect\`, and \`useReducer\` are building blocks, not the
whole vocabulary. When the same combination of hooks and logic shows up
in multiple components, you can factor it out into your own function —
a **custom hook**. The only thing that makes it a hook rather than a
regular helper function is the naming convention (\`useSomething\`) and
the fact that it calls other hooks internally; there's no special syntax
or registration step.

\`\`\`jsx
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = () => setValue((v) => !v);
  return [value, toggle];
}

function Modal() {
  const [isOpen, toggleOpen] = useToggle(false);
  return <button onClick={toggleOpen}>{isOpen ? "Close" : "Open"}</button>;
}
\`\`\`

\`useToggle\` is just a function that happens to call \`useState\` and
return a pair, exactly like \`useState\` itself does. Every component that
calls \`useToggle\` gets its **own** independent \`value\`/\`setValue\` pair —
calling a hook doesn't share state between callers, it shares *logic*.

### A canonical example: usePrevious

A common need is "what was this value on the last render, before it
changed?" There's no built-in hook for that, but it's a short custom one
built from a \`ref\` (a mutable box that survives across renders without
triggering a re-render when written to) and an effect:

\`\`\`jsx
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value; // runs AFTER this render commits
  });
  return ref.current;    // whatever was stored during the PREVIOUS render's effect
}
\`\`\`

The ordering is the whole trick: during a given render, \`usePrevious\`
returns \`ref.current\` *before* the effect for that render has run, so it
reflects whatever the *previous* render's effect stored. Only after this
render commits does the effect update \`ref.current\` to the current
value, ready to be read as "previous" next time. A \`useState\` couldn't
do this without an extra render (setting state triggers a re-render;
mutating a ref does not), which is exactly why refs — not state — are
the right tool for "track a value without displaying it or causing a
render."

### Why this matters

Custom hooks are how React code stays composable without inheritance,
mixins, or higher-order components: complex stateful logic (data
fetching, subscriptions, animation, form handling) can be extracted,
tested, and reused as an ordinary function call, while every component
using it keeps its own private, isolated copy of that state.
`.trim(),
  codeExamples: [
    {
      title: "A tiny reusable hook",
      code: `function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  return [value, () => setValue((v) => !v)];
}

// Two independent instances — toggling one never affects the other
const [menuOpen, toggleMenu] = useToggle();
const [modalOpen, toggleModal] = useToggle();`,
    },
    {
      title: "usePrevious via a ref and an effect",
      code: `function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function Counter() {
  const [count, setCount] = useState(0);
  const previousCount = usePrevious(count);
  return <p>Now: {count}, before: {previousCount}</p>;
}`,
    },
  ],
  challenge: {
    functionName: "trackPreviousValues",
    prompt: `Write trackPreviousValues(values) that simulates what a component calling
usePrevious would see across a sequence of renders. "values" is the value
passed to usePrevious on each successive render, in order. Return an array
where entry i is what usePrevious would have returned during render i:
undefined on the very first render (no previous value exists yet), and
otherwise the value from the immediately preceding render — remembering
that the ref backing usePrevious only updates to this render's value
AFTER this render's result has already been read.`,
    starterCode: `function trackPreviousValues(values) {
  // your code here
}`,
    solutionCode: `function trackPreviousValues(values) {
  const previousAtEachRender = [];
  let previous;
  for (const value of values) {
    previousAtEachRender.push(previous);
    previous = value;
  }
  return previousAtEachRender;
}`,
    testCases: [
      {
        name: "each render sees the prior render's value",
        args: () => [[1, 2, 3]],
        expected: [undefined, 1, 2],
      },
      {
        name: "no renders means no previous values",
        args: () => [[]],
        expected: [],
      },
      {
        name: "the first render has no previous value",
        args: () => [["a"]],
        expected: [undefined],
      },
      {
        name: "repeated values are still tracked per render",
        args: () => [[10, 10, 20]],
        expected: [undefined, 10, 10],
      },
      {
        name: "works with booleans",
        args: () => [[true, false, false, true]],
        expected: [undefined, true, false, false],
      },
    ],
  },
};

export default reactCustomHooks;
