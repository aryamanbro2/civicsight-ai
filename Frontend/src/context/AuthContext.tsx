import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as authService from '../services/authService';
import { User, LoginCredentials, RegisterCredentials } from '../components/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticating: boolean;
  isLoading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: RegisterCredentials) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuthData = async () => {
      setIsLoading(true);
      try {
        const { token: storedToken, user: storedUser } = await authService.getStoredAuthData();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (e) { // FIX: Removed the stray underscore
        console.error('Failed to load auth data:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []);

  const signIn = async (credentials: LoginCredentials) => {
    setIsAuthenticating(true);
    try {
      const { user, token } = await authService.login(credentials);
      setUser(user);
      setToken(token);
    } catch (error) { // FIX: Removed the stray underscore
      console.error('Sign in error:', error);
      throw error; // Re-throw to be caught by the UI
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signUp = async (credentials: RegisterCredentials) => {
    setIsAuthenticating(true);
    try {
      const { user, token } = await authService.register(credentials);
      setUser(user);
      setToken(token);
    } catch (error) { // This one was correct, but I'll ensure it matches
      console.error('Sign up error:', error);
      throw error; // Re-throw
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOut = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticating,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};