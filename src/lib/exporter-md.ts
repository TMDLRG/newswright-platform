/**
 * NewsWright Investor Platform — Markdown Exporter
 *
 * Exports documents back to .md format with perfect round-trip fidelity.
 * Since we store the raw content and use line-level replacement for cascade,
 * the exporter simply returns the (possibly modified) raw content.
 */

import { ParsedDocument, CascadePreview } from './types';
import { applyCascade } from './cascade';

// ─── Single Document Export ──────────────────────────────────────

/**
 * Export a parsed document back to markdown.
 * Returns the raw content exactly as stored — this guarantees
 * byte-for-byte round-trip fidelity for unmodified documents.
 */
export function exportMarkdown(doc: ParsedDocument): string {
  return doc.raw;
}

// ─── Bulk Export ─────────────────────────────────────────────────

export interface ExportedDocument {
  filename: string;
  content: string;
}

/**
 * Export all documents to markdown.
 * Returns a map of documentId → { filename, content }.
 */
export function exportAllMarkdown(
  documents: ParsedDocument[]
): Record<string, ExportedDocument> {
  const results: Record<string, ExportedDocument> = {};

  for (const doc of documents) {
    results[doc.id] = {
      filename: doc.filename,
      content: exportMarkdown(doc),
    };
  }

  return results;
}

// ─── Cascade + Export ────────────────────────────────────────────

/**
 * Apply a cascade preview and export the affected documents.
 * Returns a map of documentId → new markdown content.
 * Only includes documents that were actually changed.
 */
export function applyChangesAndExport(
  preview: CascadePreview,
  documents: ParsedDocument[]
): Record<string, string> {
  return applyCascade(preview, documents);
}
