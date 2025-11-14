import React from 'react';
import { View, TextInput as RNTextInput, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- DARK THEME CONSTANTS ---
const DARK_COLORS = {
  CARD: '#1E1E1E',       
  TEXT: '#E0E0E0',       
  SECONDARY_TEXT: '#B0B0B0', 
  BORDER: '#333333',     
};

type Props = React.ComponentProps<typeof RNTextInput> & {
  icon?: keyof typeof Ionicons.glyphMap;
};

const TextInput = ({ icon, style, ...props }: Props) => {
  return (
    <View style={styles.container}>
      {icon && (
        <Ionicons name={icon} size={20} color={DARK_COLORS.SECONDARY_TEXT} style={styles.icon} />
      )}
      <RNTextInput
        style={[styles.input, style]}
        placeholderTextColor={DARK_COLORS.SECONDARY_TEXT}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_COLORS.CARD,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DARK_COLORS.BORDER,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: DARK_COLORS.TEXT,
    fontSize: 16,
  },
});

export default TextInput;