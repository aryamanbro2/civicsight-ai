import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const AuthScreen: React.FC = () => {
    const [isLoginMode, setIsLoginMode] = useState(true); // Toggle between login and signup
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { loginWithEmail, signupWithEmail, loginWithGoogle, loginWithApple } = useAuth();

    const handleSubmit = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        if (!isLoginMode) {
            if (!name.trim()) {
                Alert.alert('Error', 'Please enter your name');
                return;
            }
            if (password !== confirmPassword) {
                Alert.alert('Error', 'Passwords do not match');
                return;
            }
        }

        setIsLoading(true);
        try {
            let response;
            if (isLoginMode) {
                response = await loginWithEmail(email.trim());
            } else {
                response = await signupWithEmail(email.trim());
            }

            if (response.success) {
                Alert.alert('Success', isLoginMode ? 'Logged in successfully!' : 'Account created successfully!');
            } else {
                Alert.alert('Error', response.message || `${isLoginMode ? 'Login' : 'Signup'} failed`);
            }
        } catch (error) {
            console.error(`${isLoginMode ? 'Login' : 'Signup'} error:`, error);
            Alert.alert('Error', `Something went wrong. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const response = await loginWithGoogle();
            if (response.success) {
                Alert.alert('Success', 'Logged in with Google successfully!');
            } else {
                Alert.alert('Error', response.message || 'Google login failed');
            }
        } catch (error) {
            console.error('Google login error:', error);
            Alert.alert('Error', 'Google login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setIsLoading(true);
        try {
            const response = await loginWithApple();
            if (response.success) {
                Alert.alert('Success', 'Logged in with Apple successfully!');
            } else {
                Alert.alert('Error', response.message || 'Apple login failed');
            }
        } catch (error) {
            console.error('Apple login error:', error);
            Alert.alert('Error', 'Apple login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setEmail('');
        setName('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>CivicSight.ai</Text>
                    <Text style={styles.subtitle}>
                        {isLoginMode
                            ? 'Welcome back! Sign in to continue reporting road issues.'
                            : 'Join CivicSight.ai to start reporting road issues in your community.'
                        }
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Name Input (only for signup) */}
                    {!isLoginMode && (
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                autoComplete="name"
                            />
                        </View>
                    )}

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                    </View>

                    {/* Password Input (if you want to add password functionality) */}
                    {/* Uncomment this section if your backend supports password authentication
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoComplete={isLoginMode ? "current-password" : "new-password"}
                        />
                        <TouchableOpacity 
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.passwordToggle}
                        >
                            <Ionicons 
                                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                                size={20} 
                                color="#6B7280" 
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Password (only for signup) */}
                    {/*
                    {!isLoginMode && (
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                                autoComplete="new-password"
                            />
                        </View>
                    )}
                    */}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.submitButtonText}>
                                {isLoginMode ? 'Sign In' : 'Create Account'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or continue with</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Social Login Buttons */}
                    <View style={styles.socialButtons}>
                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            <Ionicons name="logo-google" size={20} color="#DB4437" />
                            <Text style={styles.socialButtonText}>Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={handleAppleLogin}
                            disabled={isLoading}
                        >
                            <Ionicons name="logo-apple" size={20} color="#000" />
                            <Text style={styles.socialButtonText}>Apple</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Toggle between Login/Signup */}
                    <View style={styles.toggleContainer}>
                        <Text style={styles.toggleText}>
                            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                        </Text>
                        <TouchableOpacity onPress={toggleMode}>
                            <Text style={styles.toggleLink}>
                                {isLoginMode ? 'Sign Up' : 'Sign In'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

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