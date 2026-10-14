import { StyleSheet, TextStyle } from 'react-native';

// Typography tokens with CRED high-contrast editorial hierarchy
export const FONTS = {
    // Massive Hero Numbers (Battery %, Amount, Speeds)
    display: {
        fontSize: 42,
        fontWeight: '800' as TextStyle['fontWeight'],
        lineHeight: 48,
        letterSpacing: -1.2,
        fontFamily: 'RedHatDisplay_800ExtraBold',
    },
    heroStat: {
        fontSize: 36,
        fontWeight: '800' as TextStyle['fontWeight'],
        lineHeight: 42,
        letterSpacing: -1.0,
        fontFamily: 'RedHatDisplay_800ExtraBold',
    },
    h1: {
        fontSize: 30,
        fontWeight: '800' as TextStyle['fontWeight'],
        lineHeight: 36,
        letterSpacing: -0.8,
        fontFamily: 'RedHatDisplay_800ExtraBold',
    },
    h2: {
        fontSize: 22,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 28,
        letterSpacing: -0.4,
        fontFamily: 'RedHatDisplay_700Bold',
    },
    h3: {
        fontSize: 17,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 23,
        letterSpacing: -0.2,
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
    // CRED Signature Micro-Eyebrow Tag
    eyebrow: {
        fontSize: 10,
        fontWeight: '800' as TextStyle['fontWeight'],
        lineHeight: 13,
        letterSpacing: 1.6,
        textTransform: 'uppercase' as TextStyle['textTransform'],
        fontFamily: 'RedHatDisplay_800ExtraBold',
    },
    label: {
        fontSize: 11,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 15,
        letterSpacing: 0.8,
        textTransform: 'uppercase' as TextStyle['textTransform'],
        fontFamily: 'RedHatDisplay_700Bold',
    },
    monoVal: {
        fontSize: 16,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 21,
        letterSpacing: 0.4,
        fontFamily: 'RedHatDisplay_700Bold',
    },
    caption: {
        fontSize: 12,
        fontWeight: '500' as TextStyle['fontWeight'],
        lineHeight: 16,
        fontFamily: 'RedHatDisplay_500Medium',
    },
};

// Spacing tokens with generous macro-rhythm
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// Radius tokens with concentric double-bezel curves
export const RADIUS = {
    input: 12,
    card: 18,
    cardLg: 22,
    bezelOuter: 24,
    bezelInner: 18,
    bottomSheet: 28,
    pill: 999,
    button: 999, // CRED buttons are iconic full pills
};

// CRED Double-Bezel (Doppelrand) Architecture Styles
export const CRED_BEZEL = StyleSheet.create({
    outerShell: {
        borderRadius: RADIUS.bezelOuter,
        padding: 2,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: '#141418',
    },
    innerCore: {
        borderRadius: RADIUS.bezelInner,
        padding: 16,
        backgroundColor: '#0E0E12',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.04)',
    },
    neonGlowBorder: {
        borderColor: 'rgba(0, 229, 117, 0.35)',
    },
    goldGlowBorder: {
        borderColor: 'rgba(245, 166, 35, 0.35)',
    },
});

// Flat design shadows (zero drop shadows or blur artifacts)
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
