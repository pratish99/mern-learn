import type { ModuleContent } from "@/lib/types";

const reactErrorBoundaries: ModuleContent = {
  id: "react-error-boundaries",
  title: "Error boundaries",
  category: "Performance & Patterns",
  order: 12,
  explanation: `
By default, a JavaScript error thrown anywhere while rendering unmounts
the **entire** React tree — one broken widget can blank out an entire
page. That's rarely what you want; a failure in a sidebar widget
shouldn't take down the whole app. Error boundaries let you contain that
blast radius to a subtree, the same way a \`try/catch\` contains a
synchronous error to the block that threw it.

\`\`\`jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logErrorToService(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <p>Something went wrong.</p>;
    }
    return this.props.children;
  }
}

<ErrorBoundary>
  <Sidebar />
</ErrorBoundary>;
\`\`\`

If \`Sidebar\` (or anything inside it) throws while rendering,
\`getDerivedStateFromError\` runs, the boundary re-renders with its
fallback UI instead, and the rest of the page — everything outside the
boundary — stays intact and interactive.

\`\`\`mermaid
flowchart BT
  Leaf["Deeply nested component throws during render"] --> Mid["Intermediate component"]
  Mid --> Boundary["Nearest ErrorBoundary (catches it)"]
  Boundary --> Root["App root (untouched)"]
  Boundary -.->|"replaces the crashed subtree with"| Fallback["Fallback UI"]
\`\`\`

The error propagates upward through the tree until it reaches the
*nearest* ancestor that is an error boundary — components further up
(like the app root) never see it at all, since the boundary swaps in its
fallback instead of letting the failure keep bubbling.

### Error boundaries must be class components

There is currently no hook equivalent of \`getDerivedStateFromError\` /
\`componentDidCatch\` — catching render errors is one of the few things
you still need a class component for. In practice, most codebases write
this class once (or use a library like \`react-error-boundary\` that wraps
it for you) and never write another class component again.

### What they do and don't catch

An error boundary only catches errors thrown **during rendering**, in
lifecycle methods, or in constructors of the tree below it. It does
**not** catch:

- Errors thrown inside event handlers (\`onClick\`, \`onChange\`, ...) —
  those are just synchronous functions called outside of React's render
  cycle; use an ordinary \`try/catch\` inside the handler itself.
- Errors in asynchronous code (a \`setTimeout\` callback, a rejected
  \`fetch\` promise) — again, nothing to do with rendering.
- Errors thrown by the error boundary component itself — a boundary can't
  catch its own failures, only its children's; you'd need another
  boundary further up the tree for that.
- Server-side rendering errors.

### Why this matters

Treat error boundaries the way you'd treat \`try/catch\` around a specific
risky operation, not a global safety net you wrap around everything:
place them around subtrees that can plausibly fail independently of the
rest of the page (a third-party widget, a chart that might get malformed
data) so a rendering bug degrades gracefully into a small fallback
message instead of taking the whole UI down with it.
`.trim(),
  codeExamples: [
    {
      title: "Containing a failure to one subtree",
      code: `<Page>
  <ErrorBoundary fallback={<p>Chart failed to load.</p>}>
    <Chart data={data} />
  </ErrorBoundary>
  <Comments /> {/* stays intact even if Chart throws while rendering */}
</Page>`,
    },
    {
      title: "What boundaries don't catch — handle it yourself",
      code: `function SubmitButton() {
  async function handleClick() {
    try {
      await submitForm(); // NOT caught by any error boundary
    } catch (err) {
      showToast(err.message);
    }
  }
  return <button onClick={handleClick}>Submit</button>;
}`,
    },
  ],
  challenge: {
    functionName: "renderWithBoundary",
    prompt: `Write renderWithBoundary(render, fallback) that simulates what an error
boundary does around a single render pass. Call render() with no
arguments. If it returns normally, return { status: "ok", output } where
output is its return value. If it throws, call fallback(error.message)
and return { status: "error", output } where output is fallback's return
value.`,
    starterCode: `function renderWithBoundary(render, fallback) {
  // your code here
}`,
    solutionCode: `function renderWithBoundary(render, fallback) {
  try {
    return { status: "ok", output: render() };
  } catch (error) {
    return { status: "error", output: fallback(error.message) };
  }
}`,
    testCases: [
      {
        name: "renders normally when nothing throws",
        args: () => [() => "hello", (msg: string) => `error: ${msg}`],
        expected: { status: "ok", output: "hello" },
      },
      {
        name: "catches a thrown error and renders the fallback",
        args: () => [
          () => {
            throw new Error("boom");
          },
          (msg: string) => `error: ${msg}`,
        ],
        expected: { status: "error", output: "error: boom" },
      },
      {
        name: "passes through non-string render results",
        args: () => [() => 42, () => null],
        expected: { status: "ok", output: 42 },
      },
      {
        name: "the fallback receives the error message",
        args: () => [
          () => {
            throw new TypeError("bad type");
          },
          (msg: string) => msg.toUpperCase(),
        ],
        expected: { status: "error", output: "BAD TYPE" },
      },
      {
        name: "object render output passes through untouched",
        args: () => [() => ({ tree: true }), (msg: string) => msg],
        expected: { status: "ok", output: { tree: true } },
      },
    ],
  },
};

export default reactErrorBoundaries;
