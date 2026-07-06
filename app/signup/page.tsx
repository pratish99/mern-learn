"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { runMergeAndSync } from "@/lib/merge-progress";

export default function SignupPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to sign up.");
        return;
      }

      setUser(data.user);
      await runMergeAndSync();
      router.push("/");
    } catch {
      setError("Unable to sign up. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-12 md:px-10">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Sign up</h1>
      <p className="text-text-muted mt-2 text-sm">
        Create an account to sync your progress across devices. Any progress you&apos;ve made on
        this browser will carry over.
      </p>

      <form onSubmit={handleSubmit} className="border-border bg-surface mt-8 flex flex-col gap-4 rounded-lg border px-6 py-8">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-text-muted">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-border bg-bg text-text rounded-md border px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-text-muted">Password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-border bg-bg text-text rounded-md border px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <span className="text-text-faint text-xs">At least 8 characters.</span>
        </label>

        {error && <p className="text-error text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-accent text-bg mt-2 rounded-md px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Signing up…" : "Sign up"}
        </button>
      </form>

      <p className="text-text-faint mt-4 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
