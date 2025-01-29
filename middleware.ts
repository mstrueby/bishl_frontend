
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
  
  if ((url.includes('/leaguemanager') || url.includes('/admin')) && !cookie) { // simplified condition
    let loginUrl = `${process.env['NEXT_FRONTEND_URL']}/login`; // used template literals for consistency
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
}
