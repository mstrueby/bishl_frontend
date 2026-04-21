import { createContext, useState, useEffect, useMemo, ReactNode } from 'react';
import apiClient from '../lib/apiClient';

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

        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          console.log('No access token found');
          setUser(null);
          setAuthError(null);
          setLoading(false);
          return;
        }

        const csrfResponse = await fetch('/api/csrf-token');
        const csrfData = await csrfResponse.json();
        if (csrfData.csrfToken) {
          localStorage.setItem('csrf_token', csrfData.csrfToken);
        }

        const response = await apiClient.get('/users/me');
        const userData = response.data;
        console.log('User loaded from AuthContext:', userData._id);
        setUser(userData);
        setAuthError(null);
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
