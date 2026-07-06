import type { ModuleContent } from "@/lib/types";

const regexBasicsModule: ModuleContent = {
  id: "js-regex-basics",
  title: "Regular expressions basics",
  category: "Metaprogramming & Patterns",
  order: 14,
  explanation: `
### The problem: finding patterns, not just exact text

If you want to know whether a string contains the exact word \`"cat"\`,
\`.includes("cat")\` is all you need. But what if you want to know whether a
string looks like an email address, or contains a hashtag, or has a phone
number buried somewhere in it? "Looks like" isn't something you can check
with plain string methods — you need a way to describe a *shape* of text,
not a specific piece of text.

That's what a **regular expression** (regex, for short) is: a tiny
pattern-matching language embedded right inside JavaScript. The syntax
looks intimidating the first time you see it — a wall of slashes,
backslashes, and punctuation — but it's built from a small set of
building blocks that combine in predictable ways. Learn those blocks and
you can read (and write) the vast majority of regexes you'll run into.

### Creating a regex

There are two ways to make one:

\`\`\`js
const literal = /hello/i;        // regex literal — slashes, then flags
const fromString = new RegExp("hello", "i"); // useful when the pattern is a variable
\`\`\`

The regex **literal** (\`/pattern/flags\`) is by far the more common form —
it's shorter and JavaScript knows at a glance that it's a regex, not a
division sign. Reach for \`new RegExp(...)\` mainly when the pattern itself
has to be built from a string at runtime (e.g. it comes from user input).

### Flags: tweaking how the pattern behaves

Flags go after the closing slash and change the matching rules for the
whole pattern:

- \`i\` — case-**i**nsensitive: \`/cat/i\` matches \`"Cat"\`, \`"CAT"\`, \`"cat"\`.
- \`g\` — **g**lobal: instead of stopping at the first match, keep going
  and find *every* match in the string. This is the one you'll use most
  in this module.
- \`m\` — multiline: changes how \`^\` and \`$\` behave across line breaks
  (a detail you won't need for this challenge, but worth knowing exists).

### Character classes: describing kinds of characters

Instead of spelling out every character you'd accept, a character class
matches "any character of this kind":

- \`\\d\` — any digit (\`0-9\`). Its opposite, \`\\D\`, matches anything that
  is *not* a digit.
- \`\\w\` — any "word character": letters (upper or lower case), digits,
  or underscore. The opposite, \`\\W\`, matches anything that isn't one of
  those.
- \`\\s\` — any whitespace character (space, tab, newline). The opposite,
  \`\\S\`, matches any non-whitespace character.

You can also build your own class with square brackets, like \`[aeiou]\`
(matches any one vowel) or \`[a-z]\` (any lowercase letter, using a range).

### Quantifiers: how many times?

By default, each character or class in a pattern matches exactly one
character. Quantifiers say "how many":

- \`+\` — one or more. \`/\\d+/\` matches \`"7"\`, \`"42"\`, \`"90210"\`.
- \`*\` — zero or more. \`/colou*r/\` matches both \`"color"\` and \`"colour"\`.
- \`?\` — zero or one (optional). \`/https?/\` matches \`"http"\` and \`"https"\`.
- \`{n,m}\` — between \`n\` and \`m\` times. \`/\\d{3,5}/\` matches a run of 3
  to 5 digits.

### Capturing groups: pulling out the part you actually want

Wrapping part of a pattern in parentheses \`(...)\` creates a **capturing
group**. The whole pattern still has to match for there to be a match at
all, but a capturing group lets you *separately* grab just that inner
piece afterward, instead of the entire matched text.

For example, the pattern \`/#(\\w+)/\` matches a \`#\` followed by one or more
word characters — but because the \`\\w+\` part is wrapped in parentheses,
whatever it matched (the tag name, without the \`#\`) is available on its
own as "group 1" of the match result.

### The main ways to *use* a regex

- \`regex.test(str)\` — returns a plain \`true\`/\`false\`: does the pattern
  match *anywhere* in the string at all? Great for validation checks.
- \`str.match(regex)\` / \`str.matchAll(regex)\` — actually retrieve the
  matches, including any captured groups. Without the \`g\` flag,
  \`.match()\` gives you just the first match (plus its groups). *With*
  the \`g\` flag, \`.match()\` gives you an array of every full match (no
  group info), while \`.matchAll()\` gives you an iterator of full match
  objects — one per match, each one still carrying its own captured
  groups. That's why \`.matchAll()\` combined with \`g\` is the tool of
  choice when you need "every match, with its groups" at once.
- \`str.replace(regex, replacement)\` — find matches and substitute them.
  With the \`g\` flag, every match gets replaced, not just the first.

### Why this matters

The upcoming challenge asks you to pull every hashtag out of a string —
a perfect showcase for combining these pieces: a literal \`#\`, a
capturing group \`(\\w+)\` to grab the tag name without the \`#\`, the \`g\`
flag so you don't stop after the first hashtag, and \`.matchAll()\` to
collect every match's captured group into a clean array. Once you can
read a pattern like \`/#(\\w+)/g\` and know exactly what each piece is
doing, you've got a tool that will save you from writing a lot of fragile
manual string-splitting code.
`.trim(),
  codeExamples: [
    {
      title: "test() for a quick validation check",
      code: `// A (deliberately simplified) check for "does this look like an email?"
const looksLikeEmail = /^\\S+@\\S+\\.\\S+$/;

looksLikeEmail.test("ada@example.com"); // true
looksLikeEmail.test("not an email");    // false`,
      note: "test() only tells you yes/no — use match()/matchAll() when you need the actual matched text.",
    },
    {
      title: "replace() with a capturing group",
      code: `// Swap "First Last" into "Last, First" using two capturing groups
const name = "Ada Lovelace";
const reordered = name.replace(/(\\w+) (\\w+)/, "$2, $1");

console.log(reordered); // "Lovelace, Ada"`,
      note: "$1 and $2 inside the replacement string refer back to the first and second capturing groups.",
    },
  ],
  challenge: {
    functionName: "extractHashtags",
    prompt: `Write extractHashtags(text) that finds every hashtag in text (a "#"
followed by one or more word characters — letters, digits, or underscore) and
returns an array of just the tag names, without the "#", in the order they
appear. Use a regex with the global flag and String.prototype.matchAll (or
match) — don't split the string manually.`,
    starterCode: `function extractHashtags(text) {
  // your code here
}`,
    solutionCode: `function extractHashtags(text) {
  const matches = text.matchAll(/#(\\w+)/g);
  return [...matches].map((match) => match[1]);
}`,
    testCases: [
      {
        name: "extracts multiple hashtags in order",
        args: () => ["Loving #javascript and #node right now! #2026"],
        expected: ["javascript", "node", "2026"],
      },
      { name: "returns an empty array when there are none", args: () => ["no tags here"], expected: [] },
      { name: "handles a single hashtag", args: () => ["just #one tag"], expected: ["one"] },
      {
        name: "handles hashtags with underscores and digits",
        args: () => ["check #test_run_42 please"],
        expected: ["test_run_42"],
      },
    ],
  },
};

export default regexBasicsModule;
