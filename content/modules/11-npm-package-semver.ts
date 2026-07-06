import type { ModuleContent } from "@/lib/types";

const npmPackageSemver: ModuleContent = {
  id: "npm-package-semver",
  title: "npm, package.json, semver",
  category: "Reliability & Tooling",
  order: 11,
  explanation: `
### The problem this solves: sharing code without chaos

Imagine building with LEGO, except instead of one box of bricks, you're
pulling pieces from dozens of boxes made by different people. That's how
almost every real JavaScript project works: you rarely write everything
yourself — you pull in **packages** (reusable code someone else published)
and combine them with your own.

**npm** (Node Package Manager) is the tool that fetches those packages.
**\`package.json\`** is the "recipe card" at the root of your project: it
lists what the project needs, how to run it, and basic identity info like
its name and version. **Semantic versioning ("semver")** is the numbering
scheme — like \`1.4.2\` — that tells you, at a glance, whether upgrading a
package is likely safe or risky. This module covers all three, since
together they're how real Node projects manage their dependencies (the
packages they rely on).

### package.json essentials

Open any Node project and you'll find a \`package.json\` file. Here's what
its most important fields mean:

- **\`name\`** and **\`version\`** — the project's identity. Both are
  required if you ever want to publish this package to npm.
- **\`main\`** and **\`exports\`** — tell Node.js *which file to load* when
  someone writes \`require("your-package")\` or \`import "your-package"\`.
  \`main\` points to the entry file for **CJS** ("CommonJS" — Node's
  original module system, based on \`require\`). \`exports\` is the newer,
  more flexible version: it can point to different files depending on
  whether the consumer uses CJS or **ESM** ("ECMAScript Modules" — the
  \`import\`/\`export\` syntax), and it can hide internal files so consumers
  only see what you intend to expose.
- **\`type: "module"\`** — tells Node "treat every \`.js\` file here as
  ESM," instead of the older CJS default.
- **\`scripts\`** — a dictionary of named shell commands. Write
  \`"build": "tsc"\` and you can run it anywhere with \`npm run build\`. A
  few special names (\`start\`, \`test\`, and the \`install\`-family hooks)
  can be run *without* typing \`run\` — just \`npm start\`.
- Three flavors of dependency, each answering a different question:
  - **\`dependencies\`** — "does the app need this to actually run?" (e.g.
    a web framework like Express).
  - **\`devDependencies\`** — "do I only need this while building or
    testing, not in production?" (e.g. TypeScript, a test runner).
  - **\`peerDependencies\`** — mostly used by libraries and plugins. It
    means "I expect *you*, the installer, to already have a specific
    version of some other package" — e.g. a component library might
    declare React as a peer instead of bundling its own copy.

### Semantic versioning: reading a version number like a label

A version like \`1.4.2\` isn't arbitrary — semver gives each of the three
numbers a specific meaning, written as **MAJOR.MINOR.PATCH**:

- **MAJOR** (the \`1\`) increases only for a **breaking change** —
  something that could make existing code using this package stop
  working.
- **MINOR** (the \`4\`) increases for a **new feature** that doesn't break
  anything already using the package.
- **PATCH** (the \`2\`) increases for a **bug fix** that adds nothing new
  and breaks nothing.

Think of it as a warning label: the further left the number that
changed, the more caution you should apply before upgrading.

### Range operators: telling npm how much wiggle room to allow

You rarely pin an exact version in \`package.json\` — instead you specify
a **range**, and npm installs the newest version that fits it. The
symbol in front of the version controls how wide that range is:

- **\`^1.2.3\`** (caret — npm's default) — "this version, or any newer
  MINOR/PATCH update, but never a new MAJOR." Matches \`>=1.2.3 <2.0.0\`.
  The idea: MINOR/PATCH updates are supposed to be safe, so let them
  through automatically.
- **\`~1.2.3\`** (tilde) — more conservative: PATCH updates only. Matches
  \`>=1.2.3 <1.3.0\`. You're saying "I trust bug fixes, but I want to
  review new features myself first."
- **\`1.2.3\`** (no symbol) — that exact version, no wiggle room.
- **\`*\`** or no range — "any version is fine" (rarely a good idea).

\`\`\`js
// dependency declared as "^1.2.3" is satisfied by:
// 1.2.3 -> yes   1.9.9 -> yes   2.0.0 -> no (major bump)

// dependency declared as "~1.2.3" is satisfied by:
// 1.2.3 -> yes   1.2.9 -> yes   1.3.0 -> no (minor bump)
\`\`\`

### Lockfiles: freezing the exact versions you actually got

Here's the problem ranges create: if \`package.json\` says \`^1.2.3\` and
the author publishes \`1.3.0\` next week, a fresh \`npm install\` today
could pull a different version than someone who ran the same install
last month — even though nobody touched \`package.json\`. It gets worse,
because each of your dependencies has its own dependencies (called
**transitive dependencies**), so this uncertainty cascades down the
whole tree.

**\`package-lock.json\`** fixes this by recording the *exact* resolved
version of every package — direct and transitive — after an install.
Think of \`package.json\` as a shopping list ("get some paper towels")
and \`package-lock.json\` as the receipt showing exactly which brand and
size you got. As long as everyone installs from the same lockfile,
everyone ends up with identical code — which is why you should always
commit it to version control.

### A quick bonus: npx

**\`npx <package>\`** runs a package's command-line tool without
installing it globally first. If it isn't already cached locally, npx
downloads it to a temporary cache, runs it once, and gets out of your
way — handy for one-off tools like project generators.

### Why this matters

Every time you run \`npm install\`, add a dependency, or review a pull
request that changes \`package-lock.json\`, you're touching exactly these
mechanics. Knowing what \`^\` versus \`~\` actually permits — and why the
lockfile exists — is what lets you upgrade dependencies with confidence
instead of guessing and hoping nothing breaks.
`.trim(),
  codeExamples: [
    {
      title: "A minimal package.json",
      code: `{
  "name": "my-app",
  "version": "1.4.2",
  "type": "module",
  "scripts": { "start": "node index.js", "test": "node --test" },
  "dependencies": { "express": "^4.19.0" },
  "devDependencies": { "typescript": "~5.4.0" }
}`,
    },
    {
      title: "What each range allows",
      code: `// dependency declared as "^1.2.3" is satisfied by:
1.2.3  ✅   1.9.9  ✅   2.0.0  ❌ (major bump)

// dependency declared as "~1.2.3" is satisfied by:
1.2.3  ✅   1.2.9  ✅   1.3.0  ❌ (minor bump)`,
    },
  ],
  challenge: {
    functionName: "satisfiesSemver",
    prompt: `Write satisfiesSemver(version, range) supporting three range forms,
where version and range are "MAJOR.MINOR.PATCH" strings (range may be
prefixed):
- "^1.2.3" → true if version has the same MAJOR and is >= 1.2.3
- "~1.2.3" → true if version has the same MAJOR.MINOR and is >= 1.2.3
- "1.2.3" (no prefix) → true only for an exact match`,
    starterCode: `function satisfiesSemver(version, range) {
  // your code here
}`,
    solutionCode: `function satisfiesSemver(version, range) {
  const parse = (v) => v.split(".").map(Number);
  const compare = (a, b) => {
    for (let i = 0; i < 3; i++) {
      if (a[i] !== b[i]) return a[i] - b[i];
    }
    return 0;
  };

  const v = parse(version);

  if (range.startsWith("^")) {
    const base = parse(range.slice(1));
    return v[0] === base[0] && compare(v, base) >= 0;
  }

  if (range.startsWith("~")) {
    const base = parse(range.slice(1));
    return v[0] === base[0] && v[1] === base[1] && compare(v, base) >= 0;
  }

  return version === range;
}`,
    testCases: [
      { name: "caret allows minor/patch bumps", args: () => ["1.2.3", "^1.0.0"], expected: true },
      { name: "caret rejects a major bump", args: () => ["2.0.0", "^1.0.0"], expected: false },
      { name: "tilde allows patch bumps", args: () => ["1.2.5", "~1.2.0"], expected: true },
      { name: "tilde rejects a minor bump", args: () => ["1.3.0", "~1.2.0"], expected: false },
      { name: "exact match with no prefix", args: () => ["1.2.3", "1.2.3"], expected: true },
      { name: "exact mismatch with no prefix", args: () => ["1.2.4", "1.2.3"], expected: false },
    ],
  },
};

export default npmPackageSemver;
