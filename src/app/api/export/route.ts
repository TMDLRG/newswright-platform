import { NextRequest, NextResponse } from 'next/server';
import { getManager } from '@/lib/server';

/**
 * POST /api/export — Export documents
 * Body: { documentIds: ["01", "04"] | ["all"], format: "md" | "docx" | "both" }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { documentIds, format } = body;

  if (!documentIds || !Array.isArray(documentIds)) {
    return NextResponse.json(
      { error: 'Missing documentIds array' },
      { status: 400 }
    );
  }

  if (!format || !['md', 'docx', 'both'].includes(format)) {
    return NextResponse.json(
      { error: 'Format must be "md", "docx", or "both"' },
      { status: 400 }
    );
  }

  const manager = getManager();
  const allDocs = manager.getAll();
  const isAll = documentIds.includes('all');
  const targetIds = isAll
    ? allDocs.map(d => d.id)
    : documentIds;

  const results: Array<{ filename: string; format: string; sizeBytes: number }> = [];

  if (format === 'md' || format === 'both') {
    for (const id of targetIds) {
      const content = manager.exportMarkdown(id);
      if (content) {
        const doc = manager.getById(id)!;
        results.push({
          filename: doc.filename,
          format: 'md',
          sizeBytes: Buffer.byteLength(content, 'utf-8'),
        });
      }
    }
  }

  if (format === 'docx' || format === 'both') {
    for (const id of targetIds) {
      const buffer = await manager.exportDocx(id);
      if (buffer) {
        const doc = manager.getById(id)!;
        results.push({
          filename: doc.filename.replace(/\.md$/, '.docx'),
          format: 'docx',
          sizeBytes: buffer.length,
        });
      }
    }
  }

  return NextResponse.json({
    files: results,
    totalFiles: results.length,
  });
}
