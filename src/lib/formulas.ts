/**
 * NewsWright Investor Platform — Formula Engine
 *
 * Computes derived financial values from the variable registry.
 * All formulas are explicit and hardcoded for reliability.
 */

import { Formula } from './types';
import { RegistryResult } from './registry';

// ─── Known Numeric Values ────────────────────────────────────────
// Variables whose registry values parse as text but have known numeric meanings.

export const KNOWN_NUMERICS: Record<string, number> = {
  H1: 10,     // "10x ARR" → 10
  H4: 10,     // "10x–12x ARR" → use low end
  C8: 2.6,    // "2.6x at Pro tier" → 2.6
};

// ─── Formula Definitions ─────────────────────────────────────────

export const FORMULAS: Formula[] = [
  {
    id: 'US_TAM',
    name: 'U.S. TAM at Target Pricing',
    description: 'Total addressable market = outlets × ARPU × 12 months',
    expression: 'F4 × B7 × 12',
    inputs: ['F4', 'B7'],
    output: 'F11',
    compute: (v) => v['F4'] * v['B7'] * 12,
  },
  {
    id: 'M12_ARR',
    name: 'Month 12 ARR (Base Case)',
    description: 'Annual recurring revenue at month 12',
    expression: 'B2 × B7 × 12',
    inputs: ['B2', 'B7'],
    output: 'B1',
    compute: (v) => v['B2'] * v['B7'] * 12,
  },
  {
    id: 'M24_ARR',
    name: 'Month 24 ARR (Base Case)',
    description: 'Annual recurring revenue at month 24',
    expression: 'B4 × B7 × 12',
    inputs: ['B4', 'B7'],
    output: 'B3',
    compute: (v) => v['B4'] * v['B7'] * 12,
  },
  {
    id: 'BLENDED_ARPU',
    name: 'Blended ARPU (Tier Mix)',
    description: 'Weighted average monthly ARPU across pricing tiers',
    expression: '(0.40 × C1) + (0.35 × C2) + (0.18 × C3) + (0.07 × C4)',
    inputs: ['C1', 'C2', 'C3', 'C4'],
    output: 'B7',
    compute: (v) => 0.40 * v['C1'] + 0.35 * v['C2'] + 0.18 * v['C3'] + 0.07 * v['C4'],
  },
  {
    id: 'PENETRATION_BASE',
    name: 'Market Penetration (Base Case, M36)',
    description: 'Base case customer count as % of total U.S. outlets',
    expression: 'B6 / F4',
    inputs: ['B6', 'F4'],
    output: '_PEN_BASE',
    compute: (v) => v['B6'] / v['F4'],
  },
  {
    id: 'PENETRATION_STRETCH',
    name: 'Market Penetration (Stretch Case, M36)',
    description: 'Stretch case customer count as % of total U.S. outlets',
    expression: 'B6a / F4',
    inputs: ['B6a', 'F4'],
    output: '_PEN_STRETCH',
    compute: (v) => v['B6a'] / v['F4'],
  },
  {
    id: 'EXIT_VAL_Y3',
    name: 'Year 3 Exit Valuation',
    description: 'Year 3 ARR × exit multiple',
    expression: 'B5 × H1',
    inputs: ['B5', 'H1'],
    output: 'H2',
    compute: (v) => v['B5'] * v['H1'],
  },
  {
    id: 'CASH_GATE1',
    name: 'Cash at Gate 1 (Month 3)',
    description: 'Seed round minus stealth pilot burn',
    expression: 'A1 − (E1 × 3)',
    inputs: ['A1', 'E1'],
    output: 'E3',
    compute: (v) => v['A1'] - v['E1'] * 3,
  },
  {
    id: 'STEALTH_PILOT',
    name: 'Stealth Pilot Total (M1–M3)',
    description: 'Three months of burn rate',
    expression: 'E1 × 3',
    inputs: ['E1'],
    output: 'D1',
    compute: (v) => v['E1'] * 3,
  },
  {
    id: 'REV_PLATFORM',
    name: 'Platform MRR (Year 3)',
    description: '50% of Year 3 ARR target',
    expression: 'B5 × 0.50',
    inputs: ['B5'],
    output: 'B8',
    compute: (v) => v['B5'] * 0.50,
  },
  {
    id: 'REV_CONSULTING',
    name: 'Consulting & Implementation (Year 3)',
    description: '25% of Year 3 ARR target',
    expression: 'B5 × 0.25',
    inputs: ['B5'],
    output: 'B9',
    compute: (v) => v['B5'] * 0.25,
  },
  {
    id: 'REV_TRAINING',
    name: 'Training & Certification (Year 3)',
    description: '15% of Year 3 ARR target',
    expression: 'B5 × 0.15',
    inputs: ['B5'],
    output: 'B10',
    compute: (v) => v['B5'] * 0.15,
  },
  {
    id: 'REV_CUSTOM',
    name: 'Custom Development (Year 3)',
    description: '10% of Year 3 ARR target',
    expression: 'B5 × 0.10',
    inputs: ['B5'],
    output: 'B11',
    compute: (v) => v['B5'] * 0.10,
  },
];

