import Link from 'next/link';
import { DocumentManager } from '@/lib/documents';
import { PACKAGE_DIR, Section } from '@/lib/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import TableRenderer from '@/components/TableRenderer';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DocumentPage({ params }: Props) {
  const { id } = await params;
  const manager = new DocumentManager(PACKAGE_DIR);
  const doc = manager.getById(id);

  if (!doc) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-400">Document not found</h1>
        <Link href="/" className="text-nw-accent hover:underline mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const scan = manager.getScanResult();
  const docOccurrences = scan.byDocument[doc.id] || [];

  // Build section nav
  function flattenSections(sections: Section[], depth = 0): Array<{ heading: string; level: number; line: number }> {
    const result: Array<{ heading: string; level: number; line: number }> = [];
    for (const s of sections) {
      result.push({ heading: s.heading, level: s.level, line: s.startLine });
      result.push(...flattenSections(s.children, depth + 1));
    }
    return result;
  }

  const navSections = flattenSections(doc.sections);

  return (
    <div className="flex gap-6">
      {/* Sidebar: Section Navigation */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-20">
          <Link href="/" className="text-sm text-nw-accent hover:underline mb-4 block">
            &larr; All Documents
          </Link>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Sections
            </h3>
            <nav className="space-y-0.5 max-h-[60vh] overflow-y-auto">
              {navSections.map((s, i) => (
                <a
                  key={i}
                  href={`#line-${s.line}`}
                  className={`block text-xs py-1 hover:text-nw-accent transition-colors ${
                    s.level === 1
                      ? 'font-semibold text-gray-800'
                      : s.level === 2
                      ? 'pl-3 text-gray-600'
                      : s.level === 3
                      ? 'pl-6 text-gray-500'
                      : 'pl-9 text-gray-400'
                  }`}
                >
                  {s.heading}
                </a>
              ))}
            </nav>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 mt-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Stats
            </h3>
            <div className="space-y-1 text-xs text-gray-500">
              <div>Version: <span className="font-medium text-gray-700">{doc.version}</span></div>
              <div>Tier: <span className="font-medium text-gray-700">{doc.tier} — {doc.tierLabel}</span></div>
              <div>Tables: <span className="font-medium text-gray-700">{doc.tables.length}</span></div>
              <div>Cross-refs: <span className="font-medium text-gray-700">{docOccurrences.length}</span></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-lg shadow-sm border p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 pb-4 border-b">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span className="font-mono">#{doc.id}</span>
              <span>|</span>
              <span>{doc.filename}</span>
              <span>|</span>
              <span>v{doc.version}</span>
              {doc.status && (
                <>
                  <span>|</span>
                  <span className="text-emerald-600 font-medium">{doc.status}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold text-nw-primary">{doc.title}</h1>
            {doc.subtitle && (
              <p className="text-gray-500 mt-1">{doc.subtitle}</p>
            )}
          </div>

          {/* Tables rendered separately with proper formatting */}
          {doc.tables.length > 0 && (
            <div className="mb-6">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700">
                  {doc.tables.length} tables in this document
                </summary>
                <div className="mt-2 space-y-4">
                  {doc.tables.map((table) => (
                    <div key={table.id}>
                      {table.sectionPath && (
                        <div className="text-xs text-gray-400 mb-1">{table.sectionPath}</div>
                      )}
                      <TableRenderer table={table} />
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* Full Markdown Content */}
          <MarkdownRenderer content={doc.raw} />
        </div>
      </div>
    </div>
  );
}
