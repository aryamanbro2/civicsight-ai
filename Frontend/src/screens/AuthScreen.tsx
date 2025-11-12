import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { EmailAuthForm } from '../components/auth/EmailAuthForm'; 
import { SocialAuthButton } from '../components/auth/SocialAuthButton'; 
import { Logo } from '../components/common/Logo';

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  // Note: The social login functions are handled inside SocialAuthButton component or skipped here
  // const { loginWithGoogle, loginWithApple } = useAuth(); // THIS WAS THE SOURCE OF THE ERRORS

  const toggleMode = () => setIsLogin(prev => !prev);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        <Logo size={120} />
        
        <Text style={styles.title}>
          {isLogin ? 'Welcome Back!' : 'Join CivicSight AI'}
        </Text>
        
        <View style={styles.formContainer}>
          {/* FIX: Use the corrected component and pass only required props */}
          <EmailAuthForm isLogin={isLogin} /> 
          
          <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
            <Text style={styles.toggleButtonText}>
              {isLogin 
                ? "Don't have an account? Sign Up" 
                : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />
        
        <SocialAuthButton provider="Google" />
        <SocialAuthButton provider="Facebook" />
      </ScrollView>
    </SafeAreaView>
  );
};

// ... (Styles from AuthScreen.tsx remain the same) ...

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
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
        fontSize: 32,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    form: {
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    passwordToggle: {
        padding: 4,
    },
    submitButton: {
        backgroundColor: '#8B5CF6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    submitButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
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
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        paddingVertical: 12,
        borderRadius: 12,
        marginHorizontal: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    socialButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleText: {
        fontSize: 14,
        color: '#6B7280',
    },
    toggleLink: {
        fontSize: 14,
        color: '#8B5CF6',
        fontWeight: '600',
    },
});

export default AuthScreen;