import cookie from 'cookie'
import { NextApiRequest, NextApiResponse } from 'next'

const loginHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const { email, password } = req.body
    const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, password })
    })
    let data;
    try {
      data = await result.json();
    } catch (e) {
      console.error('Error parsing response:', await result.text());
      res.status(500).json({ error: 'Invalid response from authentication server' });
      return;
    }
    
    console.log(data)
    
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
        'email':data['user']['email'],
        'role':data['user']['role'],
        'jwt':jwt
      })
    } else {
      data['error'] = data['detail']
      res.status(401)
      res.json(data)
      return
    }
  } else {
    res.setHeader('Allow',['POST'])
    res.status(405).json({message: `Method ${req.method} not Allowed`})
    return
  }  
}

export default loginHandler;