import type { ModuleContent } from "@/lib/types";

const asyncProgramming: ModuleContent = {
  id: "async-programming",
  title: "Async programming",
  category: "Async & Concurrency",
  order: 3,
  explanation: `
Node's async story evolved in three stages, and you'll still see all
three in real codebases.

### 1. Error-first callbacks

The original pattern: the last argument is a callback shaped
\`(err, result) => {}\`. Always check \`err\` first.

\`\`\`js
fs.readFile("a.txt", "utf8", (err, data) => {
  if (err) return handle(err);
  use(data);
});
\`\`\`

Downsides: nesting ("callback hell"), no built-in way to compose, easy to
forget error handling or call the callback twice.

### 2. Promises

A Promise represents a value that will exist (or fail) later. It has
three states: pending → fulfilled or rejected, and once settled it never
changes again.

\`\`\`js
readFilePromise("a.txt")
  .then((data) => use(data))
  .catch((err) => handle(err));
\`\`\`

\`util.promisify(fn)\` converts a conventional error-first callback
function into one that returns a Promise, as long as the function follows
the \`(...args, cb)\` shape.

### 3. async/await

Syntactic sugar over Promises — an \`async function\` always returns a
Promise, and \`await\` pauses that function (not the whole thread) until
the awaited Promise settles, unwrapping the value or throwing the
rejection as a catchable error.

\`\`\`js
async function main() {
  try {
    const data = await readFilePromise("a.txt");
    use(data);
  } catch (err) {
    handle(err);
  }
}
\`\`\`

\`await\` only pauses the enclosing async function — everything else on
the event loop keeps running. Unhandled Promise rejections don't crash
older Node versions silently, but modern Node terminates the process on
an unhandled rejection by default, so always attach a \`.catch\` or wrap
awaits in \`try/catch\`.
`.trim(),
  codeExamples: [
    {
      title: "Callback → Promise",
      code: `function readValue(value, cb) {
  setTimeout(() => {
    if (value < 0) cb(new Error("negative value"));
    else cb(null, value * 2);
  }, 0);
}

function toPromise(fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}`,
    },
    {
      title: "Consuming with async/await",
      code: `async function main() {
  try {
    const doubled = await toPromise(readValue, 5);
    console.log(doubled); // 10
  } catch (err) {
    console.error(err.message);
  }
}`,
    },
  ],
  challenge: {
    functionName: "toPromise",
    prompt: `Write toPromise(fn, ...args) that wraps a call to an error-first
callback-style function fn in a Promise. It should call
fn(...args, callback), where callback is (err, result) => {}. If err is
truthy, the returned Promise must reject with that error. Otherwise it
must resolve with result. fn may call its callback asynchronously.`,
    starterCode: `function toPromise(fn, ...args) {
  // your code here
}`,
    solutionCode: `function toPromise(fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}`,
    testCases: [
      {
        name: "resolves with the callback result",
        args: () => [
          function readValue(value: number, cb: (err: Error | null, result?: number) => void) {
            setTimeout(() => cb(null, value * 2), 0);
          },
          5,
        ],
        expected: 10,
      },
      {
        name: "resolves with a zero result",
        args: () => [
          function readValue(value: number, cb: (err: Error | null, result?: number) => void) {
            setTimeout(() => cb(null, value * 2), 0);
          },
          0,
        ],
        expected: 0,
      },
      {
        name: "rejects with the callback error",
        args: () => [
          function readValue(value: number, cb: (err: Error | null, result?: number) => void) {
            setTimeout(() => {
              if (value < 0) cb(new Error("negative value"));
              else cb(null, value);
            }, 0);
          },
          -1,
        ],
        expectedError: "negative value",
      },
      {
        name: "works with a synchronously-invoked callback",
        args: () => [
          function immediate(value: number, cb: (err: Error | null, result?: number) => void) {
            cb(null, value + 1);
          },
          9,
        ],
        expected: 10,
      },
    ],
  },
};

export default asyncProgramming;
