'use client';

import { ParsedTable } from '@/lib/types';

interface TableRendererProps {
  table: ParsedTable;
}

export default function TableRenderer({ table }: TableRendererProps) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-blue-50">
            {table.headers.map((header, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b border-gray-200"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-3 py-1.5 text-gray-600 border-b border-gray-100 whitespace-nowrap"
                >
                  {renderCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(text: string) {
  // Highlight financial values
  if (text.match(/^\$[\d,.]+(M|K|B)?/)) {
    return <span className="font-medium text-emerald-700">{text}</span>;
  }
  if (text.match(/^\d+(\.\d+)?%$/)) {
    return <span className="font-medium text-blue-700">{text}</span>;
  }
  // Bold markers
  const boldClean = text.replace(/\*\*/g, '');
  if (text.includes('**')) {
    return <strong className="font-semibold">{boldClean}</strong>;
  }
  return text;
}
