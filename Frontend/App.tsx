import React, { useState, useRef } from 'react'; 
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native'; 
import { 
  NavigationContainer, 
  NavigationState,
  NavigationContainerRef 
} from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import FeedScreen from './src/screens/FeedScreen'; 

// --- Placeholder Screens ---
import MapScreen from './src/screens/MapScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- DARK THEME & CONSTANTS ---
const DARK_COLORS = {
  BACKGROUND: '#121212', 
  CARD: '#1E1E1E',       
  PRIMARY: '#BB86FC',    
  ACCENT: '#03DAC6',     
  TEXT: '#E0E0E0',       
  BORDER: '#333333',     
  SECONDARY_TEXT: '#B0B0B0',
};
const FIXED_TAB_BAR_HEIGHT = 55; 

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={DARK_COLORS.PRIMARY} />
  </View>
);

// --- 1. Tab Navigator (Same) ---
const AppTabNavigator = () => {
    const insets = useSafeAreaInsets();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: DARK_COLORS.PRIMARY,
                tabBarInactiveTintColor: DARK_COLORS.SECONDARY_TEXT,
                tabBarStyle: {
                    backgroundColor: DARK_COLORS.CARD, 
                    borderTopColor: DARK_COLORS.BORDER,
                    borderTopWidth: 1,
                    height: FIXED_TAB_BAR_HEIGHT + insets.bottom, 
                    paddingBottom: insets.bottom > 0 ? insets.bottom * 0.8 : 5, 
                    paddingTop: 5, 
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;
                    if (route.name === 'Feed') {
                        iconName = focused ? 'earth' : 'earth-outline';
                    } else if (route.name === 'Map') {
                        iconName = focused ? 'map' : 'map-outline';
                    } else if (route.name === 'My Reports') {
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
            <Tab.Screen 
              name="Feed" 
              component={FeedScreen} 
              options={{ title: 'Community Feed' }} 
            />
            <Tab.Screen name="Map" component={MapScreen} />
            <Tab.Screen 
              name="My Reports" 
              component={DashboardScreen} 
            />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

// Define param list for navigation
type AppStackParamList = {
  AppTabs: undefined;
  ReportDetail: { report: any }; 
  CameraScreen: undefined;
  IssueForm: { imageUri: string };
};

// --- 2. Authenticated Stack ---
const AppStack = ({ 
  currentRouteName, 
  // CHANGED: Allow the ref prop to be null
  navigationRef
}: { 
  currentRouteName: string, 
  navigationRef: React.RefObject<NavigationContainerRef<AppStackParamList> | null> 
}) => {
  const insets = useSafeAreaInsets();

  const handleCreateReport = () => {
    // This check is now type-safe
    navigationRef.current?.navigate('CameraScreen'); 
  };
  
  const isTabScreen = ['Feed', 'Map', 'My Reports', 'Profile'].includes(currentRouteName);
  
  return (
    <View style={{ flex: 1, backgroundColor: DARK_COLORS.BACKGROUND }}>
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
      
      {isTabScreen && (
        <TouchableOpacity 
          style={[styles.fab, { bottom: (FIXED_TAB_BAR_HEIGHT / 2) + insets.bottom }]} 
          onPress={handleCreateReport}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={32} color={DARK_COLORS.CARD} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// --- 3. Unauthenticated Stack (Same) ---
const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
);

// --- 4. Main Switch Component ---
const RootNavigator = ({ 
  currentRouteName,
  // CHANGED: Allow the ref prop to be null
  navigationRef
}: { 
  currentRouteName: string,
  navigationRef: React.RefObject<NavigationContainerRef<AppStackParamList> | null> 
}) => {
  const { token, isLoading } = useAuth();
  const isAuthenticated = !!token;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    isAuthenticated ? 
      <AppStack currentRouteName={currentRouteName} navigationRef={navigationRef} /> 
    : <AuthStack />
  );
};

// --- 5. Main App Component ---
export default function App() {
  const [currentRouteName, setCurrentRouteName] = useState('Auth');
  
  // CHANGED: Initialize ref with null and correct type
  const navigationRef = useRef<NavigationContainerRef<AppStackParamList> | null>(null);

  const getActiveRouteName = (state: NavigationState | undefined): string => {
    if (!state) return 'AppTabs'; // Default
    const route = state.routes[state.index];
    if (route.state) {
      return getActiveRouteName(route.state as NavigationState);
    }
    return route.name;
  };

  return (
    <SafeAreaProvider> 
      <NavigationContainer
        ref={navigationRef}
        onStateChange={(state) => {
          const newRouteName = getActiveRouteName(state);
          setCurrentRouteName(newRouteName);
        }}
      >
        <AuthProvider>
          <RootNavigator currentRouteName={currentRouteName} navigationRef={navigationRef} />
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
  },
  fab: {
    position: 'absolute',
    width: 75,
    height: 75,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center', 
    backgroundColor: DARK_COLORS.PRIMARY,
    borderRadius: 40,
    elevation: 10,
    shadowColor: DARK_COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    zIndex: 10, 
  }
});