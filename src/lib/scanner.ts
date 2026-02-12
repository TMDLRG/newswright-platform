/**
 * NewsWright Investor Platform — Cross-Document Scanner
 *
 * Scans all 21 documents for occurrences of registry variables.
 * Builds a map of where each variable appears across the package.
 */

import { ParsedDocument, Variable, Occurrence } from './types';
import { RegistryResult } from './registry';
import { extractTables } from './parser';

// ─── Types ─────────────────────────────────────────────────────────

export interface ScanResult {
  byVariable: Record<string, Occurrence[]>;
  byDocument: Record<string, Occurrence[]>;
  totalOccurrences: number;
}

// ─── Pattern Building ──────────────────────────────────────────────

/**
 * Build regex patterns that match all display formats of a variable's value.
 */
export function buildSearchPatterns(variable: Variable): RegExp[] {
  const patterns: RegExp[] = [];
  const value = variable.value;
  const pv = variable.parsedValue;

  if (pv.type === 'currency' && pv.numeric !== undefined) {
    const num = pv.numeric;
    // Exact formatted string (escape special chars)
    const escaped = escapeRegex(value);
    patterns.push(new RegExp(escaped, 'g'));

    // Always match bare $X or $X,XXX (the core dollar amount)
    if (num >= 1000) {
      const formatted = formatWithCommas(num);
      patterns.push(new RegExp(`\\$${escapeRegex(formatted)}(?!\\d)`, 'g'));
    } else {
      // For values under $1,000, match $249 but not $2490
      patterns.push(new RegExp(`\\$${num}(?!\\d)`, 'g'));
    }

    // Match $X/mo or $X/month variants
    if (value.includes('/mo') || value.includes('/month')) {
      const numStr = num >= 1000 ? formatWithCommas(num) : String(num);
      patterns.push(new RegExp(`\\$${escapeRegex(numStr)}/mo(?:nth)?`, 'g'));
    }

    // $X.XM / $XK shorthand
    if (num >= 1_000_000) {
      const mVal = num / 1_000_000;
      const mStr = mVal % 1 === 0 ? String(mVal) : mVal.toFixed(1);
      // Remove trailing .0
      const clean = mStr.replace(/\.0$/, '');
      patterns.push(new RegExp(`\\$${escapeRegex(clean)}M`, 'g'));
    }
    if (num >= 1000 && num < 1_000_000) {
      const kVal = num / 1000;
      const kStr = kVal % 1 === 0 ? String(kVal) : kVal.toFixed(0);
      patterns.push(new RegExp(`\\$${escapeRegex(kStr)}K`, 'gi'));
    }

    // Also match just the number with commas (e.g., "500,000" without $)
    if (num >= 1000) {
      patterns.push(new RegExp(`(?<!\\d)${escapeRegex(formatWithCommas(num))}(?!\\d)`, 'g'));
    }
  } else if (pv.type === 'integer' && pv.numeric !== undefined) {
    const num = pv.numeric;
    // Match the formatted integer with commas
    const formatted = formatWithCommas(num);
    patterns.push(new RegExp(`(?<!\\$)${escapeRegex(formatted)}(?!\\d)`, 'g'));
    // Also match without commas if it's a simple number
    if (num > 999) {
      patterns.push(new RegExp(`(?<!\\d)${num}(?!\\d)`, 'g'));
    }
  } else if (pv.type === 'range') {
    // Match the range as-is
    const escaped = escapeRegex(value);
    patterns.push(new RegExp(escaped, 'g'));
  } else if (pv.type === 'percentage' && pv.numeric !== undefined) {
    const pctStr = (pv.numeric * 100).toString();
    patterns.push(new RegExp(`${escapeRegex(pctStr)}\\s*%`, 'g'));
  } else if (pv.type === 'decimal' && pv.numeric !== undefined) {
    // Match multipliers like "10x"
    const numStr = pv.numeric.toString();
    patterns.push(new RegExp(`${escapeRegex(numStr)}x`, 'gi'));
  } else {
    // Text: try exact match
    if (value.length > 3) {
      patterns.push(new RegExp(escapeRegex(value), 'g'));
    }
  }

  return deduplicatePatterns(patterns);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatWithCommas(num: number): string {
  return num.toLocaleString('en-US');
}

function deduplicatePatterns(patterns: RegExp[]): RegExp[] {
  const seen = new Set<string>();
  return patterns.filter(p => {
    const key = p.source + p.flags;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Document Scanning ─────────────────────────────────────────────

/**
 * Scan all documents for occurrences of all registry variables.
 */
export function scanAllDocuments(
  documents: ParsedDocument[],
  registry: RegistryResult
): ScanResult {
  const byVariable: Record<string, Occurrence[]> = {};
  const byDocument: Record<string, Occurrence[]> = {};
  let totalOccurrences = 0;

  // Initialize
  for (const v of registry.variables) {
    byVariable[v.id] = [];
  }
  for (const doc of documents) {
    byDocument[doc.id] = [];
  }

  // For each variable, build patterns and scan all docs
  for (const variable of registry.variables) {
    const patterns = buildSearchPatterns(variable);
    if (patterns.length === 0) continue;

    // Skip scanning the Master Assumptions Log itself for occurrences
    // (it's the source, not a "consumer" of the data)
    for (const doc of documents) {
      if (doc.id === '14') continue; // Master Assumptions Log

      const lines = doc.raw.split('\n');
      const tableRanges = getTableLineRanges(doc);

      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];

        for (const pattern of patterns) {
          // Reset lastIndex for global patterns
          pattern.lastIndex = 0;
          if (pattern.test(line)) {
            const inTable = isInTable(lineNum, tableRanges);
            const occ: Occurrence = {
              documentId: doc.id,
              documentFilename: doc.filename,
              line: lineNum,
              context: line.trim(),
              inTable,
            };

            byVariable[variable.id].push(occ);
            byDocument[doc.id].push(occ);
            totalOccurrences++;

            // Only count first match per line per variable
            break;
          }
        }
      }
    }
  }

  // Deduplicate: same variable, same document, same line
  for (const varId of Object.keys(byVariable)) {
    byVariable[varId] = deduplicateOccurrences(byVariable[varId]);
  }

  // Rebuild byDocument from deduplicated byVariable
  for (const docId of Object.keys(byDocument)) {
    byDocument[docId] = [];
  }
  totalOccurrences = 0;
  for (const [varId, occs] of Object.entries(byVariable)) {
    for (const occ of occs) {
      byDocument[occ.documentId].push(occ);
      totalOccurrences++;
    }
  }

  return { byVariable, byDocument, totalOccurrences };
}

function getTableLineRanges(doc: ParsedDocument): Array<[number, number]> {
  return doc.tables.map(t => [t.startLine, t.endLine] as [number, number]);
}

function isInTable(lineNum: number, ranges: Array<[number, number]>): boolean {
  return ranges.some(([start, end]) => lineNum >= start && lineNum <= end);
}

function deduplicateOccurrences(occs: Occurrence[]): Occurrence[] {
  const seen = new Set<string>();
  return occs.filter(o => {
    const key = `${o.documentId}:${o.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
