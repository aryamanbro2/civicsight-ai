import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
// CHANGED: We don't need MediaType from here
import * as ImagePicker from 'expo-image-picker';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// --- Types ---
type RootStackParamList = {
  IssueForm: { imageUri: string };
};
type CameraNavigationProp = NativeStackNavigationProp<RootStackParamList, 'IssueForm'>;

// --- Constants ---
const DARK_COLORS = {
  BACKGROUND: '#000000', 
  TEXT: '#FFFFFF',       
  PRIMARY: '#BB86FC',    
  SECONDARY_ICON: '#B0B0B0',
};

const CameraScreen = () => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [type, setType] = useState('back'); 
  const cameraRef = useRef<CameraView | null>(null);
  const navigation = useNavigation<CameraNavigationProp>();

  // --- 1. Request Permissions ---
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus === 'granted');

      if (Platform.OS !== 'web') {
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryStatus !== 'granted') {
          Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to allow uploads.');
        }
      }
    })();
  }, []);

  // --- 2. Take Picture Logic ---
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
        });
        if (photo) {
          navigation.navigate('IssueForm', { imageUri: photo.uri });
        } else {
          Alert.alert('Error', 'Could not capture picture.');
        }
      } catch (error) {
        console.error('Failed to take picture:', error);
        Alert.alert('Error', 'Could not take picture.');
      }
    }
  };

  // --- 3. Pick Image Logic ---
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        // CRITICAL FIX: The prop now takes an array of strings, not an enum.
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        navigation.navigate('IssueForm', { imageUri: result.assets[0].uri });
      }
    } catch (error) {
        console.error('Failed to pick image:', error);
        Alert.alert('Error', 'Could not load image from gallery.');
    }
  };

  // --- 4. Flip Camera Logic ---
  const flipCamera = () => {
    setType(current => (current === 'back' ? 'front' : 'back'));
  };

  // --- 5. Render Logic ---
  if (hasCameraPermission === null) {
    return <View style={styles.container} />; // Loading state
  }
  if (hasCameraPermission === false) {
    return (
        <View style={styles.container}>
            <Text style={styles.permissionText}>No access to camera</Text>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={StyleSheet.absoluteFillObject} 
        facing={type as any} 
        ref={cameraRef} 
      />
        
      <View style={styles.topControls}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={35} color={DARK_COLORS.TEXT} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
          <Ionicons name="image-outline" size={30} color={DARK_COLORS.SECONDARY_ICON} />
        </TouchableOpacity>

        <TouchableOpacity onPress={takePicture} style={styles.shutterButton}>
          <View style={styles.shutterButtonInner} />
        </TouchableOpacity>

        <TouchableOpacity onPress={flipCamera} style={styles.iconButton}>
          <Ionicons name="camera-reverse-outline" size={30} color={DARK_COLORS.SECONDARY_ICON} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_COLORS.BACKGROUND,
    justifyContent: 'space-between',
  },
  permissionText: {
    color: DARK_COLORS.TEXT,
    fontSize: 18,
    textAlign: 'center',
    marginTop: '50%',
  },
  topControls: {
    paddingTop: (Platform.OS === 'android' ? 20 : 50),
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: (Platform.OS === 'android' ? 20 : 40),
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', // Semi-transparent bar
    zIndex: 1,
  },
  shutterButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: DARK_COLORS.TEXT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: DARK_COLORS.BACKGROUND,
  },
  shutterButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: DARK_COLORS.TEXT,
    borderWidth: 2,
    borderColor: DARK_COLORS.BACKGROUND,
  },
  iconButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CameraScreen;