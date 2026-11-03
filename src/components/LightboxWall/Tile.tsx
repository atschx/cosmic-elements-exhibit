import { memo, useCallback, type PointerEvent } from 'react';

import type { ChemicalElement } from '@/data';
import { gridRowOf } from '@/model';
import { zhDisplay } from '@/model/glyphs';

import { tileRegistry } from './tileRegistry';

export interface TileProps {
  el: ChemicalElement;
  lit: boolean;
  lum: number;
  val: string;
  /** Flip stagger in ms (lighting or going dormant). */
  delay: number;
  pinned: boolean;
  essential: boolean;
  onActivate: (z: number) => void;
  onHoverStart: (z: number, lit: boolean) => void;
  onHoverEnd: (z: number) => void;
}

/** One acrylic lightbox module: a 3D card with a dormant back face and a glowing front face. */
export const Tile = memo(function Tile({
  el,
  lit,
  lum,
  val,
  delay,
  pinned,
  essential,
  onActivate,
  onHoverStart,
  onHoverEnd,
}: TileProps) {
  const z = el.atomicNumber;
  const ref = useCallback(
    (node: HTMLButtonElement | null) => {
      tileRegistry.set(z, node);
    },
    [z],
  );
  const cls = ['tile', lit ? 'lit' : '', pinned ? 'pinned' : '', essential ? 'essential' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <button
      ref={ref}
      type="button"
      className={cls}
      data-cat={el.originCategory}
      data-z={z}
      style={
        {
          gridColumn: el.gridCol,
          gridRow: gridRowOf(el),
          '--lum': lum.toFixed(3),
        } as React.CSSProperties
      }
      aria-pressed={pinned}
      onClick={() => onActivate(z)}
      onPointerEnter={(e: PointerEvent<HTMLButtonElement>) => {
        if (e.pointerType !== 'touch') onHoverStart(z, lit);
      }}
      onPointerLeave={(e: PointerEvent<HTMLButtonElement>) => {
        if (e.pointerType !== 'touch') onHoverEnd(z);
      }}
    >
      <span className="card" style={{ transitionDelay: `${delay}ms` }}>
        {/* the dormant face is drawn from data attributes so the button's accessible name
            (derived from the lit face: "1 H 氢 Hydrogen [65%]") is not duplicated */}
        <span className="face back" aria-hidden="true">
          <span className="z" data-t={z} />
          <span className="sym" data-t={el.symbol} />
        </span>
        <span className="face front">
          <span className="z">{z}</span>
          <span className="sym">{el.symbol}</span>
          <span className="zh">{zhDisplay(el)}</span>
          <span className="en">{el.nameEn}</span>
          <span className="val">{val}</span>
          <i className="ess" />
        </span>
      </span>
    </button>
  );
});
