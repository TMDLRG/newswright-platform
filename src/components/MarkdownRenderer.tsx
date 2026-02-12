'use client';

/**
 * Renders markdown content as HTML with financial value highlighting.
 * Client component for interactivity (hover on values).
 */

interface MarkdownRendererProps {
  content: string;
  highlightValues?: Map<string, { variableId: string; count: number }>;
}

export default function MarkdownRenderer({ content, highlightValues }: MarkdownRendererProps) {
  const lines = content.split('\n');

  return (
    <div className="prose prose-sm max-w-none">
      {lines.map((line, i) => renderLine(line, i, highlightValues))}
    </div>
  );
}

function renderLine(
  line: string,
  index: number,
  highlights?: Map<string, { variableId: string; count: number }>
) {
  const trimmed = line.trim();

  if (trimmed === '') return <div key={index} className="h-2" />;

  // Headings
  const h1 = trimmed.match(/^#\s+(.+)/);
  if (h1) return <h1 key={index} className="text-2xl font-bold text-nw-primary mt-6 mb-3">{renderInline(h1[1])}</h1>;

  const h2 = trimmed.match(/^##\s+(.+)/);
  if (h2) return <h2 key={index} className="text-xl font-semibold text-gray-800 mt-5 mb-2 border-b pb-1">{renderInline(h2[1])}</h2>;

  const h3 = trimmed.match(/^###\s+(.+)/);
  if (h3) return <h3 key={index} className="text-lg font-semibold text-gray-700 mt-4 mb-2">{renderInline(h3[1])}</h3>;

  const h4 = trimmed.match(/^####\s+(.+)/);
  if (h4) return <h4 key={index} className="text-base font-semibold text-gray-600 mt-3 mb-1">{renderInline(h4[1])}</h4>;

  // Horizontal rule
  if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
    return <hr key={index} className="my-4 border-gray-200" />;
  }

  // Table rows (handled by parent — just render as-is here)
  if (trimmed.startsWith('|')) {
    return (
      <div key={index} className="font-mono text-xs text-gray-600 leading-tight">
        {trimmed}
      </div>
    );
  }

  // Bullet lists
  if (trimmed.match(/^[-*+]\s/)) {
    const text = trimmed.replace(/^[-*+]\s+/, '');
    return (
      <div key={index} className="flex items-start gap-2 pl-4 py-0.5">
        <span className="text-gray-400 mt-1.5 text-xs">&#8226;</span>
        <span className="text-sm text-gray-700">{renderInline(text)}</span>
      </div>
    );
  }

  // Blockquotes
  if (trimmed.startsWith('>')) {
    const text = trimmed.replace(/^>\s*/, '');
    return (
      <blockquote key={index} className="border-l-4 border-blue-300 pl-4 py-1 text-sm text-gray-600 italic">
        {renderInline(text)}
      </blockquote>
    );
  }

  // Default paragraph
  return (
    <p key={index} className="text-sm text-gray-700 leading-relaxed">
      {renderInline(trimmed)}
    </p>
  );
}

function renderInline(text: string): React.ReactNode {
  // Simple inline formatting: **bold**, *italic*
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/\*(.+?)\*/);

    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else if (italicMatch && italicMatch.index !== undefined && !remaining.startsWith('**')) {
      if (italicMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, italicMatch.index)}</span>);
      }
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      remaining = '';
    }
  }

  return <>{parts}</>;
}
