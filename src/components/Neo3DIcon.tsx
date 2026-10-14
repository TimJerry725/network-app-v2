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
import { FONT_FAMILIES } from '../constants/Tokens';

export interface Neo3DIconProps {
    name?: string;
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
 * CRED Modern Bottom Navigation Bar Icon Component
 * 
 * Features:
 * - Unselected: Clean, frameless, solid icon with zero outlines or borders
 * - Selected: Elevates into a 3D Neo-Brutalist tactile pod with physical depth,
 *   3D layered glyph extrusion, specular highlight, and spring physics.
 */
export function Neo3DIcon({
    name = 'circle',
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
    const mutedColor = inactiveColor ?? (isDark ? '#8E8E93' : '#6B6B70');

    // Motion animation references
    const pressScale = useRef(new Animated.Value(1)).current;
    const pressY = useRef(new Animated.Value(isSelected ? 2 : 0)).current;
    const selectBounce = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(0.88)).current;

    // Ambient breathing pulse for hero center Scan reactor
    useEffect(() => {
        if (!isPrimaryAction || !isSelected) return;
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.06,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.88,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [isPrimaryAction, isSelected, pulseAnim]);

    // Spring bounce on selection transition
    useEffect(() => {
        if (isSelected) {
            Animated.sequence([
                Animated.spring(selectBounce, {
                    toValue: 1.18,
                    tension: 320,
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
                tension: 250,
                friction: 12,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(pressY, {
                toValue: 0,
                tension: 250,
                friction: 12,
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

    // ── HERO CENTER ACTION BUTTON (SCAN) ──
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
                    {isSelected ? (
                        /* Selected: Full 3D Elevated Reactor Core */
                        <>
                            {/* Ambient Pulsing Halo */}
                            <Animated.View
                                style={[
                                    styles.heroHalo,
                                    {
                                        transform: [{ scale: pulseAnim }],
                                        opacity: isDark ? 0.3 : 0.15,
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
                                {/* Top Elevated 3D Reactor Core */}
                                <View
                                    style={[
                                        styles.heroCore3D,
                                        {
                                            backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                            borderColor: 'rgba(255, 255, 255, 0.4)',
                                        },
                                    ]}
                                >
                                    <View style={styles.specularTopLine} />

                                    {/* 3D Layered Solid Glyph (Shadow + Solid Foreground) */}
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
                                            solid
                                        />
                                        <FontAwesome6
                                            name={name}
                                            size={size + 4}
                                            color={isDark ? '#000000' : '#FFFFFF'}
                                            style={styles.iconFrontLayer}
                                            solid
                                        />
                                    </Animated.View>
                                </View>
                            </View>
                        </>
                    ) : (
                        /* Unselected: Clean, Solid, Frameless Hero Button (Zero Outlines) */
                        <View
                            style={[
                                styles.heroUnselectedWrap,
                                {
                                    backgroundColor: isDark ? '#16161B' : '#ECECF0',
                                },
                            ]}
                        >
                            <FontAwesome6
                                name={name}
                                size={size + 4}
                                color={mutedColor}
                                solid
                            />
                        </View>
                    )}

                    {label && (
                        <ThemedText
                            style={[
                                styles.heroLabel,
                                {
                                    color: isSelected ? primaryWhite : mutedColor,
                                    fontFamily: isSelected
                                        ? FONT_FAMILIES.sansExtraBold
                                        : FONT_FAMILIES.sansSemiBold,
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

    // ── STANDARD TAB BUTTONS (MAP, EXPLORE, FAVORITE, SESSIONS) ──
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
                style={styles.touchableArea}
            >
                {isSelected ? (
                    /* ── SELECTED: 3D NEO-BRUTALIST TACTILE POD ── */
                    <View
                        style={[
                            styles.pod3DBase,
                            {
                                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                borderColor: isDark ? '#FFFFFF' : '#000000',
                                borderBottomColor: isDark ? '#A0A0A8' : '#222228',
                                borderBottomWidth: 3.5, // Physical 3D bottom bevel
                            },
                        ]}
                    >
                        {/* Inset Specular Top Light Line */}
                        <View
                            style={[
                                styles.specularTopLine,
                                {
                                    backgroundColor: isDark
                                        ? 'rgba(255, 255, 255, 0.95)'
                                        : 'rgba(255, 255, 255, 0.7)',
                                },
                            ]}
                        />

                        {/* 3D Layered Solid Glyph (Shadow + Foreground) with Spring Pop */}
                        <Animated.View
                            style={[
                                styles.layeredIconWrap,
                                { transform: [{ scale: selectBounce }] },
                            ]}
                        >
                            {/* Offset shadow layer for 3D depth */}
                            <FontAwesome6
                                name={name}
                                size={size}
                                color="rgba(0, 0, 0, 0.28)"
                                style={styles.iconShadowLayer}
                                solid
                            />
                            {/* Solid foreground layer */}
                            <FontAwesome6
                                name={name}
                                size={size}
                                color={isDark ? '#000000' : '#FFFFFF'}
                                style={styles.iconFrontLayer}
                                solid
                            />
                        </Animated.View>

                        {/* Micro Active Indicator Dot */}
                        <View
                            style={[
                                styles.activeDot,
                                { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
                            ]}
                        />
                    </View>
                ) : (
                    /* ── UNSELECTED: CLEAN SOLID ICON (ZERO OUTLINE BORDERS) ── */
                    <View style={styles.podUnselectedBase}>
                        <FontAwesome6
                            name={name}
                            size={size + 1}
                            color={mutedColor}
                            solid
                        />
                    </View>
                )}

                {/* Label below icon */}
                {label && (
                    <ThemedText
                        style={[
                            styles.podLabel,
                            {
                                color: isSelected ? primaryWhite : mutedColor,
                                fontFamily: isSelected
                                    ? FONT_FAMILIES.sansExtraBold
                                    : FONT_FAMILIES.sansSemiBold,
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
    touchableArea: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Selected 3D Neo-Brutalist Pod ──
    pod3DBase: {
        width: 50,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        position: 'relative',
        overflow: 'hidden',
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

    // ── Unselected Clean Solid Base (Zero Outline) ──
    podUnselectedBase: {
        width: 48,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderWidth: 0,
    },

    podLabel: {
        fontSize: 10,
        marginTop: 3,
        letterSpacing: 0.2,
        textAlign: 'center',
    },

    // ── Hero 3D Center Button (Scan) ──
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
    // Unselected Hero Center Button (Frameless, Zero Outline)
    heroUnselectedWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0,
    },
    heroLabel: {
        fontSize: 10,
        marginTop: 2,
        letterSpacing: 0.2,
    },
});
