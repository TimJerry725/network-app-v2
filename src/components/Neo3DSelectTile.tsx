import React, { useEffect, useRef } from 'react';
import {
    Animated,
    DimensionValue,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from './ThemedText';
import { useAppTheme } from '../hooks/useAppTheme';

export interface Neo3DSelectTileProps {
    label: string;
    sublabel?: string;
    icon?: React.ReactNode;
    isSelected: boolean;
    onPress: () => void;
    width?: DimensionValue;
    height?: number;
    badge?: string;
    style?: ViewStyle;
    activeColor?: string;
    compact?: boolean;
    disabled?: boolean;
}

/**
 * CRED Stark Black & White 3D Tactile Selection Tile with Spring Motion
 * Features:
 * - Fluid spring compression physics (0.94 scale + 3px physical drop)
 * - Animated selection pop on state toggle
 * - Specular top light line reflection
 * - High-contrast stark monochrome aesthetics (pitch black / chalk white)
 * - Haptic response on touch
 */
export function Neo3DSelectTile({
    label,
    sublabel,
    icon,
    isSelected,
    onPress,
    width = '48%',
    height,
    badge,
    style,
    activeColor,
    compact = false,
    disabled = false,
}: Neo3DSelectTileProps) {
    const { colors, isDark } = useAppTheme();
    const primaryWhite = activeColor ?? (isDark ? '#FFFFFF' : '#000000');

    // Motion animation references
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const translateYAnim = useRef(new Animated.Value(isSelected ? 2 : 0)).current;
    const popAnim = useRef(new Animated.Value(1)).current;

    // Spring bounce on selection state change
    useEffect(() => {
        if (isSelected) {
            Animated.sequence([
                Animated.spring(popAnim, {
                    toValue: 1.12,
                    tension: 300,
                    friction: 10,
                    useNativeDriver: true,
                }),
                Animated.spring(popAnim, {
                    toValue: 1.0,
                    tension: 200,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
            Animated.spring(translateYAnim, {
                toValue: 2,
                tension: 250,
                friction: 10,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(translateYAnim, {
                toValue: 0,
                tension: 250,
                friction: 10,
                useNativeDriver: true,
            }).start();
        }
    }, [isSelected, popAnim, translateYAnim]);

    const handlePressIn = () => {
        if (disabled) return;
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 0.94,
                tension: 350,
                friction: 14,
                useNativeDriver: true,
            }),
            Animated.spring(translateYAnim, {
                toValue: 3.5,
                tension: 350,
                friction: 14,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        if (disabled) return;
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 220,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.spring(translateYAnim, {
                toValue: isSelected ? 2 : 0,
                tension: 220,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePress = () => {
        if (disabled) return;
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onPress();
    };

    return (
        <Animated.View
            style={[
                styles.touchable,
                { width },
                {
                    transform: [
                        { scale: scaleAnim },
                        { translateY: translateYAnim },
                    ],
                },
                style,
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
                disabled={disabled}
            >
                <View
                    style={[
                        styles.podBase,
                        compact ? styles.podCompact : styles.podDefault,
                        height ? { height, minHeight: height } : null,
                        isSelected ? [
                            styles.podActive,
                            {
                                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                borderColor: isDark ? '#FFFFFF' : '#000000',
                                borderBottomColor: isDark ? '#B0B0B8' : '#222228',
                                borderBottomWidth: 2,
                            },
                        ] : [
                            styles.podInactive,
                            {
                                backgroundColor: isDark ? '#111115' : '#F6F6F8',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)',
                                borderBottomColor: isDark ? '#050508' : '#C8C8CC',
                                borderBottomWidth: 3.5,
                            },
                        ],
                    ]}
                >
                    {/* Inset Specular Top Light Reflection Line */}
                    <View
                        style={[
                            styles.specularTopLine,
                            {
                                backgroundColor: isSelected
                                    ? 'rgba(255, 255, 255, 0.95)'
                                    : isDark
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'rgba(255, 255, 255, 0.7)',
                            },
                        ]}
                    />

                    {/* Badge Tag (e.g. FAST, RECOMMENDED) */}
                    {badge && (
                        <View
                            style={[
                                styles.badgePill,
                                {
                                    backgroundColor: isSelected
                                        ? 'rgba(0, 0, 0, 0.12)'
                                        : isDark
                                        ? 'rgba(255, 255, 255, 0.08)'
                                        : 'rgba(0, 0, 0, 0.06)',
                                    borderColor: isSelected
                                        ? 'rgba(0, 0, 0, 0.2)'
                                        : isDark
                                        ? 'rgba(255, 255, 255, 0.15)'
                                        : 'rgba(0, 0, 0, 0.1)',
                                },
                            ]}
                        >
                            <ThemedText
                                style={[
                                    styles.badgeText,
                                    {
                                        color: isSelected
                                            ? '#000000'
                                            : isDark
                                            ? '#FFFFFF'
                                            : '#000000',
                                    },
                                ]}
                            >
                                {badge}
                            </ThemedText>
                        </View>
                    )}

                    {/* Icon Container with Spring Pop Animation */}
                    {icon && (
                        <Animated.View
                            style={[
                                styles.iconWrap,
                                { transform: [{ scale: popAnim }] },
                            ]}
                        >
                            {icon}
                        </Animated.View>
                    )}

                    {/* Label */}
                    <ThemedText
                        style={[
                            styles.label,
                            {
                                color: isSelected
                                    ? (isDark ? '#000000' : '#FFFFFF')
                                    : colors.text,
                                fontFamily: isSelected
                                    ? 'RedHatDisplay_800ExtraBold'
                                    : 'RedHatDisplay_600SemiBold',
                                fontWeight: isSelected ? '800' : '600',
                            },
                        ]}
                        numberOfLines={1}
                    >
                        {label}
                    </ThemedText>

                    {/* Sublabel */}
                    {sublabel && (
                        <ThemedText
                            style={[
                                styles.sublabel,
                                {
                                    color: isSelected
                                        ? (isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)')
                                        : colors.textMuted,
                                },
                            ]}
                            numberOfLines={1}
                        >
                            {sublabel}
                        </ThemedText>
                    )}

                    {/* Micro Active Indicator Dot */}
                    {isSelected && (
                        <View
                            style={[
                                styles.activeDot,
                                { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
                            ]}
                        />
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    touchable: {
        marginBottom: 8,
    },
    podBase: {
        borderRadius: 18,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    podDefault: {
        paddingVertical: 14,
        paddingHorizontal: 12,
        minHeight: 88,
    },
    podCompact: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        minHeight: 52,
    },
    podActive: {
        // depresses down slightly
    },
    podInactive: {
        // resting extruded
    },
    specularTopLine: {
        position: 'absolute',
        top: 0,
        left: 12,
        right: 12,
        height: 1,
        borderRadius: 1,
    },
    iconWrap: {
        marginBottom: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 13,
        letterSpacing: 0.3,
        textAlign: 'center',
    },
    sublabel: {
        fontSize: 11,
        marginTop: 2,
        letterSpacing: 0.2,
        textAlign: 'center',
    },
    badgePill: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 0.5,
    },
    badgeText: {
        fontSize: 9,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    activeDot: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
});
