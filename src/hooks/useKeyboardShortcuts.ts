import { useEffect } from 'react';

import { useSound } from '@/audio/useSound';
import { useExhibitStore } from '@/state/hooks';

/**
 * Docent shortcuts: ← → notch · ↑ ↓ switch lever · 1–8 epoch · Space loop · A panorama
 * · P presentation · F fullscreen · M mute · Esc unpin / stop loop · Home / End.
 */
export function useKeyboardShortcuts(): void {
  const store = useExhibitStore();
  const sound = useSound();

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.closest('[role="slider"]') || t.closest('input, textarea')))
        return;
      const s = store.getState();
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          store.next('key');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          store.prev('key');
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          if (!e.repeat) store.toggleAxis('key');
          break;
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          if (!e.repeat) {
            sound.press();
            store.setAuto(!s.auto);
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          sound.press();
          store.toggleFullscreen();
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          store.togglePanorama('key');
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          store.setMuted(!s.muted);
          if (s.muted) sound.press();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          if (!e.repeat) {
            sound.press();
            store.setPresent(!s.present);
          }
          break;
        case 'Escape':
          if (s.drawer !== null) store.closeDrawer();
          else if (s.pinned !== null) store.unpin();
          else if (s.auto) store.setAuto(false);
          break;
        case 'Home':
          e.preventDefault();
          store.first();
          break;
        case 'End':
          e.preventDefault();
          store.last();
          break;
        default:
          if (e.key >= '1' && e.key <= '8' && e.key.length === 1) {
            e.preventDefault();
            store.setStage(Number(e.key) - 1, 'key');
          }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [store, sound]);
}