// ─── Variable Map Builder ────────────────────────────────────────

/**
 * Build a flat map of variable ID → numeric value from the registry,
 * filling in KNOWN_NUMERICS for text-type variables with known meanings.
 */
export function buildVarMap(registry: RegistryResult): Record<string, number> {
  const map: Record<string, number> = {};

  for (const v of registry.variables) {
    if (v.parsedValue.numeric !== undefined) {
      map[v.id] = v.parsedValue.numeric;
    }
  }

  // Overlay known numerics for text-parsed variables
  for (const [id, num] of Object.entries(KNOWN_NUMERICS)) {
    if (map[id] === undefined) {
      map[id] = num;
    }
  }

  return map;
}

// ─── Formula Computation ─────────────────────────────────────────

const formulaIndex = new Map<string, Formula>();
for (const f of FORMULAS) {
  formulaIndex.set(f.id, f);
}

/**
 * Compute a single formula by ID.
 * Returns NaN if inputs are missing.
 */
export function computeFormula(
  formulaId: string,
  vars: Record<string, number>
): number {
  const formula = formulaIndex.get(formulaId);
  if (!formula) {
    throw new Error(`Unknown formula: ${formulaId}`);
  }
  return formula.compute(vars);
}

/**
 * Compute all formulas and return a map of formula ID → result.
 */
export function computeAll(
  vars: Record<string, number>
): Record<string, number> {
  const results: Record<string, number> = {};
  for (const f of FORMULAS) {
    results[f.id] = f.compute(vars);
  }
  return results;
}

/**
 * Compute all formulas with original vars and with overrides applied.
 * Returns original values, adjusted values, and deltas.
 */
export function computeWithOverrides(
  vars: Record<string, number>,
  overrides: Record<string, number>
): {
  original: Record<string, number>;
  adjusted: Record<string, number>;
  deltas: Record<string, number>;
} {
  const original = computeAll(vars);

  const adjustedVars = { ...vars, ...overrides };
  const adjusted = computeAll(adjustedVars);

  const deltas: Record<string, number> = {};
  for (const key of Object.keys(original)) {
    deltas[key] = adjusted[key] - original[key];
  }

  return { original, adjusted, deltas };
}

// ─── Dependency Graph ────────────────────────────────────────────

/**
 * Returns a graph mapping each variable ID to the formula IDs that use it as input.
 */
export function getDependencyGraph(): Record<string, string[]> {
  const graph: Record<string, string[]> = {};

  for (const f of FORMULAS) {
    for (const inputId of f.inputs) {
      if (!graph[inputId]) {
        graph[inputId] = [];
      }
      graph[inputId].push(f.id);
    }
  }

  return graph;
}

/**
 * Get all formulas whose output would change if the given variable changes.
 * This includes direct dependents.
 */
export function getDownstreamFormulas(variableId: string): Formula[] {
  const graph = getDependencyGraph();
  const affected = new Set<string>();

  // BFS through dependency graph
  const queue = [variableId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const dependents = graph[current] || [];
    for (const formulaId of dependents) {
      if (!affected.has(formulaId)) {
        affected.add(formulaId);
        // If this formula's output is itself a variable, check for cascading
        const formula = formulaIndex.get(formulaId)!;
        if (formula.output && graph[formula.output]) {
          queue.push(formula.output);
        }
      }
    }
  }

  return FORMULAS.filter(f => affected.has(f.id));
}
