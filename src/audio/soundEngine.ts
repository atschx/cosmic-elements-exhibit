/**
 * Procedural Web Audio engine — relay clacks, detent ticks, sub-bass hum.
 * Zero assets: every sound is synthesised from oscillators and a one-second noise buffer.
 * The AudioContext is created & resumed only after the first user gesture (see `installUnlock`).
 */

interface BurstOpts {
  freq?: number;
  q?: number;
  gain?: number;
  dur?: number;
  type?: BiquadFilterType;
}

interface ToneOpts {
  f0?: number;
  f1?: number | null;
  type?: OscillatorType;
  gain?: number;
  a?: number;
  dur?: number;
}

interface HumVoice {
  env: GainNode;
  oscs: OscillatorNode[];
}

type AudioContextCtor = typeof AudioContext;

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private humVoices: HumVoice[] = [];
  private unlocked = false;
  private _muted = false;

  get muted(): boolean {
    return this._muted;
  }

  /** Create (once) and resume the context. Safe to call on every gesture. */
  unlock(): void {
    const AC = audioContextCtor();
    if (!AC) return;
    if (!this.ctx) {
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = this._muted ? 0 : 0.7;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 20;
      comp.ratio.value = 6;
      comp.attack.value = 0.003;
      comp.release.value = 0.2;
      master.connect(comp).connect(ctx.destination);
      const len = ctx.sampleRate;
      const noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.ctx = ctx;
      this.master = master;
      this.noise = noise;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => undefined);
    this.unlocked = true;
  }

  private live(): { ctx: AudioContext; master: GainNode; noise: AudioBuffer } | null {
    if (!this.unlocked || !this.ctx || !this.master || !this.noise || this._muted) return null;
    if (this.ctx.state === 'closed') return null;
    return { ctx: this.ctx, master: this.master, noise: this.noise };
  }

  setMuted(m: boolean): void {
    this._muted = m;
    if (this.master && this.ctx)
      this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.02);
  }

  private burst(
    t: number,
    { freq = 1800, q = 1.2, gain = 0.6, dur = 0.06, type = 'bandpass' }: BurstOpts = {},
  ): void {
    const a = this.live();
    if (!a) return;
    const src = a.ctx.createBufferSource();
    src.buffer = a.noise;
    src.loop = true;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = a.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(a.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private tone(
    t: number,
    { f0 = 440, f1 = null, type = 'sine', gain = 0.2, a = 0.004, dur = 0.08 }: ToneOpts = {},
  ): void {
    const au = this.live();
    if (!au) return;
    const o = au.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = au.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(au.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /** Relay "Clack": metallic snap + body thud. */
  clack(strength = 1): void {
    const a = this.live();
    if (!a) return;
    const t = a.ctx.currentTime + 0.001;
    this.burst(t, { freq: 2600 + Math.random() * 600, q: 1.1, gain: 0.55 * strength, dur: 0.035 });
    this.burst(t + 0.012, { freq: 900, q: 0.8, gain: 0.35 * strength, dur: 0.07, type: 'lowpass' });
    this.tone(t + 0.008, { f0: 210, f1: 58, type: 'sine', gain: 0.5 * strength, dur: 0.11 });
    this.tone(t + 0.03, { f0: 3400, type: 'square', gain: 0.03 * strength, dur: 0.02 });
  }

  /** Detent / hover "Tick". */
  tick(vol = 1, pitch = 1): void {
    const a = this.live();
    if (!a) return;
    const t = a.ctx.currentTime + 0.001;
    const base = (2900 + Math.random() * 900) * pitch;
    this.tone(t, { f0: base, f1: base * 0.7, type: 'triangle', gain: 0.085 * vol, dur: 0.028 });
    this.burst(t, { freq: 5200, q: 2, gain: 0.07 * vol, dur: 0.018, type: 'highpass' });
  }

  /** Relay-wall cascade click (randomised). */
  relay(vol = 1): void {
    const a = this.live();
    if (!a) return;
    const t = a.ctx.currentTime + 0.001;
    this.burst(t, {
      freq: 1500 + Math.random() * 1800,
      q: 1.4,
      gain: 0.16 * vol,
      dur: 0.022 + Math.random() * 0.012,
    });
    this.tone(t, {
      f0: 420 + Math.random() * 260,
      f1: 90,
      type: 'sine',
      gain: 0.09 * vol,
      dur: 0.045,
    });
  }

  /** Button press: lighter clack. */
  press(): void {
    this.clack(0.55);
  }

  /** Low-frequency "gravity field" power-up hum. */
  hum(freq: number): void {
    const a = this.live();
    if (!a) return;
    this.stopHum(0.6);
    const { ctx, master } = a;
    const t = ctx.currentTime;
    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(freq * 0.5, t);
    o1.frequency.exponentialRampToValueAtTime(freq, t + 1.3);
    const o2 = ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(freq * 1.5, t);
    o2.frequency.exponentialRampToValueAtTime(freq * 2.01, t + 1.3);
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 6.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.08;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(140, t);
    lp.frequency.exponentialRampToValueAtTime(420, t + 1.2);
    lp.frequency.exponentialRampToValueAtTime(120, t + 4.2);
    const g1 = ctx.createGain();
    g1.gain.value = 0.42;
    const g2 = ctx.createGain();
    g2.gain.value = 0.07;
    const tremolo = ctx.createGain();
    tremolo.gain.value = 1;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.02, t);
    env.gain.exponentialRampToValueAtTime(0.6, t + 1.4);
    env.gain.setValueAtTime(0.6, t + 2.4);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 5.2);
    lfo.connect(lfoGain).connect(tremolo.gain);
    o1.connect(g1).connect(lp);
    o2.connect(g2).connect(lp);
    lp.connect(tremolo).connect(env).connect(master);
    o1.start(t);
    o2.start(t);
    lfo.start(t);
    const stopAt = t + 5.4;
    o1.stop(stopAt);
    o2.stop(stopAt);
    lfo.stop(stopAt);
    this.humVoices = [{ env, oscs: [o1, o2, lfo] }];
  }

  stopHum(fade = 0.4): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const { env, oscs } of this.humVoices) {
      try {
        env.gain.cancelScheduledValues(t);
        env.gain.setValueAtTime(Math.max(env.gain.value, 0.0001), t);
        env.gain.exponentialRampToValueAtTime(0.0001, t + fade);
        for (const o of oscs) o.stop(t + fade + 0.05);
      } catch {
        /* node already stopped */
      }
    }
    this.humVoices = [];
  }
}

/** Shared engine instance; one AudioContext per page. */
export const sound = new SoundEngine();

/** Resume/create the AudioContext on the first gesture; returns a disposer. */
export function installUnlock(target: Window = window): () => void {
  const unlock = (): void => {
    sound.unlock();
  };
  const events = ['pointerdown', 'keydown', 'touchstart'] as const;
  for (const ev of events) target.addEventListener(ev, unlock, { passive: true });
  return () => {
    for (const ev of events) target.removeEventListener(ev, unlock);
  };
}
