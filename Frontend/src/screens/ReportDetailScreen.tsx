import React from 'react';
// CHANGED: Import SafeAreaView from 'react-native-safe-area-context'
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Report } from '../services/reportService'; 

// Get screen width for full image display
const { width } = Dimensions.get('window');

// --- DARK THEME & CONSTANTS (Must match Dashboard) ---
const DARK_COLORS = {
  BACKGROUND: '#121212', 
  CARD: '#1E1E1E',       
  PRIMARY: '#BB86FC',    
  ACCENT: '#03DAC6',     
  TEXT: '#E0E0E0',       
  SECONDARY_TEXT: '#B0B0B0', 
  BORDER: '#333333',     
};

// Define Route Params
type ReportDetailRouteParams = {
  report: Report;
};

type RootStackParamList = {
  ReportDetail: ReportDetailRouteParams;
};

type ReportDetailScreenRouteProp = RouteProp<RootStackParamList, 'ReportDetail'>;

// Function to determine colors based on AI's priority score
const getPriorityColor = (priority: Report['priority']) => {
  switch (priority) {
    case 'high': return '#CF6679'; 
    case 'medium': return '#FFB300'; 
    case 'low': 
    default: return '#03DAC6'; 
  }
};

const ReportDetailScreen = () => {
  const route = useRoute<ReportDetailScreenRouteProp>();
  const { report } = route.params;

  const statusColor = report.status === 'completed' 
    ? DARK_COLORS.ACCENT
    : report.status === 'in_progress' 
    ? DARK_COLORS.PRIMARY
    : '#B0B0B0';
  
  const priorityColor = getPriorityColor(report.priority);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        
        {/* Image Display (if it exists) */}
        {report.imageUrl && (
          <Image 
            source={{ uri: report.imageUrl }} 
            style={styles.fullImage} 
            resizeMode="cover"
          />
        )}

        {/* Audio Display (if it exists) */}
        {report.audioUrl && (
            <View style={[
              styles.audioPlaceholder, 
              report.imageUrl ? styles.audioWithImage : styles.audioOnly
            ]}>
                <Ionicons name="mic-circle-outline" size={80} color={DARK_COLORS.PRIMARY} />
                <Text style={styles.audioText}>Audio Report Playback</Text>
                <Text style={styles.audioSubText}>
                  {/* TODO: Implement audio playback on press */}
                  Media URL: {report.audioUrl.substring(0, 40)}...
                </Text>
            </View>
        )}

        {/* Fallback (if neither exists) */}
        {!report.imageUrl && !report.audioUrl && (
           <View style={[styles.audioPlaceholder, styles.audioOnly]}>
              <Ionicons name="alert-circle-outline" size={80} color={DARK_COLORS.SECONDARY_TEXT} />
              <Text style={styles.audioText}>No Media Found</Text>
           </View>
        )}


        <View style={styles.content}>
          <Text style={styles.issueType}>{report.issueType.toUpperCase()}</Text>
          
          {/* Status and Priority Badges */}
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: statusColor }]}>
              <Text style={styles.badgeText}>STATUS: {report.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: priorityColor, marginLeft: 10 }]}>
              <Text style={styles.badgeText}>PRIORITY: {report.priority.toUpperCase()}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}><Ionicons name="document-text-outline" size={18} color={DARK_COLORS.TEXT} /> Description</Text>
            <Text style={styles.detailText}>{report.description}</Text>
          </View>

          {/* Location */}
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}><Ionicons name="location-outline" size={18} color={DARK_COLORS.TEXT} /> Location</Text>
            <Text style={styles.detailText}>{report.location.address || 'Address Not Available'}</Text>
            <Text style={styles.subDetailText}>
              Coordinates: {report.location.coordinates[1]}, {report.location.coordinates[0]}
            </Text>
            <Text style={styles.subDetailText}>
              {report.location.city}, {report.location.state} {report.location.zipCode}
            </Text>
          </View>

          {/* Metadata */}
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}><Ionicons name="information-circle-outline" size={18} color={DARK_COLORS.TEXT} /> AI Metadata</Text>
            <Text style={styles.subDetailText}>Reported: {new Date(report.createdAt).toLocaleDateString()}</Text>
            <Text style={styles.subDetailText}>Severity Score: {report.severityScore}</Text>
            <Text style={styles.subDetailText}>Tags: {report.aiMetadata?.tags?.join(', ') || 'N/A'}</Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  fullImage: {
    width: width,
    height: width * 0.6, // 60% of screen width
  },
  audioPlaceholder: {
    width: width,
    backgroundColor: DARK_COLORS.CARD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Style for Audio-Only reports
  audioOnly: {
    height: width * 0.6,
    borderBottomWidth: 1,
    borderBottomColor: DARK_COLORS.BORDER,
  },
  // Style for Audio when an Image is also present (stacks below)
  audioWithImage: {
    height: 'auto', // Auto height
    paddingVertical: 30, // Give it padding
    borderTopWidth: 1, // Add separator
    borderTopColor: DARK_COLORS.BORDER,
  },
  audioText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_COLORS.PRIMARY,
    marginTop: 10,
  },
  audioSubText: {
    fontSize: 12,
    color: DARK_COLORS.SECONDARY_TEXT,
    marginTop: 5,
  },
  content: {
    padding: 15,
  },
  issueType: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DARK_COLORS.TEXT,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: DARK_COLORS.BORDER,
    paddingBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: DARK_COLORS.BACKGROUND,
  },
  detailCard: {
    backgroundColor: DARK_COLORS.CARD,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: DARK_COLORS.PRIMARY,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK_COLORS.TEXT,
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: DARK_COLORS.SECONDARY_TEXT,
    lineHeight: 24,
  },
  subDetailText: {
    fontSize: 13,
    color: DARK_COLORS.SECONDARY_TEXT,
    marginTop: 5,
  },
});

export default ReportDetailScreen;