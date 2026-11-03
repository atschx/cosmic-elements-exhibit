import { useEffect, type ReactNode } from 'react';

import { useExhibit, useExhibitStore } from '@/state/hooks';
import type { DrawerId } from '@/state/exhibitStore';

import './Drawer.css';

interface Props {
  id: DrawerId;
  side: 'left' | 'right';
  label: string;
  children: ReactNode;
}

/** Slide-in container for a side panel on compact screens; Esc or the scrim closes it. */
export function Drawer({ id, side, label, children }: Props) {
  const store = useExhibitStore();
  const open = useExhibit((s) => s.drawer === id);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') store.closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, store]);

  return (
    <div
      id={`drawer-${id}`}
      className={`drawer ${side}${open ? ' open' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label={label}
      aria-hidden={!open}
    >
      {open ? (
        <button
          type="button"
          className="drawer-close"
          aria-label="关闭 · Close"
          onClick={() => store.closeDrawer()}
        >
          ×
        </button>
      ) : null}
      {children}
    </div>
  );
}

export function DrawerScrim() {
  const store = useExhibitStore();
  const open = useExhibit((s) => s.drawer !== null);
  return (
    <button
      type="button"
      className={`drawer-scrim${open ? ' open' : ''}`}
      aria-label="关闭面板 · Close panel"
      tabIndex={open ? 0 : -1}
      aria-hidden={!open}
      onClick={() => store.closeDrawer()}
    />
  );
}
