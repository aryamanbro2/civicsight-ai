/**
 * CivicSight AI Mobile App
 * React Native app with NativeWind for citizen issue reporting
 * 
 * Features implemented:
 * - NativeWind integration for Tailwind CSS
 * - Placeholder screen with styling
 * - Ready for M-01, M-03, M-05, M-06 features
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
  Image,
} from 'react-native';
import './global.css';

const App = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white shadow-sm border-b border-gray-200">
          <View className="px-6 py-4">
            <Text className="text-2xl font-bold text-gray-900">
              CivicSight AI
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              Citizen Issue Reporting System
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View className="flex-1 px-6 py-8">
          {/* Welcome Section */}
          <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <View className="items-center mb-6">
              <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-4">
                <Text className="text-3xl">🏛️</Text>
              </View>
              <Text className="text-xl font-semibold text-gray-900 text-center">
                Welcome to CivicSight AI
              </Text>
              <Text className="text-gray-600 text-center mt-2 leading-5">
                Report civic issues and track their resolution in real-time
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
            <TouchableOpacity className="bg-primary-600 rounded-xl py-4 px-6 shadow-sm">
              <Text className="text-white text-center font-semibold text-lg">
                Get Started
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-white border border-gray-300 rounded-xl py-4 px-6 shadow-sm">
              <Text className="text-gray-700 text-center font-semibold text-lg">
                Learn More
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status Section */}
          <View className="mt-8 bg-gray-100 rounded-xl p-4">
            <Text className="text-sm text-gray-600 text-center">
              🚀 React Native + NativeWind Setup Complete
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              Ready for M-01, M-03, M-05, M-06 implementation
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;
