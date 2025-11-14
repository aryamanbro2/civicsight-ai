// Frontend/src/screens/ProfileScreen.tsx

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
import { Ionicons } from '@expo/vector-icons';

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

// --- Profile Screen Component ---
const ProfileScreen = () => {
  // CHANGED: Destructure 'signOut' instead of 'logout'
  const { user, signOut } = useAuth(); 
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();
  
  const fetchMyStats = useCallback(async (initialLoad = false) => {
    if (initialLoad) setIsLoading(true);
    try {
      const response = await getMyReports();
      if (response.statistics) {
        setStats(response.statistics);
      }
    } catch (error: any) {
      console.error('Error loading reports:', error.message); 
      if (error.message === 'Token has expired. Please sign in again.') {
        Alert.alert(
          'Session Expired',
          'You have been logged out. Please sign in again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useFocusEffect(
    useCallback(() => {
      fetchMyStats(true); 
      return () => {};
    }, [fetchMyStats])
  );

  // CHANGED: Call the correct 'signOut' function
  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => signOut() } // Use signOut
      ]
    );
  };

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

        {/* Statistics Section */}
        <Text style={styles.sectionTitle}>My Report Statistics</Text>
        {isLoading ? (
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
          {/* CHANGED: Call handleSignOut */}
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
  // --- Profile Card ---
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
  // --- Stats ---
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
    width: '48%', // Two cards per row
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
  // --- Settings ---
  settingsContainer: {
    backgroundColor: DARK_COLORS.CARD,
    borderRadius: 12,
    overflow: 'hidden',
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