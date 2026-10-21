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
import { RetroMascot } from '../../components/RetroMascot';
import { RetroAppIcon } from '../../components/RetroAppIcon';
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
                                  'rgba(59, 130, 246, 0.35)',
                                  'rgba(34, 211, 238, 0.20)',
                                  'rgba(34, 211, 167, 0.10)',
                                  'transparent',
                              ]
                            : [
                                  'rgba(59, 130, 246, 0.20)',
                                  'rgba(34, 211, 238, 0.12)',
                                  'rgba(34, 211, 167, 0.08)',
                                  'transparent',
                              ]
                    }
                    style={styles.glowGradient}
                />
            </Animated.View>

            {/* Central Brand Showcase */}
            <View style={styles.centerSection}>
                {/* Orbital Retro App Icon Badge */}
                <Animated.View
                    style={[
                        styles.appIconBadge,
                        {
                            opacity: logoOpacity,
                            transform: [{ scale: logoScale }],
                        },
                    ]}
                >
                    <RetroAppIcon size={64} />
                </Animated.View>

                {/* Animated Playful Mascot */}
                <Animated.View
                    style={[
                        styles.mascotContainer,
                        {
                            opacity: logoOpacity,
                            transform: [{ scale: logoScale }],
                        },
                    ]}
                >
                    <RetroMascot size={150} expression="happy" animated />
                </Animated.View>

                {/* Subtitle & Tagline */}
                <Animated.View
                    style={[
                        styles.taglineBlock,
                        { opacity: contentOpacity },
                    ]}
                >
                    <ThemedText style={[styles.brandHeadline, { color: colors.text }]}>
                        Charge Forward
                    </ThemedText>
                    <ThemedText style={[styles.brandSubtext, { color: colors.textMuted }]}>
                        Smarter charging for a cleaner tomorrow.
                    </ThemedText>
                    <View style={styles.brandPillTag}>
                        <ThemedText style={styles.brandPillText}>
                            IRIS NETWORK
                        </ThemedText>
                    </View>
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
                                ? 'rgba(59, 130, 246, 0.18)'
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
                        Grid Online • Connecting to Space Station
                    </ThemedText>
                </View>

                {/* Version badge */}
                <ThemedText style={[styles.versionText, { color: colors.textSoft }]}>
                    Playful Retro-Futurism v3.0 • Tap anywhere
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
    appIconBadge: {
        marginBottom: 16,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 18,
        elevation: 8,
    },
    mascotContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    taglineBlock: {
        alignItems: 'center',
    },
    brandHeadline: {
        fontSize: 28,
        fontFamily: FONT_FAMILIES.extraBold,
        letterSpacing: -0.5,
        textAlign: 'center',
        marginBottom: 8,
    },
    brandSubtext: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.medium,
        textAlign: 'center',
        maxWidth: 260,
        marginBottom: 14,
        lineHeight: 18,
    },
    brandPillTag: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: RADIUS.pill,
        backgroundColor: 'rgba(59, 130, 246, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.35)',
    },
    brandPillText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        color: '#22D3EE',
        letterSpacing: 1.5,
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
