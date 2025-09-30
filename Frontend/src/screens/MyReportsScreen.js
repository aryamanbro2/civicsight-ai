/**
 * MyReportsScreen Component (M-03)
 * Report Management - View and manage user's submitted reports
 * 
 * Features implemented:
 * - Placeholder for reports list and management
 * - NativeWind styling consistent with design system
 * - Ready for M-03 implementation
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
} from 'react-native';
import '../global.css';

const MyReportsScreen = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white shadow-sm border-b border-gray-200">
          <View className="px-6 py-4">
            <Text className="text-2xl font-bold text-gray-900">
              My Reports
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              Track and manage your submitted reports
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View className="flex-1 px-6 py-8">
          {/* Empty State */}
          <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <View className="items-center mb-6">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Text className="text-3xl">📋</Text>
              </View>
              <Text className="text-xl font-semibold text-gray-900 text-center">
                No Reports Yet
              </Text>
              <Text className="text-gray-600 text-center mt-2 leading-5">
                You haven't submitted any reports yet. Start by reporting an issue!
              </Text>
            </View>

            {/* Feature Preview */}
            <View className="space-y-4">
              <View className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-blue-500 rounded-lg items-center justify-center mr-3">
                    <Text className="text-white text-lg">📊</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">
                      Report Status
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Track the status of your reports
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-green-50 rounded-lg p-4 border border-green-200">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-green-500 rounded-lg items-center justify-center mr-3">
                    <Text className="text-white text-lg">🔔</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">
                      Real-time Updates
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Get notified about status changes
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-orange-500 rounded-lg items-center justify-center mr-3">
                    <Text className="text-white text-lg">📝</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">
                      Report History
                    </Text>
                    <Text className="text-sm text-gray-600">
                      View all your past reports
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
              onPress={() => navigation.navigate('ReportSubmission')}
            >
              <Text className="text-white text-center font-semibold text-lg">
                📝 Quick Report
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-white border border-gray-300 rounded-xl py-4 px-6 shadow-sm">
              <Text className="text-gray-700 text-center font-semibold text-lg">
                🔄 Refresh Reports
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sample Reports (Placeholder) */}
          <View className="mt-8">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Sample Reports (Coming Soon)
            </Text>
            
            <View className="space-y-3">
              <View className="bg-white rounded-lg p-4 border border-gray-200">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-semibold text-gray-900">
                    Pothole on Main Street
                  </Text>
                  <View className="bg-yellow-100 px-2 py-1 rounded-full">
                    <Text className="text-yellow-800 text-xs font-medium">
                      In Progress
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-600 text-sm mb-2">
                  Submitted 2 days ago
                </Text>
                <Text className="text-gray-500 text-xs">
                  Report ID: #CS-2024-001
                </Text>
              </View>

              <View className="bg-white rounded-lg p-4 border border-gray-200">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-semibold text-gray-900">
                    Broken Street Light
                  </Text>
                  <View className="bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-green-800 text-xs font-medium">
                      Resolved
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-600 text-sm mb-2">
                  Submitted 1 week ago
                </Text>
                <Text className="text-gray-500 text-xs">
                  Report ID: #CS-2024-002
                </Text>
              </View>
            </View>
          </View>

          {/* Status Section */}
          <View className="mt-8 bg-gray-100 rounded-xl p-4">
            <Text className="text-sm text-gray-600 text-center">
              🚧 M-03: Report Management - Coming Soon
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              Full implementation pending
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyReportsScreen;
