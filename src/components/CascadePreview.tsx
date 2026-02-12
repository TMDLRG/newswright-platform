'use client';

interface CascadeChange {
  documentId: string;
  documentFilename: string;
  line: number;
  oldText: string;
  newText: string;
  context: string;
  variableId: string;
  isDerived: boolean;
}

interface PreviewData {
  variableChanges: Array<{
    variableId: string;
    oldValue: string;
    newValue: string;
    isDerived: boolean;
  }>;
  documentChanges: CascadeChange[];
  affectedDocumentCount: number;
  totalChangeCount: number;
}

interface CascadePreviewProps {
  preview: PreviewData | null;
  loading: boolean;
  onApply: () => void;
  onCancel: () => void;
  applying: boolean;
}

export default function CascadePreview({
  preview,
  loading,
  onApply,
  onCancel,
  applying,
}: CascadePreviewProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Computing cascade...
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-sm text-gray-400">
          Edit a variable value to see the cascade preview.
        </div>
      </div>
    );
  }

  if (preview.totalChangeCount === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-sm text-gray-400">
          No changes detected. The value may not appear in any documents.
        </div>
        <button
          onClick={onCancel}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Group changes by document
  const byDoc = new Map<string, CascadeChange[]>();
  for (const change of preview.documentChanges) {
    const key = change.documentId;
    if (!byDoc.has(key)) byDoc.set(key, []);
    byDoc.get(key)!.push(change);
  }

  const directChanges = preview.variableChanges.filter(v => !v.isDerived);
  const derivedChanges = preview.variableChanges.filter(v => v.isDerived);

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-amber-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-amber-800">Cascade Preview</h3>
            <p className="text-xs text-amber-600 mt-0.5">
              {preview.totalChangeCount} changes across {preview.affectedDocumentCount} documents
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onApply}
              disabled={applying}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {applying ? 'Applying...' : 'Apply Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Variable Changes Summary */}
      <div className="px-4 py-3 border-b">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Variable Changes
        </h4>
        <div className="space-y-1">
          {directChanges.map((vc) => (
            <div key={vc.variableId} className="flex items-center gap-2 text-xs">
              <span className="font-mono font-bold text-blue-600 w-8">{vc.variableId}</span>
              <span className="text-red-500 line-through">{vc.oldValue}</span>
              <span className="text-gray-300">&rarr;</span>
              <span className="text-green-600 font-medium">{vc.newValue}</span>
            </div>
          ))}
        </div>
        {derivedChanges.length > 0 && (
          <div className="mt-2">
            <h5 className="text-xs text-gray-400 mb-1">Auto-recalculated:</h5>
            <div className="space-y-1">
              {derivedChanges.map((vc) => (
                <div key={vc.variableId} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-purple-600 w-8">{vc.variableId}</span>
                  <span className="text-red-400 line-through">{vc.oldValue}</span>
                  <span className="text-gray-300">&rarr;</span>
                  <span className="text-purple-600 font-medium">{vc.newValue}</span>
                  <span className="text-gray-300 italic">derived</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Document Changes */}
      <div className="max-h-[50vh] overflow-y-auto">
        {Array.from(byDoc.entries()).map(([docId, changes]) => (
          <div key={docId} className="border-b last:border-b-0">
            <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">
                <span className="font-mono text-gray-400">#{docId}</span>{' '}
                {changes[0].documentFilename}
              </span>
              <span className="text-xs text-gray-400">{changes.length} changes</span>
            </div>
            <div className="divide-y divide-gray-100">
              {changes.slice(0, 10).map((change, i) => (
                <div key={i} className="px-4 py-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <span className="font-mono">L{change.line}</span>
                    <span className="font-mono text-blue-500">{change.variableId}</span>
                    {change.isDerived && (
                      <span className="text-purple-400 italic">derived</span>
                    )}
                  </div>
                  <div className="text-xs font-mono">
                    <div className="bg-red-50 text-red-700 px-2 py-0.5 rounded-t">
                      - {change.oldText.trim()}
                    </div>
                    <div className="bg-green-50 text-green-700 px-2 py-0.5 rounded-b">
                      + {change.newText.trim()}
                    </div>
                  </div>
                </div>
              ))}
              {changes.length > 10 && (
                <div className="px-4 py-2 text-xs text-gray-400">
                  ...and {changes.length - 10} more changes
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
