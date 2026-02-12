import Link from 'next/link';
import { DocumentManager } from '@/lib/documents';
import { buildVarMap, computeAll } from '@/lib/formulas';
import { PACKAGE_DIR, CATEGORY_LABELS } from '@/lib/types';

const TIER_COLORS: Record<number, string> = {
  1: 'border-blue-500 bg-blue-50',
  2: 'border-emerald-500 bg-emerald-50',
  3: 'border-amber-500 bg-amber-50',
  4: 'border-purple-500 bg-purple-50',
  5: 'border-gray-500 bg-gray-50',
};

const TIER_NAMES: Record<number, string> = {
  1: 'Core Investor Materials',
  2: 'Operational & Strategic Plans',
  3: 'Market & Ecosystem Analysis',
  4: 'Reference & Decision Documentation',
  5: 'Quality Assurance & Verification',
};

export default function Dashboard() {
  const manager = new DocumentManager(PACKAGE_DIR);
  const summaries = manager.getDocumentSummaries();
  const registry = manager.getRegistry();
  const vars = buildVarMap(registry);
  const formulas = computeAll(vars);

  const metrics = [
    { label: 'Seed Round', value: '$500K', sub: 'SAFE or Priced Equity' },
    { label: 'M12 ARR', value: '$720K', sub: '92 customers' },
    { label: 'US Market', value: '8,654', sub: 'news outlets' },
    { label: 'US TAM', value: '$51.9M', sub: 'at $500/mo ARPU' },
    { label: 'Y3 Exit', value: '$60M', sub: '10x ARR multiple' },
    { label: 'Investor Return', value: '10.4x', sub: 'on $500K seed' },
  ];

  const tiers = [1, 2, 3, 4, 5] as const;

  return (
    <div className="space-y-8">
      {/* Headline Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center"
          >
            <div className="text-2xl font-bold text-nw-primary">{m.value}</div>
            <div className="text-sm font-medium text-gray-700 mt-1">{m.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Document Grid by Tier */}
      {tiers.map((tier) => {
        const tierDocs = summaries.filter((s) => s.tier === tier);
        if (tierDocs.length === 0) return null;
        return (
          <section key={tier}>
            <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span
                className={`inline-block w-3 h-3 rounded-full ${
                  { 1: 'bg-blue-500', 2: 'bg-emerald-500', 3: 'bg-amber-500', 4: 'bg-purple-500', 5: 'bg-gray-500' }[tier]
                }`}
              />
              Tier {tier}: {TIER_NAMES[tier]}
              <span className="text-sm font-normal text-gray-400">
                ({tierDocs.length} documents)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tierDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/doc/${doc.id}`}
                  className={`block rounded-lg border-l-4 shadow-sm bg-white hover:shadow-md transition-shadow p-4 ${TIER_COLORS[tier]}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-gray-400">
                        #{doc.id}
                      </span>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight mt-0.5">
                        {doc.title}
                      </h3>
                      {doc.subtitle && (
                        <p className="text-xs text-gray-500 mt-0.5">{doc.subtitle}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      v{doc.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span>{doc.sectionCount} sections</span>
                    <span>{doc.tableCount} tables</span>
                    <span>{doc.lineCount} lines</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* Package Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-4 text-sm text-gray-500">
        <span className="font-medium text-gray-700">Package:</span>{' '}
        {summaries.length} documents | {registry.variables.length} tracked variables |{' '}
        {manager.getScanResult().totalOccurrences} cross-references
      </div>
    </div>
  );
}
