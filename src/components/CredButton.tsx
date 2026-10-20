import React, { useRef } from 'react';
import {
    Animated,
    Platform,
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ArrowUpRight, ChevronRight } from 'lucide-react-native';
import { FONT_FAMILIES, RADIUS } from '../constants/Tokens';
import { useAppTheme } from '../hooks/useAppTheme';

export interface CredButtonProps extends TouchableOpacityProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'tertiary' | 'neon' | 'gold' | 'coral' | 'mint' | 'lavender' | 'dark' | 'outline' | 'danger';
    showTrailingIcon?: boolean;
    trailingIcon?: React.ReactNode;
    depth?: number;
    containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Chat-Style Minimal Capsule Button with Nested Circular Trailing Icon ( ↗ )
 * 
 * Features:
 * - Fluid capsule geometry with continuous pill curves
 * - Nested "Button-in-Button" circular trailing icon (ArrowUpRight / Custom)
 * - Micro-spring scale feedback on touch (scale 0.97)
 * - Zero harsh 3D offset drop-plates
 */
export function CredButton({
    title,
    subtitle,
    icon,
    variant = 'primary',
    showTrailingIcon = false,
    trailingIcon,
    style,
    containerStyle,
    onPress,
    disabled,
    ...props
}: CredButtonProps) {
    const { colors, isDark } = useAppTheme();

    // Smooth Spring Scale Motion
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (disabled) return;
        Animated.spring(scaleAnim, {
            toValue: 0.965,
            tension: 400,
            friction: 14,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        if (disabled) return;
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 300,
            friction: 12,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = (e: any) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.(e);
    };

    // ── Face & Text Colors (Unified 3-Color Theory: Primary Ice Blue, Secondary Coral, Tertiary Mint) ──
    const getBgColor = () => {
        if (disabled) return isDark ? '#1F2128' : '#E5E7EB';
        if (variant === 'secondary' || variant === 'coral') return colors.secondary;
        if (variant === 'tertiary' || variant === 'mint') return colors.tertiary;
        if (variant === 'neon') return '#FFFFFF';
        if (variant === 'danger') return '#FF453A';
        if (variant === 'dark') return isDark ? '#141418' : '#141418';
        if (variant === 'outline') return isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
        return colors.primary;
    };

    const getTextColor = () => {
        if (disabled) return isDark ? '#6B7280' : '#9CA3AF';
        if (variant === 'neon') return '#0D0E13';
        if (variant === 'secondary' || variant === 'coral' || variant === 'danger' || variant === 'dark') return '#FFFFFF';
        if (variant === 'tertiary' || variant === 'mint') return '#0A0D14';
        if (variant === 'outline') return isDark ? '#FFFFFF' : '#0D0E13';
        return isDark ? '#0A0D14' : '#FFFFFF';
    };

    const getBorderColor = () => {
        if (variant === 'dark') return isDark ? 'rgba(255, 255, 255, 0.25)' : '#000000';
        if (variant === 'outline') return isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)';
        return 'transparent';
    };

    const getTrailingCircleBg = () => {
        if (variant === 'neon') return 'rgba(0, 0, 0, 0.08)';
        if (variant === 'dark') return 'rgba(255, 255, 255, 0.12)';
        if (variant === 'outline') return isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)';
        return 'rgba(0, 0, 0, 0.14)';
    };

    const textColor = getTextColor();

    return (
        <View style={[styles.outerWrapper, containerStyle]}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handlePress}
                    disabled={disabled}
                    style={[
                        styles.capsuleChassis,
                        {
                            backgroundColor: getBgColor(),
                            borderColor: getBorderColor(),
                        },
                        style,
                    ]}
                    {...props}
                >
                    {/* Left Leading Icon */}
                    {icon && <View style={styles.leadingIconSlot}>{icon}</View>}

                    {/* Button Text Hierarchy */}
                    <View style={styles.textContainer}>
                        <Text
                            style={[
                                styles.title,
                                {
                                    color: textColor,
                                    letterSpacing: 0.4,
                                },
                            ]}
                            numberOfLines={1}
                        >
                            {title}
                        </Text>
                        {subtitle ? (
                            <Text
                                style={[
                                    styles.subtitle,
                                    { color: textColor, opacity: 0.72 },
                                ]}
                                numberOfLines={1}
                            >
                                {subtitle}
                            </Text>
                        ) : null}
                    </View>

                    {/* Nested Button-in-Button Trailing Action Icon ( ↗ ) */}
                    {showTrailingIcon && (
                        <View
                            style={[
                                styles.trailingCircle,
                                { backgroundColor: getTrailingCircleBg() },
                            ]}
                        >
                            {trailingIcon ? (
                                trailingIcon
                            ) : (
                                <ArrowUpRight size={16} color={textColor} strokeWidth={2.4} />
                            )}
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerWrapper: {
        width: '100%',
    },
    capsuleChassis: {
        width: '100%',
        minHeight: 52,
        borderRadius: RADIUS.button,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    leadingIconSlot: {
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 14,
        fontFamily: FONT_FAMILIES.sansExtraBold,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
        marginTop: 1,
    },
    trailingCircle: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
});
