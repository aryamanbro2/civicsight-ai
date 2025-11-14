import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  provider: 'google' | 'apple';
  text: string;
  onPress: () => void;
};

const SocialAuthButton = ({ provider, text, onPress }: Props) => {
  const iconName = provider === 'google' ? 'logo-google' : 'logo-apple';
  
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Ionicons name={iconName} size={22} color="#000" style={styles.icon} />
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF', // White button for high contrast
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 10,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    color: '#000000', // Black text
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SocialAuthButton;