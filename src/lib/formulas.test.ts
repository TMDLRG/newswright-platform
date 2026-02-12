import * as path from 'path';
import * as fs from 'fs';
import {
  FORMULAS,
  KNOWN_NUMERICS,
  computeFormula,
  computeAll,
  getDependencyGraph,
  getDownstreamFormulas,
  computeWithOverrides,
  buildVarMap,
} from './formulas';
import { buildRegistry } from './registry';
import { PACKAGE_DIR } from './types';

const masterLogContent = fs.readFileSync(
  path.join(PACKAGE_DIR, '14_Master_Assumptions_Log.md'),
  'utf-8'
);
const registry = buildRegistry(masterLogContent);

describe('Formula Definitions', () => {
  test('all formulas have valid structure', () => {
    for (const f of FORMULAS) {
      expect(f.id).toBeTruthy();
      expect(f.name).toBeTruthy();
      expect(f.inputs.length).toBeGreaterThan(0);
      expect(f.output).toBeTruthy();
      expect(typeof f.compute).toBe('function');
    }
  });

  test('all formula inputs reference existing variables or known numerics', () => {
    for (const f of FORMULAS) {
      for (const inputId of f.inputs) {
        const inRegistry = registry.byId[inputId] !== undefined;
        const inKnown = KNOWN_NUMERICS[inputId] !== undefined;
        expect(inRegistry || inKnown).toBe(true);
      }
    }
  });

  test('buildVarMap produces numeric values for all formula inputs', () => {
    const vars = buildVarMap(registry);
    for (const f of FORMULAS) {
      for (const inputId of f.inputs) {
        expect(vars[inputId]).toBeDefined();
        expect(typeof vars[inputId]).toBe('number');
      }
    }
  });
});

describe('Formula Computations', () => {
  const vars = buildVarMap(registry);

  test('computes US TAM correctly: F4 * B7 * 12', () => {
    const result = computeFormula('US_TAM', vars);
    // F4=8654, B7=500 → 8654 * 500 * 12 = 51,924,000
    expect(result).toBeCloseTo(51_924_000, -3);
  });

  test('computes M12 ARR correctly: B2 * B7 * 12', () => {
    const result = computeFormula('M12_ARR', vars);
    // B2=92, B7=500 → 92 * 500 * 12 = 552,000
    expect(result).toBeCloseTo(92 * 500 * 12, -2);
  });

  test('computes M24 ARR correctly: B4 * B7 * 12', () => {
    const result = computeFormula('M24_ARR', vars);
    // B4=338, B7=500 → 338 * 500 * 12 = 2,028,000
    expect(result).toBeCloseTo(338 * 500 * 12, -2);
  });

  test('computes blended ARPU from tier prices and mix', () => {
    const result = computeFormula('BLENDED_ARPU', vars);
    // (0.40*249) + (0.35*499) + (0.18*749) + (0.07*1249) ≈ 496.50
    const expected = 0.40 * 249 + 0.35 * 499 + 0.18 * 749 + 0.07 * 1249;
    expect(result).toBeCloseTo(expected, 0);
  });

  test('computes penetration rate (base case)', () => {
    const result = computeFormula('PENETRATION_BASE', vars);
    // B6=908, F4=8654 → 908/8654 ≈ 0.10492
    expect(result).toBeCloseTo(908 / 8654, 4);
  });

  test('computes penetration rate (stretch case)', () => {
    const result = computeFormula('PENETRATION_STRETCH', vars);
    // B6a=1000, F4=8654 → 1000/8654 ≈ 0.11556
    expect(result).toBeCloseTo(1000 / 8654, 4);
  });

  test('computes Year 3 exit valuation: B5 * H1', () => {
    const result = computeFormula('EXIT_VAL_Y3', vars);
    // B5=6000000, H1=10 → 60,000,000
    expect(result).toBeCloseTo(60_000_000, -3);
  });

  test('computes cash at Gate 1: A1 - (E1 * 3)', () => {
    const result = computeFormula('CASH_GATE1', vars);
    // A1=500000, E1=46763 → 500000 - 140289 = 359711
    expect(result).toBeCloseTo(500000 - 46763 * 3, -1);
  });

  test('computes revenue mix components from B5', () => {
    const platform = computeFormula('REV_PLATFORM', vars);
    const consulting = computeFormula('REV_CONSULTING', vars);
    const training = computeFormula('REV_TRAINING', vars);
    const custom = computeFormula('REV_CUSTOM', vars);

    expect(platform).toBeCloseTo(6_000_000 * 0.50, -2);
    expect(consulting).toBeCloseTo(6_000_000 * 0.25, -2);
    expect(training).toBeCloseTo(6_000_000 * 0.15, -2);
    expect(custom).toBeCloseTo(6_000_000 * 0.10, -2);
  });

  test('computes stealth pilot total: E1 * 3', () => {
    const result = computeFormula('STEALTH_PILOT', vars);
    expect(result).toBeCloseTo(46763 * 3, -1);
  });
});

