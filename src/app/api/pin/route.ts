import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

/**
 * POST /api/pin — Validate 6-digit PIN and set access cookie.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { pin } = body;

  if (!pin || typeof pin !== 'string' || pin.length !== 6) {
    return NextResponse.json({ error: 'Invalid PIN format' }, { status: 400 });
  }

  const expectedPin = process.env.ACCESS_PIN || '123456';

  if (pin !== expectedPin) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
  }

  // Generate daily-rotated hash for the cookie
  const today = new Date().toISOString().slice(0, 10);
  const hash = createHash('sha256')
    .update(`${expectedPin}:${today}`)
    .digest('hex');

  const response = NextResponse.json({ success: true });

  response.cookies.set('nw-access', hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return response;
}
