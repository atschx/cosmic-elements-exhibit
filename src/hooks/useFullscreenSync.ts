import { useEffect } from 'react';

import { useExhibitStore } from '@/state/hooks';

/** Keeps `state.fullscreen` in step with the browser (F key, Esc, OS gestures). */
export function useFullscreenSync(): void {
  const store = useExhibitStore();
  useEffect(() => {
    const onChange = (): void => {
      store.setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [store]);
}
