import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProgressState {
  completed: Record<string, boolean>;
  markCompleted: (moduleId: string) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completed: {},
      markCompleted: (moduleId) =>
        set((state) =>
          state.completed[moduleId]
            ? state
            : { completed: { ...state.completed, [moduleId]: true } }
        ),
    }),
    { name: "node-revision-progress" }
  )
);
