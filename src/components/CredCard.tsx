import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { RADIUS } from '../constants/Tokens';

export interface CredCardProps extends ViewProps {
    children: React.ReactNode;
    variant?: 'default' | 'neon' | 'gold' | 'recessed';
    noPadding?: boolean;
}

/**
 * CRED Double-Bezel (Doppelrand) Card Architecture
 * Outer shell creates the machined hardware chassis with a hairline border.
 * Inner core houses the actual content with concentric corner radius.
 */
export function CredCard({
    children,
    style,
    variant = 'default',
    noPadding = false,
    ...props
}: CredCardProps) {
    const { colors, isDark } = useAppTheme();

    const getBorderColor = () => {
        if (variant === 'neon') return isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.25)';
        if (variant === 'gold') return isDark ? 'rgba(229, 229, 234, 0.35)' : 'rgba(0, 0, 0, 0.2)';
        if (variant === 'recessed') return isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
        return isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)';
    };

    const getBackgroundColor = () => {
        if (variant === 'recessed') return isDark ? '#0A0A0C' : '#F6F6F8';
        return isDark ? '#141418' : '#FFFFFF';
    };

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    padding: noPadding ? 0 : 16,
                },
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: RADIUS.card,
        borderWidth: 1,
    },
});
