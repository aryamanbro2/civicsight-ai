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
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App'; // Import types from App.tsx

// This is the full location data we need
export interface CapturedLocation {
  coords: Location.LocationObjectCoords;
  address: Location.LocationGeocodedAddress | null;
}

// --- Type definitions for navigation ---
type CameraScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Camera'
>;

interface CameraScreenProps {
  navigation: CameraScreenNavigationProp;
  // --- REMOVED onCapture and onClose props ---
}

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#007AFF';
const DANGER_COLOR = '#FF3B30';

const CameraScreen = ({ navigation }: CameraScreenProps) => {
  const cameraRef = useRef<CameraView | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [location, setLocation] = useState<CapturedLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState('Fetching...');

  useEffect(() => {
    // ... (Permission request logic is unchanged) ...
     const requestPermissions = async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      const allGranted = cameraStatus === 'granted' && locationStatus === 'granted';

      if (!allGranted) {
        Alert.alert('Permissions Required', 'Camera and location permissions are essential.');
        setHasPermission(false);
        return;
      }
      setHasPermission(true);

      try {
        setLocationStatus('Fetching location...');
        const currentLocation = await Location.getCurrentPositionAsync({});
        
        setLocationStatus('Fetching address...');
        const geocoded = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        const capturedLocation: CapturedLocation = {
          coords: currentLocation.coords,
          address: geocoded[0] || null,
        };
        
        setLocation(capturedLocation);
        setLocationStatus('Location Ready');

      } catch (error) {
        console.error('Error getting location:', error);
        setLocationStatus('Location Error');
        Alert.alert('Location Error', 'Could not fetch location or address. Using null.');
      }
    };

    requestPermissions();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          exif: true,
        });

        if (photo && photo.uri) {
          // --- FIX: Navigate to IssueForm with the data ---
          navigation.navigate('IssueForm', {
            imageUri: photo.uri,
            location: location,
          });
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

  if (hasPermission === null || hasPermission === false) {
    // ... (Loading/Permission view is unchanged) ...
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} ratio="16:9" />

      {isCapturing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Processing Photo...</Text>
        </View>
      )}

      {/* --- FIX: Close button uses navigation.goBack() --- */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
        <Ionicons name="close" size={30} color="white" />
      </TouchableOpacity>

      <View style={styles.controlsContainer}>
        {/* ... (Controls are unchanged) ... */}
         <View style={styles.controlItem}>
          <MaterialIcons name="location-on" size={24} color={location ? '#28A745' : DANGER_COLOR} />
          <Text style={styles.locationText}>{locationStatus}</Text>
        </View>

        <TouchableOpacity
          style={[styles.captureButton, isCapturing && { backgroundColor: '#ccc' }]}
          onPress={takePicture}
          disabled={isCapturing || !location}
        >
          <FontAwesome5 name="camera" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlItem}
          onPress={() => {
            setFacing(facing === 'back' ? 'front' : 'back');
          }}>
          <MaterialIcons name="flip-camera-ios" size={24} color="white" />
          <Text style={styles.locationText}>Flip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ... (styles remain the same) ...
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
    zIndex: 10, 
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
    zIndex: 20, 
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