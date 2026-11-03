import { useEffect, useMemo, useRef } from 'react';

import { useSound } from '@/audio/useSound';
import { DOMAINS, EPOCH_COUNT, PANORAMA, STAGES, pad, stageColor, supernovaBracket } from '@/model';
import { useExhibit, useExhibitStore } from '@/state/hooks';
import { isPanorama } from '@/state/selectors';

import { AutoKey } from './AutoKey';
import './ConsoleDeck.css';
import { LeverRail, type RailStop } from './LeverRail';

const pct = (i: number, n: number): number => (i / (n - 1)) * 100;

/** Curved cockpit console: LCD + prev/next, the two lever rails, and the mode keys. */
export function ConsoleDeck() {
  const store = useExhibitStore();
  const sound = useSound();
  const axis = useExhibit((s) => s.axis);
  const stage = useExhibit((s) => s.stage);
  const domain = useExhibit((s) => s.domain);
  const litCount = useExhibit((s) => s.litCount);
  const auto = useExhibit((s) => s.auto);
  const fullscreen = useExhibit((s) => s.fullscreen);
  const muted = useExhibit((s) => s.muted);
  const panorama = useExhibit(isPanorama);
  const seq = useExhibit((s) => s.ignition.seq);

  // the deck flashes for 320 ms on every ignition; toggled on the DOM to stay out of React's render loop
  const deckRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck || seq === 0) return;
    deck.classList.add('fire');
    const t = setTimeout(() => deck.classList.remove('fire'), 320);
    return () => {
      clearTimeout(t);
      deck.classList.remove('fire');
    };
  }, [seq]);

  const originStops = useMemo<RailStop[]>(
    () =>
      STAGES.map((s, i) => ({
        color: stageColor(i),
        numeral: s.numeral,
        zh: s.shortZh,
        en: s.shortEn,
        readout: s.timeShort,
      })),
    [],
  );
  const abundStops = useMemo<RailStop[]>(
    () =>
      DOMAINS.map((d, i) => ({
        color: d.color,
        numeral: pad(i + 1),
        zh: d.nameZh,
        en: d.nameEn,
        readout: d.readout,
      })),
    [],
  );

  const press = (fn: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    sound.press();
    fn();
    e.currentTarget.blur();
  };
  const enter = () => sound.tick(0.5);

  const epochText =
    stage === PANORAMA ? `ALL/${pad(EPOCH_COUNT)}` : `${pad(stage + 1)}/${pad(EPOCH_COUNT)}`;
  const realmText =
    domain >= 0 ? `${pad(domain + 1)}/${pad(DOMAINS.length)}` : `--/${pad(DOMAINS.length)}`;

  return (
    <footer className="deck-wrap">
      <div ref={deckRef} className="deck" id="deck">
        <i className="screw tl" />
        <i className="screw tr" />
        <i className="screw bl" />
        <i className="screw br" />

        <div className="deck-left">
          <div className="lcd" id="lcd" aria-label="状态屏 Status LCD">
            <div>
              <span>PWR 电源</span>
              <i className="led on" />
            </div>
            <div>
              <span>AUD 音频</span>
              <i className={`led ${muted ? 'off' : 'on'}`} id="lcdAudio" />
            </div>
            <div>
              <span>LOOP 巡航</span>
              <i className={`led${auto ? ' on' : ''}`} id="lcdLoop" />
            </div>
            <div>
              <span>FS 全屏</span>
              <i className={`led${fullscreen ? ' on' : ''}`} id="lcdFs" />
            </div>
            <div>
              <span>EPOCH 纪元</span>
              <b id="lcdEpoch">{epochText}</b>
            </div>
            <div>
              <span>LIT 点亮</span>
              <b id="lcdLit" data-testid="lcd-lit">
                {pad(litCount, 3)}/118
              </b>
            </div>
            <div>
              <span>AXIS 维度</span>
              <b id="lcdAxis">{axis === 'origin' ? 'ORIGIN' : 'ABUND.'}</b>
            </div>
            <div>
              <span>REALM 物质域</span>
              <b id="lcdRealm">{realmText}</b>
            </div>
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="key"
              id="btnPrev"
              title="后退一档 · Previous notch (←)"
              onClick={press(() => store.prev('button'))}
              onPointerEnter={enter}
            >
              <kbd>←</kbd>
              <span className="lbl">
                后退一档<small>Prev Notch</small>
              </span>
            </button>
            <button
              type="button"
              className="key"
              id="btnNext"
              title="前进一档 · Next notch (→)"
              onClick={press(() => store.next('button'))}
              onPointerEnter={enter}
            >
              <span className="lbl">
                前进一档<small>Next Notch</small>
              </span>
              <kbd>→</kbd>
            </button>
          </div>
        </div>

        <div className="deck-center">
          <LeverRail
            axis="origin"
            id="railOrigin"
            labelZh="元素来源"
            labelEn="Origin of Elements"
            ariaLabel="元素来源拉杆 Origin of Elements lever"
            stops={originStops}
            index={stage}
            active={axis === 'origin'}
            pitch={1}
            onCommit={(i, src) => store.setStage(i, src)}
          >
            {supernovaBracket ? (
              <div
                className="bracket"
                id="snBracket"
                style={{
                  left: `${pct(supernovaBracket.first, STAGES.length)}%`,
                  width: `${pct(supernovaBracket.last, STAGES.length) - pct(supernovaBracket.first, STAGES.length)}%`,
                }}
              >
                <span>
                  {STAGES[supernovaBracket.first]?.groupZh} ·{' '}
                  {STAGES[supernovaBracket.first]?.groupEn}
                </span>
              </div>
            ) : null}
          </LeverRail>
          <LeverRail
            axis="abundance"
            id="railAbund"
            labelZh="元素丰度"
            labelEn="Element Abundance"
            ariaLabel="元素丰度拉杆 Element Abundance lever"
            stops={abundStops}
            index={Math.max(0, domain)}
            active={axis === 'abundance'}
            pitch={1.25}
            onCommit={(i, src) => store.setDomain(i, src)}
          />
        </div>

        <div className="deck-right">
          <div className="btn-row">
            <AutoKey onPress={press(() => store.setAuto(!auto))} onEnter={enter} />
            <button
              type="button"
              className={`key has-ring${panorama ? ' on' : ''}`}
              id="btnAll"
              title="全景全开 · All Starstuff View (A)"
              aria-pressed={panorama}
              onClick={press(() => store.togglePanorama('button'))}
              onPointerEnter={enter}
            >
              <i className="ring" />
              <kbd>A</kbd>
              <span className="lbl">
                全景全开<small>All Starstuff</small>
              </span>
            </button>
          </div>
          <div className="btn-row">
            <button
              type="button"
              className={`key has-ring${fullscreen ? ' on' : ''}`}
              id="btnFull"
              title="投影全屏 · Fullscreen (F)"
              aria-pressed={fullscreen}
              onClick={press(() => store.toggleFullscreen())}
              onPointerEnter={enter}
            >
              <i className="ring" />
              <kbd>F</kbd>
              <span className="lbl">
                投影全屏<small>Fullscreen</small>
              </span>
            </button>
            <button
              type="button"
              className={`key has-ring${muted ? '' : ' on'}`}
              id="btnMute"
              title="静音 / Audio Toggle (M)"
              aria-pressed={!muted}
              onClick={press(() => store.setMuted(!muted))}
              onPointerEnter={enter}
            >
              <i className="ring" />
              <kbd>M</kbd>
              <span className="lbl" id="muteLabel">
                {muted ? (
                  <>
                    已静音<small>Audio Muted</small>
                  </>
                ) : (
                  <>
                    机械音效<small>Audio On</small>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
