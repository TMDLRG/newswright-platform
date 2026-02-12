import * as path from 'path';
import * as fs from 'fs';
import {
  parseDocument,
  parseAllDocuments,
  extractMetadata,
  extractSections,
  extractTables,
  parseFinancialValue,
  getTierForId,
} from './parser';
import { PACKAGE_DIR, DOCUMENT_COUNT, Section } from './types';

const DOCS_DIR = PACKAGE_DIR;

// Helper: read a specific .md file
function readDoc(filename: string): string {
  return fs.readFileSync(path.join(DOCS_DIR, filename), 'utf-8');
}

describe('Parser — Metadata Extraction', () => {
  test('parses Executive Summary metadata (title, version, date)', () => {
    const raw = readDoc('01_Executive_Summary.md');
    const meta = extractMetadata(raw, '01_Executive_Summary.md');
    expect(meta.title).toBe('NEWSWRIGHT');
    expect(meta.version).toBe('2.0');
    expect(meta.date).toContain('February 11, 2026');
  });

  test('parses Financial Model metadata', () => {
    const raw = readDoc('04_Financial_Model_Addendum.md');
    const meta = extractMetadata(raw, '04_Financial_Model_Addendum.md');
    expect(meta.title).toBe('NEWSWRIGHT');
    expect(meta.version).toBe('3.0');
  });

  test('parses Conflict Register metadata', () => {
    const raw = readDoc('19_Conflict_Register.md');
    const meta = extractMetadata(raw, '19_Conflict_Register.md');
    expect(meta.version).toBe('1.3');
  });
});

describe('Parser — Section Extraction', () => {
  // Helper to collect all sections at a given level from the tree
  function collectAtLevel(sections: Section[], level: number): Section[] {
    const result: Section[] = [];
    for (const s of sections) {
      if (s.level === level) result.push(s);
      result.push(...collectAtLevel(s.children, level));
    }
    return result;
  }

  test('extracts all sections with correct heading hierarchy', () => {
    const raw = readDoc('01_Executive_Summary.md');
    const sections = extractSections(raw);
    expect(sections.length).toBeGreaterThan(0);
    // Executive Summary has ## headings nested under # NEWSWRIGHT
    const level2 = collectAtLevel(sections, 2);
    expect(level2.length).toBeGreaterThanOrEqual(8);
    expect(level2.map(s => s.heading)).toContain('THE PROBLEM');
    expect(level2.map(s => s.heading)).toContain('THE ASK');
  });

  test('extracts nested sections (###) as children', () => {
    const raw = readDoc('04_Financial_Model_Addendum.md');
    const sections = extractSections(raw);
    // Financial Model has ## sections with ### subsections
    const level2 = collectAtLevel(sections, 2);
    const withChildren = level2.filter(s => s.children.length > 0);
    expect(withChildren.length).toBeGreaterThan(0);
  });

  test('each section has valid startLine and endLine', () => {
    const raw = readDoc('01_Executive_Summary.md');
    const sections = extractSections(raw);
    for (const section of sections) {
      expect(section.startLine).toBeGreaterThanOrEqual(0);
      expect(section.endLine).toBeGreaterThan(section.startLine);
    }
  });
});

describe('Parser — Table Extraction', () => {
  test('parses all markdown tables into structured data', () => {
    const raw = readDoc('01_Executive_Summary.md');
    const tables = extractTables(raw);
    // Executive Summary has multiple tables (Traction, Market, Pricing, etc.)
    expect(tables.length).toBeGreaterThanOrEqual(4);
  });

  test('table has correct headers and rows', () => {
    const raw = readDoc('01_Executive_Summary.md');
    const tables = extractTables(raw);
    // Find the pricing table
    const pricingTable = tables.find(t =>
      t.headers.some(h => h.toLowerCase().includes('tier'))
    );
    expect(pricingTable).toBeDefined();
    expect(pricingTable!.headers).toContain('Tier');
    expect(pricingTable!.headers).toContain('Price');
    expect(pricingTable!.rows.length).toBe(4); // Core, Pro, Premium, Enterprise
  });

  test('table has valid line numbers', () => {
    const raw = readDoc('04_Financial_Model_Addendum.md');
    const tables = extractTables(raw);
    expect(tables.length).toBeGreaterThanOrEqual(10);
    for (const table of tables) {
      expect(table.startLine).toBeGreaterThanOrEqual(0);
      expect(table.endLine).toBeGreaterThan(table.startLine);
    }
  });
});

