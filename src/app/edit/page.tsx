'use client';

import Link from 'next/link';
import AuthGate, { useAuth } from '@/components/AuthGate';
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

interface VariableSummary {
  variables: Array<{
    id: string;
    category: string;
    name: string;
    value: string;
    occurrenceCount: number;
  }>;
}

function EditDashboard() {
  const { logout, token } = useAuth();
  const [documents, setDocuments] = useState<DocSummary[]>([]);
  const [varData, setVarData] = useState<VariableSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/documents').then(r => r.json()),
      fetch('/api/variables').then(r => r.json()),
    ]).then(([docs, vars]) => {
      setDocuments(docs);
      setVarData(vars);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-400 text-sm">Loading dashboard...</div>;
  }

  const totalVars = varData?.variables.length || 0;
  const totalOccurrences = varData?.variables.reduce((s, v) => s + v.occurrenceCount, 0) || 0;
  const highConfidence = varData?.variables.filter(v => {
    // We don't have confidence in the summary, so just count all
    return true;
  }).length || 0;

  return (
    <div>
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nw-primary">Partner Edit Mode</h1>
          <p className="text-sm text-gray-500 mt-1">
            Edit variables, modify documents, export packages, and run verification.
          </p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Ephemeral Edit Warning (shown on hosted deployments) */}
      {typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-lg leading-none">&#9888;</span>
            <div>
              <div className="text-sm font-medium text-amber-800">Hosted Mode — Edits are session-only</div>
              <div className="text-xs text-amber-600 mt-0.5">
                Changes persist during your session but reset when the server restarts.
                Use <a href="/export" className="underline font-medium">Export Manager</a> to download your modified package.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Documents" value={documents.length.toString()} />
        <StatCard label="Variables" value={totalVars.toString()} />
        <StatCard label="Cross-References" value={totalOccurrences.toLocaleString()} />
        <StatCard label="Total Lines" value={documents.reduce((s, d) => s + d.lineCount, 0).toLocaleString()} />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <ActionCard
          href="/variables"
          title="Variable Editor"
          description="Edit synchronized variables with real-time cascade preview"
          icon="V"
          color="bg-blue-600"
        />
        <ActionCard
          href="/edit/docs"
          title="Document Editor"
          description="Edit individual document content with live markdown preview"
          icon="D"
          color="bg-emerald-600"
        />
        <ActionCard
          href="/export"
          title="Export Manager"
          description="Export documents as .md, .docx, or complete package zip"
          icon="E"
          color="bg-purple-600"
        />
        <ActionCard
          href="/edit/verify"
          title="Verification"
          description="Run cross-reference check to detect inconsistencies"
          icon="C"
          color="bg-amber-600"
        />
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold text-gray-700">All Documents</h2>
        </div>
        <div className="divide-y">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/edit/${doc.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-400 w-6">#{doc.id}</span>
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {doc.title}
                    {doc.subtitle && <span className="text-gray-400 ml-1">— {doc.subtitle}</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {doc.sectionCount} sections &middot; {doc.tableCount} tables &middot; {doc.lineCount} lines
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
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="text-2xl font-bold text-nw-primary">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function ActionCard({
  href, title, description, icon, color,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow group"
    >
      <div className={`w-10 h-10 rounded-lg ${color} text-white flex items-center justify-center text-lg font-bold mb-3`}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-800 group-hover:text-nw-primary transition-colors">
        {title}
      </h3>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </Link>
  );
}

export default function EditPage() {
  return (
    <AuthGate>
      <EditDashboard />
    </AuthGate>
  );
}
