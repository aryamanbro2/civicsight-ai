/**
 * Navigation Tests
 * Tests for React Navigation implementation
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

describe('Navigation Implementation', () => {
  it('renders App component without crashing', () => {
    const { getByText } = render(<App />);
    // App should render without crashing
    expect(getByText).toBeDefined();
  });

  it('shows login screen when not authenticated', () => {
    // Mock AsyncStorage to return no auth data
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValue(null);

    const { getByText } = render(<App />);
    // Should show login screen elements
    expect(getByText('CivicSight AI')).toBeTruthy();
  });
});
