import { useEffect, useState } from 'react';

const CPS = 26;
const HOLD_ZH = 3400;
const HOLD_EN = 4600;
const START_DELAY = 120;

interface Props {
  zh: string;
  en: string;
}

/** One-line marquee subtitle: 中文 types in with a cursor, then zh ⇄ en alternate until the next lever commit. */
export function Subtitle(props: Props) {
  // remount on every new tag so the typewriter starts from a clean slate
  return <SubtitleRun key={`${props.zh}|${props.en}`} {...props} />;
}

function SubtitleRun({ zh, en }: Props) {
  const [typed, setTyped] = useState('');
  const [showEn, setShowEn] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const push = (fn: () => void, ms: number): void => {
      timers.push(setTimeout(fn, ms));
    };
    let i = 0;
    const step = (): void => {
      i += 1;
      setTyped(zh.slice(0, i));
      if (i < zh.length) push(step, 1000 / CPS);
    };
    push(step, START_DELAY);
    const typedMs = START_DELAY + zh.length * (1000 / CPS);
    const flip = (toEn: boolean): void => {
      setShowEn(toEn);
      push(() => flip(!toEn), toEn ? HOLD_EN : HOLD_ZH);
    };
    push(() => flip(true), typedMs + HOLD_ZH);
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [zh]);

  const typing = typed.length < zh.length;
  return (
    <p className={`subtitle${showEn ? ' show-en' : ''}`}>
      <span className="zh" aria-hidden="true">
        {typed}
        {typing && typed.length > 0 ? <i className="cursor" /> : null}
      </span>
      <span className="en" aria-hidden="true">
        {en}
      </span>
      <span className="sr-only">
        {zh} {en}
      </span>
    </p>
  );
}
