import axios from 'axios';
import { config } from '../src/config'; // Make sure this path is correct

const DEPLOYED_URL = 'https://your-render-app.onrender.com/api';

const baseURL = __DEV__ ? config.API_BASE_URL : DEPLOYED_URL;

const apiClient = axios.create({
  baseURL: baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`,
  headers: {
    'Accept': 'application/json',
  },
  timeout: config.API_TIMEOUT || 15000,
});

// --- NO INTERCEPTOR ---
// AuthContext.tsx is handling the auth header.

export default apiClient;