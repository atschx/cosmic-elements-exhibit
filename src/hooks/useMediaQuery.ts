import { useSyncExternalStore } from 'react';

/** Reactive `matchMedia` — re-renders when the query flips (orientation, resize, input type). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === 'undefined') return () => undefined;
      const mql = window.matchMedia(query);
      mql.addEventListener('change', notify);
      return () => mql.removeEventListener('change', notify);
    },
    () => (typeof window === 'undefined' ? false : window.matchMedia(query).matches),
    () => false,
  );
}

/** Compact layout: side panels become drawers (matches the ≤1180 px CSS tier). */
export const COMPACT_QUERY = '(max-width: 1180px)';
/** Touch-first devices: no hover, coarse pointer → tap-to-pin HUD as a bottom sheet. */
export const TOUCH_QUERY = '(hover: none) and (pointer: coarse)';
/** Phone-sized portrait screens: rails stack and the wall scrolls horizontally. */
export const PHONE_QUERY = '(max-width: 640px)';

export const useIsCompact = (): boolean => useMediaQuery(COMPACT_QUERY);
export const useIsTouch = (): boolean => useMediaQuery(TOUCH_QUERY);
export const useIsPhone = (): boolean => useMediaQuery(PHONE_QUERY);
