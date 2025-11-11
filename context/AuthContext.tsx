import { createContext, useState, useEffect, ReactNode } from 'react';

const AuthContext = createContext({});

export const AuthProvider = ({ children }: {children: ReactNode}) => {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Assume checkAuth is defined elsewhere and handles initial authentication check
    // checkAuth(); 

    // Fetch CSRF token
    const fetchCSRFToken = async () => {
      try {
        const response = await fetch('/api/csrf-token');
        const data = await response.json();
        if (data.csrfToken) {
          localStorage.setItem('csrf_token', data.csrfToken);
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    };

    fetchCSRFToken();
  }, []);


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