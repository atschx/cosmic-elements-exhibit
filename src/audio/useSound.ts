import { useEffect } from 'react';

import { installUnlock, sound, type SoundEngine } from './soundEngine';

/** Installs the first-gesture unlock once and hands back the shared engine. */
export function useSound(): SoundEngine {
  useEffect(() => installUnlock(), []);
  return sound;
}
