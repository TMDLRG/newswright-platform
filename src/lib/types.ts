/**
 * NewsWright Investor Platform — Shared Types
 */
import * as path from 'path';

// ─── Document Types ────────────────────────────────────────────────

export type DocumentTier = 1 | 2 | 3 | 4 | 5;

/** Lightweight AST node for the document root */
export interface LightAst {
  type: 'root';
  children: unknown[];
  position?: unknown;
}

export interface ParsedDocument {
  id: string;                      // "01" through "21"
  filename: string;                // "01_Executive_Summary.md"
  title: string;                   // "NEWSWRIGHT"
  subtitle?: string;               // "Executive Summary"
  version: string;                 // "2.0"
  date: string;                    // "February 11, 2026"
  status?: string;                 // "UPDATED — Investor Ready"
  tier: DocumentTier;
  tierLabel: string;               // "Core Investor Materials"
  sections: Section[];
  tables: ParsedTable[];
  raw: string;                     // Original markdown content
  ast: LightAst;                   // Lightweight AST placeholder
}

export interface Section {
  heading: string;
  level: 1 | 2 | 3 | 4;
  startLine: number;
  endLine: number;
  content: string;
  children: Section[];
}

export interface ParsedTable {
  id: string;
  sectionPath: string;
  headers: string[];
  rows: string[][];
  startLine: number;
  endLine: number;
}

// ─── Financial Value Types ─────────────────────────────────────────

export type ValueType = 'currency' | 'percentage' | 'integer' | 'decimal' | 'text' | 'range';

export interface ParsedValue {
  raw: string;                     // Original string: "$500,000"
  numeric?: number;                // 500000
  low?: number;                    // For ranges: 4500000
  high?: number;                   // For ranges: 5000000
  type: ValueType;
}

// ─── Variable Registry Types ───────────────────────────────────────

export type VariableCategory =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';

export const CATEGORY_LABELS: Record<VariableCategory, string> = {
  A: 'Investment & Valuation Parameters',
  B: 'Revenue & Growth Projections',
  C: 'Pricing Model',
  D: 'Use of Funds',
  E: 'Monthly Burn & Runway',
  F: 'Market Sizing',
  G: 'Pilot & Operational Metrics',
  H: 'Return Analysis Variables',
  I: 'Exit & Valuation (Post-Traction)',
  J: 'Technical & Product',
};

export interface Variable {
  id: string;                      // "A1", "B7", "F4"
  category: VariableCategory;
  name: string;                    // "Seed Round Target"
  value: string;                   // "$500,000"
  parsedValue: ParsedValue;
  confidence: number;              // 1-5
  sensitivityNote: string;
  sourceDocuments: string[];
  occurrences: Occurrence[];
  derivedFrom?: string[];          // Variable IDs this depends on
  derivesTo?: string[];            // Variable IDs that depend on this
}

export interface Occurrence {
  documentId: string;
  documentFilename: string;
  line: number;
  context: string;                 // Surrounding text for display
  inTable: boolean;
  tableId?: string;
  columnIndex?: number;
  rowIndex?: number;
}

// ─── Formula Types ─────────────────────────────────────────────────

export interface Formula {
  id: string;
  name: string;
  description: string;
  expression: string;              // Human-readable: "F4 * B7 * 12"
  inputs: string[];                // Variable IDs
  output: string;                  // Variable ID
  compute: (vars: Record<string, number>) => number;
}

// ─── Cascade Types ─────────────────────────────────────────────────

export interface CascadeChange {
  documentId: string;
  documentFilename: string;
  line: number;
  oldText: string;
  newText: string;
  context: string;                 // Lines around the change for display
  variableId: string;
  isDerived: boolean;              // True if this change was auto-calculated
}

export interface MasterLogUpdate {
  variableId: string;
  oldValue: string;
  newValue: string;
  line: number;
}

export interface CascadePreview {
  variableChanges: Array<{
    variableId: string;
    oldValue: string;
    newValue: string;
    isDerived: boolean;
  }>;
  documentChanges: CascadeChange[];
  masterLogUpdates?: MasterLogUpdate[];
  affectedDocumentCount: number;
  totalChangeCount: number;
}

// ─── Export Types ──────────────────────────────────────────────────

export type ExportFormat = 'md' | 'docx' | 'both';

export interface ExportRequest {
  documentIds: string[];           // ["01", "04", ...] or ["all"]
  format: ExportFormat;
  destination: 'download' | 'overwrite';  // Download zip or write to package folder
}

export interface ExportResult {
  files: Array<{
    filename: string;
    format: 'md' | 'docx';
    sizeBytes: number;
  }>;
  totalFiles: number;
}

// ─── Version History Types ─────────────────────────────────────────

export interface HistoryEntry {
  timestamp: string;               // ISO 8601
  action: 'cascade' | 'edit' | 'export';
  description: string;
  changes: Array<{
    variableId?: string;
    documentId: string;
    oldValue?: string;
    newValue?: string;
  }>;
}

// ─── Tier Mapping ──────────────────────────────────────────────────

export const TIER_MAP: Record<string, { tier: DocumentTier; label: string }> = {
  '01': { tier: 1, label: 'Core Investor Materials' },
  '02': { tier: 1, label: 'Core Investor Materials' },
  '03': { tier: 1, label: 'Core Investor Materials' },
  '04': { tier: 1, label: 'Core Investor Materials' },
  '05': { tier: 1, label: 'Core Investor Materials' },
  '06': { tier: 1, label: 'Core Investor Materials' },
  '07': { tier: 2, label: 'Operational & Strategic Plans' },
  '08': { tier: 2, label: 'Operational & Strategic Plans' },
  '09': { tier: 2, label: 'Operational & Strategic Plans' },
  '10': { tier: 2, label: 'Operational & Strategic Plans' },
  '11': { tier: 3, label: 'Market & Ecosystem Analysis' },
  '12': { tier: 3, label: 'Market & Ecosystem Analysis' },
  '13': { tier: 4, label: 'Reference & Decision Documentation' },
  '14': { tier: 4, label: 'Reference & Decision Documentation' },
  '15': { tier: 4, label: 'Reference & Decision Documentation' },
  '16': { tier: 4, label: 'Reference & Decision Documentation' },
  '17': { tier: 4, label: 'Reference & Decision Documentation' },
  '18': { tier: 4, label: 'Reference & Decision Documentation' },
  '19': { tier: 5, label: 'Quality Assurance & Verification' },
  '20': { tier: 5, label: 'Quality Assurance & Verification' },
  '21': { tier: 5, label: 'Quality Assurance & Verification' },
};

// ─── Constants ─────────────────────────────────────────────────────

/** Absolute path to the investor package directory (parent of platform/) */
export const PACKAGE_DIR = process.env.PACKAGE_DIR
  || (process.env.NODE_ENV === 'production'
    ? path.join(process.cwd(), 'data', 'docs')
    : 'D:\\NewsWright\\Investor_Package_Final');

/** Number of documents in the package */
export const DOCUMENT_COUNT = 21;
