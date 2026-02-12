import { NextRequest, NextResponse } from 'next/server';

/**
 * Hash a string using Web Crypto API (Edge Runtime compatible).
 */
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Global PIN authentication middleware.
 * Intercepts every request and checks for a valid `nw-access` cookie.
 * If missing/invalid → redirect to /pin.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that don't require PIN authentication
  if (
    pathname === '/pin' ||
    pathname === '/api/pin' ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    // Pass pathname to layout via header
    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    return response;
  }

  // Check for valid access cookie
  const accessCookie = request.cookies.get('nw-access')?.value;
  const expectedPin = process.env.ACCESS_PIN || '123456';
  const today = new Date().toISOString().slice(0, 10); // daily rotation
  const expectedHash = await sha256(`${expectedPin}:${today}`);

  if (accessCookie === expectedHash) {
    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    return response;
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
