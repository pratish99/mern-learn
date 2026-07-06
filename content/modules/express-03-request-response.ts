import type { ModuleContent } from "@/lib/types";

const expressRequestResponse: ModuleContent = {
  id: "express-request-response",
  title: "Request & response objects",
  category: "Fundamentals",
  order: 3,
  explanation: `
Every Express route handler gets the same two arguments, \`(req, res)\`.
They aren't magic — \`req\` is Node's raw \`IncomingMessage\` and \`res\`
is the raw \`ServerResponse\` from the \`http\` module, just decorated
with extra convenience methods and properties. Knowing which of those
are Express's additions (and which are the plain Node objects
underneath) explains a lot of "wait, why does this work" moments.

### \`req\`: what's already been done for you

- \`req.params\` — route params extracted from the URL path (previous
  module).
- \`req.query\` — the parsed query string (previous module).
- \`req.body\` — the parsed request body, but **only** if you've enabled
  a body-parsing middleware first (covered in a later module); without
  one, \`req.body\` is \`undefined\`.
- \`req.headers\` — a plain object of the request's HTTP headers, same
  as the raw \`http\` module gives you.

### \`res\`: sending a response, one piece at a time

Express adds several **chainable** methods to \`res\` — each one returns
\`res\` itself, so you can string several calls together in one
expression:

\`\`\`js
res.status(201).set("X-Request-Id", "abc123").json({ id: 1, name: "Ada" });
\`\`\`

- \`res.status(code)\` — sets the HTTP status code (defaults to \`200\`
  if you never call it).
- \`res.set(name, value)\` — sets a response header.
- \`res.json(value)\` — serializes \`value\` with \`JSON.stringify\`, sets
  the \`Content-Type\` header to \`application/json\`, and sends it.
- \`res.send(value)\` — the flexible, "figure out what I meant" method:
  if \`value\` is a string, it's sent as-is (with a plain text
  content type); if \`value\` is a plain object or array, \`res.send\`
  quietly **delegates to \`res.json\`** for you. This is why you'll see
  both \`res.send({ ok: true })\` and \`res.json({ ok: true })\` in real
  code doing exactly the same thing.

### Order matters, and only one response wins

Under the hood, all of these still end by calling the raw
\`res.end()\` from the \`http\` module — Express hasn't changed that
part. That means the same rule from the raw-\`http\`-module module
still applies: headers must be set before the body starts going out,
and calling a body-sending method (\`send\`/\`json\`/\`end\`) more than
once per request throws an error ("Cannot set headers after they are
sent"), because the first call already closed out the response.

\`\`\`js
res.status(201); // fine — no body sent yet
res.json({ id: 1 }); // sends the response, "closes the envelope"
res.status(404); // too late! throws — the response already went out
\`\`\`

### Why this matters

\`req\`/\`res\` chaining is just syntax sugar over a handful of
straightforward, stateful method calls that build up a response
object piece by piece. Once you can mentally replay
\`res.status(201).json({ id: 1 })\` as "set statusCode to 201, then set
a body and a Content-Type header, then send it," debugging "why is my
status code wrong" or "why did this crash with a headers error"
becomes a matter of re-reading the call order, not guessing.
`.trim(),
  codeExamples: [
    {
      title: "Chaining status, headers, and body",
      code: `app.post("/users", (req, res) => {
  const user = createUser(req.body);
  res.status(201).set("Location", \`/users/\${user.id}\`).json(user);
});`,
    },
    {
      title: "send() auto-detecting an object",
      code: `res.send({ ok: true });
// identical to:
res.json({ ok: true });`,
    },
  ],
  challenge: {
    functionName: "simulateResponse",
    prompt: `Express's res object lets you chain calls like
res.status(201).set("X-Total", "5").json({ ok: true }). Write
simulateResponse(calls) that replays an array of calls (each shaped
{ method, args }, where method is one of "status", "set", "json", or
"send") against a fresh response state
{ statusCode: 200, headers: {}, body: null }, applying them in order,
and returns the final state.

- status(code) sets statusCode.
- set(name, value) sets a header.
- json(value) sets body to JSON.stringify(value) and sets the
  "Content-Type" header to "application/json".
- send(value): if value is a string, set body to it directly; if value
  is an object, behave exactly like json(value) (mirrors Express's real
  auto-detection).`,
    starterCode: `function simulateResponse(calls) {
  // your code here
}`,
    solutionCode: `function simulateResponse(calls) {
  const state = { statusCode: 200, headers: {}, body: null };

  function applyJson(value) {
    state.body = JSON.stringify(value);
    state.headers["Content-Type"] = "application/json";
  }

  for (const call of calls) {
    if (call.method === "status") {
      state.statusCode = call.args[0];
    } else if (call.method === "set") {
      const [name, value] = call.args;
      state.headers[name] = value;
    } else if (call.method === "json") {
      applyJson(call.args[0]);
    } else if (call.method === "send") {
      const value = call.args[0];
      if (typeof value === "string") {
        state.body = value;
      } else {
        applyJson(value);
      }
    }
  }

  return state;
}`,
    testCases: [
      {
        name: "status + json",
        args: () => [[{ method: "status", args: [201] }, { method: "json", args: [{ ok: true }] }]],
        expected: { statusCode: 201, headers: { "Content-Type": "application/json" }, body: '{"ok":true}' },
      },
      {
        name: "send with a string",
        args: () => [[{ method: "send", args: ["hello"] }]],
        expected: { statusCode: 200, headers: {}, body: "hello" },
      },
      {
        name: "send auto-detects an object",
        args: () => [[{ method: "send", args: [{ a: 1 }] }]],
        expected: { statusCode: 200, headers: { "Content-Type": "application/json" }, body: '{"a":1}' },
      },
      {
        name: "headers accumulate across calls",
        args: () => [
          [
            { method: "set", args: ["X-Total", "5"] },
            { method: "status", args: [404] },
            { method: "send", args: ["not found"] },
          ],
        ],
        expected: { statusCode: 404, headers: { "X-Total": "5" }, body: "not found" },
      },
      {
        name: "no calls returns the fresh default state",
        args: () => [[]],
        expected: { statusCode: 200, headers: {}, body: null },
      },
    ],
  },
};

export default expressRequestResponse;
