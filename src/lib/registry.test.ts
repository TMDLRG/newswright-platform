import * as path from 'path';
import * as fs from 'fs';
import { buildRegistry, parseAssumptionRow, RegistryResult } from './registry';
import { PACKAGE_DIR, Variable, VariableCategory } from './types';

const MASTER_LOG_PATH = path.join(PACKAGE_DIR, '14_Master_Assumptions_Log.md');
const masterLogContent = fs.readFileSync(MASTER_LOG_PATH, 'utf-8');

describe('Registry — Row Parsing', () => {
  test('extracts variable ID, name, value, confidence, sensitivity from A1 row', () => {
    const row = ['A1', 'Seed Round Target', '$500,000', 'All docs (consistent)', '5', 'Fixed; defines scope of plan'];
    const variable = parseAssumptionRow(row, 'A');
    expect(variable).toBeDefined();
    expect(variable!.id).toBe('A1');
    expect(variable!.name).toBe('Seed Round Target');
    expect(variable!.value).toBe('$500,000');
    expect(variable!.confidence).toBe(5);
    expect(variable!.sensitivityNote).toContain('Fixed');
  });

  test('parses numeric value correctly for B7 (ARPU)', () => {
    const row = ['B7', 'Blended ARPU', '**$500/month**', 'Phase 0 Decision 0.4', '4', 'Tier mix'];
    const variable = parseAssumptionRow(row, 'B');
    expect(variable).toBeDefined();
    expect(variable!.parsedValue.numeric).toBe(500);
    expect(variable!.parsedValue.type).toBe('currency');
  });

  test('parses range value for A2 (Pre-Money Valuation)', () => {
    const row = ['A2', 'Pre-Money Valuation (Seed)', '$4.5M–$5.0M', 'Financial Addendum', '4', 'Determines ownership'];
    const variable = parseAssumptionRow(row, 'A');
    expect(variable).toBeDefined();
    expect(variable!.parsedValue.type).toBe('range');
    expect(variable!.parsedValue.low).toBe(4500000);
    expect(variable!.parsedValue.high).toBe(5000000);
  });

  test('parses integer value for F4 (market size)', () => {
    const row = ['F4', 'US Local News Outlets', '**8,654**', 'Phase 0 Decision', '5', 'RESOLVED'];
    const variable = parseAssumptionRow(row, 'F');
    expect(variable).toBeDefined();
    expect(variable!.parsedValue.numeric).toBe(8654);
  });

  test('strips markdown bold markers from values', () => {
    const row = ['B1', 'M12 ARR (Base Case)', '**$720,000** ($60K MRR)', 'V5.1', '4', 'Note'];
    const variable = parseAssumptionRow(row, 'B');
    expect(variable).toBeDefined();
    expect(variable!.value).toContain('$720,000');
  });
});

describe('Registry — Full Build from Master Assumptions Log', () => {
  let registry: RegistryResult;

  beforeAll(() => {
    registry = buildRegistry(masterLogContent);
  });

  test('extracts 50+ variables across categories A-J', () => {
    expect(registry.variables.length).toBeGreaterThanOrEqual(50);
  });

  test('has all 10 categories (A through J)', () => {
    const categories = new Set(registry.variables.map(v => v.category));
    expect(categories.size).toBe(10);
    for (const cat of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']) {
      expect(categories.has(cat as VariableCategory)).toBe(true);
    }
  });

  test('finds A1 = $500,000', () => {
    const a1 = registry.variables.find(v => v.id === 'A1');
    expect(a1).toBeDefined();
    expect(a1!.value).toContain('$500,000');
    expect(a1!.parsedValue.numeric).toBe(500000);
  });

  test('finds B7 = $500/month', () => {
    const b7 = registry.variables.find(v => v.id === 'B7');
    expect(b7).toBeDefined();
    expect(b7!.value).toContain('$500');
    expect(b7!.parsedValue.numeric).toBe(500);
  });

  test('finds F4 = 8,654', () => {
    const f4 = registry.variables.find(v => v.id === 'F4');
    expect(f4).toBeDefined();
    expect(f4!.value).toContain('8,654');
    expect(f4!.parsedValue.numeric).toBe(8654);
  });

  test('finds C1-C4 pricing tiers', () => {
    const c1 = registry.variables.find(v => v.id === 'C1');
    const c2 = registry.variables.find(v => v.id === 'C2');
    const c3 = registry.variables.find(v => v.id === 'C3');
    const c4 = registry.variables.find(v => v.id === 'C4');
    expect(c1).toBeDefined();
    expect(c2).toBeDefined();
    expect(c3).toBeDefined();
    expect(c4).toBeDefined();
    expect(c1!.parsedValue.numeric).toBe(249);
    expect(c2!.parsedValue.numeric).toBe(499);
    expect(c3!.parsedValue.numeric).toBe(749);
    expect(c4!.parsedValue.numeric).toBe(1249);
  });

  test('finds H1 = 10x exit multiple', () => {
    const h1 = registry.variables.find(v => v.id === 'H1');
    expect(h1).toBeDefined();
    expect(h1!.value).toContain('10x');
  });

  test('finds B6 = 908 (Year 3 customers base)', () => {
    const b6 = registry.variables.find(v => v.id === 'B6');
    expect(b6).toBeDefined();
    expect(b6!.value).toContain('908');
  });

  test('has category counts that make sense', () => {
    const byCat = registry.byCategory;
    expect(byCat['A'].length).toBeGreaterThanOrEqual(5); // Investment params
    expect(byCat['B'].length).toBeGreaterThanOrEqual(5); // Revenue
    expect(byCat['C'].length).toBeGreaterThanOrEqual(4); // Pricing
    expect(byCat['F'].length).toBeGreaterThanOrEqual(5); // Market
  });

  test('confidence values are 1-5', () => {
    for (const v of registry.variables) {
      expect(v.confidence).toBeGreaterThanOrEqual(1);
      expect(v.confidence).toBeLessThanOrEqual(5);
    }
  });

  test('resolvedDecisions contains Q1-Q8', () => {
    expect(registry.resolvedDecisions.length).toBe(8);
    expect(registry.resolvedDecisions[0].id).toBe('Q1');
    expect(registry.resolvedDecisions[7].id).toBe('Q8');
  });
});
