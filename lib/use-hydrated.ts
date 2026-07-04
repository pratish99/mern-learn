import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Avoids SSR/client hydration mismatches for state that reads from localStorage. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
