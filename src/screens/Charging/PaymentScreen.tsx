import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CheckCircle2, Leaf, BatteryCharging, Receipt, Flag } from '../../components/sf/icons';
import { ThemedText } from '../../components/ThemedText';
import { getStationById, MOCK_STATIONS, Station } from '../../constants/Stations';
import { useAppTheme } from '../../hooks/useAppTheme';
import { GlassButton } from '../../components/glass/Glass';
import { CompletedSessionReceipt, useCharging } from '../../context/ChargingContext';
import { useWallet } from '../../context/WalletContext';
import { SessionReceiptModal } from '../../components/SessionReceiptModal';
import { formatRupees } from '../../utils/pulse';

/** Receipt (iOS 27 design): session complete, total paid, tax invoice, impact tiles. */
export default function PaymentScreen({ route, navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { raiseDispute } = useWallet();
    const { latestReceipt } = useCharging();
    const [ticket, setTicket] = useState<string | null>(null);
    const [showFull, setShowFull] = useState(false);

    const receipt = (route.params?.receipt as CompletedSessionReceipt | undefined) ?? latestReceipt ?? undefined;
    const totalEnergy = Number(receipt?.energyDeliveredKwh ?? route.params?.totalEnergy ?? 18.6);
    const cost = Number(receipt?.totalAmountPaid ?? route.params?.cost ?? 362.14);
    const endSoc = receipt?.endSoc ?? route.params?.endingSoc ?? 80;
    const startSoc = receipt?.startSoc ?? 20;
    const station: Station = (route.params?.stationSnapshot as Station | undefined) ?? getStationById(route.params?.stationId) ?? MOCK_STATIONS[0];
    const txnId = receipt?.transactionId ?? 'TXN-8F2K-41A9';
    const energyCharges = receipt?.energyCost ?? Number((cost / 1.18).toFixed(2));
    const cgst = receipt?.cgstAmount ?? Number(((cost - energyCharges) / 2).toFixed(2));
    const sgst = receipt?.sgstAmount ?? Number(((cost - energyCharges) / 2).toFixed(2));
    const rate = totalEnergy > 0 ? energyCharges / totalEnergy : 0;
    const co2 = (totalEnergy * 0.71).toFixed(1);

    const report = () => {
        if (ticket) return;
        Alert.alert('Something wrong with this bill?', `${formatRupees(cost, 2)} · ${station.name}`, [
            { text: 'I was charged twice', onPress: () => setTicket(raiseDispute(txnId, station.name, cost, 'Charged twice')) },
            { text: 'Charge stopped early', onPress: () => setTicket(raiseDispute(txnId, station.name, cost, 'Stopped early')) },
            { text: 'Amount looks wrong', onPress: () => setTicket(raiseDispute(txnId, station.name, cost, 'Wrong amount')) },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const outline = [styles.outline, { backgroundColor: colors.surface, borderColor: colors.border }];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.closeWrap, { top: insets.top + 8 }]} pointerEvents="box-none">
                <GlassButton label="Close" size={44} onPress={() => navigation.navigate('Main', { screen: 'Map' })}>
                    <X size={20} color={colors.text} strokeWidth={2.5} />
                </GlassButton>
            </View>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 56, paddingHorizontal: 16, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <View style={[styles.halo, { backgroundColor: 'rgba(52,199,89,0.12)' }]}>
                        <View style={[styles.haloInner, { backgroundColor: 'rgba(52,199,89,0.16)' }]}>
                            <CheckCircle2 size={56} color={colors.success} strokeWidth={2} />
                        </View>
                    </View>
                    <ThemedText style={[styles.title, { color: colors.text }]}>Session Complete!</ThemedText>
                    <ThemedText style={[styles.sub, { color: colors.textMuted }]}>
                        {station.name} • {receipt?.chargerId ?? 'CP1233-01'}
                    </ThemedText>
                    <ThemedText style={[styles.totalLabel, { color: colors.textMuted }]}>Total paid</ThemedText>
                    <ThemedText style={[styles.total, { color: colors.text }]} adjustsFontSizeToFit numberOfLines={1}>
                        {formatRupees(cost, 2)}
                    </ThemedText>
                </View>

                <View style={[styles.invoice, { backgroundColor: colors.surface }]}>
                    <View style={styles.invHead}>
                        <ThemedText style={[styles.invTitle, { color: colors.text }]}>Tax invoice</ThemedText>
                        <View style={[styles.gst, { backgroundColor: 'rgba(52,199,89,0.16)' }]}>
                            <ThemedText style={[styles.gstText, { color: colors.success }]}>GST compliant</ThemedText>
                        </View>
                    </View>

                    <View style={styles.line}>
                        <View>
                            <ThemedText style={[styles.lineMain, { color: colors.text }]}>Energy Charges</ThemedText>
                            <ThemedText style={[styles.lineSub, { color: colors.textMuted }]}>{totalEnergy.toFixed(1)} kWh × ₹{rate.toFixed(1)}</ThemedText>
                        </View>
                        <ThemedText style={[styles.lineVal, { color: colors.text }]}>{formatRupees(energyCharges, 2)}</ThemedText>
                    </View>
                    <View style={[styles.dash, { borderColor: colors.border }]} />
                    <View style={styles.lineRow}>
                        <ThemedText style={[styles.lineMain, { color: colors.text }]}>CGST (9%)</ThemedText>
                        <ThemedText style={[styles.lineVal, { color: colors.text }]}>{formatRupees(cgst, 2)}</ThemedText>
                    </View>
                    <View style={[styles.dash, { borderColor: colors.border }]} />
                    <View style={styles.lineRow}>
                        <ThemedText style={[styles.lineMain, { color: colors.text }]}>SGST (9%)</ThemedText>
                        <ThemedText style={[styles.lineVal, { color: colors.text }]}>{formatRupees(sgst, 2)}</ThemedText>
                    </View>
                    <View style={[styles.dash, { borderColor: colors.border }]} />
                    <View style={styles.lineRow}>
                        <ThemedText style={[styles.txnLabel, { color: colors.textMuted }]}>Transaction ID</ThemedText>
                        <ThemedText style={[styles.txnVal, { color: colors.text }]}>{txnId}</ThemedText>
                    </View>
                </View>

                <View style={styles.tiles}>
                    <View style={[styles.tile, { backgroundColor: isDark ? 'rgba(52,199,89,0.18)' : '#D6EBDF' }]}>
                        <Leaf size={26} color={colors.success} />
                        <ThemedText style={[styles.tileLabel, { color: colors.textMuted }]}>CO₂ offset</ThemedText>
                        <ThemedText style={[styles.tileVal, { color: colors.text }]}>{co2} kg</ThemedText>
                    </View>
                    <View style={[styles.tile, { backgroundColor: isDark ? 'rgba(0,122,255,0.20)' : '#D3E2F6' }]}>
                        <BatteryCharging size={26} color={colors.primary} />
                        <ThemedText style={[styles.tileLabel, { color: colors.textMuted }]}>Battery level</ThemedText>
                        <ThemedText style={[styles.tileVal, { color: colors.text }]}>{startSoc} → {endSoc}%</ThemedText>
                    </View>
                </View>

                <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Main', { screen: 'Map' })} style={({ pressed }) => [...outline, styles.full, { opacity: pressed ? 0.7 : 1 }]}>
                    <ThemedText style={[styles.outlineText, { color: colors.text }]}>Return to Map</ThemedText>
                </Pressable>
                <View style={styles.row}>
                    <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Main', { screen: 'Scan' })} style={({ pressed }) => [...outline, { flex: 1, opacity: pressed ? 0.7 : 1 }]}>
                        <ThemedText style={[styles.outlineText, { color: colors.text }]}>New Session</ThemedText>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={() => setShowFull(true)} style={({ pressed }) => [...outline, { flex: 1, opacity: pressed ? 0.7 : 1 }]}>
                        <Receipt size={20} color={colors.text} />
                        <ThemedText style={[styles.outlineText, { color: colors.text }]}>View Receipt</ThemedText>
                    </Pressable>
                </View>

                <Pressable accessibilityRole="button" onPress={report} style={styles.report}>
                    <Flag size={16} color={ticket ? colors.warning : colors.textMuted} />
                    <ThemedText style={[styles.reportText, { color: ticket ? colors.warning : colors.textMuted }]}>
                        {ticket ? `Dispute ${ticket} raised · reply within 24h` : 'Something wrong? Report a problem'}
                    </ThemedText>
                </Pressable>
            </ScrollView>

            <SessionReceiptModal visible={showFull} receipt={receipt ?? null} onClose={() => setShowFull(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    closeWrap: { position: 'absolute', right: 16, zIndex: 10 },
    hero: { alignItems: 'center' },
    halo: { width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center' },
    haloInner: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 38, fontWeight: '800', letterSpacing: -1.2, marginTop: 16 },
    sub: { fontSize: 17, fontWeight: '500', marginTop: 8 },
    totalLabel: { fontSize: 18, fontWeight: '500', marginTop: 20 },
    total: { fontSize: 62, fontWeight: '900', letterSpacing: -2, marginTop: 2.0, maxWidth: '100%' },
    invoice: { borderRadius: 32, padding: 20, marginTop: 20 },
    invHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    invTitle: { fontSize: 18, fontWeight: '700' },
    gst: { height: 38, paddingHorizontal: 16, borderRadius: 19, justifyContent: 'center' },
    gstText: { fontSize: 16, fontWeight: '700' },
    line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    lineMain: { fontSize: 21, fontWeight: '600' },
    lineSub: { fontSize: 16, fontWeight: '500', marginTop: 2.0 },
    lineVal: { fontSize: 21, fontWeight: '800' },
    dash: { borderBottomWidth: 1.5, borderStyle: 'dashed' },
    txnLabel: { fontSize: 19, fontWeight: '500' },
    txnVal: { fontSize: 18, fontWeight: '800' },
    tiles: { flexDirection: 'row', gap: 12, marginTop: 12 },
    tile: { flex: 1, borderRadius: 28, padding: 16, minHeight: 120, justifyContent: 'space-between' },
    tileLabel: { fontSize: 17, fontWeight: '600', marginTop: 8 },
    tileVal: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
    outline: { height: 64, borderRadius: 32, borderWidth: StyleSheet.hairlineWidth * 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    full: { marginTop: 16 },
    row: { flexDirection: 'row', gap: 12, marginTop: 12 },
    outlineText: { fontSize: 20, fontWeight: '700' },
    report: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, marginTop: 8 },
    reportText: { fontSize: 15, fontWeight: '600' },
});
