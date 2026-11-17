import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LifeBuoy, Square, Repeat, X, Zap, Check } from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';
import { useCharging } from '../../context/ChargingContext';
import { MOCK_STATIONS, Station, findStationByConnector, getRecommendedConnector, getStationById } from '../../constants/Stations';
import { FONT_FAMILIES } from '../../constants/Tokens';
import { Segmented } from '../../components/stack/StackKit';
import { PulseButton } from '../../components/pulse/PulseKit';
import { Divider, HeaderIcon, KeyValue, ON_HIGHLIGHT, Option, Panel, Row, ScreenTitle, Section, StatGrid, flat } from '../../components/flat/FlatKit';
import { explainSessionStatus, formatRupees, sessionHoldAmount } from '../../utils/pulse';

const CAR_IMAGE = require('../../../assets/images/profile-car.webp');
const TARGETS = [80, 85, 90, 100];

function fmtTime(total: number) {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const p = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

export default function ChargingSessionScreen({ navigation, route }: any) {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { vehicles, selectedVehicle, selectVehicle, updateVehicle } = useVehicles();
    const { activeSession, startChargingSession, stopChargingSession, updateTargetSoc } = useCharging();

    const routeStation = route.params?.stationSnapshot as Station | undefined;
    const station: Station = routeStation ?? getStationById(route.params?.stationId) ?? findStationByConnector(route.params?.connectorId)?.station ?? MOCK_STATIONS[0];
    const connector = station.connectors.find((c) => c.id === route.params?.connectorId) ?? getRecommendedConnector(station);

    const [target, setTarget] = useState<number>(activeSession?.targetSoc ?? route.params?.targetSoc ?? selectedVehicle?.chargeTarget ?? 80);
    const [chart, setChart] = useState<'power' | 'battery'>('power');
    const [confirmStop, setConfirmStop] = useState(false);
    const [switchCar, setSwitchCar] = useState(false);
    const [autocharge, setAutocharge] = useState(selectedVehicle?.autochargeEnabled ?? true);

    useEffect(() => {
        if (activeSession) return;
        startChargingSession({
            stationId: station.id,
            stationName: station.name,
            stationAddress: station.address,
            chargerId: connector.id,
            connectorId: connector.id,
            connectorType: connector.type,
            powerRatingKw: connector.power,
            pricePerKWh: connector.pricePerKWh,
            vehicleId: selectedVehicle?.id ?? '1',
            vehicleModel: selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'Hyundai IONIQ 5',
            vehicleRegNo: selectedVehicle?.registrationNumber ?? 'TN 38 BZ 9021',
            startSoc: selectedVehicle?.currentBattery ?? 33,
            targetSoc: target,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSession]);

    const soc = activeSession ? Math.round(activeSession.currentSoc) : selectedVehicle?.currentBattery ?? 45;
    const power = activeSession?.currentPowerKw ?? 0;
    const kwh = activeSession?.energyDeliveredKwh ?? 0;
    const cost = activeSession?.totalCost ?? 0;
    const elapsed = activeSession?.elapsedSeconds ?? 0;
    const status = activeSession?.status ?? 'CONNECTING';
    const info = explainSessionStatus(status);
    const hold = sessionHoldAmount(cost);
    const minsLeft = Math.max(1, Math.round(Math.max(0, target - soc) * 0.42));
    const eta = useMemo(() => new Date(Date.now() + minsLeft * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), [minsLeft]);
    const rangeAdded = selectedVehicle ? Math.round((kwh / selectedVehicle.batteryCapacity) * selectedVehicle.estRangeKm * 1.6) : 0;
    const history = activeSession?.powerHistory ?? [];
    const peak = Math.max(1, ...history.map((h) => h.powerKw), connector.power);
    const car = selectedVehicle;

    const setNewTarget = (t: number) => {
        setTarget(t);
        updateTargetSoc(t);
    };

    const doStop = () => {
        setConfirmStop(false);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        const receipt = stopChargingSession('Driver initiated stop');
        if (receipt) {
            navigation.navigate('Payment', {
                receipt,
                stationSnapshot: station,
                totalEnergy: receipt.energyDeliveredKwh,
                totalTime: Math.max(1, Math.floor(elapsed / 60)),
                cost: receipt.totalAmountPaid,
                endingSoc: receipt.endSoc,
            });
        }
    };

    const help = () =>
        Alert.alert('Need help with this charge?', 'Gun stuck, charge slow or stopped? We are here 24/7.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call 1800-419-4747', onPress: () => Linking.openURL('tel:18004194747').catch(() => {}) },
        ]);

    return (
        <View style={[flat.screen, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 6, paddingHorizontal: 16, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
                <ScreenTitle
                    title="Charging"
                    subtitle={`${activeSession?.stationName ?? station.name} · ${activeSession?.chargerId ?? connector.id}`}
                    onBack={() => navigation.goBack()}
                    right={
                        <HeaderIcon label="Help with this charge" onPress={help}>
                            <LifeBuoy size={18} color={colors.text} />
                        </HeaderIcon>
                    }
                />

                {/* The one highlight on this screen: live battery and money */}
                <Panel tone="highlight" style={{ marginTop: 12 }}>
                    <View style={styles.socRow}>
                        <ThemedText style={styles.soc}>{soc}</ThemedText>
                        <ThemedText style={styles.socPct}>%</ThemedText>
                        <View style={{ flex: 1 }} />
                        <View style={{ alignItems: 'flex-end' }}>
                            <ThemedText style={styles.eta}>{target}% by {eta}</ThemedText>
                            <ThemedText style={[flat.caption, { color: ON_HIGHLIGHT.sub }]}>~{minsLeft} min left</ThemedText>
                        </View>
                    </View>
                    <View style={styles.bar}>
                        <View style={[styles.barFill, { width: `${Math.min(100, soc)}%` }]} />
                        <View style={[styles.barTick, { left: `${target}%` }]} />
                    </View>
                    <StatGrid
                        onHighlight
                        columns={2}
                        items={[
                            { label: 'Power', value: `${power} kW` },
                            { label: 'Added', value: `${kwh.toFixed(2)} kWh` },
                            { label: 'Cost so far', value: formatRupees(cost, 2) },
                            { label: 'Time', value: fmtTime(elapsed) },
                        ]}
                    />
                </Panel>

                <Panel tone={info.tone === 'stop' ? 'danger' : info.tone === 'wait' ? 'warning' : 'default'} style={{ marginTop: 12 }}>
                    <ThemedText style={[flat.h2, { color: colors.text, fontSize: 17 }]}>{info.title}</ThemedText>
                    <ThemedText style={[flat.body, { color: colors.textMuted, marginTop: 4 }]}>{info.detail}</ThemedText>
                    <ThemedText style={[flat.caption, { color: colors.text, marginTop: 10 }]}>
                        {formatRupees(hold)} held from your wallet. Unused amount returns when you stop.
                    </ThemedText>
                </Panel>

                <Section title="Charging speed">
                    <Panel>
                        <Segmented
                            options={[
                                { value: 'power', label: 'Speed (kW)' },
                                { value: 'battery', label: 'Battery (%)' },
                            ]}
                            value={chart}
                            onChange={setChart}
                        />
                        <View style={styles.chart}>
                            {(history.length ? history : [{ time: '0:00', powerKw: 0, soc }]).map((h, i, arr) => {
                                const v = chart === 'power' ? h.powerKw / peak : h.soc / 100;
                                const last = i === arr.length - 1;
                                return (
                                    <View key={`${h.time}-${i}`} style={styles.chartCol}>
                                        <View style={[styles.chartBar, { height: `${Math.max(6, v * 100)}%`, backgroundColor: last ? colors.lime : colors.primary, opacity: last ? 1 : 0.5 }]} />
                                        <ThemedText style={[styles.chartLbl, { color: colors.textSoft }]}>{h.time}</ThemedText>
                                    </View>
                                );
                            })}
                        </View>
                        <ThemedText style={[flat.caption, { color: colors.textMuted, marginTop: 10 }]}>Speed slows above 80% to protect your battery. That is normal.</ThemedText>
                    </Panel>
                </Section>

                <Section title="Details">
                    <Panel>
                        <StatGrid
                            columns={2}
                            items={[
                                { label: 'Voltage', value: `${activeSession?.currentVoltageV ?? 0} V` },
                                { label: 'Current', value: `${activeSession?.currentAmperageA ?? 0} A` },
                                { label: 'Battery temp', value: `${activeSession?.batteryTempCelsius ?? 31}°C` },
                                { label: 'Range added', value: `+${rangeAdded} km` },
                            ]}
                        />
                    </Panel>
                </Section>

                <Section title="Stop automatically at">
                    <View style={flat.rowGap}>
                        {TARGETS.map((t) => (
                            <Option key={t} label={`${t}%`} selected={t === target} onPress={() => setNewTarget(t)} style={{ flex: 1 }} />
                        ))}
                    </View>
                </Section>

                <Section title="Your car">
                    <Panel padded={false}>
                        <View style={styles.carRow}>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={[styles.carName, { color: colors.text }]} numberOfLines={1}>
                                    {activeSession?.vehicleModel ?? (car ? `${car.make} ${car.model}` : 'Your EV')}
                                </ThemedText>
                                <ThemedText style={[flat.caption, { color: colors.textMuted }]}>{activeSession?.vehicleRegNo ?? car?.registrationNumber}</ThemedText>
                            </View>
                            <View style={styles.carImgWrap}>
                                <Image source={CAR_IMAGE} style={styles.carImg} resizeMode="contain" />
                            </View>
                        </View>
                        <Divider />
                        <Row
                            title="Autocharge (plug & charge)"
                            subtitle="Start automatically when you plug in"
                            onPress={() => {
                                setAutocharge((a) => !a);
                                if (car) updateVehicle(car.id, { autochargeEnabled: !autocharge });
                            }}
                            right={
                                <View style={[styles.toggle, { backgroundColor: autocharge ? colors.lime : colors.surfaceMuted }]}>
                                    <View style={[styles.knob, { backgroundColor: autocharge ? '#0B0B0F' : '#FFFFFF', transform: [{ translateX: autocharge ? 20 : 0 }] }]} />
                                </View>
                            }
                        />
                        {vehicles.length > 1 ? (
                            <>
                                <Divider />
                                <Row icon={<Repeat size={16} color={colors.text} />} title="Switch car" onPress={() => setSwitchCar(true)} chevron />
                            </>
                        ) : null}
                    </Panel>
                </Section>

                {station.amenities?.length ? (
                    <Section title="While you wait">
                        <ThemedText style={[flat.body, { color: colors.text }]}>{station.amenities.join(' · ')}</ThemedText>
                    </Section>
                ) : null}
            </ScrollView>

            <View style={[flat.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <PulseButton title="Stop charging" variant="danger" icon={<Square size={15} color="#FFFFFF" fill="#FFFFFF" />} onPress={() => setConfirmStop(true)} />
            </View>

            <Modal visible={confirmStop} transparent animationType="fade" onRequestClose={() => setConfirmStop(false)}>
                <View style={styles.overlay}>
                    <View style={[styles.modal, { backgroundColor: colors.surface }]}>
                        <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Stop at {soc}%?</ThemedText>
                        <ThemedText style={[flat.body, { color: colors.textMuted, marginTop: 6 }]}>
                            You pay for {kwh.toFixed(2)} kWh only. Unplug within 15 minutes to avoid idle fees.
                        </ThemedText>
                        <View style={{ marginTop: 12 }}>
                            <KeyValue label="Battery" value={`${soc}%`} />
                            <KeyValue label="Energy" value={`${kwh.toFixed(2)} kWh`} />
                            <KeyValue label="To pay" value={formatRupees(cost, 2)} strong />
                        </View>
                        <PulseButton title="Yes, stop and pay" variant="danger" onPress={doStop} style={{ marginTop: 16 }} />
                        <PulseButton title="Keep charging" variant="ghost" icon={<Zap size={15} color={colors.text} />} onPress={() => setConfirmStop(false)} style={{ marginTop: 8 }} />
                    </View>
                </View>
            </Modal>

            <Modal visible={switchCar} transparent animationType="slide" onRequestClose={() => setSwitchCar(false)}>
                <View style={styles.overlay}>
                    <View style={[styles.modal, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHead}>
                            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Which car?</ThemedText>
                            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setSwitchCar(false)} hitSlop={10}>
                                <X size={20} color={colors.text} />
                            </Pressable>
                        </View>
                        {vehicles.map((v, i) => (
                            <View key={v.id}>
                                {i > 0 ? <Divider /> : null}
                                <Row
                                    title={`${v.make} ${v.model}`}
                                    subtitle={`${v.registrationNumber} · ${v.connectorType} · ${v.currentBattery}%`}
                                    onPress={() => {
                                        selectVehicle(v.id);
                                        setSwitchCar(false);
                                    }}
                                    right={v.id === car?.id ? <Check size={18} color={colors.text} /> : undefined}
                                />
                            </View>
                        ))}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    socRow: { flexDirection: 'row', alignItems: 'flex-end' },
    soc: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 68, lineHeight: 72, letterSpacing: -3.5, color: '#0B0B0F' },
    socPct: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 26, marginBottom: 10, marginLeft: 2, color: '#0B0B0F' },
    eta: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 15, color: '#0B0B0F' },
    bar: { height: 10, borderRadius: 5, marginTop: 8, marginBottom: 6, backgroundColor: 'rgba(11,11,15,0.12)', justifyContent: 'center' },
    barFill: { height: 10, borderRadius: 5, backgroundColor: '#0B0B0F' },
    barTick: { position: 'absolute', width: 3, height: 18, borderRadius: 2, backgroundColor: '#0B0B0F', marginLeft: -1.5 },
    chart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6, marginTop: 14 },
    chartCol: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
    chartBar: { width: '100%', borderRadius: 6 },
    chartLbl: { fontFamily: FONT_FAMILIES.medium, fontSize: 9, marginTop: 4 },
    carRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    carName: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 16 },
    carImgWrap: { width: 110, height: 60, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    carImg: { width: 104, height: 56 },
    toggle: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
    knob: { width: 22, height: 22, borderRadius: 11 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', padding: 12 },
    modal: { borderRadius: 24, padding: 20 },
    modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    modalTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 22, letterSpacing: -0.5 },
});
