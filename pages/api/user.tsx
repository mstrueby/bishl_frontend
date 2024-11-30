import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jwt } = req.cookies;
  if (req.method === 'GET') {
    try {
      const userData = await fetch(`${process.env['NEXT_PUBLIC_API_URL']}/users/me`, {
                                    method: 'GET',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${jwt}`
                                    }
                                  }); // Example fetch function
      const user = await userData.json();
  
      // Check if user data is available
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return; // Ensure to return here
      }
  
      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
