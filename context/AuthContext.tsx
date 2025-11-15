import { createContext, useState, useEffect, ReactNode } from 'react';

const AuthContext = createContext({});

export const AuthProvider = ({ children }: {children: ReactNode}) => {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Fetch CSRF token first
        const csrfResponse = await fetch('/api/csrf-token');
        const csrfData = await csrfResponse.json();
        if (csrfData.csrfToken) {
          localStorage.setItem('csrf_token', csrfData.csrfToken);
        }

        // Fetch user data
        const userResponse = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          // The /api/user endpoint should already extract the data field,
          // but handle both cases for safety
          const user = userData.data || userData;
          setUser(user);
          setAuthError(null);
        } else {
          setUser(null);
          setAuthError(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setAuthError(error);
      } finally {
        setLoading(false);
      }
    };

    if (isClient) {
      checkAuth();
    }
  }, [isClient]);


  if (!isClient) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, authError, setAuthError, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;