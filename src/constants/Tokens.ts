import { StyleSheet, TextStyle } from 'react-native';

// Modern Montserrat Font Stack (Single-Lined, Clean, Solid Geometric Grotesque)
export const FONT_FAMILIES = {
    regular: 'Montserrat_400Regular',
    medium: 'Montserrat_500Medium',
    semiBold: 'Montserrat_600SemiBold',
    bold: 'Montserrat_700Bold',
    extraBold: 'Montserrat_800ExtraBold',
    black: 'Montserrat_900Black',

    // Grotesque Aliases
    sansRegular: 'Montserrat_400Regular',
    sansMedium: 'Montserrat_500Medium',
    sansSemiBold: 'Montserrat_600SemiBold',
    sansBold: 'Montserrat_700Bold',
    sansExtraBold: 'Montserrat_800ExtraBold',

    // Pure Montserrat for headings/display (No double-lined/inline serif fonts)
    serifDisplay: 'Montserrat_800ExtraBold',
    serifDisplayBlack: 'Montserrat_900Black',
    serifHeading: 'Montserrat_800ExtraBold',
    serifExtraBold: 'Montserrat_900Black',
};

// Typography tokens with Montserrat hierarchy
export const FONTS = {
    // Massive Hero Numbers (Battery %, Amount, Speeds)
    display: {
        fontSize: 42,
        fontWeight: '900' as TextStyle['fontWeight'],
        lineHeight: 48,
        letterSpacing: -1,
        fontFamily: FONT_FAMILIES.black,
    },
    heroStat: {
        fontSize: 36,
        fontWeight: '800' as TextStyle['fontWeight'],
        lineHeight: 42,
        letterSpacing: -0.8,
        fontFamily: FONT_FAMILIES.extraBold,
    },
    editorialTitle: {
        fontSize: 26,
        fontWeight: '800' as TextStyle['fontWeight'],
        lineHeight: 32,
        letterSpacing: -0.5,
        fontFamily: FONT_FAMILIES.extraBold,
    },
    h1: {
        fontSize: 28,
        fontWeight: '800' as TextStyle['fontWeight'],
        lineHeight: 34,
        letterSpacing: -0.6,
        fontFamily: FONT_FAMILIES.extraBold,
    },
    h2: {
        fontSize: 22,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 28,
        letterSpacing: -0.3,
        fontFamily: FONT_FAMILIES.bold,
    },
    h3: {
        fontSize: 17,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 23,
        letterSpacing: -0.2,
        fontFamily: FONT_FAMILIES.bold,
    },
    body: {
        fontSize: 15,
        fontWeight: '400' as TextStyle['fontWeight'],
        lineHeight: 22,
        fontFamily: FONT_FAMILIES.regular,
    },
    bodyStrong: {
        fontSize: 15,
        fontWeight: '600' as TextStyle['fontWeight'],
        lineHeight: 22,
        fontFamily: FONT_FAMILIES.semiBold,
    },
    // Signature Micro-Eyebrow Tag
    eyebrow: {
        fontSize: 10,
        fontWeight: '800' as TextStyle['fontWeight'],
        lineHeight: 13,
        letterSpacing: 1.4,
        textTransform: 'uppercase' as TextStyle['textTransform'],
        fontFamily: FONT_FAMILIES.extraBold,
    },
    label: {
        fontSize: 11,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 15,
        letterSpacing: 0.8,
        textTransform: 'uppercase' as TextStyle['textTransform'],
        fontFamily: FONT_FAMILIES.bold,
    },
    monoVal: {
        fontSize: 16,
        fontWeight: '700' as TextStyle['fontWeight'],
        lineHeight: 21,
        letterSpacing: 0.2,
        fontFamily: FONT_FAMILIES.bold,
    },
    caption: {
        fontSize: 12,
        fontWeight: '500' as TextStyle['fontWeight'],
        lineHeight: 16,
        fontFamily: FONT_FAMILIES.medium,
    },
    // Solid, Punchy Montserrat Headings (Clean single-line)
    neo3d: {
        fontSize: 18,
        fontWeight: '800' as TextStyle['fontWeight'],
        fontFamily: FONT_FAMILIES.extraBold,
        letterSpacing: 0.5,
    },
    neo3dHero: {
        fontSize: 48,
        fontWeight: '900' as TextStyle['fontWeight'],
        fontFamily: FONT_FAMILIES.black,
        letterSpacing: -1,
    },
    neo3dButton: {
        fontSize: 14,
        fontWeight: '800' as TextStyle['fontWeight'],
        fontFamily: FONT_FAMILIES.extraBold,
        letterSpacing: 1.2,
        textTransform: 'uppercase' as TextStyle['textTransform'],
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

// Radius tokens following UX Concentric Scale (Inner Radius = Outer Radius - Padding)
export const RADIUS = {
    badge: 8,
    chip: 10,
    button: 14,
    input: 14,
    tile: 16,
    squircle: 18,
    card: 22,
    cardLg: 24,
    bezelOuter: 24,
    bezelInner: 16,
    bottomSheet: 28,
    modal: 24,
    pill: 9999,
    circle: 9999,

    // Aliases for backward compatibility
    neoBox: 18,
};

// Minimal Smooth Architecture (Replaces 3D Neo-Brutalism with Soft Modern Touch)
export const NEO_BRUTALISM = {
    buttonDepth: 0,
    buttonDepthLg: 0,
    borderWidth: 0,
    borderWidthThick: 1,
    shadowColorDark: 'transparent',
    shadowColorLight: 'transparent',
    textShadow: {
        sm: {
            textShadowColor: 'transparent',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 0,
        },
        md: {
            textShadowColor: 'transparent',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 0,
        },
        lg: {
            textShadowColor: 'transparent',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 0,
        },
        hero: {
            textShadowColor: 'transparent',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 0,
        },
        lightSm: {
            textShadowColor: 'transparent',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 0,
        },
        lightMd: {
            textShadowColor: 'transparent',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 0,
        },
    },
};

// Soft Squircle Nested Architecture Styles
export const CRED_BEZEL = StyleSheet.create({
    outerShell: {
        borderRadius: RADIUS.bezelOuter,
        padding: 2,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: '#16171E',
    },
    innerCore: {
        borderRadius: RADIUS.bezelInner,
        padding: 16,
        backgroundColor: '#1A1B23',
        borderWidth: 0,
    },
    neonGlowBorder: {
        borderColor: 'rgba(16, 185, 129, 0.35)',
    },
    goldGlowBorder: {
        borderColor: 'rgba(255, 192, 67, 0.35)',
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
