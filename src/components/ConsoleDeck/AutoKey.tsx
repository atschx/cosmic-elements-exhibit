import { useEffect, useRef } from 'react';

import { useExhibit, useExhibitStore } from '@/state/hooks';

const CIRC = 87.96;

interface Props {
  onPress: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onEnter: () => void;
}

/** Docent-loop button with a ring countdown; the ring is driven by rAF outside React state. */
export function AutoKey({ onPress, onEnter }: Props) {
  const store = useExhibitStore();
  const auto = useExhibit((s) => s.auto);
  const progRef = useRef<SVGCircleElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const prog = progRef.current;
    const num = numRef.current;
    if (!prog || !num) return;
    if (!auto) {
      prog.style.strokeDashoffset = String(CIRC);
      num.textContent = '▶';
      return;
    }
    let raf = 0;
    const frame = (now: number): void => {
      const s = store.getState();
      if (!s.auto) return;
      const p = Math.min(1, (now - s.autoStart) / s.autoDur);
      prog.style.strokeDashoffset = String(CIRC * (1 - p));
      num.textContent = String(Math.ceil(((1 - p) * s.autoDur) / 1000));
      if (p >= 1) store.autoAdvance(now);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [auto, store]);

  return (
    <button
      type="button"
      className={`key auto${auto ? ' on' : ''}`}
      id="btnAuto"
      title="自动巡航演播 · Docent Loop (Space)"
      aria-pressed={auto}
      onClick={onPress}
      onPointerEnter={onEnter}
    >
      <span className="countdown" aria-hidden="true">
        <svg viewBox="0 0 34 34">
          <circle className="track" cx="17" cy="17" r="14" />
          <circle ref={progRef} className="prog" id="ringProg" cx="17" cy="17" r="14" />
        </svg>
        <span ref={numRef} className="num" id="ringNum">
          ▶
        </span>
      </span>
      <span className="lbl">
        自动巡航<small>Docent Loop</small>
      </span>
    </button>
  );
}
