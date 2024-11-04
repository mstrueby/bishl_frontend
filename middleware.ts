import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.url;
  let cookie = req.cookies.get('jwt');
  //console.log("Cookie: ", cookie);
  if ((url.includes('/leaguemanager') || url.includes('/admin')) && (cookie === undefined || cookie === null)) {
    let loginUrl = process.env['NEXT_FRONTEND_URL'] + '/login';
    //console.log("URL:" + loginUrl);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}