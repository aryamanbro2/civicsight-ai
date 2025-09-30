/**
 * LoginScreen Component (M-01)
 * Seamless Onboarding - Phone number-based authentication
 * 
 * Features implemented:
 * - Phone number input with validation
 * - NativeWind styling for modern UI
 * - Integration with backend auth API
 * - Secure token storage using AsyncStorage
 * - Navigation to main app after successful login
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../global.css';

const LoginScreen = ({ onLoginSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if valid phone number
   */
  const isValidPhoneNumber = (phone) => {
    // Basic phone number validation (10+ digits)
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  /**
   * Handle phone number input change
   * @param {string} text - Input text
   */
  const handlePhoneChange = (text) => {
    // Remove any non-digit characters except + at the beginning
    const cleaned = text.replace(/[^\d+]/g, '');
    setPhoneNumber(cleaned);
    setError(''); // Clear error when user starts typing
  };

  /**
   * Handle user signup/login
   * Calls POST /api/auth/signup endpoint
   */
  const handleSignup = async () => {
    // Validate phone number
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber.trim(),
          name: `User ${phoneNumber.slice(-4)}`, // Generate a simple name
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data and token securely
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userId', data.user.id);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));

        console.log('✅ Login successful:', data.user.id);

        // Show success message
        Alert.alert(
          'Welcome to CivicSight AI!',
          `Successfully signed up with phone number ${data.user.phone}`,
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to main app
                if (onLoginSuccess) {
                  onLoginSuccess(data.user, data.token);
                }
              },
            },
          ]
        );
      } else {
        // Handle API errors
        if (data.code === 'USER_EXISTS') {
          // User already exists, try login instead
          await handleLogin();
        } else {
          setError(data.message || 'Signup failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle user login for existing users
   * Calls POST /api/auth/login endpoint
   */
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data and token securely
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userId', data.user.id);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));

        console.log('✅ Login successful:', data.user.id);

        // Show success message
        Alert.alert(
          'Welcome back!',
          `Successfully logged in with phone number ${data.user.phone}`,
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to main app
                if (onLoginSuccess) {
                  onLoginSuccess(data.user, data.token);
                }
              },
            },
          ]
        );
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="bg-white shadow-sm border-b border-gray-200">
            <View className="px-6 py-8">
              <View className="items-center">
                <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-4">
                  <Text className="text-3xl">🏛️</Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900 text-center">
                  CivicSight AI
                </Text>
                <Text className="text-sm text-gray-600 mt-2 text-center">
                  Citizen Issue Reporting System
                </Text>
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View className="flex-1 px-6 py-8">
            {/* Welcome Section */}
            <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <Text className="text-xl font-semibold text-gray-900 text-center mb-2">
                Welcome to CivicSight AI
              </Text>
              <Text className="text-gray-600 text-center mb-6 leading-5">
                Enter your phone number to get started with reporting civic issues
              </Text>

              {/* Phone Number Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-lg"
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor="#9CA3AF"
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                  editable={!isLoading}
                />
                {error ? (
                  <Text className="text-red-500 text-sm mt-2">
                    {error}
                  </Text>
                ) : null}
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                className={`rounded-lg py-4 px-6 shadow-sm ${
                  isLoading || !phoneNumber.trim()
                    ? 'bg-gray-300'
                    : 'bg-primary-600'
                }`}
                onPress={handleSignup}
                disabled={isLoading || !phoneNumber.trim()}
              >
                <View className="flex-row items-center justify-center">
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : null}
                  <Text className={`text-center font-semibold text-lg ml-2 ${
                    isLoading || !phoneNumber.trim()
                      ? 'text-gray-500'
                      : 'text-white'
                  }`}>
                    {isLoading ? 'Signing up...' : 'Get Started'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Features Preview */}
            <View className="space-y-3">
              <View className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-primary-500 rounded-lg items-center justify-center mr-3">
                    <Text className="text-white text-lg">📱</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">
                      Mobile Reporting
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Report issues with photos and location
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-green-50 rounded-lg p-4 border border-green-200">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-green-500 rounded-lg items-center justify-center mr-3">
                    <Text className="text-white text-lg">🤖</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">
                      AI-Powered Analysis
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Automatic issue classification and priority
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-orange-500 rounded-lg items-center justify-center mr-3">
                    <Text className="text-white text-lg">📊</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">
                      Real-time Tracking
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Track your reports and get updates
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Status Section */}
            <View className="mt-8 bg-gray-100 rounded-xl p-4">
              <Text className="text-sm text-gray-600 text-center">
                🚀 Ready to make your city better
              </Text>
              <Text className="text-xs text-gray-500 text-center mt-1">
                M-01: Seamless Onboarding implemented
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
