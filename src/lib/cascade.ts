/**
 * NewsWright Investor Platform — Cascade Engine
 *
 * Propagates variable changes across all 21 documents.
 * Preview-first: generates a complete change set before any writes.
 */

import {
  ParsedDocument,
  Variable,
  CascadeChange,
  CascadePreview,
  MasterLogUpdate,
} from './types';
import { RegistryResult } from './registry';
import { ScanResult, buildSearchPatterns } from './scanner';
import { parseFinancialValue } from './parser';
import {
  FORMULAS,
  KNOWN_NUMERICS,
  buildVarMap,
  computeFormula,
  getDownstreamFormulas,
} from './formulas';

// ─── Value Formatting ────────────────────────────────────────────

export function formatCurrencyValue(num: number): string {
  return '$' + num.toLocaleString('en-US');
}

export function formatIntegerValue(num: number): string {
  return num.toLocaleString('en-US');
}

export function formatPercentageValue(num: number): string {
  return (num * 100).toFixed(1) + '%';
}

/**
 * Format a numeric value matching the style of the original variable value.
 */
function formatLikeOriginal(num: number, originalVariable: Variable): string {
  const pv = originalVariable.parsedValue;

  switch (pv.type) {
    case 'currency': {
      if (num >= 1_000_000) {
        const m = num / 1_000_000;
        const mStr = m % 1 === 0 ? String(m) : m.toFixed(1);
        // Check if original used $XM format
        if (originalVariable.value.match(/\$[\d.]+M/)) {
          return `$${mStr}M`;
        }
      }
      return formatCurrencyValue(num);
    }
    case 'integer':
      return formatIntegerValue(num);
    case 'percentage':
      return formatPercentageValue(num);
    case 'decimal':
      return num.toString();
    default:
      return num.toString();
  }
}

// ─── Input Parsing ───────────────────────────────────────────────

/**
 * Parse a user-supplied new value string into a numeric.
 * Handles: "$550/month", "9,000", "$60M", "15%", "8x"
 */
function parseNewValue(newValueStr: string): { numeric: number; display: string } | null {
  const pv = parseFinancialValue(newValueStr);
  if (pv.numeric !== undefined) {
    return { numeric: pv.numeric, display: newValueStr };
  }
  // Try stripping suffixes
  const stripped = newValueStr.replace(/\/mo(?:nth)?.*$/i, '').trim();
  const pv2 = parseFinancialValue(stripped);
  if (pv2.numeric !== undefined) {
    return { numeric: pv2.numeric, display: newValueStr };
  }
  return null;
}

// ─── Cascade Preview Generator ───────────────────────────────────

/**
 * Generate a preview of all changes that would result from changing one or more variables.
 *
 * @param changes - Map of variable ID → new value string (e.g., { F4: '9,000' })
 * @param registry - Current variable registry
 * @param documents - All parsed documents
 * @param scanResult - Pre-computed scan of all variable occurrences
 */
