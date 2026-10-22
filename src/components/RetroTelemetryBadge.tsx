import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedText } from './ThemedText';
import { FONT_FAMILIES, RADIUS } from '../constants/Tokens';
import { useAppTheme } from '../hooks/useAppTheme';

export interface RetroTelemetryBadgeProps {
    label: string;
    value?: string;
    icon?: React.ReactNode;
    variant?: 'cyan' | 'mint' | 'yellow' | 'blue' | 'slate';
    size?: 'sm' | 'md';
    style?: StyleProp<ViewStyle>;
}

const BADGE_THEMES = {
    cyan: {
        bg: 'rgba(34, 211, 238, 0.12)',
        border: 'rgba(34, 211, 238, 0.35)',
        text: '#22D3EE',
    },
    mint: {
        bg: 'rgba(34, 211, 167, 0.12)',
        border: 'rgba(34, 211, 167, 0.35)',
        text: '#22D3A7',
    },
    yellow: {
        bg: 'rgba(251, 191, 36, 0.12)',
        border: 'rgba(251, 191, 36, 0.35)',
        text: '#FBBF24',
    },
    blue: {
        bg: 'rgba(59, 130, 246, 0.14)',
        border: 'rgba(59, 130, 246, 0.35)',
        text: '#60A5FA',
    },
    slate: {
        bg: 'rgba(100, 116, 139, 0.15)',
        border: 'rgba(100, 116, 139, 0.3)',
        text: '#B7C8E2',
    },
};

/**
 * RetroTelemetryBadge - Cockpit Instrument Technical Pill
 * Used for power (kW), tariffs (₹), connector specs, and hardware tags.
 */
export function RetroTelemetryBadge({
    label,
    value,
    icon,
    variant = 'cyan',
    size = 'md',
    style,
}: RetroTelemetryBadgeProps) {
    const theme = BADGE_THEMES[variant] || BADGE_THEMES.cyan;
    const isSm = size === 'sm';

    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: theme.bg,
                    borderColor: theme.border,
                    paddingHorizontal: isSm ? 6 : 8,
                    paddingVertical: isSm ? 2 : 4,
                },
                style,
            ]}
        >
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <ThemedText
                style={[
                    styles.labelText,
                    {
                        color: theme.text,
                        fontSize: isSm ? 9 : 11,
                    },
                ]}
            >
                {label}
            </ThemedText>
            {value ? (
                <ThemedText
                    style={[
                        styles.valueText,
                        {
                            color: theme.text,
                            fontSize: isSm ? 9 : 11,
                        },
                    ]}
                >
                    {value}
                </ThemedText>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: RADIUS.chip,
        borderWidth: 1,
        gap: 4,
    },
    iconWrap: {
        marginRight: 1,
    },
    labelText: {
        fontFamily: FONT_FAMILIES.monoVal,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    valueText: {
        fontFamily: FONT_FAMILIES.monoVal,
        fontWeight: '800',
    },
});

export default RetroTelemetryBadge;
