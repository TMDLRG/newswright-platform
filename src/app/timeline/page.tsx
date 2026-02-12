import { DocumentManager } from '@/lib/documents';
import { PACKAGE_DIR } from '@/lib/types';

interface Milestone {
  month: number;
  label: string;
  detail: string;
  phase: string;
  color: string;
}

const MILESTONES: Milestone[] = [
  { month: 0, label: 'Seed Close', detail: '$500K raised', phase: 'Phase 0', color: 'bg-blue-500' },
  { month: 1, label: 'Pilot Begins', detail: '50 newsrooms, 3 cohorts', phase: 'Phase 0', color: 'bg-blue-500' },
  { month: 3, label: 'Gate 1', detail: '40%+ time savings, 80% conversion', phase: 'Phase 0', color: 'bg-blue-600' },
  { month: 4, label: 'Paid Launch', detail: 'First paying customers', phase: 'Phase 1', color: 'bg-emerald-500' },
  { month: 6, label: '25 Customers', detail: '$12.5K MRR', phase: 'Phase 1', color: 'bg-emerald-500' },
  { month: 9, label: 'Series Seed', detail: '$1.0M–$1.5M raise', phase: 'Phase 2', color: 'bg-amber-500' },
  { month: 12, label: '92 Customers', detail: '$60K MRR / $720K ARR', phase: 'Phase 2', color: 'bg-amber-500' },
  { month: 15, label: 'Break-Even', detail: 'Revenue > costs', phase: 'Phase 2', color: 'bg-amber-600' },
  { month: 18, label: '200 Customers', detail: '$100K MRR / $1.2M ARR', phase: 'Phase 3', color: 'bg-purple-500' },
  { month: 24, label: '338 Customers', detail: '$280K MRR / $3.4M ARR', phase: 'Phase 3', color: 'bg-purple-500' },
  { month: 30, label: 'Intl Expansion', detail: 'UK, Australia, Canada', phase: 'Phase 4', color: 'bg-red-500' },
  { month: 36, label: '908 Customers', detail: '$500K MRR / $6M ARR', phase: 'Phase 4', color: 'bg-red-500' },
];

const PHASES = [
  { name: 'Phase 0: Stealth Pilot', months: [0, 3], color: 'bg-blue-100 border-blue-300', textColor: 'text-blue-800' },
  { name: 'Phase 1: Convert & Launch', months: [4, 8], color: 'bg-emerald-100 border-emerald-300', textColor: 'text-emerald-800' },
  { name: 'Phase 2: Scale', months: [9, 17], color: 'bg-amber-100 border-amber-300', textColor: 'text-amber-800' },
  { name: 'Phase 3: Profit', months: [18, 29], color: 'bg-purple-100 border-purple-300', textColor: 'text-purple-800' },
  { name: 'Phase 4: International', months: [30, 36], color: 'bg-red-100 border-red-300', textColor: 'text-red-800' },
];

export default function TimelinePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-nw-primary">M1-M36 Growth Timeline</h1>

      {/* Phase Legend */}
      <div className="flex flex-wrap gap-3">
        {PHASES.map((p) => (
          <div
            key={p.name}
            className={`px-3 py-1.5 rounded-full border text-xs font-medium ${p.color} ${p.textColor}`}
          >
            {p.name}
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {/* Phase bars */}
        <div className="relative mb-8">
          <div className="flex h-8 rounded-lg overflow-hidden border">
            {PHASES.map((p) => {
              const span = p.months[1] - p.months[0] + 1;
              const width = (span / 37) * 100;
              return (
                <div
                  key={p.name}
                  className={`${p.color} flex items-center justify-center border-r`}
                  style={{ width: `${width}%` }}
                >
                  <span className={`text-xs font-medium ${p.textColor} truncate px-1`}>
                    {p.name.split(':')[0]}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Month markers */}
          <div className="flex justify-between mt-1 px-0.5">
            {[0, 6, 12, 18, 24, 30, 36].map((m) => (
              <span key={m} className="text-xs text-gray-400">
                M{m}
              </span>
            ))}
          </div>
        </div>

        {/* Milestone list */}
        <div className="space-y-0">
          {MILESTONES.map((m, i) => (
            <div
              key={i}
              className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0"
            >
              {/* Timeline dot */}
              <div className="flex flex-col items-center flex-shrink-0 w-16">
                <span className="text-xs font-mono text-gray-400">M{m.month}</span>
                <div className={`w-3 h-3 rounded-full mt-1 ${m.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 text-sm">{m.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                    {m.phase}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{m.detail}</div>
              </div>

              {/* Progress bar (visual position) */}
              <div className="w-32 flex-shrink-0 hidden md:block">
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div
                    className={`h-1.5 rounded-full ${m.color}`}
                    style={{ width: `${(m.month / 36) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics at Milestones */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="M3 (Gate 1)" metrics={['$345K cash', '50 pilot sites', '40%+ time savings']} />
        <StatCard title="M12 (Year 1)" metrics={['$720K ARR', '92 customers', '$60K MRR']} />
        <StatCard title="M24 (Year 2)" metrics={['$3.4M ARR', '338 customers', '$280K MRR']} />
        <StatCard title="M36 (Year 3)" metrics={['$6M ARR', '908 customers', '10.5% penetration']} />
      </div>
    </div>
  );
}

function StatCard({ title, metrics }: { title: string; metrics: string[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      <ul className="space-y-1">
        {metrics.map((m, i) => (
          <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-nw-accent" />
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}