export function generateCascadePreview(
  changes: Record<string, string>,
  registry: RegistryResult,
  documents: ParsedDocument[],
  scanResult: ScanResult
): CascadePreview {
  const variableChanges: CascadePreview['variableChanges'] = [];
  const documentChanges: CascadeChange[] = [];
  const masterLogUpdates: MasterLogUpdate[] = [];

  // Build the current variable map
  const currentVars = buildVarMap(registry);

  // Track all value replacements: variableId → { oldValue, newValue, oldNumeric, newNumeric }
  const replacements: Map<string, {
    oldValue: string;
    newValue: string;
    oldNumeric: number;
    newNumeric: number;
    isDerived: boolean;
    variable: Variable;
  }> = new Map();

  // 1. Process direct (user-specified) changes
  for (const [varId, newValueStr] of Object.entries(changes)) {
    const variable = registry.byId[varId];
    if (!variable) continue;

    const parsed = parseNewValue(newValueStr);
    if (!parsed) continue;

    const oldNumeric = currentVars[varId];
    if (oldNumeric === undefined) continue;

    replacements.set(varId, {
      oldValue: variable.value,
      newValue: newValueStr,
      oldNumeric,
      newNumeric: parsed.numeric,
      isDerived: false,
      variable,
    });

    variableChanges.push({
      variableId: varId,
      oldValue: variable.value,
      newValue: newValueStr,
      isDerived: false,
    });

    // Update the var map for formula recalculation
    currentVars[varId] = parsed.numeric;
  }

  // 2. Compute derived value changes through the formula engine
  for (const [varId] of replacements) {
    const downstream = getDownstreamFormulas(varId);
    for (const formula of downstream) {
      const newResult = formula.compute(currentVars);
      const outputVar = registry.byId[formula.output];
      if (!outputVar) continue;

      const oldNumeric = outputVar.parsedValue.numeric;
      if (oldNumeric === undefined) continue;

      // Skip if the value didn't actually change
      if (Math.abs(newResult - oldNumeric) < 0.01) continue;

      // Skip if we already have this replacement
      if (replacements.has(formula.output)) continue;

      const newFormatted = formatLikeOriginal(newResult, outputVar);

      replacements.set(formula.output, {
        oldValue: outputVar.value,
        newValue: newFormatted,
        oldNumeric,
        newNumeric: newResult,
        isDerived: true,
        variable: outputVar,
      });

      variableChanges.push({
        variableId: formula.output,
        oldValue: outputVar.value,
        newValue: newFormatted,
        isDerived: true,
      });
    }
  }

  // 3. Generate document-level changes from scan occurrences
  for (const [varId, replacement] of replacements) {
    const occurrences = scanResult.byVariable[varId] || [];

    for (const occ of occurrences) {
      const doc = documents.find(d => d.id === occ.documentId);
      if (!doc) continue;

      const lines = doc.raw.split('\n');
      const oldLine = lines[occ.line];
      if (!oldLine) continue;

      // Generate the replacement line
      const newLine = replaceValueInLine(
        oldLine,
        replacement.variable,
        replacement.oldNumeric,
        replacement.newNumeric
      );

      if (newLine !== oldLine) {
        documentChanges.push({
          documentId: occ.documentId,
          documentFilename: occ.documentFilename,
          line: occ.line,
          oldText: oldLine,
          newText: newLine,
          context: getContext(lines, occ.line),
          variableId: varId,
          isDerived: replacement.isDerived,
        });
      }
    }

    // Generate master log update
    const masterDoc = documents.find(d => d.id === '14');
    if (masterDoc) {
      const masterLines = masterDoc.raw.split('\n');
      for (let i = 0; i < masterLines.length; i++) {
        const line = masterLines[i];
        // Find the table row for this variable in the master log
        if (line.trim().startsWith('|') && line.includes(varId)) {
          const cells = line.split('|').map(c => c.trim());
          if (cells.some(c => c === varId)) {
            masterLogUpdates.push({
              variableId: varId,
              oldValue: replacement.oldValue,
              newValue: replacement.newValue,
              line: i,
            });
            break;
          }
        }
      }
    }
  }

  // Deduplicate document changes (same doc, same line)
  const deduped = deduplicateChanges(documentChanges);

  const affectedDocs = new Set(deduped.map(c => c.documentId));

  return {
    variableChanges,
    documentChanges: deduped,
    masterLogUpdates,
    affectedDocumentCount: affectedDocs.size,
    totalChangeCount: deduped.length,
  };
}

// ─── Line-Level Replacement ──────────────────────────────────────

/**
 * Replace a variable's value in a line of text, preserving surrounding formatting.
 */
