import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

/**
 * Global PIN authentication middleware.
 * Intercepts every request and checks for a valid `nw-access` cookie.
 * If missing/invalid → redirect to /pin.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that don't require PIN authentication
  if (
    pathname === '/pin' ||
    pathname === '/api/pin' ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check for valid access cookie
  const accessCookie = request.cookies.get('nw-access')?.value;
  const expectedPin = process.env.ACCESS_PIN || '123456';
  const today = new Date().toISOString().slice(0, 10); // daily rotation
  const expectedHash = createHash('sha256')
    .update(`${expectedPin}:${today}`)
    .digest('hex');

  if (accessCookie === expectedHash) {
    return NextResponse.next();
  }

  // Redirect to PIN page
  const pinUrl = new URL('/pin', request.url);
  return NextResponse.redirect(pinUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
