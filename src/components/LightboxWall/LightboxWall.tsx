import { useCallback } from 'react';

import { useSound } from '@/audio/useSound';
import { ELEMENTS, ESSENTIAL } from '@/model';
import { useExhibit, useExhibitStore } from '@/state/hooks';

import './LightboxWall.css';
import { Tile } from './Tile';
import { tileRegistry } from './tileRegistry';

/** 18 × 7 periodic table + lanthanide / actinide rows, one lightbox per element. */
export function LightboxWall() {
  const store = useExhibitStore();
  const sound = useSound();
  const lit = useExhibit((s) => s.lit);
  const deactivating = useExhibit((s) => s.deactivating);
  const pinned = useExhibit((s) => s.pinned);
  const seq = useExhibit((s) => s.ignition.seq);

  const gridRef = useCallback((node: HTMLDivElement | null) => {
    tileRegistry.setGrid(node);
  }, []);

  const onHoverStart = useCallback(
    (z: number, isLit: boolean) => {
      if (store.getState().hover === z) return;
      sound.tick(isLit ? 0.45 : 0.18, isLit ? 1.15 : 0.7);
      store.setHover(z);
    },
    [store, sound],
  );
  const onHoverEnd = useCallback(
    (z: number) => {
      if (store.getState().hover === z) store.setHover(null);
    },
    [store],
  );
  const onActivate = useCallback(
    (z: number) => {
      sound.press();
      store.togglePin(z);
    },
    [store, sound],
  );

  return (
    <section className="wall" aria-label="元素灯箱矩阵墙 Cosmic lightbox matrix wall">
      <div className="wall-scroll">
        <div
          ref={gridRef}
          className="grid"
          id="grid"
          role="group"
          aria-label="周期表 Periodic table"
        >
          {ELEMENTS.map((el) => {
            const z = el.atomicNumber;
            const entry = lit.get(z);
            return (
              <Tile
                key={z}
                el={el}
                lit={entry !== undefined}
                lum={entry?.lum ?? 1}
                val={entry?.val ?? ''}
                delay={entry?.delay ?? deactivating.get(z) ?? 0}
                pinned={pinned === z}
                essential={ESSENTIAL.has(el.symbol)}
                onActivate={onActivate}
                onHoverStart={onHoverStart}
                onHoverEnd={onHoverEnd}
              />
            );
          })}
          <div className="ph" style={{ gridColumn: 3, gridRow: 6 }} aria-hidden="true">
            <span>57–71</span>
            <span>镧系 Ln</span>
          </div>
          <div className="ph" style={{ gridColumn: 3, gridRow: 7 }} aria-hidden="true">
            <span>89–103</span>
            <span>锕系 An</span>
          </div>
          {seq > 0 ? <i key={seq} className="sweep" aria-hidden="true" /> : null}
        </div>
      </div>
    </section>
  );
}