describe('Parser — Financial Value Parsing', () => {
  test('parses currency value "$500,000"', () => {
    const result = parseFinancialValue('$500,000');
    expect(result.type).toBe('currency');
    expect(result.numeric).toBe(500000);
  });

  test('parses currency value "$4.5M"', () => {
    const result = parseFinancialValue('$4.5M');
    expect(result.type).toBe('currency');
    expect(result.numeric).toBe(4500000);
  });

  test('parses currency range "$4.5M–$5.0M"', () => {
    const result = parseFinancialValue('$4.5M–$5.0M');
    expect(result.type).toBe('range');
    expect(result.low).toBe(4500000);
    expect(result.high).toBe(5000000);
  });

  test('parses currency range "$1.0M–$1.5M"', () => {
    const result = parseFinancialValue('$1.0M–$1.5M');
    expect(result.type).toBe('range');
    expect(result.low).toBe(1000000);
    expect(result.high).toBe(1500000);
  });

  test('parses percentage "10.5%"', () => {
    const result = parseFinancialValue('10.5%');
    expect(result.type).toBe('percentage');
    expect(result.numeric).toBeCloseTo(0.105);
  });

  test('parses integer "8,654"', () => {
    const result = parseFinancialValue('8,654');
    expect(result.type).toBe('integer');
    expect(result.numeric).toBe(8654);
  });

  test('parses dollar amount "$249/mo"', () => {
    const result = parseFinancialValue('$249/mo');
    expect(result.type).toBe('currency');
    expect(result.numeric).toBe(249);
  });

  test('parses "$500/month"', () => {
    const result = parseFinancialValue('$500/month');
    expect(result.type).toBe('currency');
    expect(result.numeric).toBe(500);
  });

  test('parses "$51.9M ARR"', () => {
    const result = parseFinancialValue('$51.9M ARR');
    expect(result.type).toBe('currency');
    expect(result.numeric).toBe(51900000);
  });

  test('parses multiplier "10x"', () => {
    const result = parseFinancialValue('10x');
    expect(result.type).toBe('decimal');
    expect(result.numeric).toBe(10);
  });

  test('parses plain text as text type', () => {
    const result = parseFinancialValue('Phase 0 Decision');
    expect(result.type).toBe('text');
    expect(result.numeric).toBeUndefined();
  });
});

describe('Parser — Tier Mapping', () => {
  test('maps documents 01-06 to Tier 1', () => {
    expect(getTierForId('01')).toBe(1);
    expect(getTierForId('06')).toBe(1);
  });

  test('maps documents 07-10 to Tier 2', () => {
    expect(getTierForId('07')).toBe(2);
    expect(getTierForId('10')).toBe(2);
  });

  test('maps documents 11-12 to Tier 3', () => {
    expect(getTierForId('11')).toBe(3);
    expect(getTierForId('12')).toBe(3);
  });

  test('maps documents 13-18 to Tier 4', () => {
    expect(getTierForId('13')).toBe(4);
    expect(getTierForId('18')).toBe(4);
  });

  test('maps documents 19-21 to Tier 5', () => {
    expect(getTierForId('19')).toBe(5);
    expect(getTierForId('21')).toBe(5);
  });
});

describe('Parser — Full Document Parse', () => {
  test('parses a single document completely', () => {
    const raw = readDoc('01_Executive_Summary.md');
    const doc = parseDocument(raw, '01_Executive_Summary.md');
    expect(doc.id).toBe('01');
    expect(doc.filename).toBe('01_Executive_Summary.md');
    expect(doc.title).toBe('NEWSWRIGHT');
    expect(doc.tier).toBe(1);
    expect(doc.sections.length).toBeGreaterThan(0);
    expect(doc.tables.length).toBeGreaterThan(0);
    expect(doc.raw).toBe(raw);
    expect(doc.ast).toBeDefined();
    expect(doc.ast.type).toBe('root');
  });

  test('handles all 21 documents without errors', () => {
    const docs = parseAllDocuments(DOCS_DIR);
    expect(docs.length).toBe(DOCUMENT_COUNT);
    for (const doc of docs) {
      expect(doc.id).toMatch(/^\d{2}$/);
      expect(doc.filename).toMatch(/\.md$/);
      expect(doc.title).toBeDefined();
      expect(doc.tier).toBeGreaterThanOrEqual(1);
      expect(doc.tier).toBeLessThanOrEqual(5);
      expect(doc.sections.length).toBeGreaterThan(0);
      expect(doc.raw.length).toBeGreaterThan(0);
      expect(doc.ast.type).toBe('root');
    }
  });

  test('documents are returned in order 01-21', () => {
    const docs = parseAllDocuments(DOCS_DIR);
    for (let i = 0; i < docs.length; i++) {
      const expectedId = String(i + 1).padStart(2, '0');
      expect(docs[i].id).toBe(expectedId);
    }
  });
});
