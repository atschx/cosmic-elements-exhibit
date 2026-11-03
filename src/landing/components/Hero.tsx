import { useRef } from 'react';

import type { Story } from '@/data/story';

import { Bi } from '../Bi';
import { EXHIBIT_URL, asset } from '../urls';
import { useParallax } from '../useReveal';

import './Hero.css';

interface Props {
  hero: Story['hero'];
  source: Story['source'];
}

export function Hero({ hero, source }: Props) {
  const figureRef = useRef<HTMLElement>(null);
  useParallax(figureRef, 0.08);
  const { figure } = hero;

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="l-wrap hero-grid">
        <div className="hero-copy">
          <p className="kicker">
            <Bi text={hero.kicker} />
          </p>
          <h1 id="hero-title">
            <Bi text={hero.title} block />
          </h1>
          <p className="hero-lead">
            <Bi text={hero.lead} block />
          </p>
          <div className="cta-row">
            <a className="cta primary" href={EXHIBIT_URL} data-testid="hero-cta">
              <Bi text={hero.cta} />
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </a>
            <a className="cta ghost" href="#story">
              <Bi text={hero.secondary} />
              <span className="arrow" aria-hidden="true">
                ↓
              </span>
            </a>
          </div>
          <p className="byline">
            <span className="zh">
              原文 · {source.author} · {source.platform.zh}「{source.account}」 ·{' '}
              {source.publishedAt}
            </span>
            <span className="en" lang="en">
              Original story by {source.author} on {source.platform.en} “{source.account}”
            </span>
          </p>
        </div>

        <figure className="hero-figure" ref={figureRef}>
          <img
            src={asset(figure.src)}
            width={figure.width}
            height={figure.height}
            alt={figure.alt}
            decoding="async"
            fetchPriority="high"
          />
          {figure.caption ? (
            <figcaption>
              <Bi text={figure.caption} />
            </figcaption>
          ) : null}
        </figure>
      </div>
    </section>
  );
}
