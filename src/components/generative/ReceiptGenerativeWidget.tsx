import React from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Clock, Download, FileText, Leaf, Receipt, Zap } from 'lucide-react-native';
import { ThemedText } from '../ThemedText';
import { FONT_FAMILIES, RADIUS } from '../../constants/Tokens';
import { useAppTheme } from '../../hooks/useAppTheme';

export interface ReceiptGenerativeWidgetProps {
    stationName?: string;
    invoiceNo?: string;
    dateFormatted?: string;
    energyKWh?: number;
    durationMin?: number;
    totalAmount?: number;
    co2AvoidedKg?: number;
    onViewReceipt?: () => void;
}

/**
 * Generative UI: Charging Receipt Summary Card
 * Rendered inline inside Gemini AI chat responses for billing/receipt queries.
 */
export function ReceiptGenerativeWidget({
    stationName = 'Casa Grand Techno City',
    invoiceNo = 'INV-2026-10-891',
    dateFormatted = 'Today, 9:42 AM',
    energyKWh = 18.4,
    durationMin = 28,
    totalAmount = 386.40,
    co2AvoidedKg = 15.2,
    onViewReceipt,
}: ReceiptGenerativeWidgetProps) {
    const { colors, isDark } = useAppTheme();

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? '#151722' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.20)',
                },
            ]}
        >
            {/* Header: Station & Invoice */}
            <View style={styles.headerRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <ThemedText style={styles.stationName} numberOfLines={1}>
                        {stationName}
                    </ThemedText>
                    <ThemedText style={[styles.invoiceText, { color: colors.textMuted }]}>
                        {invoiceNo} • {dateFormatted}
                    </ThemedText>
                </View>
                <View style={[styles.paidBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5' }]}>
                    <ThemedText style={styles.paidText}>Paid</ThemedText>
                </View>
            </View>

            {/* Metrics Grid */}
            <View
                style={[
                    styles.metricsGrid,
                    {
                        backgroundColor: isDark ? '#1E202C' : '#F8FAFC',
                    },
                ]}
            >
                <View style={styles.metricItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <Zap size={11} color="#38BDF8" fill="#38BDF8" />
                        <ThemedText style={[styles.metricLabel, { color: colors.textMuted }]}>Delivered</ThemedText>
                    </View>
                    <ThemedText style={styles.metricValue}>{energyKWh} kWh</ThemedText>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <Clock size={11} color="#FF5B45" />
                        <ThemedText style={[styles.metricLabel, { color: colors.textMuted }]}>Time</ThemedText>
                    </View>
                    <ThemedText style={styles.metricValue}>{durationMin} min</ThemedText>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <Leaf size={11} color="#10B981" />
                        <ThemedText style={[styles.metricLabel, { color: colors.textMuted }]}>CO₂ Saved</ThemedText>
                    </View>
                    <ThemedText style={[styles.metricValue, { color: '#10B981' }]}>{co2AvoidedKg} kg</ThemedText>
                </View>
            </View>

            {/* Bottom Total & Button Row */}
            <View style={styles.bottomRow}>
                <View>
                    <ThemedText style={[styles.totalLabel, { color: colors.textMuted }]}>Total Charged</ThemedText>
                    <ThemedText style={styles.totalValue}>₹{totalAmount.toFixed(2)}</ThemedText>
                </View>

                <TouchableOpacity
                    style={[styles.receiptBtn, { backgroundColor: colors.coral }]}
                    activeOpacity={0.82}
                    onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onViewReceipt?.();
                    }}
                >
                    <FileText size={13} color="#FFFFFF" />
                    <ThemedText style={styles.receiptBtnText}>View Receipt</ThemedText>
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
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    stationName: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
        marginBottom: 2,
    },
    invoiceText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
    },
    paidBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.chip,
    },
    paidText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        color: '#10B981',
    },
    metricsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: RADIUS.chip,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 12,
    },
    metricItem: {
        alignItems: 'center',
        flex: 1,
    },
    metricDivider: {
        width: 1,
        height: 22,
        backgroundColor: 'rgba(150, 150, 150, 0.2)',
    },
    metricLabel: {
        fontSize: 9,
        fontFamily: FONT_FAMILIES.medium,
    },
    metricValue: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    totalLabel: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.medium,
        marginBottom: 1,
    },
    totalValue: {
        fontSize: 18,
        fontFamily: FONT_FAMILIES.bold,
    },
    receiptBtn: {
        height: 36,
        borderRadius: RADIUS.pill,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 14,
    },
    receiptBtnText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
    },
});
