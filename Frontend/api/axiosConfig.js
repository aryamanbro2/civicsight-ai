// Frontend/api/axiosConfig.js

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { config } from '../src/config'; 

// CRITICAL FIX: We assume config.API_BASE_URL is the complete, correct URL
// (e.g., https://...github.dev/api) when running in development.
const DEPLOYED_URL = 'https://your-render-app.onrender.com/api'; 

const baseURL = __DEV__ ? config.API_BASE_URL : DEPLOYED_URL;

const apiClient = axios.create({
  // FIX: Use the complete baseURL directly. 
  // If the user's ENV URL already ends in /api, we do not touch it.
  baseURL: baseURL, 
  headers: {
    'Accept': 'application/json',
  },
  timeout: config.API_TIMEOUT || 15000,
});

// Interceptor to attach JWT token (This part is correct)
apiClient.interceptors.request.use(
  async (axiosConfig) => {
    // FIX: Reading the correct 'userToken' key
    const token = await SecureStore.getItemAsync('userToken'); 
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