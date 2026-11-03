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

/** Tall portrait tablets: enough room to stack legend + plaque under the wall instead of hiding them in drawers. */
export const STACKED_QUERY =
  '(max-width: 1180px) and (min-width: 641px) and (orientation: portrait) and (min-height: 860px)';

export type LayoutMode = 'wide' | 'stacked' | 'compact';

export const useIsCompact = (): boolean => useMediaQuery(COMPACT_QUERY);
export const useIsTouch = (): boolean => useMediaQuery(TOUCH_QUERY);
export const useIsPhone = (): boolean => useMediaQuery(PHONE_QUERY);

/**
 * wide    — side panels flank the wall (desktop, landscape tablets ≥ 1181 px)
 * stacked — panels sit in a row under the wall (portrait tablets)
 * compact — panels live in drawers behind header tabs (landscape tablets, phones)
 */
export function useLayoutMode(): LayoutMode {
  const compact = useMediaQuery(COMPACT_QUERY);
  const stacked = useMediaQuery(STACKED_QUERY);
  if (!compact) return 'wide';
  return stacked ? 'stacked' : 'compact';
}
