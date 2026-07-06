import type { ModuleContent } from "@/lib/types";

const classesModule: ModuleContent = {
  id: "js-classes",
  title: "Classes",
  category: "Objects & Prototypes",
  order: 9,
  explanation: `
### "Class" sounds like Java. Is it?

If you've used a language like Java, C++, or Python, the word \`class\`
probably makes you think of blueprints for objects, with strict rules
about inheritance. JavaScript's \`class\` keyword borrows that vocabulary,
but it's not a new kind of object system bolted onto the language — it's
**syntax sugar over the prototype system JS already had**. Under the
hood, a class is still just a function with a prototype object attached,
and instances still look things up through the prototype chain, exactly
like the plain \`Object.create\`-based objects covered elsewhere in this
track. \`class\` just gives that pattern a friendlier, more familiar-looking
syntax.

### Declaring a class

\`\`\`js
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return \`\${this.name} makes a sound.\`;
  }
}

const dog = new Animal("Rex");
dog.speak(); // "Rex makes a sound."
\`\`\`

A few things to notice:

- The \`constructor\` is a special method that runs when you call \`new
  Animal(...)\`. It's where you set up instance state, usually by
  assigning to \`this\`.
- \`speak()\` is an **instance method** — but it isn't copied onto every
  \`dog\`, \`cat\`, etc. It's defined once on \`Animal.prototype\`, and every
  instance shares that same function via the prototype chain. Classes
  set this up for you automatically; you don't have to touch
  \`.prototype\` yourself.

### \`extends\`: building on top of another class

\`extends\` lets one class inherit from another, forming a **subclass**
(child) of a **superclass** (parent). The subclass gets everything the
parent has, plus whatever it adds or changes.

\`\`\`js
class Dog extends Animal {
  speak() {
    return \`\${this.name} barks.\`;
  }
}

new Dog("Rex").speak(); // "Rex barks."
\`\`\`

### \`super(...)\`: why order matters

When a subclass defines its own \`constructor\`, it must call
\`super(...)\` — passing along whatever arguments the parent constructor
expects — **before it touches \`this\`**. If you skip this or try to use
\`this\` first, JavaScript throws an error.

Why so strict? In a subclass, \`this\` doesn't actually exist yet when
the constructor starts running. It only gets created once the parent
constructor (\`super\`) has finished setting things up. Calling \`super()\`
is what wires the subclass instance into existence — trying to read or
write \`this\` before that point would be reaching for something that
isn't there yet.

\`\`\`js
class Puppy extends Animal {
  constructor(name, breed) {
    super(name); // must happen first — sets up this.name
    this.breed = breed; // now safe to use this
  }
}
\`\`\`

### Overriding vs. adding

- **Overriding** a method means the subclass defines a method with the
  *same name* as one on the parent — like \`Dog\` redefining \`speak()\`
  above. When called on a \`Dog\` instance, the subclass's version runs
  instead of the parent's.
- **Adding** a method just means the subclass defines something new that
  the parent never had, like \`Puppy\` gaining a \`play()\` method that
  \`Animal\` doesn't have. Both parent and child methods remain available
  side by side.

If an overriding method still wants the parent's behavior as part of its
own, it can call \`super.methodName(...)\` to explicitly invoke the
parent's version.

### \`static\`: things that belong to the class, not the instances

A \`static\` method or property lives on the class itself, not on any
individual instance — you call it as \`Animal.someStaticMethod()\`, never
on a \`dog\`. It's useful for helpers or data that make sense at the
"class" level rather than the "one specific animal" level (a counter of
how many instances were created, a factory method, a constant).

### One quiet rule: classes are always strict mode

Regular scripts run in "sloppy mode" unless you opt in with
\`"use strict"\`. The body of every \`class\` — constructor and all
methods — is automatically strict mode, no matter what. In practice this
mostly means mistakes that would silently pass in sloppy mode (like
assigning to an undeclared variable) throw errors instead, which is
usually a good thing.

### Why this matters

The \`describeCircle\` challenge below asks you to put all of this
together in one place: a base \`Shape\` class with a constructor and two
methods, a \`Circle\` subclass that uses \`extends\` and \`super(...)\` to
reuse the parent's setup, and an overridden \`area()\` method that gives
\`Circle\` its own specific behavior while still sharing \`describe()\` from
\`Shape\`. That combination — inherit what makes sense, override what
needs to differ — is the whole point of class-based inheritance in JS.
`.trim(),
  codeExamples: [
    {
      title: "Static methods and properties",
      code: `class Counter {
  static instancesCreated = 0;

  constructor() {
    Counter.instancesCreated++;
  }

  static describe() {
    return \`Created \${Counter.instancesCreated} counter(s) so far.\`;
  }
}

new Counter();
new Counter();
Counter.describe(); // "Created 2 counter(s) so far."
// Note: instancesCreated lives on Counter itself, not on any instance.`,
    },
    {
      title: "Forgetting super() before using this",
      code: `class Base {
  constructor(label) {
    this.label = label;
  }
}

class Broken extends Base {
  constructor(label) {
    this.label = label; // using \`this\` before calling super()
    super(label);
  }
}

// new Broken("x") would throw:
// ReferenceError: Must call super constructor in derived class
// before accessing 'this' or returning from derived constructor`,
    },
  ],
  challenge: {
    functionName: "describeCircle",
    prompt: `Write describeCircle(radius) using ES6 classes: define a base class
Shape with a constructor that takes a name and stores it, a describe() method
that returns \`\${this.name}: \${this.area()}\`, and an area() method that
returns 0 as a default. Then define a Circle class that extends Shape, whose
constructor takes a radius, calls super("Circle"), and stores the radius —
and that overrides area() to return Math.round(Math.PI * radius * radius).
Return new Circle(radius).describe().`,
    starterCode: `function describeCircle(radius) {
  // your code here
}`,
    solutionCode: `function describeCircle(radius) {
  class Shape {
    constructor(name) {
      this.name = name;
    }
    describe() {
      return \`\${this.name}: \${this.area()}\`;
    }
    area() {
      return 0;
    }
  }

  class Circle extends Shape {
    constructor(radius) {
      super("Circle");
      this.radius = radius;
    }
    area() {
      return Math.round(Math.PI * this.radius * this.radius);
    }
  }

  return new Circle(radius).describe();
}`,
    testCases: [
      { name: "computes area for radius 3", args: () => [3], expected: "Circle: 28" },
      { name: "computes area for radius 1", args: () => [1], expected: "Circle: 3" },
      { name: "computes area for radius 10", args: () => [10], expected: "Circle: 314" },
      { name: "handles radius 0", args: () => [0], expected: "Circle: 0" },
    ],
  },
};

export default classesModule;
