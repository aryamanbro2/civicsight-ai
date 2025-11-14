import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Image, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// CHANGED: Import Audio from 'expo-audio'
import { Audio } from 'expo-audio';
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

// For the Route prop
type IssueFormRouteParams = {
  imageUri?: string; 
  audioMode?: boolean; 
};

// For the Navigation prop (based on App.tsx)
type AppStackParamList = {
  AppTabs: { screen: string }; 
  CameraScreen: undefined;
  IssueForm: IssueFormRouteParams;
  ReportDetail: { report: any };
};

type IssueFormNavigationProp = NativeStackNavigationProp<AppStackParamList, 'IssueForm'>;
type IssueFormScreenRouteProp = RouteProp<AppStackParamList, 'IssueForm'>;

// --- UI CONSTANTS (Dark Theme) ---
const COLORS = {
  PRIMARY: '#BB86FC', 
  DANGER: '#CF6679', 
  SUCCESS: '#03DAC6',
  CARD: '#1E1E1E',
  TEXT: '#E0E0E0',
  BACKGROUND: '#121212',
  SECONDARY_TEXT: '#B0B0B0',
  BORDER: '#333333', 
};
const FONT = Platform.select({ ios: 'System', android: 'Roboto', default: 'System' });


const IssueFormScreen = () => {
  const navigation = useNavigation<IssueFormNavigationProp>();
  const route = useRoute<IssueFormScreenRouteProp>();
  
  // Media state
  const [imageUri, setImageUri] = useState(route.params?.imageUri || null);
  
  // Audio State
  // CHANGED: Recording type is now from 'expo-audio'
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioPermission, setAudioPermission] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [address, setAddress] = useState<Location.LocationGeocodedAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  // Mode state
  const [isTextMode, setIsTextMode] = useState(true); 

  // --- INITIALIZATION EFFECTS ---

  useEffect(() => {
    (async () => {
      // Audio permission
      // CHANGED: Using new 'expo-audio' permission request
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      setAudioPermission(audioStatus === 'granted'); 

      // Location permission and fetch
      let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to submit a report.');
        return;
      }
      try {
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.LocationAccuracy.BestForNavigation });
        setLocation(loc.coords); 
        let addr = await Location.reverseGeocodeAsync(loc.coords);
        setAddress(addr[0]); 
      } catch (e) {
         Alert.alert('Error', 'Failed to retrieve your current location.');
      } finally {
        setIsLocationLoading(false);
      }
    })();
  }, []);
  
  // Effect to handle initial VOICENOTE flow
  useEffect(() => {
    if (route.params?.audioMode && !isRecording && !audioUri) {
        startRecording();
    }
  }, [route.params?.audioMode]);

  // --- Audio Functions ---
  const startRecording = async () => {
    if (!audioPermission) {
      Alert.alert("Permission Denied", "Microphone permission is required to record audio.");
      return;
    }
    
    if (!imageUri) {
      setImageUri(null);
    }
    setAudioUri(null);
    setDescription(''); 
    setIsTextMode(false); 
    
    try {
      // CHANGED: Using new 'expo-audio' audio mode setting
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      }); 
      
      // CHANGED: Recording creation logic
      const { recording } = await Audio.Recording.createAsync(
         Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording); 
      setIsRecording(true);
      
    } catch (err) {
      console.error('Failed to start recording', err);
      setIsRecording(false);
      Alert.alert('Recording Failed', 'Could not start microphone.');
    }
  };

  const stopRecording = async () => {
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
  
  // --- SUBMISSION LOGIC ---
  const handleSubmit = async () => {
    if (!location || !address) {
      Alert.alert('Error', isLocationLoading ? 'Fetching location, please wait.' : 'Could not get location. Report cannot be filed.');
      return;
    }
    
    if (!imageUri && !audioUri) {
       Alert.alert('No Media', 'Please select an image or record an audio note.');
       return;
    }

    if (imageUri && isTextMode && !description.trim()) {
       Alert.alert('Missing Description', 'Please add a detailed description for the image.');
       return;
    }
    
    if (imageUri && !isTextMode && !audioUri) {
       Alert.alert('Missing Audio', 'Please record your description or switch to text mode.');
       return;
    }

    setIsSubmitting(true);

    try {
      let response;

     if (audioUri) { 
        // SCENARIO 1 & 3: Audio submission (with or without image)
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
        response = await createReportWithAudio(audioData); // Calls POST /api/reports/audio
      
      } else if (imageUri) {
        // SCENARIO 2: Image Submission (Only runs if NO audio is present)
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
        response = await createReport(reportData); // Calls POST /api/reports
      
      } else {
         throw new Error('No media to submit.');
      }

      if (response.success) {
        Alert.alert('✅ Success', 'Report submitted successfully! The AI will now classify your issue.');
        
        navigation.navigate('AppTabs', { screen: 'My Reports' }); 
      }
    } catch (error: any) { 
      setIsSubmitting(false);
      
      const errorData = error.response?.data;
      
      if (errorData && errorData.code === 'NON_CIVIC_ISSUE') {
        Alert.alert(
          "❌ Invalid Report",
          errorData.message || "The AI determined the media does not describe a civic issue. The report was not filed."
        );
      } else {
        console.error('Failed to create report:', error);
        Alert.alert(
          "⚠️ Submission Failed",
          error.message || "An unknown error occurred. Please check your network and try again."
        );
      }
    }
  };

  // Determine display mode
  const isAudioOnlyMode = route.params?.audioMode;
  const isMediaPresent = imageUri || audioUri;

  // --- RENDERING HELPERS ---

  const renderMediaPreview = () => {
    if (imageUri) {
      return (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <Button 
            title="Change Photo" 
            onPress={() => navigation.goBack()} 
            style={styles.changeMediaButton} 
          />
        </View>
      );
    }
    if (audioUri && isAudioOnlyMode) {
      return (
        <View style={[styles.audioPrompt, { borderColor: COLORS.SUCCESS }]}>
          <Ionicons name="mic-circle-outline" size={50} color={COLORS.SUCCESS} />
          <Text style={styles.audioText}>Audio Report Recorded</Text>
          <Text style={styles.audioTextSub}>Ready for AI transcription.</Text>
        </View>
      );
    }
    return null;
  };

  const renderAudioControls = () => (
    <View style={styles.audioControls}>
      <Button
        title={isRecording ? 'Stop Recording' : (audioUri ? 'Retake Voice Note' : 'Start Recording')}
        onPress={isRecording ? stopRecording : startRecording}
        style={{flex: 1, backgroundColor: isRecording ? COLORS.DANGER : (audioUri ? COLORS.DANGER : COLORS.PRIMARY)}}
        disabled={isSubmitting}
      />
      {isRecording && <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{marginLeft: 10}}/>}
    </View>
  );

  const renderDescriptionInput = () => {
      if (isAudioOnlyMode) {
          return (
              <TextInput
                  value={description}
                  placeholder="Audio transcription pending..."
                  multiline
                  numberOfLines={4}
                  style={StyleSheet.flatten([styles.textInput, styles.disabledInput])} 
                  editable={false}
              />
          );
      }
      
      return (
          <View>
              <View style={styles.modeToggleContainer}>
                  <Text style={styles.label}>📝 Description Mode</Text>
                  <Button 
                      title={isTextMode ? 'Switch to Voice Note' : 'Switch to Text Input'}
                      onPress={() => {
                          setIsTextMode(!isTextMode);
                          if (isTextMode) {
                              setAudioUri(null);
                              setDescription('');
                          } else {
                              setAudioUri(null);
                          }
                      }}
                      style={{backgroundColor: COLORS.CARD, borderWidth: 1, borderColor: COLORS.BORDER}}
                  />
              </View>
              
              {isTextMode ? (
                  <TextInput
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Add a detailed description for the AI to analyze."
                      multiline
                      numberOfLines={4}
                      style={styles.textInput} 
                      editable={!isSubmitting}
                  />
              ) : (
                  renderAudioControls()
              )}
          </View>
      );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>File Issue Report</Text>

      {renderMediaPreview()}
      
      {route.params?.audioMode && !audioUri && !isRecording && (
          <View style={[styles.audioPrompt, { borderColor: COLORS.PRIMARY }]}>
             <Text style={styles.audioText}>Ready for Voice Input</Text>
             {renderAudioControls()}
          </View>
      )}
      
      {(imageUri || isAudioOnlyMode) && renderDescriptionInput()}

      {address && ( 
        <View style={styles.locationBox}>
          <Text style={styles.locationTitle}>📍 Report Location</Text>
          <Text style={styles.locationText}>{address.street || address.name}, {address.city || address.subregion}</Text>
          <Text style={styles.locationSubText}>{address.region}, {address.postalCode}</Text>
          {isLocationLoading && <ActivityIndicator size="small" color={COLORS.PRIMARY} />}
        </View>
      )}

      <Button
        title={isSubmitting ? 'Submitting...' : 'Submit Report via AI'}
        onPress={handleSubmit}
        disabled={isSubmitting || !isMediaPresent || isLocationLoading || isRecording}
        style={{backgroundColor: COLORS.SUCCESS, marginTop: 20}}
      />
    </ScrollView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  contentContainer:{
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: COLORS.TEXT,
  },
  imagePreviewContainer: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 250,
    marginBottom: 10,
    borderRadius: 8,
  },
  changeMediaButton: {
      backgroundColor: COLORS.CARD,
      borderColor: COLORS.BORDER,
      borderWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.TEXT,
  },
  textInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    borderColor: COLORS.BORDER,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: COLORS.CARD,
    color: COLORS.TEXT,
  },
  disabledInput: {
    backgroundColor: COLORS.BORDER,
    color: COLORS.SECONDARY_TEXT,
  },
  locationBox: {
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: COLORS.CARD,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.PRIMARY,
  },
  locationText: {
      color: COLORS.TEXT,
  },
  locationSubText: {
      color: COLORS.SECONDARY_TEXT,
      fontSize: 12,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  audioPrompt: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.CARD,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  audioText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
    color: COLORS.TEXT,
  },
  audioTextSub: {
    fontSize: 14,
    color: COLORS.SECONDARY_TEXT,
    marginBottom: 10,
  },
  audioControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
  }
});

export default IssueFormScreen;