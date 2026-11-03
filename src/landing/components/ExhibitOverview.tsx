import type { Story } from '@/data/story';

import { Bi } from '../Bi';
import { EXHIBIT_URL, asset } from '../urls';

import './ExhibitOverview.css';

export function ExhibitOverview({ data }: { data: Story['exhibit'] }) {
  return (
    <section className="overview l-wrap" id="exhibit" aria-labelledby="overview-h">
      <header className="overview-head" data-reveal>
        <h2 id="overview-h" className="h-section">
          <Bi text={data.heading} />
        </h2>
        <p className="overview-intro">
          <Bi text={data.intro} block />
        </p>
      </header>
      <ul className="cards">
        {data.cards.map((c, i) => (
          <li className="card" key={c.id} data-reveal style={{ '--i': i } as React.CSSProperties}>
            <img
              src={asset(c.figure.src)}
              width={c.figure.width}
              height={c.figure.height}
              alt={c.figure.alt}
              loading="lazy"
              decoding="async"
            />
            <div className="card-body">
              <h3>
                <a href={EXHIBIT_URL} className="card-link">
                  <Bi text={c.title} block />
                </a>
              </h3>
              <p className="zh">{c.text.zh}</p>
              <p className="en" lang="en">
                {c.text.en}
              </p>
              <p className="card-keys" aria-label="快捷键 · Keys">
                {c.keys.map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
