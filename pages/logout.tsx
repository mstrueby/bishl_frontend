import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../hooks/useAuth';

const Logout = () => {
  const { user, setUser } = useAuth();
  const removeCookies = async () => {
    const res = await fetch('/api/logout', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
    });
  };
  const router = useRouter();
  useEffect(() => {
    removeCookies();
    setUser(null);
    router.push('/');
  }, [router, setUser]);

  return <></>;
};

export default Logout;