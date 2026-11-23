import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Line, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Clock, Zap, Gauge, BatteryCharging, Receipt, Square, X, Check } from '../../components/sf/icons';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';
import { useCharging } from '../../context/ChargingContext';
import { MOCK_STATIONS, Station, findStationByConnector, getRecommendedConnector, getStationById } from '../../constants/Stations';
import { GlassButton, Glass } from '../../components/glass/Glass';
import { explainSessionStatus, formatRupees, sessionHoldAmount } from '../../utils/pulse';

const TARGETS = [80, 85, 90, 100];
const HOLD_MS = 900;

function fmtElapsed(total: number) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Power as a share of the connector's maximum at a given battery level (BMS taper above 80%). */
function powerAt(soc: number) {
    if (soc < 4) return 0.55 + soc * 0.1;
    if (soc <= 55) return 0.95;
    if (soc <= 80) return 0.95 - ((soc - 55) / 25) * 0.4;
    return 0.55 - ((soc - 80) / 20) * 0.33;
}

/** Live charging (iOS 27 design). */
export default function ChargingSessionScreen({ navigation, route }: any) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { vehicles, selectedVehicle, selectVehicle } = useVehicles();
    const { activeSession, startChargingSession, stopChargingSession, updateTargetSoc } = useCharging();

    const routeStation = route.params?.stationSnapshot as Station | undefined;
    const station: Station = routeStation ?? getStationById(route.params?.stationId) ?? findStationByConnector(route.params?.connectorId)?.station ?? MOCK_STATIONS[0];
    const connector = station.connectors.find((c) => c.id === route.params?.connectorId) ?? getRecommendedConnector(station);

    const [target, setTarget] = useState<number>(activeSession?.targetSoc ?? route.params?.targetSoc ?? selectedVehicle?.chargeTarget ?? 80);
    const [mode, setMode] = useState<'speed' | 'time'>('speed');
    const [switchCar, setSwitchCar] = useState(false);
    const [holding, setHolding] = useState(false);

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
    const maxKw = connector.power || 60;
    const minsLeft = Math.max(1, Math.round(Math.max(0, Math.min(target, 80) - soc) * 0.42));
    const eta = useMemo(() => new Date(Date.now() + minsLeft * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), [minsLeft]);
    const car = selectedVehicle;

    const doStop = () => {
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

    const more = () =>
        Alert.alert('Session options', `${station.name} · ${activeSession?.chargerId ?? connector.id}`, [
            { text: `Stop automatically at ${target}%`, onPress: () => cycleTarget() },
            ...(vehicles.length > 1 ? [{ text: 'Switch car', onPress: () => setSwitchCar(true) }] : []),
            { text: 'Call 24/7 help', onPress: () => Linking.openURL('tel:18004194747').catch(() => {}) },
            { text: 'Cancel', style: 'cancel' as const },
        ]);

    const cycleTarget = () => {
        const next = TARGETS[(TARGETS.indexOf(target) + 1) % TARGETS.length];
        setTarget(next);
        updateTargetSoc(next);
    };

    /* ── Chart ── */
    const cardW = width - 32;
    const W = cardW - 40;
    const H = 190;
    const padL = 34;
    const padB = 26;
    const plotW = W - padL - 6;
    const plotH = H - padB - 8;
    const xOf = (p: number) => padL + (p / 100) * plotW;
    const yOf = (kwFrac: number) => 8 + (1 - kwFrac) * plotH;

    const curve = (upTo: number) => {
        let d = '';
        for (let p = 0; p <= upTo; p += 2) {
            const y = yOf(powerAt(p));
            d += `${p === 0 ? 'M' : 'L'}${xOf(p).toFixed(1)} ${y.toFixed(1)} `;
        }
        return d;
    };
    const area = (upTo: number) => `${curve(upTo)}L${xOf(upTo).toFixed(1)} ${yOf(0)} L${xOf(0)} ${yOf(0)} Z`;
    const history = activeSession?.powerHistory ?? [];
    const peak = Math.max(1, ...history.map((h) => h.powerKw), maxKw);
    const timeLine = history.map((h, i) => `${i === 0 ? 'M' : 'L'}${(padL + (i / Math.max(1, history.length - 1)) * plotW).toFixed(1)} ${yOf(h.powerKw / peak).toFixed(1)}`).join(' ');

    const tiles = [
        { label: 'Charging speed', value: `${power}`, unit: 'kW', icon: <Zap size={20} color={colors.primary} />, tint: 'rgba(0,122,255,0.14)' },
        { label: 'Elapsed time', value: fmtElapsed(elapsed), unit: 'min', icon: <Clock size={20} color={colors.violet} />, tint: 'rgba(88,86,214,0.14)' },
        { label: 'Energy delivered', value: kwh.toFixed(1), unit: 'kWh', icon: <BatteryCharging size={20} color={colors.success} />, tint: 'rgba(52,199,89,0.16)' },
        { label: 'Live session cost', value: formatRupees(cost, 1), unit: '', icon: <Receipt size={20} color={colors.error} />, tint: 'rgba(255,59,48,0.14)' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: insets.bottom + 140 }} showsVerticalScrollIndicator={false}>
                <View style={styles.topRow}>
                    <GlassButton label="Back" size={52} onPress={() => navigation.goBack()}>
                        <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
                    </GlassButton>
                    <Glass radius={24} style={styles.activePill}>
                        <View style={[styles.liveDot, { backgroundColor: status === 'CHARGING' ? colors.success : colors.warning }]} />
                        <ThemedText style={[styles.activeText, { color: status === 'CHARGING' ? colors.success : colors.warning }]}>
                            {status === 'CHARGING' ? 'Session active' : info.title}
                        </ThemedText>
                    </Glass>
                    <GlassButton label="More options" size={52} onPress={more}>
                        <ThemedText style={[styles.dots, { color: colors.text }]}>•••</ThemedText>
                    </GlassButton>
                </View>

                {/* State of charge */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.socHead}>
                        <View>
                            <ThemedText style={[styles.socLabel, { color: colors.textMuted }]}>State of charge</ThemedText>
                            <View style={styles.socRow}>
                                <ThemedText style={[styles.soc, { color: colors.text }]}>{soc}</ThemedText>
                                <ThemedText style={[styles.socPct, { color: colors.textSoft }]}>%</ThemedText>
                            </View>
                        </View>
                        <View style={[styles.seg, { backgroundColor: colors.surfaceMuted }]}>
                            {(['speed', 'time'] as const).map((m) => (
                                <Pressable
                                    key={m}
                                    accessibilityRole="tab"
                                    accessibilityState={{ selected: mode === m }}
                                    onPress={() => setMode(m)}
                                    style={[styles.segItem, mode === m && { backgroundColor: colors.primary }]}
                                >
                                    <ThemedText style={[styles.segText, { color: mode === m ? '#FFFFFF' : colors.textMuted }]}>{m}</ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <Svg width={W} height={H} style={{ marginTop: 8 }}>
                        <Defs>
                            <SvgGradient id="fillBlue" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="#007AFF" stopOpacity="0.28" />
                                <Stop offset="1" stopColor="#007AFF" stopOpacity="0.14" />
                            </SvgGradient>
                        </Defs>
                        {[0, 1 / 3, 2 / 3, 1].map((f) => (
                            <SvgText key={f} x={padL - 8} y={yOf(f) + 4} fontSize="12" fill={colors.textMuted} textAnchor="end" fontWeight="600">
                                {Math.round(f * maxKw)}
                            </SvgText>
                        ))}
                        {mode === 'speed' ? (
                            <>
                                <Rect x={xOf(80)} y={8} width={xOf(100) - xOf(80)} height={plotH} fill={isDark ? 'rgba(255,149,0,0.16)' : 'rgba(255,149,0,0.12)'} rx={6} />
                                <Line x1={xOf(80)} y1={8} x2={xOf(80)} y2={yOf(0)} stroke="#FF9500" strokeWidth={1.5} strokeDasharray="4 4" />
                                <SvgText x={xOf(80) + 8} y={26} fontSize="11" fontWeight="800" fill="#FF9500" letterSpacing={1}>
                                    SLOWS AFTER 80%
                                </SvgText>
                                <Path d={area(soc)} fill="url(#fillBlue)" />
                                <Path d={curve(100)} fill="none" stroke={colors.primary} strokeWidth={3} strokeLinecap="round" opacity={0.35} />
                                <Path d={curve(soc)} fill="none" stroke={colors.primary} strokeWidth={3.5} strokeLinecap="round" />
                                <Line x1={xOf(soc)} y1={8} x2={xOf(soc)} y2={yOf(0)} stroke={colors.primary} strokeWidth={1.5} opacity={0.5} />
                                <Circle cx={xOf(soc)} cy={yOf(powerAt(soc))} r={11} fill={colors.primary} opacity={0.22} />
                                <Circle cx={xOf(soc)} cy={yOf(powerAt(soc))} r={6} fill={colors.primary} />
                            </>
                        ) : (
                            <>
                                <Path d={timeLine || 'M0 0'} fill="none" stroke={colors.primary} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
                                {history.length ? <Circle cx={padL + plotW} cy={yOf(history[history.length - 1].powerKw / peak)} r={6} fill={colors.primary} /> : null}
                            </>
                        )}
                        <Line x1={padL} y1={yOf(0)} x2={padL + plotW} y2={yOf(0)} stroke={colors.border} strokeWidth={1.5} />
                        {(mode === 'speed' ? [0, 20, 40, 60, 80, 100] : []).map((p) => (
                            <SvgText key={p} x={xOf(p)} y={H - 6} fontSize="12" fill={colors.textMuted} textAnchor="middle" fontWeight="600">
                                {p}%
                            </SvgText>
                        ))}
                        {mode === 'time'
                            ? history.filter((_, i) => i % 2 === 0).map((h, i, arr) => (
                                  <SvgText key={h.time + i} x={padL + (i / Math.max(1, arr.length - 1)) * plotW} y={H - 6} fontSize="11" fill={colors.textMuted} textAnchor="middle" fontWeight="600">
                                      {h.time}
                                  </SvgText>
                              ))
                            : null}
                    </Svg>

                    <View style={[styles.etaBar, { backgroundColor: colors.surfaceMuted }]}>
                        <Clock size={20} color={colors.primary} />
                        <ThemedText style={[styles.etaMain, { color: colors.text }]}>{minsLeft} min to {Math.min(target, 80)}%</ThemedText>
                        <ThemedText style={[styles.etaSub, { color: colors.textMuted }]}>ETA {eta}</ThemedText>
                    </View>
                </View>

                {/* Tiles */}
                <View style={styles.tiles}>
                    {tiles.map((t) => (
                        <View key={t.label} style={[styles.tile, { backgroundColor: colors.surface }]}>
                            <View style={styles.tileTop}>
                                <View style={[styles.tileIcon, { backgroundColor: t.tint }]}>{t.icon}</View>
                                <ThemedText style={[styles.tileLabel, { color: colors.textMuted }]} numberOfLines={1}>{t.label}</ThemedText>
                            </View>
                            <View style={styles.tileValRow}>
                                <ThemedText style={[styles.tileVal, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{t.value}</ThemedText>
                                {t.unit ? <ThemedText style={[styles.tileUnit, { color: colors.textMuted }]}>{t.unit}</ThemedText> : null}
                            </View>
                        </View>
                    ))}
                </View>

                <View style={[styles.note, { backgroundColor: info.tone === 'stop' ? 'rgba(255,59,48,0.12)' : info.tone === 'wait' ? 'rgba(255,149,0,0.12)' : colors.surface }]}>
                    <ThemedText style={[styles.noteTitle, { color: colors.text }]}>{info.title}</ThemedText>
                    <ThemedText style={[styles.noteBody, { color: colors.textMuted }]}>{info.detail}</ThemedText>
                    <ThemedText style={[styles.noteBody, { color: colors.text, marginTop: 8 }]}>
                        {formatRupees(hold)} held from your wallet. Unused amount returns when you stop.
                    </ThemedText>
                </View>
            </ScrollView>

            {/* Stop: hold to confirm */}
            <View style={[styles.stopWrap, { paddingBottom: Math.max(insets.bottom, 14) }]} pointerEvents="box-none">
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Stop charging"
                    accessibilityHint="Press and hold to stop and pay from your wallet"
                    delayLongPress={HOLD_MS}
                    onPressIn={() => setHolding(true)}
                    onPressOut={() => setHolding(false)}
                    onLongPress={doStop}
                    onPress={() => {
                        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
                    }}
                    style={[styles.stopBtn, { backgroundColor: colors.error, transform: [{ scale: holding ? 0.98 : 1 }] }]}
                >
                    <Square size={18} color="#FFFFFF" fill="#FFFFFF" />
                    <View style={{ alignItems: 'center' }}>
                        <ThemedText style={styles.stopTitle}>Stop Charging</ThemedText>
                        <ThemedText style={styles.stopSub}>{holding ? 'Keep holding…' : 'Hold to confirm • auto-pay from wallet'}</ThemedText>
                    </View>
                </Pressable>
            </View>

            <Modal visible={switchCar} transparent animationType="slide" onRequestClose={() => setSwitchCar(false)}>
                <View style={styles.overlay}>
                    <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.sheetHead}>
                            <ThemedText style={[styles.sheetTitle, { color: colors.text }]}>Which car?</ThemedText>
                            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setSwitchCar(false)} hitSlop={10}>
                                <X size={22} color={colors.text} />
                            </Pressable>
                        </View>
                        {vehicles.map((v) => (
                            <Pressable
                                key={v.id}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: v.id === car?.id }}
                                onPress={() => {
                                    selectVehicle(v.id);
                                    setSwitchCar(false);
                                }}
                                style={[styles.carRow, { borderTopColor: colors.border }]}
                            >
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={[styles.carName, { color: colors.text }]}>{v.make} {v.model}</ThemedText>
                                    <ThemedText style={{ color: colors.textMuted, fontSize: 14 }}>{v.registrationNumber} · {v.connectorType} · {v.currentBattery}%</ThemedText>
                                </View>
                                {v.id === car?.id ? <Check size={20} color={colors.primary} strokeWidth={3} /> : null}
                            </Pressable>
                        ))}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    activePill: { height: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
    activeText: { fontSize: 17, fontWeight: '600' },
    liveDot: { width: 9, height: 9, borderRadius: 5 },
    dots: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
    card: { borderRadius: 32, borderWidth: StyleSheet.hairlineWidth * 2, padding: 20, marginTop: 16 },
    socHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    socLabel: { fontSize: 18, fontWeight: '500' },
    socRow: { flexDirection: 'row', alignItems: 'flex-end' },
    soc: { fontSize: 84, fontWeight: '900', letterSpacing: -4, lineHeight: 92 },
    socPct: { fontSize: 36, fontWeight: '500', marginBottom: 16, marginLeft: 2.0 },
    seg: { flexDirection: 'row', borderRadius: 22, padding: 4, marginTop: 4 },
    segItem: { height: 38, paddingHorizontal: 16, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    segText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
    etaBar: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 56, borderRadius: 22, paddingHorizontal: 16, marginTop: 8 },
    etaMain: { fontSize: 19, fontWeight: '700', flex: 1 },
    etaSub: { fontSize: 17, fontWeight: '500' },
    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
    tile: { width: '48.4%', borderRadius: 30, padding: 16, minHeight: 124, justifyContent: 'space-between' },
    tileTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    tileLabel: { fontSize: 15.5, fontWeight: '600', flexShrink: 1 },
    tileValRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 8 },
    tileVal: { fontSize: 36, fontWeight: '900', letterSpacing: -1.2 },
    tileUnit: { fontSize: 19, fontWeight: '500', marginBottom: 4 },
    note: { borderRadius: 24, padding: 16, marginTop: 12 },
    noteTitle: { fontSize: 17, fontWeight: '700' },
    noteBody: { fontSize: 14.5, fontWeight: '500', lineHeight: 20, marginTop: 4 },
    stopWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
    stopBtn: { height: 72, borderRadius: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
    stopTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
    stopSub: { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.9)', marginTop: 1.0 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
    sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    sheetTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    carRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth },
    carName: { fontSize: 17, fontWeight: '700' },
});
