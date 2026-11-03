import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

import { useSound } from '@/audio/useSound';
import type { Axis, ChangeSource } from '@/state/exhibitStore';

import './LeverRail.css';
import { knobRegistry } from './knobRegistry';

export interface RailStop {
  color: string;
  numeral: string;
  zh: string;
  en: string;
  readout: string;
}

interface Props {
  axis: Axis;
  id: string;
  labelZh: string;
  labelEn: string;
  ariaLabel: string;
  stops: readonly RailStop[];
  /** Committed notch. */
  index: number;
  active: boolean;
  /** Tick pitch multiplier so the two levers sound different. */
  pitch: number;
  onCommit: (index: number, source: ChangeSource) => void;
  /** Extra decoration under the tick labels (the "Supernova explosion" bracket). */
  children?: ReactNode;
}

const pct = (i: number, n: number): number => (i / (n - 1)) * 100;

/**
 * Mechanical lever: a groove with detents, a draggable knob and tick labels.
 * Pointer drag previews detents (with ticks and haptics) and commits on release;
 * detents and labels are also tap/click targets; arrow keys work when the rail is focused.
 */
export function LeverRail({
  axis,
  id,
  labelZh,
  labelEn,
  ariaLabel,
  stops,
  index,
  active,
  pitch,
  onCommit,
  children,
}: Props) {
  const sound = useSound();
  const railRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragFrac, setDragFrac] = useState<number | null>(null);
  const lastDetent = useRef(-1);
  const n = stops.length;

  const knobRef = useCallback(
    (el: HTMLDivElement | null) => {
      knobRegistry.set(axis, el);
    },
    [axis],
  );

  const fracOf = (clientX: number): number => {
    const r = railRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };

  const previewIndex = dragFrac === null ? index : Math.round(dragFrac * (n - 1));
  const knobFrac = dragFrac ?? index / (n - 1);
  const readout = stops[previewIndex]?.readout ?? '';

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('.detent')) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const rail = railRef.current;
    if (!rail) return;
    rail.setPointerCapture(e.pointerId);
    setDragging(true);
    lastDetent.current = index;
    sound.tick(0.8, pitch * 0.8);
    move(e.clientX);
  };
  const move = (clientX: number) => {
    const f = fracOf(clientX);
    setDragFrac(f);
    const d = Math.round(f * (n - 1));
    if (d !== lastDetent.current) {
      lastDetent.current = d;
      sound.tick(1, pitch + d * 0.04);
      if ('vibrate' in navigator) navigator.vibrate(6);
    }
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    move(e.clientX);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    setDragFrac(null);
    try {
      railRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    onCommit(Math.round(fracOf(e.clientX) * (n - 1)), 'drag');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let target: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') target = Math.min(n - 1, index + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') target = Math.max(0, index - 1);
    else if (e.key === 'Home') target = 0;
    else if (e.key === 'End') target = n - 1;
    if (target === null) return;
    e.preventDefault();
    e.stopPropagation();
    onCommit(target, 'key');
  };

  const current = stops[previewIndex];

  return (
    <div className={`rail-block${active ? ' active' : ''}`} id={id} data-axis={axis}>
      <div className="rail-label">
        <span>
          <b>{labelZh}</b>
          {labelEn}
        </span>
        <em className="readout">{readout}</em>
      </div>
      <div
        ref={railRef}
        className={`rail${dragging ? ' dragging' : ''}`}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={n - 1}
        aria-valuenow={previewIndex}
        aria-valuetext={current ? `${current.zh} ${current.en}` : undefined}
        aria-orientation="horizontal"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <div
          className="groove"
          style={{ '--fill': `calc(${knobFrac * 100}% - 6px)` } as React.CSSProperties}
        />
        <div className="detents">
          {stops.map((s, i) => (
            <button
              key={s.zh}
              type="button"
              className={`detent${i === previewIndex ? ' active' : i < previewIndex ? ' passed' : ''}`}
              style={{ left: `${pct(i, n)}%`, '--c': s.color } as React.CSSProperties}
              title={`${s.zh} · ${s.en}`}
              aria-label={`${s.zh} · ${s.en}`}
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                sound.press();
                onCommit(i, 'detent');
              }}
              onPointerEnter={() => sound.tick(0.6, pitch)}
            />
          ))}
        </div>
        <div ref={knobRef} className="knob" style={{ left: `${knobFrac * 100}%` }} data-knob={axis}>
          <div className="knob-cap" />
        </div>
      </div>
      <div className="rail-ticks">
        {stops.map((s, i) => (
          <button
            key={s.zh}
            type="button"
            className={`tick-lbl${i === previewIndex ? ' active' : ''}`}
            style={{ left: `${pct(i, n)}%`, '--c': s.color } as React.CSSProperties}
            tabIndex={-1}
            onClick={() => {
              sound.press();
              onCommit(i, 'label');
            }}
            onPointerEnter={() => sound.tick(0.4, pitch)}
          >
            <b>{s.numeral}</b>
            {s.zh}
            <span className="en">{s.en}</span>
          </button>
        ))}
        {children}
      </div>
    </div>
  );
}
