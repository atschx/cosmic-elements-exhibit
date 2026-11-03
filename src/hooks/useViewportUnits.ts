import { useEffect } from 'react';

/**
 * Browsers without `100dvh` (or with buggy toolbars) get `--vh` from the visual viewport,
 * so the wall + console always fit the visible area on phones and tablets.
 */
export function useViewportUnits(): void {
  useEffect(() => {
    if (CSS.supports('height', '100dvh')) return;
    const root = document.documentElement;
    const apply = (): void => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty('--vh', `${Math.round(h)}px`);
    };
    apply();
    window.addEventListener('resize', apply);
    window.visualViewport?.addEventListener('resize', apply);
    return () => {
      window.removeEventListener('resize', apply);
      window.visualViewport?.removeEventListener('resize', apply);
    };
  }, []);
}
