import { NextResponse } from 'next/server';
import { getManager } from '@/lib/server';
import { buildSearchPatterns } from '@/lib/scanner';

/**
 * GET /api/verify — Run cross-reference verification
 * Returns a report of all variables and where they appear,
 * flagging any potential inconsistencies.
 */
export async function GET() {
  const manager = getManager();
  const registry = manager.getRegistry();
  const scan = manager.getScanResult();
  const documents = manager.getAll();

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

  const results: VerificationItem[] = [];

  for (const variable of registry.variables) {
    const occurrences = scan.byVariable[variable.id] || [];
    const uniqueDocs = new Set(occurrences.map(o => o.documentId));
    const patterns = buildSearchPatterns(variable);

    let status: 'ok' | 'warning' | 'info' = 'ok';
    let note = '';

    if (occurrences.length === 0 && patterns.length > 0) {
      status = 'info';
      note = 'No occurrences found outside Master Assumptions Log';
    } else if (occurrences.length === 0 && patterns.length === 0) {
      status = 'info';
      note = 'No searchable patterns (value too short or text-only)';
    } else if (uniqueDocs.size < 2 && variable.parsedValue.type !== 'text') {
      status = 'info';
      note = `Only found in ${uniqueDocs.size} document(s)`;
    }

    results.push({
      variableId: variable.id,
      variableName: variable.name,
      value: variable.value,
      category: variable.category,
      occurrenceCount: occurrences.length,
      documentCount: uniqueDocs.size,
      documents: Array.from(uniqueDocs),
      status,
      note,
    });
  }

  // Summary stats
  const okCount = results.filter(r => r.status === 'ok').length;
  const warnCount = results.filter(r => r.status === 'warning').length;
  const infoCount = results.filter(r => r.status === 'info').length;
  const totalOccurrences = scan.totalOccurrences;

  return NextResponse.json({
    summary: {
      totalVariables: results.length,
      ok: okCount,
      warnings: warnCount,
      info: infoCount,
      totalOccurrences,
      totalDocuments: documents.length,
    },
    results,
  });
}
