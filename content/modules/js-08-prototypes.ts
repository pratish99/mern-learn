import type { ModuleContent } from "@/lib/types";

const jsPrototypesModule: ModuleContent = {
  id: "js-prototypes",
  title: "Prototypes & prototypal inheritance",
  category: "Objects & Prototypes",
  order: 8,
  explanation: `
### The problem: where do an object's methods actually live?

In some languages, objects are stamped out from a "class blueprint" and
each one gets its own private copy of every method. JavaScript doesn't
work that way. Instead, every object has a hidden link to another
object — called its **prototype** — and when you access a property or
method that isn't found directly on the object itself, JavaScript walks
up that link to look for it there.

A good analogy: you ask a question, and if you don't know the answer
yourself, you ask your parent. If they don't know either, they ask
*their* parent, and so on up the family tree. That chain of "ask the
next one up" is exactly what's called the **prototype chain**.

### What "prototype" actually means

Every object in JavaScript has an internal, hidden slot that points to
another object (or to \`null\` if there's nothing above it). That other
object is its **prototype**. When you write \`obj.someProperty\`, the
engine:

1. Checks if \`obj\` has \`someProperty\` directly on itself (an "own
   property"). If yes, use it.
2. If not, checks \`obj\`'s prototype for \`someProperty\`.
3. If not found there either, checks *that* object's prototype, and so
   on, until it either finds the property or reaches an object whose
   prototype is \`null\` (the end of the chain, usually \`Object.prototype\`
   itself).

\`\`\`mermaid
flowchart LR
  Obj["obj (own property?)"] -->|"not found"| Proto["obj's prototype"]
  Proto -->|"not found"| ObjProto["Object.prototype"]
  ObjProto -->|"not found"| NullEnd["null (end of chain)"]
\`\`\`

This is why you can call \`.toString()\` or \`.hasOwnProperty()\` on almost
any object even though you never wrote those methods yourself — they
live on \`Object.prototype\`, and the chain finds them.

### \`Object.create\`: making the link explicit

The most direct way to create an object with a specific prototype is
\`Object.create(proto)\`. It returns a brand-new, empty object whose
prototype is set to \`proto\` — no constructor functions, no \`class\`
keyword required.

\`\`\`js
const animalProto = {
  speak() {
    return \`\${this.name} makes a sound\`;
  },
};

const dog = Object.create(animalProto);
dog.name = "Rex";
dog.speak(); // "Rex makes a sound"
\`\`\`

\`dog\` doesn't have its own \`speak\` method — it's not an "own property."
Looking it up walks the chain: check \`dog\` (not found) → check
\`animalProto\` (found!). Multiple objects can share the exact same
\`animalProto\` as their prototype, which means they all share the *same*
function in memory instead of each carrying a private copy — that's the
core efficiency win of prototypal inheritance.

### Inspecting and changing the link

Every object exposes its prototype through a legacy accessor property
called \`__proto__\`, and you'll still see \`obj.__proto__\` in a lot of
older code and tutorials. It works, but it's considered a historical
accident of the language rather than a clean API. The correct, modern
way to do the same thing is:

- \`Object.getPrototypeOf(obj)\` — read an object's prototype.
- \`Object.setPrototypeOf(obj, proto)\` — change it (rarely needed once
  an object already exists; usually you decide the prototype up front
  with \`Object.create\`).

\`\`\`js
Object.getPrototypeOf(dog) === animalProto; // true
\`\`\`

### The bridge to \`class\`

If you've used \`class\` and \`extends\` in JavaScript (or plan to — that's
the next module), here's the reveal: **there is no separate inheritance
system for classes.** \`class Dog extends Animal\` is syntax sugar that,
under the hood, still wires up a prototype chain — \`Dog.prototype\`'s
prototype gets set to \`Animal.prototype\`, and instances still look up
inherited methods exactly the way \`dog\` found \`speak\` above. Learning
\`Object.create\` first means \`class\` will feel like a shortcut for
something you already understand, not new magic.

### Why this matters

Every method call on every object you've ever used in JavaScript —
arrays, strings, custom objects — relies on this same lookup-the-chain
mechanism. The challenge below asks you to build that chain by hand
with \`Object.create\`: one shared \`animalProto\` holding a \`speak()\`
method, and individual animal objects that borrow it through the
prototype link rather than each defining their own copy.

Next up: the \`class\` keyword, which gives this exact pattern a more
familiar-looking syntax.
`.trim(),
  codeExamples: [
    {
      title: "Lookup falls through to a shared method",
      code: `const shapeProto = {
  describe() {
    return \`A shape with \${this.sides} sides\`;
  },
};

const triangle = Object.create(shapeProto);
triangle.sides = 3;

const square = Object.create(shapeProto);
square.sides = 4;

// Neither triangle nor square has its own "describe" —
// both find it by walking up to shapeProto.
triangle.describe(); // "A shape with 3 sides"
square.describe(); // "A shape with 4 sides"`,
    },
    {
      title: "Confirming the link with Object.getPrototypeOf",
      code: `const base = { greet() { return "hi"; } };
const child = Object.create(base);

Object.getPrototypeOf(child) === base; // true
child.hasOwnProperty("greet"); // false — it's inherited, not own
"greet" in child; // true — the chain still finds it`,
    },
  ],
  challenge: {
    functionName: "describeAnimal",
    prompt: `Write describeAnimal(name, sound) using Object.create-based prototypal
inheritance (no "class" keyword): create a shared "animalProto" object with a
speak() method that returns a template string using this.name and this.sound.
Then use Object.create(animalProto) to make an individual animal object, set
its own name and sound properties, call .speak() on it, and return the result.`,
    starterCode: `function describeAnimal(name, sound) {
  // your code here
}`,
    solutionCode: `function describeAnimal(name, sound) {
  const animalProto = {
    speak() {
      return \`\${this.name} says \${this.sound}\`;
    },
  };
  const animal = Object.create(animalProto);
  animal.name = name;
  animal.sound = sound;
  return animal.speak();
}`,
    testCases: [
      { name: "builds the expected sentence", args: () => ["Rex", "Woof"], expected: "Rex says Woof" },
      { name: "works for a different animal", args: () => ["Whiskers", "Meow"], expected: "Whiskers says Meow" },
      { name: "handles an unusual sound string", args: () => ["Duck", "Quack!"], expected: "Duck says Quack!" },
    ],
  },
};

export default jsPrototypesModule;
