import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to handle redirects
 * Redirects root path to /admin
 */
export function middleware(request: NextRequest) {
  // Redirect root to /admin
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
