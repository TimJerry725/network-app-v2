import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScanLine } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { getLucideIcon, getOutlinedIcon } from './Neo3DMorphIcon';
import { FONT_FAMILIES, RADIUS } from '../constants/Tokens';

export interface Neo3DIconProps {
    name?: string;
    outlineIcon?: React.ReactNode;
    selected3DIcon?: React.ReactNode;
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
 * Returns a crisp outlined icon from lucide-react-native for unselected resting state
 */
function getFallbackOutlineIcon(name: string, size: number, color: string) {
    if (name === 'bolt-lightning' || name === 'scan') {
        return <ScanLine size={size + 4} color={color} strokeWidth={1.9} />;
    }
    return getOutlinedIcon(name, size + 2, color);
}

/**
 * CRED Dynamic Icon Architecture:
 * - Unselected: Clean, sleek, minimal wireframe OUTLINED icon package
 * - Selected: Transforms into a tactile 3D Neo-Brutalist extruded pod with solid depth
 */
export function Neo3DIcon({
    name = 'circle',
    outlineIcon,
    selected3DIcon,
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
    const mutedColor = inactiveColor ?? (isDark ? '#8E8E93' : '#55555C');

    // Motion animation references
    const pressScale = useRef(new Animated.Value(1)).current;
    const pressY = useRef(new Animated.Value(isSelected ? 2 : 0)).current;
    const selectBounce = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(0.88)).current;

    // Ambient breathing pulse for hero center Scan reactor (always active)
    useEffect(() => {
        if (!isPrimaryAction) return;
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: isSelected ? 1.10 : 1.04,
                    duration: 1400,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.90,
                    duration: 1400,
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

    // ── HERO CENTER ACTION BUTTON (SCAN - SOLID TACTILE 3D BUTTON) ──
    if (isPrimaryAction) {
        const heroBgCore = isDark
            ? (isSelected ? '#FFFFFF' : '#1C1C22')
            : '#000000';
        const heroIconColor = isDark
            ? (isSelected ? '#000000' : '#FFFFFF')
            : '#FFFFFF';
        const borderColor = isDark
            ? (isSelected ? '#00F2FE' : 'rgba(255, 255, 255, 0.18)')
            : '#000000';

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
                    {/* Unified 3D Tactile Disc (No Outer Concentric Outline Rings) */}
                    <View
                        style={[
                            styles.heroCore3D,
                            {
                                backgroundColor: heroBgCore,
                                borderColor: borderColor,
                                borderBottomColor: isDark ? '#050508' : '#000000',
                            },
                        ]}
                    >
                        {/* Solid Glyph with Spring Pop */}
                        <Animated.View
                            style={[
                                styles.layeredIconWrap,
                                { transform: [{ scale: selectBounce }] },
                            ]}
                        >
                            {getLucideIcon('scan', size + 4, heroIconColor, true)}
                        </Animated.View>

                        {/* Active focus pip when currently focused */}
                        {isSelected && (
                            <View
                                style={[
                                    styles.heroActivePip,
                                    { backgroundColor: isDark ? '#00F2FE' : '#FFFFFF' },
                                ]}
                            />
                        )}
                    </View>

                    {label && (
                        <Text
                            style={[
                                styles.heroLabel,
                                {
                                    color: isSelected ? primaryWhite : mutedColor,
                                    fontFamily: isSelected
                                        ? FONT_FAMILIES.bold
                                        : FONT_FAMILIES.semiBold,
                                },
                            ]}
                        >
                            {label}
                        </Text>
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
                    /* ── SELECTED: SOFT SQUIRCLE PILL (REFERENCE IMAGE DOCK) ── */
                    <View
                        style={[
                            styles.pod3DBase,
                            {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
                            },
                        ]}
                    >
                        {/* Solid Glyph with Spring Pop */}
                        <Animated.View
                            style={[
                                styles.layeredIconWrap,
                                { transform: [{ scale: selectBounce }] },
                            ]}
                        >
                            {selected3DIcon ?? getLucideIcon(name, size, isDark ? '#FFFFFF' : '#0D0E13', true)}
                        </Animated.View>
                    </View>
                ) : (
                    /* ── UNSELECTED: OUTLINED ICON ── */
                    <View style={styles.podOutlineBase}>
                        {outlineIcon ?? getFallbackOutlineIcon(name, size, mutedColor)}
                    </View>
                )}

                {/* Label below pod */}
                {label && (
                    <Text
                        style={[
                            styles.podLabel,
                            {
                                color: isSelected ? primaryWhite : mutedColor,
                                fontFamily: isSelected
                                    ? FONT_FAMILIES.bold
                                    : FONT_FAMILIES.medium,
                            },
                        ]}
                    >
                        {label}
                    </Text>
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

    // ── Selected Soft Squircle Pill ──
    pod3DBase: {
        width: 44,
        height: 34,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    layeredIconWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconShadowLayer: {
        position: 'absolute',
        top: 1.5,
        left: 0.5,
    },
    iconFrontLayer: {},
    activeDot: {
        position: 'absolute',
        bottom: 2.5,
        width: 3.5,
        height: 3.5,
        borderRadius: RADIUS.circle,
    },

    // ── Unselected Base ──
    podOutlineBase: {
        width: 44,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },

    podLabel: {
        fontSize: 9.5,
        marginTop: 2,
        letterSpacing: 0.2,
        textAlign: 'center',
    },

    // ── Hero Button (Scan) ──
    heroButtonOuter: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -10,
    },
    heroTouchable: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroCore3D: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    heroOutlineRing: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroActivePip: {
        position: 'absolute',
        bottom: 3.5,
        width: 4,
        height: 4,
        borderRadius: RADIUS.circle,
    },
    heroLabel: {
        fontSize: 9.5,
        marginTop: 2,
        letterSpacing: 0.2,
    },
});
