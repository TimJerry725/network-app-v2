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
import { FONT_FAMILIES } from '../constants/Tokens';

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

                                    {/* Solid Glyph with Spring Pop */}
                                    <Animated.View
                                        style={[
                                            styles.layeredIconWrap,
                                            { transform: [{ scale: selectBounce }] },
                                        ]}
                                    >
                                        {getLucideIcon('scan', size + 4, isDark ? '#000000' : '#FFFFFF', true)}
                                    </Animated.View>
                                </View>
                            </View>
                        </>
                    ) : (
                        /* Unselected: Clean Minimal Outlined Icon without surrounding ring border */
                        <View style={styles.heroOutlineRing}>
                            <ScanLine size={size + 4} color={mutedColor} strokeWidth={1.8} />
                        </View>
                    )}

                    {label && (
                        <Text
                            style={[
                                styles.heroLabel,
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

                        {/* Solid Glyph with Spring Pop */}
                        <Animated.View
                            style={[
                                styles.layeredIconWrap,
                                { transform: [{ scale: selectBounce }] },
                            ]}
                        >
                            {selected3DIcon ?? getLucideIcon(name, size, isDark ? '#000000' : '#FFFFFF', true)}
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
                    /* ── UNSELECTED: OUTLINED ICON (NO BORDER CAPSULE OVER FONTS) ── */
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

    // ── Unselected Base ──
    podOutlineBase: {
        width: 48,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
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
    heroOutlineRing: {
        width: 54,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroLabel: {
        fontSize: 10,
        marginTop: 2,
        letterSpacing: 0.2,
    },
});
