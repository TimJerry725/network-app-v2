import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LifeBuoy, Square, Repeat, X, Zap, Check } from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';
import { useCharging } from '../../context/ChargingContext';
import { MOCK_STATIONS, Station, findStationByConnector, getRecommendedConnector, getStationById } from '../../constants/Stations';
import { FONT_FAMILIES } from '../../constants/Tokens';
import { SKINS, SkinCard } from '../../components/stack/StackKit';
import { PulseButton } from '../../components/pulse/PulseKit';
import { Divider, HeaderIcon, Panel, Row, ScreenTitle, Section, flat } from '../../components/flat/FlatKit';
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

/** Power as a share of the connector's maximum at a battery level (the BMS slows charging above 80%). */
function powerAt(soc: number) {
    if (soc < 4) return 0.55 + soc * 0.1;
    if (soc <= 55) return 0.95;
    if (soc <= 80) return 0.95 - ((soc - 55) / 25) * 0.4;
    return 0.55 - ((soc - 80) / 20) * 0.33;
}

export default function ChargingSessionScreen({ navigation, route }: any) {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
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
            maxSpend: route.params?.maxSpend,
            maxMinutes: route.params?.maxMinutes,
            maxEnergyKwh: route.params?.maxEnergyKwh,
            powerLimitPct: route.params?.powerLimitPct,
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
    const live = status === 'CHARGING';

    // Active stop conditions as chips
    const stops: string[] = [`Stops at ${target}%`];
    if (activeSession?.maxSpend) stops.push(`Spend ₹${activeSession.maxSpend} (₹${Math.round(cost)} so far)`);
    if (activeSession?.maxEnergyKwh) stops.push(`Energy ${activeSession.maxEnergyKwh} kWh (${kwh.toFixed(1)} so far)`);
    if (activeSession?.maxMinutes) stops.push(`Time ${activeSession.maxMinutes} min (${Math.floor(elapsed / 60)} so far)`);

    // Live graph
    const gW = width - 32 - 32;
    const gH = 110;
    const pts = (history.length > 1 ? history : [{ time: '0:00', powerKw: 0, soc }, { time: '0:01', powerKw: power, soc }]).map((h, i, arr) => {
        const v = chart === 'power' ? h.powerKw / peak : h.soc / 100;
        return { x: (i / Math.max(1, arr.length - 1)) * gW, y: 8 + (1 - Math.max(0, Math.min(1, v))) * (gH - 16) };
    });
    const line = pts.map((q, i) => `${i === 0 ? 'M' : 'L'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ');
    const area = `${line} L${gW} ${gH} L0 ${gH} Z`;
    const lastPt = pts[pts.length - 1];
    // Speed by battery level, with the slow zone above 80% shaded
    const xs = (pc: number) => (pc / 100) * gW;
    const ys = (f: number) => 8 + (1 - f) * (gH - 16);
    const curve = (upTo: number) => {
        let d = '';
        for (let pc = 0; pc <= upTo; pc += 2) d += `${pc === 0 ? 'M' : 'L'}${xs(pc).toFixed(1)} ${ys(powerAt(pc)).toFixed(1)} `;
        return d;
    };
    const socX = xs(Math.min(100, soc));
    const socY = ys(powerAt(Math.min(100, soc)));

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

                {/* Hero: live battery, graph and numbers in one card */}
                <SkinCard skin="violet" pattern="arcs" style={{ flex: 0, marginTop: 12 }}>
                    <View style={styles.heroPad}>
                        <View style={styles.heroTop}>
                            <View style={styles.livePill}>
                                <View style={[styles.liveDot, { backgroundColor: live ? colors.mint : colors.sun }]} />
                                <ThemedText style={styles.liveText}>{live ? 'Charging' : info.title}</ThemedText>
                            </View>
                            <ThemedText style={styles.heroEta}>{target}% by {eta} · ~{minsLeft} min</ThemedText>
                        </View>
                        <View style={styles.socRow}>
                            <ThemedText style={styles.soc}>{soc}</ThemedText>
                            <ThemedText style={styles.socPct}>%</ThemedText>
                        </View>

                        <View style={styles.graphHead}>
                            <ThemedText style={styles.graphTitle}>{chart === 'power' ? 'Charging speed by battery level' : 'Battery level over time'}</ThemedText>
                            <View style={styles.toggle2}>
                                {(['power', 'battery'] as const).map((m) => (
                                    <Pressable key={m} accessibilityRole="tab" accessibilityState={{ selected: chart === m }} onPress={() => setChart(m)} style={[styles.t2, chart === m && { backgroundColor: '#FFFFFF' }]}>
                                        <ThemedText style={[styles.t2Text, { color: chart === m ? '#0B0B0F' : '#FFFFFF' }]}>{m === 'power' ? 'kW' : '%'}</ThemedText>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                        <Svg width={gW} height={gH}>
                            <Defs>
                                <SvgGradient id="g" x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
                                    <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.02" />
                                </SvgGradient>
                            </Defs>
                            {chart === 'power' ? (
                                <>
                                    <Rect x={xs(80)} y={4} width={xs(100) - xs(80)} height={gH - 8} rx={8} fill="rgba(255,196,0,0.22)" />
                                    <Line x1={xs(80)} y1={4} x2={xs(80)} y2={gH - 4} stroke="#FFC400" strokeWidth={1.5} strokeDasharray="4 4" />
                                    <SvgText x={xs(80) + 6} y={20} fontSize="10" fontWeight="700" fill="#FFE27A">Slows after 80%</SvgText>
                                    <Path d={`${curve(Math.min(100, soc))}L${socX.toFixed(1)} ${gH} L0 ${gH} Z`} fill="url(#g)" />
                                    <Path d={curve(100)} fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" opacity={0.4} />
                                    <Path d={curve(Math.min(100, soc))} fill="none" stroke="#FFFFFF" strokeWidth={3.5} strokeLinecap="round" />
                                    <Line x1={socX} y1={4} x2={socX} y2={gH} stroke="#FFFFFF" strokeWidth={1.5} opacity={0.5} />
                                    <Circle cx={socX} cy={socY} r={10} fill="#FFFFFF" opacity={0.25} />
                                    <Circle cx={socX} cy={socY} r={5.5} fill="#FFFFFF" />
                                </>
                            ) : (
                                <>
                                    <Path d={area} fill="url(#g)" />
                                    <Path d={line} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                                    <Circle cx={lastPt.x} cy={lastPt.y} r={9} fill="#FFFFFF" opacity={0.25} />
                                    <Circle cx={lastPt.x} cy={lastPt.y} r={5} fill="#FFFFFF" />
                                </>
                            )}
                        </Svg>

                        <View style={styles.chips}>
                            {[
                                [`${power}`, 'kW'],
                                [kwh.toFixed(1), 'kWh'],
                                [formatRupees(cost, 0), 'so far'],
                                [fmtTime(elapsed), 'time'],
                            ].map(([v, l]) => (
                                <View key={l} style={styles.chip}>
                                    <ThemedText style={styles.chipVal} numberOfLines={1}>{v}</ThemedText>
                                    <ThemedText style={[styles.chipLbl, { color: SKINS.violet.sub }]}>{l}</ThemedText>
                                </View>
                            ))}
                        </View>
                    </View>
                </SkinCard>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stopChips}>
                    {stops.map((t) => (
                        <View key={t} style={[styles.stopChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <ThemedText style={[styles.stopChipText, { color: colors.text }]}>{t}</ThemedText>
                        </View>
                    ))}
                </ScrollView>

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

            <Modal visible={confirmStop} transparent animationType="slide" onRequestClose={() => setConfirmStop(false)}>
                <View style={styles.sheetOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setConfirmStop(false)} accessibilityLabel="Close" />
                    <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
                        <View style={[styles.grab, { backgroundColor: colors.border }]} />
                        <ThemedText style={[styles.sheetTitle, { color: colors.text }]}>Stop charging at {soc}%?</ThemedText>
                        <PulseButton title="Stop charging" variant="danger" icon={<Square size={15} color="#FFFFFF" fill="#FFFFFF" />} onPress={doStop} style={{ marginTop: 18 }} />
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
    heroPad: { padding: 18 },
    heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)' },
    liveDot: { width: 8, height: 8, borderRadius: 4 },
    liveText: { fontFamily: FONT_FAMILIES.bold, fontSize: 12, color: '#FFFFFF' },
    heroEta: { fontFamily: FONT_FAMILIES.bold, fontSize: 12.5, color: 'rgba(255,255,255,0.85)' },
    socRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 },
    soc: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 72, lineHeight: 76, letterSpacing: -3.5, color: '#FFFFFF' },
    socPct: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 26, marginBottom: 12, marginLeft: 2, color: 'rgba(255,255,255,0.8)' },
    graphHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 6 },
    graphTitle: { fontFamily: FONT_FAMILIES.bold, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
    toggle2: { flexDirection: 'row', borderRadius: 14, padding: 3, backgroundColor: 'rgba(255,255,255,0.18)' },
    t2: { height: 26, minWidth: 40, paddingHorizontal: 10, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    t2Text: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 12 },
    chips: { flexDirection: 'row', gap: 8, marginTop: 14 },
    chip: { flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
    chipVal: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 15, color: '#FFFFFF' },
    chipLbl: { fontFamily: FONT_FAMILIES.medium, fontSize: 10.5, marginTop: 1 },
    stopChips: { gap: 8, paddingVertical: 12 },
    stopChip: { height: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, justifyContent: 'center' },
    stopChipText: { fontFamily: FONT_FAMILIES.bold, fontSize: 12.5 },
    carRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    carName: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 16 },
    carImgWrap: { width: 110, height: 60, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    carImg: { width: 104, height: 56 },
    toggle: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
    knob: { width: 22, height: 22, borderRadius: 11 },
    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
    grab: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 14 },
    sheetTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 22, letterSpacing: -0.5, textAlign: 'center' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', padding: 12 },
    modal: { borderRadius: 24, padding: 20 },
    modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    modalTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 22, letterSpacing: -0.5 },
});
