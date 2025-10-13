import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';

interface EmailAuthFormProps {
    onEmailSubmit: (email: string) => void;
    onGoogleAuth: () => void;
    onAppleAuth: () => void;
    isLoading?: boolean;
}

const EmailAuthForm: React.FC<EmailAuthFormProps> = ({
    onEmailSubmit,
    onGoogleAuth,
    onAppleAuth,
    isLoading = false,
}) => {
    const [email, setEmail] = useState('');

    const handleContinue = () => {
        if (email.trim() && !isLoading) {
            onEmailSubmit(email);
        }
    };

    const isDisabled = !email.trim() || isLoading;

    return (
        <View style={styles.container}>
            {/* Logo */}
            <Text style={styles.logo}>CivicSight.ai</Text>

            {/* Header */}
            <View style={styles.headerContainer}>
                <Text style={styles.title}>Create an account</Text>
                <Text style={styles.subtitle}>Enter your phone number to sign up for this app</Text>
            </View>

            {/* Phone Input */}
            <TextInput
                style={[styles.emailInput, isLoading && styles.inputDisabled]}
                placeholder="+1234567890"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="phone-pad"
                autoCapitalize="none"
                editable={!isLoading}
            />

            {/* Continue Button */}
            <TouchableOpacity
                style={[styles.continueButton, isDisabled && styles.disabledButton]}
                onPress={handleContinue}
                disabled={isDisabled}
            >
                {isLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                    <Text style={styles.continueButtonText}>Continue</Text>
                )}
            </TouchableOpacity>

            {/* Divider */}
            <Text style={styles.divider}>or</Text>

            {/* Social Auth Buttons */}
            <TouchableOpacity
                style={[styles.socialButton, isLoading && styles.socialButtonDisabled]}
                onPress={onGoogleAuth}
                disabled={isLoading}
            >
                <Text style={styles.socialButtonText}>🇬 Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.socialButton, isLoading && styles.socialButtonDisabled]}
                onPress={onAppleAuth}
                disabled={isLoading}
            >
                <Text style={styles.socialButtonText}>🍎 Continue with Apple</Text>
            </TouchableOpacity>

            {/* Terms and Privacy */}
            <Text style={styles.termsText}>
                By clicking continue, you agree to our{' '}
                <Text style={styles.linkText}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        paddingTop: 120,
        alignItems: 'center',
    },
    logo: {
        fontSize: 36,
        fontWeight: '400',
        color: '#000000',
        marginBottom: 80,
        fontFamily: 'System',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
    },
    emailInput: {
        width: '100%',
        height: 56,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#ffffff',
        marginBottom: 24,
    },
    inputDisabled: {
        backgroundColor: '#f8f8f8',
        color: '#999999',
    },
    continueButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#000000',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    continueButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        fontSize: 16,
        color: '#999999',
        marginBottom: 32,
    },
    socialButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        flexDirection: 'row',
    },
    socialButtonDisabled: {
        backgroundColor: '#f0f0f0',
        opacity: 0.6,
    },
    socialButtonText: {
        fontSize: 16,
        color: '#000000',
        fontWeight: '500',
    },
    termsText: {
        fontSize: 14,
        color: '#999999',
        textAlign: 'center',
        marginTop: 32,
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    linkText: {
        color: '#000000',
        fontWeight: '500',
    },
});

export default EmailAuthForm;