// FIX: Use named imports directly, which is the most common pattern.
// We must also fix the FC usage which conflicts with the TS environment.
import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User, LoginCredentials, RegisterCredentials } from '../components/types';
import { login, register, logout, getStoredAuthData } from '../services/authService';

// --- 1. Types ---
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  // These are the functions defined in the context:
  signIn: (credentials: LoginCredentials) => Promise<void>; 
  signUp: (credentials: RegisterCredentials) => Promise<void>;
  // Social Logins will be handled by a single function if implemented later:
  // socialSignIn: (provider: 'google' | 'facebook') => Promise<void>; 
  signOut: () => Promise<void>;
}

// Initial context values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- 2. Provider Component ---
interface AuthProviderProps {
  children: React.ReactNode;
}

// FIX: Change React.FC to a standard function signature to fix the 'has no exported member FC' error.
export const AuthProvider = ({ children }: AuthProviderProps) => { 
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Load token from storage on app launch
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const { token: storedToken, user: storedUser } = await getStoredAuthData();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (e) {
        console.error('Restoring token failed', e);
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // Memoized context value
  const authContextValue = useMemo(() => ({
    user,
    token,
    isLoading,
    isAuthenticating,
    
    signIn: async (credentials: LoginCredentials) => {
      setIsAuthenticating(true);
      try {
        const { user: loggedInUser, token: authToken } = await login(credentials);
        setUser(loggedInUser);
        setToken(authToken);
      } finally {
        setIsAuthenticating(false);
      }
    },

    signUp: async (credentials: RegisterCredentials) => {
      setIsAuthenticating(true);
      try {
        const { user: registeredUser, token: authToken } = await register(credentials);
        setUser(registeredUser);
        setToken(authToken);
      } finally {
        setIsAuthenticating(false);
      }
    },
    
    signOut: async () => {
      await logout();
      setUser(null);
      setToken(null);
    },
  }), [user, token, isLoading, isAuthenticating]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};