function replaceValueInLine(
  line: string,
  variable: Variable,
  oldNumeric: number,
  newNumeric: number
): string {
  const pv = variable.parsedValue;
  let result = line;

  if (pv.type === 'currency') {
    // Try all display formats of the old value and replace with the matching format of new value
    const oldFormats = getCurrencyFormats(oldNumeric);
    const newFormats = getCurrencyFormats(newNumeric);

    for (let i = 0; i < oldFormats.length; i++) {
      const oldStr = oldFormats[i];
      const newStr = newFormats[i];
      if (result.includes(oldStr)) {
        result = result.replace(oldStr, newStr);
        return result;
      }
    }

    // Also try matching the bare number in dollar context (e.g., "$249")
    if (oldNumeric < 1000) {
      const oldBare = `$${oldNumeric}`;
      const newBare = `$${newNumeric}`;
      if (result.includes(oldBare)) {
        result = result.replace(oldBare, newBare);
        return result;
      }
    }
  } else if (pv.type === 'integer') {
    // Try comma-formatted and plain
    const oldFormatted = oldNumeric.toLocaleString('en-US');
    const newFormatted = newNumeric.toLocaleString('en-US');
    if (result.includes(oldFormatted)) {
      result = result.replace(oldFormatted, newFormatted);
      return result;
    }
    const oldPlain = String(oldNumeric);
    const newPlain = String(Math.round(newNumeric));
    if (result.includes(oldPlain)) {
      result = result.replace(oldPlain, newPlain);
      return result;
    }
  } else if (pv.type === 'percentage') {
    const oldPct = (oldNumeric * 100).toFixed(1) + '%';
    const newPct = (newNumeric * 100).toFixed(1) + '%';
    if (result.includes(oldPct)) {
      result = result.replace(oldPct, newPct);
      return result;
    }
    // Try without decimal
    const oldPctInt = Math.round(oldNumeric * 100) + '%';
    const newPctInt = Math.round(newNumeric * 100) + '%';
    if (result.includes(oldPctInt)) {
      result = result.replace(oldPctInt, newPctInt);
      return result;
    }
  } else if (pv.type === 'decimal') {
    const oldStr = oldNumeric + 'x';
    const newStr = newNumeric + 'x';
    if (result.includes(oldStr)) {
      result = result.replace(oldStr, newStr);
      return result;
    }
  }

  return result;
}

/**
 * Get all common display formats for a currency value.
 * Returns them in priority order (most specific first).
 */
function getCurrencyFormats(num: number): string[] {
  const formats: string[] = [];

  // $X.XM format
  if (num >= 1_000_000) {
    const m = num / 1_000_000;
    const mStr = m % 1 === 0 ? String(m) : m.toFixed(1);
    formats.push(`$${mStr}M`);
  }

  // $X,XXX,XXX full format
  if (num >= 1000) {
    formats.push('$' + num.toLocaleString('en-US'));
  }

  // $XK format
  if (num >= 1000 && num < 1_000_000) {
    const k = num / 1000;
    const kStr = k % 1 === 0 ? String(k) : k.toFixed(0);
    formats.push(`$${kStr}K`);
  }

  // Bare $X
  formats.push('$' + num.toString());

  // Just the number with commas
  if (num >= 1000) {
    formats.push(num.toLocaleString('en-US'));
  }

  return formats;
}

function getContext(lines: string[], lineNum: number, radius: number = 1): string {
  const start = Math.max(0, lineNum - radius);
  const end = Math.min(lines.length - 1, lineNum + radius);
  return lines.slice(start, end + 1).join('\n');
}

function deduplicateChanges(changes: CascadeChange[]): CascadeChange[] {
  const seen = new Set<string>();
  return changes.filter(c => {
    const key = `${c.documentId}:${c.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Apply Cascade ───────────────────────────────────────────────

/**
 * Apply a cascade preview to document content.
 * Returns a map of documentId → new raw content.
 * Does NOT write to disk — caller decides what to do with the results.
 */
export function applyCascade(
  preview: CascadePreview,
  documents: ParsedDocument[]
): Record<string, string> {
  const updatedDocs: Record<string, string> = {};

  // Group changes by document
  const changesByDoc: Record<string, CascadeChange[]> = {};
  for (const change of preview.documentChanges) {
    if (!changesByDoc[change.documentId]) {
      changesByDoc[change.documentId] = [];
    }
    changesByDoc[change.documentId].push(change);
  }

  // Apply changes to each document
  for (const [docId, changes] of Object.entries(changesByDoc)) {
    const doc = documents.find(d => d.id === docId);
    if (!doc) continue;

    const lines = doc.raw.split('\n');

    // Sort changes by line number (apply in order)
    const sorted = [...changes].sort((a, b) => a.line - b.line);

    for (const change of sorted) {
      if (change.line < lines.length) {
        lines[change.line] = change.newText;
      }
    }

    updatedDocs[docId] = lines.join('\n');
  }

  return updatedDocs;
}
