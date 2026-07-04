import type { ModuleContent } from "@/lib/types";

const npmPackageSemver: ModuleContent = {
  id: "npm-package-semver",
  title: "npm, package.json, semver",
  category: "Reliability & Tooling",
  order: 11,
  explanation: `
### package.json essentials

- \`name\`, \`version\` — identity, required to publish.
- \`main\` (CJS entry) / \`exports\` (modern, can restrict what's importable
  and branch between CJS and ESM builds) / \`type: "module"\` (treat \`.js\`
  files as ESM).
- \`scripts\` — named shell commands run via \`npm run <name>\` (\`start\`,
  \`test\`, and \`install\`-family hooks run without \`run\`).
- \`dependencies\` vs \`devDependencies\` vs \`peerDependencies\`: runtime
  needs, build/test-only tools, and "the consumer must provide this"
  (used by libraries/plugins expecting a specific host version).

### Semantic versioning: MAJOR.MINOR.PATCH

- **MAJOR** — breaking changes
- **MINOR** — backwards-compatible new features
- **PATCH** — backwards-compatible bug fixes

### Range operators in package.json

- \`^1.2.3\` (caret, npm's default) — allow MINOR and PATCH updates, but
  not MAJOR: matches \`>=1.2.3 <2.0.0\`.
- \`~1.2.3\` (tilde) — allow PATCH updates only: matches \`>=1.2.3 <1.3.0\`.
- \`1.2.3\` (exact) — that version only.
- \`*\` / no range — anything.

### Lockfiles

\`package-lock.json\` pins the **exact** resolved version of every
dependency (direct and transitive). Without it, two installs of the same
\`package.json\` on different days could resolve different MINOR/PATCH
versions if a range like \`^1.2.3\` is satisfied by a newer publish.
Commit the lockfile — it's what makes builds reproducible.

\`npx <pkg>\` runs a package's binary without installing it globally
(installing it to a temp cache first if not already present).
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
