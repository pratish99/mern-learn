import type { ModuleContent } from "@/lib/types";

const httpServer: ModuleContent = {
  id: "http-server",
  title: "HTTP module & raw server",
  category: "I/O & Networking",
  order: 8,
  explanation: `
Frameworks like Express sit on top of Node's built-in \`http\` module.
Understanding the raw API demystifies what they're doing for you.

\`\`\`js
const http = require("http");

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("not found");
});

server.listen(3000);
\`\`\`

### \`req\` and \`res\` are streams

\`req\` (\`IncomingMessage\`) is a **Readable** stream — the request body
arrives as \`"data"\` chunks, not a ready-made string. \`res\`
(\`ServerResponse\`) is a **Writable** stream — \`res.write()\` sends a
chunk immediately, and headers must be set (via \`writeHead\` or
\`setHeader\`) **before** the first \`write\`/\`end\` call, since Node flushes
headers as soon as body bytes start going out.

\`\`\`js
let body = "";
req.on("data", (chunk) => (body += chunk));
req.on("end", () => {
  const parsed = JSON.parse(body);
  // ... use parsed
});
\`\`\`

### Routing is manual

There's no built-in router — you inspect \`req.method\` and \`req.url\`
yourself (or parse \`req.url\` with the \`URL\` class for query strings) and
branch. This is exactly what routing libraries automate for you.
`.trim(),
  codeExamples: [
    {
      title: "Reading a JSON request body",
      code: `function handleJsonPost(req, res) {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    const data = JSON.parse(body);
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ received: data }));
  });
}`,
    },
    {
      title: "Parsing the URL",
      code: `const { URL } = require("url");

const parsed = new URL(req.url, \`http://\${req.headers.host}\`);
console.log(parsed.pathname);            // "/search"
console.log(parsed.searchParams.get("q")); // "node"`,
    },
  ],
  challenge: {
    functionName: "routeRequest",
    prompt: `Write routeRequest(method, url) that mimics the routing logic inside a
raw http.createServer handler. Return a response descriptor
{ status, body }:
- GET "/health" → { status: 200, body: "ok" }
- GET "/users/<id>" (id is one non-empty path segment) →
  { status: 200, body: JSON.stringify({ id }) }
- anything else → { status: 404, body: "not found" }`,
    starterCode: `function routeRequest(method, url) {
  // your code here
}`,
    solutionCode: `function routeRequest(method, url) {
  if (method === "GET" && url === "/health") {
    return { status: 200, body: "ok" };
  }
  const match = method === "GET" && url.match(/^\\/users\\/([^/]+)$/);
  if (match) {
    return { status: 200, body: JSON.stringify({ id: match[1] }) };
  }
  return { status: 404, body: "not found" };
}`,
    testCases: [
      {
        name: "GET /health returns ok",
        args: () => ["GET", "/health"],
        expected: { status: 200, body: "ok" },
      },
      {
        name: "GET /users/:id returns the id",
        args: () => ["GET", "/users/42"],
        expected: { status: 200, body: '{"id":"42"}' },
      },
      {
        name: "wrong method on a known path is 404",
        args: () => ["POST", "/health"],
        expected: { status: 404, body: "not found" },
      },
      {
        name: "unknown path is 404",
        args: () => ["GET", "/unknown"],
        expected: { status: 404, body: "not found" },
      },
    ],
  },
};

export default httpServer;
