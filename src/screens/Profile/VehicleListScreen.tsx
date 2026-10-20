import React, { useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    Clock,
    ChevronDown,
    ArrowUpRight,
    Zap,
    Leaf,
    BatteryCharging,
    Receipt,
    TrendingUp,
} from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../constants/Tokens';
import { useCharging, CompletedSessionReceipt } from '../../context/ChargingContext';
import { useAppTheme } from '../../hooks/useAppTheme';

const WEEKLY_ENERGY_DATA = [
    { day: 'M', kwh: 32, height: 40 },
    { day: 'T', kwh: 54, height: 65 },
    { day: 'W', kwh: 24, height: 32 },
    { day: 'T', kwh: 48, height: 58 },
    { day: 'F', kwh: 82, height: 95, active: true },
    { day: 'S', kwh: 60, height: 72 },
    { day: 'S', kwh: 38, height: 46 },
];

export default function VehicleListScreen() {
    const { colors, isDark } = useAppTheme();
    const { sessionHistory } = useCharging();
    const [showAll, setShowAll] = useState(false);
    const [selectedBarIndex, setSelectedBarIndex] = useState<number>(4); // Default to Friday

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

    const renderBentoHeader = () => {
        return (
            <View style={styles.bentoHeaderWrap}>
                {/* ── HERO BENTO CARD (Sunset Coral - Inspired by Screen 2 GROSS REVENUE) ── */}
                <View style={styles.heroCoralCard}>
                    {/* Header Row */}
                    <View style={styles.heroCoralTopRow}>
                        <View style={styles.heroCoralTagPill}>
                            <Zap size={12} color="#FFFFFF" fill="#FFFFFF" />
                            <ThemedText style={styles.heroCoralTagText}>TOTAL ENERGY CHARGED</ThemedText>
                        </View>
                        <View style={styles.heroCoralGrowthBadge}>
                            <TrendingUp size={11} color="#FFFFFF" />
                            <ThemedText style={styles.heroCoralGrowthText}>+18.4%</ThemedText>
                        </View>
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

                    {/* Weekly Bar Chart Component */}
                    <View style={styles.chartContainer}>
                        <View style={styles.chartBarsRow}>
                            {WEEKLY_ENERGY_DATA.map((item, idx) => {
                                const isSelected = selectedBarIndex === idx;
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        activeOpacity={0.85}
                                        style={styles.chartBarCol}
                                        onPress={() => {
                                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setSelectedBarIndex(idx);
                                        }}
                                    >
                                        {/* Floating Tooltip Bubble for Active Bar */}
                                        {isSelected && (
                                            <View style={styles.chartTooltip}>
                                                <ThemedText style={styles.chartTooltipText}>
                                                    {item.kwh} kWh
                                                </ThemedText>
                                            </View>
                                        )}
                                        <View style={styles.barTrack}>
                                            <View
                                                style={[
                                                    styles.barFill,
                                                    {
                                                        height: `${item.height}%`,
                                                        backgroundColor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)',
                                                    },
                                                ]}
                                            />
                                        </View>
                                        <ThemedText
                                            style={[
                                                styles.barDayText,
                                                { color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)' },
                                            ]}
                                        >
                                            {item.day}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* ── 2-TILE SPLIT BENTO GRID (Lavender & Butter Amber) ── */}
                <View style={styles.bentoSplitGrid}>
                    {/* Left Tile: CO2 Offset (Electric Lavender) */}
                    <View style={[styles.bentoSplitTile, { backgroundColor: '#5B61F6' }]}>
                        <View style={styles.splitTileTopRow}>
                            <ThemedText style={styles.splitTileEyebrowWhite}>CO₂ AVOIDED</ThemedText>
                            <View style={[styles.splitTileActionCircle, { backgroundColor: '#FFFFFF' }]}>
                                <ArrowUpRight size={13} color="#5B61F6" strokeWidth={2.5} />
                            </View>
                        </View>
                        <ThemedText style={styles.splitTileMainValWhite}>186 kg</ThemedText>
                        <View style={styles.splitTilePillWhite}>
                            <Leaf size={10} color="#FFFFFF" />
                            <ThemedText style={styles.splitTilePillTextWhite}>94 Trees Equiv</ThemedText>
                        </View>
                    </View>

                    {/* Right Tile: Battery Health (Buttercup Amber) */}
                    <View style={[styles.bentoSplitTile, { backgroundColor: '#FFC043' }]}>
                        <View style={styles.splitTileTopRow}>
                            <ThemedText style={styles.splitTileEyebrowDark}>BATTERY HEALTH</ThemedText>
                            <View style={[styles.splitTileActionCircle, { backgroundColor: '#101114' }]}>
                                <ArrowUpRight size={13} color="#FFC043" strokeWidth={2.5} />
                            </View>
                        </View>
                        <ThemedText style={styles.splitTileMainValDark}>98.2%</ThemedText>
                        <View style={styles.splitTilePillDark}>
                            <BatteryCharging size={10} color="#101114" />
                            <ThemedText style={styles.splitTilePillTextDark}>Optimal Cycle</ThemedText>
                        </View>
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
        borderRadius: RADIUS.card,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#FF5B45',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 6,
    },
    heroCoralTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    heroCoralTagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: RADIUS.chip,
    },
    heroCoralTagText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.6,
    },
    heroCoralGrowthBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.24)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.chip,
    },
    heroCoralGrowthText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
    },
    heroCoralGiantVal: {
        color: '#FFFFFF',
        fontSize: 34,
        fontFamily: FONT_FAMILIES.bold,
        lineHeight: 40,
        marginBottom: 4,
    },
    heroCoralSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    heroCoralSubText: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.4,
    },
    heroCoralDot: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
    },
    chartContainer: {
        marginTop: 6,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.18)',
    },
    chartBarsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 120,
        paddingHorizontal: 6,
    },
    chartBarCol: {
        alignItems: 'center',
        flex: 1,
        height: '100%',
        justifyContent: 'flex-end',
        position: 'relative',
    },
    chartTooltip: {
        position: 'absolute',
        top: 2,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.chip,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 5,
    },
    chartTooltipText: {
        color: '#FF5B45',
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
    },
    barTrack: {
        width: 14,
        height: 76,
        backgroundColor: 'rgba(255, 255, 255, 0.16)',
        borderRadius: RADIUS.badge,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    barFill: {
        width: '100%',
        borderRadius: RADIUS.badge,
    },
    barDayText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        marginTop: 6,
    },
    bentoSplitGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    bentoSplitTile: {
        flex: 1,
        borderRadius: RADIUS.card,
        padding: 16,
        justifyContent: 'space-between',
    },
    splitTileTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    splitTileEyebrowWhite: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        color: 'rgba(255, 255, 255, 0.85)',
        letterSpacing: 0.6,
    },
    splitTileEyebrowDark: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        color: 'rgba(16, 17, 20, 0.72)',
        letterSpacing: 0.6,
    },
    splitTileActionCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    splitTileMainValWhite: {
        fontSize: 24,
        fontFamily: FONT_FAMILIES.bold,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    splitTileMainValDark: {
        fontSize: 24,
        fontFamily: FONT_FAMILIES.bold,
        color: '#101114',
        marginBottom: 8,
    },
    splitTilePillWhite: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        borderRadius: RADIUS.chip,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: 'flex-start',
    },
    splitTilePillTextWhite: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.medium,
        color: '#FFFFFF',
    },
    splitTilePillDark: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.12)',
        borderRadius: RADIUS.chip,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: 'flex-start',
    },
    splitTilePillTextDark: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.medium,
        color: '#101114',
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
