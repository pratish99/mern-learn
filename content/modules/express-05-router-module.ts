import type { ModuleContent } from "@/lib/types";

const expressRouterModule: ModuleContent = {
  id: "express-router-module",
  title: "The Router & mounting",
  category: "Middleware & Routing",
  order: 5,
  explanation: `
Real apps have far too many routes to register in one file —
\`app.get\`, \`app.post\`, and a dozen middlewares for users, another
dozen for orders, another dozen for payments, all stacked on the same
\`app\` object. \`express.Router()\` is Express's answer: a
**mini standalone app** you build routes on separately, then plug into
the main app as a single unit.

### Building a router

A \`Router\` supports the exact same API as \`app\` — \`.get\`, \`.post\`,
\`.use\`, and so on — but it doesn't listen on any port itself. It's
just a self-contained group of routes waiting to be attached
somewhere:

\`\`\`js
// routes/users.js
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => res.send("list users"));
router.get("/:id", (req, res) => res.send("one user"));
router.post("/", (req, res) => res.status(201).send("created"));

module.exports = router;
\`\`\`

Notice the paths inside the router are written **relative** —
\`"/"\` and \`"/:id"\`, with no mention of "users" anywhere.

### Mounting: giving the router a base path

The main app attaches that router with \`app.use(basePath, router)\`:

\`\`\`js
// app.js
const usersRouter = require("./routes/users");
app.use("/api/users", usersRouter);
\`\`\`

This is called **mounting**. Every route defined on \`usersRouter\` is
now really reachable at \`basePath + route.path\`:
\`router.get("/:id", ...)\` mounted at \`/api/users\` becomes
\`GET /api/users/:id\` from the outside. The router itself never had to
know its own base path — that decision belongs entirely to whoever
mounts it, which means the same router could be mounted at
\`/api/v2/users\` later with zero changes inside \`routes/users.js\`.

### Why bother?

Splitting routes into per-resource routers (one file for users, one
for orders, one for payments) keeps each file small and focused, and
makes the base path a one-line decision made in a single place
(\`app.js\`) instead of scattered across every route definition.

### Why this matters

Mounting doesn't add any new matching logic — it's the exact same
"walk the list, find the first match" process from earlier, just with
an extra step: first find a mount whose base path is a prefix of the
request path, then match the *remainder* of the path against that
mount's own routes. Once you see a mounted router as "a prefix check,
then a regular route match," nested routers (routers mounted inside
other routers) stop looking like a new concept — it's the same rule,
applied twice.
`.trim(),
  codeExamples: [
    {
      title: "Splitting routes across files",
      code: `// routes/orders.js
const router = require("express").Router();
router.get("/", (req, res) => res.send("list orders"));
router.get("/:id", (req, res) => res.send("one order"));
module.exports = router;

// app.js
app.use("/api/orders", require("./routes/orders"));
// GET /api/orders/:id now works, defined without ever mentioning "/api/orders"`,
    },
    {
      title: "Router-level middleware",
      code: `router.use((req, res, next) => {
  console.log("inside the users router only");
  next();
});
// this only runs for requests that already matched this router's mount path`,
    },
  ],
  challenge: {
    functionName: "matchMountedRoute",
    prompt: `Express lets you build routes on a Router and mount the whole thing
under a base path: app.use("/api/users", usersRouter) means every route
registered on usersRouter is really reachable at "/api/users" + that
route's own path. Write matchMountedRoute(mounts, method, path) that
simulates this.

"mounts" is an array of { basePath, routes } objects, checked in order.
Each "routes" entry is { method, path, result }, where "path" is
relative to that mount's basePath. For each mount, check whether
"path" starts with the mount's basePath; if so, strip that prefix off
to get the remainder, then look for a route in that mount whose "path"
equals the remainder exactly and whose method matches
case-insensitively. Return the "result" of the first such match found,
scanning mounts in order and routes within a mount in order. If a
mount's prefix matches but none of its routes match the remainder, move
on to the next mount. Return null if nothing matches anywhere.`,
    starterCode: `function matchMountedRoute(mounts, method, path) {
  // your code here
}`,
    solutionCode: `function matchMountedRoute(mounts, method, path) {
  for (const mount of mounts) {
    if (!path.startsWith(mount.basePath)) continue;
    const remainder = path.slice(mount.basePath.length);
    for (const route of mount.routes) {
      if (route.path === remainder && route.method.toLowerCase() === method.toLowerCase()) {
        return route.result;
      }
    }
  }
  return null;
}`,
    testCases: [
      {
        name: "matches a route inside a mounted router",
        args: () => [
          [{ basePath: "/api/users", routes: [{ method: "GET", path: "/", result: { status: 200, body: "list" } }] }],
          "GET",
          "/api/users/",
        ],
        expected: { status: 200, body: "list" },
      },
      {
        name: "prefix matches but no route matches the remainder",
        args: () => [
          [{ basePath: "/api/users", routes: [{ method: "GET", path: "/", result: { status: 200, body: "list" } }] }],
          "GET",
          "/api/users/extra",
        ],
        expected: null,
      },
      {
        name: "checks multiple mounts in order",
        args: () => [
          [
            { basePath: "/api/users", routes: [{ method: "GET", path: "/", result: { status: 200, body: "users-root" } }] },
            { basePath: "/api/posts", routes: [{ method: "GET", path: "/", result: { status: 200, body: "posts-root" } }] },
          ],
          "GET",
          "/api/posts/",
        ],
        expected: { status: 200, body: "posts-root" },
      },
      {
        name: "method mismatch inside an otherwise matching mount",
        args: () => [
          [{ basePath: "/api/users", routes: [{ method: "GET", path: "/", result: { status: 200, body: "list" } }] }],
          "POST",
          "/api/users/",
        ],
        expected: null,
      },
      {
        name: "path doesn't match any mount's base path",
        args: () => [
          [{ basePath: "/api/users", routes: [{ method: "GET", path: "/", result: { status: 200, body: "list" } }] }],
          "GET",
          "/other",
        ],
        expected: null,
      },
    ],
  },
};

export default expressRouterModule;
