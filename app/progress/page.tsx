"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CATEGORY_ORDER, TOPICS } from "@/lib/topics";
import { useProgressStore } from "@/store/progress-store";
import { useHydrated } from "@/lib/use-hydrated";
import ProgressRing from "@/components/ProgressRing";

export default function ProgressPage() {
  const hydrated = useHydrated();
  const modules = useProgressStore((s) => s.modules);
  const streak = useProgressStore((s) => s.streak);
  const resetProgress = useProgressStore((s) => s.resetProgress);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const entries = hydrated ? Object.values(modules) : [];
  const completedCount = entries.filter((m) => m.completed).length;
  const attemptedCount = entries.filter((m) => m.attempted).length;
  const overallPct = Math.round((completedCount / TOPICS.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-10">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Your progress</h1>
      <p className="text-text-muted mt-2 text-sm">
        Tracked locally in your browser — nothing leaves your machine.
      </p>

      <div className="border-border bg-surface mt-8 flex flex-col items-center gap-6 rounded-lg border px-6 py-8 sm:flex-row sm:justify-around">
        <ProgressRing percent={hydrated ? overallPct : 0} />
        <div className="flex gap-8 text-center sm:gap-12">
          <div>
            <p className="text-2xl font-semibold tracking-tight">
              {hydrated ? completedCount : 0}
              <span className="text-text-faint text-base font-normal">/{TOPICS.length}</span>
            </p>
            <p className="text-text-faint text-xs tracking-wide uppercase">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight">{hydrated ? attemptedCount : 0}</p>
            <p className="text-text-faint text-xs tracking-wide uppercase">Attempted</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight">{hydrated ? streak.count : 0}</p>
            <p className="text-text-faint text-xs tracking-wide uppercase">Day streak</p>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-5">
        <h2 className="text-text-faint text-xs font-semibold tracking-wider uppercase">
          By category
        </h2>
        {CATEGORY_ORDER.map((category) => {
          const topics = TOPICS.filter((t) => t.category === category);
          const done = hydrated ? topics.filter((t) => modules[t.id]?.completed).length : 0;
          const pct = topics.length > 0 ? Math.round((done / topics.length) * 100) : 0;

          return (
            <div key={category}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-text font-medium">{category}</span>
                <span className="text-text-faint font-mono text-xs">
                  {done}/{topics.length}
                </span>
              </div>
              <div className="bg-border h-2 w-full overflow-hidden rounded-full">
                <motion.div
                  className="bg-accent h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 22 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-border mt-12 flex items-center justify-between border-t pt-6">
        <div>
          <p className="text-text text-sm font-medium">Reset progress</p>
          <p className="text-text-faint text-xs">Clears all completion, attempt, and streak data.</p>
        </div>
        {confirmingReset ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmingReset(false)}
              className="text-text-muted hover:text-text rounded-md px-3 py-1.5 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                resetProgress();
                setConfirmingReset(false);
              }}
              className="bg-error text-bg rounded-md px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
            >
              Confirm reset
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingReset(true)}
            className="border-border text-text-muted hover:text-text hover:border-border-strong rounded-md border px-3 py-1.5 text-xs transition-colors"
          >
            Reset progress
          </button>
        )}
      </div>
    </div>
  );
}
