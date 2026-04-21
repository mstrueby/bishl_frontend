
import { NextApiRequest, NextApiResponse } from 'next'

import { withRateLimit } from '../../lib/rateLimit';
import { withCSRF } from '../../lib/csrf';
import { logApiError } from '../../lib/apiLogger';

const loginHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const { email, password } = req.body
    
    // Basic input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    let httpStatus: number | undefined;
    try {
      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password })
      })

      httpStatus = result.status;

      let data;
      const responseText = await result.text();
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        logApiError('login', httpStatus, 'Invalid JSON response');
        throw new Error('Invalid JSON response from server');
      }

      if (result.ok) {
        // Backend now returns: {access_token, refresh_token, token_type, expires_in}
        const { access_token, refresh_token, token_type, expires_in } = data;
        
        // Return tokens to client for localStorage storage
        // Client will also need to fetch user info separately using the access token
        res.status(200).json({ 
          access_token,
          refresh_token,
          token_type,
          expires_in
        })
      } else {
        res.status(result.status).json({ error: data.detail || 'Authentication failed' })
      }
    } catch (error) {
      logApiError('login', httpStatus, 'Unexpected error during login');
      res.status(500).json({ error: 'Internal server error during login' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({message: `Method ${req.method} not allowed`})
  }
}

// Apply rate limiting: 5 login attempts per minute per IP
export default withRateLimit(withCSRF(loginHandler), {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 attempts
});
