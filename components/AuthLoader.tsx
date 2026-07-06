"use client";

import { useEffect } from "react";
import { useAuthStore, type AuthUser } from "@/store/auth-store";

export default function AuthLoader() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { user: AuthUser | null }) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });

    return () => {
      cancelled = true;
    };
  }, [setUser]);

  return null;
}
