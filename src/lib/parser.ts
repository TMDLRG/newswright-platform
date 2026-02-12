/**
 * NewsWright Investor Platform — Markdown Parser Engine
 *
 * Parses .md files into structured ParsedDocument objects.
 * Uses custom line-based parsing for metadata, sections, and tables.
 * Stores raw content for perfect round-trip fidelity.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ParsedDocument,
  Section,
  ParsedTable,
  ParsedValue,
  DocumentTier,
  TIER_MAP,
  DOCUMENT_COUNT,
} from './types';

// ─── Metadata Extraction ───────────────────────────────────────────

export interface DocumentMetadata {
  title: string;
  subtitle?: string;
  version: string;
  date: string;
  status?: string;
}

export function extractMetadata(raw: string, filename: string): DocumentMetadata {
  const lines = raw.split('\n');
  let title = '';
  let subtitle: string | undefined;
  let version = '';
  let date = '';
  let status: string | undefined;

  // Title is the first # heading
  for (const line of lines) {
    if (line.startsWith('# ') && !title) {
      title = line.replace(/^#+\s*/, '').trim();
      break;
    }
  }

  // Subtitle from ## heading right after title
  let foundTitle = false;
  for (const line of lines) {
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      foundTitle = true;
      continue;
    }
    if (foundTitle && line.startsWith('## ') && !subtitle) {
      subtitle = line.replace(/^#+\s*/, '').trim();
      break;
    }
    if (foundTitle && line.trim() !== '' && !line.startsWith('#') && !line.startsWith('*') && !line.startsWith('|') && !line.startsWith('-')) {
      break;
    }
  }

  // Version: look for **Version:** pattern or | Version | value | table format
  const versionMatch = raw.match(/\*\*Version:\*\*\s*([^\s|]+)/);
  if (versionMatch) {
    version = versionMatch[1].replace(/[^0-9.]/g, '');
  }
  if (!version) {
    const tableVersionMatch = raw.match(/\|\s*Version\s*\|\s*([^\s|]+)/);
    if (tableVersionMatch) {
      version = tableVersionMatch[1].replace(/[^0-9.]/g, '');
    }
  }
  if (!version) {
    const plainVersionMatch = raw.match(/Version[:\s]+(\d+\.\d+)/i);
    if (plainVersionMatch) {
      version = plainVersionMatch[1];
    }
  }

  // Date
  const dateMatch = raw.match(/\*\*Date:\*\*\s*([^|*\n]+)/);
  if (dateMatch) {
    date = dateMatch[1].trim();
  }
  if (!date) {
    const tableDateMatch = raw.match(/\|\s*Date\s*\|\s*([^|]+)/);
    if (tableDateMatch) {
      date = tableDateMatch[1].trim();
    }
  }

  // Status
  const statusMatch = raw.match(/\*\*Status:\*\*\s*([^|*\n]+)/);
  if (statusMatch) {
    status = statusMatch[1].trim();
  }
  if (!status) {
    const tableStatusMatch = raw.match(/\|\s*Status\s*\|\s*([^|]+)/);
    if (tableStatusMatch) {
      status = tableStatusMatch[1].trim();
    }
  }

  return { title, subtitle, version, date, status };
}

// ─── Section Extraction ────────────────────────────────────────────

interface RawSection extends Section {
  _index: number;
}

export function extractSections(raw: string): Section[] {
  const lines = raw.split('\n');
  const allSections: RawSection[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4;
      const heading = headingMatch[2].trim();
      allSections.push({
        heading,
        level,
        startLine: i,
        endLine: i,
        content: '',
        children: [],
        _index: allSections.length,
      });
    }
  }

  // Set endLine for each section
  for (let i = 0; i < allSections.length; i++) {
    if (i + 1 < allSections.length) {
      allSections[i].endLine = allSections[i + 1].startLine - 1;
    } else {
      allSections[i].endLine = lines.length - 1;
    }
    allSections[i].content = lines.slice(allSections[i].startLine, allSections[i].endLine + 1).join('\n');
  }

  // Build hierarchy
  const rootSections: Section[] = [];
  const stack: Section[] = [];

  for (const rawSection of allSections) {
    const section: Section = {
      heading: rawSection.heading,
      level: rawSection.level,
      startLine: rawSection.startLine,
      endLine: rawSection.endLine,
      content: rawSection.content,
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      rootSections.push(section);
    } else {
      stack[stack.length - 1].children.push(section);
    }
    stack.push(section);
  }

  return rootSections;
}

// ─── Table Extraction ──────────────────────────────────────────────

export function extractTables(raw: string): ParsedTable[] {
  const lines = raw.split('\n');
  const tables: ParsedTable[] = [];
  let tableCounter = 0;

  let i = 0;
  while (i < lines.length) {
    if (
      lines[i].trim().startsWith('|') &&
      i + 1 < lines.length &&
      /^\|[\s\-:|]+\|/.test(lines[i + 1].trim())
    ) {
      const startLine = i;
      const headers = parseTableRow(lines[i].trim());

      // Skip separator
      i += 2;

      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseTableRow(lines[i].trim()));
        i++;
      }

      const endLine = i - 1;
      tableCounter++;

      // Find nearest heading above
      let sectionPath = '';
      for (let j = startLine - 1; j >= 0; j--) {
        const headingMatch = lines[j].match(/^(#{1,4})\s+(.+)/);
        if (headingMatch) {
          sectionPath = headingMatch[2].trim();
          break;
        }
      }

      tables.push({
        id: `table_${tableCounter}`,
        sectionPath,
        headers,
        rows,
        startLine,
        endLine,
      });
    } else {
      i++;
    }
  }

  return tables;
}

