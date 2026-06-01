/**
 * Tiny external store factory built on React 18's `useSyncExternalStore`.
 *
 * Why a custom factory instead of Zustand? Per the project principle of
 * PREVENT BLOAT: no new dep, no external surface, and `useSyncExternalStore`
 * is what Zustand itself uses under the hood. The store contract is small
 * and stable, so consumers can write a selector hook on top.
 *
 * Why a `getServerSnapshot`? Next.js renders the provider tree client-only
 * (see `providers/NoSSR`), so the server snapshot is the initial state.
 * Components that mount during SSR will see the initial value; the first
 * client effect will pick up the live state via `getSnapshot`.
 *
 * Why expose `setState` and not just `getState`? Stores also carry action
 * functions, which live on the state object (not as a separate dispatcher).
 * This matches the convention from the previous contexts — components call
 * `store.signInWithGithub()`, not `useDispatch()` — and keeps the consumer
 * surface identical to what they had before.
 */

import { useSyncExternalStore } from "react";

export interface Store<S> {
  getState: () => S;
  setState: (updater: Partial<S> | ((s: S) => Partial<S>)) => void;
  subscribe: (listener: () => void) => () => void;
  getServerSnapshot: () => S;
}

export function createStore<S extends object>(initial: S): Store<S> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    setState: (updater) => {
      const next = typeof updater === "function" ? (updater as (s: S) => Partial<S>)(state) : updater;
      state = { ...state, ...next };
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getServerSnapshot: () => initial,
  };
}

/**
 * Subscribe to a store. Pass a selector to subscribe to a slice and avoid
 * unnecessary re-renders. For actions (which are stable references), pass
 * `s => s.actionName`.
 */
export function useStore<S, T>(store: Store<S>, selector: (s: S) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getServerSnapshot()),
  );
}

/**
 * Hook form of the store object itself. Useful inside components that need
 * raw `getState()` / `setState()` access (e.g. for cross-store calls or
 * imperative actions in effects). Does not subscribe to updates.
 */
export function useStoreApi<S>(store: Store<S>): Store<S> {
  return store;
}
