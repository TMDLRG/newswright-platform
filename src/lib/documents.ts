/**
 * NewsWright Investor Platform — Document Manager
 *
 * Central manager that coordinates all lib modules.
 * Provides a unified API for the frontend and API routes.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ParsedDocument,
  DocumentTier,
  CascadePreview,
  PACKAGE_DIR,
} from './types';
import { parseAllDocuments, parseDocument } from './parser';
import { buildRegistry, RegistryResult } from './registry';
import { scanAllDocuments, ScanResult } from './scanner';
import { buildVarMap, computeAll, FORMULAS } from './formulas';
import { generateCascadePreview } from './cascade';
import { applyCascade } from './cascade';
import { exportMarkdown, exportAllMarkdown } from './exporter-md';
import { generateDocx, generateAllDocx } from './exporter-docx';

// ─── Document Summary ────────────────────────────────────────────

export interface DocumentSummary {
  id: string;
  filename: string;
  title: string;
  subtitle?: string;
  version: string;
  date: string;
  status?: string;
  tier: DocumentTier;
  tierLabel: string;
  sectionCount: number;
  tableCount: number;
  lineCount: number;
}

// ─── Document Manager ────────────────────────────────────────────

export class DocumentManager {
  private documents: ParsedDocument[];
  private registry: RegistryResult;
  private scanResult: ScanResult;
  private packageDir: string;

  constructor(packageDir: string = PACKAGE_DIR) {
    this.packageDir = packageDir;
    this.documents = parseAllDocuments(packageDir);
    const masterLogPath = path.join(packageDir, '14_Master_Assumptions_Log.md');
    const masterLogContent = fs.readFileSync(masterLogPath, 'utf-8');
    this.registry = buildRegistry(masterLogContent);
    this.scanResult = scanAllDocuments(this.documents, this.registry);
  }

  // ─── Document Access ─────────────────────────────────────────

  getAll(): ParsedDocument[] {
    return this.documents;
  }

  getById(id: string): ParsedDocument | undefined {
    return this.documents.find(d => d.id === id);
  }

  getByTier(tier: DocumentTier): ParsedDocument[] {
    return this.documents.filter(d => d.tier === tier);
  }

  getDocumentSummaries(): DocumentSummary[] {
    return this.documents.map(doc => ({
      id: doc.id,
      filename: doc.filename,
      title: doc.title,
      subtitle: doc.subtitle,
      version: doc.version,
      date: doc.date,
      status: doc.status,
      tier: doc.tier,
      tierLabel: doc.tierLabel,
      sectionCount: countSections(doc),
      tableCount: doc.tables.length,
      lineCount: doc.raw.split('\n').length,
    }));
  }

  // ─── Registry & Analysis ─────────────────────────────────────

  getRegistry(): RegistryResult {
    return this.registry;
  }

  getScanResult(): ScanResult {
    return this.scanResult;
  }

  getFormulaResults(): Record<string, number> {
    const vars = buildVarMap(this.registry);
    return computeAll(vars);
  }

  // ─── Cascade ─────────────────────────────────────────────────

  generateCascadePreview(changes: Record<string, string>): CascadePreview {
    return generateCascadePreview(
      changes,
      this.registry,
      this.documents,
      this.scanResult
    );
  }

  applyCascade(preview: CascadePreview): Record<string, string> {
    return applyCascade(preview, this.documents);
  }

  /**
   * Apply cascade and write changes to disk.
   * Returns the list of files written.
   */
  applyCascadeAndWrite(preview: CascadePreview): string[] {
    const updatedDocs = applyCascade(preview, this.documents);
    const writtenFiles: string[] = [];

    for (const [docId, content] of Object.entries(updatedDocs)) {
      const doc = this.documents.find(d => d.id === docId);
      if (!doc) continue;

      // Always update in-memory (works on Vercel even though fs is read-only)
      doc.raw = content;

      // Try to persist to disk (fails gracefully on read-only filesystems like Vercel)
      try {
        const filePath = path.join(this.packageDir, doc.filename);
        fs.writeFileSync(filePath, content, 'utf-8');
        writtenFiles.push(doc.filename);
      } catch {
        console.warn(`[ephemeral] Could not write ${doc.filename} to disk (read-only filesystem)`);
        writtenFiles.push(doc.filename + ' (in-memory only)');
      }
    }

    // Rebuild registry and scan after changes
    this.rebuildAfterChange();

    return writtenFiles;
  }

  // ─── Export ──────────────────────────────────────────────────

  exportMarkdown(docId: string): string | null {
    const doc = this.getById(docId);
    if (!doc) return null;
    return exportMarkdown(doc);
  }

  exportAllMarkdown() {
    return exportAllMarkdown(this.documents);
  }

  async exportDocx(docId: string): Promise<Buffer | null> {
    const doc = this.getById(docId);
    if (!doc) return null;
    return generateDocx(doc);
  }

  async exportAllDocx() {
    return generateAllDocx(this.documents);
  }

  // ─── Internal ────────────────────────────────────────────────

  private rebuildAfterChange(): void {
    const masterLogPath = path.join(this.packageDir, '14_Master_Assumptions_Log.md');
    const masterLogContent = fs.readFileSync(masterLogPath, 'utf-8');
    this.registry = buildRegistry(masterLogContent);
    this.scanResult = scanAllDocuments(this.documents, this.registry);
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function countSections(doc: ParsedDocument): number {
  let count = 0;
  function walk(sections: ParsedDocument['sections']) {
    for (const s of sections) {
      count++;
      walk(s.children);
    }
  }
  walk(doc.sections);
  return count;
}
