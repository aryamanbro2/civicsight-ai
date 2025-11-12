// FIX: Use standard named imports for React hooks
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, ActivityIndicator } from 'react-native';
// FIX: Using NativeStackScreenProps and explicitly installing the package resolves TypeScript finding the module.
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Camera, CameraType } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';


// --- Type Definitions (Ensure these match your router setup) ---
type ReportFormScreenParams = { mediaUri: string; mediaType: 'image' | 'audio' };

type RootStackParamList = {
  Camera: undefined;
  ReportForm: ReportFormScreenParams;
  Dashboard: undefined;
  Auth: undefined;
};
type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

const { width } = Dimensions.get('window');
const CAMERA_SIZE = width * 0.9;
const PRIMARY_COLOR = '#007AFF';
const DANGER_COLOR = '#FF3B30';

// FIX: Use standard function component syntax and explicitly type the props.
const CameraScreen: React.FC<Props> = ({ navigation }) => {
  // --- State Variables ---
  const cameraRef = useRef<Camera | null>(null);
  const audioRecorder = useRef<Audio.Recording | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  // CameraType is now correctly referenced as a value imported from 'expo-camera'
  const [type, setType] = useState<CameraType>(CameraType.back); 
  const [mode, setMode] = useState<'photo' | 'audio'>('photo'); 
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  // --- Permission Handlers ---
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: micStatus } = await Audio.requestPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

      const allGranted = cameraStatus === 'granted' && micStatus === 'granted' && locationStatus === 'granted';

      if (!allGranted) {
        Alert.alert('Permissions Required', 'Camera, microphone, and location permissions are essential for submitting a report.');
        setHasPermission(false);
        return;
      }
      setHasPermission(true);

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    };

    requestPermissions();
  }, []);

  // --- Photo Capture Logic ---
  const takePicture = async () => {
    if (cameraRef.current) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          exif: true,
          base64: false,
        });

        if (photo.uri) {
          navigation.navigate('ReportForm', { mediaUri: photo.uri, mediaType: 'image' });
        }
      } catch (error) {
        console.error("Photo capture failed:", error);
        Alert.alert("Error", "Failed to capture photo.");
      } finally {
        setIsCapturing(false);
      }
    }
  };

  // --- Audio Recording Logic ---
  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        // FIX: Using correct, current constants for Interruption Mode (Audio.InterruptionModeIOS)
        interruptionModeIOS: Audio.InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      audioRecorder.current = recording;
      setIsRecording(true);
    } catch (error) {
      console.error("Audio recording failed:", error);
      Alert.alert("Error", "Failed to start audio recording.");
    }
  };

  const stopRecording = async () => {
    if (audioRecorder.current) {
      try {
        await audioRecorder.current.stopAndUnloadAsync();
        const uri = audioRecorder.current.getURI();

        if (uri) {
          navigation.navigate('ReportForm', { mediaUri: uri, mediaType: 'audio' });
        }
      } catch (error) {
        console.error("Audio stop failed:", error);
        Alert.alert("Error", "Failed to stop recording.");
      } finally {
        audioRecorder.current = null;
        setIsRecording(false);
      }
    }
  };

  // --- Render Logic ---
  if (hasPermission === null || hasPermission === false) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>
          {hasPermission === false ? 'Permissions Denied. Check App Settings.' : 'Requesting permissions...'}
        </Text>
      </View>
    );
  }
  
  const toggleMode = () => {
    if (isRecording || isCapturing) return; 
    setMode(mode === 'photo' ? 'audio' : 'photo');
  };

  const captureAction = mode === 'photo' ? takePicture : (isRecording ? stopRecording : startRecording);

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>
        Report Civic Issue ({mode === 'photo' ? 'Image' : 'Voice'})
      </Text>
      
      {/* 1. Camera View / Audio Placeholder */}
      <View style={styles.cameraWrapper}>
        {mode === 'photo' && (
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={type}
            ratio="16:9" 
          >
            {isCapturing && (
              <View style={styles.overlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.overlayText}>Processing Photo...</Text>
              </View>
            )}
          </Camera>
        )}
        
        {mode === 'audio' && (
          <View style={[styles.camera, styles.audioMode]}>
            <MaterialIcons 
                name={isRecording ? "keyboard-voice" : "mic-none"} 
                size={120} 
                color={isRecording ? DANGER_COLOR : "#ddd"} 
            />
            <Text style={styles.audioModeText}>
              {isRecording ? 'RECORDING... (Tap STOP below)' : 'Tap the button below to start voice report.'}
            </Text>
          </View>
        )}
      </View>
      
      {/* 2. Controls */}
      <View style={styles.controlsContainer}>
        
        {/* Toggle Mode Button */}
        <TouchableOpacity style={styles.modeToggle} onPress={toggleMode} disabled={isRecording || isCapturing}>
          <FontAwesome5 
            name={mode === 'photo' ? "microphone-alt" : "camera"} 
            size={24} 
            color={isRecording || isCapturing ? "#ccc" : PRIMARY_COLOR}
          />
          <Text style={{color: isRecording || isCapturing ? "#ccc" : PRIMARY_COLOR, fontSize: 12}}>
            {mode === 'photo' ? 'Switch to Voice' : 'Switch to Camera'}
          </Text>
        </TouchableOpacity>

        {/* Capture/Record Button */}
        <TouchableOpacity
          style={[
            styles.captureButton, 
            isCapturing && { backgroundColor: '#ccc' },
            isRecording && { backgroundColor: DANGER_COLOR }
          ]}
          onPress={captureAction}
          disabled={isCapturing || (mode === 'photo' && isRecording)}
        >
          {isCapturing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <FontAwesome5 
              name={mode === 'photo' ? "camera" : (isRecording ? "stop" : "microphone")} 
              size={30} 
              color={mode === 'photo' ? "#fff" : (isRecording ? "#fff" : PRIMARY_COLOR)}
            />
          )}
        </TouchableOpacity>
        
        {/* Location Status */}
        <View style={styles.locationStatus}>
          <MaterialIcons 
            name="location-on" 
            size={20} 
            color={location ? '#28A745' : DANGER_COLOR} 
          />
          <Text style={styles.locationText}>
            {location ? 'Location Ready' : 'Fetching Location...'}
          </Text>
        </View>

      </View>
      
      {/* Footer */}
      <Text style={styles.footerText}>
        AI-powered classification and priority scoring ensures faster action.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: PRIMARY_COLOR,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  cameraWrapper: {
    width: '100%',
    height: CAMERA_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  audioMode: {
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
  },
  audioModeText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    marginTop: 10,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modeToggle: {
    alignItems: 'center',
    padding: 5,
  },
  locationStatus: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 'auto',
  },
});

export default CameraScreen;