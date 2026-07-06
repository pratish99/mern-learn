import type { UserDoc } from "@/models/User";

export interface ModuleProgressJSON {
  viewed: boolean;
  attempted: boolean;
  completed: boolean;
}

export interface ProgressJSON {
  modules: Record<string, ModuleProgressJSON>;
  streak: { count: number; lastVisitDate: string | null };
  activeTrack: string;
}

export function toProgressJSON(user: UserDoc): ProgressJSON {
  return {
    modules: Object.fromEntries(user.progress.modules ?? new Map()),
    streak: {
      count: user.progress.streak?.count ?? 0,
      lastVisitDate: user.progress.streak?.lastVisitDate ?? null,
    },
    activeTrack: user.progress.activeTrack ?? "node",
  };
}

export function isModuleProgress(value: unknown): value is ModuleProgressJSON {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.viewed === "boolean" && typeof v.attempted === "boolean" && typeof v.completed === "boolean";
}

export function isProgressPayload(value: unknown): value is ProgressJSON {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.activeTrack !== "string") return false;
  if (typeof v.modules !== "object" || v.modules === null) return false;
  if (!Object.values(v.modules as Record<string, unknown>).every(isModuleProgress)) return false;
  const streak = v.streak as Record<string, unknown> | undefined;
  if (typeof streak !== "object" || streak === null) return false;
  if (typeof streak.count !== "number") return false;
  if (streak.lastVisitDate !== null && typeof streak.lastVisitDate !== "string") return false;
  return true;
}
