// Frontend/src/screens/MapScreen.tsx

import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";

import { getAllReports, Report } from "../services/reportService";

const DARK_COLORS = {
  BACKGROUND: "#121212",
  CARD: "#1E1E1E",
  PRIMARY: "#BB86FC",
  TEXT: "#FFFFFF",
  SECONDARY_TEXT: "#B0B0B0",
  BORDER: "#333333",
};

type RootStackParamList = {
  AppTabs: undefined;
  ReportDetail: { report: Report };
};

type MapNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AppTabs"
>;

const MapScreen = () => {
  const navigation = useNavigation<MapNavigationProp>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const fetchAllReports = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getAllReports();

      const validReports = response.reports.filter((r: Report) => {
        const coords = r.location?.coordinates;
        return (
          coords &&
          Array.isArray(coords) &&
          coords.length === 2 &&
          typeof coords[0] === "number" &&
          typeof coords[1] === "number"
        );
      });

      setReports(validReports);

      if (validReports.length > 0 && mapRef.current) {
        const coordsList = validReports.map((r) => ({
          latitude: r.location.coordinates[1],
          longitude: r.location.coordinates[0],
        }));

        mapRef.current.fitToCoordinates(coordsList, {
          edgePadding: { top: 50, right: 50, bottom: 150, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.log("Failed to fetch reports:", error);
      Alert.alert("Error", "Unable to load reports.");
    }

    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllReports();
    }, [])
  );

  const defaultInitialRegion = {
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 8,
    longitudeDelta: 8,
  };

  const handleMarkerPress = (report: Report) => {
    setSelectedReport(report);
  };

  return (
    <View style={[styles.outerContainer, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Report Map</Text>
        <Ionicons name="map-outline" size={30} color={DARK_COLORS.PRIMARY} />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={defaultInitialRegion}
          onPress={() => setSelectedReport(null)}
        >
          {reports.map((report) => {
            const coords = report.location.coordinates;
            if (!coords || coords.length !== 2) return null;

            return (
              <Marker
                key={report.id}
                coordinate={{
                  latitude: coords[1],
                  longitude: coords[0],
                }}
                pinColor={
                  report.priority === "high"
                    ? "#FF6B6B"
                    : report.priority === "medium"
                    ? "#FFD93D"
                    : "#03DAC6"
                }
                onPress={() => handleMarkerPress(report)}
              />
            );
          })}
        </MapView>

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={DARK_COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        )}

        {/* Selected Report Card */}
        {selectedReport && (
          <View style={styles.cardContainer}>
            <View style={styles.selectedCard}>
              {selectedReport.imageUrl ? (
                <Image
                  source={{ uri: selectedReport.imageUrl }}
                  style={styles.cardImage}
                />
              ) : (
                <View style={[styles.cardImage, styles.audioPlaceholder]}>
                  <Ionicons
                    name="mic-outline"
                    size={40}
                    color={DARK_COLORS.SECONDARY_TEXT}
                  />
                </View>
              )}

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{selectedReport.issueType}</Text>
                <Text style={styles.cardLocation}>
                  {selectedReport.location.address}
                </Text>

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() =>
                    navigation.navigate("ReportDetail", {
                      report: selectedReport,
                    })
                  }
                >
                  <Text style={styles.detailsButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedReport(null)}
              >
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={DARK_COLORS.SECONDARY_TEXT}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: DARK_COLORS.BACKGROUND,
  },
  mapContainer: {
    flex: 1,
  },
  headerContainer: {
    padding: 15,
    backgroundColor: DARK_COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: DARK_COLORS.BORDER,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: DARK_COLORS.TEXT,
    fontSize: 22,
    fontWeight: "bold",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  loadingText: {
    marginTop: 10,
    color: DARK_COLORS.TEXT,
  },
  cardContainer: {
    position: "absolute",
    bottom: 20,
    left: 15,
    right: 15,
  },
  selectedCard: {
    flexDirection: "row",
    backgroundColor: DARK_COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DARK_COLORS.BORDER,
    overflow: "hidden",
  },
  cardImage: {
    width: 100,
    height: 120,
  },
  audioPlaceholder: {
    backgroundColor: DARK_COLORS.BORDER,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    padding: 10,
  },
  cardTitle: {
    color: DARK_COLORS.TEXT,
    fontSize: 18,
    fontWeight: "bold",
  },
  cardLocation: {
    color: DARK_COLORS.SECONDARY_TEXT,
    fontSize: 12,
    marginVertical: 6,
  },
  detailsButton: {
    backgroundColor: DARK_COLORS.PRIMARY,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 5,
  },
  detailsButtonText: {
    color: DARK_COLORS.BACKGROUND,
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    top: 5,
    right: 5,
  },
});

export default MapScreen;
