import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reportService } from '../services/reportService';
// FIX: Import the location type from the updated CameraScreen
import { CapturedLocation } from './CameraScreen';

const { width } = Dimensions.get('window');

interface IssueFormScreenProps {
  imageUri: string;
  // FIX: Use the new location type
  location: CapturedLocation | null;
  onSubmit: () => void;
  onClose: () => void;
}
// ... (The rest of the file is identical to the one I provided before) ...
const issueCategories = [
  { id: 'pothole', name: 'Hole in the road', icon: '🕳️', color: '#F59E0B' },
  { id: 'ice', name: 'Ice on the road', icon: '🧊', color: '#3B82F6' },
  { id: 'debris', name: 'Other', icon: '⚠️', color: '#EF4444' },
];

const priorityLevels = [
  { id: 'low', name: 'Low', color: '#10B981' },
  { id: 'medium', name: 'Medium', color: '#F59E0B' },
  { id: 'high', name: 'High', color: '#EF4444' },
];

const IssueFormScreen = ({
  imageUri,
  location,
  onSubmit,
  onClose,
}: IssueFormScreenProps) => {
  const [selectedCategory, setSelectedCategory] = useState('pothole');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatAddress = () => {
    if (!location?.address) return 'Unknown location';
    const addr = location.address;
    return [addr.streetNumber, addr.street, addr.city, addr.region]
      .filter(Boolean)
      .join(', ');
  };

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert('Error', 'Location data is missing, cannot submit.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please add a description');
      return;
    }

    setIsSubmitting(true);
    try {
      const reportData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        mediaType: 'image' as const,
        mediaUrl: imageUri,
        description: description.trim(),
        address: formatAddress(),
        city: location.address?.city || '',
        state: location.address?.region || '',
        zipCode: location.address?.postalCode || '',
      };

      const response = await reportService.createReport(reportData);

      if (response.success) {
        Alert.alert('Success', 'Issue reported successfully!', [
          { text: 'OK', onPress: onSubmit },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to submit report');
      }
    } catch (error: any) {
      console.error('Submit error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report an Issue</Text>
      </View>

      <View style={styles.formContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Issue location</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={20} color="#8B5CF6" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>{formatAddress()}</Text>
                <Text style={styles.locationCoords}>
                  {location?.coords?.latitude.toFixed(6)},{' '}
                  {location?.coords?.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Issue category</Text>
            <View style={styles.categoryContainer}>
              {issueCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.categoryTextSelected,
                    ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Issue priority</Text>
            <View style={styles.priorityContainer}>
              {priorityLevels.map((priority) => (
                <TouchableOpacity
                  key={priority.id}
                  style={[
                    styles.priorityButton,
                    selectedPriority === priority.id && [
                      styles.priorityButtonSelected,
                      { backgroundColor: priority.color },
                    ],
                  ]}
                  onPress={() => setSelectedPriority(priority.id)}>
                  <Text
                    style={[
                      styles.priorityText,
                      selectedPriority === priority.id && styles.priorityTextSelected,
                    ]}>
                    {priority.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Describe the issue in detail..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}>
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Issue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
// ... (styles remain the same) ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F59E0B',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: '#666',
  },
  changeButton: {
    color: '#8B5CF6',
    fontWeight: '600',
    fontSize: 14,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  priorityButtonSelected: {
    backgroundColor: '#EF4444',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  priorityTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default IssueFormScreen;