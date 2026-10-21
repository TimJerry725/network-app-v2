import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Sparkles, Zap, ShieldCheck } from 'lucide-react-native';
import { AppLogo } from '../../components/AppLogo';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FONT_FAMILIES, RADIUS } from '../../constants/Tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SplashScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();

    const logoScale = useRef(new Animated.Value(0.85)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 1. Entrance sequence
        Animated.parallel([
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 700,
                useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                tension: 40,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
                toValue: 0.8,
                duration: 900,
                useNativeDriver: true,
            }),
            Animated.timing(contentOpacity, {
                toValue: 1,
                duration: 800,
                delay: 350,
                useNativeDriver: true,
            }),
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: 1800,
                useNativeDriver: false,
            }),
        ]).start();

        // 2. Auto navigate to Login after 2.1 seconds
        const timer = setTimeout(() => {
            if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            navigation.replace('Login');
        }, 2200);

        return () => clearTimeout(timer);
    }, [navigation]);

    const handleSkip = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        navigation.replace('Login');
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={handleSkip}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {/* Ambient Ambient Glow */}
            <Animated.View
                style={[
                    styles.glowWrapper,
                    { opacity: glowOpacity },
                ]}
                pointerEvents="none"
            >
                <LinearGradient
                    colors={
                        isDark
                            ? [
                                  'rgba(56, 189, 248, 0.22)',
                                  'rgba(129, 140, 248, 0.12)',
                                  'rgba(255, 91, 69, 0.08)',
                                  'transparent',
                              ]
                            : [
                                  'rgba(56, 189, 248, 0.16)',
                                  'rgba(16, 185, 129, 0.10)',
                                  'rgba(255, 91, 69, 0.06)',
                                  'transparent',
                              ]
                    }
                    style={styles.glowGradient}
                />
            </Animated.View>

            {/* Central Brand Showcase */}
            <View style={styles.centerSection}>
                {/* Logo with Spring Animation */}
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: logoOpacity,
                            transform: [{ scale: logoScale }],
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.logoGlowRing,
                            {
                                borderColor: isDark
                                    ? 'rgba(56, 189, 248, 0.25)'
                                    : 'rgba(56, 189, 248, 0.18)',
                                backgroundColor: isDark
                                    ? 'rgba(20, 23, 35, 0.65)'
                                    : 'rgba(255, 255, 255, 0.85)',
                            },
                        ]}
                    >
                        {/* Official Vector Logo from assets/logo.svg */}
                        <AppLogo
                            width={220}
                            height={46}
                            useBrandThemeGradient={false}
                        />
                    </View>
                </Animated.View>

                {/* Subtitle & Tagline */}
                <Animated.View
                    style={[
                        styles.taglineBlock,
                        { opacity: contentOpacity },
                    ]}
                >
                    <ThemedText style={[styles.brandHeadline, { color: colors.text }]}>
                        IRIS NETWORK
                    </ThemedText>
                    <ThemedText style={[styles.brandSubtext, { color: colors.textMuted }]}>
                        INTELLIGENT EV CHARGING PROTOCOL
                    </ThemedText>
                </Animated.View>
            </View>

            {/* Bottom Status & Progress Bar */}
            <Animated.View
                style={[
                    styles.bottomSection,
                    { opacity: contentOpacity },
                ]}
            >
                {/* Progress Bar Track */}
                <View
                    style={[
                        styles.progressTrack,
                        {
                            backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.06)',
                        },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.progressBar,
                            {
                                width: progressWidth,
                                backgroundColor: colors.primary,
                            },
                        ]}
                    />
                </View>

                {/* Status Message */}
                <View style={styles.statusRow}>
                    <View style={styles.pulseDot} />
                    <ThemedText style={[styles.statusText, { color: colors.textMuted }]}>
                        Connecting to Iris Charging Grid...
                    </ThemedText>
                </View>

                {/* Version badge */}
                <ThemedText style={[styles.versionText, { color: colors.textSoft }]}>
                    v2.5 • Tap anywhere to continue
                </ThemedText>
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 50,
        paddingHorizontal: 24,
    },
    glowWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.65,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowGradient: {
        width: SCREEN_WIDTH * 1.4,
        height: SCREEN_HEIGHT * 0.65,
        borderRadius: SCREEN_WIDTH * 0.7,
    },
    centerSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    logoGlowRing: {
        paddingHorizontal: 28,
        paddingVertical: 20,
        borderRadius: RADIUS.card,
        borderWidth: 1.2,
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.20,
        shadowRadius: 18,
        elevation: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    taglineBlock: {
        alignItems: 'center',
    },
    brandHeadline: {
        fontSize: 22,
        fontFamily: FONT_FAMILIES.extraBold,
        letterSpacing: 3,
        textAlign: 'center',
        marginBottom: 6,
    },
    brandSubtext: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
        letterSpacing: 2,
        textAlign: 'center',
    },
    bottomSection: {
        width: '100%',
        maxWidth: 280,
        alignItems: 'center',
    },
    progressTrack: {
        width: '100%',
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 14,
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
    },
    statusText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
    },
    versionText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.regular,
        letterSpacing: 0.5,
    },
});
