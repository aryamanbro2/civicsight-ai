import apiClient from '../../api/axiosConfig';

// --- Interfaces ---

// CHANGED: Added 'export'
export interface User {
  id: string;
  name: string;
  email: string;
}

// CHANGED: Added 'export'
export interface LoginData {
  email: string;
  password: string;
}

// CHANGED: Added 'export'
export interface RegisterData extends LoginData {
  name: string;
}

interface AuthResponse {
  message: string;
  success: boolean;
  token: string;
  user: User;
}

/**
 * Logs in a user
 * @param {LoginData} data - { email, password }
 * @returns {Promise<AuthResponse>}
 */
const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  } catch (error: any) {
    console.error('Login service error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to log in');
  }
};

/**
 * Registers a new user
 * @param {RegisterData} data - { name, email, password }
 * @returns {Promise<AuthResponse>}
 */
const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  } catch (error: any) {
    console.error('Register service error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to register');
  }
};

export { login, register };