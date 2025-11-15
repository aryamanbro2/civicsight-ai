import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMyReports, Report } from '../services/reportService';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; // --- NEW IMPORT ---

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
const TAB_BAR_HEIGHT_ESTIMATE = 60; 
const TAB_BAR_BOTTOM_CLEARANCE = 0; 

// --- Reusable components ---
const getPriorityColor = (priority: Report['priority']) => {
  switch (priority) {
    case 'high': return '#CF6679'; 
    case 'medium': return '#FFB300'; 
    case 'low': 
    default: return '#03DAC6';
  }
};

const ReportCard = ({ report, onPress }: { report: Report, onPress: () => void }) => {
  const statusColor = report.status === 'completed' ? DARK_COLORS.ACCENT : report.status === 'in_progress' ? DARK_COLORS.PRIMARY : '#B0B0B0'; 
  const priorityColor = getPriorityColor(report.priority);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.card, { borderLeftColor: priorityColor }]}>
        {report.imageUrl ? (
          <Image source={{ uri: report.imageUrl }} style={styles.cardImagePeek} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImagePeek, styles.audioPeek]}>
            <Ionicons name="mic-outline" size={40} color={DARK_COLORS.SECONDARY_TEXT} />
            <Text style={styles.audioPeekText}>Audio Report</Text>
          </View>
        )}
        <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIssueType} numberOfLines={1}>{report.issueType.toUpperCase()}</Text>
              <View style={[styles.priorityTag, { backgroundColor: priorityColor }]}>
                <Text style={styles.priorityText}>{report.priority.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {report.description || `[Media report. Tap for details.]`}
            </Text>
            <View style={styles.cardFooter}>
              <View style={styles.cardLocationContainer}>
                <Ionicons name="location-outline" size={14} color={DARK_COLORS.SECONDARY_TEXT} />
                <Text style={styles.cardLocation} numberOfLines={1}>
                  {report.location.address || 'Unknown Location'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{report.status.replace('_', ' ').toUpperCase()}</Text>
              </View>
            </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const FeaturedReportCard = ({ report, onPress }: { report: Report, onPress: () => void }) => {
  const priorityColor = getPriorityColor(report.priority);
  const fallbackImage = !report.imageUrl;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.featuredCard}>
      <ImageBackground
        source={report.imageUrl ? { uri: report.imageUrl } : undefined}
        style={[styles.featuredImage, fallbackImage && styles.audioPeek]}
        resizeMode="cover"
      >
        {fallbackImage && (
          <Ionicons name="mic-outline" size={60} color={DARK_COLORS.SECONDARY_TEXT} />
        )}
        <View style={styles.featuredOverlay}>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {report.issueType.toUpperCase()}
          </Text>
          <View style={[styles.priorityTag, { backgroundColor: priorityColor }]}>
            <Text style={styles.priorityText}>{report.priority.toUpperCase()}</Text>
          </View>
        </View>
      </ImageBackground>
      <View style={styles.featuredContent}>
        <Text style={styles.featuredDescription} numberOfLines={2}>
          {report.description}
        </Text>
        <View style={styles.cardFooter}>
            <View style={styles.cardLocationContainer}>
              <Ionicons name="location-outline" size={14} color={DARK_COLORS.SECONDARY_TEXT} />
              <Text style={styles.cardLocation} numberOfLines={1}>
                {report.location.address || 'Unknown Location'}
              </Text>
            </View>
          </View>
      </View>
    </TouchableOpacity>
  );
};


type RootStackParamList = {
  AppTabs: undefined; 
  ReportDetail: { report: Report }; 
  CameraScreen: undefined;
};
type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AppTabs'>;


