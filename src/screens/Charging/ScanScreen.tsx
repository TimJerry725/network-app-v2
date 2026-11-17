import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft,
    ChevronRight,
    Flashlight,
    FlashlightOff,
    Camera as CameraIcon,
    Keyboard,
    Zap,
    Check,
} from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';
import { useIndiaChargingStations } from '../../hooks/useIndiaChargingStations';
import {
    MOCK_STATIONS,
    Station,
    findStationByConnector,
    getRecommendedConnector,
    getStationById,
    isConnectorCompatible,
} from '../../constants/Stations';
import { FONT_FAMILIES } from '../../constants/Tokens';
import { stationService } from '../../services/api/stationService';
import { ConnectorIcon } from '../../components/stack/StationCard';
import { PulseButton } from '../../components/pulse/PulseKit';
import { allInPrice, formatRupees } from '../../utils/pulse';

const TARGETS = [80, 85, 90, 100];

export default function ScanScreen({ navigation, route }: any) {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { selectedVehicle, user } = useVehicles();
    const { stations: allStations } = useIndiaChargingStations();
    const [permission, requestPermission] = useCameraPermissions();

    const inTab = navigation.getState?.()?.type === 'tab';
    const [torch, setTorch] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [code, setCode] = useState<string>(route.params?.connectorId ?? '');
    const [showCode, setShowCode] = useState(false);
    const [target, setTarget] = useState(80);

    const pre = getStationById(route.params?.stationId);
    const preMatch = findStationByConnector(route.params?.connectorId);
    const preStation = pre ?? preMatch?.station;

    const stationsList = useMemo(() => {
        const pool = allStations?.length ? allStations : MOCK_STATIONS;
        const sorted = [...pool].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
        // A station passed in from Home or a matched code is always pickable, even if the live list lacks it
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

    // Typed charger code: match locally, else ask the live API
    useEffect(() => {
        const t = code.trim();
        if (!t) return;
        const m = findStationByConnector(t);
        if (m) {
            const i = stationsList.findIndex((s) => s.id === m.station.id);
            if (i !== -1) setStationIdx(i);
            setConnectorId(m.connector.id);
            return;
        }
        if (t.length >= 4) {
            stationService
                .getStationByChargePointId(t)
                .then((live) => live?.connectors?.length && setConnectorId(live.connectors[0].id))
                .catch(() => {});
        }
    }, [code, stationsList]);

    const connector = station.connectors.find((c) => c.id === connectorId) ?? station.connectors[0];
    const compatible = connector ? isConnectorCompatible(connector.type, selectedVehicle?.connectorType) : false;
    const estKwh = selectedVehicle ? Math.max(0, ((target - selectedVehicle.currentBattery) / 100) * selectedVehicle.batteryCapacity) : 0;
    const estCost = connector ? estKwh * allInPrice(connector.pricePerKWh) : 0;

    // Viewfinder laser
    const laser = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(laser, { toValue: 1, duration: 1600, useNativeDriver: true }),
                Animated.timing(laser, { toValue: 0, duration: 1600, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [laser]);

    const startSession = (resolvedCode?: string) => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        const codeToUse = (resolvedCode || connectorId || connector?.id || '').trim();
        const m = findStationByConnector(codeToUse);
        const st = m?.station ?? station;
        navigation.navigate('ChargingSession', {
            stationId: st.id,
            connectorId: m?.connector.id ?? codeToUse,
            stationSnapshot: st,
            targetSoc: target,
        });
        setTimeout(() => setScanned(false), 1500);
    };

    const onStart = () => {
        if (!connector) return;
        if (!compatible) {
            Alert.alert('Not compatible', `Your car uses ${selectedVehicle?.connectorType}. Pick a matching connector.`);
            return;
        }
        if (connector.status !== 'Available') {
            Alert.alert('Connector busy', 'This connector is in use. Try another gun or station.');
            return;
        }
        startSession();
    };

    const onScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        startSession(data);
    };

    const camOk = Platform.OS !== 'web' && permission?.granted;
    const vfW = Math.min(300, width - 80);
    const vfH = vfW / 1.586; // credit-card ratio viewfinder

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
            <View style={styles.camera}>
                {camOk ? (
                    <CameraView
                        facing="back"
                        enableTorch={torch}
                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                        onBarcodeScanned={scanned ? undefined : onScanned}
                        style={StyleSheet.absoluteFill}
                    />
                ) : (
                    <View style={[StyleSheet.absoluteFill, styles.noCam]}>
                        {Platform.OS !== 'web' && !permission?.granted ? (
                            <PulseButton
                                title="Allow camera to scan"
                                variant="lime"
                                size="md"
                                icon={<CameraIcon size={16} color="#0B0B0F" />}
                                onPress={requestPermission}
                                style={{ marginTop: vfH + 40 }}
                            />
                        ) : null}
                    </View>
                )}

                <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
                    {navigation.canGoBack() && !inTab ? (
                        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.roundBtn}>
                            <ChevronLeft size={20} color="#FFFFFF" />
                        </Pressable>
                    ) : (
                        <View style={{ width: 44 }} />
                    )}
                    <ThemedText style={styles.topTitle}>Scan to charge</ThemedText>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={torch ? 'Turn torch off' : 'Turn torch on'}
                        onPress={() => setTorch((t) => !t)}
                        style={[styles.roundBtn, torch && { backgroundColor: '#A996FF' }]}
                    >
                        {torch ? <Flashlight size={18} color="#0B0B0F" /> : <FlashlightOff size={18} color="#FFFFFF" />}
                    </Pressable>
                </View>

                {/* Card-shaped viewfinder */}
                <View style={[styles.vf, { width: vfW, height: vfH, top: insets.top + 80 }]} pointerEvents="none">
                    {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
                        <View key={k} style={[styles.corner, styles[k]]} />
                    ))}
                    <Animated.View
                        style={[
                            styles.laser,
                            { transform: [{ translateY: laser.interpolate({ inputRange: [0, 1], outputRange: [10, vfH - 10] }) }] },
                        ]}
                    />
                </View>
                <ThemedText style={[styles.hint, { top: insets.top + 96 + vfH }]}>Point at the QR sticker on the charger</ThemedText>
            </View>

            {/* Confirm sheet */}
            <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: (inTab ? 96 : 16) + insets.bottom }]}>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 6 }}>
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => setShowCode((v) => !v)}
                        style={[styles.codeToggle, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    >
                        <Keyboard size={16} color={colors.text} />
                        <ThemedText style={[styles.codeToggleText, { color: colors.text }]}>
                            {showCode ? 'Hide charger code' : "Can't scan? Enter charger code"}
                        </ThemedText>
                    </Pressable>
                    {showCode ? (
                        <TextInput
                            value={code}
                            onChangeText={(t) => setCode(t.toUpperCase())}
                            placeholder="e.g. CP1233"
                            placeholderTextColor={colors.textSoft}
                            autoCapitalize="characters"
                            autoFocus
                            style={[styles.codeInput, { color: colors.text, borderColor: colors.lime, backgroundColor: colors.surface }]}
                            accessibilityLabel="Charger code"
                        />
                    ) : null}

                    {/* Station picker */}
                    <View style={styles.stationRow}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Previous station"
                            onPress={() => setStationIdx((i) => (i - 1 + stationsList.length) % stationsList.length)}
                            style={[styles.arrowBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                            <ChevronLeft size={18} color={colors.text} />
                        </Pressable>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={[styles.stationName, { color: colors.text }]} numberOfLines={1}>
                                {station.name}
                            </ThemedText>
                            <ThemedText style={[styles.stationSub, { color: colors.textMuted }]} numberOfLines={1}>
                                {station.distanceKm} km · {station.connectors.filter((c) => c.status === 'Available').length} free
                            </ThemedText>
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Next station"
                            onPress={() => setStationIdx((i) => (i + 1) % stationsList.length)}
                            style={[styles.arrowBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                            <ChevronRight size={18} color={colors.text} />
                        </Pressable>
                    </View>

                    {/* Connector cards */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                        {station.connectors.map((c) => {
                            const sel = c.id === connector?.id;
                            const free = c.status === 'Available';
                            const ok = isConnectorCompatible(c.type, selectedVehicle?.connectorType);
                            return (
                                <Pressable
                                    key={c.id}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: sel }}
                                    onPress={() => setConnectorId(c.id)}
                                    style={[
                                        styles.connCard,
                                        sel
                                            ? { backgroundColor: colors.surfaceMuted, borderColor: colors.text }
                                            : { backgroundColor: colors.surface, borderColor: colors.border },
                                        !free && !sel && { opacity: 0.55 },
                                    ]}
                                >
                                    <View style={styles.connTop}>
                                        <ConnectorIcon type={c.type} size={18} color={colors.text} />
                                        {sel ? <Check size={14} color={colors.text} strokeWidth={3} /> : null}
                                    </View>
                                    <ThemedText style={[styles.connType, { color: colors.text }]}>
                                        {c.type} · {c.power}kW
                                    </ThemedText>
                                    <ThemedText style={[styles.connMeta, { color: colors.textMuted }]}>
                                        {c.chargerId ?? c.id} · {free ? 'Free' : c.status}
                                        {!ok ? ' · no fit' : ''}
                                    </ThemedText>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.targets}>
                        {TARGETS.map((t) => (
                            <Pressable
                                key={t}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: t === target }}
                                onPress={() => setTarget(t)}
                                style={[
                                    styles.target,
                                    t === target ? { backgroundColor: colors.text, borderColor: colors.text } : { borderColor: colors.border },
                                ]}
                            >
                                <ThemedText style={[styles.targetText, { color: t === target ? colors.background : colors.text }]}>{t}%</ThemedText>
                            </Pressable>
                        ))}
                    </View>
                </ScrollView>

                <ThemedText style={[styles.estimate, { color: colors.textMuted }]} numberOfLines={1}>
                    {connector
                        ? `≈ ${formatRupees(estCost)} incl. GST to ${target}% · wallet ${formatRupees(user.walletBalance)}`
                        : 'Pick a connector'}
                </ThemedText>
                <PulseButton
                    title={connector ? `Start charging · ${connector.chargerId ?? connector.id}` : 'Start charging'}
                    icon={<Zap size={17} color="#0B0B0F" fill="#0B0B0F" />}
                    onPress={onStart}
                    disabled={!connector}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const C = 26;
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0B0B0F' },
    camera: { flex: 1 },
    noCam: { backgroundColor: '#0B0B0F', alignItems: 'center' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
    topTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 16, color: '#FFFFFF' },
    roundBtn: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: 'rgba(11,11,15,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    vf: { position: 'absolute', alignSelf: 'center', borderRadius: 22, overflow: 'hidden', backgroundColor: 'rgba(169,150,255,0.04)' },
    corner: { position: 'absolute', width: C, height: C, borderColor: '#A996FF' },
    tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 22 },
    tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 22 },
    bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 22 },
    br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 22 },
    laser: { position: 'absolute', left: 14, right: 14, height: 2.5, borderRadius: 2, backgroundColor: '#A996FF' },
    hint: {
        position: 'absolute',
        alignSelf: 'center',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILIES.semiBold,
        fontSize: 13.5,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowRadius: 6,
    },
    sheet: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 16,
        paddingTop: 16,
        maxHeight: '60%',
    },
    codeToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
    codeToggleText: { fontFamily: FONT_FAMILIES.bold, fontSize: 13.5 },
    codeInput: {
        marginTop: 8,
        height: 52,
        borderRadius: 16,
        borderWidth: 2,
        paddingHorizontal: 16,
        fontFamily: FONT_FAMILIES.extraBold,
        fontSize: 20,
        letterSpacing: 3,
    },
    stationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, marginBottom: 8 },
    arrowBtn: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    stationName: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 17, letterSpacing: -0.3 },
    stationSub: { fontFamily: FONT_FAMILIES.medium, fontSize: 12.5 },
    connCard: { width: 150, borderRadius: 14, borderWidth: 1.5, padding: 12 },
    connTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    connType: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 14, marginTop: 10 },
    connMeta: { fontFamily: FONT_FAMILIES.medium, fontSize: 11.5, marginTop: 2 },
    targets: { flexDirection: 'row', gap: 8, marginTop: 12 },
    target: { flex: 1, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    targetText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 14 },
    estimate: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 12, textAlign: 'center', marginVertical: 10 },
});
