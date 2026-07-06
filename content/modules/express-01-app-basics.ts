import type { ModuleContent } from "@/lib/types";

const expressAppBasics: ModuleContent = {
  id: "express-app-basics",
  title: "Express app basics & routing",
  category: "Fundamentals",
  order: 1,
  explanation: `
Recall the raw \`http\` module: every request lands in one giant callback,
and you're the one writing \`if (req.method === "GET" && req.url === "/health")\`
over and over. Express is a thin library built on top of that same
\`http\` module whose entire job is to make that branching pleasant. The
core trick: instead of one big \`if\`/\`else\` chain, you **register**
routes ahead of time, and Express does the matching for you when a
request actually arrives.

### Creating an app and registering routes

\`\`\`js
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Welcome home");
});

app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

app.post("/users", (req, res) => {
  res.status(201).send("created");
});

app.listen(3000); // same http.createServer + .listen under the hood
\`\`\`

\`app.get(path, handler)\`, \`app.post(path, handler)\`, \`app.put(...)\`,
\`app.delete(...)\` — one method per HTTP verb — each just say "remember
this path/handler pair for this verb." Nothing runs yet. The matching
only happens later, once an actual request comes in.

### How a request finds its handler

When a request arrives, Express walks its list of registered routes
**in the order you registered them** and runs the first handler whose
method and path both match. This "first match wins, in registration
order" rule matters: if you register two routes for the same
\`GET "/users/me"\`, only the first one you wrote ever runs — the second
is dead code. It's a common source of "why isn't my route running?"
bugs.

### The default 404

What if nothing matches? Unlike the raw \`http\` module — where a
request that falls through *your* \`if\` chain gets whatever response
you wrote for the \`else\` case, or hangs forever if you forgot one —
Express always has a fallback. If no route matches, Express itself
sends back a 404 response with a small text body describing what
failed, in the shape \`"Cannot GET /whatever-you-asked-for"\`. You never
have to write that fallback by hand, though you're free to replace it
later with your own "not found" middleware.

### Method matching is case-insensitive

HTTP method names arrive over the wire as uppercase strings (\`GET\`,
\`POST\`, ...), but Express doesn't care about the casing you use when
comparing internally — \`app.get(...)\` matches a request whose method
is reported as \`"GET"\`, \`"get"\`, or any mixed case, because Express
normalizes before comparing. Paths, on the other hand, are matched
exactly (for now — the next module covers \`:params\`, which loosen
this).

### Why this matters

Every Express app, no matter how large, is really just a big ordered
list of \`{ method, path, handler }\` entries plus a walk-and-match loop
that runs on every incoming request. Once you can picture that loop —
"go down the list in order, run the first one that matches both verb
and path, otherwise 404" — features like route ordering bugs, "my
route never runs," and the default 404 page all stop being mysterious.
`.trim(),
  codeExamples: [
    {
      title: "Registering routes",
      code: `const app = express();

app.get("/", (req, res) => res.send("home"));
app.get("/about", (req, res) => res.send("about"));
app.post("/login", (req, res) => res.send("logged in"));`,
    },
    {
      title: "Order matters",
      code: `app.get("/users/me", (req, res) => res.send("your profile"));
app.get("/users/me", (req, res) => res.send("this never runs"));
// the first matching handler wins — the second is unreachable`,
    },
  ],
  challenge: {
    functionName: "matchRoute",
    prompt: `Write matchRoute(routes, method, path) that simulates how Express
matches an incoming request to a registered route. "routes" is an array
of { method, path, result } objects, already in the order app.get/
app.post/etc. would have registered them. Return the "result" of the
first route whose method (compared case-insensitively) and path (exact
match) both match the request. If no route matches, return
{ status: 404, body: \`Cannot \${method} \${path}\` } — Express's default
404 message format.`,
    starterCode: `function matchRoute(routes, method, path) {
  // your code here
}`,
    solutionCode: `function matchRoute(routes, method, path) {
  for (const route of routes) {
    if (route.method.toLowerCase() === method.toLowerCase() && route.path === path) {
      return route.result;
    }
  }
  return { status: 404, body: \`Cannot \${method} \${path}\` };
}`,
    testCases: [
      {
        name: "matches an exact route",
        args: () => [
          [
            { method: "GET", path: "/", result: { status: 200, body: "home" } },
            { method: "GET", path: "/about", result: { status: 200, body: "about" } },
          ],
          "GET",
          "/about",
        ],
        expected: { status: 200, body: "about" },
      },
      {
        name: "method matching is case-insensitive",
        args: () => [[{ method: "GET", path: "/", result: { status: 200, body: "home" } }], "get", "/"],
        expected: { status: 200, body: "home" },
      },
      {
        name: "falls through to the default 404 for an unknown path",
        args: () => [[{ method: "GET", path: "/", result: { status: 200, body: "home" } }], "GET", "/missing"],
        expected: { status: 404, body: "Cannot GET /missing" },
      },
      {
        name: "a matching path with the wrong method still 404s",
        args: () => [[{ method: "GET", path: "/about", result: { status: 200, body: "about" } }], "POST", "/about"],
        expected: { status: 404, body: "Cannot POST /about" },
      },
      {
        name: "first registered match wins",
        args: () => [
          [
            { method: "GET", path: "/x", result: { status: 200, body: "first" } },
            { method: "GET", path: "/x", result: { status: 200, body: "second" } },
          ],
          "GET",
          "/x",
        ],
        expected: { status: 200, body: "first" },
      },
    ],
  },
};

export default expressAppBasics;
