import { create } from "zustand";
import { setCurrentUserId } from "@/lib/session-bridge";
import { useProgressStore } from "@/store/progress-store";

export interface AuthUser {
  id: string;
  email: string;
}

type AuthStatus = "loading" | "guest" | "authenticated";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: "loading",

  setUser: (user) => {
    setCurrentUserId(user?.id ?? null);
    set({ user, status: user ? "authenticated" : "guest" });
  },

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUserId(null);
    set({ user: null, status: "guest" });
    // Clear the account's progress from memory/localStorage so a fresh guest
    // session on this browser doesn't inherit the logged-out user's data.
    useProgressStore.getState().resetProgress();
  },
}));
