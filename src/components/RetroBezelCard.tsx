import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedText } from './ThemedText';
import { FONT_FAMILIES, RADIUS } from '../constants/Tokens';
import { useAppTheme } from '../hooks/useAppTheme';

export interface RetroBezelCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'elevated' | 'recessed' | 'accent' | 'outlined';
    cornerTicks?: boolean;
    technicalHeader?: string;
    statusIndicator?: React.ReactNode;
}

/**
 * RetroBezelCard - Tactile Aerospace Avionics Flight Deck Card
 * Features chamfered mechanical frame, 1px cyan/space border seams,
 * optional technical corner crosshairs (+), and telemetry header labels.
 */
export function RetroBezelCard({
    children,
    style,
    variant = 'elevated',
    cornerTicks = false,
    technicalHeader,
    statusIndicator,
}: RetroBezelCardProps) {
    const { colors, isDark } = useAppTheme();

    const getBgColor = () => {
        if (!isDark) return '#FFFFFF';
        switch (variant) {
            case 'recessed':
                return '#081324';
            case 'accent':
                return 'rgba(59, 130, 246, 0.12)';
            case 'outlined':
                return 'transparent';
            case 'elevated':
            default:
                return '#142C50';
        }
    };

    const getBorderColor = () => {
        if (!isDark) return 'rgba(0,0,0,0.08)';
        switch (variant) {
            case 'accent':
                return 'rgba(34, 211, 238, 0.45)';
            case 'recessed':
                return 'rgba(38, 63, 96, 0.6)';
            case 'elevated':
            default:
                return 'rgba(59, 130, 246, 0.28)';
        }
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: getBgColor(),
                    borderColor: getBorderColor(),
                },
                style,
            ]}
        >
            {/* Optional Corner Mechanical Ticks (+) */}
            {cornerTicks && (
                <>
                    <ThemedText style={[styles.cornerTick, styles.tickTL]}>+</ThemedText>
                    <ThemedText style={[styles.cornerTick, styles.tickTR]}>+</ThemedText>
                    <ThemedText style={[styles.cornerTick, styles.tickBL]}>+</ThemedText>
                    <ThemedText style={[styles.cornerTick, styles.tickBR]}>+</ThemedText>
                </>
            )}

            {/* Optional Technical Header Strip */}
            {(technicalHeader || statusIndicator) && (
                <View style={styles.headerRow}>
                    {technicalHeader ? (
                        <ThemedText style={styles.technicalHeaderText}>
                            {technicalHeader}
                        </ThemedText>
                    ) : (
                        <View />
                    )}
                    {statusIndicator}
                </View>
            )}

            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: RADIUS.card,
        borderWidth: 1,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    technicalHeaderText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.monoVal,
        color: '#22D3EE',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    cornerTick: {
        position: 'absolute',
        fontSize: 10,
        fontFamily: FONT_FAMILIES.monoVal,
        color: 'rgba(34, 211, 238, 0.35)',
        lineHeight: 10,
    },
    tickTL: { top: 6, left: 8 },
    tickTR: { top: 6, right: 8 },
    tickBL: { bottom: 6, left: 8 },
    tickBR: { bottom: 6, right: 8 },
});

export default RetroBezelCard;
