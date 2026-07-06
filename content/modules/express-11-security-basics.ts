import type { ModuleContent } from "@/lib/types";

const expressSecurityBasics: ModuleContent = {
  id: "express-security-basics",
  title: "Security basics (Helmet, CORS)",
  category: "Auth & Security",
  order: 11,
  explanation: `
An Express app defaults to being fairly open: it doesn't set
protective response headers on its own, and it won't accept requests
from other websites' JavaScript unless *someone* configures that.
Two small, widely-used pieces of middleware close most of that gap:
**Helmet** and **CORS**.

### Helmet: sane default security headers

Browsers respect a handful of response headers that restrict what a
page is allowed to do — but Express doesn't set any of them for you.
\`helmet\` is a middleware that sets a curated set of good defaults in
one line:

\`\`\`js
const helmet = require("helmet");
app.use(helmet());
\`\`\`

A couple of the headers it sets, as examples of the category of
problem they solve:

- \`X-Content-Type-Options: nosniff\` — stops the browser from
  "guessing" a file's type from its content instead of trusting the
  \`Content-Type\` header you sent, which can otherwise turn an
  uploaded image into executable script in some edge cases.
- \`Content-Security-Policy\` — restricts which sources scripts,
  styles, and images are allowed to load from, which limits the damage
  an XSS bug (from the Node security-basics module) can do even if one
  slips through.

You rarely need to hand-configure each header individually — \`helmet()\`
with no arguments already applies a reasonable baseline for most apps.

### CORS: letting other origins call your API

Browsers enforce the **same-origin policy** by default: JavaScript
running on \`https://example.com\` cannot call
\`https://api.example.com\` from the browser unless the API explicitly
opts in. That opt-in is **CORS** (Cross-Origin Resource Sharing) — the
API responds with an \`Access-Control-Allow-Origin\` header naming which
origins are allowed to read the response.

\`\`\`js
const cors = require("cors");
app.use(cors({ origin: "https://example.com" })); // only this origin may call this API
\`\`\`

A subtlety that trips people up: if you allow **credentials**
(cookies) on cross-origin requests, you cannot respond with the
wildcard \`Access-Control-Allow-Origin: *\` — you must echo back the
*exact* requesting origin instead, because a wildcard combined with
credentials would let literally any site read a logged-in user's
data. This is why a real CORS middleware, given an allowlist of
specific origins, mirrors the matching origin back rather than
answering with \`*\`.

### Why this matters

Both of these are the same idea from the middleware module, applied
to security specifically: a small piece of code that runs before your
route handlers and adds protective behavior (headers, origin checks)
that would otherwise have to be reimplemented — and likely gotten
subtly wrong — in every app from scratch.
`.trim(),
  codeExamples: [
    {
      title: "Enabling Helmet with defaults",
      code: `const helmet = require("helmet");
app.use(helmet()); // sets a curated batch of protective response headers`,
    },
    {
      title: "Restricting CORS to specific origins",
      code: `app.use(cors({
  origin: ["https://example.com", "https://admin.example.com"],
  credentials: true, // requires echoing the exact origin, never "*"
}));`,
    },
  ],
  challenge: {
    functionName: "resolveCors",
    prompt: `A CORS middleware decides, for each request's Origin header,
whether to allow it and what Access-Control-Allow-Origin header to
send back. Write resolveCors(allowedOrigins, origin) where
"allowedOrigins" is either the string "*" (allow everyone) or an array
of allowed origin strings, and "origin" is the request's Origin header
value (or null/undefined if the request has no Origin header at all —
i.e. it's not a cross-origin browser request).

- If there's no origin, return { allowed: true, header: null } —
  same-origin/non-browser requests don't need a CORS header at all.
- If allowedOrigins is "*", return { allowed: true, header: "*" }.
- If allowedOrigins is an array containing origin, return
  { allowed: true, header: origin } — when the allowlist is specific
  origins (not "*"), you must echo back the exact matching origin, not
  "*".
- Otherwise, return { allowed: false, header: null }.`,
    starterCode: `function resolveCors(allowedOrigins, origin) {
  // your code here
}`,
    solutionCode: `function resolveCors(allowedOrigins, origin) {
  if (!origin) return { allowed: true, header: null };
  if (allowedOrigins === "*") return { allowed: true, header: "*" };
  if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
    return { allowed: true, header: origin };
  }
  return { allowed: false, header: null };
}`,
    testCases: [
      { name: "wildcard allows any origin", args: () => ["*", "https://example.com"], expected: { allowed: true, header: "*" } },
      {
        name: "allowlisted origin is echoed back, not *",
        args: () => [["https://a.com", "https://b.com"], "https://a.com"],
        expected: { allowed: true, header: "https://a.com" },
      },
      {
        name: "origin not in the allowlist is rejected",
        args: () => [["https://a.com"], "https://evil.com"],
        expected: { allowed: false, header: null },
      },
      {
        name: "no Origin header means no CORS header needed",
        args: () => [["https://a.com"], null],
        expected: { allowed: true, header: null },
      },
      {
        name: "wildcard with no origin still needs no header",
        args: () => ["*", undefined],
        expected: { allowed: true, header: null },
      },
    ],
  },
};

export default expressSecurityBasics;
