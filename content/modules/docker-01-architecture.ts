import type { ModuleContent } from "@/lib/types";

const dockerArchitecture: ModuleContent = {
  id: "docker-architecture",
  title: "Docker architecture",
  category: "Fundamentals",
  order: 1,
  explanation: `
### The problem: "it works on my machine"

An app's behavior depends on more than its own code — the OS, installed
libraries, environment variables, and even file paths all shape whether
it runs correctly. Copying source code between machines doesn't copy
any of that surrounding context, which is exactly why "it works on my
machine" is such a common bug report. **Docker** packages an app
together with everything it needs to run — code, runtime, system
libraries, config — into a single unit called a **container**, so it
behaves the same on a laptop, a CI runner, and a production server.

### Images vs. containers

Two terms get used constantly and are easy to mix up:

- An **image** is a read-only template: a filesystem snapshot plus
  metadata (what command to run, what ports to expose). It's just
  bytes on disk — nothing is running.
- A **container** is a running (or stopped) instance created *from*
  an image, the same way an object is an instance created from a
  class. You can start many containers from the same image; each gets
  its own writable layer on top of the shared read-only image
  filesystem, so they don't interfere with each other.

\`\`\`js
// Not real code — a mental model, in JS terms:
class Image {} // the template: filesystem + default command
const containerA = new Image(); // a running instance
const containerB = new Image(); // another, independent instance
\`\`\`

### The engine: what actually runs a container

"Docker" is really a stack of cooperating pieces, not one program:

- **Docker CLI** — the \`docker\` command you type. It doesn't run
  containers itself; it sends requests to the daemon.
- **\`dockerd\` (the Docker daemon)** — a background process that
  accepts those requests over a REST API, and manages images,
  networks, and volumes.
- **containerd** — a separate daemon \`dockerd\` delegates the actual
  container lifecycle to (create, start, stop). It's a standalone
  project used by other container tools too, not Docker-specific.
- **runc** — the low-level piece that does the actual OS work: asking
  the Linux kernel to create an isolated process using **namespaces**
  (separate view of processes, network, filesystem) and **cgroups**
  (limits on CPU/memory), then executes the container's command inside
  that isolation.

\`\`\`mermaid
flowchart LR
  CLI["Docker CLI (docker ...)"] -->|"REST API"| Daemon["dockerd (Docker daemon)"]
  Daemon --> Containerd["containerd"]
  Containerd --> Runc["runc"]
  Runc --> C1["Container A"]
  Runc --> C2["Container B"]
  Daemon <-->|"pull / push"| Registry["Registry (e.g. Docker Hub)"]
  Daemon --> Images["Images"]
  Daemon --> Volumes["Volumes"]
  Daemon --> Networks["Networks"]
\`\`\`

Each layer only talks to the one below it — the CLI never touches
runc directly, and \`dockerd\` never manipulates the kernel directly.
That separation is why containerd and runc can be reused by other
tools (like Kubernetes) without depending on the rest of Docker.

### Images are built in layers

A \`Dockerfile\` is a list of instructions, and each instruction that
changes the filesystem produces a new, cached **layer** stacked on top
of the previous one:

\`\`\`
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "server.js"]
\`\`\`

Layers are cached and shared: if only your app's source changes but
\`package.json\` doesn't, Docker reuses the cached \`npm ci\` layer
instead of reinstalling dependencies — which is why \`COPY package*.json\`
+ \`npm ci\` is deliberately placed *before* \`COPY . .\` (copying
everything first would invalidate that cache on every source change).

### Multiple containers: docker-compose and startup order

Real applications are usually more than one container — an API, a
database, a cache — defined together in a \`docker-compose.yml\` file.
Each service can declare \`depends_on\`, and Compose uses that to decide
which containers to start first:

\`\`\`yaml
services:
  db:
    image: postgres
  cache:
    image: redis
  api:
    image: my-api
    depends_on: [db, cache]
  web:
    image: my-web
    depends_on: [api]
\`\`\`

\`\`\`mermaid
flowchart TD
  db["db"] --> api["api"]
  cache["cache"] --> api
  api --> web["web"]
\`\`\`

\`db\` and \`cache\` have no dependencies, so they can start immediately
(and in any order relative to each other); \`api\` must wait for both;
\`web\` must wait for \`api\`. This is exactly the shape of a dependency
graph you've likely seen before — the same problem as resolving task
order from prerequisites, or module load order from imports.

### Why this matters

You don't need a running Docker daemon to reason about *this part* of
it: given a set of services and their dependencies, working out a
valid order to start them in is a well-defined graph problem
(topological sort) — the same logic Compose itself runs before it
launches a single container. That's what the challenge below asks you
to implement directly, over a plain JavaScript object standing in for
a \`depends_on\` graph.
`.trim(),
  codeExamples: [
    {
      title: "A minimal Dockerfile",
      code: `FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]`,
      note: "Each instruction is a cached layer; ordering dependency-install steps before copying the rest of the source keeps the cache useful across rebuilds.",
    },
    {
      title: "Building and running the image",
      code: `docker build -t my-api:latest .
docker run -p 3000:3000 --name my-api-container my-api:latest
// -p 3000:3000 maps host port 3000 to the container's port 3000
// --name gives the running container a human-readable name`,
    },
    {
      title: "A docker-compose.yml with a dependency graph",
      code: `services:
  db:
    image: postgres
  cache:
    image: redis
  api:
    image: my-api
    depends_on: [db, cache]
  web:
    image: my-web
    depends_on: [api]`,
      note: "docker compose up resolves this graph into a startup order before launching any containers.",
    },
  ],
  challenge: {
    functionName: "resolveStartupOrder",
    prompt: `Write resolveStartupOrder(services) that mimics how Docker Compose
orders container startup from a depends_on graph.

"services" is a plain object mapping each service name to an array of
the service names it depends on (its "depends_on" list), e.g.
{ db: [], api: ["db"] }.

Return an array of service names in a valid startup order: every
dependency must appear before the service that depends on it. Visit
services in the order their keys appear in "services", and within a
service's dependency list, visit dependencies in the order they're
listed — this keeps the result deterministic. Each service name must
appear exactly once in the output, even if multiple other services
depend on it.

If a dependency list references a service name that isn't a key in
"services", throw an Error whose message includes "Unknown service".
If the graph has a circular dependency (e.g. a depends on b, which
depends on a), throw an Error whose message includes "Circular
dependency".`,
    starterCode: `function resolveStartupOrder(services) {
  // your code here
}`,
    solutionCode: `function resolveStartupOrder(services) {
  const order = [];
  const state = new Map();

  function visit(name) {
    if (!(name in services)) {
      throw new Error(\`Unknown service: "\${name}"\`);
    }
    const current = state.get(name);
    if (current === "done") return;
    if (current === "visiting") {
      throw new Error(\`Circular dependency detected involving "\${name}"\`);
    }
    state.set(name, "visiting");
    for (const dep of services[name]) {
      visit(dep);
    }
    state.set(name, "done");
    order.push(name);
  }

  for (const name of Object.keys(services)) {
    visit(name);
  }

  return order;
}`,
    testCases: [
      {
        name: "a linear chain starts dependencies first",
        args: () => [{ db: [], api: ["db"], web: ["api"] }],
        expected: ["db", "api", "web"],
      },
      {
        name: "services with no dependencies keep their input order",
        args: () => [{ a: [], b: [], c: [] }],
        expected: ["a", "b", "c"],
      },
      {
        name: "a shared dependency appears once, before all its dependents",
        args: () => [
          { db: [], cache: [], api: ["db", "cache"], web: ["api"] },
        ],
        expected: ["db", "cache", "api", "web"],
      },
      {
        name: "throws when a dependency references an unknown service",
        args: () => [{ web: ["api"] }],
        expectedError: "Unknown service",
      },
      {
        name: "throws on a circular dependency",
        args: () => [{ a: ["b"], b: ["a"] }],
        expectedError: "Circular dependency",
      },
    ],
  },
};

export default dockerArchitecture;
