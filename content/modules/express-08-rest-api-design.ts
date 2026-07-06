import type { ModuleContent } from "@/lib/types";

const expressRestApiDesign: ModuleContent = {
  id: "express-rest-api-design",
  title: "RESTful API design",
  category: "APIs & Data",
  order: 8,
  explanation: `
Once you can register routes and read \`req.params\`/\`req.body\`, the
next question is *how* to organize routes for a resource so other
developers (including future you) can guess your API's shape without
reading the docs. **REST** is the most common convention for this: it
maps CRUD (Create, Read, Update, Delete) operations onto HTTP verbs
applied to resource **nouns**, not verbs.

### One URL, different verbs, different meanings

A REST API for an \`items\` resource typically looks like this — note
there's exactly **one** URL shape per resource, and the HTTP method is
what changes the meaning:

| Method   | Path          | Meaning                          | Success status |
|----------|---------------|-----------------------------------|-----------------|
| GET      | /items        | list all items                    | 200             |
| GET      | /items/:id    | get one item                      | 200             |
| POST     | /items        | create a new item                 | 201             |
| PUT      | /items/:id    | replace/update an existing item   | 200             |
| DELETE   | /items/:id    | delete an item                    | 204             |

Compare that to a non-RESTful design like \`GET /getItems\`,
\`GET /deleteItem?id=5\` — it works, but it invents a new verb-shaped
endpoint for every action instead of reusing the same noun with
different HTTP methods, and (worse) uses \`GET\` — meant for
side-effect-free reads — to delete something.

### Status codes are part of the contract

The status code isn't decoration; callers are expected to branch on
it without parsing the body:

- \`200 OK\` — a normal successful response with a body.
- \`201 Created\` — a \`POST\` successfully created something; the
  response body is usually the newly created resource.
- \`204 No Content\` — the request succeeded but there's nothing to send
  back (a common choice for \`DELETE\`); the body should be empty.
- \`400 Bad Request\` — the request itself was malformed (covered in the
  next module).
- \`404 Not Found\` — the URL doesn't correspond to a resource that
  exists (a specific \`:id\` with no matching row, or an unregistered
  route entirely).

### Building the routes on top of a plain function

Because Express route handlers are just \`(req, res) => { ... }\`, a
REST resource is usually implemented as a handful of small handlers
sharing the same in-memory (or database-backed) data:

\`\`\`js
app.get("/items/:id", (req, res) => {
  const item = items.find((i) => i.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: "Not Found" });
  res.json(item);
});
\`\`\`

Notice \`req.params.id\` arrives as a **string** (from an earlier
module) — comparing it against a numeric \`id\` field requires
converting it first, a very common source of "why doesn't this ever
match" bugs.

### Why this matters

REST isn't enforced by Express or by HTTP itself — it's a convention
you and your team choose to follow, precisely because a predictable
"noun + verb ⇒ status code" shape makes an API easy to guess, easy to
document, and easy to build generic tooling around (like the REST
client your browser's dev tools already understand).
`.trim(),
  codeExamples: [
    {
      title: "A full CRUD route set",
      code: `app.get("/items", (req, res) => res.json(items));
app.get("/items/:id", (req, res) => {
  const item = items.find((i) => i.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: "Not Found" });
  res.json(item);
});
app.post("/items", (req, res) => {
  const item = { id: nextId++, name: req.body.name };
  items.push(item);
  res.status(201).json(item);
});
app.delete("/items/:id", (req, res) => {
  const index = items.findIndex((i) => i.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Not Found" });
  items.splice(index, 1);
  res.status(204).end(); // no body
});`,
    },
    {
      title: "Choosing the right status code",
      code: `res.status(201).json(created);   // POST that made something new
res.status(204).end();           // DELETE with nothing to return
res.status(404).json({ error: "Not Found" }); // no such resource`,
    },
  ],
  challenge: {
    functionName: "handleItemsRequest",
    prompt: `Write handleItemsRequest(state, method, path, body) implementing a
minimal REST API for an in-memory "items" resource, following the
status-code conventions above. "state" is { items, nextId } (each item
is { id, name }). Return { status, body: responseBody, state: newState }
for:

- GET "/items" -> 200, responseBody is the full items array, state
  unchanged.
- GET "/items/:id" -> 200 with the matching item, or 404 with
  { error: "Not Found" } if no item has that id. State unchanged either
  way.
- POST "/items" -> create { id: state.nextId, name: body.name }, append
  it to items, increment nextId, return 201 with the created item and
  the updated state.
- PUT "/items/:id" -> replace the matching item's "name" with
  body.name and return 200 with the updated item and updated state, or
  404 (state unchanged) if no item has that id.
- DELETE "/items/:id" -> remove the matching item and return 204 with
  a null body and the updated state, or 404 (state unchanged) if no
  item has that id.

Parse ":id" out of "path" yourself — it's always the segment after
"/items/"; compare ids as numbers.`,
    starterCode: `function handleItemsRequest(state, method, path, body) {
  // your code here
}`,
    solutionCode: `function handleItemsRequest(state, method, path, body) {
  const idFromPath = (p) => Number(p.slice("/items/".length));

  if (method === "GET" && path === "/items") {
    return { status: 200, body: state.items, state };
  }

  if (method === "GET" && path.startsWith("/items/")) {
    const id = idFromPath(path);
    const item = state.items.find((i) => i.id === id);
    if (!item) return { status: 404, body: { error: "Not Found" }, state };
    return { status: 200, body: item, state };
  }

  if (method === "POST" && path === "/items") {
    const created = { id: state.nextId, name: body.name };
    const newState = { items: [...state.items, created], nextId: state.nextId + 1 };
    return { status: 201, body: created, state: newState };
  }

  if (method === "PUT" && path.startsWith("/items/")) {
    const id = idFromPath(path);
    const index = state.items.findIndex((i) => i.id === id);
    if (index === -1) return { status: 404, body: { error: "Not Found" }, state };
    const updated = { ...state.items[index], name: body.name };
    const items = [...state.items];
    items[index] = updated;
    return { status: 200, body: updated, state: { items, nextId: state.nextId } };
  }

  if (method === "DELETE" && path.startsWith("/items/")) {
    const id = idFromPath(path);
    const index = state.items.findIndex((i) => i.id === id);
    if (index === -1) return { status: 404, body: { error: "Not Found" }, state };
    const items = state.items.filter((i) => i.id !== id);
    return { status: 204, body: null, state: { items, nextId: state.nextId } };
  }

  return { status: 404, body: { error: "Not Found" }, state };
}`,
    testCases: [
      {
        name: "GET /items lists everything",
        args: () => [{ items: [{ id: 1, name: "a" }], nextId: 2 }, "GET", "/items", undefined],
        expected: { status: 200, body: [{ id: 1, name: "a" }], state: { items: [{ id: 1, name: "a" }], nextId: 2 } },
      },
      {
        name: "GET /items/:id returns the matching item",
        args: () => [{ items: [{ id: 1, name: "a" }], nextId: 2 }, "GET", "/items/1", undefined],
        expected: { status: 200, body: { id: 1, name: "a" }, state: { items: [{ id: 1, name: "a" }], nextId: 2 } },
      },
      {
        name: "GET /items/:id 404s for a missing id",
        args: () => [{ items: [], nextId: 1 }, "GET", "/items/99", undefined],
        expected: { status: 404, body: { error: "Not Found" }, state: { items: [], nextId: 1 } },
      },
      {
        name: "POST /items creates and increments nextId",
        args: () => [{ items: [], nextId: 1 }, "POST", "/items", { name: "b" }],
        expected: { status: 201, body: { id: 1, name: "b" }, state: { items: [{ id: 1, name: "b" }], nextId: 2 } },
      },
      {
        name: "PUT /items/:id replaces the name",
        args: () => [{ items: [{ id: 1, name: "a" }], nextId: 2 }, "PUT", "/items/1", { name: "updated" }],
        expected: {
          status: 200,
          body: { id: 1, name: "updated" },
          state: { items: [{ id: 1, name: "updated" }], nextId: 2 },
        },
      },
      {
        name: "DELETE /items/:id removes the item",
        args: () => [{ items: [{ id: 1, name: "a" }], nextId: 2 }, "DELETE", "/items/1", undefined],
        expected: { status: 204, body: null, state: { items: [], nextId: 2 } },
      },
      {
        name: "DELETE /items/:id 404s for a missing id",
        args: () => [{ items: [], nextId: 1 }, "DELETE", "/items/99", undefined],
        expected: { status: 404, body: { error: "Not Found" }, state: { items: [], nextId: 1 } },
      },
    ],
  },
};

export default expressRestApiDesign;
