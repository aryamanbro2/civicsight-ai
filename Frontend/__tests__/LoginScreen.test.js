/**
 * LoginScreen Component Tests
 * Tests for the M-01 Seamless Onboarding feature
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../src/screens/LoginScreen';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock fetch
global.fetch = jest.fn();

describe('LoginScreen Component', () => {
  const mockOnLoginSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen onLoginSuccess={mockOnLoginSuccess} />
    );

    expect(getByText('CivicSight AI')).toBeTruthy();
    expect(getByText('Welcome to CivicSight AI')).toBeTruthy();
    expect(getByPlaceholderText('+1 (555) 123-4567')).toBeTruthy();
    expect(getByText('Get Started')).toBeTruthy();
  });

  it('validates phone number input', async () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen onLoginSuccess={mockOnLoginSuccess} />
    );

    const phoneInput = getByPlaceholderText('+1 (555) 123-4567');
    const signupButton = getByText('Get Started');

    // Test empty phone number
    fireEvent.press(signupButton);
    await waitFor(() => {
      expect(getByText('Phone number is required')).toBeTruthy();
    });

    // Test invalid phone number
    fireEvent.changeText(phoneInput, '123');
    fireEvent.press(signupButton);
    await waitFor(() => {
      expect(getByText('Please enter a valid phone number')).toBeTruthy();
    });
  });

  it('handles successful signup', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        message: 'User created successfully',
        user: {
          id: 'citizen-1',
          phone: '+1234567890',
          name: 'User 7890',
          type: 'citizen',
        },
        token: 'mock-jwt-token',
      }),
    };

    fetch.mockResolvedValueOnce(mockResponse);

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen onLoginSuccess={mockOnLoginSuccess} />
    );

    const phoneInput = getByPlaceholderText('+1 (555) 123-4567');
    const signupButton = getByText('Get Started');

    fireEvent.changeText(phoneInput, '+1234567890');
    fireEvent.press(signupButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: '+1234567890',
          name: 'User 7890',
        }),
      });
    });
  });

  it('handles existing user login', async () => {
    const signupResponse = {
      ok: false,
      json: () => Promise.resolve({
        code: 'USER_EXISTS',
        message: 'User already exists',
      }),
    };

    const loginResponse = {
      ok: true,
      json: () => Promise.resolve({
        message: 'Login successful',
        user: {
          id: 'citizen-1',
          phone: '+1234567890',
          name: 'User 7890',
          type: 'citizen',
        },
        token: 'mock-jwt-token',
      }),
    };

    fetch
      .mockResolvedValueOnce(signupResponse)
      .mockResolvedValueOnce(loginResponse);

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen onLoginSuccess={mockOnLoginSuccess} />
    );

    const phoneInput = getByPlaceholderText('+1 (555) 123-4567');
    const signupButton = getByText('Get Started');

    fireEvent.changeText(phoneInput, '+1234567890');
    fireEvent.press(signupButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(1, 'http://localhost:3000/api/auth/signup', expect.any(Object));
      expect(fetch).toHaveBeenNthCalledWith(2, 'http://localhost:3000/api/auth/login', expect.any(Object));
    });
  });

  it('handles network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen onLoginSuccess={mockOnLoginSuccess} />
    );

    const phoneInput = getByPlaceholderText('+1 (555) 123-4567');
    const signupButton = getByText('Get Started');

    fireEvent.changeText(phoneInput, '+1234567890');
    fireEvent.press(signupButton);

    await waitFor(() => {
      expect(getByText('Network error. Please check your connection and try again.')).toBeTruthy();
    });
  });

  it('shows loading state during signup', async () => {
    fetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)));

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen onLoginSuccess={mockOnLoginSuccess} />
    );

    const phoneInput = getByPlaceholderText('+1 (555) 123-4567');
    const signupButton = getByText('Get Started');

    fireEvent.changeText(phoneInput, '+1234567890');
    fireEvent.press(signupButton);

    expect(getByText('Signing up...')).toBeTruthy();
  });
});
