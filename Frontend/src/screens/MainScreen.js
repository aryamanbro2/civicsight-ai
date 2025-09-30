/**
 * MainScreen Component
 * Main app screen shown after successful authentication
 * 
 * Features implemented:
 * - Welcome message with user info
 * - Basic app navigation structure
 * - Logout functionality
 * - NativeWind styling
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../global.css';

const MainScreen = ({ user, onLogout, navigation }) => {
  /**
   * Handle user logout
   * Clear stored data and return to login screen
   */
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear stored authentication data
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userId');
              await AsyncStorage.removeItem('userData');
              
              console.log('✅ User logged out successfully');
              
              // Call logout callback
              if (onLogout) {
                onLogout();
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white shadow-sm border-b border-gray-200">
          <View className="px-6 py-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-gray-900">
                  CivicSight AI
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  Citizen Issue Reporting System
                </Text>
              </View>
              <TouchableOpacity
                className="bg-red-500 rounded-lg px-4 py-2"
                onPress={handleLogout}
              >
                <Text className="text-white font-semibold text-sm">
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View className="flex-1 px-6 py-8">
          {/* Welcome Section */}
          <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <View className="items-center mb-6">
              <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-4">
                <Text className="text-3xl">👋</Text>
              </View>
              <Text className="text-xl font-semibold text-gray-900 text-center">
                Welcome back!
              </Text>
              <Text className="text-gray-600 text-center mt-2 leading-5">
                You're successfully logged in to CivicSight AI
              </Text>
            </View>

            {/* User Info */}
            <View className="bg-gray-50 rounded-lg p-4 mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                User Information
              </Text>
              <Text className="text-gray-900 font-semibold">
                {user?.name || 'User'}
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                Phone: {user?.phone || 'N/A'}
              </Text>
              <Text className="text-gray-600 text-sm">
                User ID: {user?.id || 'N/A'}
              </Text>
            </View>

            {/* Feature Cards */}
            <View className="space-y-4">
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
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity 
              className="bg-primary-600 rounded-xl py-4 px-6 shadow-sm"
              onPress={() => navigation?.navigate('ReportIssue')}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Report New Issue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="bg-white border border-gray-300 rounded-xl py-4 px-6 shadow-sm"
              onPress={() => navigation?.navigate('MyReports')}
            >
              <Text className="text-gray-700 text-center font-semibold text-lg">
                View My Reports
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-white border border-gray-300 rounded-xl py-4 px-6 shadow-sm">
              <Text className="text-gray-700 text-center font-semibold text-lg">
                Settings
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status Section */}
          <View className="mt-8 bg-gray-100 rounded-xl p-4">
            <Text className="text-sm text-gray-600 text-center">
              🎉 Authentication successful!
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              M-01: Seamless Onboarding completed
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MainScreen;
