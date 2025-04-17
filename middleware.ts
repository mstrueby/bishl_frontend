
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.url;
  const hostname = request.headers.get('host');

  // Keep the www redirect
  if (hostname === 'bishl.de') {
    return NextResponse.redirect(
      `https://www.bishl.de${request.nextUrl.pathname}${request.nextUrl.search}`,
      301
    );
  }
  
  // Allow only essential paths and redirect everything else to home
  const allowedPaths = ['/', '/api', '/_next', '/static'];
  const isAllowedPath = allowedPaths.some(path => request.nextUrl.pathname.startsWith(path));
  
  if (!isAllowedPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
}
