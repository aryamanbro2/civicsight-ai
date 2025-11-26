// Frontend/src/screens/MapScreen.tsx

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import {
 
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import{
   useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Asset } from "expo-asset";
import { Ionicons } from "@expo/vector-icons";
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
  const webViewRef = useRef<WebView>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [mapHtmlUri, setMapHtmlUri] = useState<string | null>(null);

  // Load HTML asset (Fix for APK build)
  useEffect(() => {
    const loadMapHTML = async () => {
      try {
        const asset = Asset.fromModule(require("../../assets/map.html"));
        await asset.downloadAsync();
        setMapHtmlUri(asset.localUri || asset.uri);
      } catch (err) {
        console.error("Failed to load map.html:", err);
        Alert.alert("Error", "Unable to load map view.");
      }
    };

    loadMapHTML();
  }, []);

  const sendMarkersToWebView = (validReports: Report[]) => {
    const markerData = validReports.map((r) => ({
      id: r.id,
      lat: r.location.coordinates[1],
      lng: r.location.coordinates[0],
      priority: r.severityScore,
    }));

    webViewRef.current?.injectJavaScript(`
      if (window.addMarkers) {
        window.addMarkers(${JSON.stringify(markerData)});
      }
      true;
    `);
  };

  const fetchAllReports = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getAllReports();

      const validReports = response.reports.filter(
        (r: Report) =>
          r.location?.coordinates &&
          r.location.coordinates.length === 2 &&
          typeof r.location.coordinates[0] === "number"
      );

      setReports(validReports);

      // Send markers once WebView loads
      setTimeout(() => sendMarkersToWebView(validReports), 700);
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

  return (
    <View style={[styles.outerContainer, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Report Map</Text>
        <Ionicons name="map-outline" size={30} color={DARK_COLORS.PRIMARY} />
      </View>

      {/* 🔥 WebView Map */}
      <View style={styles.mapContainer}>
        {mapHtmlUri ? (
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ uri: mapHtmlUri }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            allowFileAccess
            allowUniversalAccessFromFileURLs
            onLoadEnd={() => sendMarkersToWebView(reports)}
            onMessage={(event) => {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === "marker_press") {
                const report = reports.find((r) => r.id === data.reportId);
                setSelectedReport(report || null);
              }
            }}
          />
        ) : (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={DARK_COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Preparing map...</Text>
          </View>
        )}
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
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
                size={26}
                color={DARK_COLORS.SECONDARY_TEXT}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: DARK_COLORS.BACKGROUND,
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
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
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
