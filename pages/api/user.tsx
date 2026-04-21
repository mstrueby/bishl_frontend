import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '../../lib/serverAuth';
import axios from 'axios';

const userHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No access token provided' });
      }

      const accessToken = authHeader.substring(7);

      const result = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const userData = result.data?.data || result.data;
      res.status(200).json(userData);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error(`User fetch error: HTTP ${error.response.status} - Failed to fetch user`);
        res.status(error.response.status).json({
          error: error.response.data?.detail || 'Failed to fetch user'
        });
      } else {
        console.error('User fetch error: unexpected error');
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}

export default userHandler;
