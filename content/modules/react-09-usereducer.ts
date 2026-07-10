import type { ModuleContent } from "@/lib/types";

const reactUseReducer: ModuleContent = {
  id: "react-usereducer",
  title: "useReducer",
  category: "Data Flow & Composition",
  order: 9,
  explanation: `
\`useState\` works well while a component has a handful of independent
values. It starts to strain once several pieces of state change
together in response to the same events — a shopping cart where adding,
removing, and clearing items all need to update the same \`items\` array
consistently. Scattering that logic across several \`onClick\` handlers,
each doing its own \`setItems(...)\` with slightly different spreading
logic, is exactly the kind of duplication that invites bugs.

\`useReducer\` centralizes it. Instead of many setters, you get one
\`dispatch\` function and one **reducer**: a pure function of
\`(state, action) => newState\` that describes every possible transition
in one place.

\`\`\`jsx
function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM":
      return { ...state, items: [...state.items, { id: action.id, qty: 1 }] };
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "CLEAR":
      return { ...state, items: [] };
    default:
      throw new Error(\`Unknown action type: \${action.type}\`);
  }
}

const [cart, dispatch] = useReducer(cartReducer, { items: [] });

dispatch({ type: "ADD_ITEM", id: "apple" });
\`\`\`

This is the same "functional update" idea from \`useState\` — never mutate
\`state\` in place, always return a new object — just generalized from "one
value, one updater function" to "one value, a menu of named transitions."

\`\`\`mermaid
sequenceDiagram
  participant UI as Component
  participant D as dispatch
  participant R as cartReducer
  UI->>D: dispatch({ type: "ADD_ITEM", id })
  D->>R: cartReducer(state, action)
  R-->>D: newState
  D-->>UI: React re-renders with newState
\`\`\`

\`dispatch\` doesn't compute anything itself — it just hands the current
\`state\` and the \`action\` off to \`cartReducer\`, which is the only place
that decides what the new state looks like. React then re-renders the
component with whatever the reducer returned.

### Actions describe intent, not the new state

A component calling \`dispatch({ type: "ADD_ITEM", id: "apple" })\` doesn't
need to know *how* the cart represents items internally, whether adding
an existing item bumps its quantity or appends a duplicate row, or
anything else about the current shape of state. It only says what
happened. All of the "what this means for state" logic lives in one
reducer function, which makes it straightforward to unit-test in
isolation — it's a plain function, no rendering or hooks involved — and
hard to get inconsistent, since there's exactly one code path for each
action type instead of one \`setState\` call per event handler.

### The default case matters

Throwing (or otherwise flagging) an unrecognized \`action.type\` in the
\`default\` case isn't defensive boilerplate — it's what turns a typo'd
action type (\`"ADD_ITEM"\` vs. \`"ADD-ITEM"\`) into an immediate, loud
failure instead of a silent no-op that's much harder to track down
later.

### Why this matters

\`useReducer\` is \`useState\` with the update logic factored out into a
named, testable function instead of inlined at every call site. Reach
for it exactly when \`setState\` calls start needing to know about each
other's shape to stay consistent — that's the signal that the transition
logic deserves to live in one place.
`.trim(),
  codeExamples: [
    {
      title: "Dispatching named actions instead of many setters",
      code: `const [cart, dispatch] = useReducer(cartReducer, { items: [] });

dispatch({ type: "ADD_ITEM", id: "apple" });
dispatch({ type: "REMOVE_ITEM", id: "pear" });
dispatch({ type: "CLEAR" });`,
    },
    {
      title: "The reducer is a plain, pure function",
      code: `function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM":
      return { ...state, items: [...state.items, { id: action.id, qty: 1 }] };
    case "CLEAR":
      return { ...state, items: [] };
    default:
      throw new Error(\`Unknown action type: \${action.type}\`);
  }
}

// Testable with no React involved at all:
cartReducer({ items: [] }, { type: "ADD_ITEM", id: "apple" });`,
    },
  ],
  challenge: {
    functionName: "cartReducer",
    prompt: `Write cartReducer(state, action) for a shopping cart, where state is
{ items: [{ id, qty }, ...] }. Support three action types: "ADD_ITEM"
(action.id) adds a new item with qty 1, or increments qty by 1 if that id
is already in the cart; "REMOVE_ITEM" (action.id) removes the item with
that id entirely; "CLEAR" empties the cart. Never mutate the input state
or its items array — always return new objects/arrays. For any other
action.type, throw an Error whose message is
\`Unknown action type: \${action.type}\`.`,
    starterCode: `function cartReducer(state, action) {
  // your code here
}`,
    solutionCode: `function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((item) => item.id === action.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.id ? { ...item, qty: item.qty + 1 } : item
          ),
        };
      }
      return { ...state, items: [...state.items, { id: action.id, qty: 1 }] };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((item) => item.id !== action.id) };
    case "CLEAR":
      return { ...state, items: [] };
    default:
      throw new Error(\`Unknown action type: \${action.type}\`);
  }
}`,
    testCases: [
      {
        name: "adding a new item",
        args: () => [{ items: [] }, { type: "ADD_ITEM", id: "apple" }],
        expected: { items: [{ id: "apple", qty: 1 }] },
      },
      {
        name: "adding an existing item bumps its quantity",
        args: () => [{ items: [{ id: "apple", qty: 1 }] }, { type: "ADD_ITEM", id: "apple" }],
        expected: { items: [{ id: "apple", qty: 2 }] },
      },
      {
        name: "removing an item",
        args: () => [
          { items: [{ id: "apple", qty: 2 }, { id: "pear", qty: 1 }] },
          { type: "REMOVE_ITEM", id: "apple" },
        ],
        expected: { items: [{ id: "pear", qty: 1 }] },
      },
      {
        name: "clearing the cart",
        args: () => [{ items: [{ id: "a", qty: 1 }] }, { type: "CLEAR" }],
        expected: { items: [] },
      },
      {
        name: "throws on an unknown action type",
        args: () => [{ items: [] }, { type: "NOPE" }],
        expectedError: "Unknown action type",
      },
    ],
  },
};

export default reactUseReducer;
