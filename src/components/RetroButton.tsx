import React from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import { ThemedText } from './ThemedText';
import { FONT_FAMILIES, RADIUS, SPACING } from '../constants/Tokens';
import { useAppTheme } from '../hooks/useAppTheme';

export interface RetroButtonProps extends TouchableOpacityProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'mint' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    pill?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Playful Retro-Futurism Signature Pill Button
 */
export function RetroButton({
    title,
    subtitle,
    icon,
    trailingIcon,
    variant = 'primary',
    size = 'md',
    loading = false,
    pill = true,
    disabled,
    onPress,
    style,
    containerStyle,
    ...props
}: RetroButtonProps) {
    const { colors, isDark } = useAppTheme();

    const handlePress = (e: any) => {
        if (loading || disabled) return;
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onPress?.(e);
    };

    const getGradientColors = (): [string, string] => {
        if (disabled) {
            return isDark
                ? ['#1E293B', '#0F172A']
                : ['#E2E8F0', '#CBD5E1'];
        }
        switch (variant) {
            case 'mint':
                return ['#22D3A7', '#059669'];
            case 'danger':
                return ['#EF4444', '#DC2626'];
            case 'secondary':
                return isDark
                    ? ['#102548', '#0E2140']
                    : ['#FFFFFF', '#F1F5F9'];
            case 'ghost':
                return ['transparent', 'transparent'];
            case 'primary':
            default:
                return ['#3B82F6', '#2563EB'];
        }
    };

    const getTextColor = (): string => {
        if (disabled) return isDark ? '#64748B' : '#94A3B8';
        if (variant === 'secondary') return isDark ? '#F8FAFC' : '#0B1E3B';
        if (variant === 'ghost') return colors.primary;
        return '#FFFFFF';
    };

    const minHeight = size === 'sm' ? 42 : size === 'lg' ? 58 : 50;
    const paddingHorizontal = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
    const fontSize = size === 'sm' ? 12 : size === 'lg' ? 15 : 13;
    const borderRadius = pill ? RADIUS.pill : RADIUS.button;
    const textColor = getTextColor();

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePress}
            disabled={disabled || loading}
            style={[styles.wrapper, containerStyle]}
            {...props}
        >
            <LinearGradient
                colors={getGradientColors()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.buttonFace,
                    {
                        minHeight,
                        paddingHorizontal,
                        borderRadius,
                        borderColor: variant === 'secondary'
                            ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(0, 0, 0, 0.08)')
                            : 'rgba(255, 255, 255, 0.16)',
                        borderWidth: variant === 'ghost' ? 0 : 1,
                    },
                    style,
                ]}
            >
                {/* Specular Highlight (Subtle Retro Sheen) */}
                {variant !== 'ghost' && !disabled && (
                    <View
                        style={[
                            styles.specularSheen,
                            {
                                borderRadius,
                                backgroundColor: isDark
                                    ? 'rgba(255, 255, 255, 0.18)'
                                    : 'rgba(255, 255, 255, 0.35)',
                            },
                        ]}
                    />
                )}

                {loading ? (
                    <ActivityIndicator size="small" color={textColor} />
                ) : (
                    <View style={styles.contentRow}>
                        {icon && <View style={styles.leadingIcon}>{icon}</View>}

                        <View style={styles.textContainer}>
                            <ThemedText
                                style={[
                                    styles.title,
                                    {
                                        color: textColor,
                                        fontSize,
                                        fontFamily: FONT_FAMILIES.bold,
                                    },
                                ]}
                            >
                                {title}
                            </ThemedText>
                            {subtitle && (
                                <ThemedText
                                    style={[
                                        styles.subtitle,
                                        {
                                            color: isDark ? '#94A3B8' : '#64748B',
                                        },
                                    ]}
                                >
                                    {subtitle}
                                </ThemedText>
                            )}
                        </View>

                        {trailingIcon !== undefined ? (
                            trailingIcon
                        ) : (
                            <View
                                style={[
                                    styles.trailingCircle,
                                    {
                                        backgroundColor:
                                            variant === 'secondary'
                                                ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.04)')
                                                : 'rgba(255, 255, 255, 0.18)',
                                    },
                                ]}
                            >
                                <ChevronRight size={15} color={textColor} strokeWidth={2.5} />
                            </View>
                        )}
                    </View>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        overflow: 'hidden',
    },
    buttonFace: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
        elevation: 6,
    },
    specularSheen: {
        position: 'absolute',
        top: 0,
        left: 12,
        right: 12,
        height: 1.5,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    leadingIcon: {
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        letterSpacing: 0.8,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.medium,
        marginTop: 2,
    },
    trailingCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
});

export default RetroButton;
