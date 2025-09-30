/**
 * CivicSight AI Mobile App
 * React Native app with NativeWind for citizen issue reporting
 * 
 * Features implemented:
 * - NativeWind integration for Tailwind CSS
 * - M-01: Seamless Onboarding with phone number authentication
 * - React Navigation with tab-based navigation
 * - Secure token storage with AsyncStorage
 * - Tab navigation: Report Issue and My Reports
 * - Ready for M-03, M-05, M-06 features
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import './global.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check if user is already authenticated on app start
   */
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Check authentication status from stored data
   */
  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('✅ User already authenticated:', parsedUser.id);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle successful login
   * @param {Object} userData - User data from API
   * @param {string} token - Authentication token
   */
  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    console.log('✅ Login successful, navigating to main app with tabs');
  };

  /**
   * Handle user logout
   */
  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    console.log('✅ User logged out, returning to login screen');
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return null; // You could add a loading spinner here
  }

  return (
    <AppNavigator
      isAuthenticated={isAuthenticated}
      user={user}
      onLoginSuccess={handleLoginSuccess}
      onLogout={handleLogout}
    />
  );
};

export default App;
