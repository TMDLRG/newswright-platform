'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGate, { useAuth } from '@/components/AuthGate';
import CascadePreview from '@/components/CascadePreview';
import Link from 'next/link';

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

interface VariableInfo {
  id: string;
  category: string;
  name: string;
  value: string;
  parsedValue: { type: string; numeric?: number };
  confidence: number;
  occurrenceCount: number;
}

interface PreviewData {
  variableChanges: Array<{
    variableId: string;
    oldValue: string;
    newValue: string;
    isDerived: boolean;
  }>;
  documentChanges: Array<{
    documentId: string;
    documentFilename: string;
    line: number;
    oldText: string;
    newText: string;
    context: string;
    variableId: string;
    isDerived: boolean;
  }>;
  affectedDocumentCount: number;
  totalChangeCount: number;
}

function VariableEditorContent() {
  const { token } = useAuth();
  const [variables, setVariables] = useState<VariableInfo[]>([]);
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [activeCategory, setActiveCategory] = useState('A');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch('/api/variables')
      .then(r => r.json())
      .then(data => {
        setVariables(data.variables);
        setCategories(data.byCategory);
        setLoading(false);
      });
  }, []);

  const fetchPreview = useCallback(async (changes: Record<string, string>) => {
    if (Object.keys(changes).length === 0) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/cascade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      });
      const data = await res.json();
      setPreview(data);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  function startEdit(v: VariableInfo) {
    setEditingId(v.id);
    setEditValue(pendingChanges[v.id] || v.value);
  }

  function confirmEdit(v: VariableInfo) {
    const newVal = editValue.trim();
    if (newVal && newVal !== v.value) {
      const next = { ...pendingChanges, [v.id]: newVal };
      setPendingChanges(next);
      fetchPreview(next);
    } else {
      // Revert — remove from pending if same as original
      const next = { ...pendingChanges };
      delete next[v.id];
      setPendingChanges(next);
      if (Object.keys(next).length > 0) {
        fetchPreview(next);
      } else {
        setPreview(null);
      }
    }
    setEditingId(null);
    setEditValue('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
  }

  async function applyChanges() {
    if (!preview || Object.keys(pendingChanges).length === 0) return;
    setApplying(true);
    try {
      const res = await fetch('/api/cascade', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ changes: pendingChanges }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Applied ${data.changeCount} changes to ${data.affectedDocuments} documents.`);
        setPendingChanges({});
        setPreview(null);
        // Reload variables
        const fresh = await fetch('/api/variables').then(r => r.json());
        setVariables(fresh.variables);
        setCategories(fresh.byCategory);
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch {
      // Error handled in UI
    } finally {
      setApplying(false);
    }
  }

  function cancelAllChanges() {
    setPendingChanges({});
    setPreview(null);
    setEditingId(null);
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400 text-sm">Loading variables...</div>;
  }

  const catVarIds = categories[activeCategory] || [];
  const catVars = catVarIds
    .map(id => variables.find(v => v.id === id))
    .filter(Boolean) as VariableInfo[];

  const pendingCount = Object.keys(pendingChanges).length;

  return (
    <div className="flex gap-6">
      {/* Left: Variable Table */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Link href="/edit" className="text-xs text-nw-accent hover:underline">
              &larr; Edit Dashboard
            </Link>
            <h1 className="text-xl font-bold text-nw-primary mt-1">Variable Editor</h1>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-600 font-medium">
                {pendingCount} pending change{pendingCount !== 1 ? 's' : ''}
              </span>
              <button
                onClick={cancelAllChanges}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                Discard all
              </button>
            </div>
          )}
        </div>

        {successMsg && (
          <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {successMsg}
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-1 mb-4 flex-wrap">
          {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
            const hasPending = (categories[cat] || []).some(id => id in pendingChanges);
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors relative ${
                  activeCategory === cat
                    ? 'bg-nw-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}: {label}
                {hasPending && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Variable Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-3 py-2 text-xs font-semibold text-gray-400 w-16">ID</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-400">Name</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-400 w-48">Value</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-400 w-16 text-center">Type</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-400 w-16 text-center">Refs</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-400 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {catVars.map((v) => {
                const isPending = v.id in pendingChanges;
                const isEditing = editingId === v.id;
                const displayValue = isPending ? pendingChanges[v.id] : v.value;

                return (
                  <tr
                    key={v.id}
                    className={`${isPending ? 'bg-amber-50' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <td className="px-3 py-2 font-mono text-xs font-bold text-blue-600">
                      {v.id}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{v.name}</td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmEdit(v);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`font-mono text-xs cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded ${
                            isPending ? 'text-amber-700 font-semibold' : 'text-gray-800'
                          }`}
                          onClick={() => startEdit(v)}
                          title="Click to edit"
                        >
                          {displayValue}
                          {isPending && (
                            <span className="ml-1 text-gray-400 line-through text-[10px]">
                              was: {v.value}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        v.parsedValue.type === 'currency' ? 'bg-green-100 text-green-700' :
                        v.parsedValue.type === 'percentage' ? 'bg-purple-100 text-purple-700' :
                        v.parsedValue.type === 'integer' ? 'bg-blue-100 text-blue-700' :
                        v.parsedValue.type === 'range' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {v.parsedValue.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-gray-500">
                      {v.occurrenceCount}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {isEditing ? (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => confirmEdit(v)}
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(v)}
                          className="text-xs text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {catVars.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-gray-400 text-sm">
                    No variables in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: Cascade Preview */}
      <div className="hidden lg:block w-96 flex-shrink-0">
        <div className="sticky top-20">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Cascade Preview
          </h2>
          <CascadePreview
            preview={preview}
            loading={previewLoading}
            onApply={applyChanges}
            onCancel={cancelAllChanges}
            applying={applying}
          />
        </div>
      </div>
    </div>
  );
}

export default function VariablesPage() {
  return (
    <AuthGate>
      <VariableEditorContent />
    </AuthGate>
  );
}
