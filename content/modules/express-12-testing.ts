import type { ModuleContent } from "@/lib/types";

const expressTesting: ModuleContent = {
  id: "express-testing",
  title: "Testing Express apps",
  category: "Reliability & Tooling",
  order: 12,
  explanation: `
You could test an Express app the slow way: start a real server on a
real port, use a real HTTP client to fire requests at
\`http://localhost:3000\`, and check the responses. It works, but it's
slow (spinning up a real server per test) and flaky (you have to
manage picking a free port, waiting for the server to be ready,
tearing it down after). The standard tool for testing Express,
\`supertest\`, sidesteps all of that.

### How supertest actually works

Recall that an Express \`app\` is really just a request-handling
function — the same function you could hand directly to
\`http.createServer\`. \`supertest\` exploits this: instead of listening
on a real network socket, it calls your \`app\` function **directly**,
in memory, simulating a request/response cycle without ever touching
a real port:

\`\`\`js
const request = require("supertest");
const app = require("./app");

test("GET /health returns ok", async () => {
  const res = await request(app).get("/health");
  expect(res.status).toBe(200);
  expect(res.text).toBe("ok");
});

test("POST /users validates the body", async () => {
  const res = await request(app).post("/users").send({});
  expect(res.status).toBe(400);
  expect(res.body.errors).toContain("name is required");
});
\`\`\`

\`request(app).get(path)\` builds a fake request, runs it through your
app's whole middleware pipeline exactly as a real request would be
(routing, body parsing, error handling, all of it), and gives you back
a response object with \`.status\`, \`.body\` (already JSON-parsed), and
\`.text\`.

### What to test, and at what level

Two different levels are both useful, for different reasons:

- **Route-level (integration) tests**, using \`supertest\` as above —
  these exercise the real pipeline end to end: routing, middleware,
  and your handler together. They catch "wiring" bugs — a middleware
  registered in the wrong order, a route that's never reached.
- **Unit tests of plain functions** — anything you can pull out of a
  route handler into its own function (a validator, a REST resource
  controller, a CORS-origin resolver — exactly the kind of pure
  functions you've been writing in this module's challenges) can be
  tested directly with plain input/output assertions, with no HTTP
  layer involved at all. These are faster and pinpoint failures more
  precisely, since there's no routing or middleware in between the
  test and the logic being checked.

A healthy test suite usually leans heavily on the second kind — most
of your business logic lives in small, testable functions — with a
thinner layer of \`supertest\` integration tests confirming the routes
are actually wired up to call them.

### Why this matters

Whether you use \`supertest\` or hand-roll a fake \`req\`/\`res\`, the
core idea is the same one from every earlier module in this track:
Express is just a function that takes \`(req, res)\`-shaped input and
produces a response. Testing it doesn't require a real network at
all — it just requires calling that function and checking what comes
back.
`.trim(),
  codeExamples: [
    {
      title: "An integration test with supertest",
      code: `test("DELETE /items/:id removes the item", async () => {
  const res = await request(app).delete("/items/1");
  expect(res.status).toBe(204);
});`,
    },
    {
      title: "A unit test of the underlying pure function",
      code: `test("handleItemsRequest 404s for a missing id", () => {
  const result = handleItemsRequest({ items: [], nextId: 1 }, "GET", "/items/99");
  expect(result.status).toBe(404);
});`,
    },
  ],
  challenge: {
    functionName: "runRouteTests",
    prompt: `Testing an Express route means sending a fake request through it and
asserting facts about the response — status code, body — without
starting a real server (this is exactly what supertest does under the
hood: it calls your app directly, in memory). Write runRouteTests(cases)
that runs a list of test cases against already-computed responses,
without needing a real app or server.

Each case is { name, response, expectedStatus, expectedBody }, where
"response" is the { status, body } your route already produced for
that scenario. For each case, compare response.status to expectedStatus
and response.body to expectedBody (deep-compare the body using
JSON.stringify). Return an array of { name, passed } in the same
order — "passed" is true only when both the status and the body
match.`,
    starterCode: `function runRouteTests(cases) {
  // your code here
}`,
    solutionCode: `function runRouteTests(cases) {
  return cases.map((testCase) => {
    const statusMatches = testCase.response.status === testCase.expectedStatus;
    const bodyMatches = JSON.stringify(testCase.response.body) === JSON.stringify(testCase.expectedBody);
    return { name: testCase.name, passed: statusMatches && bodyMatches };
  });
}`,
    testCases: [
      {
        name: "a matching status and body passes",
        args: () => [[{ name: "health check", response: { status: 200, body: "ok" }, expectedStatus: 200, expectedBody: "ok" }]],
        expected: [{ name: "health check", passed: true }],
      },
      {
        name: "matching object bodies pass",
        args: () => [
          [
            {
              name: "missing field",
              response: { status: 400, body: { error: "name required" } },
              expectedStatus: 400,
              expectedBody: { error: "name required" },
            },
          ],
        ],
        expected: [{ name: "missing field", passed: true }],
      },
      {
        name: "a wrong status fails",
        args: () => [[{ name: "wrong status", response: { status: 500, body: "err" }, expectedStatus: 200, expectedBody: "err" }]],
        expected: [{ name: "wrong status", passed: false }],
      },
      {
        name: "a wrong body fails",
        args: () => [[{ name: "wrong body", response: { status: 200, body: "a" }, expectedStatus: 200, expectedBody: "b" }]],
        expected: [{ name: "wrong body", passed: false }],
      },
      { name: "no cases returns an empty array", args: () => [[]], expected: [] },
    ],
  },
};

export default expressTesting;
