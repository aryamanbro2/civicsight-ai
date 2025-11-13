// FIX: Corrected path
import apiClient from '../../api/axiosConfig.js';
import * as SecureStore from 'expo-secure-store';

// FIX: Corrected path
import { User, LoginCredentials, RegisterCredentials } from '../components/types';
// FIX: Corrected path
import { config } from '../config';

const TOKEN_KEY = config.AUTH_TOKEN_KEY;
const USER_KEY = config.USER_DATA_KEY;

// --- Token and User Storage ---
const saveAuthData = async (token: string, user: User) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

const clearAuthData = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
};

export const getStoredAuthData = async (): Promise<{ token: string | null; user: User | null }> => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const userJson = await SecureStore.getItemAsync(USER_KEY);
  
  let user: User | null = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch (e) {
      console.error('Failed to parse stored user data:', e);
      await clearAuthData(); // Clear corrupted data
    }
  }

  return { token, user };
};

// --- API Functions ---
export const login = async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
  try {
    // This route is correct: baseURL (/api) + /auth/login
    const response = await apiClient.post('/auth/login', credentials);
    const { token, user } = response.data;
    
    if (token && user) {
      await saveAuthData(token, user);
      return { user, token };
    }
    throw new Error('Invalid response format from server.');

  } catch (error: any) {
    console.error('Login failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Login failed due to network or server error.');
  }
};

export const register = async (credentials: RegisterCredentials): Promise<{ user: User; token: string }> => {
  try {
    // FIX: Changed '/auth/register' to '/auth/signup'
    // This now matches the backend route: baseURL (/api) + /auth/signup
    const response = await apiClient.post('/auth/signup', credentials);
    const { token, user } = response.data;
    
    if (token && user) {
      await saveAuthData(token, user);
      return { user, token };
    }
    throw new Error('Invalid response format from server.');
    
  } catch (error: any) {
    console.error('Registration failed:', error.response?.data || error.message);
    // FIX: Provide the specific error message from the backend
    throw new Error(error.response?.data?.message || 'Registration failed.');
  }
};

export const logout = async (): Promise<void> => {
  await clearAuthData();
};