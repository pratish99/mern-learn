"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_ORDER, TOPICS } from "@/lib/topics";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/store/progress-store";
import { useHydrated } from "@/lib/use-hydrated";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <motion.svg
      animate={{ rotate: open ? 90 : 0 }}
      transition={{ duration: 0.15 }}
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className="text-text-faint shrink-0"
    >
      <path
        d="M3 1.5L7 5L3 8.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

function CheckDot() {
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
      className="bg-success text-bg flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
    >
      ✓
    </motion.span>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const modules = useProgressStore((s) => s.modules);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const completedCount = hydrated
    ? Object.values(modules).filter((m) => m.completed).length
    : 0;
  const overallPct = Math.round((completedCount / TOPICS.length) * 100);

  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-6">
      <Link href="/" className="flex items-center gap-2 px-2">
        <span className="text-accent font-mono text-lg font-semibold">{"</>"}</span>
        <span className="font-semibold tracking-tight">Node Revision</span>
      </Link>

      <div className="px-2">
        <div className="text-text-faint mb-1.5 flex items-center justify-between text-xs">
          <span>Overall progress</span>
          <span className="font-mono">{completedCount}/{TOPICS.length}</span>
        </div>
        <div className="bg-border h-1.5 w-full overflow-hidden rounded-full">
          <motion.div
            className="bg-accent h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {CATEGORY_ORDER.map((category) => {
          const topics = TOPICS.filter((t) => t.category === category).sort(
            (a, b) => a.order - b.order
          );
          if (topics.length === 0) return null;

          const isCollapsed = collapsed[category] ?? false;
          const categoryDone = topics.filter((t) => hydrated && modules[t.id]?.completed).length;

          return (
            <div key={category} className="flex flex-col">
              <button
                onClick={() =>
                  setCollapsed((prev) => ({ ...prev, [category]: !isCollapsed }))
                }
                className="text-text-faint hover:text-text-muted flex items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <ChevronIcon open={!isCollapsed} />
                  {category}
                </span>
                <span className="font-mono text-[10px] normal-case">
                  {categoryDone}/{topics.length}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-0.5 pt-0.5 pb-2">
                      {topics.map((topic) => {
                        const href = `/modules/${topic.id}`;
                        const active = pathname === href;
                        return (
                          <Link
                            key={topic.id}
                            href={href}
                            className={cn(
                              "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                              active
                                ? "text-accent font-medium"
                                : "text-text-muted hover:bg-surface-hover hover:text-text"
                            )}
                          >
                            {active && (
                              <motion.span
                                layoutId="sidebar-active-pill"
                                className="bg-accent-soft absolute inset-0 rounded-md"
                                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                              />
                            )}
                            <span className="text-text-faint z-10 font-mono text-xs">
                              {String(topic.order).padStart(2, "0")}
                            </span>
                            <span className="z-10 flex-1">{topic.title}</span>
                            {hydrated && modules[topic.id]?.completed && (
                              <span className="z-10">
                                <CheckDot />
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-1 border-t pt-4">
        <Link
          href="/progress"
          className={cn(
            "relative rounded-md px-2 py-1.5 text-sm transition-colors",
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
