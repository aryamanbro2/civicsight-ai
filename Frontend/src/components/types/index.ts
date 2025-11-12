import { KeyboardTypeOptions, ViewStyle, TextStyle } from 'react-native';
import React from 'react';

// --- User Model ---
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'authority' | 'admin';
  // Add other user fields as needed
}

// --- Auth Credentials ---
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  // Add other registration fields like phone, etc.
}

// --- Report Data ---
export interface ReportSubmissionResponse {
  message: string;
  report: {
    id: string;
    issueType: string;
    severityScore: number;
    priority: string;
    // Add other fields returned by Node.js backend
  };
}

// --- Component Props (FIX: Added missing definitions) ---

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}

export interface SocialAuthButtonProps {
  provider: string;
  onPress: () => void;
  icon: React.ReactNode;
  text: string;
}

export interface TextInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}