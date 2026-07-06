import type { ModuleContent } from "@/lib/types";

const httpServer: ModuleContent = {
  id: "http-server",
  title: "HTTP module & raw server",
  category: "I/O & Networking",
  order: 8,
  explanation: `
Every time an app uses Express, Koa, or Fastify, there's Node's built-in
\`http\` module doing the real work underneath. Here's an analogy: the
\`http\` module is like the raw phone line into an office — it can ring,
let you pick up, and let you talk, but it has no idea who's calling or
what department they want. Express is the receptionist sitting on top
of that phone line: it listens for the ring, figures out "billing" vs
"sales", and politely says "sorry, wrong number" when nobody matches.
Learning the raw \`http\` module shows you exactly what that receptionist
is doing for you.

### Starting a bare server

\`http.createServer(callback)\` gives you a server object. Node calls your
\`callback\` once for every incoming request, and hands you two objects:

- \`req\` — the incoming **request** (method, URL, headers, and the body, if any)
- \`res\` — the outgoing **response**, which you write to and then close

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

server.listen(3000); // start accepting connections on port 3000
\`\`\`

Nothing here is magic: you check \`req.method\` / \`req.url\` yourself,
decide on a status code, and call \`res.end()\` to send the response and
finish it.

### \`req\` and \`res\` are streams, not strings

This is the part that trips people up most. A **stream** is data that
arrives (or leaves) in small pieces over time, instead of all at once —
like filling a bathtub, where water trickles through the tap rather
than teleporting in all at once. Node's request and response objects
work the same way:

- \`req\` (\`IncomingMessage\`) is a **Readable** stream — for a POST with
  a JSON body, the body doesn't show up as a ready-made string. It
  arrives in one or more \`"data"\` events, each carrying a chunk, and
  then an \`"end"\` event once it's all in.
- \`res\` (\`ServerResponse\`) is a **Writable** stream — \`res.write()\`
  sends a chunk of the response immediately.

So if you want the whole request body as a single string, you have to
collect the chunks yourself:

\`\`\`js
let body = "";
req.on("data", (chunk) => (body += chunk)); // append each incoming piece
req.on("end", () => {
  // by now every chunk has arrived — safe to parse
  const parsed = JSON.parse(body);
  // ... use parsed
});
\`\`\`

One consequence of \`res\` being a writable stream: headers must be set
(via \`writeHead\` or \`setHeader\`) **before** the first \`write\`/\`end\`
call. Picture writing a letter — once you've sealed the envelope and
dropped it in the mailbox, you can't go back and add a return address.
Node "seals the envelope" the moment body bytes start going out, so any
headers you try to set after that are silently ignored.

### Routing is something you build by hand

Unlike Express, there's no built-in router here. Every "which handler
runs for this request" decision — checking \`req.method\`, matching
\`req.url\`, pulling an id out of a path — is code you write yourself
(you can still parse query strings cleanly with the built-in \`URL\`
class instead of splitting strings by hand). This manual branching is
exactly the boilerplate that routing libraries like Express exist to
automate.

**Why this matters:** when you later write \`app.get("/users/:id", handler)\`
in Express, that's shorthand for "look at \`req.method\` and \`req.url\`,
match a pattern, then call my function with a \`req\`/\`res\` pair that
behaves like the streams described above." Debugging a request that
hangs, a header that didn't stick, or a body that "isn't there yet"
almost always traces back to these raw stream mechanics.
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
