import { useEffect, useRef } from 'react';

import { useExhibit } from '@/state/hooks';

import { knobRegistry } from '../ConsoleDeck/knobRegistry';
import './PulseLayer.css';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Relay pulse: two SVG rings radiating from the lever knob that was just thrown. */
export function PulseLayer() {
  const ref = useRef<SVGSVGElement>(null);
  const ignition = useExhibit((s) => s.ignition);

  useEffect(() => {
    const layer = ref.current;
    if (!layer || ignition.seq === 0) return;
    const knob = knobRegistry.get(ignition.axis);
    const r = knob?.getBoundingClientRect();
    const cx = r ? r.left + r.width / 2 : window.innerWidth / 2;
    const cy = r ? r.top + r.height / 2 : window.innerHeight;
    const maxR = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
    const circles = [0, 140].map((delay, k) => {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', String(cx));
      c.setAttribute('cy', String(cy));
      c.setAttribute('r', '10');
      c.setAttribute('fill', 'none');
      c.setAttribute('stroke', ignition.color);
      c.style.filter = `drop-shadow(0 0 8px ${ignition.color})`;
      layer.appendChild(c);
      const anim = c.animate(
        [
          { r: 10, opacity: k ? 0.6 : 1, strokeWidth: 3 },
          { r: maxR, opacity: 0, strokeWidth: 1 },
        ],
        { duration: 950, delay, easing: 'cubic-bezier(.1,.7,.2,1)', fill: 'forwards' },
      );
      anim.onfinish = () => c.remove();
      return c;
    });
    return () => {
      for (const c of circles) c.remove();
    };
  }, [ignition]);

  return <svg ref={ref} id="pulseLayer" aria-hidden="true" />;
}
