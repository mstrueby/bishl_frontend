import cookie from 'cookie'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {  
  res.status(200).setHeader('Set-Cookie', cookie.serialize(
    'jwt', 
    '', 
    { 
      path: '/', 
      httpOnly: true,
      sameSite: 'strict',
      maxAge: -1
    }
  )).end()
}

export default handler