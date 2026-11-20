import React, { forwardRef } from 'react';
import { StyleSheet, TextInput as RNTextInput, type TextInputInstance, type TextInputProps, type TextStyle } from 'react-native';
import { systemFont } from './ThemedText';

/** TextInput that uses the same system font (SF Pro) and weight markers as ThemedText. */
export const TextInput = forwardRef<TextInputInstance, TextInputProps>(function TextInput({ style, ...rest }, ref) {
    return <RNTextInput ref={ref} style={systemFont(StyleSheet.flatten(style) as TextStyle)} {...rest} />;
});
