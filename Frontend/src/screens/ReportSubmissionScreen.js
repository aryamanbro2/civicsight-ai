/**
 * ReportSubmissionScreen Component (M-03/M-04, M-05)
 * Quick Report flow with Automatic Geo-Tagging
 * 
 * Features implemented:
 * - Quick report submission form
 * - Mock Geolocation API for GPS coordinates
 * - Media capture buttons (Photo/Audio) with mock logic
 * - Map component to display captured location
 * - Integration with POST /api/reports endpoint
 * - NativeWind styling for sleek interface
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
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import MapView with fallback
let MapView, Marker;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps.MapView;
  Marker = Maps.Marker;
} catch (error) {
  console.log('react-native-maps not available, using fallback');
  MapView = null;
  Marker = null;
}
import '../global.css';

const ReportSubmissionScreen = ({ navigation }) => {
  const [reportData, setReportData] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    address: 'Getting location...',
  });
  const [mediaFiles, setMediaFiles] = useState({
    photos: [],
    audio: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationError, setLocationError] = useState(null);

  /**
   * Mock Geolocation API to get current position
   * In a real app, this would use @react-native-geolocation-service
   */
  const getCurrentLocation = () => {
    setIsLoading(true);
    setLocationError(null);

    // Mock geolocation with realistic coordinates (San Francisco area)
    const mockLocation = {
      latitude: 37.7749 + (Math.random() - 0.5) * 0.01, // Add some randomness
      longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
    };

    // Simulate API delay
    setTimeout(() => {
      setLocation({
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
        address: `San Francisco, CA (${mockLocation.latitude.toFixed(4)}, ${mockLocation.longitude.toFixed(4)})`,
      });
      setIsLoading(false);
      console.log('📍 Location captured:', mockLocation);
    }, 1500);
  };

  /**
   * Get location on component mount
   */
  useEffect(() => {
    getCurrentLocation();
  }, []);

  /**
   * Handle input changes
   */
  const handleInputChange = (field, value) => {
    setReportData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Mock photo capture
   */
  const handleTakePhoto = () => {
    Alert.alert(
      'Take Photo',
      'Photo capture functionality would be implemented here using react-native-image-picker or similar library.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mock Photo',
          onPress: () => {
            const mockPhoto = {
              id: Date.now(),
              uri: 'https://mock-s3/report-photo.jpg',
              type: 'image/jpeg',
              name: `photo_${Date.now()}.jpg`,
            };
            setMediaFiles(prev => ({
              ...prev,
              photos: [...prev.photos, mockPhoto],
            }));
            console.log('📷 Mock photo added:', mockPhoto);
          },
        },
      ]
    );
  };

  /**
   * Mock audio capture
   */
  const handleRecordAudio = () => {
    Alert.alert(
      'Record Audio',
      'Audio recording functionality would be implemented here using react-native-audio-recorder-player or similar library.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mock Audio',
          onPress: () => {
            const mockAudio = {
              id: Date.now(),
              uri: 'https://mock-s3/report-audio.m4a',
              type: 'audio/m4a',
              name: `audio_${Date.now()}.m4a`,
            };
            setMediaFiles(prev => ({
              ...prev,
              audio: mockAudio,
            }));
            console.log('🎤 Mock audio added:', mockAudio);
          },
        },
      ]
    );
  };

  /**
   * Remove media file
   */
  const removeMediaFile = (type, id) => {
    if (type === 'photo') {
      setMediaFiles(prev => ({
        ...prev,
        photos: prev.photos.filter(photo => photo.id !== id),
      }));
    } else if (type === 'audio') {
      setMediaFiles(prev => ({
        ...prev,
        audio: null,
      }));
    }
  };

  /**
   * Submit report to backend
   */
  const handleSubmitReport = async () => {
    // Validate required fields
    if (!reportData.title.trim()) {
      Alert.alert('Error', 'Please enter a title for your report');
      return;
    }

    if (!reportData.description.trim()) {
      Alert.alert('Error', 'Please enter a description for your report');
      return;
    }

    if (!location.latitude || !location.longitude) {
      Alert.alert('Error', 'Location is required. Please wait for location to be captured.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get stored user token
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (!token || !userData) {
        Alert.alert('Error', 'Please login again to submit reports');
        navigation.navigate('Login');
        return;
      }

      const user = JSON.parse(userData);

      // Prepare report data
      const reportPayload = {
        title: reportData.title.trim(),
        description: reportData.description.trim(),
        category: reportData.category,
        priority: reportData.priority,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
        },
        media: {
          photos: mediaFiles.photos.map(photo => ({
            url: photo.uri,
            type: photo.type,
            name: photo.name,
          })),
          audio: mediaFiles.audio ? {
            url: mediaFiles.audio.uri,
            type: mediaFiles.audio.type,
            name: mediaFiles.audio.name,
          } : null,
        },
        // Mock AI analysis results (placeholder for B-02, B-03, B-04)
        issueType: 'pothole', // Mock classification
        severityScore: 7, // Mock severity score
        status: 'submitted',
        submittedBy: user.id,
        submittedAt: new Date().toISOString(),
      };

      console.log('📤 Submitting report:', reportPayload);

      // Submit to backend
      const response = await fetch('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reportPayload),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Report submitted successfully:', data);
        
        Alert.alert(
          'Report Submitted!',
          `Your report has been submitted successfully. Report ID: ${data.report?.id || 'N/A'}`,
          [
            {
              text: 'View My Reports',
              onPress: () => navigation.navigate('MyReports'),
            },
            {
              text: 'Submit Another',
              onPress: () => {
                // Reset form
                setReportData({
                  title: '',
                  description: '',
                  category: 'general',
                  priority: 'medium',
                });
                setMediaFiles({
                  photos: [],
                  audio: null,
                });
                getCurrentLocation();
              },
            },
          ]
        );
      } else {
        throw new Error(data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'Failed to submit report. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="bg-white shadow-sm border-b border-gray-200">
            <View className="px-6 py-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-2xl font-bold text-gray-900">
                    Quick Report
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    Report a civic issue with location and media
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-gray-100 rounded-lg px-3 py-2"
                  onPress={() => navigation.goBack()}
                >
                  <Text className="text-gray-700 font-semibold text-sm">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View className="flex-1 px-6 py-6">
            {/* Location Section */}
            <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                📍 Location
              </Text>
              
              {isLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text className="text-gray-600 mt-2">Getting your location...</Text>
                </View>
              ) : location.latitude && location.longitude ? (
                <View>
                  <Text className="text-gray-600 mb-4">{location.address}</Text>
                  
                  {/* Map Component */}
                  <View className="h-48 rounded-lg overflow-hidden border border-gray-200">
                    {MapView ? (
                      <MapView
                        style={{ flex: 1 }}
                        initialRegion={{
                          latitude: location.latitude,
                          longitude: location.longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }}
                        region={{
                          latitude: location.latitude,
                          longitude: location.longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }}
                      >
                        <Marker
                          coordinate={{
                            latitude: location.latitude,
                            longitude: location.longitude,
                          }}
                          title="Report Location"
                          description={location.address}
                        />
                      </MapView>
                    ) : (
                      // Fallback map display
                      <View className="flex-1 bg-gray-100 items-center justify-center">
                        <Text className="text-4xl mb-2">🗺️</Text>
                        <Text className="text-gray-600 text-center font-semibold">
                          Location Captured
                        </Text>
                        <Text className="text-gray-500 text-sm text-center mt-1">
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </Text>
                        <Text className="text-gray-400 text-xs text-center mt-2">
                          (Map view requires react-native-maps)
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    className="mt-4 bg-blue-50 border border-blue-200 rounded-lg py-3 px-4"
                    onPress={getCurrentLocation}
                  >
                    <Text className="text-blue-700 text-center font-semibold">
                      🔄 Refresh Location
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="items-center py-8">
                  <Text className="text-red-500 mb-4">Failed to get location</Text>
                  <TouchableOpacity
                    className="bg-red-50 border border-red-200 rounded-lg py-3 px-4"
                    onPress={getCurrentLocation}
                  >
                    <Text className="text-red-700 font-semibold">
                      🔄 Try Again
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Report Form */}
            <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                📝 Report Details
              </Text>
              
              <View className="space-y-4">
                {/* Title */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                    placeholder="Brief description of the issue"
                    value={reportData.title}
                    onChangeText={(value) => handleInputChange('title', value)}
                    maxLength={100}
                  />
                </View>

                {/* Description */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 h-24"
                    placeholder="Detailed description of the issue..."
                    value={reportData.description}
                    onChangeText={(value) => handleInputChange('description', value)}
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                  />
                </View>

                {/* Category */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Category
                  </Text>
                  <View className="flex-row space-x-2">
                    {['general', 'pothole', 'streetlight', 'garbage', 'other'].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        className={`px-4 py-2 rounded-lg border ${
                          reportData.category === cat
                            ? 'bg-primary-100 border-primary-500'
                            : 'bg-gray-50 border-gray-300'
                        }`}
                        onPress={() => handleInputChange('category', cat)}
                      >
                        <Text className={`text-sm font-medium ${
                          reportData.category === cat ? 'text-primary-700' : 'text-gray-700'
                        }`}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Priority */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </Text>
                  <View className="flex-row space-x-2">
                    {['low', 'medium', 'high', 'urgent'].map((priority) => (
                      <TouchableOpacity
                        key={priority}
                        className={`px-4 py-2 rounded-lg border ${
                          reportData.priority === priority
                            ? 'bg-primary-100 border-primary-500'
                            : 'bg-gray-50 border-gray-300'
                        }`}
                        onPress={() => handleInputChange('priority', priority)}
                      >
                        <Text className={`text-sm font-medium ${
                          reportData.priority === priority ? 'text-primary-700' : 'text-gray-700'
                        }`}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Media Section */}
            <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                📷 Media
              </Text>
              
              {/* Media Buttons */}
              <View className="flex-row space-x-3 mb-4">
                <TouchableOpacity
                  className="flex-1 bg-blue-50 border border-blue-200 rounded-lg py-4 px-4"
                  onPress={handleTakePhoto}
                >
                  <Text className="text-blue-700 text-center font-semibold">
                    📷 Take Photo
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-1 bg-green-50 border border-green-200 rounded-lg py-4 px-4"
                  onPress={handleRecordAudio}
                >
                  <Text className="text-green-700 text-center font-semibold">
                    🎤 Record Audio
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Media Files Display */}
              {mediaFiles.photos.length > 0 && (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Photos ({mediaFiles.photos.length})
                  </Text>
                  <View className="space-y-2">
                    {mediaFiles.photos.map((photo) => (
                      <View key={photo.id} className="flex-row items-center justify-between bg-gray-50 rounded-lg p-3">
                        <Text className="text-gray-700 flex-1">{photo.name}</Text>
                        <TouchableOpacity
                          className="bg-red-100 rounded-full p-1"
                          onPress={() => removeMediaFile('photo', photo.id)}
                        >
                          <Text className="text-red-600 text-xs">✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {mediaFiles.audio && (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Audio Recording
                  </Text>
                  <View className="flex-row items-center justify-between bg-gray-50 rounded-lg p-3">
                    <Text className="text-gray-700 flex-1">{mediaFiles.audio.name}</Text>
                    <TouchableOpacity
                      className="bg-red-100 rounded-full p-1"
                      onPress={() => removeMediaFile('audio', mediaFiles.audio.id)}
                    >
                      <Text className="text-red-600 text-xs">✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`rounded-xl py-4 px-6 shadow-sm ${
                isSubmitting || !location.latitude
                  ? 'bg-gray-300'
                  : 'bg-primary-600'
              }`}
              onPress={handleSubmitReport}
              disabled={isSubmitting || !location.latitude}
            >
              <View className="flex-row items-center justify-center">
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : null}
                <Text className={`text-center font-semibold text-lg ml-2 ${
                  isSubmitting || !location.latitude
                    ? 'text-gray-500'
                    : 'text-white'
                }`}>
                  {isSubmitting ? 'Submitting Report...' : 'Submit Report'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Status Section */}
            <View className="mt-6 bg-gray-100 rounded-xl p-4">
              <Text className="text-sm text-gray-600 text-center">
                🚀 M-03/M-04: Quick Report + M-05: Geo-Tagging implemented
              </Text>
              <Text className="text-xs text-gray-500 text-center mt-1">
                Mock media capture and location services
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ReportSubmissionScreen;
