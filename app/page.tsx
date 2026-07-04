import Link from "next/link";
import { CATEGORY_ORDER, TOPICS } from "@/lib/topics";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:px-10">
      <p className="text-accent font-mono text-sm">15 modules</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
        Node.js Concept Revision
      </h1>
      <p className="text-text-muted mt-3 max-w-2xl">
        Short explanations, real code examples, and hands-on challenges to
        sharpen your Node.js fundamentals — event loop, streams, modules,
        error handling, and more.
      </p>

      <div className="mt-10 flex flex-col gap-8">
        {CATEGORY_ORDER.map((category) => {
          const topics = TOPICS.filter((t) => t.category === category).sort(
            (a, b) => a.order - b.order
          );
          if (topics.length === 0) return null;

          return (
            <section key={category}>
              <h2 className="text-text-faint mb-3 text-xs font-semibold tracking-wider uppercase">
                {category}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {topics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/modules/${topic.id}`}
                    className="border-border bg-surface hover:border-border-strong hover:bg-surface-hover group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
                  >
                    <span className="text-text-faint font-mono text-xs">
                      {String(topic.order).padStart(2, "0")}
                    </span>
                    <span className="group-hover:text-accent text-sm font-medium transition-colors">
                      {topic.title}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
