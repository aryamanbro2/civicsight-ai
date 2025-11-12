import React from 'react';
import { TextInput as RNTextInput, StyleSheet, View } from 'react-native';
import { TextInputProps } from '../types';

// FIX: Removed React.FC
const TextInput = ({
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'none',
}: TextInputProps) => {
  return (
    // Added a View wrapper for consistent margin
    <View style={styles.container}>
      <RNTextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16, // Add margin between text inputs
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
});

export default TextInput;