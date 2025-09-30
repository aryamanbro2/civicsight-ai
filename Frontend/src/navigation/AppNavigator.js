/**
 * AppNavigator Component
 * Main navigation container for the app
 * 
 * Features implemented:
 * - Stack navigation for authentication flow
 * - Tab navigation for main app screens
 * - Conditional rendering based on authentication state
 * - Integration with React Navigation
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import TabNavigator from './TabNavigator';

const Stack = createStackNavigator();

const AppNavigator = ({ isAuthenticated, user, onLoginSuccess, onLogout }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated && user ? (
          // Authenticated user - show main app with tabs
          <Stack.Screen name="MainApp">
            {() => <TabNavigator />}
          </Stack.Screen>
        ) : (
          // Not authenticated - show login screen
          <Stack.Screen name="Login">
            {() => <LoginScreen onLoginSuccess={onLoginSuccess} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
