import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInputInstance, View, useWindowDimensions } from 'react-native';
import { TextInput } from '../../components/ThemedTextInput';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X, Flashlight, FlashlightOff, Keyboard, Plug, CircleCheck, ScanLine, ChevronLeft, ChevronRight, Camera as CameraIcon } from '../../components/sf/icons';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';
import { useIndiaChargingStations } from '../../hooks/useIndiaChargingStations';
import { MOCK_STATIONS, Station, findStationByConnector, getRecommendedConnector, getStationById, isConnectorCompatible } from '../../constants/Stations';
import { stationService } from '../../services/api/stationService';
import { Glass, GlassButton } from '../../components/glass/Glass';
import { allInPrice, formatRupees } from '../../utils/pulse';

function tap(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
    if (Platform.OS !== 'web') Haptics.impactAsync(style).catch(() => {});
}

/** Scan (iOS 27 design): dark camera with blue brackets, charger ID with GO, connector sheet. */
export default function ScanScreen({ navigation, route }: any) {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const { selectedVehicle } = useVehicles();
    const { stations: allStations } = useIndiaChargingStations();
    const [permission, requestPermission] = useCameraPermissions();

    const inTab = navigation.getState?.()?.type === 'tab';
    const [torch, setTorch] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [code, setCode] = useState<string>(route.params?.connectorId ?? '');
    const codeRef = useRef<TextInputInstance>(null);

    const pre = getStationById(route.params?.stationId);
    const preMatch = findStationByConnector(route.params?.connectorId);
    const preStation = pre ?? preMatch?.station;

    const stationsList = useMemo(() => {
        const pool = allStations?.length ? allStations : MOCK_STATIONS;
        const sorted = [...pool].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
        return preStation && !sorted.some((s) => s.id === preStation.id) ? [preStation, ...sorted] : sorted;
    }, [allStations, preStation]);

    const [stationIdx, setStationIdx] = useState(0);
    useEffect(() => {
        if (!preStation) return;
        const i = stationsList.findIndex((s) => s.id === preStation.id);
        if (i >= 0) setStationIdx(i);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.params?.stationId, route.params?.connectorId, stationsList.length]);
    const station: Station = stationsList[stationIdx] ?? MOCK_STATIONS[0];

    const [connectorId, setConnectorId] = useState<string>(
        route.params?.connectorId ?? preMatch?.connector.id ?? getRecommendedConnector(station, selectedVehicle?.connectorType).id
    );
    useEffect(() => {
        if (!station.connectors.some((c) => c.id === connectorId)) {
            setConnectorId(getRecommendedConnector(station, selectedVehicle?.connectorType).id);
        }
    }, [station, connectorId, selectedVehicle?.connectorType]);

    const connector = station.connectors.find((c) => c.id === connectorId) ?? station.connectors[0];
    const target = selectedVehicle?.chargeTarget ?? 80;
    const estKwh = selectedVehicle ? Math.max(0, ((target - selectedVehicle.currentBattery) / 100) * selectedVehicle.batteryCapacity) : 0;
    const estCost = connector ? estKwh * allInPrice(connector.pricePerKWh) : 0;
    const nearbyFree = station.connectors.filter((c) => c.status === 'Available').length;

    const laser = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(laser, { toValue: 1, duration: 1700, useNativeDriver: true }),
                Animated.timing(laser, { toValue: 0, duration: 1700, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [laser]);

    const startSession = (resolved?: string) => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        const c = (resolved || connectorId || connector?.id || '').trim();
        const m = findStationByConnector(c);
        const st = m?.station ?? station;
        navigation.navigate('ChargingSession', { stationId: st.id, connectorId: m?.connector.id ?? c, stationSnapshot: st, targetSoc: target });
        setTimeout(() => setScanned(false), 1500);
    };

    const onStart = () => {
        if (!connector) return;
        if (!isConnectorCompatible(connector.type, selectedVehicle?.connectorType)) {
            Alert.alert('Not compatible', `Your car uses ${selectedVehicle?.connectorType}. Pick a matching connector.`);
            return;
        }
        if (connector.status !== 'Available') {
            Alert.alert('Connector busy', 'This connector is in use. Try another connector or station.');
            return;
        }
        startSession();
    };

    // GO: look the typed charger ID up (local list, then the live API)
    const onGo = async () => {
        const t = code.trim();
        if (!t) return;
        tap(Haptics.ImpactFeedbackStyle.Medium);
        const m = findStationByConnector(t);
        if (m) {
            const i = stationsList.findIndex((s) => s.id === m.station.id);
            if (i !== -1) setStationIdx(i);
            setConnectorId(m.connector.id);
            return;
        }
        try {
            const live = await stationService.getStationByChargePointId(t);
            if (live?.connectors?.length) {
                setConnectorId(live.connectors[0].id);
                return;
            }
        } catch {
            // not found
        }
        Alert.alert('Charger not found', `No charger with ID ${t}. Check the code on the dispenser.`);
    };

    const onScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        startSession(data);
    };

    const camOk = Platform.OS !== 'web' && permission?.granted;
    const vf = Math.min(300, width - 110);
    const topH = Math.min(height * 0.5, 470);

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
            {/* Camera */}
            <View style={[styles.camera, { height: topH + 40 }]}>
                {camOk ? (
                    <CameraView facing="back" enableTorch={torch} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scanned ? undefined : onScanned} style={StyleSheet.absoluteFill} />
                ) : (
                    <LinearGradient colors={['#0A1020', '#05060A']} style={StyleSheet.absoluteFill} />
                )}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.25)' }]} pointerEvents="none" />

                <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
                    {navigation.canGoBack() && !inTab ? (
                        <GlassButton label="Close" size={52} onPress={() => navigation.goBack()}>
                            <X size={22} color="#FFFFFF" strokeWidth={2.5} />
                        </GlassButton>
                    ) : (
                        <View style={{ width: 52 }} />
                    )}
                    <Glass radius={22} style={styles.activePill}>
                        <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                        <ThemedText style={styles.activeText}>Scanner active</ThemedText>
                    </Glass>
                    <GlassButton label={torch ? 'Turn torch off' : 'Turn torch on'} size={52} onPress={() => setTorch((t) => !t)} tint={torch ? colors.primary : undefined}>
                        {torch ? <Flashlight size={21} color="#FFFFFF" /> : <FlashlightOff size={21} color="#FFFFFF" />}
                    </GlassButton>
                </View>

                {/* Blue brackets */}
                <View style={[styles.vf, { width: vf, height: vf, top: insets.top + 84 }]} pointerEvents="none">
                    {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
                        <View key={k} style={[styles.corner, styles[k], { borderColor: colors.primary }]} />
                    ))}
                    <View style={styles.qrWrap}>
                        <ScanLine size={74} color="rgba(255,255,255,0.45)" strokeWidth={1.6} />
                    </View>
                    <Animated.View
                        style={[
                            styles.laser,
                            { backgroundColor: colors.primary, shadowColor: colors.primary, transform: [{ translateY: laser.interpolate({ inputRange: [0, 1], outputRange: [vf * 0.32, vf * 0.68] }) }] },
                        ]}
                    />
                </View>
                <View style={[styles.hintWrap, { top: insets.top + 84 + vf + 18 }]} pointerEvents="none">
                    <ThemedText style={[styles.hintTitle, { color: colors.primary }]}>Align QR to charge</ThemedText>
                    <ThemedText style={styles.hintSub}>Point camera at QR code on charger dispenser</ThemedText>
                </View>

                {!camOk && Platform.OS !== 'web' && !permission?.granted ? (
                    <Pressable onPress={requestPermission} accessibilityRole="button" style={styles.permission}>
                        <Glass radius={22} style={styles.permissionInner}>
                            <CameraIcon size={18} color="#FFFFFF" />
                            <ThemedText style={styles.permissionText}>Allow camera to scan</ThemedText>
                        </Glass>
                    </Pressable>
                ) : null}
            </View>

            {/* Charger ID field, overlapping the sheet edge */}
            <View style={[styles.idWrap, { top: topH + 40 - 40 }]}>
                <Glass radius={26} style={styles.idField}>
                    <Keyboard size={22} color={colors.textMuted} />
                    <TextInput
                        ref={codeRef}
                        value={code}
                        onChangeText={(t) => setCode(t.toUpperCase())}
                        placeholder="Type Charger ID (e.g. CP1233)"
                        placeholderTextColor={colors.textSoft}
                        autoCapitalize="characters"
                        returnKeyType="go"
                        onSubmitEditing={onGo}
                        style={[styles.idInput, { color: colors.text }]}
                        accessibilityLabel="Charger ID"
                    />
                    <Pressable accessibilityRole="button" accessibilityLabel="Look up charger" onPress={onGo} style={[styles.go, { backgroundColor: colors.primary }]}>
                        <ThemedText style={styles.goText}>GO</ThemedText>
                    </Pressable>
                </Glass>
            </View>

            {/* Connector sheet */}
            <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: (inTab ? 104 : 20) + (inTab ? 0 : insets.bottom) }]}>
                <View style={[styles.handle, { backgroundColor: colors.border }]} />
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 4 }}>
                    <View style={styles.sheetHead}>
                        <ThemedText style={[styles.sheetTitle, { color: colors.textMuted }]}>Select charging connector</ThemedText>
                        <View style={styles.nearby}>
                            <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                            <ThemedText style={[styles.nearbyText, { color: colors.success }]}>{nearbyFree} nearby</ThemedText>
                        </View>
                    </View>

                    {/* Station switcher */}
                    <View style={styles.stationRow}>
                        <Pressable accessibilityRole="button" accessibilityLabel="Previous station" onPress={() => setStationIdx((i) => (i - 1 + stationsList.length) % stationsList.length)} style={[styles.arrowBtn, { backgroundColor: colors.surfaceMuted }]}>
                            <ChevronLeft size={18} color={colors.text} />
                        </Pressable>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={[styles.stationName, { color: colors.text }]} numberOfLines={1}>{station.name}</ThemedText>
                            <ThemedText style={[styles.stationSub, { color: colors.textMuted }]} numberOfLines={1}>{station.distanceKm} km</ThemedText>
                        </View>
                        <Pressable accessibilityRole="button" accessibilityLabel="Next station" onPress={() => setStationIdx((i) => (i + 1) % stationsList.length)} style={[styles.arrowBtn, { backgroundColor: colors.surfaceMuted }]}>
                            <ChevronRight size={18} color={colors.text} />
                        </Pressable>
                    </View>

                    {station.connectors.map((c) => {
                        const sel = c.id === connector?.id;
                        const fits = isConnectorCompatible(c.type, selectedVehicle?.connectorType);
                        const free = c.status === 'Available';
                        return (
                            <Pressable
                                key={c.id}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: sel }}
                                onPress={() => {
                                    tap();
                                    setConnectorId(c.id);
                                }}
                                style={[styles.connCard, { backgroundColor: colors.background, borderColor: sel ? colors.primary : 'transparent' }]}
                            >
                                <View style={[styles.plugTile, { backgroundColor: free ? '#6DB8F2' : '#EE6C58' }]}>
                                    <Plug size={30} color={free ? colors.primary : colors.error} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={[styles.connName, { color: colors.text }]} numberOfLines={1}>
                                        {(c.chargerId ?? c.id)}{c.gunLabel ? `-${c.gunLabel.replace(/\D/g, '').padStart(2, '0')}` : ''} · {c.type}
                                    </ThemedText>
                                    <ThemedText style={[styles.connSub, { color: colors.textMuted }]}>
                                        {c.power} kW • 920 V • 150 A
                                    </ThemedText>
                                </View>
                                {free ? (
                                    fits ? (
                                        <View style={[styles.match, { backgroundColor: 'rgba(52,199,89,0.16)' }]}>
                                            <CircleCheck size={16} color={colors.success} />
                                            <ThemedText style={[styles.matchText, { color: colors.success }]}>EV match</ThemedText>
                                        </View>
                                    ) : (
                                        <View style={[styles.match, { backgroundColor: 'rgba(255,149,0,0.16)' }]}>
                                            <ThemedText style={[styles.matchText, { color: colors.warning }]}>No fit</ThemedText>
                                        </View>
                                    )
                                ) : (
                                    <View style={[styles.match, { backgroundColor: 'rgba(255,59,48,0.14)' }]}>
                                        <ThemedText style={[styles.matchText, { color: colors.error }]}>Busy</ThemedText>
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}

                    {connector ? (
                        <View style={styles.estRow}>
                            <ThemedText style={[styles.estText, { color: colors.textMuted }]}>
                                Est. {selectedVehicle?.currentBattery ?? 20}→{target}% • ₹{allInPrice(connector.pricePerKWh).toFixed(1)}/kWh
                            </ThemedText>
                            <ThemedText style={[styles.estCost, { color: colors.text }]}>≈ {formatRupees(estCost)}</ThemedText>
                        </View>
                    ) : null}

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Start charging"
                        onPress={onStart}
                        disabled={!connector}
                        style={({ pressed }) => [styles.startBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
                    >
                        <ThemedText style={styles.startText}>Start Charging</ThemedText>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={() => codeRef.current?.focus()} style={styles.manual}>
                        <ThemedText style={[styles.manualText, { color: colors.textMuted }]}>Enter charger code manually</ThemedText>
                    </Pressable>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const C = 46;
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#05060A' },
    camera: { width: '100%' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
    activePill: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
    activeText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
    liveDot: { width: 9, height: 9, borderRadius: 5 },
    vf: { position: 'absolute', alignSelf: 'center' },
    corner: { position: 'absolute', width: C, height: C },
    tl: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 26 },
    tr: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 26 },
    bl: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 26 },
    br: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 26 },
    qrWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
    laser: { position: 'absolute', left: 12, right: 12, height: 3, borderRadius: 2, shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
    hintWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
    hintTitle: { fontSize: 19, fontWeight: '700' },
    hintSub: { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.75)', marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
    permission: { position: 'absolute', alignSelf: 'center', top: '45%' },
    permissionInner: { height: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
    permissionText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
    idWrap: { position: 'absolute', left: 16, right: 16, zIndex: 5 },
    idField: { height: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 8 },
    idInput: { flex: 1, fontSize: 17, fontWeight: '500' },
    go: { height: 48, paddingHorizontal: 24, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    goText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
    sheet: { flex: 1, marginTop: -24, borderTopLeftRadius: 34, borderTopRightRadius: 34, paddingHorizontal: 16, paddingTop: 8 },
    handle: { width: 42, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
    sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    sheetTitle: { fontSize: 17, fontWeight: '600' },
    nearby: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    nearbyText: { fontSize: 16, fontWeight: '700' },
    stationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 8 },
    arrowBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    stationName: { fontSize: 16, fontWeight: '700' },
    stationSub: { fontSize: 13, fontWeight: '500' },
    connCard: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 24, padding: 16, borderWidth: 2, marginTop: 8 },
    plugTile: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    connName: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
    connSub: { fontSize: 15.5, fontWeight: '500', marginTop: 4 },
    match: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 36, paddingHorizontal: 12, borderRadius: 18 },
    matchText: { fontSize: 15, fontWeight: '700' },
    estRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingHorizontal: 4 },
    estText: { fontSize: 15.5, fontWeight: '500' },
    estCost: { fontSize: 21, fontWeight: '800' },
    startBtn: { height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
    startText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
    manual: { alignItems: 'center', paddingVertical: 16 },
    manualText: { fontSize: 17, fontWeight: '500' },
});
