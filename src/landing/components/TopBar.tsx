import type { Story } from '@/data/story';

import { Bi } from '../Bi';
import { EXHIBIT_URL } from '../urls';

import './TopBar.css';

function Mark() {
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

export function TopBar({ nav }: { nav: Story['nav'] }) {
  return (
    <header className="l-top">
      <div className="l-wrap l-top-row">
        <a className="brand" href="#top">
          <Mark />
          <Bi text={nav.brand} className="brand-text" block />
        </a>
        <nav className="l-nav" aria-label="页面导航 · Site">
          <a href="#story" aria-current="page">
            <Bi text={nav.story} />
          </a>
          <a className="nav-cta" href={EXHIBIT_URL} data-testid="nav-exhibit">
            <Bi text={nav.exhibit} />
            <span aria-hidden="true"> →</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
