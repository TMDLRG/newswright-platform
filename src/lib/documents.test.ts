import * as path from 'path';
import * as fs from 'fs';
import {
  DocumentManager,
} from './documents';
import { PACKAGE_DIR } from './types';

describe('DocumentManager', () => {
  let manager: DocumentManager;

  beforeAll(() => {
    manager = new DocumentManager(PACKAGE_DIR);
  });

  test('loads all 21 documents', () => {
    expect(manager.getAll().length).toBe(21);
  });

  test('documents are ordered by ID', () => {
    const docs = manager.getAll();
    for (let i = 1; i < docs.length; i++) {
      expect(docs[i].id >= docs[i - 1].id).toBe(true);
    }
  });

  test('returns document by ID', () => {
    const doc = manager.getById('04');
    expect(doc).toBeDefined();
    expect(doc!.id).toBe('04');
    expect(doc!.filename).toMatch(/04_/);
  });

  test('returns undefined for invalid ID', () => {
    expect(manager.getById('99')).toBeUndefined();
  });

  test('returns documents by tier', () => {
    const tier1 = manager.getByTier(1);
    expect(tier1.length).toBe(6); // docs 01-06
    for (const doc of tier1) {
      expect(doc.tier).toBe(1);
    }
  });

  test('getRegistry returns variable registry', () => {
    const registry = manager.getRegistry();
    expect(registry.variables.length).toBeGreaterThan(50);
    expect(registry.byId['F4']).toBeDefined();
  });

  test('getScanResult returns scan results', () => {
    const scan = manager.getScanResult();
    expect(scan.totalOccurrences).toBeGreaterThan(100);
    expect(Object.keys(scan.byVariable).length).toBeGreaterThan(0);
  });

  test('getFormulaResults returns computed formula values', () => {
    const results = manager.getFormulaResults();
    expect(results['US_TAM']).toBeCloseTo(51_924_000, -3);
    expect(results['EXIT_VAL_Y3']).toBeCloseTo(60_000_000, -3);
  });

  test('generateCascadePreview returns preview for F4 change', () => {
    const preview = manager.generateCascadePreview({ F4: '9,000' });
    expect(preview.affectedDocumentCount).toBeGreaterThanOrEqual(5);
    expect(preview.documentChanges.length).toBeGreaterThan(0);
  });

  test('getDocumentSummaries returns compact metadata', () => {
    const summaries = manager.getDocumentSummaries();
    expect(summaries.length).toBe(21);
    for (const s of summaries) {
      expect(s.id).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.tier).toBeGreaterThanOrEqual(1);
      expect(s.tier).toBeLessThanOrEqual(5);
    }
  });
});
