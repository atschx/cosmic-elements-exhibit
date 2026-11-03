import { useEffect } from 'react';

import { useExhibit } from '@/state/hooks';
import { activeColor, bodyMode, realmKey } from '@/state/selectors';

/**
 * Mirrors store state onto <html>/<body> so the global CSS can react:
 *   --stage-color (nebula, deck glow, plaque), body[data-axis|data-realm|data-mode], html.present
 */
export function useDocumentSync(): void {
  const color = useExhibit(activeColor);
  const axis = useExhibit((s) => s.axis);
  const realm = useExhibit(realmKey);
  const mode = useExhibit(bodyMode);
  const present = useExhibit((s) => s.present);

  useEffect(() => {
    document.documentElement.style.setProperty('--stage-color', color);
  }, [color]);

  useEffect(() => {
    document.body.dataset.axis = axis;
    document.body.dataset.realm = realm;
    document.body.dataset.mode = mode;
  }, [axis, realm, mode]);

  useEffect(() => {
    document.documentElement.classList.toggle('present', present);
  }, [present]);
}
