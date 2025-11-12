import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
// FIX: Import SafeAreaView from 'react-native-safe-area-context'
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { EmailAuthForm } from '../components/auth/EmailAuthForm';
import SocialAuthButton from '../components/auth/SocialAuthButton';
import Logo from '../components/common/Logo';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const toggleMode = () => setIsLogin((prev) => !prev);

  const handleSocialLogin = (provider: string) => {
    Alert.alert('Not Implemented', `${provider} login is not set up yet.`);
  };

  return (
    // FIX: This SafeAreaView is now from the correct package
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Logo />
          <Text style={styles.title}>{isLogin ? 'Welcome Back!' : 'Join CivicSight AI'}</Text>
        </View>

        <View style={styles.formContainer}>
          <EmailAuthForm isLogin={isLogin} />

          <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
            <Text style={styles.toggleButtonText}>
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <SocialAuthButton
          provider="Google"
          text="Continue with Google"
          icon={<FontAwesome name="google" size={20} color="#000" />}
          onPress={() => handleSocialLogin('Google')}
        />
        <SocialAuthButton
          provider="Facebook"
          text="Continue with Facebook"
          icon={<FontAwesome name="facebook" size={20} color="#000" />}
          onPress={() => handleSocialLogin('Facebook')}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  toggleButton: {
    marginTop: 16,
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
  },
});

export default AuthScreen;