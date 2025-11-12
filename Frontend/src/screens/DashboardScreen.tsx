import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { reportService, Report } from '../services/reportService';
import CameraScreen from './CameraScreen';
import IssueFormScreen from './IssueFormScreen';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  // FIX: Changed `logout` to `signOut` to match AuthContext
  const { user, signOut } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const response = await reportService.getMyReports(1, 10);
      if (response.success && response.reports) {
        setReports(response.reports);
        setStatistics(response.statistics);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // This handler is now compatible with the rewritten CameraScreen
  const handleImageCapture = (imageUri: string, location: any) => {
    setCapturedImage(imageUri);
    setCapturedLocation(location);
    setShowCamera(false);
    setShowIssueForm(true);
  };

  const handleIssueSubmit = () => {
    setShowIssueForm(false);
    setCapturedImage(null);
    setCapturedLocation(null);
    loadReports(); // Refresh the reports list
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: signOut, // FIX: Use signOut
      },
    ]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#F59E0B';
      case 'in_progress':
        return '#3B82F6';
      case 'completed':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  if (showCamera) {
    return (
      <CameraScreen
        // @ts-ignore
        onCapture={handleImageCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  if (showIssueForm && capturedImage) {
    return (
      <IssueFormScreen
        imageUri={capturedImage}
        location={capturedLocation}
        onSubmit={handleIssueSubmit}
        onClose={() => {
          setShowIssueForm(false);
          setCapturedImage(null);
          setCapturedLocation(null);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadReports} />}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}!</Text>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.profileButton}>
              <Ionicons name="person-circle" size={40} color="#8B5CF6" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Take care of the roads</Text>
          </View>
        </View>

        {/* Current Issue Card */}
        {reports.length > 0 && (
          <View style={styles.currentIssueCard}>
            <View style={styles.issueHeader}>
              <View>
                <Text style={styles.issueTitle}>{reports[0].issueType}</Text>
                <Text style={styles.issueNumber}>Issue #{reports[0].id.slice(-6)}</Text>
              </View>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(reports[0].priority) },
                ]}>
                <Text style={styles.priorityText}>{reports[0].priority}</Text>
              </View>
            </View>

            <View style={styles.statusContainer}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Pending</Text>
                <Text style={styles.statusTime}>
                  {new Date(reports[0].submittedAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>In progress</Text>
                <Text style={styles.statusTime}>--</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Completed</Text>
                <Text style={styles.statusTime}>--</Text>
              </View>
            </View>
          </View>
        )}

        {/* Reports from others */}
        <View style={styles.reportsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reports from others</Text>
            <TouchableOpacity>
              <Text style={styles.showMoreText}>Show more</Text>
            </TouchableOpacity>
          </View>

          {reports.slice(1).map((report) => (
            <View key={report.id} style={styles.reportItem}>
              <View style={styles.reportInfo}>
                <View
                  style={[
                    styles.reportDot,
                    { backgroundColor: getPriorityColor(report.priority) },
                  ]}
                />
                <View style={styles.reportDetails}>
                  <Text style={styles.reportTitle}>{report.issueType}</Text>
                  <Text style={styles.reportLocation}>
                    {report.fullAddress || 'Unknown location'}
                  </Text>
                </View>
              </View>
              <Text style={styles.reportDistance}>
                {(Math.random() * 2).toFixed(1)}km
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCamera(true)}>
        <Ionicons name="camera" size={28} color="white" />
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#8B5CF6" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="document-text" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>My reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="map" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="settings" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
// ... (Your existing styles for DashboardScreen.tsx) ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginTop: 4,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  currentIssueCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  issueTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  issueNumber: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statusTime: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  reportsSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  showMoreText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 16,
  },
  reportDetails: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  reportLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  reportDistance: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#8B5CF6',
  },
});

export default DashboardScreen;