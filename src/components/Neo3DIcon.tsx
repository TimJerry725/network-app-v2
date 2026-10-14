import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FontAwesome6 } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useAppTheme } from '../hooks/useAppTheme';

export interface Neo3DIconProps {
    name: string;
    label?: string;
    isSelected: boolean;
    onPress?: () => void;
    size?: number;
    activeColor?: string;
    inactiveColor?: string;
    style?: ViewStyle;
    isPrimaryAction?: boolean; // Center hero button (e.g. Scan)
}

/**
 * CRED Stark Black & White 3D Tactile Icon with Motion Spring Physics
 * Features:
 * - Fluid spring scale & depression on touch (0.90 compression + bounce-back)
 * - Animated selection pop when tab is toggled
 * - Continuous ambient breathing pulse on hero Scan reactor core
 * - Dual-layer shadow + foreground 3D glyph depth
 * - Stark monochrome contrast (pure chalk white on pitch obsidian)
 */
export function Neo3DIcon({
    name,
    label,
    isSelected,
    onPress,
    size = 20,
    activeColor,
    inactiveColor,
    style,
    isPrimaryAction = false,
}: Neo3DIconProps) {
    const { colors, isDark } = useAppTheme();
    const primaryWhite = activeColor ?? (isDark ? '#FFFFFF' : '#000000');
    const mutedColor = inactiveColor ?? (isDark ? '#7E7E84' : '#8E8E93');

    // Motion animation references
    const pressScale = useRef(new Animated.Value(1)).current;
    const pressY = useRef(new Animated.Value(isSelected ? 2 : 0)).current;
    const selectBounce = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(0.85)).current;

    // Ambient breathing pulse for center hero reactor
    useEffect(() => {
        if (!isPrimaryAction) return;
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1600,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.85,
                    duration: 1600,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [isPrimaryAction, pulseAnim]);

    // Spring bounce trigger on selection change
    useEffect(() => {
        if (isSelected) {
            Animated.sequence([
                Animated.spring(selectBounce, {
                    toValue: 1.18,
                    tension: 300,
                    friction: 10,
                    useNativeDriver: true,
                }),
                Animated.spring(selectBounce, {
                    toValue: 1.0,
                    tension: 200,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
            Animated.spring(pressY, {
                toValue: 2,
                tension: 200,
                friction: 10,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(pressY, {
                toValue: 0,
                tension: 200,
                friction: 10,
                useNativeDriver: true,
            }).start();
        }
    }, [isSelected, pressY, selectBounce]);

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(pressScale, {
                toValue: 0.9,
                tension: 350,
                friction: 12,
                useNativeDriver: true,
            }),
            Animated.spring(pressY, {
                toValue: 3.5,
                tension: 350,
                friction: 12,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(pressScale, {
                toValue: 1,
                tension: 220,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.spring(pressY, {
                toValue: isSelected ? 2 : 0,
                tension: 220,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(
                isPrimaryAction
                    ? Haptics.ImpactFeedbackStyle.Heavy
                    : Haptics.ImpactFeedbackStyle.Medium
            );
        }
        onPress?.();
    };

    // Hero center action button (Scan)
    if (isPrimaryAction) {
        return (
            <Animated.View
                style={[
                    styles.heroButtonOuter,
                    {
                        transform: [
                            { scale: pressScale },
                            { translateY: pressY },
                        ],
                    },
                    style,
                ]}
            >
                <TouchableOpacity
                    activeOpacity={0.92}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handlePress}
                    style={styles.heroTouchable}
                >
                    {/* Ambient Pulsing Halo */}
                    <Animated.View
                        style={[
                            styles.heroHalo,
                            {
                                transform: [{ scale: pulseAnim }],
                                opacity: isDark ? 0.25 : 0.15,
                                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                            },
                        ]}
                    />

                    {/* 3D Extruded Base Platform */}
                    <View
                        style={[
                            styles.heroPlatform3D,
                            {
                                backgroundColor: isDark ? '#1C1C22' : '#D0D0D5',
                                borderColor: isDark ? '#2C2C35' : '#B0B0B8',
                                borderBottomColor: isDark ? '#050508' : '#8A8A92',
                            },
                        ]}
                    >
                        {/* Top Elevated Stark White Reactor Core */}
                        <View
                            style={[
                                styles.heroCore3D,
                                {
                                    backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                    borderColor: 'rgba(255, 255, 255, 0.4)',
                                },
                            ]}
                        >
                            {/* Top Specular Line */}
                            <View style={styles.specularTopLine} />

                            {/* 3D Layered Icon (Shadow Layer + Stark Black Foreground Layer) */}
                            <Animated.View
                                style={[
                                    styles.layeredIconWrap,
                                    { transform: [{ scale: selectBounce }] },
                                ]}
                            >
                                <FontAwesome6
                                    name={name}
                                    size={size + 4}
                                    color="rgba(0, 0, 0, 0.25)"
                                    style={styles.iconShadowLayer}
                                />
                                <FontAwesome6
                                    name={name}
                                    size={size + 4}
                                    color={isDark ? '#000000' : '#FFFFFF'}
                                    style={styles.iconFrontLayer}
                                />
                            </Animated.View>
                        </View>
                    </View>

                    {label && (
                        <ThemedText
                            style={[
                                styles.heroLabel,
                                { color: isSelected ? primaryWhite : colors.textMuted },
                            ]}
                        >
                            {label}
                        </ThemedText>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            style={[
                styles.podContainer,
                {
                    transform: [
                        { scale: pressScale },
                        { translateY: pressY },
                    ],
                },
                style,
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.88}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
            >
                {/* 3D Tactile Pod */}
                <View
                    style={[
                        styles.podBase,
                        isSelected ? [
                            styles.podActive,
                            {
                                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                borderColor: isDark ? '#FFFFFF' : '#000000',
                                borderBottomColor: isDark ? '#C7C7CD' : '#222226',
                                borderBottomWidth: 2,
                            },
                        ] : [
                            styles.podInactive,
                            {
                                backgroundColor: isDark ? '#111115' : '#F4F4F6',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                borderBottomColor: isDark ? '#040406' : '#C8C8CC',
                                borderBottomWidth: 3,
                            },
                        ],
                    ]}
                >
                    {/* Inset Specular Top Light Line */}
                    <View
                        style={[
                            styles.specularTopLine,
                            {
                                backgroundColor: isSelected
                                    ? 'rgba(255, 255, 255, 0.9)'
                                    : isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.7)',
                            },
                        ]}
                    />

                    {/* 3D Layered Icon Representation with Spring Bounce */}
                    <Animated.View
                        style={[
                            styles.layeredIconWrap,
                            { transform: [{ scale: selectBounce }] },
                        ]}
                    >
                        {isSelected && (
                            <FontAwesome6
                                name={name}
                                size={size}
                                color="rgba(0, 0, 0, 0.2)"
                                style={styles.iconShadowLayer}
                            />
                        )}
                        <FontAwesome6
                            name={name}
                            size={size}
                            color={isSelected ? (isDark ? '#000000' : '#FFFFFF') : mutedColor}
                            style={styles.iconFrontLayer}
                        />
                    </Animated.View>

                    {/* Micro Active Beacon Dot */}
                    {isSelected && (
                        <View
                            style={[
                                styles.activeDot,
                                { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
                            ]}
                        />
                    )}
                </View>

                {/* Label below pod */}
                {label && (
                    <ThemedText
                        style={[
                            styles.podLabel,
                            {
                                color: isSelected ? primaryWhite : mutedColor,
                                fontFamily: isSelected ? 'RedHatDisplay_800ExtraBold' : 'RedHatDisplay_600SemiBold',
                                fontWeight: isSelected ? '800' : '600',
                            },
                        ]}
                    >
                        {label}
                    </ThemedText>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    podContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 2,
    },
    podBase: {
        width: 48,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        position: 'relative',
        overflow: 'hidden',
    },
    podActive: {
        // Active mechanical pressed state
    },
    podInactive: {
        // Resting extruded state
    },
    specularTopLine: {
        position: 'absolute',
        top: 0,
        left: 8,
        right: 8,
        height: 1,
        borderRadius: 1,
    },
    layeredIconWrap: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconShadowLayer: {
        position: 'absolute',
        top: 1.5,
        left: 0.5,
    },
    iconFrontLayer: {
        // crisp foreground layer
    },
    activeDot: {
        position: 'absolute',
        bottom: 2.5,
        width: 3.5,
        height: 3.5,
        borderRadius: 2,
    },
    podLabel: {
        fontSize: 10,
        marginTop: 3,
        letterSpacing: 0.2,
        textAlign: 'center',
    },

    // ── Hero 3D Button (Scan) ──
    heroButtonOuter: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -16,
    },
    heroTouchable: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroHalo: {
        position: 'absolute',
        width: 68,
        height: 68,
        borderRadius: 34,
        top: -5,
    },
    heroPlatform3D: {
        width: 58,
        height: 58,
        borderRadius: 29,
        borderWidth: 2,
        borderBottomWidth: 4,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    heroCore3D: {
        width: 52,
        height: 50,
        borderRadius: 25,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    heroLabel: {
        fontSize: 10,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        marginTop: 2,
        letterSpacing: 0.2,
    },
});
