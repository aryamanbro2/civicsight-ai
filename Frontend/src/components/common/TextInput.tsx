import React from 'react';
import { View, Text, TextInput as RNTextInput, StyleSheet, TextInputProps as RNTextInputProps, ViewStyle } from 'react-native';

// --- UPDATE INTERFACE ---
// It now accepts all React Native TextInput props
interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  style?: ViewStyle; // Explicitly add style to be merged
}

const TextInput: React.FC<TextInputProps> = ({ label, error, style, ...props }) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[styles.input, error ? styles.inputError : null, style]} // <-- Apply style here
        placeholderTextColor="#9CA3AF"
        {...props} // <-- SPREAD THE REST OF THE PROPS (multiline, editable, etc.)
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 5,
  },
});

export default TextInput;