import type { ModuleContent } from "@/lib/types";

const reactLiftingState: ModuleContent = {
  id: "react-lifting-state",
  title: "Lifting state up",
  category: "Data Flow & Composition",
  order: 7,
  explanation: `
Data in React flows one way: down, from parent to child, via props.
There's no built-in way for a component to reach sideways into a sibling
or upward into its parent's state. So what happens when two sibling
components need to stay in sync — like an accordion where opening one
panel should close the others?

The answer is **lifting state up**: instead of each panel tracking its
own "am I open?" boolean, move that state to the nearest common
ancestor, and have it pass down both the current value and a callback
that lets children request a change.

\`\`\`mermaid
flowchart TD
  Parent["Accordion (owns openId state)"]
  Parent -->|"props: isOpen, onToggle"| PanelA["Panel A"]
  Parent -->|"props: isOpen, onToggle"| PanelB["Panel B"]
  PanelA -.->|"onToggle(): 'I was clicked'"| Parent
  PanelB -.->|"onToggle(): 'I was clicked'"| Parent
\`\`\`

The dashed arrows are intentionally different from the solid ones: a
panel never hands \`Accordion\` a new state value directly, only an
"I was clicked" signal via the callback prop — \`Accordion\` alone decides
what that means for \`openId\`, and the result flows back down as props on
the next render.

\`\`\`jsx
function Accordion({ items }) {
  const [openId, setOpenId] = useState(null);

  return items.map((item) => (
    <Panel
      key={item.id}
      title={item.title}
      isOpen={item.id === openId}
      onToggle={() => setOpenId(openId === item.id ? null : item.id)}
    />
  ));
}

function Panel({ title, isOpen, onToggle }) {
  return (
    <div>
      <button onClick={onToggle}>{title}</button>
      {isOpen && <p>Panel content</p>}
    </div>
  );
}
\`\`\`

\`Panel\` itself holds no state at all — it's a pure function of
\`isOpen\`, and \`onToggle\` is its only way to ask for a change. Because
\`Accordion\` is the single source of truth for "which one is open," it
can trivially enforce "only one at a time": clicking a panel just tells
the parent which id was clicked, and the parent's own logic decides what
the new open id should be.

### Why not let each panel manage its own state?

If each \`Panel\` kept its own \`const [isOpen, setIsOpen] = useState(false)\`,
there would be no way to express "closing this one should also close
that one" — the two \`useState\` calls are completely isolated from each
other, by design (that's the whole point of local component state). The
only way to coordinate siblings is to give them a shared parent that
owns the one piece of state they both need to agree on.

### The callback-prop pattern

Notice \`onToggle\` doesn't pass the new state value down — it's the
child announcing an *intent* ("I was clicked"), and the parent decides
*what that means* for its own state. This separation — children request,
parents decide — is what keeps "lifting state up" from turning into
messy two-way binding; data still only flows one direction (down as
props), it's just that the *decision* about how state changes now lives
higher up the tree.

### Why this matters

"Lifting state up" isn't a special API — it's the direct consequence of
one-way data flow: if two components need to share or coordinate state,
the *only* place that can hold it is a common ancestor, and the *only*
way children can influence it is a function passed down as a prop.
`.trim(),
  codeExamples: [
    {
      title: "Shared state moves to the common parent",
      code: `function Accordion({ items }) {
  const [openId, setOpenId] = useState(null);
  return items.map((item) => (
    <Panel
      key={item.id}
      isOpen={item.id === openId}
      onToggle={() => setOpenId(openId === item.id ? null : item.id)}
      title={item.title}
    />
  ));
}`,
    },
    {
      title: "The child only requests; the parent decides",
      code: `function Panel({ title, isOpen, onToggle }) {
  // Panel has no state of its own — isOpen and onToggle come entirely from the parent
  return (
    <div>
      <button onClick={onToggle}>{title}</button>
      {isOpen && <p>Details for {title}</p>}
    </div>
  );
}`,
    },
  ],
  challenge: {
    functionName: "selectAccordionItem",
    prompt: `Write selectAccordionItem(openId, clickedId) that implements the state
transition an accordion's parent component would run in its onToggle
callback. If the clicked item is already the open one, close it (return
null). Otherwise, open the clicked item, implicitly closing whatever else
was open (return clickedId) — enforcing that at most one item is open at
a time.`,
    starterCode: `function selectAccordionItem(openId, clickedId) {
  // your code here
}`,
    solutionCode: `function selectAccordionItem(openId, clickedId) {
  return openId === clickedId ? null : clickedId;
}`,
    testCases: [
      {
        name: "opening the first item",
        args: () => [null, "faq-1"],
        expected: "faq-1",
      },
      {
        name: "clicking the open item closes it",
        args: () => ["faq-1", "faq-1"],
        expected: null,
      },
      {
        name: "switching closes the old item and opens the new one",
        args: () => ["faq-1", "faq-2"],
        expected: "faq-2",
      },
      {
        name: "no item open initially",
        args: () => [undefined, "faq-1"],
        expected: "faq-1",
      },
      {
        name: "switching between two other items",
        args: () => ["faq-2", "faq-3"],
        expected: "faq-3",
      },
    ],
  },
};

export default reactLiftingState;
