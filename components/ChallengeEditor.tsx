"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/store/progress-store";
import Spinner from "@/components/Spinner";
import Celebration from "@/components/Celebration";

interface TestCaseResult {
  name: string;
  passed: boolean;
  actual?: unknown;
  expected?: unknown;
  error?: string;
}

interface RunResult {
  ok: boolean;
  compileError?: string;
  results: TestCaseResult[];
}

function formatValue(value: unknown): string {
  if (value === undefined) return "undefined";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const iconVariants = {
  hidden: { scale: 0 },
  visible: { scale: 1, transition: { type: "spring" as const, stiffness: 500, damping: 15 } },
};

export default function ChallengeEditor({
  moduleId,
  starterCode,
}: {
  moduleId: string;
  starterCode: string;
}) {
  const [code, setCode] = useState(starterCode);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [celebrationId, setCelebrationId] = useState<number | null>(null);
  const [solutionCode, setSolutionCode] = useState<string | null>(null);
  const [solutionVisible, setSolutionVisible] = useState(false);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [solutionError, setSolutionError] = useState<string | null>(null);
  const markViewed = useProgressStore((s) => s.markViewed);
  const markAttempted = useProgressStore((s) => s.markAttempted);
  const markCompleted = useProgressStore((s) => s.markCompleted);

  useEffect(() => {
    markViewed(moduleId);
  }, [markViewed, moduleId]);

  useEffect(() => {
    if (!celebrationId) return;
    const timer = setTimeout(() => setCelebrationId(null), 1400);
    return () => clearTimeout(timer);
  }, [celebrationId]);

  async function runCode() {
    if (running) return;
    setRunning(true);
    setRequestError(null);
    setResult(null);
    markAttempted(moduleId);
    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, code }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setRequestError(body?.error ?? `Request failed with status ${res.status}.`);
        return;
      }
      const data: RunResult = await res.json();
      setResult(data);
      if (data.ok) {
        markCompleted(moduleId);
        setCelebrationId(Date.now());
      }
    } catch {
      setRequestError("Could not reach the code runner. Check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  async function toggleSolution() {
    if (solutionVisible) {
      setSolutionVisible(false);
      return;
    }
    if (solutionCode) {
      setSolutionVisible(true);
      return;
    }
    setSolutionLoading(true);
    setSolutionError(null);
    try {
      const res = await fetch("/api/solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSolutionError(body?.error ?? `Request failed with status ${res.status}.`);
        return;
      }
      const data: { solutionCode: string } = await res.json();
      setSolutionCode(data.solutionCode);
      setSolutionVisible(true);
    } catch {
      setSolutionError("Could not fetch the solution. Check your connection and try again.");
    } finally {
      setSolutionLoading(false);
    }
  }

  const runCodeRef = useRef(runCode);
  useEffect(() => {
    runCodeRef.current = runCode;
  });

  const handleEditorMount: OnMount = (editor, monaco) => {
    monaco.editor.defineTheme("node-revision-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#141922",
        "editor.foreground": "#e4e7ee",
        "editorLineNumber.foreground": "#5b6270",
        "editorLineNumber.activeForeground": "#8b93a3",
        "editor.selectionBackground": "#244a5c",
        "editorCursor.foreground": "#5ac8fa",
        "editorGutter.background": "#141922",
      },
    });
    monaco.editor.setTheme("node-revision-dark");
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runCodeRef.current();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border overflow-hidden rounded-lg border">
        <div className="border-border bg-bg-elevated text-text-muted flex items-center justify-between border-b px-4 py-2">
          <span className="font-mono text-xs">editor.js</span>
          <div className="flex items-center gap-3">
            <span className="text-text-faint hidden text-xs sm:inline">Ctrl/Cmd+Enter to run</span>
            <button
              onClick={() => {
                setCode(starterCode);
                setResult(null);
                setRequestError(null);
              }}
              className="text-text-faint hover:text-text text-xs transition-colors"
            >
              Reset
            </button>
            <button
              onClick={toggleSolution}
              disabled={solutionLoading}
              className="text-text-faint hover:text-text text-xs transition-colors disabled:opacity-50"
            >
              {solutionLoading ? "Loading…" : solutionVisible ? "Hide answer" : "Show answer"}
            </button>
            <button
              onClick={runCode}
              disabled={running}
              title="Run tests (Ctrl/Cmd+Enter)"
              className="bg-accent text-bg flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {running && <Spinner />}
              {running ? "Running…" : "Run tests"}
            </button>
          </div>
        </div>
        <div className="relative">
          <Editor
            height="320px"
            language="javascript"
            value={code}
            onChange={(value) => setCode(value ?? "")}
            onMount={handleEditorMount}
            theme="node-revision-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "var(--font-code)",
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
          />
          <AnimatePresence>
            {running && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-bg/40 pointer-events-none absolute inset-0 flex items-start justify-center pt-6"
              >
                <div className="border-border bg-surface flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-lg">
                  <Spinner className="border-text-faint/30 border-t-accent inline-block h-3.5 w-3.5 rounded-full border-2" />
                  Executing in sandbox…
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {solutionVisible && solutionCode && (
          <motion.div
            key="solution"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border-border bg-surface overflow-hidden rounded-lg border"
          >
            <div className="border-border bg-bg-elevated text-text-muted border-b px-4 py-2 text-xs font-medium">
              Actual answer
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6">
              <code>{solutionCode}</code>
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {solutionError && (
        <p className="text-error text-xs">{solutionError}</p>
      )}

      <AnimatePresence mode="wait">
        {requestError && (
          <motion.div
            key="request-error"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border-error/40 bg-error-soft text-error rounded-lg border px-4 py-3 text-sm"
          >
            {requestError}
          </motion.div>
        )}

        {result?.compileError && (
          <motion.div
            key="compile-error"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border-error/40 bg-error-soft text-error rounded-lg border px-4 py-3 font-mono text-sm"
          >
            {result.compileError}
          </motion.div>
        )}
      </AnimatePresence>

      {result && !result.compileError && (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-2"
        >
          {result.results.map((r) => (
            <motion.div
              key={r.name}
              variants={itemVariants}
              className={cn(
                "flex flex-col gap-1 rounded-lg border px-4 py-3 text-sm",
                r.passed
                  ? "border-success/30 bg-success-soft"
                  : "border-error/30 bg-error-soft"
              )}
            >
              <div className="flex items-center gap-2">
                <motion.span
                  variants={iconVariants}
                  aria-hidden="true"
                  className={r.passed ? "text-success" : "text-error"}
                >
                  {r.passed ? "✓" : "✗"}
                </motion.span>
                <span className="sr-only">{r.passed ? "Passed: " : "Failed: "}</span>
                <span className="text-text font-medium">{r.name}</span>
              </div>
              {!r.passed && (
                <div className="text-text-muted font-mono text-xs">
                  {r.error ? (
                    <p>{r.error}</p>
                  ) : (
                    <>
                      <p>expected: {formatValue(r.expected)}</p>
                      <p>actual: {formatValue(r.actual)}</p>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          ))}
          <div className="mt-1 flex items-center gap-3">
            <p className="text-text-muted text-xs">
              {result.results.filter((r) => r.passed).length} / {result.results.length} tests
              passing
            </p>
            <AnimatePresence>
              {celebrationId && <Celebration id={celebrationId} />}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}
