
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')
  
  if (hostname === 'bishl.de') {
    return NextResponse.redirect(`https://www.bishl.de${request.nextUrl.pathname}${request.nextUrl.search}`, 301)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}
