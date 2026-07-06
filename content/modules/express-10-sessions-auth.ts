import type { ModuleContent } from "@/lib/types";

const expressSessionsAuth: ModuleContent = {
  id: "express-sessions-auth",
  title: "Sessions, cookies & auth basics",
  category: "Auth & Security",
  order: 10,
  explanation: `
HTTP is **stateless** — every request arrives with no memory of any
previous one. So how does a site "remember" that you're logged in
between page loads? The answer, almost always, is a small piece of
data the browser automatically resends on every request: a **cookie**.

### Cookies: data the browser carries for you

When a server wants the browser to remember something, it sends a
\`Set-Cookie\` response header. The browser stores that, and from then
on, automatically attaches it back to every future request to that
same site in a \`Cookie\` request header:

\`\`\`
Response: Set-Cookie: sid=abc123; HttpOnly
Request (later):      Cookie: sid=abc123
\`\`\`

\`HttpOnly\` is worth calling out: it tells the browser "don't let
JavaScript running on this page read this cookie" — a defense against
a malicious script (see the security module) stealing a logged-in
user's session id.

### Sessions: the server remembers, the cookie just points

A **session** is server-side storage (in memory, or more commonly a
database like Redis for a real app) keyed by a random, unguessable
**session id**. The cookie only ever carries that id — never the
user's actual data:

1. On login, the server creates a session id, stores
   \`{ sessionId: { userId, ... } }\` somewhere, and sends the id back
   as a cookie.
2. On every later request, the server reads the \`sid\` cookie, looks it
   up in its session store, and if found, treats the request as coming
   from that stored user.
3. Logging out just deletes that entry from the store — the cookie
   itself becomes meaningless immediately.

\`\`\`js
const express = require("express");
const session = require("express-session");

app.use(session({ secret: "keep-this-secret", resave: false, saveUninitialized: false }));

app.post("/login", (req, res) => {
  req.session.userId = findUser(req.body.username).id; // library handles cookie + storage
  res.send("logged in");
});

app.get("/profile", (req, res) => {
  if (!req.session.userId) return res.status(401).send("please log in");
  res.json(getUser(req.session.userId));
});
\`\`\`

The \`express-session\` package handles generating the id, setting the
cookie, and storing session data for you — \`req.session\` is just a
plain object that's automatically saved and reloaded per user.

### Token-based auth: the alternative

Not every client is a browser with cookies (mobile apps, other
servers calling your API). An alternative is a **bearer token** — a
signed string like a JWT (JSON Web Token) that the client stores
itself and sends manually in an \`Authorization: Bearer <token>\`
header on every request. The server verifies the token's signature
(no database lookup needed, since the token carries its own signed
claims) instead of looking anything up in a session store. Both
approaches answer the same question — "who is making this request?" —
just with different tradeoffs around statelessness and revocability.

### Why this matters

Whether it's a cookie-backed session or a bearer token, the mental
model is identical: something identifying the user rides along on
every request (a cookie or a header), and a piece of middleware near
the top of your app reads it, looks up (or verifies) who it belongs
to, and attaches that identity to \`req\` before your route handlers
ever see the request.
`.trim(),
  codeExamples: [
    {
      title: "Reading a raw Cookie header",
      code: `// Cookie: theme=dark; sid=abc123
const cookies = req.headers.cookie
  .split("; ")
  .map((pair) => pair.split("="))
  .reduce((acc, [name, value]) => ({ ...acc, [name]: value }), {});
console.log(cookies.sid); // "abc123"`,
    },
    {
      title: "An auth-checking middleware",
      code: `function requireSession(req, res, next) {
  if (!req.session.userId) return res.status(401).send("please log in");
  next();
}
app.get("/profile", requireSession, (req, res) => res.json(getUser(req.session.userId)));`,
    },
  ],
  challenge: {
    functionName: "authenticateRequest",
    prompt: `Cookie-based sessions work like this: a login endpoint creates a
session id, stores user data server-side keyed by that id, and sends
the id back as a cookie; later requests send that cookie back in a
Cookie header, and the server looks up the id in its store. Write
authenticateRequest(cookieHeader, sessions) that:

1. Parses cookieHeader (a string like "theme=dark; sid=abc123", or
   null/empty if no cookies were sent) into individual name=value
   pairs, split on "; ".
2. Looks for a cookie named exactly "sid".
3. If there's no "sid" cookie, or its value isn't a key in "sessions",
   return { authenticated: false, user: null }.
4. Otherwise return { authenticated: true, user: sessions[sid] }.`,
    starterCode: `function authenticateRequest(cookieHeader, sessions) {
  // your code here
}`,
    solutionCode: `function authenticateRequest(cookieHeader, sessions) {
  if (!cookieHeader) return { authenticated: false, user: null };

  const cookies = {};
  for (const pair of cookieHeader.split("; ")) {
    const [name, value] = pair.split("=");
    cookies[name] = value;
  }

  const sid = cookies.sid;
  if (!sid || !(sid in sessions)) {
    return { authenticated: false, user: null };
  }

  return { authenticated: true, user: sessions[sid] };
}`,
    testCases: [
      {
        name: "authenticates a valid session cookie",
        args: () => ["sid=abc123", { abc123: { name: "Ada" } }],
        expected: { authenticated: true, user: { name: "Ada" } },
      },
      {
        name: "finds sid among multiple cookies",
        args: () => ["theme=dark; sid=abc123", { abc123: { name: "Ada" } }],
        expected: { authenticated: true, user: { name: "Ada" } },
      },
      {
        name: "no sid cookie present",
        args: () => ["theme=dark", { abc123: { name: "Ada" } }],
        expected: { authenticated: false, user: null },
      },
      { name: "no cookie header at all", args: () => [null, {}], expected: { authenticated: false, user: null } },
      {
        name: "sid cookie references an unknown session",
        args: () => ["sid=wrong", { abc123: { name: "Ada" } }],
        expected: { authenticated: false, user: null },
      },
      {
        name: "sid is not the last cookie",
        args: () => ["sid=abc123; theme=dark", { abc123: { name: "Ada" } }],
        expected: { authenticated: true, user: { name: "Ada" } },
      },
    ],
  },
};

export default expressSessionsAuth;
