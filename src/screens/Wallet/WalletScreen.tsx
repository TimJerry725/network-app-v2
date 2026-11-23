import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { TextInput } from '../../components/ThemedTextInput';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    X,
    Plus,
    Sparkles,
    ArrowDownLeft,
    ArrowUpRight,
    RotateCcw,
    Flag,
    Check,
    LifeBuoy,
    Lock,
    Smartphone,
    CreditCard,
    Landmark,
} from '../../components/sf/icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ThemedText } from '../../components/ThemedText';
import { FONT_FAMILIES } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';
import { useWallet, WalletTxn } from '../../context/WalletContext';
import { useCharging } from '../../context/ChargingContext';
import { PulseButton, SectionTitle, Squish, StatusChip } from '../../components/pulse/PulseKit';
import { Panel } from '../../components/flat/FlatKit';
import { formatRupees, sessionHoldAmount } from '../../utils/pulse';

const PRESETS = [200, 500, 1000, 2000];
const METHODS = [
    { id: 'upi', label: 'UPI', icon: Smartphone },
    { id: 'netbanking', label: 'Netbanking', icon: Landmark },
] as const;

export default function WalletScreen() {
    const { colors } = useAppTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { user } = useVehicles();
    const { ledger, addMoney, raiseDispute } = useWallet();
    const { sessionHistory, activeSession } = useCharging();

    const [amount, setAmount] = useState(route.params?.focusTopUp ? '500' : '500');
    const [method, setMethod] = useState<(typeof METHODS)[number]['id']>('upi');
    const [adding, setAdding] = useState(!!route.params?.focusTopUp);
    const [disputed, setDisputed] = useState<Record<string, string>>({});

    const hold = activeSession ? sessionHoldAmount(activeSession.totalCost) : 0;
    const spendable = Math.max(0, user.walletBalance - hold);
    const amountValue = parseFloat(amount) || 0;

    const methodLabel = METHODS.find((m) => m.id === method)?.label ?? 'UPI';

    const onAdd = () => {
        if (amountValue <= 0) return;
        addMoney(amountValue, `${methodLabel} · instant`);
        Alert.alert('Money added', `${formatRupees(amountValue)} is in your wallet.`);
        setAdding(false);
    };

    const onDispute = (ref: string, station: string, total: number) => {
        Alert.alert('Something wrong with this charge?', `${station} · ${formatRupees(total, 2)}`, [
            {
                text: 'I was charged twice',
                onPress: () => setDisputed((d) => ({ ...d, [ref]: raiseDispute(ref, station, total, 'Charged twice') })),
            },
            {
                text: 'Charge stopped early',
                onPress: () => setDisputed((d) => ({ ...d, [ref]: raiseDispute(ref, station, total, 'Stopped early') })),
            },
            {
                text: 'Amount looks wrong',
                onPress: () => setDisputed((d) => ({ ...d, [ref]: raiseDispute(ref, station, total, 'Wrong amount') })),
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    // One list of transactions: wallet movements first, then charges. Show the latest 10 until "Show all".
    const [showAllTxns, setShowAllTxns] = useState(false);
    type Txn = { kind: 'ledger'; id: string; txn: WalletTxn } | { kind: 'charge'; id: string; s: (typeof sessionHistory)[number] };
    const allTxns: Txn[] = useMemo(
        () => [
            ...ledger.map((t) => ({ kind: 'ledger' as const, id: t.id, txn: t })),
            ...sessionHistory.map((c) => ({ kind: 'charge' as const, id: c.transactionId, s: c })),
        ],
        [ledger, sessionHistory]
    );
    const shownTxns = showAllTxns ? allTxns : allTxns.slice(0, 10);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView
                contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40, paddingHorizontal: 16 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Squish
                        onPress={() => navigation.goBack()}
                        accessibilityLabel="Back"
                        style={[styles.circleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                        <ChevronLeft size={20} color={colors.text} strokeWidth={2.5} />
                    </Squish>
                    <ThemedText style={[styles.title, { color: colors.text }]}>Wallet</ThemedText>
                    <Squish
                        onPress={() =>
                            Alert.alert('Wallet help', 'Money stuck or refund late? Talk to a person.', [
                                { text: 'Call 1800-419-4747', onPress: () => Linking.openURL('tel:18004194747').catch(() => {}) },
                                { text: 'Close', style: 'cancel' },
                            ])
                        }
                        accessibilityLabel="Wallet help"
                        style={[styles.circleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                        <LifeBuoy size={18} color={colors.text} />
                    </Squish>
                </View>

                {/* One wallet card: shows the balance, and turns into the add-money card when tapped */}
                {adding ? (
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16 }]}>
                        <View style={styles.addHead}>
                            <ThemedText style={[styles.addTitle, { color: colors.text }]}>Add money</ThemedText>
                            <Pressable accessibilityRole="button" accessibilityLabel="Back to balance" hitSlop={10} onPress={() => setAdding(false)}>
                                <X size={20} color={colors.text} />
                            </Pressable>
                        </View>
                        <View style={styles.amountRow}>
                            <ThemedText style={[styles.rupee, { color: colors.textMuted }]}>₹</ThemedText>
                            <TextInput
                                value={amount}
                                onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                                maxLength={6}
                                placeholder="0"
                                placeholderTextColor={colors.textSoft}
                                style={[styles.amountInput, { color: colors.text }]}
                                accessibilityLabel="Amount to add"
                            />
                        </View>
                        <View style={styles.presetRow}>
                            {PRESETS.map((p) => {
                                const active = amountValue === p;
                                return (
                                    <Pressable
                                        key={p}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: active }}
                                        onPress={() => setAmount(String(p))}
                                        style={[
                                            styles.preset,
                                            active
                                                ? { backgroundColor: colors.text, borderColor: colors.text }
                                                : { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
                                        ]}
                                    >
                                        <ThemedText style={[styles.presetText, { color: active ? colors.background : colors.text }]}>
                                            +{p}
                                        </ThemedText>
                                    </Pressable>
                                );
                            })}
                        </View>
                        <View style={styles.methodRow}>
                            {METHODS.map((m) => {
                                const active = m.id === method;
                                const Icon = m.icon;
                                return (
                                    <Pressable
                                        key={m.id}
                                        accessibilityRole="radio"
                                        accessibilityState={{ checked: active }}
                                        onPress={() => setMethod(m.id)}
                                        style={[
                                            styles.method,
                                            { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySoft : 'transparent' },
                                        ]}
                                    >
                                        <Icon size={16} color={active ? colors.primary : colors.textMuted} />
                                        <ThemedText style={[styles.methodText, { color: active ? colors.primary : colors.textMuted }]}>
                                            {m.label}
                                        </ThemedText>
                                    </Pressable>
                                );
                            })}
                        </View>
                        <PulseButton
                            title={amountValue > 0 ? `Add ${formatRupees(amountValue)} via ${methodLabel}` : 'Enter an amount'}
                            onPress={onAdd}
                            disabled={amountValue <= 0}
                            icon={<Plus size={18} color="#FFFFFF" strokeWidth={3} />}
                            style={{ marginTop: 16 }}
                        />
                        <ThemedText style={[styles.fine, { color: colors.textMuted }]}>
                            Unused balance is refundable to source anytime. No hidden fees.
                        </ThemedText>
                    </View>
                ) : (
                    <>
                        <Panel tone="highlight" onPress={() => setAdding(true)} accessibilityLabel="Wallet balance. Tap to add money" style={{ marginTop: 16 }}>
                            <ThemedText style={styles.passLabel}>Iris Wallet</ThemedText>
                            <ThemedText style={styles.passSmall}>{hold > 0 ? 'Spendable now' : 'Balance'}</ThemedText>
                            <ThemedText style={styles.passBalance}>{formatRupees(hold > 0 ? spendable : user.walletBalance, 2)}</ThemedText>
                            {hold > 0 ? (
                                <View style={styles.holdRow}>
                                    <Lock size={12} color="#FFFFFF" />
                                    <ThemedText style={styles.holdText}>
                                        {formatRupees(hold)} held for your live charge · unused hold comes back when you stop
                                    </ThemedText>
                                </View>
                            ) : null}
                        </Panel>
                        <PulseButton
                            title="Add money"
                            onPress={() => setAdding(true)}
                            icon={<Plus size={18} color="#FFFFFF" strokeWidth={3} />}
                            style={{ marginTop: 12 }}
                        />
                    </>
                )}

                {/* Transactions */}
                <SectionTitle title={`Transactions · ${allTxns.length}`} />
                <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {shownTxns.map((row) => {
                        if (row.kind === 'ledger') return <LedgerRow key={row.id} txn={row.txn} />;
                        const c = row.s;
                        const ticket = disputed[c.transactionId];
                        return (
                            <View key={row.id} style={[styles.txn, { borderTopColor: colors.border }]}>
                                <View style={[styles.txnIcon, { backgroundColor: 'rgba(0,122,255,0.12)' }]}>
                                    <ArrowUpRight size={16} color={colors.text} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={[styles.txnTitle, { color: colors.text }]} numberOfLines={1}>
                                        {c.stationName}
                                    </ThemedText>
                                    <ThemedText style={[styles.txnSub, { color: colors.textMuted }]} numberOfLines={1}>
                                        {c.energyDeliveredKwh} kWh · {c.startTime} · incl. GST
                                    </ThemedText>
                                    {ticket ? (
                                        <StatusChip label={`Dispute ${ticket} · reply in 24h`} tone="wait" style={{ marginTop: 8 }} />
                                    ) : (
                                        <Pressable
                                            accessibilityRole="button"
                                            onPress={() => onDispute(c.transactionId, c.stationName, c.totalAmountPaid)}
                                            style={styles.disputeBtn}
                                        >
                                            <Flag size={12} color={colors.primary} />
                                            <ThemedText style={[styles.disputeText, { color: colors.primary }]}>Report a problem</ThemedText>
                                        </Pressable>
                                    )}
                                </View>
                                <ThemedText style={[styles.txnAmount, { color: colors.text }]}>
                                    −{formatRupees(c.totalAmountPaid, 2)}
                                </ThemedText>
                            </View>
                        );
                    })}
                </View>
                {allTxns.length > 10 ? (
                    <PulseButton
                        title={showAllTxns ? 'Show less' : `Show all ${allTxns.length}`}
                        variant="ghost"
                        size="md"
                        onPress={() => setShowAllTxns((v) => !v)}
                        style={{ marginTop: 12 }}
                    />
                ) : null}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function LedgerRow({ txn }: { txn: WalletTxn }) {
    const { colors } = useAppTheme();
    const incoming = txn.amount > 0 && txn.kind !== 'dispute';
    const Icon = txn.kind === 'refund' ? RotateCcw : txn.kind === 'dispute' ? Flag : txn.kind === 'cashback' ? Sparkles : ArrowDownLeft;
    const tone = txn.status === 'Success' || txn.status === 'Refunded' ? 'ok' : txn.status === 'Failed' ? 'stop' : 'wait';
    return (
        <View style={[styles.txn, { borderTopColor: colors.border }]}>
            <View style={[styles.txnIcon, { backgroundColor: incoming ? 'rgba(52,199,89,0.14)' : 'rgba(0,122,255,0.12)' }]}>
                <Icon size={16} color={incoming ? colors.success : colors.text} />
            </View>
            <View style={{ flex: 1 }}>
                <ThemedText style={[styles.txnTitle, { color: colors.text }]}>{txn.title}</ThemedText>
                <ThemedText style={[styles.txnSub, { color: colors.textMuted }]} numberOfLines={1}>
                    {txn.subtitle} · {txn.dateLabel}
                </ThemedText>
                {txn.status !== 'Success' ? (
                    <StatusChip label={txn.etaLabel ? `${txn.status} · ${txn.etaLabel}` : txn.status} tone={tone} style={{ marginTop: 8 }} />
                ) : null}
            </View>
            <ThemedText style={[styles.txnAmount, { color: incoming ? colors.mint : colors.text }]}>
                {txn.kind === 'dispute' ? formatRupees(txn.amount, 2) : `${incoming ? '+' : '−'}${formatRupees(Math.abs(txn.amount), 2)}`}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 20, letterSpacing: -0.4 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },

    passTop: { flexDirection: 'row', justifyContent: 'space-between' },
    passLabel: { fontFamily: FONT_FAMILIES.bold, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
    passMasked: { fontFamily: FONT_FAMILIES.bold, fontSize: 12, color: 'rgba(255,255,255,0.85)', letterSpacing: 1 },
    passSmall: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 12 },
    passBalance: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 40, lineHeight: 48, color: '#FFFFFF', letterSpacing: -1.4 },
    holdRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderRadius: 12,
        padding: 8,
        marginTop: 8,
    },
    holdText: { flex: 1, fontFamily: FONT_FAMILIES.semiBold, fontSize: 12, color: '#FFFFFF', lineHeight: 16 },
    passStats: {
        flexDirection: 'row',
        marginTop: 16,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderRadius: 16,
        paddingVertical: 12,
    },
    passStat: { flex: 1, alignItems: 'center' },
    passStatValue: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 18, color: '#FFFFFF' },
    passStatLabel: { fontFamily: FONT_FAMILIES.medium, fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2.0 },
    passStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },

    card: { borderRadius: 24, borderWidth: 0, padding: 16 },
    amountRow: { flexDirection: 'row', alignItems: 'center' },
    rupee: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 34, marginRight: 4 },
    amountInput: { flex: 1, fontFamily: FONT_FAMILIES.extraBold, fontSize: 42, letterSpacing: -1.2, paddingVertical: 4 },
    presetRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    preset: { flex: 1, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    presetText: { fontFamily: FONT_FAMILIES.bold, fontSize: 13.5 },
    methodRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    method: {
        flex: 1,
        height: 44,
        borderRadius: 14,
        borderWidth: 1.5,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    methodText: { fontFamily: FONT_FAMILIES.bold, fontSize: 13 },
    addHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    addTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 18 },
    fine: { fontFamily: FONT_FAMILIES.medium, fontSize: 12, textAlign: 'center', marginTop: 8 },

    step: { flexDirection: 'row', gap: 12, minHeight: 36 },
    stepRail: { alignItems: 'center', width: 20 },
    stepDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    stepLine: { width: 2, flex: 1, marginVertical: 2.0 },
    stepLabel: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 14, paddingTop: 1.0 },

    voltsCard: { marginTop: 16, borderRadius: 22, borderWidth: 0, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    voltsTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 18, color: '#FFFFFF' },
    voltsSub: { fontFamily: FONT_FAMILIES.medium, fontSize: 12.5, color: '#FFFFFF', opacity: 0.75, marginTop: 2.0 },
    voltsBtn: { backgroundColor: '#007AFF', borderRadius: 14, paddingHorizontal: 16, height: 42, justifyContent: 'center' },
    voltsBtnText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 13, color: '#FFFFFF' },

    list: { borderRadius: 24, borderWidth: 0, overflow: 'hidden' },
    txn: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    txnIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    txnTitle: { fontFamily: FONT_FAMILIES.bold, fontSize: 14.5 },
    txnSub: { fontFamily: FONT_FAMILIES.medium, fontSize: 12, marginTop: 1.0 },
    txnAmount: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 15 },
    disputeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, minHeight: 24 },
    disputeText: { fontFamily: FONT_FAMILIES.bold, fontSize: 12 },
});
