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
import { ChevronRight } from 'lucide-react-native';
import { FONT_FAMILIES, NEO_BRUTALISM, RADIUS } from '../constants/Tokens';
import { useAppTheme } from '../hooks/useAppTheme';

export interface CredButtonProps extends TouchableOpacityProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    variant?: 'neon' | 'gold' | 'dark' | 'outline' | 'danger';
    showTrailingIcon?: boolean;
    trailingIcon?: React.ReactNode;
    depth?: number;
    containerStyle?: StyleProp<ViewStyle>;
}

/**
 * CRED Signature 3D Neo-Brutalist Tactile Button
 * 
 * Features:
 * - Physical 3D extruded shadow slab with solid contrast border
 * - Mechanical spring depression: button physically translates (+depth, +depth) on press
 * - Hard zero-blur 3D text shadow on typography
 * - Specular top surface reflection
 * - Heavy haptic feedback on actuation
 */
export function CredButton({
    title,
    subtitle,
    icon,
    variant = 'neon',
    showTrailingIcon = true,
    trailingIcon,
    depth = NEO_BRUTALISM.buttonDepth,
    style,
    containerStyle,
    onPress,
    disabled,
    ...props
}: CredButtonProps) {
    const { colors, isDark } = useAppTheme();

    // 3D Press depression animation (translates from 0 to depth)
    const pressAnim = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
        if (disabled) return;
        Animated.spring(pressAnim, {
            toValue: depth,
            tension: 400,
            friction: 14,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        if (disabled) return;
        Animated.spring(pressAnim, {
            toValue: 0,
            tension: 300,
            friction: 10,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = (e: any) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        onPress?.(e);
    };

    // ── Face & Text Colors ──
    const getBgColor = () => {
        if (disabled) return isDark ? '#222227' : '#E2E2E0';
        if (variant === 'neon') return '#FFFFFF'; // Stark chalk white
        if (variant === 'gold') return isDark ? '#E5E5EA' : '#2C2C2E';
        if (variant === 'danger') return '#FF3B30';
        if (variant === 'outline') return isDark ? '#101014' : '#FFFFFF';
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
        if (disabled) return isDark ? '#333338' : '#C7C7CC';
        if (variant === 'neon') return '#000000';
        if (variant === 'danger') return '#000000';
        if (variant === 'outline') return isDark ? '#FFFFFF' : '#000000';
        return isDark ? '#FFFFFF' : '#000000';
    };

    // ── 3D Extruded Shadow Slab Colors ──
    const getShadowBgColor = () => {
        if (disabled) return isDark ? '#16161A' : '#C7C7CC';
        if (variant === 'neon') return '#000000';
        if (variant === 'gold') return '#000000';
        if (variant === 'danger') return '#660000';
        if (variant === 'outline') return isDark ? '#000000' : '#000000';
        return '#000000';
    };

    const getShadowBorderColor = () => {
        if (disabled) return isDark ? '#222227' : '#AEAEB2';
        if (variant === 'outline') return isDark ? 'rgba(255, 255, 255, 0.4)' : '#000000';
        if (variant === 'dark') return isDark ? 'rgba(255, 255, 255, 0.4)' : '#000000';
        return '#000000';
    };

    const getInnerIconBg = () => {
        if (variant === 'neon') return 'rgba(0, 0, 0, 0.08)';
        if (variant === 'gold') return 'rgba(0, 0, 0, 0.12)';
        if (variant === 'danger') return 'rgba(255, 255, 255, 0.2)';
        return isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)';
    };

    const textColor = getTextColor();

    return (
        <View style={[styles.outerWrapper, containerStyle]}>
            {/* 3D Extruded Shadow Slab Base (Anchored) */}
            <View
                style={[
                    styles.shadowSlab,
                    {
                        top: depth,
                        left: depth,
                        borderRadius: RADIUS.button,
                        backgroundColor: getShadowBgColor(),
                        borderColor: getShadowBorderColor(),
                        borderWidth: 2,
                    },
                ]}
            />

            {/* Elevated Face: Physically depresses into the slab when pressed */}
            <Animated.View
                style={[
                    styles.faceWrapper,
                    {
                        marginRight: depth,
                        marginBottom: depth,
                        transform: [
                            { translateX: pressAnim },
                            { translateY: pressAnim },
                        ],
                    },
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.buttonFace,
                        {
                            backgroundColor: getBgColor(),
                            borderColor: getBorderColor(),
                            borderWidth: 2,
                            borderRadius: RADIUS.button,
                        },
                        style,
                    ]}
                    activeOpacity={1}
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
                                        ? 'rgba(255, 255, 255, 0.95)'
                                        : 'rgba(255, 255, 255, 0.16)',
                            },
                        ]}
                    />

                    <View style={styles.contentRow}>
                        {icon && <View style={styles.leadingIconWrap}>{icon}</View>}

                        <View style={styles.textContainer}>
                            <Text
                                style={[
                                    styles.titleText,
                                    {
                                        color: textColor,
                                    },
                                ]}
                            >
                                {title}
                            </Text>

                            {subtitle && (
                                <Text
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
                                </Text>
                            )}
                        </View>

                        {showTrailingIcon && (
                            <View
                                style={[
                                    styles.trailingIconCircle,
                                    {
                                        backgroundColor: getInnerIconBg(),
                                        borderColor: textColor,
                                        borderWidth: 1.5,
                                    },
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
        </View>
    );
}

const styles = StyleSheet.create({
    outerWrapper: {
        position: 'relative',
    },
    shadowSlab: {
        position: 'absolute',
        right: 0,
        bottom: 0,
    },
    faceWrapper: {
        position: 'relative',
    },
    buttonFace: {
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
        height: 1.5,
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
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    subtitleText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansSemiBold,
        fontWeight: '600',
        marginTop: 2,
    },
    trailingIconCircle: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
});
