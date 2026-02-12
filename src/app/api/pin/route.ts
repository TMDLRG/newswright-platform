import { NextRequest, NextResponse } from 'next/server';

/**
 * Hash a string using Web Crypto API (matches middleware hash).
 */
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
  const hash = await sha256(`${expectedPin}:${today}`);

  const response = NextResponse.json({ success: true });

  response.cookies.set('nw-access', hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });

  return response;
}
