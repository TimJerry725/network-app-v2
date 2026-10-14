import { StyleSheet, TextStyle } from 'react-native';

// CRED Modern Typography Font Stack:
// - Geometric Grotesque Sans (Gilroy aesthetic via Plus Jakarta Sans) for clean UI, labels, and buttons
// - High-Contrast Editorial Serif (Cirka aesthetic via Cinzel & Playfair Display) for hero stats and headings
export const FONT_FAMILIES = {
    sansRegular: 'PlusJakartaSans_400Regular',
    sansMedium: 'PlusJakartaSans_500Medium',
    sansSemiBold: 'PlusJakartaSans_600SemiBold',
    sansBold: 'PlusJakartaSans_700Bold',
    sansExtraBold: 'PlusJakartaSans_800ExtraBold',

    serifDisplay: 'Cinzel_700Bold',
    serifDisplayBlack: 'Cinzel_800ExtraBold',
    serifHeading: 'PlayfairDisplay_700Bold',
    serifExtraBold: 'PlayfairDisplay_800ExtraBold',
};

// Typography tokens with CRED high-contrast editorial hierarchy
export const FONTS = {
    // Massive Hero Numbers (Battery %, Amount, Speeds) - CRED Editorial Display
    display: {
        fontSize: 42,
        fontWeight: '800' as TextStyle['fontWeight'],
        lineHeight: 48,
        letterSpacing: -1.2,
        fontFamily: FONT_FAMILIES.serifDisplayBlack,
    },
    heroStat: {
        fontSize: 36,
        fontWeight: '800' as TextStyle['fontWeight'],
        lineHeight: 42,
        letterSpacing: -1.0,
        fontFamily: FONT_FAMILIES.serifHeading,
    },
    editorialTitle: {
        fontSize: 28,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 34,
        letterSpacing: -0.6,
        fontFamily: FONT_FAMILIES.serifHeading,
    },
    h1: {
        fontSize: 30,
        fontWeight: '800' as TextStyle['fontWeight'],
        lineHeight: 36,
        letterSpacing: -0.8,
        fontFamily: FONT_FAMILIES.sansExtraBold,
    },
    h2: {
        fontSize: 22,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 28,
        letterSpacing: -0.4,
        fontFamily: FONT_FAMILIES.sansBold,
    },
    h3: {
        fontSize: 17,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 23,
        letterSpacing: -0.2,
        fontFamily: FONT_FAMILIES.sansBold,
    },
    body: {
        fontSize: 15,
        fontWeight: '400' as TextStyle['fontWeight'],
        lineHeight: 22,
        fontFamily: FONT_FAMILIES.sansRegular,
    },
    bodyStrong: {
        fontSize: 15,
        fontWeight: '600' as TextStyle['fontWeight'],
        lineHeight: 22,
        fontFamily: FONT_FAMILIES.sansSemiBold,
    },
    // CRED Signature Micro-Eyebrow Tag
    eyebrow: {
        fontSize: 10,
        fontWeight: '800' as TextStyle['fontWeight'],
        lineHeight: 13,
        letterSpacing: 1.6,
        textTransform: 'uppercase' as TextStyle['textTransform'],
        fontFamily: FONT_FAMILIES.sansExtraBold,
    },
    label: {
        fontSize: 11,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 15,
        letterSpacing: 0.8,
        textTransform: 'uppercase' as TextStyle['textTransform'],
        fontFamily: FONT_FAMILIES.sansBold,
    },
    monoVal: {
        fontSize: 16,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 21,
        letterSpacing: 0.4,
        fontFamily: FONT_FAMILIES.sansBold,
    },
    caption: {
        fontSize: 12,
        fontWeight: '500' as TextStyle['fontWeight'],
        lineHeight: 16,
        fontFamily: FONT_FAMILIES.sansMedium,
    },
    // Neo-Brutalist 3D Pop Typography (Zero-Blur Hard Extrusion)
    neo3d: {
        fontSize: 18,
        fontWeight: '800' as TextStyle['fontWeight'],
        fontFamily: FONT_FAMILIES.sansExtraBold,
        letterSpacing: 0.8,
        textShadowColor: '#000000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
    },
    neo3dHero: {
        fontSize: 48,
        fontWeight: '800' as TextStyle['fontWeight'],
        fontFamily: FONT_FAMILIES.serifDisplayBlack,
        letterSpacing: -1,
        textShadowColor: '#000000',
        textShadowOffset: { width: 4, height: 4 },
        textShadowRadius: 0,
    },
    neo3dButton: {
        fontSize: 14,
        fontWeight: '800' as TextStyle['fontWeight'],
        fontFamily: FONT_FAMILIES.sansExtraBold,
        letterSpacing: 1.2,
        textTransform: 'uppercase' as TextStyle['textTransform'],
        textShadowColor: 'rgba(0, 0, 0, 0.35)',
        textShadowOffset: { width: 1.5, height: 1.5 },
        textShadowRadius: 0,
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
    neoBox: 14,
};

// Neo-Brutalist 3D Spatial Architecture
export const NEO_BRUTALISM = {
    buttonDepth: 4,
    buttonDepthLg: 6,
    borderWidth: 2,
    borderWidthThick: 2.5,
    shadowColorDark: '#000000',
    shadowColorLight: '#070709',
    textShadow: {
        sm: {
            textShadowColor: '#000000',
            textShadowOffset: { width: 1.5, height: 1.5 },
            textShadowRadius: 0,
        },
        md: {
            textShadowColor: '#000000',
            textShadowOffset: { width: 2.5, height: 2.5 },
            textShadowRadius: 0,
        },
        lg: {
            textShadowColor: '#000000',
            textShadowOffset: { width: 4, height: 4 },
            textShadowRadius: 0,
        },
        hero: {
            textShadowColor: '#000000',
            textShadowOffset: { width: 5, height: 5 },
            textShadowRadius: 0,
        },
        lightSm: {
            textShadowColor: '#FFFFFF',
            textShadowOffset: { width: 1.5, height: 1.5 },
            textShadowRadius: 0,
        },
        lightMd: {
            textShadowColor: '#FFFFFF',
            textShadowOffset: { width: 2.5, height: 2.5 },
            textShadowRadius: 0,
        },
    },
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
