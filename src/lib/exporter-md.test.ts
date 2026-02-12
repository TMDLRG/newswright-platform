import * as path from 'path';
import * as fs from 'fs';
import {
  exportMarkdown,
  exportAllMarkdown,
  applyChangesAndExport,
} from './exporter-md';
import { parseDocument, parseAllDocuments } from './parser';
import { buildRegistry } from './registry';
import { scanAllDocuments } from './scanner';
import { generateCascadePreview } from './cascade';
import { PACKAGE_DIR } from './types';

const masterLogContent = fs.readFileSync(
  path.join(PACKAGE_DIR, '14_Master_Assumptions_Log.md'),
  'utf-8'
);

describe('Markdown Exporter — Round-Trip Fidelity', () => {
  test('round-trip: export matches original for Executive Summary', () => {
    const filename = '01_Executive_Summary.md';
    const original = fs.readFileSync(path.join(PACKAGE_DIR, filename), 'utf-8');
    const doc = parseDocument(original, filename);
    const exported = exportMarkdown(doc);
    expect(exported).toBe(original);
  });

  test('round-trip: export matches original for Financial Model Addendum', () => {
    const filename = '04_Financial_Model_Addendum.md';
    const original = fs.readFileSync(path.join(PACKAGE_DIR, filename), 'utf-8');
    const doc = parseDocument(original, filename);
    const exported = exportMarkdown(doc);
    expect(exported).toBe(original);
  });

  test('round-trip: export matches original for Master Assumptions Log', () => {
    const filename = '14_Master_Assumptions_Log.md';
    const original = fs.readFileSync(path.join(PACKAGE_DIR, filename), 'utf-8');
    const doc = parseDocument(original, filename);
    const exported = exportMarkdown(doc);
    expect(exported).toBe(original);
  });

  test('round-trip: export matches original for ALL 21 files', () => {
    const documents = parseAllDocuments(PACKAGE_DIR);
    expect(documents.length).toBe(21);

    for (const doc of documents) {
      const original = fs.readFileSync(
        path.join(PACKAGE_DIR, doc.filename),
        'utf-8'
      );
      const exported = exportMarkdown(doc);
      if (exported !== original) {
        // Find first difference for debugging
        const origLines = original.split('\n');
        const expLines = exported.split('\n');
        for (let i = 0; i < Math.max(origLines.length, expLines.length); i++) {
          if (origLines[i] !== expLines[i]) {
            fail(
              `${doc.filename} differs at line ${i + 1}:\n` +
              `  Original: ${JSON.stringify(origLines[i])}\n` +
              `  Exported: ${JSON.stringify(expLines[i])}`
            );
          }
        }
      }
      expect(exported).toBe(original);
    }
  });
});

describe('Markdown Exporter — Modified Content', () => {
  test('export with modified raw content preserves changes', () => {
    const filename = '01_Executive_Summary.md';
    const original = fs.readFileSync(path.join(PACKAGE_DIR, filename), 'utf-8');
    const doc = parseDocument(original, filename);

    // Simulate a cascade change: replace one line
    const lines = doc.raw.split('\n');
    const originalLine10 = lines[10];
    lines[10] = lines[10].replace('8,654', '9,000');
    doc.raw = lines.join('\n');

    const exported = exportMarkdown(doc);
    const exportedLines = exported.split('\n');

    // Changed line should have new value
    if (originalLine10.includes('8,654')) {
      expect(exportedLines[10]).toContain('9,000');
    }

    // All other lines should match
    const origLines = original.split('\n');
    for (let i = 0; i < origLines.length; i++) {
      if (i !== 10) {
        expect(exportedLines[i]).toBe(origLines[i]);
      }
    }
  });

  test('applyChangesAndExport writes cascaded changes to markdown', () => {
    const registry = buildRegistry(masterLogContent);
    const documents = parseAllDocuments(PACKAGE_DIR);
    const scanResult = scanAllDocuments(documents, registry);

    const preview = generateCascadePreview(
      { F4: '9,000' },
      registry,
      documents,
      scanResult
    );

    const exportedDocs = applyChangesAndExport(preview, documents);

    // Should have exports for all affected documents
    expect(Object.keys(exportedDocs).length).toBeGreaterThan(0);

    // Each export should contain the new value somewhere
    for (const [docId, content] of Object.entries(exportedDocs)) {
      const changes = preview.documentChanges.filter(c => c.documentId === docId);
      for (const change of changes) {
        if (change.variableId === 'F4') {
          expect(content).toContain('9,000');
        }
      }
    }
  });
});

describe('Markdown Exporter — Bulk Export', () => {
  test('exportAllMarkdown returns all 21 documents', () => {
    const documents = parseAllDocuments(PACKAGE_DIR);
    const results = exportAllMarkdown(documents);

    expect(Object.keys(results).length).toBe(21);

    for (const doc of documents) {
      expect(results[doc.id]).toBeDefined();
      expect(results[doc.id].filename).toBe(doc.filename);
      expect(results[doc.id].content.length).toBeGreaterThan(0);
    }
  });
});
