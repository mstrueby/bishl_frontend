import { createContext, useState, useEffect, useMemo, ReactNode } from 'react';

const AuthContext = createContext({});

export const AuthProvider = ({ children }: {children: ReactNode}) => {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check if we have an access token first
        const accessToken = localStorage.getItem('access_token');
        
        if (!accessToken) {
          console.log('No access token found');
          setUser(null);
          setAuthError(null);
          setLoading(false);
          return;
        }

        // Fetch CSRF token first
        const csrfResponse = await fetch('/api/csrf-token');
        const csrfData = await csrfResponse.json();
        if (csrfData.csrfToken) {
          localStorage.setItem('csrf_token', csrfData.csrfToken);
        }

        // Fetch user data with access token
        const userResponse = await fetch('/api/user', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          // The /api/user endpoint should already extract the data field,
          // but handle both cases for safety
          const user = userData.data || userData;
          console.log('User loaded from AuthContext:', user._id);
          setUser(user);
          setAuthError(null);
        } else {
          console.log('Failed to fetch user, clearing tokens');
          // Clear invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
          setAuthError(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setAuthError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };

    if (isClient) {
      checkAuth();
    }
  }, [isClient]);


  const contextValue = useMemo(() => ({
    user,
    setUser,
    authError,
    setAuthError,
    loading,
    setLoading
  }), [user, authError, loading]);

  if (!isClient) {
    return null;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;