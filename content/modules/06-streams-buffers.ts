import type { ModuleContent } from "@/lib/types";

const streamsBuffers: ModuleContent = {
  id: "streams-buffers",
  title: "Streams & Buffers",
  category: "I/O & Networking",
  order: 6,
  explanation: `
Streams let you process data **incrementally** instead of loading it
entirely into memory — essential for large files, network sockets, and
piping data between processes.

### The four stream types

- **Readable** — a source of data (\`fs.createReadStream\`, an HTTP
  request body). Emits \`"data"\` chunks, then \`"end"\`.
- **Writable** — a destination (\`fs.createWriteStream\`, an HTTP
  response). You call \`.write(chunk)\`, then \`.end()\`.
- **Duplex** — both readable and writable, independently (a TCP socket).
- **Transform** — a duplex stream where output is derived from input
  (\`zlib.createGzip()\`, a CSV parser).

### Flowing vs. paused mode

A Readable starts **paused**. Attaching a \`"data"\` listener (or calling
\`.pipe()\`) switches it to **flowing** mode, where chunks are pushed to you
as fast as they arrive. \`.pipe(dest)\` is the idiomatic way to move data
Readable → Writable, and it automatically handles **backpressure**: if
the destination is slower than the source, \`.pipe()\` pauses the source
until the destination catches up, so memory doesn't balloon.

### Buffer

A \`Buffer\` is a fixed-length chunk of raw binary data — Node's way of
handling bytes before/without a text encoding. Stream chunks are
\`Buffer\`s by default (or strings in object mode). Convert with
\`buf.toString("utf8")\` and \`Buffer.from(str)\`.

\`\`\`js
const chunks = [];
readable.on("data", (chunk) => chunks.push(chunk));
readable.on("end", () => {
  const all = Buffer.concat(chunks).toString("utf8");
});
\`\`\`
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
