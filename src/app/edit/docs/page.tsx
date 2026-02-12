'use client';

import Link from 'next/link';
import AuthGate from '@/components/AuthGate';
import { useEffect, useState } from 'react';

interface DocSummary {
  id: string;
  filename: string;
  title: string;
  subtitle?: string;
  version: string;
  tier: number;
  tierLabel: string;
  sectionCount: number;
  tableCount: number;
  lineCount: number;
}

function DocListContent() {
  const [documents, setDocuments] = useState<DocSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/documents')
      .then(r => r.json())
      .then(docs => {
        setDocuments(docs);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-400 text-sm">Loading documents...</div>;
  }

  return (
    <div>
      <Link href="/edit" className="text-xs text-nw-accent hover:underline">
        &larr; Edit Dashboard
      </Link>
      <h1 className="text-xl font-bold text-nw-primary mt-1 mb-4">Document Editor</h1>
      <p className="text-sm text-gray-500 mb-6">
        Select a document to edit. For synchronized variables, use the{' '}
        <Link href="/variables" className="text-blue-600 underline">Variable Editor</Link>{' '}
        to propagate changes automatically.
      </p>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="divide-y">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/edit/${doc.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-400 w-6">#{doc.id}</span>
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {doc.title}
                    {doc.subtitle && <span className="text-gray-400 ml-1">— {doc.subtitle}</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {doc.filename} &middot; {doc.sectionCount} sections &middot; {doc.tableCount} tables &middot; {doc.lineCount} lines
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">v{doc.version}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  doc.tier === 1 ? 'bg-blue-100 text-blue-700' :
                  doc.tier === 2 ? 'bg-green-100 text-green-700' :
                  doc.tier === 3 ? 'bg-purple-100 text-purple-700' :
                  doc.tier === 4 ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  T{doc.tier}
                </span>
                <span className="text-xs text-blue-500">Edit &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EditDocsPage() {
  return (
    <AuthGate>
      <DocListContent />
    </AuthGate>
  );
}
