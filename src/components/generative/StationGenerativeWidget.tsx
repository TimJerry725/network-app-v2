import React from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ArrowUpRight, CheckCircle2, MapPin, Navigation, Zap } from 'lucide-react-native';
import { ThemedText } from '../ThemedText';
import { FONT_FAMILIES, FONTS, RADIUS } from '../../constants/Tokens';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Station } from '../../constants/Stations';

export interface StationGenerativeWidgetProps {
    station: Station;
    onNavigate?: (station: Station) => void;
    onStartCharge?: (station: Station) => void;
    onDetails?: (station: Station) => void;
}

/**
 * Generative UI: Station Recommendation Card
 * Rendered inline inside Gemini AI chat responses with interactive controls.
 */
export function StationGenerativeWidget({
    station,
    onNavigate,
    onStartCharge,
    onDetails,
}: StationGenerativeWidgetProps) {
    const { colors, isDark } = useAppTheme();
    const recommendedConnector = station.connectors?.[0] ?? {
        power: 60,
        type: 'CCS2',
        pricePerKWh: 18,
        status: 'Available',
    };

    const isAvailable = station.connectors?.some((c) => c.status === 'Available') ?? true;

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? '#151722' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(56, 189, 248, 0.18)',
                },
            ]}
        >
            {/* Top Row: Name and Power Badge */}
            <View style={styles.topRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <ThemedText style={styles.stationName} numberOfLines={1}>
                        {station.name}
                    </ThemedText>
                    <ThemedText style={[styles.stationLocation, { color: colors.textMuted }]} numberOfLines={1}>
                        {station.distanceKm} km away{station.etaMinutes ? ` • ${station.etaMinutes} min ETA` : ''}
                    </ThemedText>
                </View>

                {/* Speed Capsule */}
                <View
                    style={[
                        styles.powerBadge,
                        {
                            backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : '#E0F2FE',
                        },
                    ]}
                >
                    <Zap size={12} color="#38BDF8" fill="#38BDF8" />
                    <ThemedText style={styles.powerText}>
                        {recommendedConnector.power} kW
                    </ThemedText>
                </View>
            </View>

            {/* Middle Meta Row */}
            <View style={styles.metaRow}>
                <View
                    style={[
                        styles.statusPill,
                        {
                            backgroundColor: isAvailable
                                ? (isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5')
                                : (isDark ? 'rgba(255, 91, 69, 0.16)' : '#FFF0ED'),
                        },
                    ]}
                >
                    <CheckCircle2
                        size={11}
                        color={isAvailable ? '#10B981' : '#FF5B45'}
                    />
                    <ThemedText
                        style={[
                            styles.statusText,
                            { color: isAvailable ? '#10B981' : '#FF5B45' },
                        ]}
                    >
                        {isAvailable ? 'Available Now' : 'In Use'}
                    </ThemedText>
                </View>

                <ThemedText style={[styles.priceText, { color: colors.textMuted }]}>
                    ₹{recommendedConnector.pricePerKWh.toFixed(0)}/kWh
                </ThemedText>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={[
                        styles.actionBtnSecondary,
                        {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
                        },
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onNavigate?.(station);
                    }}
                >
                    <Navigation size={13} color={colors.text} fill={colors.text} />
                    <ThemedText style={[styles.actionBtnText, { color: colors.text }]}>
                        Navigate
                    </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
                    activeOpacity={0.82}
                    onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onStartCharge?.(station);
                    }}
                >
                    <Zap size={13} color="#081726" fill="#081726" />
                    <ThemedText style={[styles.actionBtnText, { color: '#081726', fontFamily: FONT_FAMILIES.bold }]}>
                        Start Charge
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: RADIUS.card,
        padding: 14,
        marginVertical: 6,
        borderWidth: 1.2,
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    stationName: {
        fontSize: 16,
        fontFamily: FONT_FAMILIES.bold,
        marginBottom: 2,
    },
    stationLocation: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.medium,
    },
    powerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.chip,
    },
    powerText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
        color: '#38BDF8',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.chip,
    },
    statusText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
    },
    priceText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtnSecondary: {
        flex: 1,
        height: 38,
        borderRadius: RADIUS.pill,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    actionBtnPrimary: {
        flex: 1.2,
        height: 38,
        borderRadius: RADIUS.pill,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    actionBtnText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
    },
});
