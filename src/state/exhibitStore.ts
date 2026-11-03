import { sound, type SoundEngine } from '@/audio/soundEngine';
import {
  DOMAINS,
  PANORAMA,
  STAGES,
  domainAt,
  elementByZ,
  litListForDomain,
  litListForStage,
  stageAt,
  stageColor,
  wrap,
  type LitTarget,
} from '@/model';

export type Axis = 'origin' | 'abundance';
export type ChangeSource =
  | 'boot'
  | 'key'
  | 'drag'
  | 'detent'
  | 'label'
  | 'legend'
  | 'button'
  | 'auto'
  | 'api';
export type DrawerId = 'legend' | 'plaque';

export interface LitTile {
  /** 0–1 luminance (origin axis = 1; abundance axis ∝ log mass fraction). */
  lum: number;
  /** Abundance caption printed on the tile; empty on the origin axis. */
  val: string;
  /** Stagger for the 3D flip, ms. Reset to 0 once the cascade has finished. */
  delay: number;
}

export interface Ignition {
  seq: number;
  axis: Axis;
  color: string;
}

export interface ExhibitState {
  axis: Axis;
  /** Origin lever notch (0…7). */
  stage: number;
  /** Abundance lever notch (0…5); -1 until the lever is first used. */
  domain: number;
  /** Last non-panorama epoch, restored when panorama is toggled off. */
  lastEpoch: number;
  lit: ReadonlyMap<number, LitTile>;
  /** Tiles flipping back to dormant → their stagger delay (ms). */
  deactivating: ReadonlyMap<number, number>;
  /** Animated "LIT" readout. */
  litCount: number;
  ignition: Ignition;
  auto: boolean;
  autoStart: number;
  autoDur: number;
  /** Pinned element's atomic number. */
  pinned: number | null;
  /** Hovered element's atomic number (desktop peek). */
  hover: number | null;
  present: boolean;
  fullscreen: boolean;
  muted: boolean;
  /** Compact-layout side panel currently open. */
  drawer: DrawerId | null;
}

type Listener = () => void;

const CASCADE_STEP_MS = 26;

export interface StoreOptions {
  sound?: SoundEngine;
  now?: () => number;
}

/**
 * Lightweight external store (no dependency): holds the exhibit state and runs the
 * imperative "ignition relay" sequences — staggered cascades, relay sounds, the lit counter.
 * React reads it through `useSyncExternalStore` (see ./hooks.ts).
 */
export class ExhibitStore {
  private state: ExhibitState;
  private listeners = new Set<Listener>();
  private cascadeTimers: ReturnType<typeof setTimeout>[] = [];
  private igniteTimers: ReturnType<typeof setTimeout>[] = [];
  private readonly sound: SoundEngine;
  private readonly now: () => number;

  constructor(opts: StoreOptions = {}) {
    this.sound = opts.sound ?? sound;
    this.now = opts.now ?? (() => performance.now());
    this.state = {
      axis: 'origin',
      stage: 0,
      domain: -1,
      lastEpoch: 0,
      lit: new Map(),
      deactivating: new Map(),
      litCount: 0,
      ignition: { seq: 0, axis: 'origin', color: stageColor(0) },
      auto: false,
      autoStart: 0,
      autoDur: 9000,
      pinned: null,
      hover: null,
      present: false,
      fullscreen: false,
      muted: false,
      drawer: null,
    };
  }

  /* ---------- subscription ---------- */

  getState = (): ExhibitState => this.state;

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  private set(patch: Partial<ExhibitState>): void {
    this.state = { ...this.state, ...patch };
    for (const fn of this.listeners) fn();
  }

  /** Clears every pending timer (HMR / tests). */
  dispose(): void {
    this.clearCascade();
    for (const t of this.igniteTimers) clearTimeout(t);
    this.igniteTimers = [];
    this.sound.stopHum(0.2);
  }

  /* ---------- boot ---------- */

  /** Show notch Ⅰ dormant, then ignite it after a beat (as the museum console powers up). */
  boot(): void {
    this.set({ axis: 'origin', stage: 0 });
    this.igniteTimers.push(
      setTimeout(() => {
        this.setStage(0, 'boot', true);
      }, 350),
    );
  }

  /* ---------- levers ---------- */

  setStage(index: number, source: ChangeSource, force = false): void {
    const i = wrap(index, STAGES.length);
    const s = this.state;
    const changed = force || i !== s.stage || s.axis !== 'origin';
    this.set({
      axis: 'origin',
      stage: i,
      lastEpoch: i === PANORAMA ? s.lastEpoch : i,
      autoStart: s.auto ? this.now() : s.autoStart,
    });
    if (changed) this.ignite(stageColor(i), stageAt(i).hum, 'origin', () => this.cascade(litListForStage(i)));
    else if (source === 'drag') this.sound.press();
  }

  setDomain(index: number, source: ChangeSource): void {
    const i = wrap(index, DOMAINS.length);
    const s = this.state;
    const changed = i !== s.domain || s.axis !== 'abundance';
    this.set({
      axis: 'abundance',
      domain: i,
      autoStart: s.auto ? this.now() : s.autoStart,
    });
    const d = domainAt(i);
    if (changed) this.ignite(d.color, d.hum, 'abundance', () => this.cascade(litListForDomain(i)));
    else if (source === 'drag') this.sound.press();
  }

