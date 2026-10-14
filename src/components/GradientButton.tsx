import React from 'react';
import { StyleSheet, TouchableOpacity, TouchableOpacityProps, Text, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../hooks/useAppTheme';
import { FONTS, RADIUS, SHADOWS } from '../constants/Tokens';

interface GradientButtonProps extends TouchableOpacityProps {
    title: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
}

export function GradientButton({
    title,
    icon,
    style,
    variant = 'primary',
    disabled,
    onPress,
    ...props
}: GradientButtonProps) {
    const { colors } = useAppTheme();
    const isSecondary = variant === 'secondary';
    const isDanger = variant === 'danger';

    const handlePress = (e: any) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onPress?.(e);
    };

    if (isDanger) {
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.container, disabled && styles.disabled, style]}
                disabled={disabled}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={handlePress}
                {...props}
            >
                <View style={[styles.danger, { backgroundColor: colors.error }]}>
                    {icon}
                    <Text style={[styles.text, icon ? { marginLeft: 8 } : undefined]}>{title}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.container, disabled && styles.disabled, style]}
            disabled={disabled}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={handlePress}
            {...props}
        >
            {isSecondary ? (
                <View style={[styles.secondary, { backgroundColor: colors.primarySoft }]}>
                    {icon}
                    <Text style={[styles.secondaryText, { color: colors.primaryStrong }, icon ? { marginLeft: 8 } : undefined]}>{title}</Text>
                </View>
            ) : (
                <LinearGradient
                    colors={colors.primaryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradient}
                >
                    {icon}
                    <Text style={[styles.text, icon ? { marginLeft: 8 } : undefined]}>{title}</Text>
                </LinearGradient>
            )}
        </TouchableOpacity>
    );
}

// Also export as NeonButton for guide compliance
export const NeonButton = GradientButton;

const styles = StyleSheet.create({
    container: {
        borderRadius: RADIUS.button,
    },
    disabled: {
        opacity: 0.6,
    },
    gradient: {
        minHeight: 56,
        paddingHorizontal: 24,
        borderRadius: RADIUS.button,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondary: {
        minHeight: 56,
        paddingHorizontal: 24,
        borderRadius: RADIUS.button,
        borderWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    danger: {
        minHeight: 56,
        paddingHorizontal: 24,
        borderRadius: RADIUS.button,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#FFFFFF',
        ...FONTS.h3,
    },
    secondaryText: {
        ...FONTS.h3,
    },
});
