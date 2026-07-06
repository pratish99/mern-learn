import type { ModuleContent } from "@/lib/types";

const expressErrorHandling: ModuleContent = {
  id: "express-error-handling",
  title: "Error-handling middleware",
  category: "Middleware & Routing",
  order: 6,
  explanation: `
Normal middleware takes three arguments: \`(req, res, next)\`. Express
has a special second kind of middleware, distinguished purely by
having **four** parameters: \`(err, req, res, next)\`. That extra first
parameter isn't cosmetic — Express literally counts a function's
declared parameters to decide whether it's a regular middleware or an
error handler, and routes requests to the right kind depending on
whether an error is currently "in flight."

### Raising an error: \`next(err)\`

A normal middleware or route handler reports a failure by calling
\`next\` **with an argument**:

\`\`\`js
app.get("/users/:id", (req, res, next) => {
  const user = findUser(req.params.id);
  if (!user) {
    return next(new Error("User not found")); // hands off to error handling
  }
  res.json(user);
});
\`\`\`

Calling \`next(err)\` (instead of \`next()\`) tells Express: "something
went wrong — skip every remaining *normal* middleware and route
handler, and jump straight to the nearest error-handling middleware
instead." An uncaught \`throw\` inside a synchronous handler does the
same thing automatically.

### Writing an error handler

\`\`\`js
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});
\`\`\`

Error handlers are registered with \`app.use\` just like normal
middleware, but by convention go at the very **end** of the file,
after every route — Express finds the nearest one that comes *after*
wherever the error occurred, scanning forward through the remaining
registered layers.

### The skip-forward rule, precisely

Picture the whole app as one ordered list of layers (middleware,
routes, error handlers). Express walks it top to bottom:

- While there's **no error**, it runs each normal layer in turn, and
  skips every error-handling layer it passes (there's nothing for them
  to handle yet).
- The moment a layer calls \`next(err)\` or throws, Express starts
  skipping every remaining **normal** layer, hunting forward for the
  next error-handling layer — and runs that one instead.

This is why a stray error-handling middleware placed too early in the
file is effectively dead: normal request flow always skips over it, so
it only ever fires for an error that happened *before* it — which, if
it's near the top of the file, is nothing.

### One important async gotcha

Express only auto-catches errors from **synchronous** code and
rejected Promises returned from an \`async\` handler in modern Express
versions. In an older Express or a handler using raw callbacks, a
\`throw\` inside a \`setTimeout\` or a callback happens outside Express's
own try/catch entirely, and will crash the process instead of reaching
your error handler — you must call \`next(err)\` manually in those
cases.

### Why this matters

Centralizing error handling in one (or a few) \`(err, req, res, next)\`
middlewares at the bottom of your app means every route can fail the
same simple way — \`next(err)\` or \`throw\` — without duplicating
"format an error response" logic in every single handler.
`.trim(),
  codeExamples: [
    {
      title: "Passing an error forward",
      code: `app.get("/orders/:id", (req, res, next) => {
  try {
    const order = getOrder(req.params.id);
    res.json(order);
  } catch (err) {
    next(err); // skip to the nearest error handler
  }
});`,
    },
    {
      title: "A centralized error handler",
      code: `app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message });
});`,
    },
  ],
  challenge: {
    functionName: "traceErrorPipeline",
    prompt: `Express tells normal middleware "(req, res, next)" apart from
error-handling middleware "(err, req, res, next)" by how many
parameters it declares. When something calls next(err) (or throws),
Express skips every remaining normal layer and jumps to the next
error-handling layer; when there's no pending error, error-handling
layers are skipped instead.

Write traceErrorPipeline(layers) that simulates this. "layers" is run
in order; each is { name, isErrorHandler, throws } ("throws" is either
an error message string or null). Return the array of "name"s that
actually ran, following these rules:

- While there's no pending error: run each non-error-handler layer
  (record its name), skipping error-handler layers entirely. If a
  layer's "throws" is not null, record its name, then treat that
  message as the new pending error and stop running normal layers.
- Once there's a pending error: skip normal layers; run the next
  error-handler layer (record its name), then stop entirely — one
  error handler running is enough to end the pipeline.
- If the layers run out while an error is still pending and no error
  handler ever ran, just return whatever ran so far.`,
    starterCode: `function traceErrorPipeline(layers) {
  // your code here
}`,
    solutionCode: `function traceErrorPipeline(layers) {
  const ran = [];
  let pendingError = null;

  for (const layer of layers) {
    if (pendingError === null) {
      if (layer.isErrorHandler) continue;
      ran.push(layer.name);
      if (layer.throws !== null) {
        pendingError = layer.throws;
      }
    } else {
      if (!layer.isErrorHandler) continue;
      ran.push(layer.name);
      return ran;
    }
  }

  return ran;
}`,
    testCases: [
      {
        name: "no errors — normal layers run in order",
        args: () => [
          [
            { name: "logger", isErrorHandler: false, throws: null },
            { name: "handler", isErrorHandler: false, throws: null },
          ],
        ],
        expected: ["logger", "handler"],
      },
      {
        name: "an error skips remaining normal layers and hits the error handler",
        args: () => [
          [
            { name: "logger", isErrorHandler: false, throws: null },
            { name: "handler", isErrorHandler: false, throws: "boom" },
            { name: "otherHandler", isErrorHandler: false, throws: null },
            { name: "errorHandler", isErrorHandler: true, throws: null },
          ],
        ],
        expected: ["logger", "handler", "errorHandler"],
      },
      {
        name: "an error handler is skipped when there's no pending error",
        args: () => [
          [
            { name: "errorHandler", isErrorHandler: true, throws: null },
            { name: "handler", isErrorHandler: false, throws: null },
          ],
        ],
        expected: ["handler"],
      },
      {
        name: "an error with no error handler after it just ends",
        args: () => [[{ name: "handler", isErrorHandler: false, throws: "fail" }]],
        expected: ["handler"],
      },
      {
        name: "only the nearest error handler runs",
        args: () => [
          [
            { name: "a", isErrorHandler: false, throws: "x" },
            { name: "errHandler1", isErrorHandler: true, throws: null },
            { name: "errHandler2", isErrorHandler: true, throws: null },
          ],
        ],
        expected: ["a", "errHandler1"],
      },
    ],
  },
};

export default expressErrorHandling;
