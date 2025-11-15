import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'; // <-- Import useCallback
import * as SecureStore from 'expo-secure-store';
import { 
    User, 
    LoginData, 
    RegisterData,
    login,
    register as registerUserApi
} from '../services/authService'; 
import apiClient from '../../api/axiosConfig';

interface AuthContextData {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  signIn(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<void>;
  signOut(): void;
  updateUser: (user: User) => Promise<void>; 
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedToken = await SecureStore.getItemAsync('userToken');
        const storedUser = await SecureStore.getItemAsync('userData');

        if (storedToken && storedUser) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as User); 
        }
      } catch (e) {
        console.error('Failed to load auth data from storage', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadStorageData();
  }, []);

  // --- FIX: Wrap all provider functions in useCallback ---

  const updateUser = useCallback(async (userData: User) => {
      setUser(userData);
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
  }, []); // Empty dependency array = stable function

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const loginData: LoginData = { email, password };
      const { token, user: userData } = await login(loginData);
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      await updateUser(userData); // Use stable function
      await SecureStore.setItemAsync('userToken', token);
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateUser]); // Depends on stable updateUser

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const registerData: RegisterData = { name, email, password };
      const { token, user: userData } = await registerUserApi(registerData);
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      await updateUser(userData); // Use stable function
      await SecureStore.setItemAsync('userToken', token);
    } catch (error) {
      console.error('Register error:', error);
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateUser]); // Depends on stable updateUser

  const signOut = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      setToken(null);
      setUser(null);
      delete apiClient.defaults.headers.common['Authorization'];
    } catch (e) {
      console.error('Failed to sign out', e);
    }
  }, []); // Empty dependency array = stable function

  // --- END OF FIX ---

  return (
    <AuthContext.Provider value={{ token, user, isLoading, signIn, register, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { User };