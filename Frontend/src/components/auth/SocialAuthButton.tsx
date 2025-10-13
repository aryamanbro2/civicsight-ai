import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { SocialAuthButtonProps } from '../types';

const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({
    provider,
    onPress,
    icon,
    text,
}) => {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.content}>
                {icon}
                <Text style={styles.text}>{text}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: '100%',
        height: 56,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    text: {
        fontSize: 16,
        color: '#000000',
        fontWeight: '500',
        marginLeft: 8,
    },
});

export default SocialAuthButton;