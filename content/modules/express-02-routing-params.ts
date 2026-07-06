import type { ModuleContent } from "@/lib/types";

const expressRoutingParams: ModuleContent = {
  id: "express-routing-params",
  title: "Route parameters & query strings",
  category: "Fundamentals",
  order: 2,
  explanation: `
The last module matched paths exactly — \`app.get("/users/42", ...)\`
only ever matches the literal string \`"/users/42"\`. That's useless for
a real API, where you need one handler that works for *any* user id.
Express solves this with two different, easy-to-confuse mechanisms:
**route parameters**, which are part of the path itself, and the
**query string**, which is the optional \`?key=value\` suffix after it.

### Route parameters: \`:name\` segments

A route pattern can mark a path segment as a placeholder by prefixing
it with a colon:

\`\`\`js
app.get("/users/:id", (req, res) => {
  res.send(\`user \${req.params.id}\`);
});

app.get("/users/:userId/posts/:postId", (req, res) => {
  res.send(\`user \${req.params.userId}, post \${req.params.postId}\`);
});
\`\`\`

A request for \`GET /users/42\` matches the first pattern, and Express
fills in \`req.params\` as \`{ id: "42" }\` — the colon-prefixed name
becomes the key, and whatever text occupied that segment becomes the
value. Every param arrives as a **string**, even if it looks like a
number, so \`req.params.id === "42"\`, not \`42\`. Convert it yourself
(\`Number(req.params.id)\`) before doing math with it.

Segments only match one path piece at a time: \`:id\` matches
\`"42"\` in \`/users/42\`, but it does **not** match across a \`/\` — a
request for \`/users/42/extra\` does not match \`/users/:id\` at all,
because the number of segments differs.

### The query string: \`req.query\`

Everything after a \`?\` in the URL is the **query string** — a flat set
of \`key=value\` pairs separated by \`&\`, used for optional, non-identity
information like filters, pagination, or search terms:

\`\`\`
GET /search?q=node&sort=asc&page=2
\`\`\`

Express parses this automatically into \`req.query\`:

\`\`\`js
app.get("/search", (req, res) => {
  console.log(req.query); // { q: "node", sort: "asc", page: "2" }
});
\`\`\`

Just like \`req.params\`, every value in \`req.query\` is a string. The
key difference between the two: **params** identify *which resource*
you mean (\`/users/42\` is a specific user — change the id and you're
talking about a different resource entirely), while **query** refines
*how you want it* (\`?sort=asc\` doesn't change which resource you're
asking about, just how the response is shaped).

### Why this matters

Reaching for the wrong one is a common design smell: putting a
required identifier in the query string (\`/users?id=42\`) instead of
the path (\`/users/42\`) makes URLs harder to read, cache, and link to.
The rule of thumb: if removing it would ask for a *different* resource,
it's a param; if removing it would ask for the same resource shaped
differently, it's a query param.
`.trim(),
  codeExamples: [
    {
      title: "Multiple route params",
      code: `app.get("/users/:userId/posts/:postId", (req, res) => {
  const { userId, postId } = req.params; // both are strings
  res.json({ userId, postId });
});`,
    },
    {
      title: "Reading the query string",
      code: `app.get("/search", (req, res) => {
  const page = Number(req.query.page) || 1; // convert manually — it's a string
  res.json({ q: req.query.q, page });
});`,
    },
  ],
  challenge: {
    functionName: "parseRequestUrl",
    prompt: `Write parseRequestUrl(pattern, url) that mimics how Express turns a
route pattern like "/users/:id" and an incoming URL like
"/users/42?active=true" into req.params and req.query.

1. Split "url" on the first "?" to separate the path from the query
   string (there may be no "?" at all).
2. Match the path against "pattern" segment by segment (split both on
   "/"): a pattern segment starting with ":" captures that URL segment
   under its name (minus the colon) into "params"; every other segment
   must match literally. The path only matches if every segment matches
   AND both have the same number of segments.
3. Parse the query string (if any) into a plain object of key/value
   string pairs — an empty object if there's no "?" or nothing follows
   it.

Return { params, query } if the path matches, or null if it doesn't.`,
    starterCode: `function parseRequestUrl(pattern, url) {
  // your code here
}`,
    solutionCode: `function parseRequestUrl(pattern, url) {
  const [path, queryString = ""] = url.split("?");
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = path.split("/").filter(Boolean);

  if (patternSegments.length !== pathSegments.length) return null;

  const params = {};
  for (let i = 0; i < patternSegments.length; i++) {
    const patternSegment = patternSegments[i];
    const pathSegment = pathSegments[i];
    if (patternSegment.startsWith(":")) {
      params[patternSegment.slice(1)] = pathSegment;
    } else if (patternSegment !== pathSegment) {
      return null;
    }
  }

  const query = {};
  if (queryString) {
    for (const pair of queryString.split("&")) {
      const [key, value] = pair.split("=");
      query[key] = value;
    }
  }

  return { params, query };
}`,
    testCases: [
      {
        name: "matches a single param",
        args: () => ["/users/:id", "/users/42"],
        expected: { params: { id: "42" }, query: {} },
      },
      {
        name: "matches a param plus a query string",
        args: () => ["/users/:id", "/users/42?active=true"],
        expected: { params: { id: "42" }, query: { active: "true" } },
      },
      {
        name: "matches multiple params",
        args: () => ["/users/:userId/posts/:postId", "/users/7/posts/99"],
        expected: { params: { userId: "7", postId: "99" }, query: {} },
      },
      {
        name: "returns null when a literal segment doesn't match",
        args: () => ["/users/:id", "/accounts/42"],
        expected: null,
      },
      {
        name: "returns null when segment counts differ",
        args: () => ["/users/:id", "/users/42/extra"],
        expected: null,
      },
      {
        name: "parses multiple query params",
        args: () => ["/search", "/search?q=node&sort=asc"],
        expected: { params: {}, query: { q: "node", sort: "asc" } },
      },
    ],
  },
};

export default expressRoutingParams;
