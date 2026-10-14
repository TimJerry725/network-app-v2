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

    const getOuterBorder = () => {
        if (variant === 'neon') return isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.25)';
        if (variant === 'gold') return isDark ? 'rgba(229, 229, 234, 0.35)' : 'rgba(0, 0, 0, 0.2)';
        return isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)';
    };

    const getInnerBackground = () => {
        if (variant === 'recessed') return isDark ? '#0A0A0C' : '#EFEFED';
        return isDark ? '#121216' : '#FFFFFF';
    };

    return (
        <View
            style={[
                styles.outerShell,
                {
                    backgroundColor: isDark ? '#18181E' : '#F2F2F0',
                    borderColor: getOuterBorder(),
                },
                style,
            ]}
            {...props}
        >
            <View
                style={[
                    styles.innerCore,
                    {
                        backgroundColor: getInnerBackground(),
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                        padding: noPadding ? 0 : 16,
                    },
                ]}
            >
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerShell: {
        borderRadius: RADIUS.bezelOuter,
        padding: 2,
        borderWidth: 1,
    },
    innerCore: {
        borderRadius: RADIUS.bezelInner,
        borderWidth: 1,
        overflow: 'hidden',
    },
});
