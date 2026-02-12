'use client';

import { useState, useEffect } from 'react';

interface DocSummary {
  id: string;
  filename: string;
  title: string;
  tier: number;
}

export default function ComparePage() {
  const [documents, setDocuments] = useState<DocSummary[]>([]);
  const [leftId, setLeftId] = useState<string>('01');
  const [rightId, setRightId] = useState<string>('04');
  const [leftContent, setLeftContent] = useState<string>('');
  const [rightContent, setRightContent] = useState<string>('');

  useEffect(() => {
    fetch('/api/documents')
      .then((r) => r.json())
      .then((docs) => setDocuments(docs));
  }, []);

  useEffect(() => {
    if (leftId) {
      fetch(`/api/documents?id=${leftId}`)
        .then((r) => r.json())
        .then((d) => setLeftContent(d.raw));
    }
  }, [leftId]);

  useEffect(() => {
    if (rightId) {
      fetch(`/api/documents?id=${rightId}`)
        .then((r) => r.json())
        .then((d) => setRightContent(d.raw));
    }
  }, [rightId]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-nw-primary">Document Comparison</h1>

      {/* Selector Bar */}
      <div className="flex gap-4 items-center bg-white rounded-lg shadow-sm border p-4">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Left Document</label>
          <select
            value={leftId}
            onChange={(e) => setLeftId(e.target.value)}
            className="w-full border rounded-md px-3 py-1.5 text-sm"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                #{d.id} — {d.title}
              </option>
            ))}
          </select>
        </div>
        <div className="text-gray-300 text-2xl pt-4">vs</div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Right Document</label>
          <select
            value={rightId}
            onChange={(e) => setRightId(e.target.value)}
            className="w-full border rounded-md px-3 py-1.5 text-sm"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                #{d.id} — {d.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Content */}
      <div className="grid grid-cols-2 gap-4">
        <DocumentPanel content={leftContent} label={`#${leftId}`} />
        <DocumentPanel content={rightContent} label={`#${rightId}`} />
      </div>
    </div>
  );
}

function DocumentPanel({ content, label }: { content: string; label: string }) {
  if (!content) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center text-gray-400">
        Loading {label}...
      </div>
    );
  }

  const lines = content.split('\n');

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="bg-gray-50 border-b px-4 py-2 text-xs font-medium text-gray-500">
        {label} — {lines.length} lines
      </div>
      <div className="p-4 max-h-[70vh] overflow-y-auto">
        <div className="space-y-0.5">
          {lines.map((line, i) => {
            const trimmed = line.trim();
            if (trimmed === '') return <div key={i} className="h-1" />;
            if (trimmed.startsWith('# '))
              return <div key={i} className="text-lg font-bold text-nw-primary mt-3">{trimmed.replace(/^#+\s/, '')}</div>;
            if (trimmed.startsWith('## '))
              return <div key={i} className="text-base font-semibold text-gray-700 mt-2">{trimmed.replace(/^#+\s/, '')}</div>;
            if (trimmed.startsWith('### '))
              return <div key={i} className="text-sm font-semibold text-gray-600 mt-1">{trimmed.replace(/^#+\s/, '')}</div>;
            if (trimmed.startsWith('|'))
              return <div key={i} className="font-mono text-xs text-gray-500">{trimmed}</div>;
            if (trimmed === '---')
              return <hr key={i} className="my-2 border-gray-200" />;
            return <div key={i} className="text-xs text-gray-600 leading-relaxed">{highlightFinancials(trimmed)}</div>;
          })}
        </div>
      </div>
    </div>
  );
}

function highlightFinancials(text: string) {
  // Highlight dollar amounts and percentages
  const parts = text.split(/(\$[\d,.]+(M|K|B)?|\d+(\.\d+)?%|\d{1,3}(,\d{3})+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.match(/^\$/)) return <span key={i} className="text-emerald-700 font-medium">{part}</span>;
        if (part.match(/^\d+(\.\d+)?%$/)) return <span key={i} className="text-blue-700 font-medium">{part}</span>;
        if (part.match(/^\d{1,3}(,\d{3})+$/)) return <span key={i} className="text-purple-700 font-medium">{part}</span>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
