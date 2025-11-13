// Frontend/api/axiosConfig.js

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { config } from '../src/config'; // FIX: Corrected path to config

const DEPLOYED_URL = 'https://your-render-app.onrender.com/api';

// FIX: Base URL is now ONLY derived from the config object (reads .env) in dev.
const baseURL = __DEV__ ? config.API_BASE_URL : DEPLOYED_URL;

const apiClient = axios.create({
  // Ensure base URL ends with /api
  baseURL: baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`,
  headers: {
    'Accept': 'application/json',
  },
  timeout: config.API_TIMEOUT || 15000,
});

// Interceptor to attach JWT token
apiClient.interceptors.request.use(
  async (axiosConfig) => {
    const token = await SecureStore.getItemAsync(config.AUTH_TOKEN_KEY);
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