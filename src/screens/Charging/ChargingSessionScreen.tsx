import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Linking, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
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

/** Slide the thumb all the way across to stop charging. */
function SlideToStop({ onComplete, color }: { onComplete: () => void; color: string }) {
    const THUMB = 56;
    const [trackW, setTrackW] = useState(0);
    const x = useRef(new Animated.Value(0)).current;
    const max = Math.max(0, trackW - THUMB - 8);
    const maxRef = useRef(0);
    maxRef.current = max;
    const doneRef = useRef(onComplete);
    doneRef.current = onComplete;

    const pan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_e, g) => x.setValue(Math.max(0, Math.min(maxRef.current, g.dx))),
            onPanResponderRelease: (_e, g) => {
                if (maxRef.current > 0 && g.dx >= maxRef.current * 0.9) {
                    Animated.timing(x, { toValue: maxRef.current, duration: 80, useNativeDriver: true }).start(() => {
                        doneRef.current();
                        x.setValue(0);
                    });
                } else {
                    Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
                }
            },
            onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(),
        })
    ).current;

    const labelOpacity = x.interpolate({ inputRange: [0, Math.max(1, max * 0.6)], outputRange: [1, 0], extrapolate: 'clamp' });

    return (
        <View
            onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Slide to stop charging"
            accessibilityHint="Swipe right with one finger to stop charging"
            accessibilityActions={[{ name: 'activate', label: 'Stop charging' }]}
            onAccessibilityAction={() => onComplete()}
            style={[styles.slideTrack, { backgroundColor: color }]}
        >
            <Animated.View style={[styles.slideLabelWrap, { opacity: labelOpacity }]} pointerEvents="none">
                <ThemedText style={styles.slideLabel}>Slide to stop</ThemedText>
                <ThemedText style={styles.slideSub}>Auto-pay from wallet</ThemedText>
            </Animated.View>
            <Animated.View {...pan.panHandlers} style={[styles.slideThumb, { transform: [{ translateX: x }] }]}>
                <Square size={20} color={color} fill={color} />
            </Animated.View>
        </View>
    );
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
    const W = cardW - 32;
    const H = 180;
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

    const rows = [
        { label: 'Charging speed', value: `${power} kW`, icon: <Zap size={18} color={colors.primary} fill={colors.primary} />, tint: 'rgba(0,122,255,0.14)' },
        { label: 'Elapsed time', value: fmtElapsed(elapsed), icon: <Clock size={18} color={colors.violet} />, tint: 'rgba(88,86,214,0.14)' },
        { label: 'Energy delivered', value: `${kwh.toFixed(1)} kWh`, icon: <BatteryCharging size={18} color={colors.success} />, tint: 'rgba(52,199,89,0.16)' },
        { label: 'Session cost', value: formatRupees(cost, 1), icon: <Receipt size={18} color={colors.warning} />, tint: 'rgba(255,149,0,0.16)' },
    ];

    const live = status === 'CHARGING';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: insets.bottom + 130 }} showsVerticalScrollIndicator={false}>
                <View style={styles.topRow}>
                    <GlassButton label="Back" size={44} onPress={() => navigation.goBack()}>
                        <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
                    </GlassButton>
                    <Glass radius={22} style={styles.activePill}>
                        <View style={[styles.liveDot, { backgroundColor: live ? colors.success : colors.warning }]} />
                        <ThemedText style={[styles.activeText, { color: live ? colors.success : colors.warning }]}>
                            {live ? 'Session active' : info.title}
                        </ThemedText>
                    </Glass>
                    <GlassButton label="More options" size={44} onPress={more}>
                        <ThemedText style={[styles.dots, { color: colors.text }]}>•••</ThemedText>
                    </GlassButton>
                </View>

                <ThemedText style={[styles.title, { color: colors.text }]}>Charging</ThemedText>
                <ThemedText style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
                    {station.name} · {activeSession?.chargerId ?? connector.id} · {connector.type} {connector.power} kW
                </ThemedText>

                {/* State of charge with the graph */}
                <View style={[styles.chartCard, { backgroundColor: colors.surface, marginTop: 16 }]}>
                    <View style={styles.socHead}>
                        <View>
                            <ThemedText style={[styles.socLabel, { color: colors.textMuted }]}>State of charge</ThemedText>
                            <View style={styles.socRow}>
                                <ThemedText style={[styles.soc, { color: colors.text }]}>{soc}</ThemedText>
                                <ThemedText style={[styles.socPct, { color: colors.textMuted }]}>%</ThemedText>
                            </View>
                        </View>
                        <View style={[styles.seg, { backgroundColor: isDark ? 'rgba(118,118,128,0.24)' : 'rgba(118,118,128,0.12)' }]}>
                            {(['speed', 'time'] as const).map((m) => (
                                <Pressable
                                    key={m}
                                    accessibilityRole="tab"
                                    accessibilityState={{ selected: mode === m }}
                                    onPress={() => setMode(m)}
                                    style={[styles.segItem, mode === m && { backgroundColor: colors.background }]}
                                >
                                    <ThemedText style={[styles.segText, { color: mode === m ? colors.text : colors.textMuted }]}>{m === 'speed' ? 'By battery' : 'By time'}</ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                    <Svg width={W} height={H}>
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
                                <SvgText x={xOf(80) + 8} y={26} fontSize="11" fontWeight="700" fill="#FF9500">
                                    Slows after 80%
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
                </View>

                {/* Live numbers as an inset grouped list */}
                <View style={[styles.group, { backgroundColor: colors.surface }]}>
                    {rows.map((r, i) => (
                        <View key={r.label} style={[styles.groupRow, i > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                            <View style={[styles.groupIcon, { backgroundColor: r.tint }]}>{r.icon}</View>
                            <ThemedText style={[styles.groupLabel, { color: colors.text }]}>{r.label}</ThemedText>
                            <ThemedText style={[styles.groupValue, { color: colors.text }]}>{r.value}</ThemedText>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Stop: slide to confirm */}
            <View style={[styles.stopWrap, { paddingBottom: Math.max(insets.bottom, 14) }]} pointerEvents="box-none">
                <SlideToStop color={colors.error} onComplete={doStop} />
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
    activePill: { height: 40, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
    activeText: { fontSize: 15, fontWeight: '600' },
    liveDot: { width: 9, height: 9, borderRadius: 5 },
    dots: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
    title: { fontSize: 34, lineHeight: 41, fontWeight: '800', letterSpacing: -0.6, marginTop: 14 },
    subtitle: { fontSize: 15, fontWeight: '500', marginTop: 4 },
    socHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    socLabel: { fontSize: 15, fontWeight: '600' },
    socRow: { flexDirection: 'row', alignItems: 'flex-end' },
    soc: { fontSize: 56, fontWeight: '800', letterSpacing: -2, lineHeight: 64 },
    socPct: { fontSize: 24, fontWeight: '600', marginBottom: 8, marginLeft: 2 },
    etaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, borderRadius: 16, paddingHorizontal: 14, marginTop: 14 },
    etaMain: { fontSize: 16, fontWeight: '700', flex: 1 },
    etaSub: { fontSize: 14, fontWeight: '500' },
    group: { borderRadius: 22, overflow: 'hidden', marginTop: 12 },
    groupRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 56 },
    groupIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    groupLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
    groupValue: { fontSize: 16, fontWeight: '700' },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 20, fontWeight: '800' },
    sectionAction: { fontSize: 14, fontWeight: '600' },
    limitRow: { paddingHorizontal: 16, paddingVertical: 12 },
    limitTop: { flexDirection: 'row', alignItems: 'center' },
    limitValue: { fontSize: 14, fontWeight: '600' },
    bar: { height: 6, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3 },
    seg: { flexDirection: 'row', borderRadius: 11, padding: 3 },
    segItem: { height: 30, paddingHorizontal: 12, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    segText: { fontSize: 12, fontWeight: '700' },
    chartCard: { borderRadius: 22, padding: 16, marginTop: 10 },
    stopWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
    slideTrack: { height: 64, borderRadius: 32, justifyContent: 'center', padding: 4 },
    slideLabelWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
    slideLabel: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    slideSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginTop: 1 },
    slideThumb: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
    sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    sheetTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    carRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth },
    carName: { fontSize: 17, fontWeight: '700' },
});
