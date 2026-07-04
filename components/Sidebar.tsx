"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORY_ORDER, TOPICS } from "@/lib/topics";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-6">
      <Link href="/" className="flex items-center gap-2 px-2">
        <span className="text-accent font-mono text-lg font-semibold">{"</>"}</span>
        <span className="font-semibold tracking-tight">Node Revision</span>
      </Link>

      <div className="flex flex-col gap-5">
        {CATEGORY_ORDER.map((category) => {
          const topics = TOPICS.filter((t) => t.category === category).sort(
            (a, b) => a.order - b.order
          );
          if (topics.length === 0) return null;

          return (
            <div key={category} className="flex flex-col gap-1">
              <p className="text-text-faint px-2 text-xs font-semibold tracking-wider uppercase">
                {category}
              </p>
              {topics.map((topic) => {
                const href = `/modules/${topic.id}`;
                const active = pathname === href;
                return (
                  <Link
                    key={topic.id}
                    href={href}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-accent-soft text-accent font-medium"
                        : "text-text-muted hover:bg-surface-hover hover:text-text"
                    )}
                  >
                    <span className="text-text-faint mr-2 font-mono text-xs">
                      {String(topic.order).padStart(2, "0")}
                    </span>
                    {topic.title}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-1 border-t pt-4">
        <Link
          href="/progress"
          className={cn(
            "rounded-md px-2 py-1.5 text-sm transition-colors",
            pathname === "/progress"
              ? "bg-accent-soft text-accent font-medium"
              : "text-text-muted hover:bg-surface-hover hover:text-text"
          )}
        >
          Progress
        </Link>
      </div>
    </nav>
  );
}