describe('Formula — What-If Scenarios', () => {
  test('ARPU change cascades to TAM and ARR', () => {
    const vars = buildVarMap(registry);
    vars['B7'] = 550;
    const tam = computeFormula('US_TAM', vars);
    const m12 = computeFormula('M12_ARR', vars);
    expect(tam).toBeCloseTo(8654 * 550 * 12, -3);
    expect(m12).toBeCloseTo(92 * 550 * 12, -2);
  });

  test('exit multiple change cascades to exit valuation', () => {
    const vars = buildVarMap(registry);
    vars['H1'] = 8;
    const exitVal = computeFormula('EXIT_VAL_Y3', vars);
    expect(exitVal).toBeCloseTo(6_000_000 * 8, -3);
  });

  test('market size change cascades to TAM and penetration', () => {
    const vars = buildVarMap(registry);
    vars['F4'] = 9000;
    const tam = computeFormula('US_TAM', vars);
    const pen = computeFormula('PENETRATION_BASE', vars);
    expect(tam).toBeCloseTo(9000 * 500 * 12, -3);
    expect(pen).toBeCloseTo(908 / 9000, 4);
  });

  test('computeWithOverrides returns both original and adjusted values', () => {
    const vars = buildVarMap(registry);
    const result = computeWithOverrides(vars, { B7: 550 });
    expect(result.original['US_TAM']).toBeCloseTo(8654 * 500 * 12, -3);
    expect(result.adjusted['US_TAM']).toBeCloseTo(8654 * 550 * 12, -3);
    expect(result.deltas['US_TAM']).toBeCloseTo(8654 * 50 * 12, -3);
  });
});

describe('Formula — Dependency Graph', () => {
  test('getDependencyGraph returns graph with all formulas', () => {
    const graph = getDependencyGraph();
    expect(Object.keys(graph).length).toBeGreaterThan(0);
  });

  test('getDownstreamFormulas finds formulas affected by B7 change', () => {
    const downstream = getDownstreamFormulas('B7');
    const ids = downstream.map(f => f.id);
    expect(ids).toContain('US_TAM');
    expect(ids).toContain('M12_ARR');
    expect(ids).toContain('M24_ARR');
  });

  test('getDownstreamFormulas finds formulas affected by F4 change', () => {
    const downstream = getDownstreamFormulas('F4');
    const ids = downstream.map(f => f.id);
    expect(ids).toContain('US_TAM');
    expect(ids).toContain('PENETRATION_BASE');
    expect(ids).toContain('PENETRATION_STRETCH');
  });

  test('getDownstreamFormulas finds formulas affected by H1 change', () => {
    const downstream = getDownstreamFormulas('H1');
    const ids = downstream.map(f => f.id);
    expect(ids).toContain('EXIT_VAL_Y3');
  });

  test('computeAll returns values for all formulas', () => {
    const vars = buildVarMap(registry);
    const all = computeAll(vars);
    expect(Object.keys(all).length).toBe(FORMULAS.length);
    for (const f of FORMULAS) {
      expect(typeof all[f.id]).toBe('number');
    }
  });
});
