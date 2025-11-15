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
// ... other imports
import { getAllReports, Report, upvoteReport,getVerifiedReports } from '../services/reportService';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; // <-- 1. ADD THIS IMPORT

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
// REPLACE your old ReportCard with this one

const ReportCard = ({ report, onPress }: { report: Report, onPress: () => void }) => {
  const statusColor = report.status === 'completed' ? DARK_COLORS.ACCENT : report.status === 'in_progress' ? DARK_COLORS.PRIMARY : '#B0B0B0'; 
  const priorityColor = getPriorityColor(report.priority);

  // 2. GET THE CURRENT USER
  const { user } = useAuth(); 

  // 3. FIX THE UPVOTE LOGIC
  // We check if the report.upvotes array includes the CURRENT USER's ID
  const [upvoteCount, setUpvoteCount] = useState(report.upvotes?.length || 0);
  const [isUpvoted, setIsUpvoted] = useState(user ? report.upvotes?.includes(user.id) : false);
  const [isUpvoting, setIsUpvoting] = useState(false);

  const handleUpvote = async () => {
    if (isUpvoting) return;
    setIsUpvoting(true);

    // This optimistic update is still correct
    setUpvoteCount(upvoteCount + (isUpvoted ? -1 : 1));
    setIsUpvoted(!isUpvoted);

    try {
      await upvoteReport(report.id);
    } catch (error) {
      // Revert on error
      setUpvoteCount(upvoteCount);
      setIsUpvoted(isUpvoted);
      Alert.alert('Error', 'Could not save upvote.');
    } finally {
      setIsUpvoting(false);
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.card, { borderLeftColor: priorityColor }]}>
        {/* ... Card image/audio peek ... (This part is fine) */}
        {report.imageUrl ? (
          <Image source={{ uri: report.imageUrl }} style={styles.cardImagePeek} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImagePeek, styles.audioPeek]}>
            <Ionicons name="mic-outline" size={40} color={DARK_COLORS.SECONDARY_TEXT} />
            <Text style={styles.audioPeekText}>Audio Report</Text>
          </View>
        )}

        <View style={styles.cardContent}>
            {/* ... cardHeader (This part is fine) ... */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardIssueType} numberOfLines={1}>{report.issueType.toUpperCase()}</Text>
              <View style={[styles.priorityTag, { backgroundColor: priorityColor }]}>
                <Text style={styles.priorityText}>{report.priority.toUpperCase()}</Text>
              </View>
            </View>

            {/* ... cardDescription (This part is fine) ... */}
            <Text style={styles.cardDescription} numberOfLines={2}>
              {report.description || `[Media report. Tap for details.]`}
            </Text>

            {/* 4. FIX THE LAYOUT in cardFooter */}
            <View style={styles.cardFooter}>
              
              {/* This location part is correct */}
              <View style={styles.cardLocationContainer}>
                <Ionicons name="location-outline" size={14} color={DARK_COLORS.SECONDARY_TEXT} />
                <Text style={styles.cardLocation} numberOfLines={1}>
                  {report.location.address || 'Unknown Location'}
                </Text>
              </View>

              {/* This new View groups the buttons on the right, fixing the layout.
              */}
              <View style={styles.rightFooterGroup}>
                <TouchableOpacity onPress={handleUpvote} style={styles.upvoteButton}>
                  <Ionicons 
                    name={isUpvoted ? "arrow-up-circle" : "arrow-up-circle-outline"} 
                    size={20} 
                    color={isUpvoted ? DARK_COLORS.PRIMARY : DARK_COLORS.SECONDARY_TEXT} 
                  />
                  <Text style={[styles.upvoteText, isUpvoted && {color: DARK_COLORS.PRIMARY}]}>
                    {upvoteCount}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusText}>{report.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
              {/* End of layout fix */}

            </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
// Replace the entire FeaturedReportCard component with this:

const FeaturedReportCard = ({ report, onPress }: { report: Report, onPress: () => void }) => {
  const priorityColor = getPriorityColor(report.priority);
  const fallbackImage = !report.imageUrl;

  // --- Upvote Logic (This is all correct) ---
  const { user } = useAuth();
  const [upvoteCount, setUpvoteCount] = useState(report.upvotes?.length || 0);
  const [isUpvoted, setIsUpvoted] = useState(user ? report.upvotes?.includes(user.id) : false);
  const [isUpvoting, setIsUpvoting] = useState(false);

  const handleUpvote = async () => {
    if (isUpvoting) return;
    setIsUpvoting(true);

    // Optimistic UI update
    setUpvoteCount(upvoteCount + (isUpvoted ? -1 : 1));
    setIsUpvoted(!isUpvoted);

    try {
      await upvoteReport(report.id);
    } catch (error) {
      // Revert on error
      setUpvoteCount(upvoteCount);
      setIsUpvoted(isUpvoted);
      Alert.alert('Error', 'Could not save upvote.');
    } finally {
      setIsUpvoting(false);
    }
  };
  // --- End of Upvote Logic ---

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.featuredCard}>
      <ImageBackground
        source={report.imageUrl ? { uri: report.imageUrl } : undefined}
        style={[styles.featuredImage, fallbackImage && styles.audioPeek]}
        resizeMode="cover"
      >
        {/* Fallback icon for audio-only reports */}
        {fallbackImage && (
          <Ionicons name="mic-outline" size={60} color={DARK_COLORS.SECONDARY_TEXT} />
        )}

        {/* --- THIS IS THE FIX --- */}
        {/* Adding back the overlay you liked */}
        <View style={styles.featuredOverlay}>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {report.issueType.toUpperCase()}
          </Text>
          <View style={[styles.priorityTag, { backgroundColor: priorityColor }]}>
            <Text style={styles.priorityText}>{report.priority.toUpperCase()}</Text>
          </View>
        </View>
        {/* --- END OF FIX --- */}

      </ImageBackground>

      <View style={styles.featuredContent}>
        <Text style={styles.featuredDescription} numberOfLines={2}>
          {report.description}
        </Text>
        
        {/* This footer now contains both location and the upvote button */}
        <View style={styles.cardFooter}>
            <View style={styles.cardLocationContainer}>
              <Ionicons name="location-outline" size={14} color={DARK_COLORS.SECONDARY_TEXT} />
              <Text style={styles.cardLocation} numberOfLines={1}>
                {report.location.address || 'Unknown Location'}
              </Text>
            </View>

            {/* This is the upvote button from the last step */}
            <TouchableOpacity onPress={handleUpvote} style={styles.upvoteButton}>
              <Ionicons 
                name={isUpvoted ? "arrow-up-circle" : "arrow-up-circle-outline"} 
                size={20} 
                color={isUpvoted ? DARK_COLORS.PRIMARY : DARK_COLORS.SECONDARY_TEXT} 
              />
              <Text style={[styles.upvoteText, isUpvoted && {color: DARK_COLORS.PRIMARY}]}>
                {upvoteCount}
              </Text>
            </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};
