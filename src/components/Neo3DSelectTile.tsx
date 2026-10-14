import React from 'react';
import {
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
 * CRED-style Neo-Brutalist 3D Tactile Selection Tile
 * Features physical bottom bevel extrusion, specular top light highlight,
 * mechanical depressed physics upon selection, and haptic feedback.
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
    const primaryNeon = activeColor ?? colors.primary; // '#00E575'

    const handlePress = () => {
        if (disabled) return;
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onPress();
    };

    return (
        <TouchableOpacity
            activeOpacity={0.82}
            onPress={handlePress}
            disabled={disabled}
            style={[
                styles.touchable,
                { width },
                isSelected && styles.touchableActive,
                style,
            ]}
        >
            <View
                style={[
                    styles.podBase,
                    compact ? styles.podCompact : styles.podDefault,
                    height ? { height, minHeight: height } : null,
                    isSelected ? [
                        styles.podActive,
                        {
                            backgroundColor: isDark ? '#141418' : '#F0F0EE',
                            borderColor: primaryNeon,
                            borderBottomColor: '#008F47',
                            borderBottomWidth: 2,
                        },
                    ] : [
                        styles.podInactive,
                        {
                            backgroundColor: isDark ? '#101014' : '#F6F6F4',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)',
                            borderBottomColor: isDark ? '#060608' : '#D0D0D0',
                            borderBottomWidth: 3.5,
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
                                ? 'rgba(0, 229, 117, 0.4)'
                                : isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(255, 255, 255, 0.6)',
                        },
                    ]}
                />

                {/* Badge Tag (e.g. Fast, Recommended) */}
                {badge && (
                    <View
                        style={[
                            styles.badgePill,
                            {
                                backgroundColor: isSelected
                                    ? 'rgba(0, 229, 117, 0.15)'
                                    : isDark
                                    ? 'rgba(255, 255, 255, 0.06)'
                                    : 'rgba(0, 0, 0, 0.05)',
                                borderColor: isSelected ? primaryNeon : 'transparent',
                            },
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.badgeText,
                                { color: isSelected ? primaryNeon : colors.textMuted },
                            ]}
                        >
                            {badge}
                        </ThemedText>
                    </View>
                )}

                {/* Icon Container */}
                {icon && <View style={styles.iconWrap}>{icon}</View>}

                {/* Label */}
                <ThemedText
                    style={[
                        styles.label,
                        {
                            color: isSelected ? (isDark ? '#FFFFFF' : '#000000') : colors.text,
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
                            { color: isSelected ? primaryNeon : colors.textMuted },
                        ]}
                        numberOfLines={1}
                    >
                        {sublabel}
                    </ThemedText>
                )}

                {/* Micro Neon Active Dot */}
                {isSelected && (
                    <View
                        style={[
                            styles.activeDot,
                            { backgroundColor: primaryNeon },
                        ]}
                    />
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    touchable: {
        marginBottom: 8,
    },
    touchableActive: {
        transform: [{ translateY: 2 }],
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
