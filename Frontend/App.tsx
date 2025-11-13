import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native'; 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons'; 

// --- Screens ---
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ReportDetailScreen from './src/screens/ReportDetailScreen';
import IssueFormScreen from './src/screens/IssueFormScreen';
import CameraScreen from './src/screens/CameraScreen'; 
// --- Placeholder Screens ---
const MapScreen = () => (<View style={styles.placeholderScreen}><Text style={{color: '#E0E0E0'}}>Map View (WIP)</Text></View>);
const MyReportsScreen = () => (<View style={styles.placeholderScreen}><Text style={{color: '#E0E0E0'}}>My Reports List (WIP)</Text></View>);
const ProfileScreen = () => (<View style={styles.placeholderScreen}><Text style={{color: '#E0E0E0'}}>Profile/Settings (WIP)</Text></View>);


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- DARK THEME & CONSTANTS ---
const DARK_COLORS = {
  BACKGROUND: '#121212', 
  CARD: '#1E1E1E',       // Tab Bar Background Color
  PRIMARY: '#BB86FC',    
  ACCENT: '#03DAC6',     
  TEXT: '#E0E0E0',       
  BORDER: '#333333',     
  SECONDARY_TEXT: '#B0B0B0', 
};
const FIXED_TAB_BAR_HEIGHT = 55; // Base height of the bar content

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={DARK_COLORS.PRIMARY} />
  </View>
);

// --- 1. Tab Navigator for Authenticated User ---
const AppTabNavigator = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: DARK_COLORS.PRIMARY,
                tabBarInactiveTintColor: DARK_COLORS.SECONDARY_TEXT,
                tabBarStyle: {
                    // FIX 1: Ensure background is the card color
                    backgroundColor: DARK_COLORS.CARD, 
                    borderTopColor: DARK_COLORS.BORDER,
                    borderTopWidth: 1,
                    // FIX 2: Set total height by adding the base height and the bottom inset
                    height: FIXED_TAB_BAR_HEIGHT + insets.bottom, 
                    // FIX 3: Set paddingBottom only to ensure icons are pushed up, using the dynamic height to cover the background
                    paddingBottom: insets.bottom > 0 ? insets.bottom * 0.8 : 5, 
                    paddingTop: 5, 
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Map') {
                        iconName = focused ? 'map' : 'map-outline';
                    } else if (route.name === 'MyReports') {
                        iconName = focused ? 'document-text' : 'document-text-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else {
                        iconName = 'alert-circle-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={DashboardScreen} />
            <Tab.Screen name="Map" component={MapScreen} />
            <Tab.Screen name="MyReports" component={MyReportsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

// --- 2. Authenticated Stack ---
const AppStack = () => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: DARK_COLORS.CARD }
    }}
  >
    <Stack.Screen name="AppTabs" component={AppTabNavigator} /> 
    
    <Stack.Screen 
        name="ReportDetail" 
        component={ReportDetailScreen}
        options={{ 
            headerShown: true, 
            headerStyle: { backgroundColor: DARK_COLORS.CARD }, 
            headerTintColor: DARK_COLORS.TEXT, 
            title: 'Issue Details' 
        }} 
    />
    <Stack.Screen name="CameraScreen" component={CameraScreen} />
    
    {/* CRITICAL FIX 2: Register the IssueForm screen to handle navigation from Dashboard */}
    <Stack.Screen 
        name="IssueForm" 
        component={IssueFormScreen}
        options={{ 
            headerShown: true, 
            headerStyle: { backgroundColor: DARK_COLORS.CARD }, 
            headerTintColor: DARK_COLORS.TEXT, 
            title: 'File Report' 
        }} 
    />
  </Stack.Navigator>
);
// --- 3. Unauthenticated Stack (Same) ---
const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
);

// --- 4. Main Switch Component (Same) ---
const RootNavigator = () => {
  const { token, isLoading } = useAuth();
  const isAuthenticated = !!token;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    isAuthenticated ? <AppStack /> : <AuthStack />
  );
};

// Wrap the main app with AuthProvider and NavigationContainer
export default function App() {
  return (
    <SafeAreaProvider> 
      <NavigationContainer>
        <AuthProvider>
          <RootNavigator />
          <StatusBar style="light" backgroundColor={DARK_COLORS.CARD} /> 
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: DARK_COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderScreen: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: DARK_COLORS.BACKGROUND
  }
});