import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { ButtonProps } from '../types/index';

// FIX: Removed React.FC
const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  const buttonStyle: ViewStyle[] = [
    styles.base,
    variant === 'primary' ? styles.primary : styles.secondary,
    isDisabled && styles.disabled,
  ].filter(Boolean) as ViewStyle[];

  const textStyle: TextStyle[] = [
    styles.text,
    variant === 'primary' ? styles.primaryText : styles.secondaryText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={isDisabled ? 'Button is disabled' : undefined}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#000000'} size="small" />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
// ... (styles remain the same) ...
const styles = StyleSheet.create({
  base: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  primary: {
    backgroundColor: '#000000',
  },
  secondary: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  disabled: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#000000',
  },
});

export default Button;