
import { NextApiRequest, NextApiResponse } from 'next'

const logoutHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    // Logout is now handled client-side by clearing localStorage
    // This endpoint can remain for backward compatibility but does nothing
    res.status(200).json({ message: 'Logged out successfully' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}

export default logoutHandler;
