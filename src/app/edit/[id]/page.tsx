'use client';

import { useState, useEffect, useCallback, use } from 'react';
import AuthGate, { useAuth } from '@/components/AuthGate';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Link from 'next/link';

interface DocData {
  id: string;
  filename: string;
  title: string;
  subtitle?: string;
  version: string;
  date: string;
  status?: string;
  tier: number;
  tierLabel: string;
  raw: string;
}

function DocumentEditorContent({ id }: { id: string }) {
  const { token } = useAuth();
  const [doc, setDoc] = useState<DocData | null>(null);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    fetch(`/api/documents?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) return;
        setDoc(data);
        setContent(data.raw);
        setOriginalContent(data.raw);
        setLoading(false);
      });
  }, [id]);

  const hasChanges = content !== originalContent;

  const saveDocument = useCallback(async () => {
    if (!doc || !hasChanges) return;
    setSaving(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: doc.id, content }),
      });
      const data = await res.json();
      if (data.success) {
        setOriginalContent(content);
        setSaveMsg('Saved successfully');
        setTimeout(() => setSaveMsg(''), 3000);
      } else {
        setSaveMsg(`Error: ${data.error || 'Save failed'}`);
      }
    } catch {
      setSaveMsg('Error: Network failure');
    } finally {
      setSaving(false);
    }
  }, [doc, content, hasChanges, token]);

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDocument();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveDocument]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400 text-sm">Loading document...</div>;
  }

  if (!doc) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-bold text-gray-400">Document not found</h1>
        <Link href="/edit" className="text-nw-accent hover:underline mt-2 inline-block text-sm">
          Back to Edit Dashboard
        </Link>
      </div>
    );
  }

  const lineCount = content.split('\n').length;
  const charCount = content.length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href="/edit" className="text-xs text-nw-accent hover:underline">
            &larr; Edit Dashboard
          </Link>
          <h1 className="text-xl font-bold text-nw-primary mt-1">
            <span className="text-gray-400 font-mono text-sm mr-2">#{doc.id}</span>
            {doc.title}
            {doc.subtitle && <span className="text-gray-400 ml-2">— {doc.subtitle}</span>}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-xs ${saveMsg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
              {saveMsg}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {lineCount} lines &middot; {(charCount / 1024).toFixed(1)}KB
          </span>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-gray-400 hover:text-gray-600 border px-2 py-1 rounded"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={() => {
              setContent(originalContent);
            }}
            disabled={!hasChanges}
            className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-30"
          >
            Revert
          </button>
          <button
            onClick={saveDocument}
            disabled={!hasChanges || saving}
            className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : hasChanges ? 'Save' : 'No Changes'}
          </button>
        </div>
      </div>

      {/* Change Warning */}
      {hasChanges && (
        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
          Unsaved changes. If this document contains synchronized variables, use the{' '}
          <Link href="/variables" className="text-blue-600 underline">
            Variable Editor
          </Link>{' '}
          to propagate changes across all documents automatically.
        </div>
      )}

      {/* Editor + Preview */}
      <div className={`flex gap-4 ${showPreview ? '' : ''}`}>
        {/* Editor */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'}`}>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-3 py-1.5 border-b bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Markdown Source</span>
              <span className="text-xs text-gray-400">{doc.filename}</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[70vh] p-4 font-mono text-xs text-gray-800 resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-3 py-1.5 border-b bg-gray-50">
                <span className="text-xs font-medium text-gray-500">Live Preview</span>
              </div>
              <div className="p-4 h-[70vh] overflow-y-auto">
                <MarkdownRenderer content={content} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGate>
      <DocumentEditorContent id={id} />
    </AuthGate>
  );
}
