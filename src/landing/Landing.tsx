import { Starfield } from '@/components/Backdrop/Starfield';
import { story } from '@/data/story';

import { Bi } from './Bi';
import { ExhibitOverview } from './components/ExhibitOverview';
import { Hero } from './components/Hero';
import { Outro } from './components/Outro';
import { StoryBody } from './components/StoryBody';
import { TopBar } from './components/TopBar';
import { useReveal } from './useReveal';

export function Landing() {
  useReveal();
  return (
    <>
      <Starfield />
      <div className="l-nebula" aria-hidden="true" />
      <div className="l-page">
        <TopBar nav={story.nav} />
        <main id="main">
          <Hero hero={story.hero} source={story.source} />
          <StoryBody sections={story.sections} />
          <ExhibitOverview data={story.exhibit} />
          <Outro outro={story.outro} shortcuts={story.shortcuts} />
        </main>
        <footer className="l-footer">
          <Credits />
        </footer>
      </div>
    </>
  );
}

function Credits() {
  const { credits, source } = story;
  return (
    <section className="credits l-wrap" aria-labelledby="credits-h" data-reveal>
      <h2 id="credits-h" className="h-section">
        <Bi text={credits.heading} />
      </h2>
      <dl className="credit-list">
        {credits.items.map((item) => (
          <div className="credit" key={item.label.en}>
            <dt>
              <Bi text={item.label} block />
            </dt>
            <dd>
              <p className="zh">{item.text.zh}</p>
              <p className="en" lang="en">
                {item.text.en}
              </p>
              {item.href && item.linkLabel ? (
                <a
                  className="credit-link"
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Bi text={item.linkLabel} />
                  <span aria-hidden="true"> ↗</span>
                </a>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
      <p className="colophon">
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          《{source.title}》
        </a>{' '}
        · {source.author} · {source.platform.zh}「{source.account}」 · {source.publishedAt}
      </p>
    </section>
  );
}
