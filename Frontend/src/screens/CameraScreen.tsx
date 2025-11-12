import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
// FIX: Remove CameraType import, it's just a string literal.
// Import Camera for static permission methods, and CameraView for the component.
import { Camera, CameraView } from 'expo-camera';
// FIX: Import LocationObject type correctly
import * as Location from 'expo-location';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';

// --- Type Definitions ---
interface CameraScreenProps {
  onCapture: (mediaUri: string, location: Location.LocationObject | null) => void;
  onClose: () => void;
}

const { width } = Dimensions.get('window');
const CAMERA_SIZE = width;
const PRIMARY_COLOR = '#007AFF';
const DANGER_COLOR = '#FF3B30';

const CameraScreen = ({ onCapture, onClose }: CameraScreenProps) => {
  // FIX: The ref should be for the CameraView component
  const cameraRef = useRef<CameraView | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  // FIX: Use string literal type and 'back' as default string value
  const [type, setType] = useState<'front' | 'back'>('back');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  // --- Permission Handlers ---
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      // FIX: Removed the stray underscore that caused the syntax error
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

      const allGranted = cameraStatus === 'granted' && locationStatus === 'granted';

      if (!allGranted) {
        Alert.alert('Permissions Required', 'Camera and location permissions are essential.');
        setHasPermission(false);
        return;
      }
      setHasPermission(true);

      try {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Location Error', 'Could not fetch location. Using null.');
      }
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
        });

        if (photo && photo.uri) {
          onCapture(photo.uri, location);
        } else {
          throw new Error('Photo capture returned null or no URI');
        }
      } catch (error) {
        console.error('Photo capture failed:', error);
        Alert.alert('Error', 'Failed to capture photo.');
      } finally {
        setIsCapturing(false);
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

  return (
    <View style={styles.container}>
      {/* FIX: Use CameraView and the `facing` prop */}
      <CameraView ref={cameraRef} style={styles.camera} facing={type} ratio="16:9">
        {isCapturing && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.overlayText}>Processing Photo...</Text>
          </View>
        )}
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
      </CameraView>

      {/* 2. Controls */}
      <View style={styles.controlsContainer}>
        {/* Location Status */}
        <View style={styles.controlItem}>
          <MaterialIcons name="location-on" size={24} color={location ? '#28A745' : DANGER_COLOR} />
          <Text style={styles.locationText}>{location ? 'Location Ready' : 'No Location'}</Text>
        </View>

        {/* Capture/Record Button */}
        <TouchableOpacity
          style={[styles.captureButton, isCapturing && { backgroundColor: '#ccc' }]}
          onPress={takePicture}
          disabled={isCapturing}>
          <FontAwesome5 name="camera" size={30} color="#fff" />
        </TouchableOpacity>

        {/* Toggle Camera Button */}
        <TouchableOpacity
          style={styles.controlItem}
          onPress={() => {
            // FIX: Use string literals for toggling
            setType(type === 'back' ? 'front' : 'back');
          }}>
          <MaterialIcons name="flip-camera-ios" size={24} color="white" />
          <Text style={styles.locationText}>Flip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: PRIMARY_COLOR,
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
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
  closeButton: {
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
  controlsContainer: {
    height: 120,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingBottom: 20,
  },
  controlItem: {
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  locationText: {
    fontSize: 12,
    color: 'white',
    marginTop: 4,
  },
});

export default CameraScreen;