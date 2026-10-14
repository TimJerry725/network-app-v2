import React from 'react';
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
import { RADIUS } from '../constants/Tokens';
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
 * CRED-style Neo-Brutalist 3D Tactile Icon
 * Features physical bevel extrusion, inset specular highlights, dual-layer icon depth,
 * and mechanical press physics with haptics.
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
    const primaryNeon = activeColor ?? colors.primary; // '#00E575'
    const mutedColor = inactiveColor ?? (isDark ? '#7E7E84' : '#8E8E93');

    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(
                isPrimaryAction
                    ? Haptics.ImpactFeedbackStyle.Heavy
                    : Haptics.ImpactFeedbackStyle.Light
            );
        }
        onPress?.();
    };

    // Hero center action button (e.g. Scan)
    if (isPrimaryAction) {
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePress}
                style={[styles.heroButtonOuter, style]}
            >
                {/* 3D Extruded Base Platform */}
                <View
                    style={[
                        styles.heroPlatform3D,
                        {
                            backgroundColor: '#008F47',
                            borderColor: '#006633',
                        },
                    ]}
                >
                    {/* Top Elevated Reactor Core */}
                    <View
                        style={[
                            styles.heroCore3D,
                            {
                                backgroundColor: primaryNeon,
                                borderColor: 'rgba(255, 255, 255, 0.4)',
                            },
                        ]}
                    >
                        {/* 3D Layered Icon (Shadow Layer + Foreground Layer) */}
                        <View style={styles.layeredIconWrap}>
                            <FontAwesome6
                                name={name}
                                size={size + 4}
                                color="rgba(0, 0, 0, 0.35)"
                                style={styles.iconShadowLayer}
                            />
                            <FontAwesome6
                                name={name}
                                size={size + 4}
                                color="#000000"
                                style={styles.iconFrontLayer}
                            />
                        </View>
                    </View>
                </View>

                {label && (
                    <ThemedText
                        style={[
                            styles.heroLabel,
                            { color: isSelected ? primaryNeon : colors.textMuted },
                        ]}
                    >
                        {label}
                    </ThemedText>
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePress}
            style={[styles.podContainer, style]}
        >
            {/* 3D Tactile Pod */}
            <View
                style={[
                    styles.podBase,
                    isSelected ? [
                        styles.podActive,
                        {
                            backgroundColor: isDark ? '#16161B' : '#EFEFED',
                            borderColor: primaryNeon,
                            borderBottomColor: '#008F47',
                            borderBottomWidth: 3,
                        },
                    ] : [
                        styles.podInactive,
                        {
                            backgroundColor: isDark ? '#0F0F12' : '#F6F6F4',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.08)',
                            borderBottomWidth: 2,
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
                                ? 'rgba(0, 229, 117, 0.3)'
                                : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.7)',
                        },
                    ]}
                />

                {/* 3D Layered Icon Representation */}
                <View style={styles.layeredIconWrap}>
                    {/* Shadow Layer for 3D Depth */}
                    {isSelected && (
                        <FontAwesome6
                            name={name}
                            size={size}
                            color="rgba(0, 229, 117, 0.35)"
                            style={styles.iconShadowLayer}
                        />
                    )}
                    {/* Main Icon Layer */}
                    <FontAwesome6
                        name={name}
                        size={size}
                        color={isSelected ? primaryNeon : mutedColor}
                        style={styles.iconFrontLayer}
                    />
                </View>

                {/* Micro Neon Indicator Dot */}
                {isSelected && (
                    <View style={[styles.activeNeonDot, { backgroundColor: primaryNeon }]} />
                )}
            </View>

            {/* Label below pod */}
            {label && (
                <ThemedText
                    style={[
                        styles.podLabel,
                        {
                            color: isSelected ? primaryNeon : mutedColor,
                            fontFamily: isSelected ? 'RedHatDisplay_800ExtraBold' : 'RedHatDisplay_600SemiBold',
                            fontWeight: isSelected ? '800' : '600',
                        },
                    ]}
                >
                    {label}
                </ThemedText>
            )}
        </TouchableOpacity>
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
        // Active 3D elevated state
    },
    podInactive: {
        // Resting subtle state
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
        // crisp front layer
    },
    activeNeonDot: {
        position: 'absolute',
        bottom: 2,
        width: 3.5,
        height: 3.5,
        borderRadius: 2,
    },
    podLabel: {
        fontSize: 10,
        marginTop: 3,
        letterSpacing: 0.2,
    },

    // ── Hero 3D Button (Scan) ──
    heroButtonOuter: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -16,
    },
    heroPlatform3D: {
        width: 58,
        height: 58,
        borderRadius: 29,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    heroCore3D: {
        width: 54,
        height: 52,
        borderRadius: 26,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroLabel: {
        fontSize: 10,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        marginTop: 2,
        letterSpacing: 0.2,
    },
});
