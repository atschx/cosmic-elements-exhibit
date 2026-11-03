import type { Axis } from '@/state/exhibitStore';

/** Lever knob DOM nodes — the relay pulse radiates from the knob that was just thrown. */
const knobs = new Map<Axis, HTMLElement>();

export const knobRegistry = {
  set(axis: Axis, el: HTMLElement | null): void {
    if (el) knobs.set(axis, el);
    else knobs.delete(axis);
  },
  get(axis: Axis): HTMLElement | undefined {
    return knobs.get(axis);
  },
};
