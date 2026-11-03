import { CATEGORIES, DOMAINS, ELEMENTS, STAGES, categoryCounts, fmtAb } from '@/model';
import type { ExhibitState, ExhibitStore } from '@/state/exhibitStore';

/** Small public API for docents and end-to-end tests: `window.CosmicExhibit`. */
export interface CosmicExhibitApi {
  setStage: (i: number) => void;
  setDomain: (i: number) => void;
  toggleAxis: () => void;
  next: () => void;
  prev: () => void;
  togglePanorama: () => void;
  setAuto: (on: boolean) => void;
  setMuted: (m: boolean) => void;
  setPresent: (on: boolean) => void;
  pin: (z: number) => void;
  unpin: () => void;
  readonly state: ExhibitState & { litTiles: number };
  elements: typeof ELEMENTS;
  categories: typeof CATEGORIES;
  stages: typeof STAGES;
  domains: typeof DOMAINS;
  counts: typeof categoryCounts;
  fmtAb: typeof fmtAb;
}

declare global {
  interface Window {
    CosmicExhibit?: CosmicExhibitApi;
  }
}

export function installPublicApi(store: ExhibitStore): () => void {
  const api: CosmicExhibitApi = {
    setStage: (i) => store.setStage(i, 'api'),
    setDomain: (i) => store.setDomain(i, 'api'),
    toggleAxis: () => store.toggleAxis('api'),
    next: () => store.next('api'),
    prev: () => store.prev('api'),
    togglePanorama: () => store.togglePanorama('api'),
    setAuto: (on) => store.setAuto(on),
    setMuted: (m) => store.setMuted(m),
    setPresent: (on) => store.setPresent(on),
    pin: (z) => store.pin(z),
    unpin: () => store.unpin(),
    get state() {
      return { ...store.getState(), litTiles: document.querySelectorAll('.tile.lit').length };
    },
    elements: ELEMENTS,
    categories: CATEGORIES,
    stages: STAGES,
    domains: DOMAINS,
    counts: categoryCounts,
    fmtAb,
  };
  window.CosmicExhibit = api;
  return () => {
    if (window.CosmicExhibit === api) delete window.CosmicExhibit;
  };
}
