import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { ThemedText } from './ThemedText';
import { RADIUS } from '../constants/Tokens';
import { useAppTheme } from '../hooks/useAppTheme';

export interface CredBadgeProps extends ViewProps {
    label: string;
    variant?: 'neon' | 'gold' | 'dark' | 'muted';
    dot?: boolean;
    icon?: React.ReactNode;
}

/**
 * CRED Signature Micro-Eyebrow Badge
 * Precision uppercase tracking with optional glowing pulse dot.
 */
export function CredBadge({
    label,
    variant = 'dark',
    dot = false,
    icon,
    style,
    ...props
}: CredBadgeProps) {
    const { colors, isDark } = useAppTheme();

    const getBgColor = () => {
        if (variant === 'neon') return isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)';
        if (variant === 'gold') return isDark ? 'rgba(229, 229, 234, 0.14)' : 'rgba(0, 0, 0, 0.08)';
        if (variant === 'muted') return isDark ? '#1C1C22' : '#F1F1EF';
        return isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
    };

    const getTextColor = () => {
        if (variant === 'neon') return colors.primary;
        if (variant === 'gold') return colors.accent;
        if (variant === 'muted') return isDark ? '#8E8E93' : '#6B6B70';
        return isDark ? '#FFFFFF' : '#0A0A0B';
    };

    const getBorderColor = () => {
        if (variant === 'neon') return isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.2)';
        if (variant === 'gold') return isDark ? 'rgba(229, 229, 234, 0.28)' : 'rgba(0, 0, 0, 0.2)';
        return isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    };

    const getDotColor = () => {
        if (variant === 'neon') return colors.primary;
        if (variant === 'gold') return colors.accent;
        return isDark ? '#FFFFFF' : '#0A0A0B';
    };

    return (
        <View
            style={[
                styles.badgeBase,
                {
                    backgroundColor: getBgColor(),
                    borderColor: getBorderColor(),
                },
                style,
            ]}
            {...props}
        >
            {dot && <View style={[styles.statusDot, { backgroundColor: getDotColor() }]} />}
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <ThemedText style={[styles.badgeText, { color: getTextColor() }]}>
                {label}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    badgeBase: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    iconWrap: {
        marginRight: 5,
    },
    badgeText: {
        fontSize: 10,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
});
