import React from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import { ThemedText } from './ThemedText';
import { RADIUS } from '../constants/Tokens';
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
 * CRED Signature Button-in-Button Island CTA
 * Renders a full pill with tactile inner circle icon and high-contrast typography.
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

    const handlePress = (e: any) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onPress?.(e);
    };

    // Color definitions per variant
    const getBgColor = () => {
        if (disabled) return isDark ? '#2C2C30' : '#E2E2E0';
        if (variant === 'neon') return colors.primary; // '#00E575'
        if (variant === 'gold') return colors.accent;  // '#F5A623'
        if (variant === 'danger') return colors.error; // '#FF3B30'
        if (variant === 'outline') return 'transparent';
        return isDark ? '#1C1C22' : '#FFFFFF';
    };

    const getTextColor = () => {
        if (disabled) return isDark ? '#6B6B70' : '#A1A1A6';
        if (variant === 'neon') return '#000000';
        if (variant === 'gold') return '#000000';
        if (variant === 'danger') return '#FFFFFF';
        return isDark ? '#FFFFFF' : '#0A0A0B';
    };

    const getBorderColor = () => {
        if (variant === 'outline') return isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
        if (variant === 'dark') return isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
        return 'transparent';
    };

    const getInnerIconBg = () => {
        if (variant === 'neon' || variant === 'gold') return 'rgba(0, 0, 0, 0.12)';
        if (variant === 'danger') return 'rgba(255, 255, 255, 0.2)';
        return isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
    };

    const textColor = getTextColor();

    return (
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
            activeOpacity={0.85}
            onPress={handlePress}
            disabled={disabled}
            {...props}
        >
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
                                { color: variant === 'neon' || variant === 'gold' ? 'rgba(0,0,0,0.6)' : isDark ? '#8E8E93' : '#636366' },
                            ]}
                        >
                            {subtitle}
                        </ThemedText>
                    )}
                </View>

                {showTrailingIcon && (
                    <View style={[styles.trailingIconCircle, { backgroundColor: getInnerIconBg() }]}>
                        {trailingIcon ?? <ChevronRight size={18} color={textColor} strokeWidth={2.8} />}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    buttonBase: {
        borderRadius: RADIUS.button,
        paddingVertical: 14,
        paddingLeft: 20,
        paddingRight: 10,
        justifyContent: 'center',
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
        fontSize: 15,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    subtitleText: {
        fontSize: 11,
        fontFamily: 'RedHatDisplay_600SemiBold',
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
