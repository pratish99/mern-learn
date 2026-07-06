import type { ModuleContent } from "@/lib/types";

const reactJsxElements: ModuleContent = {
  id: "react-jsx-elements",
  title: "JSX & elements",
  category: "Fundamentals",
  order: 1,
  explanation: `
JSX looks like HTML sitting inside JavaScript, which makes it tempting to
think of it as a template language — something React "parses" at runtime.
It isn't. JSX is pure syntax sugar. A build step (Babel, or the TypeScript
compiler) rewrites every JSX tag into a plain function call **before your
code ever runs**. React never sees angle brackets.

### What JSX compiles to

\`\`\`jsx
const element = <h1 className="title">Hello</h1>;
\`\`\`

compiles to:

\`\`\`js
const element = React.createElement("h1", { className: "title" }, "Hello");
\`\`\`

\`createElement(type, props, ...children)\` doesn't create a DOM node, run
any component code, or touch the screen. It just returns a plain,
serializable JavaScript object describing what you *want* rendered:

\`\`\`js
{ type: "h1", props: { className: "title", children: "Hello" } }
\`\`\`

That's it. That object is a "React element." It's immutable, cheap to
create, and inert — React reads the tree of these objects later (during
rendering) to decide what real DOM nodes to create or update. This
data-first design is why libraries like React Testing Library, or
React's own diffing algorithm, can reason about "what should be on
screen" without ever touching a browser.

### Children collapse to whatever shape they actually have

Look closely at the object above: \`children\` is the *string* \`"Hello"\`,
not \`["Hello"]\`. \`createElement\` special-cases the child arguments it
receives:

- **Zero children** → no \`children\` key is added at all.
- **Exactly one child** → \`props.children\` is that value directly.
- **Two or more children** → \`props.children\` is an array of them.

\`\`\`jsx
<br />                      // props: {}  (children collapsed — none passed)
<p>Hi</p>                   // props: { children: "Hi" }  (single value, not an array)
<ul><li>a</li><li>b</li></ul> // props.children: [<li>a</li>, <li>b</li>]  (array)
\`\`\`

This is why \`props.children\` can be a string, a single element, an
array, or \`undefined\` depending on how a component was used — code that
processes \`children\` (like \`React.Children.map\`) has to handle all of
these shapes, precisely because \`createElement\` never normalizes them
into "always an array."

### Fragments are just another element type

\`<>...</>\` compiles to \`React.createElement(React.Fragment, null, ...)\`
— a \`type\` that happens to be a special symbol React recognizes as "don't
create a wrapper DOM node, just render the children in place." Nothing
about \`createElement\` itself changes; \`Fragment\` is just a value for
\`type\`, the same way \`"div"\` or a component function would be.

### Why this matters

Once "JSX is \`createElement\` calls that return plain objects" clicks,
a lot of React stops being magic: conditional rendering is just
JavaScript \`&&\`/ternaries choosing which object (or \`null\`) to return;
lists are just \`.map()\` producing an array of objects; and the
"element tree" React reconciles against the DOM is nothing more than
nested plain objects built by ordinary function calls.
`.trim(),
  codeExamples: [
    {
      title: "JSX vs. the createElement calls it compiles to",
      code: `// What you write:
const greeting = <p className="lead">Hello, {name}</p>;

// What the compiler produces:
const greeting = React.createElement(
  "p",
  { className: "lead" },
  "Hello, ",
  name
);`,
    },
    {
      title: "Children shape depends on how many were passed",
      code: `React.createElement("br", null);
// -> { type: "br", props: {} }

React.createElement("p", null, "Hi");
// -> { type: "p", props: { children: "Hi" } }

React.createElement("ul", null, "a", "b");
// -> { type: "ul", props: { children: ["a", "b"] } }`,
    },
  ],
  challenge: {
    functionName: "createElement",
    prompt: `Implement a simplified createElement(type, props, ...children) — the
function JSX compiles down to. Return { type, props } where props is the
given props object (or {} if props is null/undefined) with a children key
added following React's own collapsing rule: zero children arguments means
no children key is added at all; exactly one child means props.children is
that value directly (not wrapped in an array); two or more children means
props.children is an array of them.`,
    starterCode: `function createElement(type, props, ...children) {
  // your code here
}`,
    solutionCode: `function createElement(type, props, ...children) {
  const fullProps = Object.assign({}, props || {});
  if (children.length === 1) {
    fullProps.children = children[0];
  } else if (children.length > 1) {
    fullProps.children = children;
  }
  return { type, props: fullProps };
}`,
    testCases: [
      {
        name: "single child",
        args: () => ["h1", null, "Hello"],
        expected: { type: "h1", props: { children: "Hello" } },
      },
      {
        name: "no children",
        args: () => ["br", null],
        expected: { type: "br", props: {} },
      },
      {
        name: "multiple children become an array",
        args: () => ["ul", null, "a", "b", "c"],
        expected: { type: "ul", props: { children: ["a", "b", "c"] } },
      },
      {
        name: "props plus a single child",
        args: () => ["div", { className: "box" }, "content"],
        expected: { type: "div", props: { className: "box", children: "content" } },
      },
      {
        name: "a nested element as a child",
        args: () => ["div", null, { type: "span", props: { children: "x" } }],
        expected: { type: "div", props: { children: { type: "span", props: { children: "x" } } } },
      },
    ],
  },
};

export default reactJsxElements;
