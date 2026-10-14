import { StyleSheet, TextStyle } from 'react-native';

// Typography tokens using Red Hat Display
export const FONTS = {
    h1: {
        fontSize: 32,
        fontWeight: '800' as TextStyle['fontWeight'],
        lineHeight: 38,
        fontFamily: 'RedHatDisplay_800ExtraBold',
    },
    h2: {
        fontSize: 22,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 28,
        fontFamily: 'RedHatDisplay_700Bold',
    },
    h3: {
        fontSize: 18,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 24,
        fontFamily: 'RedHatDisplay_700Bold',
    },
    body: {
        fontSize: 15,
        fontWeight: '400' as TextStyle['fontWeight'],
        lineHeight: 22,
        fontFamily: 'RedHatDisplay_400Regular',
    },
    bodyStrong: {
        fontSize: 15,
        fontWeight: '600' as TextStyle['fontWeight'],
        lineHeight: 22,
        fontFamily: 'RedHatDisplay_600SemiBold',
    },
    label: {
        fontSize: 11,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 14,
        letterSpacing: 0.8,
        textTransform: 'uppercase' as TextStyle['textTransform'],
        fontFamily: 'RedHatDisplay_700Bold',
    },
    caption: {
        fontSize: 12,
        fontWeight: '500' as TextStyle['fontWeight'],
        lineHeight: 16,
        fontFamily: 'RedHatDisplay_500Medium',
    },
};

// Spacing tokens
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// Radius tokens
export const RADIUS = {
    input: 12,
    card: 16,
    cardLg: 18,
    bottomSheet: 24,
    pill: 999,
    button: 14,
};

// Shadow tokens - Flat Design (no drop shadows or elevation)
export const SHADOWS = StyleSheet.create({
    card: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    elevated: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    overlay: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
});
