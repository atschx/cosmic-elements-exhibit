import type { Shortcut, Story } from '@/data/story';

import { Bi } from '../Bi';
import { EXHIBIT_URL } from '../urls';

import './Outro.css';

interface Props {
  outro: Story['outro'];
  shortcuts: Shortcut[];
}

export function Outro({ outro, shortcuts }: Props) {
  return (
    <section className="outro" id="enter" aria-labelledby="outro-h">
      <div className="l-wrap outro-grid">
        <div className="outro-copy" data-reveal>
          <h2 id="outro-h">
            <Bi text={outro.heading} block />
          </h2>
          <p className="outro-text">
            <Bi text={outro.text} block />
          </p>
          <a className="cta primary big" href={EXHIBIT_URL} data-testid="outro-cta">
            <Bi text={outro.cta} />
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </a>
        </div>
        <section className="shortcuts" aria-labelledby="shortcuts-h" data-reveal>
          <h3 id="shortcuts-h">
            <Bi text={outro.shortcutsHeading} />
          </h3>
          <ul>
            {shortcuts.map((s) => (
              <li key={s.action.en}>
                <span className="keys">
                  {s.keys.map((k, i) =>
                    k === '–' ? (
                      <span className="key-sep" key={i} aria-hidden="true">
                        –
                      </span>
                    ) : (
                      <kbd key={i}>{k}</kbd>
                    ),
                  )}
                </span>
                <Bi text={s.action} className="act" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
