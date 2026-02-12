import { NextRequest, NextResponse } from 'next/server';
import { getManager, validateEditToken } from '@/lib/server';

/**
 * POST /api/cascade — Generate cascade preview
 * Body: { changes: { F4: "9,000", B7: "$550/month" } }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { changes } = body;

  if (!changes || typeof changes !== 'object') {
    return NextResponse.json(
      { error: 'Missing or invalid "changes" object' },
      { status: 400 }
    );
  }

  const manager = getManager();
  const preview = manager.generateCascadePreview(changes);

  return NextResponse.json(preview);
}

/**
 * PUT /api/cascade — Apply cascade (requires auth)
 * Body: { changes: { F4: "9,000" } }
 */
export async function PUT(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!validateEditToken(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { changes } = body;

  if (!changes || typeof changes !== 'object') {
    return NextResponse.json(
      { error: 'Missing or invalid "changes" object' },
      { status: 400 }
    );
  }

  const manager = getManager();
  const preview = manager.generateCascadePreview(changes);
  const writtenFiles = manager.applyCascadeAndWrite(preview);

  return NextResponse.json({
    success: true,
    filesWritten: writtenFiles,
    changeCount: preview.totalChangeCount,
    affectedDocuments: preview.affectedDocumentCount,
  });
}
