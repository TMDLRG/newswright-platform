import { NextRequest, NextResponse } from 'next/server';
import { validateEditToken } from '@/lib/server';

/**
 * POST /api/auth — Validate edit token
 * Body: { token: "..." }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const isValid = validateEditToken(`Bearer ${token}`);

  return NextResponse.json({
    valid: isValid,
    mode: isValid ? 'edit' : 'view',
  });
}
