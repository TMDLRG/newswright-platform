'use client';

import { useState, useEffect } from 'react';
import AuthGate from '@/components/AuthGate';
import Link from 'next/link';

interface VerificationItem {
  variableId: string;
  variableName: string;
  value: string;
  category: string;
  occurrenceCount: number;
  documentCount: number;
  documents: string[];
  status: 'ok' | 'warning' | 'info';
  note: string;
}

interface VerifyResult {
  summary: {
    totalVariables: number;
    ok: number;
    warnings: number;
    info: number;
    totalOccurrences: number;
    totalDocuments: number;
  };
  results: VerificationItem[];
}

const CATEGORY_LABELS: Record<string, string> = {
  A: 'Investment & Valuation',
  B: 'Revenue & Growth',
  C: 'Pricing Model',
  D: 'Use of Funds',
  E: 'Monthly Burn & Runway',
  F: 'Market Sizing',
  G: 'Pilot & Operational',
  H: 'Return Analysis',
  I: 'Exit & Valuation',
  J: 'Technical & Product',
};

function VerificationContent() {
  const [data, setData] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'ok' | 'warning' | 'info'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  function runVerification() {
    setLoading(true);
    setData(null);
    fetch('/api/verify')
      .then(r => r.json())
      .then(result => {
        setData(result);
        setLoading(false);
      });
  }

  useEffect(() => {
    runVerification();
  }, []);

  const filtered = data?.results.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    return true;
  }) || [];

  return (
    <div>
      <Link href="/edit" className="text-xs text-nw-accent hover:underline">
        &larr; Edit Dashboard
      </Link>
      <h1 className="text-xl font-bold text-nw-primary mt-1 mb-1">Verification Runner</h1>
      <p className="text-sm text-gray-500 mb-6">
        Cross-reference check across all 21 documents for variable consistency.
      </p>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-6 gap-3 mb-6">
          <SummaryCard
            label="Variables"
            value={data.summary.totalVariables}
            color="text-gray-700"
          />
          <SummaryCard
            label="Consistent"
            value={data.summary.ok}
            color="text-green-600"
          />
          <SummaryCard
            label="Warnings"
            value={data.summary.warnings}
            color="text-amber-600"
          />
          <SummaryCard
            label="Info"
            value={data.summary.info}
            color="text-blue-600"
          />
          <SummaryCard
            label="Cross-Refs"
            value={data.summary.totalOccurrences}
            color="text-purple-600"
          />
          <SummaryCard
            label="Documents"
            value={data.summary.totalDocuments}
            color="text-gray-600"
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={runVerification}
          disabled={loading}
          className="px-4 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Running...' : 'Re-run Verification'}
        </button>

        {data && (
          <>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Status:</span>
              {(['all', 'ok', 'warning', 'info'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-2 py-1 rounded ${
                    filter === f
                      ? 'bg-nw-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'ok' ? 'OK' : f === 'warning' ? 'Warnings' : 'Info'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="all">All</option>
                {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                  <option key={cat} value={cat}>{cat}: {label}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-gray-400">
              Showing {filtered.length} of {data.results.length}
            </span>
          </>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <div className="text-sm text-gray-400">Scanning all documents for variable consistency...</div>
        </div>
      )}

      {/* Results Table */}
      {data && !loading && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-3 py-2 text-xs font-semibold text-gray-400 w-10"></th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-400 w-14">ID</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-400">Variable</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-400 w-36">Value</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-400 w-16 text-center">Refs</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-400 w-16 text-center">Docs</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-400">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((item) => (
                <tr key={item.variableId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-center">
                    <StatusDot status={item.status} />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs font-bold text-blue-600">
                    {item.variableId}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{item.variableName}</td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-600">{item.value}</td>
                  <td className="px-3 py-2 text-center text-xs text-gray-500">
                    {item.occurrenceCount}
                  </td>
                  <td className="px-3 py-2 text-center text-xs text-gray-500">
                    {item.documentCount}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-400">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-3">
      <div className={`text-xl font-bold ${color}`}>{value.toLocaleString()}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

function StatusDot({ status }: { status: 'ok' | 'warning' | 'info' }) {
  const colors = {
    ok: 'bg-green-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-400',
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />
  );
}

export default function VerifyPage() {
  return (
    <AuthGate>
      <VerificationContent />
    </AuthGate>
  );
}