// --- DashboardScreen Component (My Reports) ---
const DashboardScreen = () => {
  const navigation = useNavigation<DashboardNavigationProp>(); 
  const [latestReport, setLatestReport] = useState<Report | null>(null);
  const [otherReports, setOtherReports] = useState<Report[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isLoading: isAuthLoading, signOut } = useAuth();
 
  
  const insets = useSafeAreaInsets();
  
  const fetchMyReports = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await getMyReports();
      setLatestReport(response.reports[0] || null);
      setOtherReports(response.reports.slice(1));

    } catch (error: any) {
      console.error('Error loading reports:', error.message); 
      
      // 3. Make the check less specific to catch all auth errors
      if (error.message.includes('Token') || error.message.includes('Authentication') || error.message.includes('User not found')) {
        Alert.alert(
          'Session Expired',
          'You have been logged out. Please sign in again.',
          // 4. Add the signOut call on "OK"
          [ { text: 'OK', onPress: () => signOut() } ]
        );
      } else {
        // Show a generic error for other issues
        Alert.alert('Error', 'Could not load your reports. Please pull to refresh.');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [signOut]);

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={50} color={DARK_COLORS.SECONDARY_TEXT} />
      <Text style={styles.emptyText}>No issues reported yet.</Text>
      <Text style={styles.emptyTextSub}>Use the '+' button to file your first AI-powered report!</Text>
    </View>
  );

  useFocusEffect(
    useCallback(() => {
      // --- CRITICAL FIX: Do not fetch if auth is still loading/logging in ---
      if (!isAuthLoading) {
        fetchMyReports();
      }
      return () => {};
    }, [isAuthLoading, fetchMyReports]) // Run effect when isAuthLoading changes
  );

  const handleCardPress = (report: Report) => {
      navigation.navigate('ReportDetail', { report: report }); 
  };

  const renderHeader = () => (
    <>
      {latestReport && (
        <>
          <Text style={styles.sectionTitle}>Latest Report</Text>
          <FeaturedReportCard report={latestReport} onPress={() => handleCardPress(latestReport)} />
        </>
      )}
      {otherReports.length > 0 && (
        <Text style={styles.sectionTitle}>Other Reports</Text>
      )}
    </>
  );

  // CHANGED: Use isAuthLoading for the main loading spinner
  if (isAuthLoading && !isRefreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={DARK_COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Fetching reports...</Text>
      </View>
    );
  }

  if (!latestReport && otherReports.length === 0) {
    return (
        <View style={[styles.outerContainer, { paddingTop: insets.top }]}>
           <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>My Reports</Text>
            <Ionicons name="person-circle-outline" size={32} color={DARK_COLORS.PRIMARY} />
          </View>
          {renderEmptyList()}
        </View>
    );
  }

  return (
    <View style={[styles.outerContainer, { paddingTop: insets.top }]}> 
      <View style={styles.innerContentWrapper}> 
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>My Reports</Text>
          <Ionicons name="person-circle-outline" size={32} color={DARK_COLORS.PRIMARY} />
        </View>
        
        <FlatList
          data={otherReports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReportCard report={item} onPress={() => handleCardPress(item)} />}
          ListHeaderComponent={renderHeader}
          onRefresh={() => fetchMyReports()} 
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ bottom: TAB_BAR_HEIGHT_ESTIMATE + insets.bottom }}
          contentContainerStyle={styles.listContentContainer}
        />
      </View>
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: DARK_COLORS.CARD },
  innerContentWrapper: { flex: 1, backgroundColor: DARK_COLORS.BACKGROUND },
  listContentContainer: {
    paddingBottom: TAB_BAR_HEIGHT_ESTIMATE + TAB_BAR_BOTTOM_CLEARANCE + 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DARK_COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: DARK_COLORS.SECONDARY_TEXT,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: DARK_COLORS.CARD, 
    borderBottomWidth: 1,
    borderBottomColor: DARK_COLORS.BORDER,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK_COLORS.TEXT,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_COLORS.TEXT,
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  featuredCard: {
    backgroundColor: DARK_COLORS.CARD,
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  featuredImage: {
    height: 200,
    width: '100%',
    justifyContent: 'flex-end',
  },
  featuredOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_COLORS.TEXT,
    flex: 1,
  },
  featuredContent: {
    padding: 12,
  },
  featuredDescription: {
    fontSize: 14,
    color: DARK_COLORS.SECONDARY_TEXT,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: DARK_COLORS.CARD,
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 15,
    overflow: 'hidden',
    borderLeftWidth: 6, 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: DARK_COLORS.BORDER,
  },
  cardImagePeek: {
    width: 100, 
  },
  audioPeek: {
    backgroundColor: DARK_COLORS.BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  audioPeekText: {
    color: DARK_COLORS.SECONDARY_TEXT,
    fontSize: 10,
    marginTop: 5,
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  cardIssueType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DARK_COLORS.TEXT,
    flexShrink: 1,
    marginRight: 10,
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 15,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: DARK_COLORS.BACKGROUND,
  },
  cardDescription: {
    fontSize: 13,
    color: DARK_COLORS.SECONDARY_TEXT,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: DARK_COLORS.BORDER,
    paddingTop: 8,
  },
  cardLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  cardLocation: {
    fontSize: 11,
    color: DARK_COLORS.SECONDARY_TEXT,
    marginLeft: 5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: DARK_COLORS.BACKGROUND,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 18,
    color: DARK_COLORS.SECONDARY_TEXT,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyTextSub: {
    fontSize: 14,
    color: DARK_COLORS.SECONDARY_TEXT,
    opacity: 0.7,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default DashboardScreen;