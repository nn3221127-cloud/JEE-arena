import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export function MathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => {
    if (!text) return '';
    const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
    return parts.map((part) => {
      if (part.startsWith('$$') && part.endsWith('$$'))
        return katex.renderToString(part.slice(2, -2), { throwOnError: false, displayMode: true });
      if (part.startsWith('$') && part.endsWith('$'))
        return katex.renderToString(part.slice(1, -1), { throwOnError: false, displayMode: false });
      return part.replace(/</g, '&lt;');
    }).join('');
  }, [text]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
