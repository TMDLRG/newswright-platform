/**
 * NewsWright Investor Platform — Variable Registry
 *
 * Parses the Master Assumptions Log (doc 14) into a structured
 * registry of all financial variables, grouped by category A-J.
 */

import { Variable, VariableCategory, ParsedValue, Occurrence, CATEGORY_LABELS } from './types';
import { parseFinancialValue } from './parser';

// ─── Types ─────────────────────────────────────────────────────────

export interface ResolvedDecision {
  id: string;       // "Q1" through "Q8"
  question: string;
  resolution: string;
  source: string;
}

export interface RegistryResult {
  variables: Variable[];
  byCategory: Record<VariableCategory, Variable[]>;
  byId: Record<string, Variable>;
  resolvedDecisions: ResolvedDecision[];
}

// ─── Row Parsing ───────────────────────────────────────────────────

/**
 * Parse a single assumption table row into a Variable object.
 * Row format: [id, name, value, source, confidence, sensitivity]
 */
export function parseAssumptionRow(
  row: string[],
  category: VariableCategory
): Variable | null {
  if (row.length < 6) return null;

  const [rawId, name, rawValue, sourceStr, confidenceStr, sensitivityNote] = row;

  // Clean ID: strip any leading/trailing whitespace
  const id = rawId.trim();
  if (!id.match(/^[A-J]\d/)) return null;

  // Clean value: strip markdown bold markers **...**
  const value = rawValue
    .replace(/\*\*/g, '')
    .trim();

  // Parse the financial value
  const parsedValue = parseFinancialValue(value);

  // Parse confidence (1-5)
  const confidenceMatch = confidenceStr.match(/(\d)/);
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 3;

  // Extract source documents mentioned
  const sourceDocuments = extractSourceDocs(sourceStr);

  return {
    id,
    category,
    name: name.trim(),
    value,
    parsedValue,
    confidence: Math.min(5, Math.max(1, confidence)),
    sensitivityNote: sensitivityNote.trim(),
    sourceDocuments,
    occurrences: [], // Populated by scanner
  };
}

function extractSourceDocs(sourceStr: string): string[] {
  // Extract document references like "V5.1", "Exec Summary", etc.
  const docs: string[] = [];
  if (sourceStr.includes('All docs')) docs.push('all');
  if (sourceStr.match(/V5\.1|Operating Model/i)) docs.push('09');
  if (sourceStr.match(/Financial Addendum|Fin Add/i)) docs.push('04');
  if (sourceStr.match(/Return Analysis/i)) docs.push('05');
  if (sourceStr.match(/Exec Summary/i)) docs.push('01');
  if (sourceStr.match(/Investment Memo/i)) docs.push('03');
  if (sourceStr.match(/Pilot Plan/i)) docs.push('07');
  if (sourceStr.match(/Roadmap/i)) docs.push('08');
  if (sourceStr.match(/Market (Research|Sizing)/i)) docs.push('11');
  if (sourceStr.match(/Comprehensive Memo/i)) docs.push('03');
  if (sourceStr.match(/Tear Sheet/i)) docs.push('02');
  if (sourceStr.match(/Valuation Narrative/i)) docs.push('06');
  if (sourceStr.match(/Phase 0/i)) docs.push('16');
  if (sourceStr.match(/Session 1/i)) docs.push('17');
  if (sourceStr.match(/Decision Handoff/i)) docs.push('18');
  if (sourceStr.match(/Job Reqs/i)) docs.push('09'); // Referenced from operating model
  return [...new Set(docs)];
}

// ─── Registry Builder ──────────────────────────────────────────────

/**
 * Build the full variable registry from Master Assumptions Log content.
 */
export function buildRegistry(masterLogContent: string): RegistryResult {
  const variables: Variable[] = [];
  const resolvedDecisions: ResolvedDecision[] = [];

  const lines = masterLogContent.split('\n');
  let currentCategory: VariableCategory | null = null;
  let inResolvedSection = false;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Detect category headers: "## A. Investment & Valuation Parameters"
    const categoryMatch = line.match(/^##\s+([A-J])\.\s/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1] as VariableCategory;
      inResolvedSection = false;
      i++;
      continue;
    }

    // Detect resolved decisions section
    if (line.match(/^##\s+Resolved Decisions/)) {
      inResolvedSection = true;
      currentCategory = null;
      i++;
      continue;
    }

    // Detect end sections (Sources, etc.)
    if (line.match(/^##\s+Z\./)) {
      inResolvedSection = false;
      currentCategory = null;
      i++;
      continue;
    }

    // Parse assumption table rows
    if (currentCategory && line.trim().startsWith('|') && !line.match(/^\|[\s-:|]+\|$/)) {
      const cells = parseTableLine(line);
      if (cells.length >= 6 && cells[0].match(/^[A-J]\d/)) {
        const variable = parseAssumptionRow(cells, currentCategory);
        if (variable) {
          variables.push(variable);
        }
      }
    }

    // Parse resolved decisions table rows
    if (inResolvedSection && line.trim().startsWith('|') && !line.match(/^\|[\s-:|]+\|$/)) {
      const cells = parseTableLine(line);
      if (cells.length >= 4 && cells[0].match(/^Q\d/)) {
        resolvedDecisions.push({
          id: cells[0].trim(),
          question: cells[1].trim(),
          resolution: cells[2].replace(/\*\*/g, '').trim(),
          source: cells[3].trim(),
        });
      }
    }

    i++;
  }

  // Build lookup indices
  const byCategory: Record<VariableCategory, Variable[]> = {
    A: [], B: [], C: [], D: [], E: [],
    F: [], G: [], H: [], I: [], J: [],
  };
  const byId: Record<string, Variable> = {};

  for (const v of variables) {
    byCategory[v.category].push(v);
    byId[v.id] = v;
  }

  return { variables, byCategory, byId, resolvedDecisions };
}

function parseTableLine(line: string): string[] {
  return line
    .split('|')
    .map(cell => cell.trim())
    .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
}
