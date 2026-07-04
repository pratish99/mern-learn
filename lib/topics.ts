export interface Topic {
  id: string;
  title: string;
  category: string;
  order: number;
}

export const CATEGORY_ORDER = [
  "Fundamentals",
  "Async & Concurrency",
  "I/O & Networking",
  "Reliability & Tooling",
] as const;

export const TOPICS: Topic[] = [
  { id: "runtime-basics", title: "Node.js runtime basics", category: "Fundamentals", order: 1 },
  { id: "modules-commonjs-esm", title: "Modules (CommonJS vs ESM)", category: "Fundamentals", order: 2 },
  { id: "async-programming", title: "Async programming", category: "Async & Concurrency", order: 3 },
  { id: "event-loop-microtasks", title: "Event loop phases & microtasks", category: "Async & Concurrency", order: 4 },
  { id: "event-emitter", title: "EventEmitter & custom events", category: "Async & Concurrency", order: 5 },
  { id: "streams-buffers", title: "Streams & Buffers", category: "I/O & Networking", order: 6 },
  { id: "file-system", title: "File system (fs/promises)", category: "I/O & Networking", order: 7 },
  { id: "http-server", title: "HTTP module & raw server", category: "I/O & Networking", order: 8 },
  { id: "error-handling", title: "Error handling", category: "Reliability & Tooling", order: 9 },
  { id: "child-processes-workers", title: "Child processes & worker threads", category: "Async & Concurrency", order: 10 },
  { id: "npm-package-semver", title: "npm, package.json, semver", category: "Reliability & Tooling", order: 11 },
  { id: "process-env", title: "process & env vars", category: "Fundamentals", order: 12 },
  { id: "debugging-performance", title: "Debugging & performance basics", category: "Reliability & Tooling", order: 13 },
  { id: "security-basics", title: "Security basics", category: "Reliability & Tooling", order: 14 },
  { id: "testing-basics", title: "Testing basics (node:test)", category: "Reliability & Tooling", order: 15 },
];
