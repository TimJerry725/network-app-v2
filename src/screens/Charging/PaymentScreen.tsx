import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Flag, RotateCcw, Receipt, Home } from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { getStationById, MOCK_STATIONS, Station } from '../../constants/Stations';
import { FONT_FAMILIES } from '../../constants/Tokens';
import { useAppTheme } from '../../hooks/useAppTheme';
import { CompletedSessionReceipt } from '../../context/ChargingContext';
import { useWallet } from '../../context/WalletContext';
import { useVehicles } from '../../context/VehicleContext';
import { PulseButton } from '../../components/pulse/PulseKit';
import { KeyValue, ON_HIGHLIGHT, Panel, Section, StatGrid, flat } from '../../components/flat/FlatKit';
import { formatRupees } from '../../utils/pulse';

export default function PaymentScreen({ route, navigation }: any) {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { raiseDispute } = useWallet();
    const { user } = useVehicles();
    const [ticket, setTicket] = useState<string | null>(null);

    const receipt = route.params?.receipt as CompletedSessionReceipt | undefined;
    const totalEnergy = Number(receipt?.energyDeliveredKwh ?? route.params?.totalEnergy ?? 24.6);
    const totalTime = receipt?.durationFormatted ?? `${route.params?.totalTime ?? 28}m`;
    const cost = Number(receipt?.totalAmountPaid ?? route.params?.cost ?? 354.2);
    const endSoc = receipt?.endSoc ?? route.params?.endingSoc ?? 82;
    const startSoc = receipt?.startSoc ?? 45;
    const station: Station = (route.params?.stationSnapshot as Station | undefined) ?? getStationById(route.params?.stationId) ?? MOCK_STATIONS[0];
    const invoiceNo = receipt?.invoiceNo ?? 'INV-IRIS-2026-9182';
    const txnId = receipt?.transactionId ?? 'TRX-948102';
    const volts = Math.max(5, Math.round(totalEnergy));

    const report = () => {
        if (ticket) return;
        Alert.alert('Something wrong with this bill?', `${formatRupees(cost, 2)} · ${station.name}`, [
            { text: 'I was charged twice', onPress: () => setTicket(raiseDispute(txnId, station.name, cost, 'Charged twice')) },
            { text: 'Charge stopped early', onPress: () => setTicket(raiseDispute(txnId, station.name, cost, 'Stopped early')) },
            { text: 'Amount looks wrong', onPress: () => setTicket(raiseDispute(txnId, station.name, cost, 'Wrong amount')) },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    return (
        <View style={[flat.screen, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
                <View style={styles.head}>
                    <CheckCircle2 size={28} color={colors.mint} />
                    <ThemedText style={[styles.title, { color: colors.text }]}>Charge complete</ThemedText>
                    <ThemedText style={[flat.body, { color: colors.textMuted }]}>{station.name}</ThemedText>
                </View>

                {/* The one highlight: what you paid */}
                <Panel tone="highlight" style={{ marginTop: 18 }}>
                    <ThemedText style={[flat.caption, { color: ON_HIGHLIGHT.sub }]}>Paid from Iris Wallet · incl. GST</ThemedText>
                    <ThemedText style={styles.amount}>{formatRupees(cost, 2)}</ThemedText>
                    <StatGrid
                        onHighlight
                        columns={3}
                        items={[
                            { label: 'Wallet left', value: formatRupees(user.walletBalance) },
                            { label: 'Hold', value: 'Returned' },
                            { label: 'Volts', value: `+${volts}` },
                        ]}
                    />
                </Panel>

                <Section title="Tax invoice">
                    <Panel>
                        <KeyValue label="Invoice" value={invoiceNo} />
                        <KeyValue label="Transaction" value={txnId} />
                        <KeyValue label="Energy" value={`${totalEnergy.toFixed(2)} kWh`} />
                        <KeyValue label="Duration" value={totalTime} />
                        <KeyValue label="Battery" value={`${startSoc}% → ${endSoc}%`} />
                        {receipt ? (
                            <>
                                <KeyValue label="Energy charges" value={formatRupees(receipt.energyCost, 2)} />
                                <KeyValue label="CGST 9%" value={formatRupees(receipt.cgstAmount, 2)} />
                                <KeyValue label="SGST 9%" value={formatRupees(receipt.sgstAmount, 2)} />
                            </>
                        ) : null}
                        <KeyValue label="Total paid" value={formatRupees(cost, 2)} strong />
                    </Panel>
                </Section>

                <Section title="Impact">
                    <Panel>
                        <StatGrid
                            columns={2}
                            items={[
                                { label: 'Green energy', value: '100%' },
                                { label: 'CO₂ saved', value: `${(totalEnergy * 0.16).toFixed(1)} kg` },
                            ]}
                        />
                    </Panel>
                </Section>

                <Pressable accessibilityRole="button" onPress={report} style={styles.report}>
                    <Flag size={15} color={ticket ? colors.sun : colors.textMuted} />
                    <ThemedText style={[styles.reportText, { color: ticket ? colors.sun : colors.textMuted }]}>
                        {ticket ? `Dispute ${ticket} raised · reply within 24h` : 'Something wrong? Report a problem'}
                    </ThemedText>
                </Pressable>

                <PulseButton title="Done" icon={<Home size={17} color="#0B0B0F" />} onPress={() => navigation.navigate('Main', { screen: 'Map' })} style={{ marginTop: 8 }} />
                <View style={[flat.rowGap, { marginTop: 10 }]}>
                    <PulseButton title="Charge again" variant="ghost" size="md" icon={<RotateCcw size={15} color={colors.text} />} onPress={() => navigation.navigate('Main', { screen: 'Scan' })} style={{ flex: 1 }} />
                    <PulseButton title="All charges" variant="ghost" size="md" icon={<Receipt size={15} color={colors.text} />} onPress={() => navigation.navigate('Main', { screen: 'Vehicles' })} style={{ flex: 1 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    head: { alignItems: 'flex-start', gap: 6 },
    title: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 28, letterSpacing: -0.9, lineHeight: 34 },
    amount: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 44, lineHeight: 52, letterSpacing: -1.6, color: '#0B0B0F', marginTop: 2, marginBottom: 4 },
    report: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, marginTop: 14 },
    reportText: { fontFamily: FONT_FAMILIES.bold, fontSize: 13.5 },
});
