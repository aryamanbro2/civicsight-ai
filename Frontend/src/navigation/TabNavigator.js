/**
 * TabNavigator Component
 * Bottom tab navigation for the main app screens
 * 
 * Features implemented:
 * - Tab-based navigation with Report Issue and My Reports tabs
 * - NativeWind styling for tab bar
 * - Icons and labels for each tab
 * - Integration with React Navigation
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import ReportIssueScreen from '../screens/ReportIssueScreen';
import MyReportsScreen from '../screens/MyReportsScreen';
import ReportSubmissionScreen from '../screens/ReportSubmissionScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarActiveTintColor: '#2563eb', // primary-600
        tabBarInactiveTintColor: '#6b7280', // gray-500
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="ReportIssue"
        component={ReportIssueScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size || 24 }}>
              🏠
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="ReportSubmission"
        component={ReportSubmissionScreen}
        options={{
          tabBarLabel: 'Quick Report',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size || 24 }}>
              📝
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="MyReports"
        component={MyReportsScreen}
        options={{
          tabBarLabel: 'My Reports',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size || 24 }}>
              📋
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
