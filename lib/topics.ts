export type Track = "node" | "javascript";

export interface Topic {
  id: string;
  title: string;
  category: string;
  order: number;
  track: Track;
}

export const TRACKS: { id: Track; label: string }[] = [
  { id: "node", label: "Node.js" },
  { id: "javascript", label: "JavaScript" },
];

export const CATEGORY_ORDER_BY_TRACK: Record<Track, readonly string[]> = {
  node: ["Fundamentals", "Async & Concurrency", "I/O & Networking", "Reliability & Tooling"],
  javascript: [
    "Language Basics",
    "Functions & Scope",
    "Objects & Prototypes",
    "Data Structures & Iteration",
    "Metaprogramming & Patterns",
  ],
};

// Kept for the handful of call sites that don't (yet) need to be track-aware.
export const CATEGORY_ORDER = CATEGORY_ORDER_BY_TRACK.node;

export const TOPICS: Topic[] = [
  { id: "runtime-basics", title: "Node.js runtime basics", category: "Fundamentals", order: 1, track: "node" },
  { id: "modules-commonjs-esm", title: "Modules (CommonJS vs ESM)", category: "Fundamentals", order: 2, track: "node" },
  { id: "async-programming", title: "Async programming", category: "Async & Concurrency", order: 3, track: "node" },
  { id: "event-loop-microtasks", title: "Event loop phases & microtasks", category: "Async & Concurrency", order: 4, track: "node" },
  { id: "event-emitter", title: "EventEmitter & custom events", category: "Async & Concurrency", order: 5, track: "node" },
  { id: "streams-buffers", title: "Streams & Buffers", category: "I/O & Networking", order: 6, track: "node" },
  { id: "file-system", title: "File system (fs/promises)", category: "I/O & Networking", order: 7, track: "node" },
  { id: "http-server", title: "HTTP module & raw server", category: "I/O & Networking", order: 8, track: "node" },
  { id: "error-handling", title: "Error handling", category: "Reliability & Tooling", order: 9, track: "node" },
  { id: "child-processes-workers", title: "Child processes & worker threads", category: "Async & Concurrency", order: 10, track: "node" },
  { id: "npm-package-semver", title: "npm, package.json, semver", category: "Reliability & Tooling", order: 11, track: "node" },
  { id: "process-env", title: "process & env vars", category: "Fundamentals", order: 12, track: "node" },
  { id: "debugging-performance", title: "Debugging & performance basics", category: "Reliability & Tooling", order: 13, track: "node" },
  { id: "security-basics", title: "Security basics", category: "Reliability & Tooling", order: 14, track: "node" },
  { id: "testing-basics", title: "Testing basics (node:test)", category: "Reliability & Tooling", order: 15, track: "node" },

  { id: "js-scope-hoisting", title: "Scope, hoisting & the temporal dead zone", category: "Language Basics", order: 1, track: "javascript" },
  { id: "js-types-coercion", title: "Types & coercion", category: "Language Basics", order: 2, track: "javascript" },
  { id: "js-equality-immutability", title: "Equality & immutability", category: "Language Basics", order: 3, track: "javascript" },
  { id: "js-functions", title: "Functions: declarations, expressions & arrow functions", category: "Functions & Scope", order: 4, track: "javascript" },
  { id: "js-closures", title: "Closures", category: "Functions & Scope", order: 5, track: "javascript" },
  { id: "js-this-binding", title: "this & explicit binding", category: "Functions & Scope", order: 6, track: "javascript" },
  { id: "js-object-descriptors", title: "Objects & property descriptors", category: "Objects & Prototypes", order: 7, track: "javascript" },
  { id: "js-prototypes", title: "Prototypes & prototypal inheritance", category: "Objects & Prototypes", order: 8, track: "javascript" },
  { id: "js-classes", title: "Classes", category: "Objects & Prototypes", order: 9, track: "javascript" },
  { id: "js-destructuring-spread", title: "Destructuring & spread/rest", category: "Data Structures & Iteration", order: 10, track: "javascript" },
  { id: "js-array-iteration", title: "Array & object iteration methods", category: "Data Structures & Iteration", order: 11, track: "javascript" },
  { id: "js-iterators-generators", title: "Iterators & generators", category: "Data Structures & Iteration", order: 12, track: "javascript" },
  { id: "js-symbols", title: "Symbols & well-known symbols", category: "Metaprogramming & Patterns", order: 13, track: "javascript" },
  { id: "js-regex-basics", title: "Regular expressions basics", category: "Metaprogramming & Patterns", order: 14, track: "javascript" },
  { id: "js-proxy-reflect", title: "Proxy & Reflect", category: "Metaprogramming & Patterns", order: 15, track: "javascript" },
];
