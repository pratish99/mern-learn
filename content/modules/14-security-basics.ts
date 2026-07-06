import type { ModuleContent } from "@/lib/types";

const securityBasics: ModuleContent = {
  id: "security-basics",
  title: "Security basics",
  category: "Reliability & Tooling",
  order: 14,
  explanation: `
Think of your server as a very obedient assistant. Normally it only
follows instructions **you** wrote in your code. Almost every security
bug in this module comes from the same root mistake: letting data that
came from a stranger (a form field, a URL, an uploaded file) get treated
as if it were an instruction *you* wrote. Once that happens, the
attacker is effectively typing commands directly into your app. The
sections below cover the most common ways that happens, and the simple
habits that prevent it.

### Never let user input turn into code

Some JavaScript and Node functions take a **string** and run it as code
or as a shell command:

- \`eval(str)\` — runs \`str\` as JavaScript.
- \`new Function(str)\` — builds a function out of \`str\` and runs it.
- \`child_process.exec(str)\` — runs \`str\` as a command in a real shell
  (the same program your terminal uses), so shell characters like
  \`;\`, \`|\`, and \`$()\` are interpreted, not just passed along.

If any part of \`str\` came from a user, they can smuggle in extra
commands. This is called **RCE (remote code execution)** — the attacker
gets to run arbitrary code on your server, not just mess with your app's
data.

\`\`\`js
// vulnerable — userFilename could be "a.png; rm -rf /"
// exec() hands the whole string to a shell, which happily runs both parts
exec(\`convert \${userFilename} out.png\`);

// safe — execFile passes each argument directly to the "convert" program,
// with no shell in between to reinterpret special characters
execFile("convert", [userFilename, "out.png"]);
\`\`\`

The fix is always the same shape: don't build a string and hand it to
something that "executes" strings. Use \`JSON.parse\` instead of \`eval\`
to read JSON, and use \`execFile\`/\`spawn\` with an **array** of
arguments instead of one big command string.

### Encode when you output, don't just filter on input

A common first instinct is to "clean" user input by stripping out
characters that look dangerous (like \`<\` or \`'\`). This is called
**blocklisting**, and it's fragile — there is almost always some
encoding or trick you didn't think to block.

A more reliable approach is **output encoding**: instead of trying to
guess what's dangerous going in, you make the data safe right before it
lands in a sensitive spot, in a way that matches that spot.

- Writing into an HTML page? Escape HTML entities (turn \`<\` into
  \`&lt;\`, etc.) so a comment like \`<script>\` renders as visible text
  instead of running as a tag. Skipping this is how **XSS
  (cross-site scripting)** happens — an attacker's script runs in
  another user's browser.
- Writing into a SQL query? Use **parameterized queries**, where the
  value is sent to the database separately from the query text, instead
  of pasting the value into the query string. Skipping this is how
  **SQL injection** happens — an attacker's text is interpreted as part
  of your query.
- Writing into a shell command? Pass arguments as an array (see above)
  instead of one string.

The pattern is the same each time: keep the data and the "instructions"
(HTML tags, SQL syntax, shell syntax) clearly separated, right up until
the last safe moment.

### Prototype pollution: poisoning the shared blueprint

Every plain JavaScript object secretly has a link to a shared "blueprint"
object called \`Object.prototype\` — it's where methods like
\`.toString()\` live so you don't have to redefine them on every object.
This chain of "if I don't have this property, check my blueprint" is
called the **prototype chain**.

If your code merges untrusted JSON into an object without checking the
keys, an attacker can send a key named \`"__proto__"\` or
\`"constructor"\`. A naive merge will follow that key straight to the
shared blueprint and modify it — meaning *every other object in your
running app*, not just this one, now has that attacker-controlled
property. That's **prototype pollution**, and it can quietly break
validation logic or permission checks elsewhere in the app.

Defenses: build dictionaries of untrusted keys with
\`Object.create(null)\` (an object with no blueprint link to poison), use
a merge library that explicitly guards against \`__proto__\`/
\`constructor\` keys, or use \`structuredClone\` for copying data, since it
doesn't walk the prototype chain at all.

### Keep your dependencies honest

Most apps run mostly other people's code (npm packages). A few habits
keep that from becoming a liability:

- Commit \`package-lock.json\` so every install (yours, a teammate's, the
  deploy server's) resolves to the exact same versions — no surprises.
- Run \`npm audit\` regularly and update packages it flags as having
  known vulnerabilities.
- Be cautious about install scripts (like \`postinstall\`) in packages
  you don't fully trust — they run arbitrary code on your machine the
  moment you run \`npm install\`, before you've even used the package.

### Why this matters

Almost every real-world security bug you'll fix boils down to one
question: "where does this data cross from 'stranger input' into
'something that gets executed, rendered, or trusted'?" The
\`escapeHtml\` function you'll write in this module's challenge is a
small, concrete example of output encoding — the same instinct that
protects you from SQL injection, shell injection, and prototype
pollution.
`.trim(),
  codeExamples: [
    {
      title: "Escaping before interpolating into HTML",
      code: `function render(comment) {
  return \`<p>\${escapeHtml(comment)}</p>\`;
}
// without escaping, a comment of "<img src=x onerror=alert(1)>" executes`,
    },
    {
      title: "Parameterized queries, not string building",
      code: `// vulnerable — SQL injection via string concatenation
db.query("SELECT * FROM users WHERE email = '" + email + "'");

// safe — the driver escapes the value for you
db.query("SELECT * FROM users WHERE email = ?", [email]);`,
    },
  ],
  challenge: {
    functionName: "escapeHtml",
    prompt: `Write escapeHtml(str) that escapes the characters that are unsafe to
interpolate directly into HTML: & → &amp;, < → &lt;, > → &gt;,
" → &quot;, ' → &#39;. Escape "&" first so you don't double-escape the
entities you just inserted.`,
    starterCode: `function escapeHtml(str) {
  // your code here
}`,
    solutionCode: `function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}`,
    testCases: [
      {
        name: "escapes a script tag",
        args: () => ["<script>alert(1)</script>"],
        expected: "&lt;script&gt;alert(1)&lt;/script&gt;",
      },
      { name: "escapes an ampersand", args: () => ["Tom & Jerry"], expected: "Tom &amp; Jerry" },
      {
        name: "escapes double quotes",
        args: () => ['He said "hi"'],
        expected: "He said &quot;hi&quot;",
      },
      { name: "escapes single quotes", args: () => ["it's fine"], expected: "it&#39;s fine" },
      { name: "leaves plain text untouched", args: () => ["plain text"], expected: "plain text" },
    ],
  },
};

export default securityBasics;
