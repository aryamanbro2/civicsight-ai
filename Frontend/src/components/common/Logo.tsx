import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface LogoProps {
    size?: 'small' | 'medium' | 'large';
}

const Logo: React.FC<LogoProps> = ({ size = 'large' }) => {
    const getTextStyle = () => {
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
        fontFamily: 'System',
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