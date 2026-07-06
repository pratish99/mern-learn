import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Track } from "@/lib/topics";

export interface ModuleProgress {
  viewed: boolean;
  attempted: boolean;
  completed: boolean;
}

interface StreakState {
  count: number;
  lastVisitDate: string | null;
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

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      modules: {},
      streak: { count: 0, lastVisitDate: null },
      activeTrack: "node",

      markViewed: (moduleId) =>
        set((state) =>
          state.modules[moduleId]?.viewed
            ? state
            : { modules: withModule(state.modules, moduleId, { viewed: true }) }
        ),

      markAttempted: (moduleId) =>
        set((state) =>
          state.modules[moduleId]?.attempted
            ? state
            : { modules: withModule(state.modules, moduleId, { attempted: true }) }
        ),

      markCompleted: (moduleId) =>
        set((state) =>
          state.modules[moduleId]?.completed
            ? state
            : { modules: withModule(state.modules, moduleId, { completed: true }) }
        ),

      recordVisit: () => {
        const today = todayKey();
        const { lastVisitDate, count } = get().streak;
        if (lastVisitDate === today) return;

        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const nextCount = lastVisitDate === yesterday ? count + 1 : 1;
        set({ streak: { count: nextCount, lastVisitDate: today } });
      },

      resetProgress: () => set({ modules: {}, streak: { count: 0, lastVisitDate: null } }),

      setActiveTrack: (track) => set({ activeTrack: track }),
    }),
    { name: "node-revision-progress" }
  )
);
