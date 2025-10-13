import React from 'react';
import { TextInput as RNTextInput, StyleSheet } from 'react-native';
import { TextInputProps } from '../types';

const TextInput: React.FC<TextInputProps> = ({
    placeholder,
    value,
    onChangeText,
    keyboardType = 'default',
}) => {
    return (
        <RNTextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#999999"
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize="none"
        />
    );
};

const styles = StyleSheet.create({
    input: {
        width: '100%',
        height: 56,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#ffffff',
    },
});

export default TextInput;