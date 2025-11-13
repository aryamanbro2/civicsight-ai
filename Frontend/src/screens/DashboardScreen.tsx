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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; 
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMyReports, Report } from '../services/reportService';
import { Ionicons } from '@expo/vector-icons';

// --- CONSTANTS ---
const DARK_COLORS = {
  BACKGROUND: '#121212', // Screen's desired background (Inner content)
  CARD: '#1E1E1E',       // Tab bar background (Outer container to hide leak)
  PRIMARY: '#BB86FC',    
  ACCENT: '#03DAC6',     
  TEXT: '#E0E0E0',       
  SECONDARY_TEXT: '#B0B0B0', 
  BORDER: '#333333',     
};
const TAB_BAR_HEIGHT_ESTIMATE = 60; 
const TAB_BAR_BOTTOM_CLEARANCE = 0; 

// Function to determine colors based on AI's priority score (Same)
const getPriorityColor = (priority: Report['priority']) => {
  switch (priority) {
    case 'high': return '#CF6679'; 
    case 'medium': return '#FFB300'; 
    case 'low': 
    default: return '#03DAC6';
  }
};

// --- Report Card Component (Same) ---
const ReportCard = ({ report, onPress }: { report: Report, onPress: () => void }) => {
  const statusColor = report.status === 'completed' 
    ? DARK_COLORS.ACCENT
    : report.status === 'in_progress' 
    ? DARK_COLORS.PRIMARY
    : '#B0B0B0'; 
    
  const priorityColor = getPriorityColor(report.priority);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.card, { borderLeftColor: priorityColor }]}>
        
        {/* Image Peek Section */}
        {report.mediaType === 'image' && report.mediaUrl ? (
          <Image 
            source={{ uri: report.mediaUrl }} 
            style={styles.cardImagePeek} 
            resizeMode="cover"
          />
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
                <Text style={styles.priorityText}>{DARK_COLORS.BACKGROUND}</Text>
              </View>
            </View>
            
            <Text style={styles.cardDescription} numberOfLines={2}>
              {report.description || `[${report.mediaType} report. Tap for details.]`}
            </Text>
            
            <View style={styles.cardFooter}>
              <View style={styles.cardLocationContainer}>
                <Ionicons name="location-outline" size={14} color={DARK_COLORS.SECONDARY_TEXT} />
                <Text style={styles.cardLocation} numberOfLines={1}>
                  {report.location.address || 'Unknown Location'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{DARK_COLORS.BACKGROUND}</Text>
              </View>
            </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- Define App Route Params for Type Safety ---
type RootStackParamList = {
  AppTabs: undefined; 
  ReportDetail: { report: Report }; 
  CameraScreen: undefined;
};
type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AppTabs'>;


// --- Dashboard Screen Component ---
const DashboardScreen = () => {
  const navigation = useNavigation<DashboardNavigationProp>(); 
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const insets = useSafeAreaInsets();
  
  const fetchMyReports = useCallback(async (initialLoad = false) => {
    if (initialLoad) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const response = await getMyReports();
      setMyReports(response.reports);
    } catch (error: any) {
      console.error('Error loading reports:', error.message); 
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []); 

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={50} color={DARK_COLORS.SECONDARY_TEXT} />
      <Text style={styles.emptyText}>No issues reported yet.</Text>
      <Text style={styles.emptyTextSub}>Use the '+' button to file your first AI-powered report!</Text>
    </View>
  );

  useFocusEffect(
    useCallback(() => {
      fetchMyReports(true); 
      return () => {};
    }, [fetchMyReports])
  );

  const handleCardPress = (report: Report) => {
      navigation.navigate('ReportDetail', { report: report }); 
  };

  const handleCreateReport = () => {
    navigation.navigate('CameraScreen'); 
  };


  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={DARK_COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Fetching reports...</Text>
      </View>
    );
  }

  const listContentStyle = myReports.length === 0 
    ? styles.listContent 
    : {}; 

  const finalContentStyle = [
    listContentStyle,
    { paddingVertical: 10 } 
  ].filter(Boolean);


  return (
    // FIX 1: Set the outer container to the CARD color (#1E1E1E) to prevent the black strip leak
    <View style={[styles.outerContainer, { paddingTop: insets.top }]}> 
      
      {/* Inner View Wrapper for actual background color (#121212) */}
      <View style={styles.innerContentWrapper}> 
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>CivicSight AI</Text>
          <Ionicons name="person-circle-outline" size={32} color={DARK_COLORS.PRIMARY} />
        </View>
        
        <FlatList
          data={myReports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReportCard report={item} onPress={() => handleCardPress(item)} />}
          
          // FIX 2: Apply the margin to the *FlatList* style to push it up from the bottom of the screen
          style={{ marginBottom: TAB_BAR_BOTTOM_CLEARANCE }} 
          
          contentContainerStyle={finalContentStyle} 
          
          ListEmptyComponent={renderEmptyList} 
          
          onRefresh={() => fetchMyReports()} 
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ bottom: TAB_BAR_HEIGHT_ESTIMATE + insets.bottom }}
        />
      </View>

      {/* FAB position remains fixed using 'bottom' property relative to the screen bottom */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: -25 + insets.bottom }]} 
        onPress={handleCreateReport}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={32} color={DARK_COLORS.CARD} />
      </TouchableOpacity>
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  // FIX: New Outer container matches Tab Bar color to stop the leak
  outerContainer: {
    flex: 1,
    backgroundColor: DARK_COLORS.CARD, 
  },
  // FIX: New Inner wrapper uses the desired screen background color
  innerContentWrapper: {
    flex: 1,
    backgroundColor: DARK_COLORS.BACKGROUND,
  },
  listContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: DARK_COLORS.CARD, // Header also matches the card/tab bar color
    borderBottomWidth: 1,
    borderBottomColor: DARK_COLORS.BORDER,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK_COLORS.TEXT,
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
    height: '100%',
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
  fab: {
    position: 'absolute',
    width: 75,
    height: 75,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    backgroundColor: DARK_COLORS.PRIMARY,
    borderRadius: 40,
    elevation: 10,
    shadowColor: DARK_COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  }
});

export default DashboardScreen;