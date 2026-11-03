import { useEffect } from 'react';

const REDUCE = '(prefers-reduced-motion: reduce)';

/**
 * Scroll choreography for the landing page:
 *   • every `[data-reveal]` element fades / rises in once it enters the viewport
 *   • every `[data-accent]` section recolours `--stage-color` on <html> while it dominates the viewport,
 *     so the nebula, CTA glow and quotes follow the story
 * Both are skipped under prefers-reduced-motion (elements are simply shown).
 */
export function useReveal(): void {
  useEffect(() => {
    const reduce = window.matchMedia(REDUCE).matches;
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (reduce || !('IntersectionObserver' in window)) {
      for (const el of targets) el.classList.add('in');
      return;
    }
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('in');
          reveal.unobserve(e.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    for (const el of targets) reveal.observe(el);

    const root = document.documentElement;
    const accents = Array.from(document.querySelectorAll<HTMLElement>('[data-accent]'));
    const tint = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const key = (e.target as HTMLElement).dataset.accent;
          if (key) root.style.setProperty('--stage-color', `var(--c-${key})`);
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    for (const el of accents) tint.observe(el);

    return () => {
      reveal.disconnect();
      tint.disconnect();
      root.style.removeProperty('--stage-color');
    };
  }, []);
}

/** Gentle parallax on one element (translateY = scroll × factor), off under reduced motion. */
export function useParallax(ref: React.RefObject<HTMLElement | null>, factor: number): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia(REDUCE).matches) return;
    let raf = 0;
    const update = (): void => {
      raf = 0;
      el.style.transform = `translate3d(0, ${(window.scrollY * factor).toFixed(1)}px, 0)`;
    };
    const onScroll = (): void => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
      el.style.transform = '';
    };
  }, [ref, factor]);
}
