import type { ModuleContent } from "@/lib/types";

const securityBasics: ModuleContent = {
  id: "security-basics",
  title: "Security basics",
  category: "Reliability & Tooling",
  order: 14,
  explanation: `
### Never build code from strings

\`eval()\`, \`new Function(str)\`, and \`child_process.exec\` with
unsanitized input all execute arbitrary code. If user input reaches any
of them, that's remote code execution. Use \`JSON.parse\` (not \`eval\`) for
JSON, and \`execFile\`/\`spawn\` with an argument **array** (not a shell
string) so arguments can't be interpreted as shell syntax.

\`\`\`js
// vulnerable — user input becomes part of a shell command
exec(\`convert \${userFilename} out.png\`);

// safe — arguments are passed directly, not through a shell
execFile("convert", [userFilename, "out.png"]);
\`\`\`

### Output encoding beats input blocklisting

Trying to "sanitize" input by stripping dangerous characters is fragile —
you'll miss an encoding. Instead, **encode on output** for the context
you're writing into: escape HTML entities before interpolating into a
page, use parameterized queries for SQL (never string-concatenate values
into a query), and quote/array-ify shell arguments.

### Prototype pollution

Merging untrusted JSON into an object without guarding against
\`"__proto__"\`/\`"constructor"\` keys can let an attacker modify
\`Object.prototype\` itself, affecting every object in the process.
Use \`Object.create(null)\` for dictionaries built from untrusted keys, or
a library that explicitly guards against this (or \`structuredClone\`,
which doesn't walk the prototype chain).

### Safe dependencies

- Commit \`package-lock.json\` for reproducible installs.
- Run \`npm audit\` and update flagged packages.
- Be wary of install scripts (\`postinstall\`) from packages you don't
  trust — they run arbitrary code at install time.
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
