import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const isDemo = process.env.NEXT_PUBLIC_IS_DEMO === 'true';

  res.setHeader('Content-Type', 'text/plain');

  if (isDemo) {
    res.send('User-agent: *\nDisallow: /\n');
  } else {
    res.send('User-agent: *\nAllow: /\nSitemap: https://www.bishl.de/sitemap.xml\n');
  }
}
