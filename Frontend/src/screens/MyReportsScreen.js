/**
 * MyReportsScreen Component (M-06)
 * My Reports & Tracking - View and manage user's submitted reports
 * 
 * Features implemented:
 * - Real data fetching from GET /api/reports/my
 * - Status-based visual differentiation with NativeWind
 * - Scrollable list of reports with issueType, status, createdAt
 * - Loading states and error handling
 * - Refresh functionality
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../global.css';

const MyReportsScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch user's reports from backend
   */
  const fetchReports = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Get stored user token
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (!token || !userData) {
        Alert.alert('Error', 'Please login again to view your reports');
        navigation.navigate('Login');
        return;
      }

      console.log('📋 Fetching user reports...');

      // Fetch reports from backend
      const response = await fetch('http://localhost:3000/api/reports/my', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setReports(data.reports || []);
        console.log(`✅ Fetched ${data.reports?.length || 0} reports`);
      } else {
        throw new Error(data.message || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Fetch reports error:', error);
      setError(error.message || 'Failed to fetch reports');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Load reports on component mount
   */
  useEffect(() => {
    fetchReports();
  }, []);

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    fetchReports(true);
  };

  /**
   * Get status color and styling
   */
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
        };
      case 'in_progress':
      case 'in-progress':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
        };
      case 'reported':
      case 'submitted':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
        };
      case 'under_review':
      case 'under-review':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          border: 'border-blue-200',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
        };
    }
  };

  /**
   * Get issue type icon
   */
  const getIssueTypeIcon = (issueType) => {
    switch (issueType?.toLowerCase()) {
      case 'pothole':
        return '🕳️';
      case 'streetlight':
        return '💡';
      case 'garbage':
        return '🗑️';
      case 'traffic':
        return '🚦';
      case 'water':
        return '💧';
      case 'sewer':
        return '🚰';
      default:
        return '📋';
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Unknown';
    }
  };

  /**
   * Handle report press (future: navigate to report details)
   */
  const handleReportPress = (report) => {
    Alert.alert(
      'Report Details',
      `Title: ${report.title}\nStatus: ${report.status}\nType: ${report.issueType}\nSubmitted: ${formatDate(report.createdAt)}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        {/* Header */}
        <View className="bg-white shadow-sm border-b border-gray-200">
          <View className="px-6 py-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-gray-900">
                  My Reports
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  Track and manage your submitted reports
                </Text>
              </View>
              <TouchableOpacity
                className="bg-primary-50 border border-primary-200 rounded-lg px-3 py-2"
                onPress={handleRefresh}
                disabled={isRefreshing}
              >
                <Text className="text-primary-700 font-semibold text-sm">
                  {isRefreshing ? '🔄' : '🔄'} Refresh
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View className="flex-1 px-6 py-6">
          {/* Loading State */}
          {isLoading && (
            <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
              <View className="items-center">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="text-gray-600 mt-4">Loading your reports...</Text>
              </View>
            </View>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <View className="bg-red-50 rounded-xl border border-red-200 p-6 mb-6">
              <View className="items-center">
                <Text className="text-4xl mb-2">⚠️</Text>
                <Text className="text-red-800 font-semibold text-center mb-2">
                  Failed to Load Reports
                </Text>
                <Text className="text-red-600 text-center mb-4">
                  {error}
                </Text>
                <TouchableOpacity
                  className="bg-red-100 border border-red-300 rounded-lg py-2 px-4"
                  onPress={() => fetchReports()}
                >
                  <Text className="text-red-700 font-semibold">
                    Try Again
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Empty State */}
          {!isLoading && !error && reports.length === 0 && (
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
              </View>
            </View>
          )}

          {/* Reports List */}
          {!isLoading && !error && reports.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-gray-900">
                  Your Reports ({reports.length})
                </Text>
                <View className="flex-row space-x-2">
                  <View className="bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-green-800 text-xs font-medium">
                      {reports.filter(r => r.status?.toLowerCase() === 'resolved').length} Resolved
                    </Text>
                  </View>
                  <View className="bg-yellow-100 px-2 py-1 rounded-full">
                    <Text className="text-yellow-800 text-xs font-medium">
                      {reports.filter(r => r.status?.toLowerCase() === 'in_progress' || r.status?.toLowerCase() === 'in-progress').length} In Progress
                    </Text>
                  </View>
                </View>
              </View>
              
              <View className="space-y-3">
                {reports.map((report) => {
                  const statusStyle = getStatusStyle(report.status);
                  return (
                    <TouchableOpacity
                      key={report.id}
                      className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                      onPress={() => handleReportPress(report)}
                    >
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1 mr-3">
                          <View className="flex-row items-center mb-2">
                            <Text className="text-lg mr-2">
                              {getIssueTypeIcon(report.issueType)}
                            </Text>
                            <Text className="font-semibold text-gray-900 flex-1" numberOfLines={2}>
                              {report.title}
                            </Text>
                          </View>
                          <Text className="text-gray-600 text-sm mb-2" numberOfLines={2}>
                            {report.description}
                          </Text>
                          <Text className="text-gray-500 text-xs">
                            Report ID: {report.id}
                          </Text>
                        </View>
                        <View className={`${statusStyle.bg} ${statusStyle.border} px-3 py-1 rounded-full border`}>
                          <Text className={`${statusStyle.text} text-xs font-medium`}>
                            {report.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                          </Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center justify-between">
                        <Text className="text-gray-500 text-sm">
                          {formatDate(report.createdAt)}
                        </Text>
                        <View className="flex-row items-center">
                          <Text className="text-gray-400 text-xs mr-2">
                            {report.issueType?.toUpperCase() || 'GENERAL'}
                          </Text>
                          <Text className="text-gray-400">→</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

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
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              <Text className="text-gray-700 text-center font-semibold text-lg">
                {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh Reports'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status Section */}
          <View className="mt-8 bg-gray-100 rounded-xl p-4">
            <Text className="text-sm text-gray-600 text-center">
              🚀 M-06: My Reports & Tracking implemented
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              Real data fetching with status-based styling
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyReportsScreen;
