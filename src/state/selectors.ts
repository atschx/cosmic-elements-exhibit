import { DOMAINS, PANORAMA, domainAt, stageAt, stageColor } from '@/model';

import type { ExhibitState } from './exhibitStore';

/** Colour of whatever the active lever currently points at — drives `--stage-color`. */
export function activeColor(s: ExhibitState): string {
  return s.axis === 'origin' ? stageColor(s.stage) : domainAt(Math.max(0, s.domain)).color;
}

/** Marquee subtitle for the active notch. Takes only the fields it needs so callers can pass primitives. */
export function activeTag(s: Pick<ExhibitState, 'axis' | 'stage' | 'domain'>): {
  zh: string;
  en: string;
} {
  if (s.axis === 'origin') {
    const st = stageAt(s.stage);
    return { zh: st.tagZh, en: st.tagEn };
  }
  const d = domainAt(Math.max(0, s.domain));
  return { zh: d.tagZh, en: d.tagEn };
}

export type BodyMode = 'epoch' | 'panorama' | 'abundance';

export function bodyMode(s: ExhibitState): BodyMode {
  if (s.axis === 'abundance') return 'abundance';
  return s.stage === PANORAMA ? 'panorama' : 'epoch';
}

/** Realm key for `body[data-realm]`, empty on the origin axis. */
export function realmKey(s: ExhibitState): string {
  return s.axis === 'abundance' && s.domain >= 0 ? (DOMAINS[s.domain]?.key ?? '') : '';
}

export const isPanorama = (s: ExhibitState): boolean => s.axis === 'origin' && s.stage === PANORAMA;
