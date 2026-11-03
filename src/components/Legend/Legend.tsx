import { useSound } from '@/audio/useSound';
import { CATEGORIES, ELEMENTS, PANORAMA, categoryCounts, categoryToStage, stageAt } from '@/model';
import { useExhibit, useExhibitStore } from '@/state/hooks';

import './Legend.css';

/** Nucleosynthesis legend: one row per process, click to jump the origin lever to it. */
export function LegendPanel({ className = 'panel legend' }: { className?: string }) {
  const store = useExhibitStore();
  const sound = useSound();
  const axis = useExhibit((s) => s.axis);
  const stage = useExhibit((s) => s.stage);
  const lit = useExhibit((s) => s.lit);

  const activeCat = axis === 'origin' ? stageAt(stage).cat : null;
  const allLit = axis === 'abundance' || stage === PANORAMA;

  return (
    <aside className={className} aria-label="核合成过程图例 Nucleosynthesis legend">
      <p className="etch">
        核合成过程 · <em>Nucleosynthesis</em>
      </p>
      <ul className="legend-list" id="legend">
        {CATEGORIES.map((c) => {
          const total = categoryCounts[c.key];
          const count =
            axis === 'abundance'
              ? `${ELEMENTS.filter((e) => e.originCategory === c.key && lit.has(e.atomicNumber)).length}/${total}`
              : String(total);
          const cls = ['legend-item', activeCat === c.key ? 'active' : '', allLit ? 'lit' : '']
            .filter(Boolean)
            .join(' ');
          return (
            <li key={c.key}>
              <button
                type="button"
                className={cls}
                data-cat={c.key}
                style={{ '--c': c.color } as React.CSSProperties}
                onClick={() => {
                  sound.press();
                  store.setStage(categoryToStage[c.key], 'legend');
                  store.closeDrawer();
                }}
                onPointerEnter={() => sound.tick(0.5)}
                aria-pressed={activeCat === c.key}
              >
                <i className="dot" aria-hidden="true" />
                <div>
                  <span className="zh">{c.nameZh}</span>
                  <span className="en">{c.nameEn}</span>
                </div>
                <span className="count">{count}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="ab-scale" id="abScale">
        <p className="etch">
          丰度标尺 · <em>Abundance scale</em>
        </p>
        <div className="scale-bar" />
        <div className="scale-lbls">
          <span>痕量 trace</span>
          <span>ppb</span>
          <span>ppm</span>
          <span>‰</span>
          <span>主量 major</span>
        </div>
        <p className="scale-hint">
          灯箱亮度 ∝ log 质量分数 · 格内数值为该域质量占比
          <br />
          Glow ∝ log mass fraction · tile shows share by mass
        </p>
      </div>
      <div className="keys">
        <span>
          <kbd>←</kbd>
          <kbd>→</kbd> 推动拉杆 · Move lever
        </span>
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> 来源 / 丰度 · Switch lever
        </span>
        <span>
          <kbd>Space</kbd> 自动巡航 · Docent loop
        </span>
        <span>
          <kbd>A</kbd> 全景全开 · All
        </span>
        <span>
          <kbd>1</kbd>–<kbd>8</kbd> 直达纪元 · Epoch
        </span>
        <span>
          <kbd>F</kbd> 全屏 · Fullscreen
        </span>
        <span>
          <kbd>M</kbd> 静音 · Mute
        </span>
        <span>
          <kbd>P</kbd> 演示模式 · Presentation
        </span>
      </div>
    </aside>
  );
}
