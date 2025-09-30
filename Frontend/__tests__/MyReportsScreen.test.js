/**
 * MyReportsScreen Tests (M-06)
 * Tests for My Reports & Tracking feature
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MyReportsScreen from '../src/screens/MyReportsScreen';

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

describe('MyReportsScreen Component (M-06)', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <MyReportsScreen navigation={mockNavigation} />
    );

    expect(getByText('My Reports')).toBeTruthy();
    expect(getByText('Track and manage your submitted reports')).toBeTruthy();
    expect(getByText('🔄 Refresh')).toBeTruthy();
  });

  it('shows loading state initially', () => {
    const { getByText } = render(
      <MyReportsScreen navigation={mockNavigation} />
    );

    expect(getByText('Loading your reports...')).toBeTruthy();
  });

  it('fetches reports on mount', async () => {
    const mockReports = [
      {
        id: 'report-1',
        title: 'Pothole on Main Street',
        description: 'Large pothole causing traffic issues',
        status: 'in_progress',
        issueType: 'pothole',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reports: mockReports }),
    });

    render(<MyReportsScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/reports/my', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer null',
        },
      });
    });
  });

  it('displays reports list when data is available', async () => {
    const mockReports = [
      {
        id: 'report-1',
        title: 'Pothole on Main Street',
        description: 'Large pothole causing traffic issues',
        status: 'in_progress',
        issueType: 'pothole',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'report-2',
        title: 'Broken Street Light',
        description: 'Street light not working at night',
        status: 'resolved',
        issueType: 'streetlight',
        createdAt: '2024-01-02T00:00:00.000Z',
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reports: mockReports }),
    });

    const { getByText } = render(
      <MyReportsScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Your Reports (2)')).toBeTruthy();
      expect(getByText('Pothole on Main Street')).toBeTruthy();
      expect(getByText('Broken Street Light')).toBeTruthy();
      expect(getByText('1 Resolved')).toBeTruthy();
      expect(getByText('1 In Progress')).toBeTruthy();
    });
  });

  it('shows empty state when no reports', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reports: [] }),
    });

    const { getByText } = render(
      <MyReportsScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('No Reports Yet')).toBeTruthy();
      expect(getByText('You haven\'t submitted any reports yet. Start by reporting an issue!')).toBeTruthy();
    });
  });

  it('handles API errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(
      <MyReportsScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Failed to Load Reports')).toBeTruthy();
      expect(getByText('Network error')).toBeTruthy();
      expect(getByText('Try Again')).toBeTruthy();
    });
  });

  it('handles refresh functionality', async () => {
    const mockReports = [
      {
        id: 'report-1',
        title: 'Test Report',
        description: 'Test description',
        status: 'submitted',
        issueType: 'general',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reports: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reports: mockReports }),
      });

    const { getByText } = render(
      <MyReportsScreen navigation={mockNavigation} />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(getByText('No Reports Yet')).toBeTruthy();
    });

    // Trigger refresh
    const refreshButton = getByText('🔄 Refresh');
    fireEvent.press(refreshButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(getByText('Your Reports (1)')).toBeTruthy();
    });
  });

  it('handles report press', async () => {
    const mockReports = [
      {
        id: 'report-1',
        title: 'Test Report',
        description: 'Test description',
        status: 'submitted',
        issueType: 'pothole',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reports: mockReports }),
    });

    const { getByText } = render(
      <MyReportsScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Test Report')).toBeTruthy();
    });

    const reportItem = getByText('Test Report');
    fireEvent.press(reportItem);

    // Should show alert with report details
    await waitFor(() => {
      expect(getByText('Report Details')).toBeTruthy();
    });
  });

  it('navigates to report submission', () => {
    const { getByText } = render(
      <MyReportsScreen navigation={mockNavigation} />
    );

    const quickReportButton = getByText('📝 Quick Report');
    fireEvent.press(quickReportButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('ReportSubmission');
  });

  it('handles authentication errors', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValueOnce(null); // No token

    const { getByText } = render(
      <MyReportsScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Please login again to view your reports')).toBeTruthy();
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });

  it('displays correct status styling', async () => {
    const mockReports = [
      {
        id: 'report-1',
        title: 'Resolved Report',
        description: 'This is resolved',
        status: 'resolved',
        issueType: 'pothole',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'report-2',
        title: 'In Progress Report',
        description: 'This is in progress',
        status: 'in_progress',
        issueType: 'streetlight',
        createdAt: '2024-01-02T00:00:00.000Z',
      },
      {
        id: 'report-3',
        title: 'Submitted Report',
        description: 'This is submitted',
        status: 'submitted',
        issueType: 'garbage',
        createdAt: '2024-01-03T00:00:00.000Z',
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reports: mockReports }),
    });

    const { getByText } = render(
      <MyReportsScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('RESOLVED')).toBeTruthy();
      expect(getByText('IN PROGRESS')).toBeTruthy();
      expect(getByText('SUBMITTED')).toBeTruthy();
    });
  });

  it('displays correct issue type icons', async () => {
    const mockReports = [
      {
        id: 'report-1',
        title: 'Pothole Report',
        description: 'Pothole issue',
        status: 'submitted',
        issueType: 'pothole',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'report-2',
        title: 'Street Light Report',
        description: 'Street light issue',
        status: 'submitted',
        issueType: 'streetlight',
        createdAt: '2024-01-02T00:00:00.000Z',
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reports: mockReports }),
    });

    const { getByText } = render(
      <MyReportsScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('🕳️')).toBeTruthy(); // Pothole icon
      expect(getByText('💡')).toBeTruthy(); // Street light icon
    });
  });
});
