import type { ModuleContent } from "@/lib/types";

const asyncProgramming: ModuleContent = {
  id: "async-programming",
  title: "Async programming",
  category: "Async & Concurrency",
  order: 3,
  explanation: `
Imagine you order food at a counter. You don't stand there frozen,
staring into the kitchen until your order is ready — you take a
number, go sit down, and the staff calls you when it's done. That's
what "async" (asynchronous) code lets Node do: start a slow task (like
reading a file or calling a database) and keep doing other work while
it finishes, instead of freezing everything until it's done.

Node has had three different ways to write "do this, then handle the
result later" code. They all solve the same problem, but each one
fixes a pain point in the one before it. You'll see all three in real
codebases, so it's worth recognizing each style even if you mostly
write the newest one.

### 1. Error-first callbacks (the original way)

A **callback** is just a function you hand to another function, to be
called later when the work is done. Node's oldest convention is the
**error-first callback**: the callback is always the last argument,
and it's always shaped \`(err, result) => {}\`. The rule is simple —
check \`err\` first, every time.

\`\`\`js
fs.readFile("a.txt", "utf8", (err, data) => {
  if (err) return handle(err); // something went wrong — bail out
  use(data); // no error, so "data" is safe to use
});
\`\`\`

Why this eventually became annoying: if you need to do several async
steps in a row (read a file, then use its contents to fetch something,
then save the result), each step nests inside the callback of the
previous one. Code drifts to the right and gets hard to follow —
developers call this "callback hell." There's also no built-in way to
say "wait for these five things at once," and it's easy to accidentally
forget to check \`err\` or call the callback twice.

### 2. Promises (a receipt for a future value)

A **Promise** is an object that represents a value you don't have
yet, but will get eventually — like a receipt for food that's still
being cooked. A Promise is always in one of three states:

- **pending** — still waiting
- **fulfilled** — finished successfully, holding a result
- **rejected** — finished with an error

Once a Promise settles (fulfills or rejects), it stays that way
forever — it can't change state again. You attach \`.then()\` to
handle success and \`.catch()\` to handle failure:

\`\`\`js
readFilePromise("a.txt")
  .then((data) => use(data)) // runs if the promise is fulfilled
  .catch((err) => handle(err)); // runs if the promise is rejected
\`\`\`

This reads better than nested callbacks and lets you chain steps
without drifting rightward. Node even gives you a helper for
converting old-style functions: \`util.promisify(fn)\` takes a
conventional error-first callback function and returns a new version
of it that returns a Promise instead — as long as the original
function follows the \`(...args, cb)\` shape (normal arguments first,
callback last).

### 3. async/await (making it read like normal code)

\`async\`/\`await\` isn't a new mechanism — it's friendlier syntax
built directly on top of Promises. Two rules to remember:

- Any function marked \`async\` automatically returns a Promise.
- Inside an \`async function\`, the \`await\` keyword pauses *that
  function* until the Promise it's waiting on settles. If it
  fulfills, \`await\` hands you the unwrapped value. If it rejects,
  \`await\` throws that error, so you can catch it with a normal
  \`try/catch\` — no \`.then\`/\`.catch\` chains needed.

\`\`\`js
async function main() {
  try {
    const data = await readFilePromise("a.txt"); // pauses here until settled
    use(data);
  } catch (err) {
    handle(err); // catches a rejection, just like a thrown error
  }
}
\`\`\`

Important nuance: \`await\` only pauses the \`async\` function it's
written in — it does **not** freeze the rest of your program. Node's
event loop keeps handling other requests, timers, and callbacks while
that one function is paused.

One safety note: if a Promise rejects and nothing ever handles that
rejection (no \`.catch\`, no \`try/catch\` around the \`await\`), modern
Node treats it as a serious bug and crashes the process. Older Node
versions used to fail silently instead. Either way, the lesson is the
same: always give every awaited Promise a \`try/catch\`, or every
\`.then()\` chain a \`.catch()\`.

### Why this matters

You'll meet all three styles in real code — older libraries still use
error-first callbacks, some APIs return Promises directly, and most
new code you write will use \`async\`/\`await\`. Recognizing the
pattern tells you immediately how to handle errors and how to wait for
the result correctly, which is exactly what the coding challenge below
asks you to do: wrap an error-first callback function so it returns a
Promise you can \`await\`.
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
