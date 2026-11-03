import {
  EPOCH_COUNT,
  PANORAMA,
  categoryCounts,
  domainAt,
  fmtAb,
  pad,
  stageAt,
  stageNameEn,
  stageNameZh,
  stageStar,
} from '@/model';
import { useExhibit } from '@/state/hooks';

import './Plaque.css';

/** Museum plaque for the active notch: index, epoch, narrative, lit readout, starstuff line. */
export function PlaquePanel({ className = 'panel plaque' }: { className?: string }) {
  const axis = useExhibit((s) => s.axis);
  const stage = useExhibit((s) => s.stage);
  const domain = useExhibit((s) => s.domain);
  const litCount = useExhibit((s) => s.litCount);

  if (axis === 'abundance' && domain >= 0) {
    const d = domainAt(domain);
    const top = d.list[0];
    return (
      <aside className={className} aria-live="polite">
        <p className="etch">
          物质域丰度 · <em>Realm Abundance</em>
        </p>
        <div className="idx">
          <span>REALM</span>
          <b>{pad(domain + 1)}</b>
          <small>/ 06</small>
        </div>
        <div className="time">
          {d.unitZh} · {d.unitEn}
        </div>
        <h2>{d.nameZh}</h2>
        <h3>{d.nameEn}</h3>
        <div className="bar">
          <i style={{ width: `${(d.list.length / 118) * 100}%` }} />
        </div>
        <div className="lit-readout">
          <span>检出 · PRESENT</span>
          <b data-testid="plaque-lit">{litCount}</b>
          <span>/ 118</span>
        </div>
        <ol className="top5">
          {d.list.slice(0, 5).map((x) => (
            <li key={x.el.atomicNumber}>
              <b>
                {x.el.symbol}
                <small>{x.el.nameZh}</small>
              </b>
              <i
                style={
                  {
                    '--w': `${top ? Math.max(4, Math.round((100 * x.ppm) / top.ppm)) : 0}%`,
                  } as React.CSSProperties
                }
              />
              <span>{fmtAb(x.ppm)}</span>
            </li>
          ))}
        </ol>
        <div className="nar">
          <p className="zh">{d.narrativeZh}</p>
          <p className="en">{d.narrativeEn}</p>
        </div>
        <p className="starstuff">
          <span className="zh">{d.starZh}</span>
          <span className="en">{d.starEn}</span>
        </p>
      </aside>
    );
  }

  const s = stageAt(stage);
  const panorama = stage === PANORAMA;
  const target = panorama || !s.cat ? 118 : categoryCounts[s.cat];
  const star = stageStar(stage);
  return (
    <aside className={className} aria-live="polite">
      <p className="etch">
        当前纪元 · <em>Current Epoch</em>
      </p>
      <div className="idx">
        <span>EPOCH</span>
        <b>{panorama ? '∞' : pad(stage + 1)}</b>
        <small>{panorama ? '/ ALL' : `/ ${pad(EPOCH_COUNT)}`}</small>
      </div>
      <div className="time">
        {s.timeZh} · {s.timeEn}
      </div>
      <h2>{stageNameZh(stage)}</h2>
      <h3>{stageNameEn(stage)}</h3>
      <div className="bar">
        <i style={{ width: `${(target / 118) * 100}%` }} />
      </div>
      <div className="lit-readout">
        <span>点亮 · LIT</span>
        <b data-testid="plaque-lit">{litCount}</b>
        <span>/ 118</span>
      </div>
      <ol className="top5" />
      <div className="nar">
        <p className="zh">{s.narrativeZh}</p>
        <p className="en">{s.narrativeEn}</p>
      </div>
      <p className="starstuff">
        <span className="zh">{star.zh}</span>
        <span className="en">{star.en}</span>
      </p>
    </aside>
  );
}
