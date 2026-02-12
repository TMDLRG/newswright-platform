import * as path from 'path';
import * as fs from 'fs';
import { scanAllDocuments, buildSearchPatterns } from './scanner';
import { buildRegistry } from './registry';
import { parseAllDocuments } from './parser';
import { PACKAGE_DIR, Variable } from './types';

const masterLogContent = fs.readFileSync(path.join(PACKAGE_DIR, '14_Master_Assumptions_Log.md'), 'utf-8');
const registry = buildRegistry(masterLogContent);
const documents = parseAllDocuments(PACKAGE_DIR);

describe('Scanner — Pattern Building', () => {
  test('builds search patterns for integer value "8,654"', () => {
    const v = registry.byId['F4'];
    expect(v).toBeDefined();
    const patterns = buildSearchPatterns(v);
    expect(patterns.length).toBeGreaterThan(0);
    // Should match "8,654" in text
    expect(patterns.some(p => p.test('8,654'))).toBe(true);
  });

  test('builds search patterns for currency "$249"', () => {
    const v = registry.byId['C1'];
    expect(v).toBeDefined();
    const patterns = buildSearchPatterns(v);
    expect(patterns.some(p => p.test('$249'))).toBe(true);
    expect(patterns.some(p => p.test('$249/mo'))).toBe(true);
  });
});

describe('Scanner — Cross-Document Scanning', () => {
  let result: ReturnType<typeof scanAllDocuments>;

  beforeAll(() => {
    result = scanAllDocuments(documents, registry);
  });

  test('finds occurrences of F4 (8,654) in 10+ documents', () => {
    const f4 = result.byVariable['F4'];
    expect(f4).toBeDefined();
    const uniqueDocs = new Set(f4.map(o => o.documentId));
    expect(uniqueDocs.size).toBeGreaterThanOrEqual(10);
  });

  test('finds pricing tier C1 ($249) in 10+ documents', () => {
    const c1 = result.byVariable['C1'];
    expect(c1).toBeDefined();
    const uniqueDocs = new Set(c1.map(o => o.documentId));
    expect(uniqueDocs.size).toBeGreaterThanOrEqual(10);
  });

  test('finds A1 ($500,000 seed) in 5+ documents', () => {
    const a1 = result.byVariable['A1'];
    expect(a1).toBeDefined();
    const uniqueDocs = new Set(a1.map(o => o.documentId));
    expect(uniqueDocs.size).toBeGreaterThanOrEqual(5);
  });

  test('each occurrence has valid documentId and line number', () => {
    for (const [varId, occs] of Object.entries(result.byVariable)) {
      for (const occ of occs) {
        expect(occ.documentId).toMatch(/^\d{2}$/);
        expect(occ.line).toBeGreaterThanOrEqual(0);
        expect(occ.context.length).toBeGreaterThan(0);
      }
    }
  });

  test('occurrence distinguishes table vs prose', () => {
    const f4 = result.byVariable['F4'];
    expect(f4).toBeDefined();
    const tableOccs = f4.filter(o => o.inTable);
    const proseOccs = f4.filter(o => !o.inTable);
    // 8,654 appears in both tables and prose
    expect(tableOccs.length).toBeGreaterThan(0);
    expect(proseOccs.length).toBeGreaterThan(0);
  });

  test('result.byDocument groups occurrences by document', () => {
    // Check Executive Summary has multiple variable occurrences
    const doc01 = result.byDocument['01'];
    expect(doc01).toBeDefined();
    expect(doc01.length).toBeGreaterThan(5);
  });

  test('total occurrences is substantial', () => {
    const total = Object.values(result.byVariable)
      .reduce((sum, occs) => sum + occs.length, 0);
    expect(total).toBeGreaterThan(100);
  });
});
