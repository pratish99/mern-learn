import type { ModuleContent } from "@/lib/types";

const expressMiddlewareBasics: ModuleContent = {
  id: "express-middleware-basics",
  title: "Middleware fundamentals",
  category: "Middleware & Routing",
  order: 4,
  explanation: `
Think of an airport security line: your bag passes through several
independent checkpoints — ID check, X-ray, sometimes a manual search —
each of which either waves you through to the next one or stops you
right there. Express structures request handling the exact same way,
and each checkpoint is called **middleware**.

### What a middleware function looks like

A middleware is just a function with three parameters:
\`(req, res, next)\`. It can read or modify \`req\`/\`res\`, and then it
must do exactly one of two things:

1. Call \`next()\` — "I'm done, let the next checkpoint (or the final
   route handler) run."
2. Send a response itself (\`res.send(...)\`, \`res.status(...).json(...)\`,
   etc.) and **not** call \`next()\` — "stop here, I'm handling this."

\`\`\`js
function logger(req, res, next) {
  console.log(\`\${req.method} \${req.url}\`);
  next(); // pass control onward
}

function requireAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).send("Unauthorized"); // stop — no next()
  }
  next(); // let it through
}
\`\`\`

### Registering middleware: \`app.use\`

\`app.use(middleware)\` registers a middleware to run on **every**
request, in the order you called \`app.use\`. Middlewares run before
whichever route handler eventually matches, forming a pipeline:

\`\`\`js
app.use(logger);       // runs first, for every request
app.use(requireAuth);  // runs second — but only if logger called next()

app.get("/dashboard", (req, res) => {
  res.send("welcome"); // only reached if every middleware above called next()
});
\`\`\`

A route handler itself (the last argument to \`app.get\`, etc.) is
really just the final middleware in the chain — it just usually
doesn't call \`next()\`, because there's nothing left to hand off to.

### Why forgetting \`next()\` is a classic bug

If a middleware neither sends a response nor calls \`next()\`, the
request just... hangs. Nothing downstream ever runs, and the client
sits there waiting until it eventually times out. This is one of the
most common Express bugs beginners hit — always make sure every code
path through a middleware either responds or calls \`next()\`, never
neither.

### Why this matters

Once you see middleware as "a pipeline of checkpoints, each of which
can stop the chain or pass it forward," a huge amount of Express's
design falls into place: logging, authentication, rate limiting,
compression, and body parsing are all just middleware someone else
already wrote, plugged into the same \`app.use\` pipeline your own
route handlers sit at the end of.
`.trim(),
  codeExamples: [
    {
      title: "A logging middleware",
      code: `app.use((req, res, next) => {
  console.log(\`\${new Date().toISOString()} \${req.method} \${req.url}\`);
  next();
});`,
    },
    {
      title: "A short-circuiting auth middleware",
      code: `function requireAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).send("Unauthorized"); // stops the chain here
  }
  next();
}
app.use(requireAuth);`,
    },
  ],
  challenge: {
    functionName: "runMiddleware",
    prompt: `Express runs an array of middleware functions in order for each
request, and each middleware decides whether to call next() (pass
control onward) or stop the chain by responding itself. Write
runMiddleware(middlewares) that simulates this without real functions:
"middlewares" is an array of { name, callsNext } objects, in
registration order.

Walk the array in order, collecting each middleware's "name" into a
result array as it "runs." As soon as you reach a middleware where
callsNext is false, record its name and stop — no later middleware
ever runs, since that one didn't call next(). If every middleware in
the array calls next(), append the string "route-handler" to the end
of the result, representing the final route handler receiving the
request.`,
    starterCode: `function runMiddleware(middlewares) {
  // your code here
}`,
    solutionCode: `function runMiddleware(middlewares) {
  const ran = [];
  for (const middleware of middlewares) {
    ran.push(middleware.name);
    if (!middleware.callsNext) {
      return ran;
    }
  }
  ran.push("route-handler");
  return ran;
}`,
    testCases: [
      {
        name: "every middleware calls next, route handler runs",
        args: () => [[{ name: "logger", callsNext: true }, { name: "auth", callsNext: true }]],
        expected: ["logger", "auth", "route-handler"],
      },
      {
        name: "a middleware that doesn't call next stops the chain",
        args: () => [[{ name: "logger", callsNext: true }, { name: "auth", callsNext: false }]],
        expected: ["logger", "auth"],
      },
      {
        name: "no middleware still reaches the route handler",
        args: () => [[]],
        expected: ["route-handler"],
      },
      {
        name: "the first middleware can short-circuit immediately",
        args: () => [[{ name: "rateLimiter", callsNext: false }, { name: "auth", callsNext: true }]],
        expected: ["rateLimiter"],
      },
    ],
  },
};

export default expressMiddlewareBasics;
