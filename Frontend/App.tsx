// Frontend/App.tsx

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native'; 
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
import FeedScreen from './src/screens/FeedScreen'; 
import MapScreen from './src/screens/MapScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import Logo from './src/components/common/Logo'; // Import the logo

// --- Types ---
// Define param list for navigation
type AppStackParamList = {
  AppTabs: undefined;
  ReportDetail: { report: any }; // 'any' should be your Report type
  CameraScreen: undefined;
  IssueForm: { imageUri?: string; audioUri?: string };
  AuthStack: undefined; // The authenticated flow
  Auth: undefined; 
};

const Stack = createNativeStackNavigator<AppStackParamList>();
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

// Frontend/App.tsx

// ... other imports

// --- Custom Tab Button for Creating Reports ---
const CustomTabBarButton: React.FC<any> = ({ children, onPress }) => (
  <TouchableOpacity
    style={{
      top: -25,
      justifyContent: 'center',
      alignItems: 'center',
      ...styles.shadow,
    }}
    onPress={onPress}
  >
    {/* This View is the purple circle */}
    <View style={{
      width: 70,
      height: 70,
      borderRadius: 40,
      backgroundColor: DARK_COLORS.PRIMARY,

      // THESE ARE THE TWO LINES THAT FIX THE ALIGNMENT:
      justifyContent:'center',
      alignItems: 'center'
    }}>
      {/* This 'children' is the "plus" icon, which will now be centered */}
      {children}
    </View>
  </TouchableOpacity>
);

// ... rest of your App.tsx file
// --- 1. Tab Navigator (NEW 5-TAB LAYOUT) ---
// We pass navigation from the parent StackNavigator
const AppTabNavigator = ({ navigation }: { navigation: any }) => {
    const insets = useSafeAreaInsets();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: false, // We just want icons
                tabBarActiveTintColor: DARK_COLORS.PRIMARY,
                tabBarInactiveTintColor: DARK_COLORS.SECONDARY_TEXT,
                tabBarStyle: {
                    backgroundColor: DARK_COLORS.CARD, 
                    borderTopColor: DARK_COLORS.BORDER,
                    borderTopWidth: 1,
                    height: 60 + insets.bottom, // Good base height
                    paddingBottom: insets.bottom,
                },
            })}
        >
            {/* Tab 1: Feed */}
            <Tab.Screen 
              name="Feed" 
              component={FeedScreen} 
              options={{ 
                tabBarIcon: ({ color, size }) => <Ionicons name="earth-outline" size={size} color={color} />,
              }}
            />
            {/* Tab 2: Map */}
            <Tab.Screen 
              name="Map" 
              component={MapScreen} 
              options={{ 
                tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
              }}
            />

            {/* Tab 3: NEW "CREATE" BUTTON */}
            <Tab.Screen 
              name="Create"
              component={CameraScreen} // Dummy component, won't be shown
              options={{
                tabBarIcon: ({ focused }) => (
                  <Ionicons name="add" size={32} color={DARK_COLORS.CARD} />
                ),
                tabBarButton: (props) => (
                  <CustomTabBarButton
                    {...props}
                    onPress={() => navigation.navigate('CameraScreen')} // Go to camera
                  />
                ),
              }}
              // This listener intercepts the tap and navigates
             
            />

            {/* Tab 4: My Reports */}
            <Tab.Screen 
              name="My Reports" 
              component={DashboardScreen} 
              options={{ 
                tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
              }}
            />
            {/* Tab 5: Profile */}
            <Tab.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ 
                tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
              }}
            />
        </Tab.Navigator>
    );
};

// --- 2. Authenticated Stack ---
// This stack now passes its navigation prop to AppTabNavigator
const AppStack = () => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: DARK_COLORS.CARD }
    }}
  >
    {/* Pass navigation to the component */}
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
);

// --- 3. Unauthenticated Stack (Same) ---
const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
);

// --- 4. Loading Screen (UPDATED) ---
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <Logo />
    <ActivityIndicator size="large" color={DARK_COLORS.PRIMARY} style={{ marginTop: 20 }}/>
  </View>
);

// --- 5. Main Switch Component (SIMPLIFIED) ---
// We no longer need to track route names or pass refs for the FAB
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

// --- 6. Main App Component (SIMPLIFIED) ---
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

// --- 7. Styles (SIMPLIFIED) ---
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: DARK_COLORS.BACKGROUND,
  },
  // Style for the custom button shadow
  shadow: {
    shadowColor: DARK_COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  }
  // REMOVED: styles.fab (no longer needed)
});