export interface AuthFormProps {
    onEmailSubmit: (email: string) => void;
    onGoogleAuth: () => void;
    onAppleAuth: () => void;
}

export interface SocialAuthButtonProps {
    provider: 'google' | 'apple';
    onPress: () => void;
    icon: React.ReactNode;
    text: string;
}

export interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
    loading?: boolean;
}

export interface TextInputProps {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    keyboardType?: 'default' | 'email-address';
}