import type { Bilingual } from '@/data/story';

interface Props {
  text: Bilingual;
  /** Extra class on the wrapper (the zh / en runs keep their own classes). */
  className?: string;
  /** Put the English run on its own line (block) instead of after a separator (inline). */
  block?: boolean;
}

/** 中文 + English pair with the English marked `lang="en"` for assistive tech and hyphenation. */
export function Bi({ text, className, block = false }: Props) {
  return (
    <span className={`bi${block ? ' bi-block' : ''}${className ? ` ${className}` : ''}`}>
      <span className="zh">{text.zh}</span>
      <span className="en" lang="en">
        {text.en}
      </span>
    </span>
  );
}
