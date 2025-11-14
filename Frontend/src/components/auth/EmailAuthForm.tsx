import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TextInput from '../common/TextInput'; // Using the dark-mode text input
import Button from '../common/Button';
import { LoginData, RegisterData } from '../../services/authService';

// --- DARK THEME CONSTANTS ---
const DARK_COLORS = {
  PRIMARY: '#BB86FC',    
  TEXT: '#E0E0E0',       
  SECONDARY_TEXT: '#B0B0B0', 
};

type Props = {
  isLogin: boolean;
  onSubmit: (data: LoginData | RegisterData) => void;
  toggleAuthMode: () => void;
};

const EmailAuthForm = ({ isLogin, onSubmit, toggleAuthMode }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (isLogin) {
      onSubmit({ email, password });
    } else {
      onSubmit({ name, email, password });
    }
  };

  return (
    <View>
      {!isLogin && (
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Full Name"
          icon="person-outline"
        />
      )}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        icon="mail-outline"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        icon="lock-closed-outline"
      />

      <Button
        title={isLogin ? 'Sign In' : 'Sign Up'}
        onPress={handleSubmit}
        style={styles.submitButton}
      />
      
      <TouchableOpacity onPress={toggleAuthMode} style={styles.toggleButton}>
        <Text style={styles.toggleText}>
          {isLogin ? 'Need an account? Sign Up' : 'Have an account? Sign In'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  submitButton: {
    marginTop: 10,
    backgroundColor: DARK_COLORS.PRIMARY,
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    color: DARK_COLORS.SECONDARY_TEXT,
    fontSize: 14,
  },
});

export default EmailAuthForm;