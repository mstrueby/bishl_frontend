
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../hooks/useAuth';

const Logout = () => {
  const { setUser } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Clear tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Clear user from context
    setUser(null);
    
    // Redirect to home
    router.push('/');
  }, [router, setUser]);

  return <></>;
};

export default Logout;
