import type { ModuleContent } from "@/lib/types";

const streamsBuffers: ModuleContent = {
  id: "streams-buffers",
  title: "Streams & Buffers",
  category: "I/O & Networking",
  order: 6,
  explanation: `
### The problem streams solve

Imagine you had to move a swimming pool's worth of water from one tank to
another, but you could only carry it one bucket at a time. Now imagine
someone told you: "just pick up the whole pool and pour it in one go."
That's not possible — and it's basically what happens if you try to read
a 4GB file into memory with something like \`fs.readFileSync\`. Your
program tries to hold the *entire* thing at once, and for big enough
files that crashes or grinds everything to a halt.

A **stream** is Node's "bucket at a time" solution: a way to process data
in small pieces (**chunks**) as they arrive, instead of waiting for the
whole thing and holding it all in memory. This is exactly how video
sites let you start watching before the whole file has downloaded — the
player consumes chunks of video as they stream in, rather than waiting
for the entire movie file.

You'll meet streams anywhere data flows in over time: reading large
files, handling HTTP request/response bodies, or piping one command's
output into another.

### The four stream types

Node has four flavors of stream, and the names describe which direction
the data moves:

- **Readable** — a *source* you read data out of, one chunk at a time.
  Examples: \`fs.createReadStream(path)\` (reading a file), or the
  \`req\` object in an HTTP server (the incoming request body). A
  Readable announces new data by emitting a \`"data"\` event for each
  chunk, and an \`"end"\` event when there's no more data coming.
- **Writable** — a *destination* you send data into. Examples:
  \`fs.createWriteStream(path)\` (writing a file), or the \`res\` object in
  an HTTP server (the response you're sending back). You push data in
  with \`.write(chunk)\`, and call \`.end()\` when you're done writing.
- **Duplex** — both a Readable *and* a Writable at the same time, and the
  two sides are independent of each other. A TCP network socket is the
  classic example: you can read incoming bytes and write outgoing bytes
  on the same connection.
- **Transform** — a special Duplex where what comes out is a
  *transformed* version of what went in. \`zlib.createGzip()\` is a
  Transform stream: you write raw bytes in, and compressed bytes come
  out the other side.

### "Emits"? What's that?

Streams are built on Node's **EventEmitter** pattern: instead of
returning a value immediately, they announce things happening over time
by "emitting" named events, and you "listen" for those events with
\`.on("eventName", callback)\`. So \`readable.on("data", chunk => ...)\`
just means "whenever a new chunk of data shows up, run this function."

### Flowing vs. paused mode, and why \`.pipe()\` exists

A Readable stream starts out **paused** — it's holding data back until
someone asks for it. The moment you attach a \`"data"\` listener (or call
\`.pipe()\`, see below), it switches to **flowing** mode, and chunks get
pushed to your callback as fast as the source can produce them.

The most common thing you want to do with a Readable is dump its data
straight into a Writable — for example, read a file and write it
(possibly compressed) to another file. You *could* wire this up manually
with \`"data"\` and \`.write()\` calls, but there's a catch: what if the
destination is slower than the source? Without any coordination, the
fast source keeps shoving chunks at the slow destination, and those
chunks pile up in memory while they wait to be written — the exact
memory-explosion problem streams were supposed to avoid. This pile-up is
called **backpressure**.

\`.pipe(destination)\` is the built-in fix: it connects a Readable
straight to a Writable and automatically pauses the source whenever the
destination can't keep up, then resumes it once the destination has
caught up. You get the "process data as it arrives" benefit without
having to hand-manage the speed mismatch yourself.

\`\`\`js
const fs = require("fs");
const zlib = require("zlib");

fs.createReadStream("big.log")
  .pipe(zlib.createGzip()) // Transform: compresses each chunk
  .pipe(fs.createWriteStream("big.log.gz")); // Writable: saves it to disk
// If the disk write is slow, .pipe() automatically slows the read down
// to match — you never have to think about backpressure yourself.
\`\`\`

\`\`\`mermaid
flowchart LR
  R["Readable stream"] -->|"chunk"| T["Transform stream (e.g. zlib.createGzip)"]
  T -->|"chunk"| W["Writable stream"]
  W -.->|"backpressure: pause"| T
  T -.->|"backpressure: pause"| R
\`\`\`

### Buffer: what a "chunk" actually is

When a chunk of data arrives from a stream, what type is it? By default,
it's a \`Buffer\` — Node's built-in representation of a fixed-length
block of **raw binary data** (just bytes, with no assumption about
whether they represent text, an image, or anything else). Buffers exist
because not everything is text: a JPEG or a network packet is just a
sequence of bytes, and \`Buffer\` is how Node lets you hold and inspect
those bytes directly.

When you *do* know the bytes represent text, you convert a Buffer to a
string by choosing a character encoding (commonly \`"utf8"\`), and you can
go the other direction too:

\`\`\`js
const chunks = [];
readable.on("data", (chunk) => chunks.push(chunk)); // chunk is a Buffer
readable.on("end", () => {
  // Buffer.concat joins all the pieces into one Buffer,
  // then .toString("utf8") reads it as text.
  const all = Buffer.concat(chunks).toString("utf8");
});

Buffer.from("hello"); // the reverse: turn a string into a Buffer
\`\`\`

(Streams can also be put into "object mode," where chunks are plain
strings or objects instead of Buffers — useful for things like parsing
CSV rows — but Buffer chunks are what you'll see by default.)

### Why this matters

Any time you write code that reads a file, handles an HTTP request body,
or pipes data between processes in Node, you're working with streams and
Buffers under the hood. Knowing that \`.pipe()\` handles backpressure for
you — and that a chunk you receive might be a Buffer that needs
\`.toString()\` before you can treat it as text — will save you from both
memory bugs and "why is this printing garbled bytes" bugs.
`.trim(),
  codeExamples: [
    {
      title: "Consuming a Readable manually",
      code: `readable.on("data", (chunk) => {
  console.log("got", chunk.length, "bytes");
});
readable.on("end", () => console.log("done"));
readable.on("error", (err) => console.error(err));`,
    },
    {
      title: "Backpressure-safe piping",
      code: `const fs = require("fs");
fs.createReadStream("big.log")
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream("big.log.gz"));
// .pipe() pauses upstream automatically if the gzip/write side is slower`,
    },
  ],
  challenge: {
    functionName: "collectStream",
    prompt: `Write collectStream(chunks) that builds a Readable stream from the
given array via Readable.from(chunks), then returns a Promise resolving
to a single string containing all the data emitted by that stream,
concatenated in order, once it ends. Each chunk may arrive as a string or
a Buffer — normalize both before concatenating.`,
    starterCode: `function collectStream(chunks) {
  // your code here
}`,
    solutionCode: `function collectStream(chunks) {
  const readable = Readable.from(chunks);
  return new Promise((resolve, reject) => {
    const collected = [];
    readable.on("data", (chunk) => {
      collected.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    readable.on("end", () => resolve(Buffer.concat(collected).toString("utf8")));
    readable.on("error", reject);
  });
}`,
    testCases: [
      {
        name: "concatenates string chunks",
        args: () => [["a", "b", "c"]],
        expected: "abc",
      },
      {
        name: "handles multi-character chunks",
        args: () => [["hello ", "world"]],
        expected: "hello world",
      },
      {
        name: "resolves to an empty string for an empty stream",
        args: () => [[]],
        expected: "",
      },
      {
        name: "handles Buffer chunks",
        args: () => [[Buffer.from("foo"), Buffer.from("bar")]],
        expected: "foobar",
      },
    ],
  },
};

export default streamsBuffers;
