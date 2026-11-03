import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  p: number;
  s: number;
}

/** Cheap canvas starfield: 260 twinkling points, throttled to ~30 fps, paused when hidden. */
export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const cx = cv?.getContext('2d');
    if (!cv || !cx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stars: Star[] = Array.from({ length: 260 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.3 + Math.random() * 1.2,
      p: Math.random() * Math.PI * 2,
      s: 0.4 + Math.random() * 1.3,
    }));
    let W = 0;
    let H = 0;
    let dpr = 1;
    const resize = (): void => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.width = Math.floor(window.innerWidth * dpr);
      H = cv.height = Math.floor(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    let last = 0;
    let raf = 0;
    const draw = (t: number): void => {
      if (!document.hidden && t - last > 33) {
        last = t;
        cx.clearRect(0, 0, W, H);
        for (const s of stars) {
          const a = 0.25 + 0.75 * Math.abs(Math.sin(t * 0.0008 * s.s + s.p));
          cx.fillStyle = `rgba(255,255,255,${(a * 0.75).toFixed(3)})`;
          const r = s.r * dpr;
          cx.fillRect(s.x * W - r / 2, s.y * H - r / 2, r, r);
        }
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} id="stars" aria-hidden="true" />;
}

export function Backdrop() {
  return (
    <>
      <Starfield />
      <div className="nebula" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  );
}
