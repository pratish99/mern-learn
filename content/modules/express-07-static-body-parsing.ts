import type { ModuleContent } from "@/lib/types";

const expressStaticBodyParsing: ModuleContent = {
  id: "express-static-body-parsing",
  title: "Static files & body parsing",
  category: "Middleware & Routing",
  order: 7,
  explanation: `
Two of the most commonly used pieces of Express aren't your own code
at all — they're built-in middleware you enable with a single line:
serving static files, and parsing request bodies.

### Serving static files: \`express.static\`

Most apps have a folder of files that should just be handed straight
to the browser as-is — images, stylesheets, a compiled frontend
bundle. \`express.static(root)\` creates a middleware that does exactly
that: it maps an incoming request path onto a file inside \`root\`, and
if the file exists, sends it directly, no route handler required.

\`\`\`js
app.use(express.static("public"));
// a request for GET /logo.png now serves the file at "public/logo.png"
// GET / serves "public/index.html" by default
\`\`\`

### The danger this middleware has to guard against: path traversal

If \`express.static\` naively concatenated \`root + requestPath\`, a
request like \`GET /../../etc/passwd\` would resolve outside the
\`public\` folder entirely and hand back a file the developer never
intended to expose. This class of bug is called **path traversal**,
and any code that turns user-controlled input into a file path needs
to defend against it — \`express.static\` does this internally by
normalizing the path and refusing anything that would escape its root.

### Parsing request bodies: \`express.json()\` / \`express.urlencoded()\`

By default, \`req.body\` doesn't exist — Express doesn't read the
request body for you unless you tell it to, because *how* to parse a
body depends entirely on its \`Content-Type\`:

\`\`\`js
app.use(express.json());                          // parses application/json bodies
app.use(express.urlencoded({ extended: true }));   // parses HTML <form> submissions

app.post("/users", (req, res) => {
  console.log(req.body); // now populated, e.g. { name: "Ada" }
  res.status(201).json(req.body);
});
\`\`\`

Each of these is itself just a normal middleware: it looks at the
request's \`Content-Type\` header, and if it matches what that parser
handles, it reads the raw bytes (remember — the request body arrives
as a stream, chunk by chunk, same as in the raw \`http\` module),
buffers them, parses them, and attaches the result to \`req.body\`
before calling \`next()\`. If the content type doesn't match, the
parser calls \`next()\` immediately without touching anything, letting
a later parser (or the route handler) take over.

### Why this matters

Both of these are middleware in exactly the sense from the previous
module — functions plugged into \`app.use\` that inspect or transform
\`req\`/\`res\` before your route handler runs. There's no special
Express magic beyond the generic middleware pipeline: \`express.json()\`
just happens to be a middleware someone already wrote for the
extremely common job of "read the body stream and attach the parsed
result to \`req\`."
`.trim(),
  codeExamples: [
    {
      title: "Serving a public folder",
      code: `app.use(express.static("public"));
// requests for files that exist in "public/" are served automatically,
// bypassing your route handlers entirely`,
    },
    {
      title: "Parsing JSON bodies before a route needs them",
      code: `app.use(express.json());

app.post("/login", (req, res) => {
  const { username, password } = req.body; // only works because of the middleware above
  res.send(\`welcome, \${username}\`);
});`,
    },
  ],
  challenge: {
    functionName: "resolveStaticPath",
    prompt: `Express's static file middleware turns a request path into a file
path inside a root folder, but must refuse any request trying to
escape that root via ".." segments. Write resolveStaticPath(root,
requestPath) that:

1. Splits requestPath on "/" into segments, dropping empty segments (so
   "/a//b/" behaves like "/a/b").
2. Walks the segments left to right using a stack: a normal segment
   pushes onto the stack; a "." segment is ignored; a ".." segment pops
   the last pushed segment off the stack — but if the stack is already
   empty when a ".." shows up, the request is trying to escape the
   root, so immediately return null.
3. If, after processing every segment, the stack is empty (the request
   was for "/" itself), push "index.html" onto it as the default file.
4. Join root and the stack's segments with "/" and return that string.`,
    starterCode: `function resolveStaticPath(root, requestPath) {
  // your code here
}`,
    solutionCode: `function resolveStaticPath(root, requestPath) {
  const segments = requestPath.split("/").filter(Boolean);
  const stack = [];

  for (const segment of segments) {
    if (segment === ".") continue;
    if (segment === "..") {
      if (stack.length === 0) return null;
      stack.pop();
      continue;
    }
    stack.push(segment);
  }

  if (stack.length === 0) stack.push("index.html");
  return \`\${root}/\${stack.join("/")}\`;
}`,
    testCases: [
      { name: "resolves a simple file", args: () => ["/public", "/style.css"], expected: "/public/style.css" },
      { name: "defaults to index.html for the root", args: () => ["/public", "/"], expected: "/public/index.html" },
      { name: "resolves a nested path", args: () => ["/public", "/css/theme.css"], expected: "/public/css/theme.css" },
      { name: "rejects an escaping request", args: () => ["/public", "/../secrets.txt"], expected: null },
      {
        name: "normalizes an internal .. that stays within bounds",
        args: () => ["/public", "/css/../js/app.js"],
        expected: "/public/js/app.js",
      },
      {
        name: "rejects a request that escapes after normalizing",
        args: () => ["/public", "/a/../../b"],
        expected: null,
      },
    ],
  },
};

export default expressStaticBodyParsing;
