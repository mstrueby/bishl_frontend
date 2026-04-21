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

        const fetchUser = (token: string) =>
          fetch('/api/user', {
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${token}` },
          });

        let userResponse = await fetchUser(accessToken);

        if (userResponse.status === 401) {
          const refreshToken = localStorage.getItem('refresh_token');

          if (refreshToken) {
            try {
              const refreshResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/users/refresh`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ refresh_token: refreshToken }),
                }
              );

              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                const newAccessToken =
                  refreshData?.data?.access_token || refreshData?.access_token;
                const newRefreshToken =
                  refreshData?.data?.refresh_token || refreshData?.refresh_token;

                if (newAccessToken) {
                  localStorage.setItem('access_token', newAccessToken);
                  if (newRefreshToken) {
                    localStorage.setItem('refresh_token', newRefreshToken);
                  }
                  userResponse = await fetchUser(newAccessToken);
                } else {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  setUser(null);
                  setAuthError(null);
                  return;
                }
              } else {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                setUser(null);
                setAuthError(null);
                return;
              }
            } catch (refreshErr) {
              console.error('Token refresh failed during auth check:', refreshErr);
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              setUser(null);
              setAuthError(null);
              return;
            }
          } else {
            localStorage.removeItem('access_token');
            setUser(null);
            setAuthError(null);
            return;
          }
        }

        if (userResponse.ok) {
          const userData = await userResponse.json();
          const user = userData.data || userData;
          console.log('User loaded from AuthContext:', user._id);
          setUser(user);
          setAuthError(null);
        } else {
          console.log('Failed to fetch user, clearing tokens');
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
