/**
 * ReportIssueScreen Component (M-03)
 * Report Creation and Management - Main reporting interface
 * 
 * Features implemented:
 * - Placeholder for issue reporting form
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

const ReportIssueScreen = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white shadow-sm border-b border-gray-200">
          <View className="px-6 py-4">
            <Text className="text-2xl font-bold text-gray-900">
              Report New Issue
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              Help make your city better by reporting civic issues
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View className="flex-1 px-6 py-8">
          {/* Coming Soon Card */}
          <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <View className="items-center mb-6">
              <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-4">
                <Text className="text-3xl">📝</Text>
              </View>
              <Text className="text-xl font-semibold text-gray-900 text-center">
                Report Issue Form
              </Text>
              <Text className="text-gray-600 text-center mt-2 leading-5">
                This screen will contain the issue reporting form for M-03
              </Text>
            </View>

            {/* Feature Preview */}
            <View className="space-y-4">
              <View className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-blue-500 rounded-lg items-center justify-center mr-3">
                    <Text className="text-white text-lg">📷</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">
                      Photo Upload
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Take photos of the issue
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-green-50 rounded-lg p-4 border border-green-200">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-green-500 rounded-lg items-center justify-center mr-3">
                    <Text className="text-white text-lg">📍</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">
                      Location Services
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Automatic location detection
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-orange-500 rounded-lg items-center justify-center mr-3">
                    <Text className="text-white text-lg">🏷️</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">
                      Issue Categories
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Select from predefined categories
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

            <TouchableOpacity 
              className="bg-white border border-gray-300 rounded-xl py-4 px-6 shadow-sm"
              onPress={() => navigation.navigate('MyReports')}
            >
              <Text className="text-gray-700 text-center font-semibold text-lg">
                📋 View My Reports
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status Section */}
          <View className="mt-8 bg-gray-100 rounded-xl p-4">
            <Text className="text-sm text-gray-600 text-center">
              🚧 M-03: Report Creation - Coming Soon
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

export default ReportIssueScreen;
