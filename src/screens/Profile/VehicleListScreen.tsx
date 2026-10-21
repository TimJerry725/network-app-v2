import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
    Clock,
    ChevronDown,
    ArrowUpRight,
    Zap,
    Leaf,
    Receipt,
    BatteryCharging,
} from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../constants/Tokens';
import { useCharging, CompletedSessionReceipt } from '../../context/ChargingContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { SessionReceiptModal } from '../../components/SessionReceiptModal';
import { RetroMascot } from '../../components/RetroMascot';

export default function VehicleListScreen() {
    const navigation = useNavigation<any>();
    const { colors, isDark } = useAppTheme();
    const { sessionHistory, activeSession } = useCharging();
    const [showAll, setShowAll] = useState(false);
    const [filterType, setFilterType] = useState<'All' | 'DC' | 'AC'>('All');
    const [selectedReceipt, setSelectedReceipt] = useState<CompletedSessionReceipt | null>(null);

    const filteredSessions = useMemo(() => {
        if (filterType === 'DC') return sessionHistory.filter((s) => (s.connectorType || '').includes('CCS') || (s.connectorType || '').includes('CHA'));
        if (filterType === 'AC') return sessionHistory.filter((s) => (s.connectorType || '').includes('Type 2'));
        return sessionHistory;
    }, [sessionHistory, filterType]);

    const displayedSessions = showAll ? filteredSessions : filteredSessions.slice(0, 5);
    const hasMore = filteredSessions.length > 5;

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

    const renderBentoHeader = () => {
        return (
            <View style={styles.bentoHeaderWrap}>
                {/* ── Active Session In Progress Banner ── */}
                {activeSession && (
                    <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => navigation.navigate('ChargingSession')}
                        style={styles.activeBannerCard}
                    >
                        <View style={styles.activeBannerHeader}>
                            <View style={styles.activeLiveDot} />
                            <ThemedText style={styles.activeBannerTag}>ACTIVE SESSION</ThemedText>
                        </View>
                        <View style={styles.activeBannerMainRow}>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={styles.activeBannerStationName} numberOfLines={1}>
                                    {activeSession.stationName}
                                </ThemedText>
                                <ThemedText style={styles.activeBannerMeta}>
                                    {activeSession.currentPowerKw} kW • {activeSession.energyDeliveredKwh.toFixed(2)} kWh
                                </ThemedText>
                            </View>
                            <View style={styles.activeSocPill}>
                                <ThemedText style={styles.activeSocText}>
                                    {Math.round(activeSession.currentSoc)}%
                                </ThemedText>
                                <ArrowUpRight size={14} color="#22D3A7" />
                            </View>
                        </View>
                    </TouchableOpacity>
                )}

                {/* ── HERO BENTO CARD (Retro Cosmic Surface) ── */}
                <View style={styles.heroCoralCard}>
                    {/* Clean Heading */}
                    <View style={styles.heroHeadingRow}>
                        <Zap size={13} color="#22D3EE" fill="#22D3EE" />
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
                                <Leaf size={12} color="#22D3EE" />
                            </View>
                            <ThemedText style={styles.heroCo2Label}>CO₂ AVOIDED</ThemedText>
                        </View>
                        <ThemedText style={styles.heroCo2Val}>{co2Avoided} kg</ThemedText>
                    </View>
                </View>

                {/* Quick Filter Chips */}
                <View style={styles.filterPillsRow}>
                    {(['All', 'DC', 'AC'] as const).map((tab) => {
                        const isActive = filterType === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                activeOpacity={0.8}
                                onPress={() => setFilterType(tab)}
                                style={[
                                    styles.filterPill,
                                    isActive
                                        ? { backgroundColor: '#3B82F6', borderColor: '#3B82F6' }
                                        : {
                                              backgroundColor: isDark ? colors.surface : '#FFFFFF',
                                              borderColor: colors.cardBorder,
                                          },
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        styles.filterPillText,
                                        { color: isActive ? '#FFFFFF' : colors.text },
                                    ]}
                                >
                                    {tab === 'All' ? 'All Sessions' : tab === 'DC' ? 'Fast DC' : 'AC Normal'}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Section Header */}
                <View style={styles.sessionSectionHeader}>
                    <View style={styles.sessionTitleGroup}>
                        <Receipt size={16} color={colors.primary} />
                        <ThemedText style={[styles.sessionSectionTitle, { color: colors.text }]}>
                            Charging Receipts
                        </ThemedText>
                    </View>
                    <View
                        style={[
                            styles.sessionCountPill,
                            {
                                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#FFFFFF',
                                borderColor: colors.cardBorder,
                            },
                        ]}
                    >
                        <ThemedText style={[styles.sessionCountText, { color: colors.primary }]}>
                            {filteredSessions.length} Total
                        </ThemedText>
                    </View>
                </View>
            </View>
        );
    };

    const renderSessionCard = ({ item }: { item: CompletedSessionReceipt }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setSelectedReceipt(item)}
                style={[
                    styles.sessionCard,
                    {
                        backgroundColor: isDark ? colors.surface : '#FFFFFF',
                        borderColor: colors.cardBorder,
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
                        <ThemedText style={[styles.amountText, { color: '#22D3A7' }]}>
                            ₹{item.totalAmountPaid.toFixed(2)}
                        </ThemedText>
                        <View style={styles.cardActionCircle}>
                            <ArrowUpRight size={14} color="#FFFFFF" strokeWidth={2.5} />
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
                                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.16)' : '#E0F2FE',
                            },
                        ]}
                    >
                        <ThemedText style={[styles.connectorPillText, { color: colors.primary }]}>
                            {item.connectorType}
                        </ThemedText>
                    </View>
                </View>

                {/* Energy & Duration Badge Row */}
                <View style={styles.specsRow}>
                    <View style={styles.specItem}>
                        <Zap size={13} color={colors.primary} />
                        <ThemedText style={[styles.specText, { color: colors.text }]}>
                            {item.energyDeliveredKwh.toFixed(1)} kWh
                        </ThemedText>
                    </View>
                    <View style={styles.specItem}>
                        <Clock size={13} color={colors.textMuted} />
                        <ThemedText style={[styles.specText, { color: colors.textMuted }]}>
                            {item.durationFormatted}
                        </ThemedText>
                    </View>
                    {item.peakPowerKw ? (
                        <View style={styles.specItem}>
                            <ThemedText style={[styles.specText, { color: '#22D3EE' }]}>
                                {item.peakPowerKw} kW peak
                            </ThemedText>
                        </View>
                    ) : null}
                </View>
            </TouchableOpacity>
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
                        <RetroMascot size={90} expression="chill" animated style={{ marginBottom: 12 }} />
                        <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                            No Past Sessions
                        </ThemedText>
                        <ThemedText style={[styles.emptyText, { color: colors.textMuted }]}>
                            {filterType === 'All'
                                ? 'Plug in at any Iris station to track your live telemetry and instant receipts.'
                                : `No ${filterType} sessions found in your history.`}
                        </ThemedText>
                    </View>
                }
            />
            {/* Full-Screen Detailed Session Receipt Modal */}
            <SessionReceiptModal
                visible={!!selectedReceipt}
                receipt={selectedReceipt}
                onClose={() => setSelectedReceipt(null)}
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
        paddingBottom: 0,
    },
    activeBannerCard: {
        backgroundColor: 'rgba(34, 211, 167, 0.14)',
        borderColor: '#22D3A7',
        borderWidth: 1,
        borderRadius: RADIUS.card,
        padding: 14,
        marginBottom: 14,
    },
    activeBannerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    activeLiveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22D3A7',
    },
    activeBannerTag: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        color: '#22D3A7',
        letterSpacing: 1,
    },
    activeBannerMainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    activeBannerStationName: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
        color: '#F8FAFC',
    },
    activeBannerMeta: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.medium,
        color: '#94A3B8',
        marginTop: 2,
    },
    activeSocPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 211, 167, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.pill,
        gap: 4,
    },
    activeSocText: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.monoVal,
        color: '#22D3A7',
    },
    filterPillsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
        marginBottom: 12,
    },
    filterPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
    },
    filterPillText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
    },
    heroCoralCard: {
        backgroundColor: '#142C50',
        borderRadius: RADIUS.card,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.35)',
        shadowColor: '#0B1E3B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
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
        color: '#22D3EE',
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    heroCoralGiantVal: {
        color: '#F8FAFC',
        fontSize: 30,
        fontFamily: FONT_FAMILIES.monoVal,
        lineHeight: 36,
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
        backgroundColor: 'rgba(34, 211, 238, 0.12)',
        borderRadius: RADIUS.input,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(34, 211, 238, 0.22)',
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
        backgroundColor: 'rgba(34, 211, 238, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroCo2Label: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        color: 'rgba(255, 255, 255, 0.85)',
        letterSpacing: 0.6,
    },
    heroCo2Val: {
        fontSize: 18,
        fontFamily: FONT_FAMILIES.monoVal,
        color: '#22D3EE',
    },
    sessionSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        marginBottom: 0,
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
    specsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
    },
    specItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    specText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.monoRegular,
        fontWeight: '500',
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
        paddingHorizontal: 24,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: FONT_FAMILIES.bold,
        marginBottom: 6,
    },
    emptyText: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 18,
    },
});
