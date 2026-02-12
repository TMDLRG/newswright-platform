/**
 * NewsWright Investor Platform — DOCX Exporter
 *
 * Converts ParsedDocument objects into Word (.docx) files using the `docx` npm package.
 * Walks the markdown content line-by-line and converts to docx elements.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Footer,
  PageNumber,
  Header,
  ShadingType,
} from 'docx';
import { ParsedDocument } from './types';

// ─── Types ──────────────────────────────────────────────────────

export interface DocxResult {
  filename: string;
  buffer: Buffer;
}

// ─── Inline Text Parsing ─────────────────────────────────────────

interface InlineRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

/**
 * Parse markdown inline formatting into TextRun-compatible segments.
 * Handles **bold**, *italic*, and ***bold italic***.
 */
function parseInlineFormatting(text: string): InlineRun[] {
  const runs: InlineRun[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Bold+Italic: ***text***
    const boldItalicMatch = remaining.match(/^\*\*\*(.+?)\*\*\*/);
    if (boldItalicMatch) {
      runs.push({ text: boldItalicMatch[1], bold: true, italic: true });
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      runs.push({ text: boldMatch[1], bold: true });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text*
    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      runs.push({ text: italicMatch[1], italic: true });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Find next formatting marker
    const nextStar = remaining.indexOf('*', 0);
    if (nextStar > 0) {
      runs.push({ text: remaining.slice(0, nextStar) });
      remaining = remaining.slice(nextStar);
    } else {
      runs.push({ text: remaining });
      remaining = '';
    }
  }

  return runs;
}

function createTextRuns(text: string): TextRun[] {
  const runs = parseInlineFormatting(text);
  return runs.map(
    r =>
      new TextRun({
        text: r.text,
        bold: r.bold,
        italics: r.italic,
        font: 'Calibri',
        size: 22, // 11pt
      })
  );
}

// ─── Line-to-Element Conversion ──────────────────────────────────

function convertLinesToElements(raw: string): (Paragraph | Table)[] {
  const lines = raw.split('\n');
  const elements: (Paragraph | Table)[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines (add spacing instead)
    if (trimmed === '') {
      i++;
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const headingLevel = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
      ][level - 1];

      elements.push(
        new Paragraph({
          heading: headingLevel,
          children: [
            new TextRun({
              text,
              font: 'Calibri',
              bold: level <= 2,
            }),
          ],
          spacing: { before: level === 1 ? 360 : 240, after: 120 },
        })
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(
        new Paragraph({
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999' },
          },
          spacing: { before: 120, after: 120 },
        })
      );
      i++;
      continue;
    }

    // Table detection
    if (
      trimmed.startsWith('|') &&
      i + 1 < lines.length &&
      /^\|[\s\-:|]+\|/.test(lines[i + 1].trim())
    ) {
      const table = parseAndConvertTable(lines, i);
      elements.push(table.element);
      i = table.endIndex + 1;
      continue;
    }

    // Bullet list
    if (trimmed.match(/^[-*+]\s/)) {
      const bulletText = trimmed.replace(/^[-*+]\s+/, '');
      elements.push(
        new Paragraph({
          bullet: { level: 0 },
          children: createTextRuns(bulletText),
          spacing: { before: 60, after: 60 },
        })
      );
      i++;
      continue;
    }

    // Numbered list
    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        new Paragraph({
          numbering: { reference: 'default-numbering', level: 0 },
          children: createTextRuns(numberedMatch[1]),
          spacing: { before: 60, after: 60 },
        })
      );
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      elements.push(
        new Paragraph({
          children: createTextRuns(quoteText),
          indent: { left: 720 }, // 0.5 inch
          spacing: { before: 60, after: 60 },
          border: {
            left: { style: BorderStyle.SINGLE, size: 12, color: '4472C4' },
          },
        })
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      new Paragraph({
        children: createTextRuns(trimmed),
        spacing: { before: 60, after: 60 },
      })
    );
    i++;
  }

  return elements;
}

// ─── Table Conversion ────────────────────────────────────────────

function parseAndConvertTable(
  lines: string[],
  startIdx: number
): { element: Table; endIndex: number } {
  // Parse header row
  const headerCells = parseTableRow(lines[startIdx]);

  // Skip separator line
  let i = startIdx + 2;

  // Parse data rows
  const dataRows: string[][] = [];
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    dataRows.push(parseTableRow(lines[i]));
    i++;
  }

  const colCount = headerCells.length;

  // Build Word table
  const tableRows: TableRow[] = [];

  // Header row with shading
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headerCells.map(
        cell =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cell,
                    bold: true,
                    font: 'Calibri',
                    size: 20,
                  }),
                ],
              }),
            ],
            shading: {
              type: ShadingType.CLEAR,
              fill: 'D9E2F3',
            },
          })
      ),
    })
  );

  // Data rows
  for (const row of dataRows) {
    const cells = row.slice(0, colCount);
    // Pad if row has fewer cells
    while (cells.length < colCount) {
      cells.push('');
    }

    tableRows.push(
      new TableRow({
        children: cells.map(
          cell =>
            new TableCell({
              children: [
                new Paragraph({
                  children: createTextRuns(cell),
                }),
              ],
            })
        ),
      })
    );
  }

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });

  return { element: table, endIndex: i - 1 };
}

function parseTableRow(line: string): string[] {
  return line
    .split('|')
    .map(cell => cell.trim())
    .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
}

// ─── Document Generation ─────────────────────────────────────────

/**
 * Generate a .docx Buffer from a ParsedDocument.
 */
export async function generateDocx(doc: ParsedDocument): Promise<Buffer> {
  const elements = convertLinesToElements(doc.raw);

  const document = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
          },
        },
        heading1: {
          run: {
            font: 'Calibri',
            size: 32,
            bold: true,
            color: '1F3864',
          },
        },
        heading2: {
          run: {
            font: 'Calibri',
            size: 28,
            bold: true,
            color: '2E5090',
          },
        },
        heading3: {
          run: {
            font: 'Calibri',
            size: 24,
            bold: true,
            color: '404040',
          },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.START,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,   // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'NEWSWRIGHT — Confidential',
                    font: 'Calibri',
                    size: 16,
                    color: '999999',
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${doc.title} | ${doc.version ? `v${doc.version}` : ''} | ${doc.date || 'February 2026'}`,
                    font: 'Calibri',
                    size: 16,
                    color: '999999',
                  }),
                  new TextRun({
                    text: '    Page ',
                    font: 'Calibri',
                    size: 16,
                    color: '999999',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Calibri',
                    size: 16,
                    color: '999999',
                  }),
                ],
              }),
            ],
          }),
        },
        children: elements,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(document));
}

// ─── Bulk Generation ─────────────────────────────────────────────

export interface DocxExportResult {
  filename: string;
  buffer: Buffer;
}

/**
 * Generate .docx files for all documents.
 */
export async function generateAllDocx(
  documents: ParsedDocument[]
): Promise<Record<string, DocxExportResult>> {
  const results: Record<string, DocxExportResult> = {};

  for (const doc of documents) {
    const buffer = await generateDocx(doc);
    const docxFilename = doc.filename.replace(/\.md$/, '.docx');
    results[doc.id] = { filename: docxFilename, buffer };
  }

  return results;
}
