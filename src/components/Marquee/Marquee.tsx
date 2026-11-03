import { useSound } from '@/audio/useSound';
import { useExhibit, useExhibitStore } from '@/state/hooks';
import { activeTag } from '@/state/selectors';

import './Marquee.css';
import { Subtitle } from './Subtitle';

function ObservatoryIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M6 30a18 18 0 0 1 36 0" />
      <path d="M4 30h40" />
      <path d="M14 30v8h20v-8" />
      <path d="M24 12v-5" />
      <circle cx="24" cy="5" r="1.6" fill="currentColor" />
      <path d="M10 22l3-1M38 22l-3-1M24 14l0 3" strokeLinecap="round" />
    </svg>
  );
}

export function Marquee() {
  const store = useExhibitStore();
  const sound = useSound();
  const axis = useExhibit((s) => s.axis);
  const stage = useExhibit((s) => s.stage);
  const domain = useExhibit((s) => s.domain);
  const tag = activeTag({ axis, stage, domain });
  const present = useExhibit((s) => s.present);
  const muted = useExhibit((s) => s.muted);
  const drawer = useExhibit((s) => s.drawer);

  const press = (fn: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    sound.press();
    fn();
    e.currentTarget.blur();
  };
  const tick = () => sound.tick(0.5);

  return (
    <header className="marquee">
      <div className="badge">
        <ObservatoryIcon />
        <div>
          <b>上海天文馆</b>
          <span>Shanghai Astronomy Museum</span>
        </div>
        <button
          type="button"
          className={`toggle drawer-tab${drawer === 'legend' ? ' on' : ''}`}
          onClick={press(() => store.toggleDrawer('legend'))}
          aria-pressed={drawer === 'legend'}
          aria-controls="drawer-legend"
          aria-label="核合成过程图例 · Legend"
          title="核合成过程图例 · Legend"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="5" height="5" rx="1" />
            <rect x="3" y="14" width="5" height="5" rx="1" />
            <path d="M11 6.5h10M11 16.5h10" />
          </svg>
          <span className="lbl">
            <span className="zh">图例</span>
            <span className="en">Legend</span>
          </span>
        </button>
      </div>

      <div className="title">
        <h1>
          <span className="venue">上海天文馆 · </span>宇宙元素起源表<span className="sep">|</span>
          <span className="en">Shanghai Astronomy Museum: Cosmic Nucleosynthesis</span>
        </h1>
        <Subtitle zh={tag.zh} en={tag.en} />
      </div>

      <div className="top-controls">
        <button
          type="button"
          className={`toggle drawer-tab${drawer === 'plaque' ? ' on' : ''}`}
          onClick={press(() => store.toggleDrawer('plaque'))}
          aria-pressed={drawer === 'plaque'}
          aria-controls="drawer-plaque"
          aria-label="当前纪元铭牌 · Plaque"
          title="当前纪元铭牌 · Plaque"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M7 10h10M7 14h6" />
          </svg>
          <span className="lbl">
            <span className="zh">铭牌</span>
            <span className="en">Plaque</span>
          </span>
        </button>
        <button
          type="button"
          className={`toggle${present ? ' on' : ''}`}
          id="btnPresent"
          title="演示模式 · Presentation mode (P)"
          aria-pressed={present}
          onClick={press(() => store.setPresent(!present))}
          onPointerEnter={tick}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M8 20h8M12 16v4" />
            <path d="M10 8l4 2-4 2z" fill="currentColor" stroke="none" />
          </svg>
          <kbd>P</kbd>
          <span className="lbl">
            <span className="zh">演示模式</span>
            <span className="en">Present</span>
          </span>
          <i className={`led${present ? ' on' : ''}`} id="ledPresent" />
        </button>
        <button
          type="button"
          className="toggle"
          id="btnFullTop"
          title="投影全屏 · Projection fullscreen (F)"
          onClick={press(() => store.toggleFullscreen())}
          onPointerEnter={tick}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
          <kbd>F</kbd>
          <span className="lbl">
            <span className="zh">全屏</span>
            <span className="en">Fullscreen</span>
          </span>
        </button>
        <button
          type="button"
          className={`toggle${muted ? '' : ' on'}`}
          id="btnAudio"
          title="静音 / Audio Toggle (M)"
          aria-pressed={muted}
          onClick={press(() => store.setMuted(!muted))}
          onPointerEnter={tick}
        >
          <svg
            id="icoSpeaker"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11 5L6 9H2v6h4l5 4z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" style={{ opacity: muted ? 0.25 : 1 }} />
            <path d="M19 5a10 10 0 0 1 0 14" style={{ opacity: muted ? 0.25 : 1 }} />
          </svg>
          <kbd>M</kbd>
          <span className="lbl">
            <span className="zh">{muted ? '已静音' : '音效'}</span>
            <span className="en">{muted ? 'Muted' : 'Audio'}</span>
          </span>
          <i className={`led ${muted ? 'off' : 'on'}`} id="ledAudio" />
        </button>
      </div>
    </header>
  );
}
