import { useProgressStore } from "@/store/progress-store";
import type { Track } from "@/lib/topics";
import type { ProgressJSON } from "@/lib/progress-shape";

function waitForHydration(): Promise<void> {
  if (useProgressStore.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = useProgressStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

function applyServerState(serverState: ProgressJSON): void {
  useProgressStore.getState().hydrateFromServer({
    modules: serverState.modules,
    streak: serverState.streak,
    activeTrack: serverState.activeTrack as Track,
  });
}

// Runs once right after a successful login/signup: reconciles any guest-mode
// localStorage progress with the account's server-side progress, then makes the
// server copy the source of truth and clears the now-redundant local copy.
export async function runMergeAndSync(): Promise<void> {
  await waitForHydration();

  const guestState = useProgressStore.getState();
  const hasGuestProgress = Object.keys(guestState.modules).length > 0;

  if (!hasGuestProgress) {
    const res = await fetch("/api/progress");
    if (res.ok) applyServerState(await res.json());
    return;
  }

  const res = await fetch("/api/progress/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      modules: guestState.modules,
      streak: guestState.streak,
      activeTrack: guestState.activeTrack,
    }),
  });

  if (res.ok) {
    applyServerState(await res.json());
    useProgressStore.persist.clearStorage();
  }
}
