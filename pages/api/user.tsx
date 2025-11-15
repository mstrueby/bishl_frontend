import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '../../lib/serverAuth';

const userHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      // Get access token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No access token provided' });
      }

      const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Fetch user info from backend using access token
      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (result.ok) {
        const response = await result.json();
        // Backend returns { success, data: UserValues, message }
        // Extract the actual user data
        const userData = response.data || response;
        console.log('User data fetched successfully:', userData._id);
        res.status(200).json(userData);
      } else {
        console.log('Failed to fetch user, status:', result.status);
        const errorData = await result.json();
        res.status(result.status).json({ error: errorData.detail || 'Failed to fetch user' });
      }
    } catch (error) {
      console.error('User fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}

export default userHandler;