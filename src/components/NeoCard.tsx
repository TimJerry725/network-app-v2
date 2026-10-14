import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../hooks/useAppTheme';
import { RADIUS, SHADOWS } from '../constants/Tokens';

interface NeoCardProps extends ViewProps {
    children: React.ReactNode;
    gradientBorder?: boolean;
}

export function NeoCard({ children, style, gradientBorder = false, ...otherProps }: NeoCardProps) {
    const { colors } = useAppTheme();

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: colors.card,
            },
            style
        ]} {...otherProps}>
            {children}
        </View>
    );
}

// Also export as GlassCard for guide compliance
export const GlassCard = NeoCard;

const styles = StyleSheet.create({
    card: {
        borderRadius: RADIUS.cardLg,
        padding: 18,
        borderWidth: 0,
    },
    gradientBorder: {
        borderRadius: RADIUS.cardLg,
    },
    innerContainer: {
        flex: 1,
        borderRadius: RADIUS.cardLg,
        padding: 18,
        borderWidth: 0,
    }
});