function parseTableRow(line: string): string[] {
  return line
    .split('|')
    .map(cell => cell.trim())
    .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
}

// ─── Financial Value Parsing ───────────────────────────────────────

export function parseFinancialValue(raw: string): ParsedValue {
  const trimmed = raw.trim();

  // Range: "$X.XM–$Y.YM" or "$X–$Y" (supports en-dash and hyphen)
  const rangeMatch = trimmed.match(/^\$?([\d,.]+)\s*([MBKmk])?\s*[–\-]\s*\$?([\d,.]+)\s*([MBKmk])?/);
  if (rangeMatch) {
    const low = parseNumericWithSuffix(rangeMatch[1], rangeMatch[2]);
    const high = parseNumericWithSuffix(rangeMatch[3], rangeMatch[4] || rangeMatch[2]);
    if (low !== undefined && high !== undefined) {
      return { raw: trimmed, type: 'range', low, high };
    }
  }

  // Currency with /mo or /month suffix: $249/mo, $500/month
  const currencyPerMonthMatch = trimmed.match(/^\$([\d,.]+)\s*([MBKmk])?\s*\/\s*(mo|month)/i);
  if (currencyPerMonthMatch) {
    const numeric = parseNumericWithSuffix(currencyPerMonthMatch[1], currencyPerMonthMatch[2]);
    if (numeric !== undefined) {
      return { raw: trimmed, type: 'currency', numeric };
    }
  }

  // Currency: $X,XXX or $X.XM or $X.XB or $XK with optional suffix like ARR, MRR
  const currencyMatch = trimmed.match(/^\$([\d,.]+)\s*([MBKmk])?\b/);
  if (currencyMatch) {
    const numeric = parseNumericWithSuffix(currencyMatch[1], currencyMatch[2]);
    if (numeric !== undefined) {
      return { raw: trimmed, type: 'currency', numeric };
    }
  }

  // Percentage: X.X% or ~X%
  const pctMatch = trimmed.match(/^~?([\d,.]+)\s*%/);
  if (pctMatch) {
    const numeric = parseFloat(pctMatch[1].replace(/,/g, '')) / 100;
    return { raw: trimmed, type: 'percentage', numeric };
  }

  // Multiplier: Xx (like 10x, 2.6x)
  const multMatch = trimmed.match(/^([\d,.]+)\s*x$/i);
  if (multMatch) {
    const numeric = parseFloat(multMatch[1].replace(/,/g, ''));
    return { raw: trimmed, type: 'decimal', numeric };
  }

  // Integer with commas: X,XXX
  const intMatch = trimmed.match(/^([\d,]+)$/);
  if (intMatch && intMatch[1].includes(',')) {
    const numeric = parseInt(intMatch[1].replace(/,/g, ''), 10);
    return { raw: trimmed, type: 'integer', numeric };
  }

  // Plain integer
  const plainIntMatch = trimmed.match(/^(\d+)$/);
  if (plainIntMatch) {
    const numeric = parseInt(plainIntMatch[1], 10);
    return { raw: trimmed, type: 'integer', numeric };
  }

  // Decimal number
  const decMatch = trimmed.match(/^([\d.]+)$/);
  if (decMatch) {
    const numeric = parseFloat(decMatch[1]);
    return { raw: trimmed, type: 'decimal', numeric };
  }

  // Plain text
  return { raw: trimmed, type: 'text' };
}

function parseNumericWithSuffix(numStr: string, suffix?: string): number | undefined {
  const num = parseFloat(numStr.replace(/,/g, ''));
  if (isNaN(num)) return undefined;

  switch (suffix?.toUpperCase()) {
    case 'M': return num * 1_000_000;
    case 'B': return num * 1_000_000_000;
    case 'K': return num * 1_000;
    default: return num;
  }
}

// ─── Tier Mapping ──────────────────────────────────────────────────

export function getTierForId(id: string): DocumentTier {
  const entry = TIER_MAP[id];
  if (entry) return entry.tier;
  const num = parseInt(id, 10);
  if (num <= 6) return 1;
  if (num <= 10) return 2;
  if (num <= 12) return 3;
  if (num <= 18) return 4;
  return 5;
}

// ─── Full Document Parser ──────────────────────────────────────────

export function parseDocument(raw: string, filename: string): ParsedDocument {
  const id = filename.match(/^(\d{2})_/)?.[1] || '00';
  const meta = extractMetadata(raw, filename);
  const sections = extractSections(raw);
  const tables = extractTables(raw);
  const tierInfo = TIER_MAP[id] || { tier: 5 as DocumentTier, label: 'Unknown' };

  // Build a lightweight AST representation (line-based)
  // Full remark AST will be used server-side in exporters
  const ast = { type: 'root' as const, children: [], position: undefined } as any;

  return {
    id,
    filename,
    title: meta.title,
    subtitle: meta.subtitle,
    version: meta.version,
    date: meta.date,
    status: meta.status,
    tier: tierInfo.tier,
    tierLabel: tierInfo.label,
    sections,
    tables,
    raw,
    ast,
  };
}

// ─── Batch Parser ──────────────────────────────────────────────────

export function parseAllDocuments(docsDir: string): ParsedDocument[] {
  const files = fs.readdirSync(docsDir)
    .filter(f => f.endsWith('.md'))
    .sort();

  return files.map(filename => {
    const raw = fs.readFileSync(path.join(docsDir, filename), 'utf-8');
    return parseDocument(raw, filename);
  });
}
