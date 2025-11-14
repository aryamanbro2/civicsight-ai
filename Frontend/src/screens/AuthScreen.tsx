import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import Logo from '../components/common/Logo';
import EmailAuthForm from '../components/auth/EmailAuthForm';
// import SocialAuthButton from '../components/auth/SocialAuthButton'; // No longer needed
import { useAuth } from '../context/AuthContext';
import { LoginData, RegisterData } from '../services/authService';

// --- DARK THEME CONSTANTS ---
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

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, register } = useAuth();

  const handleAuth = async (data: LoginData | RegisterData) => {
    setIsLoading(true);
    try {
      if (isLogin) {
        await signIn(data.email, data.password);
      } else {
        // We know 'name' exists on RegisterData
        const regData = data as RegisterData;
        await register(regData.name, regData.email, regData.password);
      }
      // On success, the AuthContext will automatically navigate away
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert(
        isLogin ? "Login Failed" : "Registration Failed",
        error.message || "An unknown error occurred."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Logo />
        <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
        <Text style={styles.subtitle}>Sign in to report and track civic issues</Text>
        
        {isLoading ? (
          <ActivityIndicator size="large" color={DARK_COLORS.PRIMARY} style={styles.loader} />
        ) : (
          <>
            <EmailAuthForm
              isLogin={isLogin}
              onSubmit={handleAuth}
              toggleAuthMode={() => setIsLogin(!isLogin)}
            />

            {/* REMOVED: Divider and SocialAuthButton */}
          </>
        )}
      </View
>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loader: {
    marginVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: DARK_COLORS.TEXT,
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: DARK_COLORS.SECONDARY_TEXT,
    textAlign: 'center',
    marginBottom: 30,
  },
  // REMOVED: Divider styles
});

export default AuthScreen;