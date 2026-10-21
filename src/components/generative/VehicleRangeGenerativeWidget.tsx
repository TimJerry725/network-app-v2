import React from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BatteryCharging, CheckCircle2, ChevronRight, Gauge, ShieldCheck, Zap } from 'lucide-react-native';
import { ThemedText } from '../ThemedText';
import { FONT_FAMILIES, RADIUS } from '../../constants/Tokens';
import { useAppTheme } from '../../hooks/useAppTheme';

export interface VehicleRangeGenerativeWidgetProps {
    modelName?: string;
    socPercent?: number;
    rangeKm?: number;
    batteryCapacityKWh?: number;
    healthPercent?: number;
    maxDcRateKw?: number;
    onManageVehicle?: () => void;
}

/**
 * Generative UI: Vehicle Battery & Range Card
 * Rendered inline inside Gemini AI chat responses for battery/vehicle questions.
 */
export function VehicleRangeGenerativeWidget({
    modelName = 'Tata Nexon EV Long Range',
    socPercent = 68,
    rangeKm = 218,
    batteryCapacityKWh = 40.5,
    healthPercent = 98,
    maxDcRateKw = 50,
    onManageVehicle,
}: VehicleRangeGenerativeWidgetProps) {
    const { colors, isDark } = useAppTheme();

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? '#151722' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.20)',
                },
            ]}
        >
            {/* Header: Model & Health Tag */}
            <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                    <ThemedText style={styles.modelName} numberOfLines={1}>
                        {modelName}
                    </ThemedText>
                    <ThemedText style={[styles.modelSub, { color: colors.textMuted }]}>
                        {batteryCapacityKWh} kWh Pack • CCS2 Standard
                    </ThemedText>
                </View>
                <View
                    style={[
                        styles.healthBadge,
                        {
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
                        },
                    ]}
                >
                    <ShieldCheck size={12} color="#10B981" />
                    <ThemedText style={styles.healthText}>{healthPercent}% Health</ThemedText>
                </View>
            </View>

            {/* Main Stats: Circular-style SOC & Range */}
            <View style={styles.statsRow}>
                {/* Big Battery SOC */}
                <View
                    style={[
                        styles.statTile,
                        {
                            backgroundColor: isDark ? '#1E202C' : '#F8FAFC',
                        },
                    ]}
                >
                    <View style={styles.statIconHeader}>
                        <BatteryCharging size={14} color="#10B981" />
                        <ThemedText style={[styles.statLabel, { color: colors.textMuted }]}>
                            Current SOC
                        </ThemedText>
                    </View>
                    <ThemedText style={[styles.statValue, { color: '#10B981' }]}>
                        {socPercent}%
                    </ThemedText>
                    <View style={styles.batteryProgressBar}>
                        <View
                            style={[
                                styles.batteryProgressFill,
                                {
                                    width: `${socPercent}%`,
                                    backgroundColor: '#10B981',
                                },
                            ]}
                        />
                    </View>
                </View>

                {/* Estimated Range */}
                <View
                    style={[
                        styles.statTile,
                        {
                            backgroundColor: isDark ? '#1E202C' : '#F8FAFC',
                        },
                    ]}
                >
                    <View style={styles.statIconHeader}>
                        <Gauge size={14} color="#38BDF8" />
                        <ThemedText style={[styles.statLabel, { color: colors.textMuted }]}>
                            Estimated Range
                        </ThemedText>
                    </View>
                    <ThemedText style={[styles.statValue, { color: '#38BDF8' }]}>
                        {rangeKm} km
                    </ThemedText>
                    <ThemedText style={[styles.statHint, { color: colors.textMuted }]}>
                        at ~142 Wh/km consumption
                    </ThemedText>
                </View>
            </View>

            {/* Quick Action */}
            <TouchableOpacity
                style={[
                    styles.manageBtn,
                    {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
                    },
                ]}
                activeOpacity={0.78}
                onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onManageVehicle?.();
                }}
            >
                <ThemedText style={[styles.manageBtnText, { color: colors.text }]}>
                    View Charging Specs & Compatibility
                </ThemedText>
                <ChevronRight size={14} color={colors.textMuted} />
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
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    modelName: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
        marginBottom: 2,
    },
    modelSub: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
    },
    healthBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.chip,
    },
    healthText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
        color: '#10B981',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    statTile: {
        flex: 1,
        borderRadius: RADIUS.chip,
        padding: 10,
    },
    statIconHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.medium,
    },
    statValue: {
        fontSize: 22,
        fontFamily: FONT_FAMILIES.bold,
        marginBottom: 4,
    },
    statHint: {
        fontSize: 9,
        fontFamily: FONT_FAMILIES.regular,
    },
    batteryProgressBar: {
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(150, 150, 150, 0.2)',
        overflow: 'hidden',
    },
    batteryProgressFill: {
        height: '100%',
        borderRadius: 2,
    },
    manageBtn: {
        height: 36,
        borderRadius: RADIUS.pill,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    manageBtnText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
    },
});
