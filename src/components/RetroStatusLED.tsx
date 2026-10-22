import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedText } from './ThemedText';
import { FONT_FAMILIES } from '../constants/Tokens';

export type RetroLEDStatus = 'available' | 'charging' | 'busy' | 'offline';

export interface RetroStatusLEDProps {
    status: RetroLEDStatus;
    label?: string;
    showPulse?: boolean;
    size?: number;
    style?: StyleProp<ViewStyle>;
}

const STATUS_CONFIG: Record<RetroLEDStatus, { color: string; label: string }> = {
    available: { color: '#22D3A7', label: 'AVAILABLE' },
    charging: { color: '#22D3EE', label: 'CHARGING' },
    busy: { color: '#FBBF24', label: 'OCCUPIED' },
    offline: { color: '#EF4444', label: 'OFFLINE' },
};

/**
 * RetroStatusLED - Cockpit Hardware Status Lamp
 * Features an authentic glowing diode and optional pulsing outer aura.
 */
export function RetroStatusLED({
    status,
    label,
    showPulse = true,
    size = 8,
    style,
}: RetroStatusLEDProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.available;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!showPulse || status === 'offline') return;

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.8,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim, showPulse, status]);

    const displayLabel = label || config.label;

    return (
        <View style={[styles.container, style]}>
            <View style={[styles.ledWrapper, { width: size * 2.2, height: size * 2.2 }]}>
                {showPulse && status !== 'offline' && (
                    <Animated.View
                        style={[
                            styles.pulseHalo,
                            {
                                width: size * 2,
                                height: size * 2,
                                borderRadius: size,
                                backgroundColor: config.color,
                                opacity: 0.35,
                                transform: [{ scale: pulseAnim }],
                            },
                        ]}
                    />
                )}
                <View
                    style={[
                        styles.solidDiode,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            backgroundColor: config.color,
                            shadowColor: config.color,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.8,
                            shadowRadius: 4,
                        },
                    ]}
                />
            </View>
            {displayLabel ? (
                <ThemedText style={[styles.labelText, { color: config.color }]}>
                    {displayLabel}
                </ThemedText>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ledWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    pulseHalo: {
        position: 'absolute',
    },
    solidDiode: {
        elevation: 3,
    },
    labelText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.monoVal,
        letterSpacing: 0.8,
        fontWeight: '700',
    },
});

export default RetroStatusLED;
