import { NextRequest, NextResponse } from 'next/server';
import { getManager, validateEditToken } from '@/lib/server';
import * as fs from 'fs';
import * as path from 'path';
import { PACKAGE_DIR } from '@/lib/types';

export async function GET(request: NextRequest) {
  const manager = getManager();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const tier = searchParams.get('tier');

  if (id) {
    const doc = manager.getById(id);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: doc.id,
      filename: doc.filename,
      title: doc.title,
      subtitle: doc.subtitle,
      version: doc.version,
      date: doc.date,
      status: doc.status,
      tier: doc.tier,
      tierLabel: doc.tierLabel,
      sections: doc.sections,
      tables: doc.tables,
      raw: doc.raw,
    });
  }

  if (tier) {
    const docs = manager.getByTier(parseInt(tier) as 1 | 2 | 3 | 4 | 5);
    return NextResponse.json(
      docs.map(d => ({
        id: d.id,
        filename: d.filename,
        title: d.title,
        tier: d.tier,
        tierLabel: d.tierLabel,
      }))
    );
  }

  // Return summaries for all documents
  return NextResponse.json(manager.getDocumentSummaries());
}

/**
 * PUT /api/documents — Save document content (requires auth)
 * Body: { id: "01", content: "..." }
 */
export async function PUT(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!validateEditToken(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, content } = body;

  if (!id || typeof content !== 'string') {
    return NextResponse.json(
      { error: 'Missing id or content' },
      { status: 400 }
    );
  }

  const manager = getManager();
  const doc = manager.getById(id);
  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Update in-memory document (always works, even on read-only filesystems)
  doc.raw = content;

  // Try to persist to disk (fails gracefully on Vercel)
  try {
    const filePath = path.join(PACKAGE_DIR, doc.filename);
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch {
    console.warn(`[ephemeral] Could not write ${doc.filename} to disk`);
  }

  return NextResponse.json({
    success: true,
    filename: doc.filename,
    sizeBytes: Buffer.byteLength(content, 'utf-8'),
  });
}
