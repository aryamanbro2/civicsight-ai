import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Image, 
  Platform, 
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av'; 
import Button from '../components/common/Button'; 
import TextInput from '../components/common/TextInput'; 
import { 
  createReport, 
  createReportWithAudio,
  CreateReportData,
  CreateReportAudioData
} from '../services/reportService';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';


// --- DEFINE TYPES ---
type IssueFormRouteParams = {
  imageUri?: string;
  audioMode?: boolean; 
};

type AppStackParamList = {
  AppTabs: { screen: string }; 
  CameraScreen: undefined;
  IssueForm: IssueFormRouteParams;
  ReportDetail: { report: any };
};

type IssueFormScreenRouteProp = RouteProp<AppStackParamList, 'IssueForm'>;
type IssueFormNavigationProp = NativeStackNavigationProp<AppStackParamList, 'IssueForm'>;


// --- UI CONSTANTS (Dark Theme) ---
const COLORS = {
  BACKGROUND: '#121212', 
  CARD: '#1E1E1E',       
  PRIMARY: '#BB86FC',    
  ACCENT: '#03DAC6',     
  TEXT: '#E0E0E0',       
  SECONDARY_TEXT: '#B0B0B0', 
  BORDER: '#333333',     
  DANGER: '#CF6679',
};
const FONT = Platform.select({ ios: 'System', android: 'Roboto', default: 'System' });