// Add this new component inside FeedScreen.tsx

const VerifiedReportCard = ({ report, onPress }: { report: Report, onPress: () => void }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.verifiedCard}>
      <ImageBackground
        source={report.imageUrl ? { uri: report.imageUrl } : undefined}
        style={styles.verifiedImage}
        resizeMode="cover"
      >
        <View style={styles.verifiedOverlay}>
          <Text style={styles.verifiedText} numberOfLines={2}>{report.issueType}</Text>
          <View style={styles.verifiedUpvote}>
            <Ionicons name="arrow-up-circle" size={16} color={DARK_COLORS.TEXT} />
            <Text style={styles.verifiedUpvoteText}>{report.upvoteCount}</Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

type RootStackParamList = {
  AppTabs: undefined; 
  ReportDetail: { report: Report }; 
  CameraScreen: undefined;
};
type FeedNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AppTabs'>;


// --- FeedScreen Component ---
const FeedScreen = () => {
  const navigation = useNavigation<FeedNavigationProp>(); 
  const [latestReport, setLatestReport] = useState<Report | null>(null);
  const [otherReports, setOtherReports] = useState<Report[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [verifiedReports, setVerifiedReports] = useState<Report[]>([]);
  // CRITICAL FIX: Use the loading state from AuthContext
  const { isLoading: isAuthLoading,signOut } = useAuth();
  
  const insets = useSafeAreaInsets();
  
 const fetchAllReports = useCallback(async () => {
    setIsRefreshing(true);
    try {
     const [allReportsResponse, verifiedReportsResponse] = await Promise.all([
        getAllReports(),
        getVerifiedReports()
      ]);

      setLatestReport(allReportsResponse.reports[0] || null);
      setOtherReports(allReportsResponse.reports.slice(1));
      setVerifiedReports(verifiedReportsResponse.reports);
    } catch (error: any) {
      console.error('Error loading all reports:', error.message); 
      
      // 3. Make the check less specific
      if (error.message.includes('Token') || error.message.includes('Authentication') || error.message.includes('User not found')) {
        Alert.alert(
          'Session Expired',
          'You have been logged out. Please sign in again.',
          // 4. Add the signOut call on "OK"
          [ { text: 'OK', onPress: () => signOut() } ]
        );
      } else {
        Alert.alert('Error', 'Could not load community reports. Please pull to refresh.');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [signOut]);
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="earth-outline" size={50} color={DARK_COLORS.SECONDARY_TEXT} />
      <Text style={styles.emptyText}>No community reports found.</Text>
      <Text style={styles.emptyTextSub}>Be the first to report an issue in your area!</Text>
    </View>
  );

  useFocusEffect(
    useCallback(() => {
      // CRITICAL FIX: Do not fetch if auth is still loading/logging in
      if (!isAuthLoading) {
        fetchAllReports();
      }
      return () => {};
    }, [isAuthLoading, fetchAllReports]) // Run effect when isAuthLoading changes
  );

  const handleCardPress = (report: Report) => {
      navigation.navigate('ReportDetail', { report: report }); 
  };

  const renderHeader = () => (
    <>
      {verifiedReports.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Verified Reports</Text>
          <FlatList
            data={verifiedReports}
            renderItem={({ item }) => (
              <VerifiedReportCard 
                report={item} 
                onPress={() => handleCardPress(item)} 
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 15, paddingBottom: 10 }} // Add padding
          />
        </>
      )}
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

  // Use isAuthLoading for the main loading spinner
  if (isAuthLoading && !isRefreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={DARK_COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Fetching community feed...</Text>
      </View>
    );
  }

  // This is the part you are seeing, because the fetch fails
  if (!latestReport && otherReports.length === 0) {
    return (
        <View style={[styles.outerContainer, { paddingTop: insets.top }]}>
           <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Community Feed</Text>
            <Ionicons name="earth-outline" size={32} color={DARK_COLORS.PRIMARY} />
          </View>
          {renderEmptyList()}
        </View>
    );
  }

  return (
    <View style={[styles.outerContainer, { paddingTop: insets.top }]}> 
      <View style={styles.innerContentWrapper}> 
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Community Feed</Text>
          <Ionicons name="earth-outline" size={32} color={DARK_COLORS.PRIMARY} />
        </View>
        
        <FlatList
          data={otherReports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReportCard report={item} onPress={() => handleCardPress(item)} />}
          ListHeaderComponent={renderHeader}
          onRefresh={() => fetchAllReports()} 
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
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10, // Add some spacing
    padding: 5,
  },
  upvoteText: {
    marginLeft: 4,
    fontSize: 14,
    color: DARK_COLORS.SECONDARY_TEXT,
    fontWeight: '600',
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
  rightFooterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // In styles = StyleSheet.create(...)
verifiedCard: {
  width: 150,
  height: 200,
  borderRadius: 12,
  overflow: 'hidden',
  backgroundColor: DARK_COLORS.CARD,
  marginRight: 10,
  elevation: 3,
},
verifiedImage: {
  flex: 1,
  justifyContent: 'flex-end',
},
verifiedOverlay: {
  backgroundColor: 'rgba(0,0,0,0.6)',
  padding: 8,
  minHeight: 60,
  justifyContent: 'space-between',
},
verifiedText: {
  color: DARK_COLORS.TEXT,
  fontSize: 14,
  fontWeight: '600',
},
verifiedUpvote: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 4,
},
verifiedUpvoteText: {
  color: DARK_COLORS.TEXT,
  fontSize: 12,
  fontWeight: 'bold',
  marginLeft: 4,
},
});

export default FeedScreen;