import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { ChemicalElement } from '@/data';
import {
  DOMAINS,
  ESSENTIAL,
  STAGES,
  categoryByKey,
  categoryToStage,
  domainAt,
  elementByZ,
  fmtAb,
  lumOf,
  periodGroup,
  supCfg,
} from '@/model';
import { zhDisplay, zhFallbackUsed } from '@/model/glyphs';
import { useIsTouch } from '@/hooks/useMediaQuery';
import { useExhibit, useExhibitStore } from '@/state/hooks';

import { tileRegistry } from '../LightboxWall/tileRegistry';
import './TelemetryHud.css';

const HIDE_DELAY_MS = 90;
const PIN_HINT = '点击格子固定卡片 · Click a tile to pin';
const PINNED_HINT = '已固定 · Pinned — 再次点击或 Esc 关闭 · click again / Esc to close';

/** Park the card just outside the wall (over the side panels) so it never hides other lightboxes. */
function placeHud(hud: HTMLElement, tile: HTMLElement, grid: HTMLElement | null): void {
  const r = tile.getBoundingClientRect();
  const g = grid?.getBoundingClientRect() ?? r;
  const w = hud.offsetWidth || 324;
  const h = hud.offsetHeight || 420;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const fits = (x: number): boolean => x >= 10 && x + w <= vw - 10;
  const nearRight = r.left + r.width / 2 >= g.left + g.width / 2;
  const outsideR = g.right + 14;
  const outsideL = g.left - w - 14;
  const order = nearRight
    ? [outsideR, outsideL, r.right + 14, r.left - w - 14]
    : [outsideL, outsideR, r.left - w - 14, r.right + 14];
  const x = order.find(fits) ?? Math.max(10, Math.min(vw - w - 10, r.left + r.width / 2 - w / 2));
  let y = r.top + r.height / 2 - h / 2;
  y = Math.max(12, Math.min(vh - h - 12, y));
  hud.style.left = `${x}px`;
  hud.style.top = `${y}px`;
}

