// Frontend/src/components/common/Logo.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- DARK THEME CONSTANTS ---
// We define colors here so the component is self-contained
const DARK_COLORS = {
  PRIMARY: '#BB86FC',    
  ACCENT: '#03DAC6',     
  TEXT: '#E0E0E0',
};

const Logo = () => (
  <View style={styles.logoContainer}>
    <Ionicons name="eye-outline" size={32} color={DARK_COLORS.PRIMARY} />
    <Text style={styles.logoText}>
      <Text style={styles.logoTextPrimary}>Civic</Text>
      <Text style={styles.logoTextAccent}>Sight</Text>
    </Text>
  </View>
);

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    marginLeft: 10,
  },
  logoTextPrimary: {
    color: DARK_COLORS.TEXT, // "Civic" in white
  },
  logoTextAccent: {
    color: DARK_COLORS.PRIMARY, // "Sight" in purple
  },
});

export default Logo;