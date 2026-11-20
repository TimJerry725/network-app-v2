import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, ChevronDown, Zap, Leaf } from '../../components/sf/icons';
import { ThemedText } from '../../components/ThemedText';
import { useCharging, CompletedSessionReceipt } from '../../context/ChargingContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { SessionReceiptModal } from '../../components/SessionReceiptModal';

/** Sessions (iOS 27 style): large title, blue summary card, white receipt cards. */
export default function VehicleListScreen() {
    const { colors } = useAppTheme();
    const { sessionHistory } = useCharging();
    const [showAll, setShowAll] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<CompletedSessionReceipt | null>(null);

    const displayed = showAll ? sessionHistory : sessionHistory.slice(0, 5);
    const hasMore = sessionHistory.length > 5;

    const totalEnergy = useMemo(() => {
        const sum = sessionHistory.reduce((a, s) => a + (s.energyDeliveredKwh || 0), 0);
        return sum > 0 ? sum.toFixed(1) : '384.5';
    }, [sessionHistory]);
    const totalSavings = useMemo(() => {
        const sum = sessionHistory.reduce((a, s) => a + (s.totalAmountPaid || 0), 0);
        return sum > 0 ? (sum * 0.42).toFixed(0) : '4,620';
    }, [sessionHistory]);
    const co2 = useMemo(() => {
        const sum = sessionHistory.reduce((a, s) => a + (s.energyDeliveredKwh || 0), 0);
        return sum > 0 ? (sum * 0.48).toFixed(0) : '186';
    }, [sessionHistory]);

    const header = (
        <View>
            <ThemedText style={[styles.title, { color: colors.text }]}>Sessions</ThemedText>
            <View style={[styles.hero, { backgroundColor: colors.primary }]}>
                <View style={styles.heroTop}>
                    <Zap size={14} color="#FFFFFF" fill="#FFFFFF" />
                    <ThemedText style={styles.heroLabel}>Total energy charged</ThemedText>
                </View>
                <ThemedText style={styles.heroVal}>{totalEnergy} kWh</ThemedText>
                <ThemedText style={styles.heroSub}>Saved ₹{totalSavings} · Avg speed 48 kW</ThemedText>
                <View style={styles.co2}>
                    <View style={styles.heroTop}>
                        <Leaf size={14} color="#FFFFFF" />
                        <ThemedText style={styles.heroLabel}>CO₂ avoided</ThemedText>
                    </View>
                    <ThemedText style={styles.co2Val}>{co2} kg</ThemedText>
                </View>
            </View>
            <View style={styles.sectionRow}>
                <ThemedText style={[styles.section, { color: colors.text }]}>Charging receipts</ThemedText>
                <ThemedText style={[styles.count, { color: colors.textMuted }]}>{sessionHistory.length} total</ThemedText>
            </View>
        </View>
    );

    const renderItem = ({ item }: { item: CompletedSessionReceipt }) => (
        <TouchableOpacity
            activeOpacity={0.85}
            accessibilityRole="button"
            onPress={() => setSelectedReceipt(item)}
            style={[styles.card, { backgroundColor: colors.surface }]}
        >
            <View style={styles.cardTop}>
                <View style={styles.flex}>
                    <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.stationName}</ThemedText>
                    <ThemedText style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
                        {item.startTime} · {item.invoiceNo}
                    </ThemedText>
                </View>
                <ThemedText style={[styles.amount, { color: colors.text }]}>₹{item.totalAmountPaid.toFixed(2)}</ThemedText>
            </View>
            <View style={styles.chips}>
                <ThemedText style={[styles.meta, { color: colors.textMuted }]}>{item.vehicleModel}</ThemedText>
                <View style={[styles.chip, { backgroundColor: 'rgba(0,122,255,0.12)' }]}>
                    <ThemedText style={[styles.chipText, { color: colors.primary }]}>{item.connectorType}</ThemedText>
                </View>
                <View style={[styles.chip, { backgroundColor: colors.background }]}>
                    <ThemedText style={[styles.chipText, { color: colors.textMuted }]}>{item.paymentMethod}</ThemedText>
                </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.stats}>
                {[
                    ['Delivered', `${item.energyDeliveredKwh} kWh`],
                    ['Duration', item.durationFormatted],
                    ['Peak', `${item.peakPowerKw} kW`],
                    ['Battery', `${item.startSoc}→${item.endSoc}%`],
                ].map(([label, value]) => (
                    <View key={label} style={styles.stat}>
                        <ThemedText style={[styles.statLabel, { color: colors.textMuted }]}>{label}</ThemedText>
                        <ThemedText style={[styles.statVal, { color: colors.text }]}>{value}</ThemedText>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );

    const footer = hasMore ? (
        <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.8}
            style={[styles.more, { backgroundColor: colors.surface }]}
            onPress={() => setShowAll((p) => !p)}
        >
            <ThemedText style={[styles.moreText, { color: colors.primary }]}>
                {showAll ? 'Show recent 5' : `View all (${sessionHistory.length})`}
            </ThemedText>
            <ChevronDown size={18} color={colors.primary} style={{ transform: [{ rotate: showAll ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
    ) : undefined;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <FlatList
                data={displayed}
                keyExtractor={(i) => i.transactionId}
                renderItem={renderItem}
                ListHeaderComponent={header}
                ListFooterComponent={footer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Clock size={40} color={colors.textMuted} />
                        <ThemedText style={[styles.meta, { color: colors.textMuted }]}>No past charging sessions yet</ThemedText>
                    </View>
                }
            />
            <SessionReceiptModal visible={!!selectedReceipt} receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 140 },
    title: { fontSize: 34, lineHeight: 42, fontWeight: '800', letterSpacing: -0.8, marginBottom: 16 },
    hero: { borderRadius: 28, padding: 20, marginBottom: 20 },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
    heroVal: { color: '#FFFFFF', fontSize: 40, fontWeight: '800', letterSpacing: -1, marginTop: 8 },
    heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '500', marginTop: 2.0 },
    co2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 48,
        marginTop: 16,
    },
    co2Val: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
    section: { fontSize: 22, fontWeight: '700' },
    count: { fontSize: 14, fontWeight: '500' },
    card: { borderRadius: 24, padding: 16, marginBottom: 12 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    flex: { flex: 1 },
    name: { fontSize: 17, fontWeight: '700' },
    meta: { fontSize: 13, fontWeight: '500', marginTop: 2.0 },
    amount: { fontSize: 18, fontWeight: '800' },
    chips: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    chip: { paddingHorizontal: 8, height: 24, borderRadius: 12, justifyContent: 'center' },
    chipText: { fontSize: 12, fontWeight: '700' },
    divider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
    stats: { flexDirection: 'row' },
    stat: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2.0 },
    statVal: { fontSize: 14, fontWeight: '700' },
    more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 26, marginTop: 4 },
    moreText: { fontSize: 16, fontWeight: '700' },
    empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
});
