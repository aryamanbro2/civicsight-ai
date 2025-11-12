import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Button from '../common/Button'; // FIX: Use default import
import TextInput from '../common/TextInput'; // FIX: Use default import
import { useAuth } from '../../context/AuthContext';
import { LoginCredentials, RegisterCredentials } from '../types';

interface EmailAuthFormProps {
  isLogin: boolean;
}

// FIX: Removed React.FC
const EmailAuthForm = ({ isLogin }: EmailAuthFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signUp, isAuthenticating } = useAuth(); // Use correct function names from context

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    try {
      if (isLogin) {
        const credentials: LoginCredentials = { email, password };
        await signIn(credentials);
        // Alert.alert('Success', 'Logged in successfully!'); // Success is handled by App.tsx navigating
      } else {
        const credentials: RegisterCredentials = { name, email, password };
        await signUp(credentials);
        // Alert.alert('Success', 'Account created and logged in!'); // Success is handled by App.tsx navigating
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Authentication failed. Check your credentials.';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      {!isLogin && (
        <TextInput
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      )}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={{ marginTop: 16 }} />
      <Button
        title={isAuthenticating ? 'Processing...' : isLogin ? 'SIGN IN' : 'SIGN UP'}
        onPress={handleSubmit}
        disabled={isAuthenticating}
        loading={isAuthenticating}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

// Assuming this is exported as a named export
export { EmailAuthForm };