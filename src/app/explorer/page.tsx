'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Variable {
  id: string;
  category: string;
  name: string;
  value: string;
  parsedValue: { type: string; numeric?: number };
  confidence: number;
  occurrenceCount: number;
}

interface RegistryData {
  variables: Variable[];
  byCategory: Record<string, string[]>;
  formulaResults: Record<string, number>;
  resolvedDecisions: Array<{ id: string; question: string; resolution: string; source: string }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  A: 'Investment & Valuation',
  B: 'Revenue & Growth',
  C: 'Pricing Model',
  D: 'Use of Funds',
  E: 'Burn & Runway',
  F: 'Market Sizing',
  G: 'Pilot & Ops',
  H: 'Return Analysis',
  I: 'Exit & Valuation',
  J: 'Technical & Product',
};

const SLIDER_CONFIG = [
  { varId: 'B7', label: 'ARPU ($/mo)', min: 300, max: 800, step: 10, format: '$' },
  { varId: 'H1', label: 'Exit Multiple', min: 5, max: 15, step: 0.5, format: 'x' },
  { varId: 'F4', label: 'US Market Size', min: 5000, max: 12000, step: 100, format: ',' },
];

export default function ExplorerPage() {
  const [data, setData] = useState<RegistryData | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('A');
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  const [adjustedFormulas, setAdjustedFormulas] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/variables')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        // Initialize slider values from current data
        const initial: Record<string, number> = {};
        for (const s of SLIDER_CONFIG) {
          const v = d.variables.find((v: Variable) => v.id === s.varId);
          if (v?.parsedValue.numeric) initial[s.varId] = v.parsedValue.numeric;
        }
        // H1 is text "10x ARR", default to 10
        if (!initial['H1']) initial['H1'] = 10;
        setSliderValues(initial);
        setAdjustedFormulas(d.formulaResults);
      });
  }, []);

  const handleSliderChange = (varId: string, value: number) => {
    const newValues = { ...sliderValues, [varId]: value };
    setSliderValues(newValues);

    // Recompute formulas client-side
    const f4 = newValues['F4'] || 8654;
    const b7 = newValues['B7'] || 500;
    const h1 = newValues['H1'] || 10;
    const b5 = 6000000; // Fixed Y3 ARR target
    const b2 = 92;
    const b4 = 338;

    setAdjustedFormulas({
      ...adjustedFormulas,
      US_TAM: f4 * b7 * 12,
      M12_ARR: b2 * b7 * 12,
      M24_ARR: b4 * b7 * 12,
      EXIT_VAL_Y3: b5 * h1,
      PENETRATION_BASE: 908 / f4,
      PENETRATION_STRETCH: 1000 / f4,
    });
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading financial data...</div>
      </div>
    );
  }

  const categories = Object.keys(CATEGORY_LABELS);
  const categoryVars = data.variables.filter((v) => v.category === activeCategory);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-nw-primary">Financial Explorer</h1>

      {/* What-If Sliders */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">What-If Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SLIDER_CONFIG.map((s) => {
            const current = sliderValues[s.varId] || 0;
            const original = data.variables.find((v) => v.id === s.varId)?.parsedValue.numeric || (s.varId === 'H1' ? 10 : 0);
            const delta = current - original;
            return (
              <div key={s.varId} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{s.label}</span>
                  <span className="font-mono text-nw-primary">
                    {s.format === '$' && '$'}
                    {s.format === ',' ? current.toLocaleString() : current}
                    {s.format === 'x' && 'x'}
                    {delta !== 0 && (
                      <span className={`ml-1 text-xs ${delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        ({delta > 0 ? '+' : ''}{s.format === '$' ? '$' : ''}{s.format === ',' ? delta.toLocaleString() : delta}{s.format === 'x' ? 'x' : ''})
                      </span>
                    )}
                  </span>
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={current}
                  onChange={(e) => handleSliderChange(s.varId, parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-nw-accent"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{s.format === '$' ? '$' : ''}{s.min.toLocaleString()}{s.format === 'x' ? 'x' : ''}</span>
                  <span>{s.format === '$' ? '$' : ''}{s.max.toLocaleString()}{s.format === 'x' ? 'x' : ''}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Computed Results */}
        <div className="mt-6 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="US TAM" value={`$${(adjustedFormulas.US_TAM / 1_000_000).toFixed(1)}M`} />
          <MetricCard label="M12 ARR" value={`$${(adjustedFormulas.M12_ARR / 1000).toFixed(0)}K`} />
          <MetricCard label="Y3 Exit" value={`$${(adjustedFormulas.EXIT_VAL_Y3 / 1_000_000).toFixed(0)}M`} />
          <MetricCard label="Penetration (Base)" value={`${(adjustedFormulas.PENETRATION_BASE * 100).toFixed(1)}%`} />
        </div>
      </div>

      {/* Variable Category Browser */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex overflow-x-auto border-b">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeCategory === cat
                  ? 'border-nw-accent text-nw-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {cat}. {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                <th className="py-2 px-2 w-16">ID</th>
                <th className="py-2 px-2">Variable</th>
                <th className="py-2 px-2">Value</th>
                <th className="py-2 px-2 w-20 text-center">Conf.</th>
                <th className="py-2 px-2 w-24 text-center">Cross-refs</th>
              </tr>
            </thead>
            <tbody>
              {categoryVars.map((v) => (
                <tr key={v.id} className="border-t border-gray-100 hover:bg-blue-50/50">
                  <td className="py-2 px-2 font-mono text-xs text-gray-400">{v.id}</td>
                  <td className="py-2 px-2 font-medium text-gray-700">{v.name}</td>
                  <td className="py-2 px-2">
                    <span className={`font-mono text-xs ${
                      v.parsedValue.type === 'currency' ? 'text-emerald-700' :
                      v.parsedValue.type === 'percentage' ? 'text-blue-700' :
                      v.parsedValue.type === 'integer' ? 'text-purple-700' :
                      'text-gray-600'
                    }`}>
                      {v.value}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <ConfidenceDots level={v.confidence} />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                      v.occurrenceCount > 10 ? 'bg-blue-100 text-blue-700' :
                      v.occurrenceCount > 5 ? 'bg-blue-50 text-blue-600' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {v.occurrenceCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolved Decisions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Resolved Decisions (Q1-Q8)</h2>
        <div className="space-y-3">
          {data.resolvedDecisions.map((d) => (
            <div key={d.id} className="flex gap-3 text-sm">
              <span className="font-mono text-xs text-gray-400 w-8 flex-shrink-0 pt-0.5">{d.id}</span>
              <div>
                <div className="text-gray-600">{d.question}</div>
                <div className="font-medium text-nw-primary mt-0.5">{d.resolution}</div>
                <div className="text-xs text-gray-400 mt-0.5">Source: {d.source}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-nw-primary font-mono">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function ConfidenceDots({ level }: { level: number }) {
  return (
    <div className="flex justify-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= level ? 'bg-nw-accent' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}
