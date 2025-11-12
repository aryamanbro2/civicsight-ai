import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | number; // Allow number for size
}

// FIX: Removed React.FC
const Logo = ({ size = 'large' }: LogoProps) => {
  const getTextStyle = () => {
    if (typeof size === 'number') {
      return { fontSize: size };
    }
    switch (size) {
      case 'small':
        return styles.small;
      case 'medium':
        return styles.medium;
      case 'large':
      default:
        return styles.large;
    }
  };

  return <Text style={[styles.base, getTextStyle()]}>CivicSight.ai</Text>;
};

const styles = StyleSheet.create({
  base: {
    fontWeight: '400',
    color: '#000000',
    // fontFamily: 'System', // Use default system font
  },
  small: {
    fontSize: 24,
  },
  medium: {
    fontSize: 30,
  },
  large: {
    fontSize: 36,
  },
});

export default Logo;