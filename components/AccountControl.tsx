"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useHydrated } from "@/lib/use-hydrated";

export default function AccountControl({ onNavigate }: { onNavigate?: () => void }) {
  const hydrated = useHydrated();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const logout = useAuthStore((s) => s.logout);

  if (!hydrated || status === "loading") {
    return <div className="bg-surface-hover h-8 w-full animate-pulse rounded-md" />;
  }

  if (status === "authenticated" && user) {
    return (
      <div className="flex items-center justify-between gap-2 px-2 py-1 text-sm">
        <span className="text-text-muted truncate" title={user.email}>
          {user.email}
        </span>
        <button
          onClick={() => logout()}
          className="text-text-faint hover:text-text shrink-0 text-xs transition-colors"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-sm">
      <Link href="/login" onClick={onNavigate} className="text-text-muted hover:text-text transition-colors">
        Sign in
      </Link>
      <span className="text-text-faint">·</span>
      <Link href="/signup" onClick={onNavigate} className="text-accent hover:underline">
        Sign up
      </Link>
    </div>
  );
}
