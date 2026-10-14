import React, { useRef } from 'react';
import {
    Animated,
    Platform,
    StyleSheet,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import { ThemedText } from './ThemedText';
import { FONT_FAMILIES, RADIUS } from '../constants/Tokens';
import { useAppTheme } from '../hooks/useAppTheme';

export interface CredButtonProps extends TouchableOpacityProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    variant?: 'neon' | 'gold' | 'dark' | 'outline' | 'danger';
    showTrailingIcon?: boolean;
    trailingIcon?: React.ReactNode;
}

/**
 * CRED Signature Button-in-Button Island CTA with Spring Motion Physics
 * Features high-contrast stark monochrome typography, specular top highlight,
 * and physical spring compression on press.
 */
export function CredButton({
    title,
    subtitle,
    icon,
    variant = 'neon',
    showTrailingIcon = true,
    trailingIcon,
    style,
    onPress,
    disabled,
    ...props
}: CredButtonProps) {
    const { colors, isDark } = useAppTheme();

    // Motion animation values
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const translateYAnim = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
        if (disabled) return;
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 0.96,
                tension: 300,
                friction: 15,
                useNativeDriver: true,
            }),
            Animated.spring(translateYAnim, {
                toValue: 2,
                tension: 300,
                friction: 15,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        if (disabled) return;
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 200,
                friction: 10,
                useNativeDriver: true,
            }),
            Animated.spring(translateYAnim, {
                toValue: 0,
                tension: 200,
                friction: 10,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePress = (e: any) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onPress?.(e);
    };

    // Color definitions for Stark Black & White luxury theme
    const getBgColor = () => {
        if (disabled) return isDark ? '#222227' : '#E2E2E0';
        if (variant === 'neon') return '#FFFFFF'; // Pure Stark White
        if (variant === 'gold') return isDark ? '#E5E5EA' : '#2C2C2E';
        if (variant === 'danger') return '#FF453A';
        if (variant === 'outline') return 'transparent';
        return isDark ? '#1C1C22' : '#FFFFFF';
    };

    const getTextColor = () => {
        if (disabled) return isDark ? '#6B6B70' : '#A1A1A6';
        if (variant === 'neon') return '#000000'; // Stark pitch black on pure white
        if (variant === 'gold') return '#000000';
        if (variant === 'danger') return '#FFFFFF';
        return isDark ? '#FFFFFF' : '#0A0A0B';
    };

    const getBorderColor = () => {
        if (variant === 'outline')
            return isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)';
        if (variant === 'dark')
            return isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
        return 'transparent';
    };

    const getInnerIconBg = () => {
        if (variant === 'neon') return 'rgba(0, 0, 0, 0.1)';
        if (variant === 'gold') return 'rgba(0, 0, 0, 0.12)';
        if (variant === 'danger') return 'rgba(255, 255, 255, 0.2)';
        return isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)';
    };

    const textColor = getTextColor();

    return (
        <Animated.View
            style={[
                {
                    transform: [
                        { scale: scaleAnim },
                        { translateY: translateYAnim },
                    ],
                },
            ]}
        >
            <TouchableOpacity
                style={[
                    styles.buttonBase,
                    {
                        backgroundColor: getBgColor(),
                        borderColor: getBorderColor(),
                        borderWidth: getBorderColor() !== 'transparent' ? 1 : 0,
                    },
                    style,
                ]}
                activeOpacity={0.9}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
                disabled={disabled}
                {...props}
            >
                {/* Specular Top Light Reflection */}
                <View
                    style={[
                        styles.specularLine,
                        {
                            backgroundColor:
                                variant === 'neon'
                                    ? 'rgba(255, 255, 255, 0.8)'
                                    : 'rgba(255, 255, 255, 0.12)',
                        },
                    ]}
                />

                <View style={styles.contentRow}>
                    {icon && <View style={styles.leadingIconWrap}>{icon}</View>}

                    <View style={styles.textContainer}>
                        <ThemedText
                            style={[
                                styles.titleText,
                                { color: textColor },
                            ]}
                        >
                            {title}
                        </ThemedText>

                        {subtitle && (
                            <ThemedText
                                style={[
                                    styles.subtitleText,
                                    {
                                        color:
                                            variant === 'neon' || variant === 'gold'
                                                ? 'rgba(0, 0, 0, 0.65)'
                                                : isDark
                                                ? '#8E8E93'
                                                : '#636366',
                                    },
                                ]}
                            >
                                {subtitle}
                            </ThemedText>
                        )}
                    </View>

                    {showTrailingIcon && (
                        <View
                            style={[
                                styles.trailingIconCircle,
                                { backgroundColor: getInnerIconBg() },
                            ]}
                        >
                            {trailingIcon ?? (
                                <ChevronRight
                                    size={18}
                                    color={textColor}
                                    strokeWidth={3}
                                />
                            )}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    buttonBase: {
        borderRadius: RADIUS.button,
        paddingVertical: 14,
        paddingLeft: 20,
        paddingRight: 10,
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    specularLine: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        height: 1,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    leadingIconWrap: {
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    titleText: {
        fontSize: 14,
        fontFamily: FONT_FAMILIES.sansExtraBold,
        fontWeight: '800',
        letterSpacing: 0.6,
    },
    subtitleText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansSemiBold,
        fontWeight: '600',
        marginTop: 1,
    },
    trailingIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
});
