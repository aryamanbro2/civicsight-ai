import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
// FIX: Corrected path to config
import { config } from '../src/config';

// ------------------------------------------------------------------------------------
// CRITICAL: PASTE YOUR PUBLIC CODESPACE URL FOR PORT 3000 (with /api)
// ------------------------------------------------------------------------------------
const CODESPACE_URL = 'https://bookish-space-sniffle-ggrx9pq764vcv9vp-3000.app.github.dev/api';
const DEPLOYED_URL = 'https://your-render-app.onrender.com/api';

const baseURL = __DEV__ ? CODESPACE_URL : DEPLOYED_URL;

const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// FIX: Enable the request interceptor
apiClient.interceptors.request.use(
  async (axiosConfig) => {
    // 1. Get the token from where AuthContext stored it
    const token = await SecureStore.getItemAsync(config.AUTH_TOKEN_KEY);
    
    // 2. If the token exists, add it to the Authorization header
    if (token) {
      axiosConfig.headers.Authorization = `Bearer ${token}`;
    }
    return axiosConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;