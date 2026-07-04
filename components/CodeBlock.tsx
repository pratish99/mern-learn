import type { CodeExample } from "@/lib/types";

export default function CodeBlock({ example }: { example: CodeExample }) {
  return (
    <div className="border-border bg-surface overflow-hidden rounded-lg border">
      <div className="border-border bg-bg-elevated text-text-muted border-b px-4 py-2 text-xs font-medium">
        {example.title}
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6">
        <code>{example.code}</code>
      </pre>
      {example.note && (
        <div className="border-border text-text-faint border-t px-4 py-2 text-xs">
          {example.note}
        </div>
      )}
    </div>
  );
}