  next(source: ChangeSource = 'key'): void {
    const s = this.state;
    if (s.axis === 'origin') this.setStage(s.stage + 1, source);
    else this.setDomain(s.domain + 1, source);
  }

  prev(source: ChangeSource = 'key'): void {
    const s = this.state;
    if (s.axis === 'origin') this.setStage(s.stage - 1, source);
    else this.setDomain(s.domain - 1, source);
  }

  first(): void {
    if (this.state.axis === 'origin') this.setStage(0, 'key');
    else this.setDomain(0, 'key');
  }

  last(): void {
    if (this.state.axis === 'origin') this.setStage(PANORAMA, 'key');
    else this.setDomain(DOMAINS.length - 1, 'key');
  }

  togglePanorama(source: ChangeSource = 'key'): void {
    const s = this.state;
    if (s.axis === 'origin' && s.stage === PANORAMA) this.setStage(s.lastEpoch, source);
    else this.setStage(PANORAMA, source);
  }

  toggleAxis(source: ChangeSource = 'key'): void {
    const s = this.state;
    if (s.axis === 'origin') this.setDomain(Math.max(0, s.domain), source);
    else this.setStage(Math.max(0, s.stage), source);
  }

  /* ---------- ignition relay sequence ---------- */

  private ignite(color: string, hum: number, axis: Axis, build: () => void): void {
    for (const t of this.igniteTimers) clearTimeout(t);
    this.igniteTimers = [];
    this.sound.clack();
    this.set({ ignition: { seq: this.state.ignition.seq + 1, axis, color } });
    this.igniteTimers.push(setTimeout(() => this.sound.hum(hum), 180));
    this.igniteTimers.push(setTimeout(build, 160));
  }

  private clearCascade(): void {
    for (const t of this.cascadeTimers) clearTimeout(t);
    this.cascadeTimers = [];
  }

  /** Cascade tiles to the target lit set with staggered 3D flips (index × 26 ms). */
  private cascade(list: LitTarget[]): void {
    this.clearCascade();
    const prev = this.state.lit;
    const target = new Set(list.map((x) => x.z));

    const deactivating = new Map<number, number>();
    [...prev.keys()]
      .filter((z) => !target.has(z))
      .sort((a, b) => b - a)
      .forEach((z, i) => deactivating.set(z, Math.min(i * 6, 420)));

    const lit = new Map<number, LitTile>();
    const soft = list.length > 40 ? 0.55 : 0.9;
    list.forEach((x, index) => {
      lit.set(x.z, { lum: x.lum, val: x.val, delay: index * CASCADE_STEP_MS });
      if (!prev.has(x.z) && (index % 2 === 0 || list.length < 12)) {
        this.cascadeTimers.push(
          setTimeout(() => this.sound.relay(soft), index * CASCADE_STEP_MS + 40),
        );
      }
    });

    this.set({ lit, deactivating, litCount: 0 });

    const total = list.length * CASCADE_STEP_MS + 700;
    this.cascadeTimers.push(
      setTimeout(() => {
        const settled = new Map<number, LitTile>();
        for (const [z, t] of this.state.lit) settled.set(z, { ...t, delay: 0 });
        this.set({ lit: settled, deactivating: new Map() });
      }, total),
    );

    const step = Math.max(1, Math.ceil(list.length / 40));
    let shown = 0;
    const counter = (): void => {
      shown = Math.min(list.length, shown + step);
      this.set({ litCount: shown });
      if (shown < list.length) this.cascadeTimers.push(setTimeout(counter, CASCADE_STEP_MS * step));
    };
    this.cascadeTimers.push(setTimeout(counter, 60));
  }

  /* ---------- docent loop / modes ---------- */

  setAuto(on: boolean): void {
    this.set({ auto: on, autoStart: this.now() });
  }

  /** Called by the loop's rAF when the countdown ring completes. */
  autoAdvance(now: number): void {
    this.next('auto');
    this.set({ autoStart: now });
  }

  setPresent(on: boolean): void {
    this.set({ present: on, drawer: null });
  }

  setMuted(m: boolean): void {
    this.sound.setMuted(m);
    this.set({ muted: m });
  }

  setFullscreen(on: boolean): void {
    this.set({ fullscreen: on });
  }

  toggleFullscreen(): void {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => undefined);
    } else {
      document.exitFullscreen().catch(() => undefined);
    }
  }

  /* ---------- HUD ---------- */

  setHover(z: number | null): void {
    if (this.state.hover !== z) this.set({ hover: z });
  }

  pin(z: number): void {
    if (!elementByZ.has(z)) return;
    this.set({ pinned: z });
  }

  unpin(): void {
    if (this.state.pinned !== null) this.set({ pinned: null });
  }

  togglePin(z: number): void {
    if (this.state.pinned === z) this.unpin();
    else this.pin(z);
  }

  /* ---------- compact-layout drawers ---------- */

  openDrawer(id: DrawerId): void {
    this.set({ drawer: id });
  }

  closeDrawer(): void {
    if (this.state.drawer !== null) this.set({ drawer: null });
  }

  toggleDrawer(id: DrawerId): void {
    this.set({ drawer: this.state.drawer === id ? null : id });
  }
}

/** Default store for the running page. */
export const exhibitStore = new ExhibitStore();
