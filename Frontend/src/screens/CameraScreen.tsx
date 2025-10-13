import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Dimensions,
    StatusBar,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface CameraScreenProps {
    onCapture: (imageUri: string, location: any) => void;
    onClose: () => void;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ onCapture, onClose }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('back');
    const [isRecording, setIsRecording] = useState(false);
    const [location, setLocation] = useState<any>(null);
    const cameraRef = useRef<CameraView>(null);

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
        getLocationPermissions();
    }, []);

    const getLocationPermissions = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is required for reporting issues');
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({});
            const address = await Location.reverseGeocodeAsync({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            });

            setLocation({
                coords: currentLocation.coords,
                address: address[0],
            });
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                setIsRecording(true);
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                });

                if (photo) {
                    setTimeout(() => setIsRecording(false), 200);
                    onCapture(photo.uri, location);
                }
            } catch (error) {
                setIsRecording(false);
                Alert.alert('Error', 'Failed to take picture');
            }
        }
    };

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report an Issue</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Camera View */}
            <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
                <View style={styles.overlay}>
                    {/* Capture Frame */}
                    <View style={styles.captureFrame} />
                </View>
            </CameraView>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
                <TouchableOpacity style={styles.controlButton}>
                    <Ionicons name="flash" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.captureButton, isRecording && styles.captureButtonActive]}
                    onPress={takePicture}
                    disabled={isRecording}
                >
                    <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
                    <Ionicons name="camera-reverse" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    permissionText: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
        marginBottom: 20,
    },
    permissionButton: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    placeholder: {
        width: 40,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureFrame: {
        width: width - 60,
        height: width - 60,
        borderWidth: 2,
        borderColor: 'white',
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    bottomControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        paddingBottom: 40,
        paddingTop: 20,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    controlButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureButtonActive: {
        backgroundColor: '#8B5CF6',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#8B5CF6',
    },
    text: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
        marginTop: 100,
    },
});

export default CameraScreen;