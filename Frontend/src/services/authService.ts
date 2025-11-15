import apiClient from '../../api/axiosConfig';

// --- Interfaces ---

// NEW: This object holds the raw stats from the backend
export interface UserStats {
  reportCount: number;
  totalUpvotesReceived: number;
  categoryCounts: { [key: string]: number };
}

export interface User {
  id: string;
  name: string;
  email: string;
  badges?: string[];
  stats?: UserStats; // <-- UPDATED: Use stats object
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  name: string;
}

interface AuthResponse {
  message: string;
  success: boolean;
  token: string;
  user: User;
}

// Fetches the complete user profile, including stats
const getProfile = async (): Promise<User> => {
    try {
        const response = await apiClient.get('/auth/profile');
        return response.data.user; 
    } catch (error: any) {
        console.error('Error fetching profile:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
};

const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  } catch (error: any) {
    console.error('Login service error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to log in');
  }
};

const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  } catch (error: any) {
    console.error('Register service error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to register');
  }
};

export { login, register, getProfile };