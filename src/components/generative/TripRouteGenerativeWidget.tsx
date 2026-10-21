import React from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Clock, MapPin, Navigation, Route, TrendingUp, Zap } from 'lucide-react-native';
import { ThemedText } from '../ThemedText';
import { FONT_FAMILIES, RADIUS } from '../../constants/Tokens';
import { useAppTheme } from '../../hooks/useAppTheme';

export interface TripRouteGenerativeWidgetProps {
    origin: string;
    destination: string;
    distanceKm: number;
    durationHours: string;
    chargingStopsCount: number;
    chargingTimeMin: number;
    recommendedStop: string;
    energyKWh: number;
    onOpenTripPlanner?: () => void;
}

/**
 * Generative UI: Trip Route & Charging Planner Widget
 * Rendered inline inside Gemini AI chat responses for trip questions.
 */
export function TripRouteGenerativeWidget({
    origin = 'Coimbatore',
    destination = 'Bangalore',
    distanceKm = 365,
    durationHours = '5h 20m',
    chargingStopsCount = 1,
    chargingTimeMin = 25,
    recommendedStop = 'Iris Thoppur Hub (150kW)',
    energyKWh = 52,
    onOpenTripPlanner,
}: TripRouteGenerativeWidgetProps) {
    const { colors, isDark } = useAppTheme();

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? '#151722' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 91, 69, 0.25)' : 'rgba(255, 91, 69, 0.20)',
                },
            ]}
        >
            {/* Header: Origin -> Destination */}
            <View style={styles.headerRow}>
                <View style={styles.routeHeader}>
                    <ThemedText style={styles.originText}>{origin}</ThemedText>
                    <ArrowRight size={14} color="#FF5B45" />
                    <ThemedText style={styles.destinationText}>{destination}</ThemedText>
                </View>
                <View
                    style={[
                        styles.tagPill,
                        { backgroundColor: isDark ? 'rgba(255, 91, 69, 0.16)' : '#FFF0ED' },
                    ]}
                >
                    <Route size={11} color="#FF5B45" />
                    <ThemedText style={styles.tagText}>{chargingStopsCount} Fast Stop</ThemedText>
                </View>
            </View>

            {/* Metrics Ribbon */}
            <View
                style={[
                    styles.metricsRibbon,
                    {
                        backgroundColor: isDark ? '#1E202C' : '#F8FAFC',
                    },
                ]}
            >
                <View style={styles.metricItem}>
                    <ThemedText style={[styles.metricLabel, { color: colors.textMuted }]}>Distance</ThemedText>
                    <ThemedText style={styles.metricValue}>{distanceKm} km</ThemedText>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                    <ThemedText style={[styles.metricLabel, { color: colors.textMuted }]}>Total Time</ThemedText>
                    <ThemedText style={styles.metricValue}>{durationHours}</ThemedText>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                    <ThemedText style={[styles.metricLabel, { color: colors.textMuted }]}>Charge Time</ThemedText>
                    <ThemedText style={[styles.metricValue, { color: '#FF5B45' }]}>+{chargingTimeMin}m</ThemedText>
                </View>
            </View>

            {/* Recommended Stop Preview */}
            <View style={styles.stopSection}>
                <View style={styles.stopIconCircle}>
                    <Zap size={11} color="#FF5B45" fill="#FF5B45" />
                </View>
                <View style={{ flex: 1 }}>
                    <ThemedText style={styles.stopTitle}>Recommended Fast Stop</ThemedText>
                    <ThemedText style={[styles.stopSubtitle, { color: colors.textMuted }]}>
                        {recommendedStop} • 20% → 80% SOC
                    </ThemedText>
                </View>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
                style={[styles.openTripBtn, { backgroundColor: colors.coral }]}
                activeOpacity={0.82}
                onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onOpenTripPlanner?.();
                }}
            >
                <Navigation size={13} color="#FFFFFF" fill="#FFFFFF" />
                <ThemedText style={styles.openTripText}>
                    Open in Full Trip Planner
                </ThemedText>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: RADIUS.card,
        padding: 14,
        marginVertical: 6,
        borderWidth: 1.2,
        shadowColor: '#FF5B45',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    routeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    originText: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
    },
    destinationText: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
    },
    tagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.chip,
    },
    tagText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        color: '#FF5B45',
    },
    metricsRibbon: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: RADIUS.chip,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 10,
    },
    metricItem: {
        alignItems: 'center',
    },
    metricDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(150, 150, 150, 0.2)',
    },
    metricLabel: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.medium,
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.bold,
    },
    stopSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    stopIconCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 91, 69, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopTitle: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
    },
    stopSubtitle: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.regular,
    },
    openTripBtn: {
        height: 38,
        borderRadius: RADIUS.pill,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    openTripText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
    },
});
