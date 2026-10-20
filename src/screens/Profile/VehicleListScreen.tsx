import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Clock,
    ChevronDown,
    ArrowUpRight,
    Zap,
    Leaf,
    Receipt,
} from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../constants/Tokens';
import { useCharging, CompletedSessionReceipt } from '../../context/ChargingContext';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function VehicleListScreen() {
    const { colors, isDark } = useAppTheme();
    const { sessionHistory } = useCharging();
    const [showAll, setShowAll] = useState(false);

    const displayedSessions = showAll ? sessionHistory : sessionHistory.slice(0, 5);
    const hasMore = sessionHistory.length > 5;

    const totalEnergy = useMemo(() => {
        const sum = sessionHistory.reduce((acc, s) => acc + (s.energyDeliveredKwh || 0), 0);
        return sum > 0 ? sum.toFixed(1) : '384.5';
    }, [sessionHistory]);

    const totalSavings = useMemo(() => {
        const sum = sessionHistory.reduce((acc, s) => acc + (s.totalAmountPaid || 0), 0);
        return sum > 0 ? (sum * 0.42).toFixed(0) : '4,620';
    }, [sessionHistory]);

    const co2Avoided = useMemo(() => {
        const sum = sessionHistory.reduce((acc, s) => acc + (s.energyDeliveredKwh || 0), 0);
        return sum > 0 ? (sum * 0.48).toFixed(0) : '186';
    }, [sessionHistory]);

    const treesEquiv = useMemo(() => {
        const num = parseFloat(co2Avoided);
        return Math.round(num * 0.5) || 94;
    }, [co2Avoided]);

    const renderBentoHeader = () => {
        return (
            <View style={styles.bentoHeaderWrap}>
                {/* ── HERO BENTO CARD (Sunset Coral - Compact) ── */}
                <View style={styles.heroCoralCard}>
                    {/* Clean Heading */}
                    <View style={styles.heroHeadingRow}>
                        <Zap size={13} color="rgba(255, 255, 255, 0.9)" fill="rgba(255, 255, 255, 0.9)" />
                        <ThemedText style={styles.heroHeadingText}>TOTAL ENERGY CHARGED</ThemedText>
                    </View>

                    {/* Giant Metric */}
                    <ThemedText style={styles.heroCoralGiantVal}>{totalEnergy} kWh</ThemedText>

                    {/* Sub-Metric Row */}
                    <View style={styles.heroCoralSubRow}>
                        <ThemedText style={styles.heroCoralSubText}>
                            SAVED: ₹{totalSavings}
                        </ThemedText>
                        <ThemedText style={styles.heroCoralDot}>•</ThemedText>
                        <ThemedText style={styles.heroCoralSubText}>
                            AVG SPEED: 48 kW
                        </ThemedText>
                    </View>

                    {/* Integrated CO2 Impact Strip */}
                    <View style={styles.heroCo2Strip}>
                        <View style={styles.heroCo2Left}>
                            <View style={styles.heroCo2IconWrap}>
                                <Leaf size={12} color="#FFFFFF" />
                            </View>
                            <View>
                                <ThemedText style={styles.heroCo2Label}>CO₂ AVOIDED</ThemedText>
                                <ThemedText style={styles.heroCo2SubText}>
                                    {treesEquiv} Trees Equiv
                                </ThemedText>
                            </View>
                        </View>
                        <ThemedText style={styles.heroCo2Val}>{co2Avoided} kg</ThemedText>
                    </View>
                </View>

                {/* Section Header */}
                <View style={styles.sessionSectionHeader}>
                    <View style={styles.sessionTitleGroup}>
                        <Receipt size={16} color={colors.coral} />
                        <ThemedText style={[styles.sessionSectionTitle, { color: colors.text }]}>
                            Charging Receipts
                        </ThemedText>
                    </View>
                    <View
                        style={[
                            styles.sessionCountPill,
                            {
                                backgroundColor: isDark ? '#1C1D26' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            },
                        ]}
                    >
                        <ThemedText style={[styles.sessionCountText, { color: colors.textMuted }]}>
                            {sessionHistory.length} Total
                        </ThemedText>
                    </View>
                </View>
            </View>
        );
    };

    const renderSessionCard = ({ item }: { item: CompletedSessionReceipt }) => {
        return (
            <View
                style={[
                    styles.sessionCard,
                    {
                        backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        borderWidth: 1,
                    },
                ]}
            >
                {/* Top Row: Station Name, Amount & Circular ( ↗ ) Action Button */}
                <View style={styles.cardHeaderRow}>
                    <View style={styles.stationTitleWrap}>
                        <ThemedText style={[styles.stationName, { color: colors.text }]} numberOfLines={1}>
                            {item.stationName}
                        </ThemedText>
                        <ThemedText style={[styles.sessionSubText, { color: colors.textMuted }]}>
                            {item.startTime} • {item.invoiceNo}
                        </ThemedText>
                    </View>
                    <View style={styles.amountWrap}>
                        <ThemedText style={[styles.amountText, { color: colors.coral }]}>
                            ₹{item.totalAmountPaid.toFixed(2)}
                        </ThemedText>
                        <View style={styles.cardActionCircle}>
                            <ArrowUpRight size={14} color={colors.text} strokeWidth={2.5} />
                        </View>
                    </View>
                </View>

                {/* Vehicle & Connector Meta */}
                <View style={styles.metaRow}>
                    <ThemedText style={[styles.vehicleMetaText, { color: colors.textMuted }]}>
                        {item.vehicleModel}
                    </ThemedText>
                    <View
                        style={[
                            styles.connectorPill,
                            {
                                backgroundColor: isDark ? 'rgba(255, 91, 69, 0.12)' : '#FFE5E0',
                            },
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.connectorPillText,
                                { color: colors.coral, fontFamily: FONT_FAMILIES.bold, fontSize: 10 },
                            ]}
                        >
                            {item.connectorType}
                        </ThemedText>
                    </View>
                    <View
                        style={[
                            styles.paymentMethodPill,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.backgroundAlt },
                        ]}
                    >
                        <ThemedText style={[styles.paymentMethodText, { color: colors.textMuted }]}>
                            {item.paymentMethod}
                        </ThemedText>
                    </View>
                </View>

                {/* Flat Divider */}
                <View
                    style={[
                        styles.cardDivider,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.backgroundAlt },
                    ]}
                />

                {/* 4-Item Telemetry Stats Grid */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <ThemedText style={[styles.statLabel, { color: colors.textMuted }]}>Delivered</ThemedText>
                        <ThemedText style={[styles.statValue, { color: colors.text }]}>
                            {item.energyDeliveredKwh} kWh
                        </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                        <ThemedText style={[styles.statLabel, { color: colors.textMuted }]}>Duration</ThemedText>
                        <ThemedText style={[styles.statValue, { color: colors.text }]}>
                            {item.durationFormatted}
                        </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                        <ThemedText style={[styles.statLabel, { color: colors.textMuted }]}>Peak Rate</ThemedText>
                        <ThemedText style={[styles.statValue, { color: colors.text }]}>
                            {item.peakPowerKw} kW
                        </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                        <ThemedText style={[styles.statLabel, { color: colors.textMuted }]}>Battery</ThemedText>
                        <ThemedText style={[styles.statValue, { color: colors.text }]}>
                            {item.startSoc}% → {item.endSoc}%
                        </ThemedText>
                    </View>
                </View>
            </View>
        );
    };

    const renderFooter = () => {
        if (!hasMore) return null;

        return (
            <View style={styles.footerContainer}>
                <TouchableOpacity
                    style={[
                        styles.viewAllButton,
                        { backgroundColor: isDark ? colors.surfaceMuted : colors.backgroundAlt },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setShowAll(prev => !prev)}
                >
                    <ThemedText style={[styles.viewAllText, { color: colors.primary }]}>
                        {showAll ? 'Show Recent 5' : `View All (${sessionHistory.length} Sessions)`}
                    </ThemedText>
                    <ChevronDown
                        size={18}
                        color={colors.primary}
                        style={{
                            transform: [{ rotate: showAll ? '180deg' : '0deg' }],
                        }}
                    />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            {/* Past Sessions List with Bento Header */}
            <FlatList
                data={displayedSessions}
                keyExtractor={(item) => item.transactionId}
                renderItem={renderSessionCard}
                ListHeaderComponent={renderBentoHeader}
                ListFooterComponent={renderFooter}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Clock size={40} color={colors.textMuted} />
                        <ThemedText style={[styles.emptyText, { color: colors.textMuted }]}>
                            No past charging sessions found
                        </ThemedText>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    bentoHeaderWrap: {
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.md,
    },
    heroCoralCard: {
        backgroundColor: '#FF5B45',
        borderRadius: RADIUS.tile,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#FF5B45',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 4,
    },
    heroHeadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    heroHeadingText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    heroCoralGiantVal: {
        color: '#FFFFFF',
        fontSize: 28,
        fontFamily: FONT_FAMILIES.bold,
        lineHeight: 34,
        marginBottom: 4,
    },
    heroCoralSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    heroCoralSubText: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.3,
    },
    heroCoralDot: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 11,
    },
    heroCo2Strip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.16)',
        borderRadius: RADIUS.input,
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    heroCo2Left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    heroCo2IconWrap: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroCo2Label: {
        fontSize: 9,
        fontFamily: FONT_FAMILIES.bold,
        color: 'rgba(255, 255, 255, 0.85)',
        letterSpacing: 0.6,
    },
    heroCo2SubText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.medium,
        color: '#FFFFFF',
        marginTop: 1,
    },
    heroCo2Val: {
        fontSize: 18,
        fontFamily: FONT_FAMILIES.bold,
        color: '#FFFFFF',
    },
    sessionSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        marginBottom: 8,
    },
    sessionTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sessionSectionTitle: {
        fontSize: 16,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.3,
    },
    sessionCountPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: RADIUS.button,
        borderWidth: 1,
    },
    sessionCountText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
    },
    cardActionCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 110,
        gap: 12,
    },
    sessionCard: {
        borderRadius: RADIUS.card,
        padding: 16,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    stationTitleWrap: {
        flex: 1,
        marginRight: 12,
    },
    stationName: {
        fontSize: 16,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    sessionSubText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
        marginTop: 3,
    },
    amountWrap: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 18,
        fontFamily: FONT_FAMILIES.serifHeading,
        fontWeight: '800',
    },
    paymentMethodPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: RADIUS.chip,
        marginTop: 4,
    },
    paymentMethodText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.sansSemiBold,
        fontWeight: '600',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    vehicleMetaText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
    },
    connectorPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: RADIUS.chip,
    },
    connectorPillText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    cardDivider: {
        height: 1,
        marginVertical: 12,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    footerContainer: {
        paddingTop: 4,
        paddingBottom: 16,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: RADIUS.button,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    viewAllText: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.sansExtraBold,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
    },
});
