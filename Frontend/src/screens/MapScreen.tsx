// Frontend/src/screens/MapScreen.tsx

import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllReports, Report } from '../services/reportService';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { head } from 'node_modules/axios/index.cjs';

// --- CONSTANTS ---
const DARK_COLORS = {
  BACKGROUND: '#121212', 
  CARD: '#1E1E1E',       
  PRIMARY: '#BB86FC',    
  ACCENT: '#03DAC6',     
  TEXT: '#E0E0E0',       
  SECONDARY_TEXT: '#B0B0B0', 
  BORDER: '#333333',     
};

// Function to determine colors (Same)
const getPriorityColor = (priority: Report['priority']) => {
  switch (priority) {
    case 'high': return '#CF6679'; 
    case 'medium': return '#FFB300'; 
    case 'low': 
    default: return '#03DAC6';
  }
};

// --- Define App Route Params for Type Safety ---
type RootStackParamList = {
  AppTabs: undefined; 
  ReportDetail: { report: Report }; 
  CameraScreen: undefined;
};
type MapNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AppTabs'>;

// --- Dark Map Style JSON (Same) ---
const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "administrative.land_parcel", "stylers": [{ "visibility": "off" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "poi.park", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1b1b1b" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#373737" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
  { "featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{ "color": "#4e4e4e" }] },
  { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#3d3d3d" }] }
];


// --- Map Screen Component ---
const MapScreen = () => {
  const navigation = useNavigation<MapNavigationProp>(); 
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  
  const fetchAllReports = useCallback(async (initialLoad = false) => {
    if (initialLoad) setIsLoading(true);
    try {
      const response = await getAllReports();
      setReports(response.reports);

      if (response.reports.length > 0 && mapRef.current) {
        // --- CRITICAL FIX: Fit map to all report coordinates ---
        const coordinates = response.reports.map(report => ({
          latitude: report.location.coordinates[1],
          longitude: report.location.coordinates[0],
        }));

        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: {
            top: 50,
            right: 50,
            bottom: 150, // Add padding to avoid the bottom card
            left: 50,
          },
          animated: true,
        });
      }
      // --- END OF FIX ---

    } catch (error: any) {
      console.error('Error loading all reports:', error.message); 
      if (error.message === 'Token has expired. Please sign in again.') {
        Alert.alert('Session Expired', 'You have been logged out.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []); // Note: We leave mapRef out of dependencies

  useFocusEffect(
    useCallback(() => {
      fetchAllReports(true); 
      return () => {};
    }, [fetchAllReports])
  );

  const handleViewDetails = () => {
    if (selectedReport) {
      navigation.navigate('ReportDetail', { report: selectedReport });
      setSelectedReport(null);
    }
  };

  const handleMarkerPress = (report: Report) => {
    setSelectedReport(report);
    mapRef.current?.animateToRegion({
      latitude: report.location.coordinates[1],
      longitude: report.location.coordinates[0],
      latitudeDelta: 0.02, 
      longitudeDelta: 0.02,
    }, 300);
  };

  const handleCloseCard = () => {
    setSelectedReport(null);
  };

  // This is now just a fallback for the map's *initial* render
  const defaultInitialRegion = {
    latitude: 37.7749, // San Francisco
    longitude: -122.4194,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };


  return (
    // CHANGED: outerContainer now uses standard flex and applies safe area padding
    <View style={[styles.outerContainer, { paddingTop: insets.top }]}> 
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Report Map</Text>
        <Ionicons name="map-outline" size={32} color={DARK_COLORS.PRIMARY} />
      </View>
      
      {/* NEW: This container holds the map and all overlays */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          // CHANGED: MapView now fills the mapContainer
          style={StyleSheet.absoluteFillObject} 
          provider={PROVIDER_GOOGLE}
          customMapStyle={darkMapStyle}
          initialRegion={defaultInitialRegion} 
          onPress={handleCloseCard}
        >
          {reports.map((report) => (
            <Marker
              key={report.id}
              coordinate={{
                latitude: report.location.coordinates[1],
                longitude: report.location.coordinates[0],
              }}
              pinColor={getPriorityColor(report.priority)}
              onPress={() => handleMarkerPress(report)}
            />
          ))}
        </MapView>

        {/* MOVED: Loading overlay is now inside mapContainer */}
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={DARK_COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        )}

        {/* MOVED: Selected card is now inside mapContainer */}
        {selectedReport && (
          <View style={[styles.cardContainer, { paddingBottom: 20 }]}>
            <View style={styles.selectedCard}>
              {selectedReport.imageUrl ? (
                <Image 
                  source={{ uri: selectedReport.imageUrl }} 
                  style={styles.cardImage} 
                />
              ) : (
                <View style={[styles.cardImage, styles.audioPeek]}>
                  <Ionicons name="mic-outline" size={40} color={DARK_COLORS.SECONDARY_TEXT} />
                </View>
              )}

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{selectedReport.issueType}</Text>
                <Text style={styles.cardLocation}>{selectedReport.location.address}</Text>
                <TouchableOpacity style={styles.detailsButton} onPress={handleViewDetails}>
                  <Text style={styles.detailsButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.closeButton} onPress={handleCloseCard}>
                <Ionicons name="close-circle" size={30} color={DARK_COLORS.SECONDARY_TEXT} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: DARK_COLORS.BACKGROUND,
  },
  // NEW: This container fills the space below the header
  mapContainer: {
    flex: 1,
    overflow: 'hidden', // Ensures map stays within bounds
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Make loading semi-transparent
    zIndex: 1, // Make sure loading is on top
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: DARK_COLORS.TEXT, // Changed to white for visibility
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: DARK_COLORS.CARD, 
    borderBottomWidth: 1,
    borderBottomColor: DARK_COLORS.BORDER,
    // zIndex is no longer needed here
  },
  // --- Selected Report Card Styles ---
  cardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    zIndex: 20,
  },
  selectedCard: {
    flexDirection: 'row',
    backgroundColor: DARK_COLORS.CARD,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DARK_COLORS.BORDER,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  cardImage: {
    width: 100,
    height: '100%',
    minHeight: 120,
  },
  audioPeek: {
    backgroundColor: DARK_COLORS.BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_COLORS.TEXT,
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 12,
    color: DARK_COLORS.SECONDARY_TEXT,
    marginBottom: 10,
  },
  detailsButton: {
    backgroundColor: DARK_COLORS.PRIMARY,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: DARK_COLORS.BACKGROUND,
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: DARK_COLORS.CARD,
    borderRadius: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: DARK_COLORS.TEXT,
  },
});

export default MapScreen;