/** Glass telemetry card: hover = peek, click = pin (desktop); tap = pin as a bottom sheet (touch). */
export function TelemetryHud() {
  const store = useExhibitStore();
  const touch = useIsTouch();
  const pinned = useExhibit((s) => s.pinned);
  const hover = useExhibit((s) => s.hover);
  const axis = useExhibit((s) => s.axis);
  const domain = useExhibit((s) => s.domain);
  const lit = useExhibit((s) => s.lit);
  const present = useExhibit((s) => s.present);
  const hudRef = useRef<HTMLElement>(null);

  const want = pinned ?? (touch ? null : hover);
  // The card keeps showing its last element for a beat after the pointer leaves, so moving
  // between neighbouring tiles doesn't flicker; derived-state-in-render keeps that in sync.
  const [shownZ, setShownZ] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [prevWant, setPrevWant] = useState(want);
  if (want !== prevWant) {
    setPrevWant(want);
    if (want !== null) {
      setShownZ(want);
      setVisible(true);
    }
  }

  useEffect(() => {
    if (want !== null) return;
    const t = setTimeout(() => setVisible(false), HIDE_DELAY_MS);
    return () => clearTimeout(t);
  }, [want]);

  const el: ChemicalElement | undefined = shownZ === null ? undefined : elementByZ.get(shownZ);

  useLayoutEffect(() => {
    const hud = hudRef.current;
    if (!hud || !visible || !el || touch) return;
    const tile = tileRegistry.get(el.atomicNumber);
    if (!tile) return;
    const grid = tileRegistry.getGrid();
    placeHud(hud, tile, grid);
    const onResize = (): void => {
      placeHud(hud, tile, grid);
    };
    window.addEventListener('resize', onResize);
    // panels slide away in presentation mode; follow the tile as the wall re-flows
    const timers = [150, 400, 650].map((ms) => setTimeout(onResize, ms));
    return () => {
      window.removeEventListener('resize', onResize);
      for (const t of timers) clearTimeout(t);
    };
  }, [visible, el, touch, present, axis]);

  // tapping anywhere outside a tile or the card unpins
  useEffect(() => {
    const onDown = (e: PointerEvent): void => {
      if (store.getState().pinned === null) return;
      const t = e.target;
      if (t instanceof Element && (t.closest('.tile') || t.closest('.hud'))) return;
      store.unpin();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [store]);

  const cls = ['hud', visible ? 'show' : '', pinned !== null ? 'pinned' : '', touch ? 'sheet' : '']
    .filter(Boolean)
    .join(' ');

  if (!el) {
    return <aside ref={hudRef} className={cls} id="hud" aria-hidden="true" />;
  }

  const c = categoryByKey[el.originCategory];
  const stage = STAGES[categoryToStage[el.originCategory]];
  const isLit = lit.has(el.atomicNumber);
  const essential = ESSENTIAL.has(el.symbol);

  let status: string;
  let dormant: boolean;
  if (axis === 'abundance' && domain >= 0) {
    const d = domainAt(domain);
    const r = d.rank.get(el.atomicNumber);
    status = r
      ? `● ${d.nameZh}第 ${r} 位 / ${d.list.length} · #${r} of ${d.list.length} in ${d.nameEn}`
      : `○ ${d.nameZh}中未检出 · not detected in ${d.nameEn}`;
    dormant = !r;
  } else {
    status = isLit ? '● 已点亮 · LIT' : '○ 沉睡 · DORMANT';
    dormant = !isLit;
  }

  return (
    <aside
      ref={hudRef}
      className={cls}
      id="hud"
      aria-hidden={!visible}
      role="dialog"
      aria-modal="false"
      aria-label={`${el.nameZh} ${el.nameEn} 遥测卡片 · telemetry card`}
      style={{ '--stage-color': c.color } as React.CSSProperties}
    >
      {touch ? (
        <button
          type="button"
          className="hud-close"
          aria-label="关闭卡片 · Close card"
          onClick={() => store.unpin()}
        >
          ×
        </button>
      ) : null}
      <div className="hud-head">
        <div className="hud-sym" id="hudSym">
          <small id="hudZ">{el.atomicNumber}</small>
          <span id="hudSymTxt">{el.symbol}</span>
        </div>
        <div className="hud-names">
          <div className="zh" id="hudZh">
            {zhDisplay(el)}
          </div>
          <div className="en" id="hudEn">
            {zhFallbackUsed(el)
              ? `${el.nameEn} · 拼音 ${el.pinyin ?? ''}（字形需新版中文字体 · glyph needs a recent CJK font）`
              : el.nameEn}
          </div>
          <div className="hud-chips">
            <span className="hud-chip">
              <i />
              <span id="hudCat">
                {c.nameZh} · {c.nameEn}
              </span>
            </span>
            {essential ? (
              <span className="hud-chip ess" id="hudEss">
                <i />
                生命必需 · Essential
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="hud-grid">
        <div>
          <span className="lbl">原子量 · Atomic mass</span>
          <b id="hudMass">{el.mass}</b>
        </div>
        <div>
          <span className="lbl">周期 / 族 · Period / Group</span>
          <b id="hudPG">{periodGroup(el)}</b>
        </div>
        <div className="wide">
          <span className="lbl">电子排布 · Electron configuration</span>
          <b id="hudCfg" className="mono">
            {supCfg(el.config)}
          </b>
        </div>
        <div className="wide">
          <span className="lbl">核合成过程 · Nucleosynthesis process</span>
          <b id="hudProc">
            {c.processZh} · {c.processEn}
          </b>
        </div>
        <div className="wide">
          <span className="lbl">宇宙时标 · Cosmic epoch</span>
          <b id="hudEpoch">
            {stage ? `${stage.numeral} · ${stage.timeZh} · ${stage.timeEn}` : ''}
          </b>
        </div>
      </div>
      <div className="hud-ab">
        <span className="lbl">六域丰度（质量分数）· Abundance across six realms (by mass)</span>
        <div className="ab-bars" id="hudAbBars">
          {DOMAINS.map((d, i) => {
            const ppm = d.ppm.get(el.atomicNumber);
            const cur = axis === 'abundance' && i === domain;
            const h = ppm ? Math.round(8 + 92 * lumOf(ppm)) : 0;
            return (
              <div
                key={d.key}
                className={`ab${cur ? ' cur' : ''}${ppm ? '' : ' none'}`}
                style={{ '--c': d.color } as React.CSSProperties}
              >
                <div className="col">
                  <i style={{ '--h': `${h}%` } as React.CSSProperties} />
                </div>
                <span>{d.nameZh}</span>
                <small>{ppm ? fmtAb(ppm) : '—'}</small>
              </div>
            );
          })}
        </div>
      </div>
      <p className="hud-nar zh" id="hudNarZh">
        {el.narrativeZh}
      </p>
      <p className="hud-nar en" id="hudNarEn">
        {el.narrativeEn}
      </p>
      <div className="hud-foot">
        <span className={`status${dormant ? ' dormant' : ''}`} id="hudStatus">
          {status}
        </span>
        <em>
          我们由星尘铸成
          <br />
          We are made of starstuff
        </em>
      </div>
      <div className="hud-foot">
        <span className="pin-hint" id="hudPinHint">
          {pinned !== null ? PINNED_HINT : PIN_HINT}
        </span>
        <span className="pin-hint" id="hudStar">
          {c.starZh} {c.starEn}
        </span>
      </div>
    </aside>
  );
}
