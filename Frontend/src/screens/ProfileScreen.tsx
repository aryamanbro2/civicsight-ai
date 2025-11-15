import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMyReports } from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import { getProfile, User, UserStats } from '../services/authService'; // Import UserStats
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress'; 

// --- CONSTANTS ---
const DARK_COLORS = {
  BACKGROUND: '#121212', 
  CARD: '#1E1E1E',       
  PRIMARY: '#BB86FC',    
  ACCENT: '#03DAC6',     
  TEXT: '#E0E0E0',       
  SECONDARY_TEXT: '#B0B0B0', 
  BORDER: '#333333',     
  DANGER: '#CF6679',
};

// --- BADGE CRITERIA (Frontend Source of Truth) ---
// This list defines all available badges, their criteria, and how to get them.
const BADGE_CRITERIA_DATA = [
    { name: 'Newbie Reporter', type: 'Reports', icon: 'document-outline', goal: 1, color: '#03DAC6', description: 'File 1 report' },
    { name: 'Super Contributor', type: 'Reports', icon: 'documents-outline', goal: 5, color: '#BB86FC', description: 'File 5 reports' },
    { name: 'Community Hero', type: 'Reports', icon: 'star', goal: 25, color: '#FFD700', description: 'File 25 reports' },
    { name: 'Verified Voice', type: 'Upvotes', icon: 'megaphone-outline', goal: 10, color: '#FFB300', description: 'Receive 10 upvotes on your reports' },
    { name: 'Pothole Master', type: 'Category', icon: 'warning-outline', category: 'pothole', goal: 5, color: '#CF6679', description: 'File 5 pothole reports' },
    { name: 'The Architect', type: 'Category', icon: 'build-outline', category: 'infrastructure', goal: 5, color: '#6200EE', description: 'File 5 infrastructure reports' },
    { name: 'Sanitation Star', type: 'Category', icon: 'trash-outline', category: 'sanitation', goal: 5, color: '#00C853', description: 'File 5 sanitation reports' },
];

// Interface for the stats object
interface ReportStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
}

// --- Reusable Stat Card Component ---
const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: keyof typeof Ionicons.glyphMap, color: string }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={28} color={color} />
    <Text style={[styles.statValue, { color: color }]}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

// --- NEW UNIFIED BADGE CARD COMPONENT ---
// This component shows info for ALL badges, earned or not.
const BadgeCard = ({ criteria, userStats }: { criteria: typeof BADGE_CRITERIA_DATA[0], userStats?: UserStats }) => {
  
  let current = 0;
  const goal = criteria.goal;
  
  // 1. Calculate current progress based on stats
  if (userStats) {
    if (criteria.type === 'Reports') {
      current = userStats.reportCount;
    } else if (criteria.type === 'Upvotes') {
      current = userStats.totalUpvotesReceived;
    } else if (criteria.type === 'Category' && criteria.category) {
      current = userStats.categoryCounts[criteria.category.toLowerCase()] || 0;
    }
  }

  const progress = Math.min(1, current / goal);
  const isEarned = progress === 1;

  return (
    <View style={[styles.badgeCard, isEarned && styles.badgeCardEarned, {borderColor: criteria.color}]}>
      <Ionicons 
        name={isEarned ? (criteria.icon as any) : 'lock-closed-outline'} 
        size={32} 
        color={isEarned ? criteria.color : DARK_COLORS.SECONDARY_TEXT} 
      />
      <View style={styles.badgeContent}>
        <Text style={[styles.badgeName, isEarned && { color: criteria.color }]}>
          {criteria.name}
        </Text>
        <Text style={styles.badgeDescription}>{criteria.description}</Text>
        
        {/* Show Progress Bar OR a "Completed" checkmark */}
        {isEarned ? (
          <View style={styles.progressHeader}>
            <Ionicons name="checkmark-circle" size={16} color={DARK_COLORS.ACCENT} />
            <Text style={styles.progressCompleteText}>Completed!</Text>
          </View>
        ) : (
          <>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Progress</Text>
              <Text style={styles.progressCounter}>{current}/{goal}</Text>
            </View>
            <Progress.Bar
              progress={progress}
              width={null}
              height={8}
              color={criteria.color}
              unfilledColor={DARK_COLORS.BORDER}
              borderRadius={4}
              borderWidth={0}
              style={{ marginTop: 5 }}
            />
          </>
        )}
      </View>
    </View>
  );
};
// --- END BADGE CARD ---

