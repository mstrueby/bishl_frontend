import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

// Ensure this matches what is being provided in the AuthContext
interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
  authError: any;
  setAuthError: (error: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const useAuth = () => {
  // Use a type assertion to ensure the context object matches expectations.
  const context = useContext(AuthContext) as AuthContextType;

  // Consider adding a fallback or error handling in case context is undefined.
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default useAuth;