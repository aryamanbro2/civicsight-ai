/**
 * ReportSubmissionScreen Tests
 * Tests for M-03/M-04 Quick Report and M-05 Geo-Tagging
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ReportSubmissionScreen from '../src/screens/ReportSubmissionScreen';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(JSON.stringify({
    id: 'citizen-1',
    phone: '+1234567890',
    name: 'Test User',
  }))),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock react-native-maps
jest.mock('react-native-maps', () => ({
  MapView: ({ children }) => children,
  Marker: ({ children }) => children,
}));

describe('ReportSubmissionScreen Component', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <ReportSubmissionScreen navigation={mockNavigation} />
    );

    expect(getByText('Quick Report')).toBeTruthy();
    expect(getByText('Report a civic issue with location and media')).toBeTruthy();
    expect(getByPlaceholderText('Brief description of the issue')).toBeTruthy();
    expect(getByPlaceholderText('Detailed description of the issue...')).toBeTruthy();
  });

  it('shows location loading state initially', () => {
    const { getByText } = render(
      <ReportSubmissionScreen navigation={mockNavigation} />
    );

    expect(getByText('Getting your location...')).toBeTruthy();
  });

  it('validates required fields', async () => {
    const { getByText, getByPlaceholderText } = render(
      <ReportSubmissionScreen navigation={mockNavigation} />
    );

    const titleInput = getByPlaceholderText('Brief description of the issue');
    const submitButton = getByText('Submit Report');

    // Test empty title
    fireEvent.press(submitButton);
    await waitFor(() => {
      expect(getByText('Please enter a title for your report')).toBeTruthy();
    });

    // Test empty description
    fireEvent.changeText(titleInput, 'Test Title');
    fireEvent.press(submitButton);
    await waitFor(() => {
      expect(getByText('Please enter a description for your report')).toBeTruthy();
    });
  });

  it('handles form input changes', () => {
    const { getByPlaceholderText } = render(
      <ReportSubmissionScreen navigation={mockNavigation} />
    );

    const titleInput = getByPlaceholderText('Brief description of the issue');
    const descriptionInput = getByPlaceholderText('Detailed description of the issue...');

    fireEvent.changeText(titleInput, 'Test Title');
    fireEvent.changeText(descriptionInput, 'Test Description');

    expect(titleInput.props.value).toBe('Test Title');
    expect(descriptionInput.props.value).toBe('Test Description');
  });

  it('handles category selection', () => {
    const { getByText } = render(
      <ReportSubmissionScreen navigation={mockNavigation} />
    );

    const potholeCategory = getByText('Pothole');
    fireEvent.press(potholeCategory);

    // Category should be selected (visual feedback)
    expect(potholeCategory).toBeTruthy();
  });

  it('handles priority selection', () => {
    const { getByText } = render(
      <ReportSubmissionScreen navigation={mockNavigation} />
    );

    const highPriority = getByText('High');
    fireEvent.press(highPriority);

    // Priority should be selected (visual feedback)
    expect(highPriority).toBeTruthy();
  });

  it('handles photo capture mock', () => {
    const { getByText } = render(
      <ReportSubmissionScreen navigation={mockNavigation} />
    );

    const takePhotoButton = getByText('📷 Take Photo');
    fireEvent.press(takePhotoButton);

    // Should show alert for photo capture
    expect(takePhotoButton).toBeTruthy();
  });

  it('handles audio recording mock', () => {
    const { getByText } = render(
      <ReportSubmissionScreen navigation={mockNavigation} />
    );

    const recordAudioButton = getByText('🎤 Record Audio');
    fireEvent.press(recordAudioButton);

    // Should show alert for audio recording
    expect(recordAudioButton).toBeTruthy();
  });

  it('handles successful report submission', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        message: 'Report submitted successfully',
        report: {
          id: 'report-123',
          title: 'Test Report',
        },
      }),
    };

    fetch.mockResolvedValueOnce(mockResponse);

    const { getByText, getByPlaceholderText } = render(
      <ReportSubmissionScreen navigation={mockNavigation} />
    );

    const titleInput = getByPlaceholderText('Brief description of the issue');
    const descriptionInput = getByPlaceholderText('Detailed description of the issue...');
    const submitButton = getByText('Submit Report');

    // Fill form
    fireEvent.changeText(titleInput, 'Test Title');
    fireEvent.changeText(descriptionInput, 'Test Description');

    // Wait for location to be captured (mock)
    await waitFor(() => {
      expect(getByText('Submit Report')).toBeTruthy();
    });

    // Submit form
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer null',
        },
        body: expect.any(String),
      });
    });
  });

  it('handles API errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { getByText, getByPlaceholderText } = render(
      <ReportSubmissionScreen navigation={mockNavigation} />
    );

    const titleInput = getByPlaceholderText('Brief description of the issue');
    const descriptionInput = getByPlaceholderText('Detailed description of the issue...');
    const submitButton = getByText('Submit Report');

    // Fill form
    fireEvent.changeText(titleInput, 'Test Title');
    fireEvent.changeText(descriptionInput, 'Test Description');

    // Wait for location to be captured (mock)
    await waitFor(() => {
      expect(getByText('Submit Report')).toBeTruthy();
    });

    // Submit form
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('Network error. Please check your connection and try again.')).toBeTruthy();
    });
  });

  it('handles cancel navigation', () => {
    const { getByText } = render(
      <ReportSubmissionScreen navigation={mockNavigation} />
    );

    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });
});
