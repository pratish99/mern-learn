"use client";

import { useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { cn } from "@/lib/utils";

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

const handleEditorMount: OnMount = (_editor, monaco) => {
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

  async function runCode() {
    setRunning(true);
    setRequestError(null);
    setResult(null);
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
    } catch {
      setRequestError("Could not reach the code runner. Check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border overflow-hidden rounded-lg border">
        <div className="border-border bg-bg-elevated text-text-muted flex items-center justify-between border-b px-4 py-2">
          <span className="font-mono text-xs">editor.js</span>
          <div className="flex items-center gap-2">
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
              onClick={runCode}
              disabled={running}
              className="bg-accent text-bg rounded-md px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {running ? "Running…" : "Run tests"}
            </button>
          </div>
        </div>
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
      </div>

      {requestError && (
        <div className="border-error/40 bg-error-soft text-error rounded-lg border px-4 py-3 text-sm">
          {requestError}
        </div>
      )}

      {result?.compileError && (
        <div className="border-error/40 bg-error-soft text-error rounded-lg border px-4 py-3 font-mono text-sm">
          {result.compileError}
        </div>
      )}

      {result && !result.compileError && (
        <div className="flex flex-col gap-2">
          {result.results.map((r) => (
            <div
              key={r.name}
              className={cn(
                "flex flex-col gap-1 rounded-lg border px-4 py-3 text-sm",
                r.passed
                  ? "border-success/30 bg-success-soft"
                  : "border-error/30 bg-error-soft"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={r.passed ? "text-success" : "text-error"}>
                  {r.passed ? "✓" : "✗"}
                </span>
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
            </div>
          ))}
          <p className="text-text-muted mt-1 text-xs">
            {result.results.filter((r) => r.passed).length} / {result.results.length} tests
            passing
          </p>
        </div>
      )}
    </div>
  );
}
