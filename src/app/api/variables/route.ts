import { NextRequest, NextResponse } from 'next/server';
import { getManager } from '@/lib/server';
import { buildVarMap, computeAll, FORMULAS } from '@/lib/formulas';

export async function GET(request: NextRequest) {
  const manager = getManager();
  const registry = manager.getRegistry();
  const scan = manager.getScanResult();
  const vars = buildVarMap(registry);
  const formulaResults = computeAll(vars);

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const id = searchParams.get('id');

  if (id) {
    const variable = registry.byId[id];
    if (!variable) {
      return NextResponse.json({ error: 'Variable not found' }, { status: 404 });
    }
    return NextResponse.json({
      ...variable,
      occurrences: scan.byVariable[id] || [],
    });
  }

  if (category) {
    const catVars = registry.byCategory[category as keyof typeof registry.byCategory];
    if (!catVars) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    return NextResponse.json(catVars.map(v => ({
      ...v,
      occurrenceCount: (scan.byVariable[v.id] || []).length,
    })));
  }

  return NextResponse.json({
    variables: registry.variables.map(v => ({
      id: v.id,
      category: v.category,
      name: v.name,
      value: v.value,
      parsedValue: v.parsedValue,
      confidence: v.confidence,
      occurrenceCount: (scan.byVariable[v.id] || []).length,
    })),
    byCategory: Object.fromEntries(
      Object.entries(registry.byCategory).map(([cat, vars]) => [
        cat,
        vars.map(v => v.id),
      ])
    ),
    formulaResults,
    resolvedDecisions: registry.resolvedDecisions,
  });
}
