import React, { useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Clock,
    ChevronDown,
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

    const renderSessionCard = ({ item }: { item: CompletedSessionReceipt }) => {
        return (
            <View
                style={[
                    styles.sessionCard,
                    { backgroundColor: isDark ? colors.surfaceMuted : colors.surface },
                ]}
            >
                {/* Top Row: Station Name & Total Amount */}
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
                        <ThemedText style={[styles.amountText, { color: colors.primary }]}>
                            ₹{item.totalAmountPaid.toFixed(2)}
                        </ThemedText>
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
                                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.22)' : '#DCFCE7',
                            },
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.connectorPillText,
                                { color: isDark ? '#4ADE80' : '#15803D' },
                            ]}
                        >
                            {item.connectorType}
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
            {/* Header: Title & Total Count */}
            <View style={styles.header}>
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Past Sessions</ThemedText>
                <ThemedText style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                    {sessionHistory.length > 0
                        ? `${sessionHistory.length} completed charging sessions`
                        : 'No charging sessions recorded yet'}
                </ThemedText>
            </View>

            {/* Past Sessions List */}
            <FlatList
                data={displayedSessions}
                keyExtractor={(item) => item.transactionId}
                renderItem={renderSessionCard}
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
    header: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.md,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: FONT_FAMILIES.serifHeading,
        fontWeight: '800',
    },
    headerSubtitle: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
        marginTop: 2,
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
        borderRadius: RADIUS.pill,
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
        borderRadius: RADIUS.pill,
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
    },
    viewAllText: {
        fontSize: 14,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
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
