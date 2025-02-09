
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {

  const url = request.url; // corrected variable name
  let cookie = request.cookies.get('jwt'); // corrected variable name

  const hostname = request.headers.get('host')

  if (hostname === 'bishl.de') {
    return NextResponse.redirect(
      `https://www.bishl.de${request.nextUrl.pathname}${request.nextUrl.search}`,
      301
    );
  }
  
  if ((url.includes('/leaguemanager') || url.includes('/admin')) && !cookie) {
    const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_URL || 'https://' + request.headers.get('host'));
    return NextResponse.redirect(loginUrl.toString());
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
}
