"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

function applyTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  window.localStorage.setItem("theme", next);
  listeners.forEach((listener) => listener());
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M7 0.5V2M7 12V13.5M13.5 7H12M2 7H0.5M11.5 2.5L10.5 3.5M3.5 10.5L2.5 11.5M11.5 11.5L10.5 10.5M3.5 3.5L2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M12.5 8.5A5.5 5.5 0 1 1 5.5 1.5a4.3 4.3 0 0 0 7 7Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      onClick={() => applyTheme(theme === "light" ? "dark" : "light")}
      className="text-text-muted hover:bg-surface-hover hover:text-text flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors"
    >
      {theme === "light" ? <MoonIcon /> : <SunIcon />}
      {theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    </button>
  );
}
