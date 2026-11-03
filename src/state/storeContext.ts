import { createContext } from 'react';

import { exhibitStore, type ExhibitStore } from './exhibitStore';

export const StoreContext = createContext<ExhibitStore>(exhibitStore);
