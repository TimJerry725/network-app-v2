import React from 'react';
import { StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import { FONT_FAMILIES } from '../constants/Tokens';
import { useAppTheme } from '../hooks/useAppTheme';

export interface Neo3DTextProps extends TextProps {
    children: React.ReactNode;
    depth?: number;
    shadowColor?: string;
    textColor?: string;
    variant?: 'sans' | 'serif' | 'editorial' | 'hero';
    size?: number;
    uppercase?: boolean;
    containerStyle?: ViewStyle;
}

/**
 * Modern Montserrat Single-Lined Clean Typography Component
 * Solid, punchy letterforms with zero double-lined / multi-layer echoes.
 */
export function Neo3DText({
    children,
    depth = 0,
    shadowColor,
    textColor,
    variant = 'sans',
    size,
    uppercase = false,
    style,
    containerStyle,
    ...rest
}: Neo3DTextProps) {
    const { isDark } = useAppTheme();

    const getFontFamily = () => {
        switch (variant) {
            case 'hero':
                return FONT_FAMILIES.black;
            case 'editorial':
            case 'serif':
                return FONT_FAMILIES.extraBold;
            case 'sans':
            default:
                return FONT_FAMILIES.bold;
        }
    };

    const font = getFontFamily();
    const resolvedTextColor = textColor ?? (isDark ? '#FFFFFF' : '#070709');

    const customTextStyle: TextStyle = {
        fontFamily: font,
        fontWeight: '800',
        color: resolvedTextColor,
        ...(size ? { fontSize: size } : {}),
        ...(uppercase ? { textTransform: 'uppercase' } : {}),
    };

    return (
        <Text
            {...rest}
            style={[
                styles.baseText,
                customTextStyle,
                style,
            ]}
        >
            {children}
        </Text>
    );
}

const styles = StyleSheet.create({
    baseText: {
        letterSpacing: 0.3,
    },
});
