
import cookie from 'cookie'
import { NextApiRequest, NextApiResponse } from 'next'

const loginHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const { email, password } = req.body
    try {
      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password })
      })

      let data;
      const responseText = await result.text();
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Response text:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      if (result.ok) {
        const jwt = data.token
        res.status(200).setHeader('Set-Cookie', cookie.serialize(
          'jwt', jwt, 
          { 
            path: '/', 
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * parseInt(process.env['COOKIE_MAXAGE_MIN'] || '60', 10)
          }
        )).json({ 
          'email': data['user']['email'],
          'role': data['user']['role'],
          'jwt': jwt
        })
      } else {
        res.status(result.status).json({ error: data.detail || 'Authentication failed' })
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error during login' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({message: `Method ${req.method} not allowed`})
  }
}

export default loginHandler;
