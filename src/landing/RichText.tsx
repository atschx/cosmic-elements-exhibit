import { Fragment, type ReactNode } from 'react';

/** Renders story copy with the one inline mark the JSON uses: `**emphasis**` → <strong>. */
export function RichText({ text }: { text: string }): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}