// --- Profile Screen Component ---
const ProfileScreen = () => {
  const { user, signOut, updateUser } = useAuth(); // Functions are now stable
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true); 
  const [isProfileLoading, setIsProfileLoading] = useState(true); 
  const insets = useSafeAreaInsets();
  
  // This effect will run ONCE when the screen is focused, thanks to stable functions
  useFocusEffect(
    useCallback(() => {
        let isCanceled = false;
        
        const loadAllData = async () => {
            setIsProfileLoading(true);
            setIsLoadingStats(true);
            
            try {
                // Fetch profile (with stats) and reports in parallel
                const [profileResponse, statsResponse] = await Promise.all([
                    getProfile(),
                    getMyReports()
                ]);

                if (!isCanceled) {
                    await updateUser(profileResponse); // Update global user
                    setStats(statsResponse.statistics); // Update local stats
                }

            } catch (error: any) {
                console.error('Error loading full profile data:', error.message);
                if (!isCanceled && (error.message.includes('Token') || error.message.includes('Authentication') || error.message.includes('User not found'))) {
                    Alert.alert(
                        'Session Expired',
                        'You have been logged out. Please sign in again.',
                        [ { text: 'OK', onPress: () => signOut() } ]
                    );
                }
            } finally {
                if (!isCanceled) {
                    setIsProfileLoading(false);
                    setIsLoadingStats(false);
                }
            }
        };

        loadAllData();
        
        return () => {
            isCanceled = true;
        };
    }, [signOut, updateUser]) // Dependencies are stable, loop is broken
  );

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => signOut() }
      ]
    );
  };
  
  // This loader now only shows on initial load, not during the stat loading
  if (isProfileLoading) {
      return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={DARK_COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading profile data...</Text>
        </View>
      );
  }

  return (
    <View style={[styles.outerContainer, { paddingTop: insets.top }]}> 
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Ionicons name="person-circle-outline" size={32} color={DARK_COLORS.PRIMARY} />
      </View>
      
      <ScrollView style={styles.container}>
        {/* User Info Card */}
        <View style={styles.profileCard}>
          <Ionicons name="person-circle" size={60} color={DARK_COLORS.PRIMARY} />
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>{user?.name || 'Community Member'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'No email'}</Text>
          </View>
        </View>
        
        {/* --- NEW BADGE SECTION --- */}
        <Text style={styles.sectionTitle}>My Badges</Text>
        {user?.stats ? (
          BADGE_CRITERIA_DATA.map(criteria => (
            <BadgeCard 
              key={criteria.name}
              criteria={criteria} 
              userStats={user.stats!} 
            />
          ))
        ) : (
          !isProfileLoading && <Text style={styles.loadingText}>Badge data could not be loaded.</Text>
        )}
        {/* --- END NEW BADGE SECTION --- */}

        {/* Statistics Section */}
        <Text style={styles.sectionTitle}>My Report Statistics</Text>
        {/* This loader is now separate and will work */}
        {isLoadingStats ? (
          <ActivityIndicator size="small" color={DARK_COLORS.PRIMARY} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.statsContainer}>
            <StatCard 
              title="Total" 
              value={stats?.total || 0} 
              icon="documents-outline"
              color={DARK_COLORS.PRIMARY} 
            />
            <StatCard 
              title="Pending" 
              value={stats?.pending || 0} 
              icon="hourglass-outline"
              color={DARK_COLORS.SECONDARY_TEXT} 
            />
            <StatCard 
              title="In Progress" 
              value={stats?.in_progress || 0} 
              icon="sync-outline"
              color="#FFB300" // Medium priority color
            />
            <StatCard 
              title="Completed" 
              value={stats?.completed || 0} 
              icon="checkmark-circle-outline"
              color={DARK_COLORS.ACCENT} 
            />
          </View>
        )}

        {/* Settings Section */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsContainer}>
          <TouchableOpacity style={styles.settingButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color={DARK_COLORS.DANGER} />
            <Text style={styles.settingButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
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
  outerContainer: {
    flex: 1,
    backgroundColor: DARK_COLORS.BACKGROUND,
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
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
  profileCard: {
    backgroundColor: DARK_COLORS.CARD,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  profileTextContainer: {
    marginLeft: 15,
    flex: 1, // Ensure text wraps
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_COLORS.TEXT,
  },
  profileEmail: {
    fontSize: 14,
    color: DARK_COLORS.SECONDARY_TEXT,
  },
  
  // --- NEW UNIFIED BADGE STYLES ---
  badgeCard: {
    backgroundColor: DARK_COLORS.CARD,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    opacity: 0.6, // Dim unearned badges
    borderLeftWidth: 4,
  },
  badgeCardEarned: {
    opacity: 1.0, // Full opacity for earned badges
    borderLeftWidth: 4,
    // borderColor is set inline
  },
  badgeContent: {
    flex: 1,
    marginLeft: 15,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DARK_COLORS.SECONDARY_TEXT,
  },
  badgeDescription: {
    fontSize: 14,
    color: DARK_COLORS.SECONDARY_TEXT,
    marginBottom: 10,
    marginTop: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: DARK_COLORS.SECONDARY_TEXT,
    fontWeight: '600',
  },
  progressCounter: {
    fontSize: 12,
    fontWeight: 'bold',
    color: DARK_COLORS.PRIMARY,
  },
  progressCompleteText: {
    fontSize: 14,
    color: DARK_COLORS.ACCENT,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  // --- END NEW STYLES ---

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_COLORS.TEXT,
    marginTop: 25,
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: DARK_COLORS.CARD,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  statTitle: {
    fontSize: 14,
    color: DARK_COLORS.SECONDARY_TEXT,
  },
  settingsContainer: {
    backgroundColor: DARK_COLORS.CARD,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  settingButtonText: {
    color: DARK_COLORS.DANGER,
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '600',
  }
});

export default ProfileScreen;