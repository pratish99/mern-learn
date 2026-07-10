"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

type Theme = "dark" | "light";

function subscribeTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getThemeSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function getServerThemeSnapshot(): Theme {
  return "dark";
}

export default function MermaidDiagram({ chart }: { chart: string }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const renderId = useId().replace(/:/g, "-");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const { default: mermaid } = await import("mermaid");
      const styles = getComputedStyle(document.documentElement);
      const colorVar = (name: string) => styles.getPropertyValue(name).trim();

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        fontFamily: "inherit",
        theme: "base",
        themeVariables: {
          background: colorVar("--color-surface"),
          primaryColor: colorVar("--color-accent-soft"),
          primaryTextColor: colorVar("--color-text"),
          primaryBorderColor: colorVar("--color-accent"),
          secondaryColor: colorVar("--color-surface-hover"),
          secondaryTextColor: colorVar("--color-text"),
          secondaryBorderColor: colorVar("--color-border-strong"),
          tertiaryColor: colorVar("--color-bg-elevated"),
          tertiaryTextColor: colorVar("--color-text"),
          tertiaryBorderColor: colorVar("--color-border"),
          lineColor: colorVar("--color-border-strong"),
          textColor: colorVar("--color-text"),
          mainBkg: colorVar("--color-accent-soft"),
          nodeBorder: colorVar("--color-accent"),
          clusterBkg: colorVar("--color-surface-hover"),
          clusterBorder: colorVar("--color-border-strong"),
          edgeLabelBackground: colorVar("--color-surface"),
          errorBkgColor: colorVar("--color-error-soft"),
          errorTextColor: colorVar("--color-error"),
          actorBkg: colorVar("--color-accent-soft"),
          actorBorder: colorVar("--color-accent"),
          actorTextColor: colorVar("--color-text"),
          signalColor: colorVar("--color-text-muted"),
          signalTextColor: colorVar("--color-text"),
          labelBoxBkgColor: colorVar("--color-surface-hover"),
          labelBoxBorderColor: colorVar("--color-border-strong"),
          labelTextColor: colorVar("--color-text"),
          noteBkgColor: colorVar("--color-warning"),
          noteTextColor: colorVar("--color-bg"),
        },
      });

      try {
        const { svg } = await mermaid.render(`mermaid-${renderId}`, chart);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render diagram");
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [chart, theme, renderId]);

  if (error) {
    return (
      <pre className="border-border bg-surface text-text mb-4 overflow-x-auto rounded-lg border p-4 font-mono text-[13px] leading-6">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className="border-border bg-surface mb-4 flex justify-center overflow-x-auto rounded-lg border p-4 [&_svg]:max-w-full"
    />
  );
}
