import React from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, Leaf, RotateCcw, Receipt, FileText, ShieldCheck } from 'lucide-react-native';
import { CredButton } from '../../components/CredButton';
import { CredCard } from '../../components/CredCard';
import { ThemedText } from '../../components/ThemedText';
import { getStationById, MOCK_STATIONS, Station } from '../../constants/Stations';
import { FONTS, RADIUS, SPACING } from '../../constants/Tokens';
import { useAppTheme } from '../../hooks/useAppTheme';
import { CompletedSessionReceipt } from '../../context/ChargingContext';

export default function PaymentScreen({ route, navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const receipt = route.params?.receipt as CompletedSessionReceipt | undefined;

    const totalEnergy = receipt?.energyDeliveredKwh ?? route.params?.totalEnergy ?? 24.6;
    const totalTime = receipt?.durationFormatted ?? `${route.params?.totalTime ?? 28}m`;
    const cost = receipt?.totalAmountPaid ?? route.params?.cost ?? 354.20;
    const endingSoc = receipt?.endSoc ?? route.params?.endingSoc ?? 82;
    const startSoc = receipt?.startSoc ?? 45;
    const routeStation = route.params?.stationSnapshot as Station | undefined;
    const station =
        routeStation ??
        getStationById(route.params?.stationId) ??
        MOCK_STATIONS[0];

    const invoiceNo = receipt?.invoiceNo ?? 'INV-IRIS-2026-9182';
    const transactionId = receipt?.transactionId ?? 'TRX-948102';

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Confirmation */}
                <View style={styles.hero}>
                    <View
                        style={[
                            styles.successIcon,
                            {
                                backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
                                borderWidth: 2,
                                borderBottomWidth: 4,
                                borderBottomColor: isDark ? '#050508' : '#C8C8D0',
                            },
                        ]}
                    >
                        <CheckCircle2 size={38} color={colors.primary} />
                    </View>
                    <ThemedText type="title" style={styles.title}>
                        Session Complete!
                    </ThemedText>
                    <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>
                        Payment settled via Iris Wallet at {station.name}.
                    </ThemedText>
                </View>

                {/* CPO Invoice / Tax Breakdown Card */}
                <CredCard variant="default" style={styles.summaryCard}>
                    <View style={styles.invoiceHeaderRow}>
                        <View>
                            <ThemedText type="label" style={{ color: colors.textMuted }}>
                                TAX INVOICE
                            </ThemedText>
                            <ThemedText style={[FONTS.bodyStrong, { color: colors.text }]}>
                                {invoiceNo}
                            </ThemedText>
                        </View>
                        <View
                            style={[
                                styles.badgePill,
                                {
                                    backgroundColor: isDark ? '#141418' : '#F4F4F6',
                                    borderColor: colors.cardBorder,
                                    borderWidth: 1,
                                },
                            ]}
                        >
                            <ShieldCheck size={14} color={colors.primary} />
                            <ThemedText style={{ color: colors.text, ...FONTS.caption, fontWeight: '700' }}>
                                GST COMPLIANT
                            </ThemedText>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.surfaceMuted }]} />

                    <View style={styles.summaryRow}>
                        <ThemedText style={{ color: colors.textMuted, ...FONTS.body }}>Transaction ID</ThemedText>
                        <ThemedText style={styles.summaryValue}>{transactionId}</ThemedText>
                    </View>

                    <View style={styles.summaryRow}>
                        <ThemedText style={{ color: colors.textMuted, ...FONTS.body }}>Energy Delivered</ThemedText>
                        <ThemedText style={styles.summaryValue}>{Number(totalEnergy).toFixed(2)} kWh</ThemedText>
                    </View>

                    <View style={styles.summaryRow}>
                        <ThemedText style={{ color: colors.textMuted, ...FONTS.body }}>Duration</ThemedText>
                        <ThemedText style={styles.summaryValue}>{totalTime}</ThemedText>
                    </View>

                    <View style={styles.summaryRow}>
                        <ThemedText style={{ color: colors.textMuted, ...FONTS.body }}>Battery Level</ThemedText>
                        <ThemedText style={styles.summaryValue}>{startSoc}% → {endingSoc}%</ThemedText>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.surfaceMuted }]} />

                    {receipt && (
                        <>
                            <View style={styles.summaryRow}>
                                <ThemedText style={{ color: colors.textMuted, ...FONTS.body }}>Energy Charges</ThemedText>
                                <ThemedText style={styles.summaryValue}>₹{receipt.energyCost.toFixed(2)}</ThemedText>
                            </View>
                            <View style={styles.summaryRow}>
                                <ThemedText style={{ color: colors.textMuted, ...FONTS.body }}>CGST (9%)</ThemedText>
                                <ThemedText style={styles.summaryValue}>₹{receipt.cgstAmount.toFixed(2)}</ThemedText>
                            </View>
                            <View style={styles.summaryRow}>
                                <ThemedText style={{ color: colors.textMuted, ...FONTS.body }}>SGST (9%)</ThemedText>
                                <ThemedText style={styles.summaryValue}>₹{receipt.sgstAmount.toFixed(2)}</ThemedText>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.surfaceMuted }]} />
                        </>
                    )}

                    <View style={styles.summaryRow}>
                        <ThemedText style={[FONTS.h3, { color: colors.text }]}>Total Paid</ThemedText>
                        <ThemedText style={[FONTS.h2, { color: colors.primary }]}>
                            ₹{Number(cost).toFixed(2)}
                        </ThemedText>
                    </View>
                </CredCard>

                {/* Eco & Green Telemetry Cards */}
                <View style={styles.rewardRow}>
                    <CredCard variant="default" style={styles.rewardCard}>
                        <Leaf size={20} color={colors.primary} />
                        <ThemedText style={styles.rewardValue}>100%</ThemedText>
                        <ThemedText style={{ color: colors.textMuted, ...FONTS.caption }}>Green Energy</ThemedText>
                    </CredCard>
                    <CredCard variant="default" style={styles.rewardCard}>
                        <Receipt size={20} color={colors.primary} />
                        <ThemedText style={styles.rewardValue}>{(Number(totalEnergy) * 0.16).toFixed(1)} kg</ThemedText>
                        <ThemedText style={{ color: colors.textMuted, ...FONTS.caption }}>CO₂ Offset</ThemedText>
                    </CredCard>
                </View>

                {/* Primary Return Action */}
                <CredButton
                    title="RETURN TO MAP"
                    variant="neon"
                    containerStyle={{ marginTop: SPACING.lg }}
                    onPress={() => navigation.navigate('Main', { screen: 'Map' })}
                />

                {/* Action Row */}
                <View style={styles.secondaryActions}>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            {
                                backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
                                borderBottomColor: isDark ? '#050508' : '#C8C8D0',
                            },
                        ]}
                        activeOpacity={0.82}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate('Main', { screen: 'Scan' });
                        }}
                    >
                        <RotateCcw size={16} color={colors.primary} />
                        <ThemedText style={{ color: colors.text, ...FONTS.bodyStrong }}>
                            New Session
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            {
                                backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
                                borderBottomColor: isDark ? '#050508' : '#C8C8D0',
                            },
                        ]}
                        activeOpacity={0.82}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate('Main', { screen: 'Vehicles' });
                        }}
                    >
                        <FileText size={16} color={colors.primary} />
                        <ThemedText style={{ color: colors.text, ...FONTS.bodyStrong }}>
                            View Garage
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    content: {
        padding: SPACING.md,
        paddingBottom: SPACING.xl,
    },
    hero: {
        alignItems: 'center',
        marginVertical: SPACING.md,
    },
    successIcon: {
        width: 76,
        height: 76,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        marginTop: 14,
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 6,
        textAlign: 'center',
        ...FONTS.body,
        paddingHorizontal: SPACING.md,
    },
    summaryCard: {
        padding: SPACING.md,
        marginVertical: SPACING.sm,
    },
    invoiceHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badgePill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.chip,
        gap: 4,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginVertical: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 4,
    },
    summaryValue: {
        ...FONTS.bodyStrong,
    },
    rewardRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
    },
    rewardCard: {
        flex: 1,
        padding: SPACING.md,
        alignItems: 'center',
    },
    rewardValue: {
        ...FONTS.h3,
        marginTop: 4,
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: RADIUS.button,
        gap: 8,
        borderWidth: 1.5,
        borderBottomWidth: 3,
    },
});
