import type { ElementQuote, StoryBlock, StoryFigure, StorySection } from '@/data/story';
import { glyphRenders } from '@/model/glyphs';

import { Bi } from '../Bi';
import { RichText } from '../RichText';
import { asset } from '../urls';

import './StoryBody.css';

export function StoryBody({ sections }: { sections: StorySection[] }) {
  return (
    <article className="story" id="story" aria-label="故事正文 · The story">
      {sections.map((s) => (
        <Section key={s.id} section={s} />
      ))}
    </article>
  );
}

function Section({ section: s }: { section: StorySection }) {
  const headingId = `sec-${s.id}`;
  return (
    <section className="sec l-wrap" id={s.id} data-accent={s.accent} aria-labelledby={headingId}>
      <header className="sec-head" data-reveal>
        {s.num ? (
          <span className="sec-num" aria-hidden="true">
            {s.num}
          </span>
        ) : null}
        {s.label ? <Bi text={s.label} className="sec-label" /> : null}
        <h2 id={headingId}>
          {s.title ? (
            <Bi text={s.title} block />
          ) : (
            <span className="sr-only">
              {s.label?.zh ?? s.id} · {s.label?.en ?? s.id}
            </span>
          )}
        </h2>
        <p className="lead-en" lang="en">
          {s.leadEn}
        </p>
      </header>
      {s.blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </section>
  );
}

/** Same tofu guard as the lightbox wall: the newest element names fall back to pinyin on old fonts. */
const elementName = (e: ElementQuote): string =>
  !e.pinyin || Array.from(e.name).every(glyphRenders) ? e.name : e.pinyin;

function Figure({ figure, className }: { figure: StoryFigure; className?: string }) {
  return (
    <figure className={`fig${className ? ` ${className}` : ''}`} data-reveal>
      <img
        src={asset(figure.src)}
        width={figure.width}
        height={figure.height}
        alt={figure.alt}
        loading="lazy"
        decoding="async"
      />
      {figure.caption ? (
        <figcaption>
          <Bi text={figure.caption} block />
        </figcaption>
      ) : null}
    </figure>
  );
}

function Block({ block: b }: { block: StoryBlock }) {
  switch (b.type) {
    case 'p':
      return b.num ? (
        <p className="para numbered" data-reveal>
          <span className="para-num" aria-hidden="true">
            {b.num}
          </span>
          <RichText text={b.text} />
        </p>
      ) : (
        <p className="para" data-reveal>
          <RichText text={b.text} />
        </p>
      );
    case 'quote':
      return (
        <blockquote className="pull" data-reveal>
          <p>
            <RichText text={b.text} />
          </p>
          {b.cite ? <cite>{b.cite}</cite> : null}
        </blockquote>
      );
    case 'list':
      return (
        <ul className="bullets" data-reveal>
          {b.items.map((item, i) => (
            <li key={i}>
              <RichText text={item} />
            </li>
          ))}
        </ul>
      );
    case 'elements':
      return (
        <ul className="element-quotes" data-reveal>
          {b.items.map((e) => {
            const name = elementName(e);
            return (
              <li key={e.symbol} data-accent={e.accent}>
                <span className="el-tile" aria-hidden="true">
                  <small>{e.z}</small>
                  <b>{e.symbol}</b>
                  <i>{name}</i>
                </span>
                <p>
                  <span className="el-name">
                    {name}（{e.symbol}）：
                  </span>
                  {e.text}
                </p>
              </li>
            );
          })}
        </ul>
      );
    case 'figure':
      return <Figure figure={b.figure} />;
    case 'video':
      return (
        <figure className="fig video" data-reveal>
          <a className="video-link" href={b.href} target="_blank" rel="noopener noreferrer">
            <img
              src={asset(b.poster.src)}
              width={b.poster.width}
              height={b.poster.height}
              alt={b.poster.alt}
              loading="lazy"
              decoding="async"
            />
            <span className="play">
              <span className="play-glyph" aria-hidden="true" />
              <Bi text={b.label} />
              <span aria-hidden="true"> ↗</span>
            </span>
          </a>
          {b.poster.caption ? (
            <figcaption>
              <Bi text={b.poster.caption} block />
            </figcaption>
          ) : null}
        </figure>
      );
  }
}
