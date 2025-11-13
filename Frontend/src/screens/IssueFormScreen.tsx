import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Image, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Audio } from 'expo-av';
import Button from '../components/common/Button'; // <-- FIXED: Default import
import TextInput from '../components/common/TextInput'; // <-- FIXED: Default import
import { createReport, createReportWithAudio } from '../services/reportService';
import * as Location from 'expo-location';

// --- DEFINE TYPES ---
type IssueFormRouteParams = {
  imageUri?: string;
};

// Specify the param list for this screen
type RootStackParamList = {
  IssueForm: IssueFormRouteParams;
};

type IssueFormScreenRouteProp = RouteProp<RootStackParamList, 'IssueForm'>;

const IssueFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<IssueFormScreenRouteProp>(); // <-- APPLY TYPE
  
  // Media state
  const [imageUri, setImageUri] = useState(route.params?.imageUri || null);
  
  // --- Audio State (with types) ---
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioPermission, setAudioPermission] = useState(false);

  // --- Form state (with types) ---
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [address, setAddress] = useState<Location.LocationGeocodedAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Request microphone permission
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setAudioPermission(status === 'granted');
    })();
  }, []);

  // Get location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Permission to access location was denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords); 

      let addr = await Location.reverseGeocodeAsync(loc.coords);
      setAddress(addr[0]); 
    })();
  }, []);

  // --- Audio Functions ---
  const startRecording = async () => {
    if (!audioPermission) {
      Alert.alert("Permission Denied", "Microphone permission is required to record audio.");
      return;
    }
    
    setImageUri(null);
    setAudioUri(null);
    setDescription(''); 
    
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
    }
  };

  const stopRecording = async () => {
    if (!recording) return; 
    setIsRecording(false);
    await recording.stopAndUnloadAsync(); 
    const uri = recording.getURI(); 
    setAudioUri(uri);
    setRecording(null);
    setDescription("Audio report (transcription pending...)");
  };
  
  const handleSubmit = async () => {
    if (!location) {
      Alert.alert('Error', 'Could not get location. Please wait and try again.');
      return;
    }
    
    if (!imageUri && !audioUri) {
       Alert.alert('No Media', 'Please select an image or record an audio note.');
       return;
    }

    setIsSubmitting(true);

    try {
      let response;
      if (imageUri) {
        if (!description) {
           Alert.alert('Missing Description', 'Please add a description for the image.');
           setIsSubmitting(false);
           return;
        }
        response = await createReport(imageUri, location, address, description);
      } else if (audioUri) {
        response = await createReportWithAudio(audioUri, location, address);
      }

      if (response.success) {
        Alert.alert('Success', 'Report submitted successfully!');
        navigation.goBack(); 
      }
    } catch (error: any) { 
      setIsSubmitting(false);
      
      const errorData = error.response?.data;
      
      if (errorData && errorData.code === 'NON_CIVIC_ISSUE') {
        console.log('Submission failed: Not a civic issue.', errorData);
        Alert.alert(
          "Invalid Report",
          errorData.message || "The media does not appear to contain a civic issue. The report was not filed."
        );
      } else {
        console.error('Failed to create report:', error);
        Alert.alert(
          "Submission Failed",
          "An unknown error occurred. Please try again."
        );
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Submit New Report</Text>

      {imageUri && (
        <View>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <Button title="Change Image" onPress={() => navigation.goBack()} />
        </View>
      )}

      {audioUri && (
        <View style={styles.audioPrompt}>
          <Text style={styles.audioText}>Audio report recorded.</Text>
          <Button title="Clear Audio" onPress={() => setAudioUri(null)} style={{backgroundColor: '#aaa'}} />
        </View>
      )}

      {!imageUri && !audioUri && (
        <View style={styles.mediaButtons}>
          <Button 
            title="Select Image"
            onPress={() => navigation.goBack()} 
            style={{flex: 1}}
          />
          <Button
            title={isRecording ? 'Stop Recording' : 'Record Audio'}
            onPress={isRecording ? stopRecording : startRecording}
            style={{flex: 1, backgroundColor: isRecording ? '#d9534f' : '#0275d8'}}
          />
        </View>
      )}

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Add a description (or record audio)"
        multiline
        numberOfLines={4}
        style={styles.textInput}
        editable={!audioUri}
      />

      {address && ( 
        <View style={styles.locationBox}>
          <Text style={styles.locationTitle}>Your Location (Approx.)</Text>
          <Text>{address.street}, {address.city}</Text>
          <Text>{address.region}, {address.postalCode}</Text>
        </View>
      )}

      <Button
        title={isSubmitting ? 'Submitting...' : 'Submit Report'}
        onPress={handleSubmit}
        disabled={isSubmitting || (!imageUri && !audioUri)}
      />
    </ScrollView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer:{
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  locationBox: {
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  audioPrompt: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 20,
  },
  audioText: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default IssueFormScreen;