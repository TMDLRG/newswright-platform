'use client';

import { useState, useEffect } from 'react';
import AuthGate, { useAuth } from '@/components/AuthGate';
import Link from 'next/link';

interface DocSummary {
  id: string;
  filename: string;
  title: string;
  subtitle?: string;
  tier: number;
  lineCount: number;
}

interface ExportResult {
  files: Array<{ filename: string; format: string; sizeBytes: number }>;
  totalFiles: number;
}

function ExportManagerContent() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<DocSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<'md' | 'docx' | 'both'>('both');
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/documents')
      .then(r => r.json())
      .then(docs => {
        setDocuments(docs);
        // Select all by default
        setSelected(new Set(docs.map((d: DocSummary) => d.id)));
        setLoading(false);
      });
  }, []);

  function toggleDoc(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  }

  function selectAll() {
    setSelected(new Set(documents.map(d => d.id)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  function selectTier(tier: number) {
    const tierDocs = documents.filter(d => d.tier === tier).map(d => d.id);
    const next = new Set(selected);
    const allSelected = tierDocs.every(id => next.has(id));
    if (allSelected) {
      tierDocs.forEach(id => next.delete(id));
    } else {
      tierDocs.forEach(id => next.add(id));
    }
    setSelected(next);
  }

  async function runExport() {
    if (selected.size === 0) return;
    setExporting(true);
    setResult(null);
    setError('');
    try {
      const ids = selected.size === documents.length
        ? ['all']
        : Array.from(selected);
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: ids, format }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError('Export failed');
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400 text-sm">Loading documents...</div>;
  }

  const totalSize = result?.files.reduce((s, f) => s + f.sizeBytes, 0) || 0;

  return (
    <div>
      <Link href="/edit" className="text-xs text-nw-accent hover:underline">
        &larr; Edit Dashboard
      </Link>
      <h1 className="text-xl font-bold text-nw-primary mt-1 mb-1">Export Manager</h1>
      <p className="text-sm text-gray-500 mb-6">
        Export selected documents as Markdown, Word, or both formats.
      </p>

      <div className="flex gap-6">
        {/* Left: Document Selection */}
        <div className="flex-1 min-w-0">
          {/* Selection Controls */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-gray-500">
              {selected.size} of {documents.length} selected
            </span>
            <button onClick={selectAll} className="text-xs text-blue-500 hover:underline">Select All</button>
            <button onClick={selectNone} className="text-xs text-blue-500 hover:underline">Select None</button>
            <span className="text-xs text-gray-300">|</span>
            {[1, 2, 3, 4, 5].map(t => (
              <button
                key={t}
                onClick={() => selectTier(t)}
                className="text-xs text-blue-500 hover:underline"
              >
                T{t}
              </button>
            ))}
          </div>

          {/* Document Checklist */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="divide-y">
              {documents.map((doc) => (
                <label
                  key={doc.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(doc.id)}
                    onChange={() => toggleDoc(doc.id)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-mono text-gray-400 w-6">#{doc.id}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700">
                      {doc.title}
                      {doc.subtitle && <span className="text-gray-400 ml-1">— {doc.subtitle}</span>}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{doc.lineCount} lines</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    doc.tier === 1 ? 'bg-blue-100 text-blue-700' :
                    doc.tier === 2 ? 'bg-green-100 text-green-700' :
                    doc.tier === 3 ? 'bg-purple-100 text-purple-700' :
                    doc.tier === 4 ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    T{doc.tier}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Format & Export */}
        <div className="w-72 flex-shrink-0">
          <div className="sticky top-20 space-y-4">
            {/* Format Selection */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Export Format
              </h3>
              <div className="space-y-2">
                {([
                  { value: 'md' as const, label: 'Markdown (.md)', desc: 'Source files' },
                  { value: 'docx' as const, label: 'Word (.docx)', desc: 'Formatted documents' },
                  { value: 'both' as const, label: 'Both (.md + .docx)', desc: 'Complete package' },
                ]).map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
                      format === opt.value ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={opt.value}
                      checked={format === opt.value}
                      onChange={() => setFormat(opt.value)}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700">{opt.label}</div>
                      <div className="text-xs text-gray-400">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Export Summary
              </h3>
              <div className="space-y-1 text-xs text-gray-500">
                <div>Documents: <span className="font-medium text-gray-700">{selected.size}</span></div>
                <div>Format: <span className="font-medium text-gray-700">
                  {format === 'both' ? '.md + .docx' : `.${format}`}
                </span></div>
                <div>Files: <span className="font-medium text-gray-700">
                  {format === 'both' ? selected.size * 2 : selected.size}
                </span></div>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={runExport}
              disabled={selected.size === 0 || exporting}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? 'Exporting...' : 'Export Package'}
            </button>

            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                {error}
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-green-700 mb-2">
                  Export Complete
                </h4>
                <div className="text-xs text-green-600 space-y-0.5">
                  <div>{result.totalFiles} files generated</div>
                  <div>{(totalSize / 1024).toFixed(1)} KB total</div>
                </div>
                <div className="mt-2 max-h-40 overflow-y-auto space-y-0.5">
                  {result.files.map((f, i) => (
                    <div key={i} className="text-[10px] text-green-600 font-mono">
                      {f.filename} ({(f.sizeBytes / 1024).toFixed(1)}KB)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExportPage() {
  return (
    <AuthGate>
      <ExportManagerContent />
    </AuthGate>
  );
}
