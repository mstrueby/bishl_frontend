import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      const res = await fetch('/api/logout', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        console.log("Logout success");
        router.push('/');
      } else {
        // Handle error here
        console.log("Logout failed");
      }
    };
    
    logout();
  }, []);

  return (
    <div>
      Logging out...
    </div>
  );
}