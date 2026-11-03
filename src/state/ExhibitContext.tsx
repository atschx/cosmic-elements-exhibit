import type { ReactNode } from 'react';

import { exhibitStore, type ExhibitStore } from './exhibitStore';
import { StoreContext } from './storeContext';

export function ExhibitProvider({
  store = exhibitStore,
  children,
}: {
  store?: ExhibitStore;
  children: ReactNode;
}) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}
