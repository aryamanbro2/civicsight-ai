import axios from 'axios';

// ------------------------------------------------------------------------------------
// CRITICAL: REPLACE 'YOUR_LAN_IP_ADDRESS' below with the actual IP (e.g., 192.168.1.XX)
// This IP must be accessible by your phone on the same Wi-Fi network.
// ------------------------------------------------------------------------------------
const LAN_IP = 'https://bookish-space-sniffle-ggrx9pq764vcv9vp-3000.app.github.dev/api'; 
const DEPLOYED_URL = 'https://your-render-app.onrender.com/api'; // For future deployment

// Determine the base URL based on the environment
const baseURL = __DEV__ ? LAN_IP : DEPLOYED_URL;

const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Accept': 'application/json',
    // The 'Authorization' header will be added dynamically by your authentication service
  },
  timeout: 15000, // 15 second timeout for API calls
});

// Optional: Add a request interceptor to attach JWT token to every request
// apiClient.interceptors.request.use(async (config) => {
//   const token = await AsyncStorage.getItem('userToken'); 
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

export default apiClient;