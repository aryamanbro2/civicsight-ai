import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // Import an icon library
import { EmailAuthForm } from '../components/auth/EmailAuthForm';
import SocialAuthButton from '../components/auth/SocialAuthButton'; // FIX: Use default import
import Logo from '../components/common/Logo'; // FIX: Use default import

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  // Note: The social login functions are handled inside SocialAuthButton component or skipped here
  // const { loginWithGoogle, loginWithApple } = useAuth(); // THIS WAS THE SOURCE OF THE ERRORS

  const toggleMode = () => setIsLogin((prev) => !prev);

  // Dummy handler for social buttons
  const handleSocialLogin = (provider: string) => {
    Alert.alert('Not Implemented', `${provider} login is not set up yet.`);
  };

  return (
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

        {/* FIX: Added missing props to SocialAuthButton */}
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

// ... (Your existing styles for AuthScreen.tsx) ...
// NOTE: I've added a few styles from your description that were missing
// in the provided file to make it render correctly.

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
  // ... (Your other styles like socialButton, input etc. would go here)
});

export default AuthScreen;