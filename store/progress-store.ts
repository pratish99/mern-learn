import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Track } from "@/lib/topics";
import { getCurrentUserId } from "@/lib/session-bridge";

export interface ModuleProgress {
  viewed: boolean;
  attempted: boolean;
  completed: boolean;
}

interface StreakState {
  count: number;
  lastVisitDate: string | null;
}

interface ServerProgress {
  modules: Record<string, ModuleProgress>;
  streak: StreakState;
  activeTrack: Track;
}

interface ProgressState {
  modules: Record<string, ModuleProgress>;
  streak: StreakState;
  activeTrack: Track;
  markViewed: (moduleId: string) => void;
  markAttempted: (moduleId: string) => void;
  markCompleted: (moduleId: string) => void;
  recordVisit: () => void;
  resetProgress: () => void;
  setActiveTrack: (track: Track) => void;
  hydrateFromServer: (serverState: ServerProgress) => void;
}

const SYNC_DEBOUNCE_MS = 800;
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

// Debounced push to the authenticated user's server progress doc. A quick burst of
// edits (e.g. view + attempt in the same interaction) can still race into overlapping
// PUTs under a slow network — acceptable at this app's write volume, not worth
// building request-cancellation for.
function scheduleSync(state: ServerProgress): void {
  if (!getCurrentUserId()) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    fetch("/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    }).catch(() => {});
  }, SYNC_DEBOUNCE_MS);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function withModule(
  modules: Record<string, ModuleProgress>,
  moduleId: string,
  patch: Partial<ModuleProgress>
): Record<string, ModuleProgress> {
  const existing = modules[moduleId] ?? { viewed: false, attempted: false, completed: false };
  return { ...modules, [moduleId]: { ...existing, ...patch } };
}

function syncSnapshot(state: ProgressState): void {
  scheduleSync({ modules: state.modules, streak: state.streak, activeTrack: state.activeTrack });
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      modules: {},
      streak: { count: 0, lastVisitDate: null },
      activeTrack: "node",

      markViewed: (moduleId) => {
        if (get().modules[moduleId]?.viewed) return;
        set((state) => ({ modules: withModule(state.modules, moduleId, { viewed: true }) }));
        syncSnapshot(get());
      },

      markAttempted: (moduleId) => {
        if (get().modules[moduleId]?.attempted) return;
        set((state) => ({ modules: withModule(state.modules, moduleId, { attempted: true }) }));
        syncSnapshot(get());
      },

      markCompleted: (moduleId) => {
        if (get().modules[moduleId]?.completed) return;
        set((state) => ({ modules: withModule(state.modules, moduleId, { completed: true }) }));
        syncSnapshot(get());
      },

      recordVisit: () => {
        const today = todayKey();
        const { lastVisitDate, count } = get().streak;
        if (lastVisitDate === today) return;

        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const nextCount = lastVisitDate === yesterday ? count + 1 : 1;
        set({ streak: { count: nextCount, lastVisitDate: today } });
        syncSnapshot(get());
      },

      resetProgress: () => {
        set({ modules: {}, streak: { count: 0, lastVisitDate: null } });
        syncSnapshot(get());
      },

      setActiveTrack: (track) => {
        set({ activeTrack: track });
        syncSnapshot(get());
      },

      hydrateFromServer: (serverState) => {
        set({
          modules: serverState.modules,
          streak: serverState.streak,
          activeTrack: serverState.activeTrack,
        });
      },
    }),
    { name: "node-revision-progress" }
  )
);
