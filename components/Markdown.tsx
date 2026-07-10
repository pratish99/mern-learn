import type { ReactElement } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import MermaidDiagram from "./MermaidDiagram";

const components: Components = {
  h2: ({ children }) => (
    <h2 className="text-text mt-8 mb-3 text-lg font-semibold tracking-tight first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-text mt-6 mb-2 text-base font-semibold tracking-tight">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-text-muted mb-4 text-[15px] leading-7">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="text-text-muted mb-4 list-disc space-y-1.5 pl-5 text-[15px] leading-7">
      {children}
    </ul>
  ),
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => (
    <strong className="text-text font-semibold">{children}</strong>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline underline-offset-2"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="bg-surface border-border text-accent rounded border px-1.5 py-0.5 font-mono text-[13px]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => {
    const codeChild = children as ReactElement<{
      className?: string;
      children?: string;
    }>;
    const className = codeChild?.props?.className ?? "";
    if (className.includes("language-mermaid")) {
      const chart = String(codeChild.props.children ?? "").replace(/\n$/, "");
      return <MermaidDiagram chart={chart} />;
    }
    return (
      <pre className="border-border bg-surface text-text mb-4 overflow-x-auto rounded-lg border p-4 font-mono text-[13px] leading-6">
        {children}
      </pre>
    );
  },
};

export default function Markdown({ content }: { content: string }) {
  return (
    <div>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