const IssueFormScreen = () => {
  const navigation = useNavigation<IssueFormNavigationProp>();
  const route = useRoute<IssueFormScreenRouteProp>();

  // Media state
  const [imageUri, setImageUri] = useState(route.params?.imageUri || null);

  // Audio State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioPermission, setAudioPermission] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [address, setAddress] = useState<Location.LocationGeocodedAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // --- THIS IS THE KEY STATE ---
  const [isLocationLoading, setIsLocationLoading] = useState(true); // Start as true

  // Mode state
  const [isTextMode, setIsTextMode] = useState(true); 

  // --- INITIALIZATION EFFECTS ---

  useEffect(() => {
    (async () => {
      // --- THIS IS THE FIX ---
      // The try/catch/finally now wraps ALL async logic.
      setIsLocationLoading(true); // Set loading true at the start
      try {
        // 1. Audio permission
        const { status: audioStatus } = await Audio.requestPermissionsAsync();
        setAudioPermission(audioStatus === 'granted'); 

        // 2. Location permission and fetch
        let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        if (locationStatus !== 'granted') {
          Alert.alert('Permission Denied', 'Location access is required to submit reports.');
          // We return here, but the 'finally' block will still run
          return; 
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);

        const addr = await Location.reverseGeocodeAsync(loc.coords);
        setAddress(addr[0] || null);

      } catch (error) {
        console.error("Permission/Location Error:", error);
        Alert.alert('Error', 'Failed to get location or permissions.');
      } finally {
        // This block now runs regardless of any errors,
        // correctly setting loading to false and enabling the button.
        setIsLocationLoading(false); 
      }
      // --- END OF FIX ---
    })();
  }, []);

  // Effect to handle initial VOICENOTE flow
  useEffect(() => {
    // Only try to auto-start recording if permissions are granted
    if (route.params?.audioMode && !isRecording && !audioUri && audioPermission) {
        startRecording();
    }
  }, [route.params?.audioMode, audioPermission]); // Depend on audioPermission

  // --- Audio Functions ---
  const startRecording = async () => {
    if (!audioPermission) {
      Alert.alert('Permission Denied', 'Microphone access is required to record audio.');
      return;
    }
    // ... (rest of function is correct)
    if (!imageUri) {
      setImageUri(null);
    }
    setAudioUri(null);
    setDescription(''); 
    setIsTextMode(false); 

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      }); 

      const { recording } = await Audio.Recording.createAsync(
         Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    // ... (this function is correct)
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setAudioUri(uri);
    setRecording(null);
    setDescription("Audio report (AI transcription pending...)");
    if (imageUri) {
        setIsTextMode(false); 
    }
  };

  // --- Form Submission ---
  const handleSubmit = async () => {
    if (!location || !address) {
       Alert.alert('Location Pending', 'Waiting to get your location. Please wait a moment.');
       return;
    }

    // --- Validation logic is correct ---
    if (audioUri) {
        // SCENARIO 1: AUDIO (EITHER ALONE OR COMBO)
    } else if (imageUri && isTextMode) {
        // SCENARIO 2: IMAGE + TEXT
        if (!description.trim()) {
            Alert.alert('Missing Description', 'Please add a detailed description for the image.');
            return;
        }
    } else if (imageUri && !isTextMode && !audioUri) {
        // SCENARIO 3: IMAGE + (Pending Audio)
        Alert.alert('Missing Audio', 'Please record your description or switch to text mode.');
        return;
    } else {
        // SCENARIO 4: NO MEDIA AT ALL
        Alert.alert('Missing Media', 'Please attach an image or record audio to submit a report.');
        return;
    }

    setIsSubmitting(true);
    let response;

    try {
      if (audioUri) {
        // Submit AUDIO (or COMBO)
        const audioData: CreateReportAudioData = {
          latitude: location.latitude,
          longitude: location.longitude,
          address: address.name || address.street || '',
          city: address.city || address.subregion || '',
          state: address.region || '',
          zipCode: address.postalCode || '',
          audioUri: audioUri,
          imageUri: imageUri, 
        };
        response = await createReportWithAudio(audioData);
      
      } else if (imageUri) {
        // Submit IMAGE-ONLY
        const reportData: CreateReportData = {
          latitude: location.latitude,
          longitude: location.longitude,
          description: description, 
          address: address.name || address.street || '',
          city: address.city || address.subregion || '',
          state: address.region || '',
          zipCode: address.postalCode || '',
          imageUri: imageUri,
        };
        response = await createReport(reportData);
      }

      if (response && response.success) {
        Alert.alert('✅ Success', 'Report submitted successfully! The AI will now classify your issue.');
        navigation.navigate('AppTabs', { screen: 'My Reports' }); 
      }
    } catch (error: any) { 
      setIsSubmitting(false);
      console.error("Submit Error:", error.message);
      Alert.alert('Submission Error', error.message || 'Failed to submit report.');
    }
  };


  // --- Render Functions ---
  // ... (renderMediaPreview is correct)
  const renderMediaPreview = () => {
    if (!imageUri) return null; // No image, no preview
    return (
        <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => {
                    setImageUri(null);
                    setAudioUri(null); // Also clear audio if image is removed
                    setIsTextMode(true);
                }}
            >
                <Ionicons name="close-circle" size={30} color={COLORS.DANGER} />
            </TouchableOpacity>
        </View>
    );
  };
  
  const isAudioOnlyMode = !imageUri && (isRecording || audioUri);
  
  // ... (renderAudioControls is correct)
  const renderAudioControls = () => (
      <View style={styles.audioContainer}>
          <TouchableOpacity 
              style={[styles.micButton, isRecording ? styles.micButtonRecording : null]} 
              onPress={isRecording ? stopRecording : startRecording}
          >
              <Ionicons name={isRecording ? "stop" : "mic"} size={32} color={isRecording ? COLORS.DANGER : "white"} />
          </TouchableOpacity>
          <Text style={styles.audioText}>
              {isRecording ? "Recording..." : (audioUri ? "Audio Captured!" : "Tap to Record")}
          </Text>
      </View>
  );

  // ... (renderDescriptionInput is correct)
  const renderDescriptionInput = () => {
      if (isAudioOnlyMode) {
          return (
              <TextInput
                  placeholder="AI Transcription will appear here..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  editable={false} 
                  style={styles.descriptionInput}
              />
          );
      }
      return (
          <View>
              <View style={styles.modeToggleContainer}>
                  <TouchableOpacity
                      style={[styles.modeToggle, isTextMode && styles.modeToggleActive]}
                      onPress={() => {
                          setIsTextMode(true);
                          setAudioUri(null); 
                      }}
                  >
                      <Ionicons name="text" size={20} color={isTextMode ? COLORS.PRIMARY : COLORS.SECONDARY_TEXT} />
                      <Text style={[styles.modeToggleText, isTextMode && styles.modeToggleTextActive]}>Text</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                      style={[styles.modeToggle, !isTextMode && styles.modeToggleActive]}
                      onPress={() => {
                          setIsTextMode(false);
                          setDescription(''); 
                          startRecording();
                      }}
                  >
                      <Ionicons name="mic" size={20} color={!isTextMode ? COLORS.PRIMARY : COLORS.SECONDARY_TEXT} />
                      <Text style={[styles.modeToggleText, !isTextMode && styles.modeToggleTextActive]}>Audio</Text>
                  </TouchableOpacity>
              </View>

              {isTextMode ? (
                  <TextInput
                      placeholder="Add a detailed description (e.g., 'Large pothole at Main St & 2nd Ave')"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      style={styles.descriptionInput}
                  />
              ) : (
                  renderAudioControls()
              )}
          </View>
      );
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      
      {renderMediaPreview()}

      {route.params?.audioMode && !imageUri && (
          <View style={[styles.audioPrompt]}>
             <Text style={styles.audioPromptText}>Submit an Audio Report</Text>
             {renderAudioControls()}
          </View>
      )}

      {(imageUri || isAudioOnlyMode) && renderDescriptionInput()}

      {address && ( 
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={18} color={COLORS.ACCENT} />
          <Text style={styles.locationText}>{address.name || 'Current Location'}</Text>
          <Text style={styles.locationSubText}>{address.city}, {address.region}</Text>
        </View>
      )}

      {isLocationLoading && (
        <View style={styles.locationContainer}>
          <ActivityIndicator color={COLORS.PRIMARY} />
          <Text style={styles.locationText}>Fetching location...</Text>
        </View>
      )}

      <Button 
        title={isSubmitting ? "Submitting..." : "Submit Report via AI"}
        onPress={handleSubmit}
        // This 'disabled' logic is now correct. The button will be
        // disabled while loading location, and enabled after.
        disabled={isSubmitting || isLocationLoading}
        loading={isSubmitting}
        style={{ marginVertical: 10, backgroundColor: COLORS.PRIMARY }}
      />
      
    </ScrollView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    padding: 15,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: COLORS.CARD,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 15,
  },
  descriptionInput: {
    minHeight: 120,
    textAlignVertical: 'top',
    marginTop: 10,
  },
  locationContainer: {
    backgroundColor: COLORS.CARD,
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
  },
  locationText: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  locationSubText: {
    fontSize: 12,
    color: COLORS.SECONDARY_TEXT,
    marginLeft: 5,
  },
  // --- Audio Styles ---
  audioPrompt: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  audioPromptText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 20,
  },
  audioContainer: {
    backgroundColor: COLORS.CARD,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  micButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonRecording: {
    backgroundColor: COLORS.CARD,
    borderWidth: 2,
    borderColor: COLORS.DANGER,
  },
  audioText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.SECONDARY_TEXT,
    fontWeight: '600',
  },
  // --- Mode Toggle Styles ---
  modeToggleContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: COLORS.CARD,
    borderRadius: 8,
    marginTop: 15,
  },
  modeToggle: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  modeToggleActive: {
    backgroundColor: COLORS.BORDER,
    borderRadius: 8,
  },
  modeToggleText: {
    color: COLORS.SECONDARY_TEXT,
    fontSize: 16,
    marginLeft: 10,
  },
  modeToggleTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
});

export default IssueFormScreen;