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
        if (variant === 'neon') return 'rgba(0, 229, 117, 0.35)';
        if (variant === 'gold') return 'rgba(245, 166, 35, 0.35)';
        return isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
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
