
import type { NextApiRequest, NextApiResponse } from 'next';
import { setCookie } from 'cookies-next';
import { generateCSRFToken } from '../../lib/csrf';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const csrfToken = generateCSRFToken();
  
  // Set CSRF token in HTTP-only cookie
  setCookie('csrf-token', csrfToken, {
    req,
    res,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  // Return token for client to include in request headers
  res.status(200).json({ csrfToken });
}
