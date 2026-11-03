import { useContext, useSyncExternalStore } from 'react';

import { StoreContext } from './storeContext';
import type { ExhibitState, ExhibitStore } from './exhibitStore';

/** The store itself — for dispatching actions. */
export function useExhibitStore(): ExhibitStore {
  return useContext(StoreContext);
}

/** Subscribe to a slice of state. Keep selectors returning primitives or stable references. */
export function useExhibit<T>(selector: (s: ExhibitState) => T): T {
  const store = useContext(StoreContext);
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}
