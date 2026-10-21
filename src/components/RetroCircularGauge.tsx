import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ThemedText } from './ThemedText';
import { FONT_FAMILIES } from '../constants/Tokens';
import { RetroMascot } from './RetroMascot';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface RetroCircularGaugeProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    showMascot?: boolean;
    mascotExpression?: 'happy' | 'wink' | 'chill';
    chargingSpeedKw?: number;
    style?: StyleProp<ViewStyle>;
}

export function RetroCircularGauge({
    percentage,
    size = 200,
    strokeWidth = 14,
    showMascot = true,
    mascotExpression = 'chill',
    chargingSpeedKw,
    style,
}: RetroCircularGaugeProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (circumference * Math.min(Math.max(percentage, 0), 100)) / 100;

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.04,
                    duration: 1400,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1400,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    return (
        <View style={[styles.root, style]}>
            <View style={styles.gaugeRow}>
                {/* 1. Circular Progress Gauge */}
                <Animated.View style={[{ width: size, height: size }, { transform: [{ scale: pulseAnim }] }]}>
                    <Svg width={size} height={size}>
                        <Defs>
                            <LinearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <Stop offset="0%" stopColor="#22D3A7" />
                                <Stop offset="50%" stopColor="#22D3EE" />
                                <Stop offset="100%" stopColor="#3B82F6" />
                            </LinearGradient>
                        </Defs>

                        {/* Background Orbit Ring */}
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke="rgba(59, 130, 246, 0.16)"
                            strokeWidth={strokeWidth}
                            fill="none"
                        />

                        {/* Animated Active Charging Energy Ring */}
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke="url(#gaugeGradient)"
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="none"
                            rotation="-90"
                            origin={`${size / 2}, ${size / 2}`}
                        />
                    </Svg>

                    {/* Inside Center Content */}
                    <View style={styles.centerContent}>
                        <ThemedText style={styles.percentText}>{percentage}%</ThemedText>
                        <View style={styles.chargingBadge}>
                            <View style={styles.liveDot} />
                            <ThemedText style={styles.chargingLabel}>CHARGING</ThemedText>
                        </View>
                        {chargingSpeedKw !== undefined && (
                            <ThemedText style={styles.kwText}>{chargingSpeedKw} kW Fast</ThemedText>
                        )}
                    </View>
                </Animated.View>

                {/* 2. Floating Companion Mascot Volt */}
                {showMascot && (
                    <View style={styles.mascotHolder}>
                        <RetroMascot size={size * 0.65} expression={mascotExpression} animated />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    gaugeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    centerContent: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentText: {
        fontSize: 44,
        fontFamily: FONT_FAMILIES.monoVal,
        color: '#F8FAFC',
        letterSpacing: -1,
    },
    chargingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 211, 167, 0.16)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 9999,
        gap: 5,
        marginTop: 4,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22D3A7',
    },
    chargingLabel: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        color: '#22D3A7',
        letterSpacing: 1.2,
    },
    kwText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
        color: '#60A5FA',
        marginTop: 4,
    },
    mascotHolder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default RetroCircularGauge;
