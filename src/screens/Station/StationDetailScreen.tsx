import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    LayoutAnimation,
    Linking,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    ScrollViewInstance,
    Share,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    Heart,
    Share2,
    Navigation,
    LifeBuoy,
    Star,
    Bell,
    BellRing,
    Wallet,
    Zap,
    Check,
    Clock3,
    Lock,
    ChevronDown,
    ChevronUp,
    X,
} from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';
import { useFavorites } from '../../context/FavoritesContext';
import { Connector, MOCK_STATIONS, Station, ensureChargers, getStationById, isConnectorCompatible } from '../../constants/Stations';
import { FONT_FAMILIES } from '../../constants/Tokens';
import { stationService } from '../../services/api/stationService';
import { ConnectorIcon } from '../../components/stack/StationCard';
import { PulseButton } from '../../components/pulse/PulseKit';
import { HeaderIcon, ScreenTitle, StatusText, flat } from '../../components/flat/FlatKit';
import { SKINS, SkinCard } from '../../components/stack/StackKit';
import { allInPrice, formatAgo, formatRupees, isStatusFresh, statusAgeSeconds } from '../../utils/pulse';

const NOTIFY_SECONDS = 59 * 60 + 30;

type LimitKey = 'percent' | 'amount' | 'energy' | 'time';
type Limits = Partial<Record<LimitKey, number>>;
const DIALS: { key: LimitKey; label: string; unit: string; step: number; min: number; max: number }[] = [
    { key: 'percent', label: 'Battery', unit: '%', step: 5, min: 5, max: 100 },
    { key: 'amount', label: 'Spend', unit: '₹', step: 50, min: 50, max: 5000 },
    { key: 'energy', label: 'Energy', unit: 'kWh', step: 1, min: 1, max: 150 },
    { key: 'time', label: 'Time', unit: 'min', step: 5, min: 5, max: 600 },
];

function tap() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
function fmtCount(sec: number) {
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
}
const fmtMins = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

/**
 * Station details (Pulse style).
 * Approach: every charger is a payment-style card in a swipeable wallet. Swiping to a charger
 * selects its best connector; tapping a pod inside the card picks another. Charge settings are
 * four dials you switch on and nudge with − and +, so nothing needs typing.
 */
export default function StationDetailScreen({ route, navigation }: any) {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { user, selectedVehicle } = useVehicles();
    const { isFavorite, toggleFavorite } = useFavorites();

    const [liveStation, setLiveStation] = useState<Station | null>(null);
    const routeStation: Station | undefined = route.params?.stationSnapshot ?? route.params?.station;
    const rawStation: Station = liveStation ?? routeStation ?? getStationById(route.params?.stationId) ?? MOCK_STATIONS[0];
    const station = useMemo(() => ensureChargers(rawStation), [rawStation]);

    useEffect(() => {
        const id = route.params?.stationId ?? station.id;
        if (!id) return;
        stationService.getPublicStationDetails(id).then((d) => d && setLiveStation(d)).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.params?.stationId]);

    const vehicleType = selectedVehicle?.connectorType;
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [tracked, setTracked] = useState<Record<string, number>>({});
    const [tariffOpen, setTariffOpen] = useState(false);
    const [limits, setLimits] = useState<Limits>({});

    useEffect(() => {
        const t = setInterval(() => {
            setTracked((prev) => {
                const next: Record<string, number> = {};
                let changed = false;
                Object.entries(prev).forEach(([k, v]) => {
                    if (v > 0) {
                        next[k] = v - 1;
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(t);
    }, []);

    // A charger owns several connectors. Use the charger id when the data has it, otherwise pair them up.
    const groups = useMemo(() => {
        const out: { chargerId: string; connectors: Connector[] }[] = [];
        const hasIds = station.connectors.every((c) => !!c.chargerId);
        if (hasIds) {
            station.connectors.forEach((c) => {
                const g = out.find((x) => x.chargerId === c.chargerId);
                if (g) g.connectors.push(c);
                else out.push({ chargerId: c.chargerId as string, connectors: [c] });
            });
        } else {
            for (let i = 0; i < station.connectors.length; i += 2) {
                out.push({ chargerId: `CP${1233 + i / 2}`, connectors: station.connectors.slice(i, i + 2) });
            }
        }
        return out;
    }, [station.connectors]);

    const ranked = useMemo(
        () =>
            [...station.connectors].sort((x, y) => {
                const score = (c: Connector) => (c.status === 'Available' ? 2 : 0) + (isConnectorCompatible(c.type, vehicleType) ? 4 : 0);
                return score(y) - score(x) || y.power - x.power;
            }),
        [station.connectors, vehicleType]
    );
    const bestId = ranked[0]?.id;
    const activeId = selectedId ?? bestId ?? null;

    // Recommended charger first, then chargers with an available connector, then the rest
    const sortedGroups = useMemo(() => {
        const freeOf = (g: { connectors: Connector[] }) => g.connectors.filter((c) => c.status === 'Available').length;
        const rank = (g: { connectors: Connector[] }) => (g.connectors.some((c) => c.id === bestId) ? 0 : freeOf(g) > 0 ? 1 : 2);
        return groups
            .map((g) => ({ ...g, connectors: [...g.connectors].sort((a, b) => Number(b.status === 'Available') - Number(a.status === 'Available')) }))
            .sort((x, y) => rank(x) - rank(y) || x.chargerId.localeCompare(y.chargerId, undefined, { numeric: true }));
    }, [groups, bestId]);
    const freeTotal = station.connectors.filter((c) => c.status === 'Available').length;

    const bestOf = (g: { connectors: Connector[] }) =>
        g.connectors.find((c) => c.status === 'Available' && isConnectorCompatible(c.type, vehicleType)) ??
        g.connectors.find((c) => c.status === 'Available') ??
        g.connectors[0];
    const [showAll, setShowAll] = useState(false);
    const GROUPS_SHOWN = 3;
    const shownGroups = showAll ? sortedGroups : sortedGroups.slice(0, GROUPS_SHOWN);

    const fav = isFavorite(station.id);
    const age = statusAgeSeconds(station.id);
    const minPrice = Math.min(...station.connectors.map((c) => c.pricePerKWh));

    const activeConn = station.connectors.find((c) => c.id === activeId) ?? null;
    const activeGroup = sortedGroups.find((g) => g.connectors.some((c) => c.id === activeId));
    const activeFree = !!activeConn && activeConn.status === 'Available';
    const activeFits = !!activeConn && isConnectorCompatible(activeConn.type, vehicleType);
    const canStart = activeFree && activeFits;

    // Charge settings are worked out from the connector's speed and your car
    const cap = selectedVehicle?.batteryCapacity ?? 60;
    const cur = selectedVehicle?.currentBattery ?? 20;
    const speedFor = (c: Connector) => {
        const carMax = (c.currentType ?? (c.type === 'Type 2' ? 'AC' : 'DC')) === 'AC' ? 11 : selectedVehicle?.maxDcRateKw ?? c.power;
        const usable = Math.min(c.power, carMax);
        return { usable, effective: usable * 0.85 };
    };
    const room = Math.max(0, ((100 - cur) / 100) * cap);
    const estimate = (c: Connector) => {
        const price = allInPrice(c.pricePerKWh);
        const power = speedFor(c).effective;
        let kwh = room; // no limit: charge until you stop
        if (limits.percent) kwh = Math.min(kwh, Math.max(0, ((Math.min(limits.percent, 100) - cur) / 100) * cap));
        if (limits.energy) kwh = Math.min(kwh, limits.energy);
        if (limits.amount) kwh = Math.min(kwh, limits.amount / price);
        if (limits.time) kwh = Math.min(kwh, (power * limits.time) / 60);
        const mins = power > 0 ? Math.round((kwh / power) * 60) : 0;
        return { kwh, mins, cost: kwh * price, endSoc: Math.min(100, Math.round(cur + (kwh / cap) * 100)) };
    };
    // The fill slider: each mode has its own scale, worked out from this connector and your car
    const [mode, setMode] = useState<LimitKey>('percent');
    const rangeFor = (c: Connector, key: LimitKey) => {
        const price = allInPrice(c.pricePerKWh);
        const power = Math.max(1, speedFor(c).effective);
        if (key === 'percent') return { min: Math.min(100, cur + 1), max: 100, step: 1 };
        if (key === 'amount') return { min: 50, max: Math.max(100, Math.ceil((room * price) / 50) * 50), step: 50 };
        if (key === 'energy') return { min: 1, max: Math.max(2, Math.ceil(room)), step: 1 };
        return { min: 5, max: Math.max(10, Math.ceil(((room / power) * 60) / 5) * 5), step: 5 };
    };
    const dial = DIALS.find((d) => d.key === mode)!;
    const range = activeConn ? rangeFor(activeConn, mode) : { min: 1, max: 100, step: 1 };
    const value = limits[mode];
    const frac = value === undefined ? 1 : Math.max(0, Math.min(1, (value - range.min) / Math.max(1, range.max - range.min)));
    const trackRef = useRef<any>(null);
    const trackBox = useRef({ x: 0, w: 1 });
    const rangeRef = useRef(range);
    rangeRef.current = range;
    const modeRef = useRef(mode);
    modeRef.current = mode;
    const setFromX = (pageX: number) => {
        const f = Math.max(0, Math.min(1, (pageX - trackBox.current.x) / Math.max(1, trackBox.current.w)));
        const r = rangeRef.current;
        const v = Math.max(r.min, Math.min(r.max, Math.round((r.min + f * (r.max - r.min)) / r.step) * r.step));
        setLimits({ [modeRef.current]: v });
    };
    const pan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderTerminationRequest: () => false,
            onPanResponderGrant: (e) => {
                const pageX = e.nativeEvent.pageX;
                trackRef.current?.measureInWindow((x: number, _y: number, w: number) => {
                    trackBox.current = { x, w };
                    setFromX(pageX);
                });
            },
            onPanResponderMove: (_e, g) => setFromX(g.moveX),
        })
    ).current;

    const activeEstimate = activeConn ? estimate(activeConn) : { kwh: 0, mins: 0, cost: 0, endSoc: 0 };
    const lowBalance = activeEstimate.cost > 0 && user.walletBalance < activeEstimate.cost;

    const share = async () => {
        try {
            await Share.share({ title: station.name, message: `${station.name} — ${station.address}` });
        } catch {
            // cancelled
        }
    };
    const directions = () =>
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`).catch(() =>
            Alert.alert('Directions', `Navigating to ${station.name}`)
        );
    const help = () =>
        Alert.alert('Help at this station', 'Charger fault, blocked bay or payment issue? We are here 24/7.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call 1800-419-4747', onPress: () => Linking.openURL('tel:18004194747').catch(() => {}) },
        ]);
    const go = () =>
        navigation.navigate('ChargingSession', {
            stationId: station.id,
            stationSnapshot: station,
            connectorId: activeConn!.id,
            targetSoc: limits.percent ? Math.min(limits.percent, 100) : 100,
            maxSpend: limits.amount,
            maxEnergyKwh: limits.energy,
            maxMinutes: limits.time,
        });
    const start = () => {
        if (!activeConn) return;
        if (!canStart) {
            Alert.alert(
                !activeFree ? 'This connector is busy' : 'Not compatible',
                !activeFree ? 'Swipe to another charger, or tap Track on this one.' : `Your car uses ${vehicleType}. Choose a matching connector.`
            );
            return;
        }
        if (lowBalance) {
            Alert.alert('Top up first?', `This charge is about ${formatRupees(activeEstimate.cost)} and your wallet has ${formatRupees(user.walletBalance)}.`, [
                { text: 'Add money', onPress: () => navigation.navigate('Wallet', { focusTopUp: true }) },
                { text: 'Start anyway', onPress: go },
                { text: 'Cancel', style: 'cancel' },
            ]);
            return;
        }
        go();
    };

    const hours = station.openTime === '24/7' ? 'Open 24/7' : `${station.openTime} – ${station.closeTime}`;
    const ink = '#0B0B0F';

    const [settingsOpen, setSettingsOpen] = useState(false);
    const actionBlock = (
        <View style={styles.inline}>
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: settingsOpen }}
                onPress={() => {
                    tap();
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setSettingsOpen((v) => !v);
                }}
                style={styles.setToggle}
            >
                <View style={{ flex: 1 }}>
                    <ThemedText style={styles.setTitle}>Charge settings</ThemedText>
                    <ThemedText style={[styles.setSummary, { color: SKINS.ink.sub }]} numberOfLines={1}>
                        {value === undefined ? 'No limit' : `${dial.label} ${value}${dial.unit}`} · ≈ {activeEstimate.kwh.toFixed(1)} kWh · {fmtMins(activeEstimate.mins)} · {formatRupees(activeEstimate.cost)}
                    </ThemedText>
                </View>
                {settingsOpen ? <ChevronUp size={18} color="#FFFFFF" /> : <ChevronDown size={18} color="#FFFFFF" />}
            </Pressable>
            {settingsOpen ? (
                <View>
                            <View style={styles.setHead}>
                                <ThemedText style={styles.setSub2}>Stop charging at</ThemedText>
                                <Pressable accessibilityRole="button" onPress={() => { tap(); setLimits({}); }} hitSlop={8}>
                                    <ThemedText style={[styles.setClear, { opacity: value === undefined ? 0.5 : 1 }]}>{value === undefined ? 'No limit' : 'Clear limit'}</ThemedText>
                                </Pressable>
                            </View>
                            <View style={styles.modes}>
                                {DIALS.map((d) => {
                                    const on = mode === d.key;
                                    return (
                                        <Pressable
                                            key={d.key}
                                            accessibilityRole="tab"
                                            accessibilityState={{ selected: on }}
                                            onPress={() => {
                                                tap();
                                                setMode(d.key);
                                                setLimits({});
                                            }}
                                            style={[styles.modeBtn, { backgroundColor: on ? '#FFFFFF' : 'rgba(255,255,255,0.14)' }]}
                                        >
                                            <ThemedText style={[styles.modeText, { color: on ? ink : '#FFFFFF' }]}>{d.label}</ThemedText>
                                        </Pressable>
                                    );
                                })}
                            </View>
                            <ThemedText style={[styles.bigVal, { opacity: value === undefined ? 0.55 : 1 }]}>
                                {value === undefined ? 'Fill to 100%' : `${value}${dial.unit}`}
                            </ThemedText>
                            <ThemedText style={[styles.bigNote, { color: SKINS.ink.sub }]}>
                                {value === undefined ? 'Drag the handle to stop early' : mode === 'percent' ? `Stops when your battery reaches ${value}%` : mode === 'amount' ? `Stops when the bill reaches ₹${value}` : mode === 'energy' ? `Stops after ${value} kWh` : `Stops after ${value} minutes`}
                            </ThemedText>
                            <View
                                ref={trackRef}
                                style={[styles.slider, { backgroundColor: 'rgba(255,255,255,0.14)' }]}
                                {...pan.panHandlers}
                                accessible
                                accessibilityRole="adjustable"
                                accessibilityLabel={`${dial.label} limit`}
                                accessibilityValue={{ text: value === undefined ? 'No limit' : `${value} ${dial.unit}` }}
                                accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                                onAccessibilityAction={(e) => {
                                    const dir = e.nativeEvent.actionName === 'increment' ? 1 : -1;
                                    setLimits({ [mode]: Math.max(range.min, Math.min(range.max, (value ?? range.max) + dir * range.step)) });
                                }}
                            >
                                {mode === 'percent' ? <View pointerEvents="none" style={[styles.nowFill, { width: `${cur}%`, backgroundColor: 'rgba(255,255,255,0.55)' }]} /> : null}
                                <View
                                    pointerEvents="none"
                                    style={[
                                        styles.limitFill,
                                        mode === 'percent' ? { left: `${cur}%`, width: `${Math.max(0, frac * 100 - cur)}%` } : { left: 0, width: `${frac * 100}%` },
                                        { backgroundColor: value === undefined ? 'rgba(169,150,255,0.35)' : colors.lime },
                                    ]}
                                />
                                <View pointerEvents="none" style={[styles.thumb, { left: `${frac * 100}%`, backgroundColor: '#FFFFFF', opacity: value === undefined ? 0.7 : 1 }]}>
                                    <View style={styles.grip} />
                                    <View style={styles.grip} />
                                </View>
                            </View>
                            <View style={styles.scale}>
                                <ThemedText style={[styles.scaleText, { color: SKINS.ink.sub }]}>{mode === 'percent' ? `now ${cur}%` : `${dial.unit === '₹' ? '₹' : ''}0`}</ThemedText>
                                <ThemedText style={[styles.scaleText, { color: SKINS.ink.sub }]}>{mode === 'percent' ? '100%' : `${dial.unit === '₹' ? '₹' : ''}${range.max}${dial.unit === '₹' ? '' : ` ${dial.unit}`}`}</ThemedText>
                            </View>
                            <View style={styles.estRow}>
                                {[
                                    ['Energy', activeEstimate.kwh > 0 ? `${activeEstimate.kwh.toFixed(1)} kWh` : '—'],
                                    ['Time', activeEstimate.mins > 0 ? fmtMins(activeEstimate.mins) : '—'],
                                    ['Cost', activeEstimate.cost > 0 ? formatRupees(activeEstimate.cost) : '—'],
                                    ['Battery', selectedVehicle ? `${activeEstimate.endSoc}%` : '—'],
                                ].map(([label, v]) => (
                                    <View key={label} style={styles.estItem}>
                                        <ThemedText style={[styles.estValue, { color: '#FFFFFF' }]} numberOfLines={1}>{v}</ThemedText>
                                        <ThemedText style={[styles.estLabel, { color: SKINS.ink.sub }]}>{label}</ThemedText>
                                    </View>
                                ))}
                            </View>
                            {activeConn ? (
                                <ThemedText style={[styles.basis, { color: SKINS.ink.sub }]}>
                                    {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} (${cur}%, ${cap} kWh) · ` : ''}about {speedFor(activeConn).usable} kW on this connector
                                </ThemedText>
                            ) : null}
                </View>
            ) : null}
            <PulseButton
                                title={canStart ? `Start charging · ${activeConn?.type} ${activeConn?.power}kW` : activeConn && !activeFree ? 'Connector busy' : activeConn && !activeFits ? 'Not compatible' : 'Pick a connector'}
                                icon={<Zap size={18} color="#0B0B0F" fill="#0B0B0F" />}
                                onPress={start}
                                disabled={!activeConn}
                                style={{ marginTop: 14 }}
                            />
        </View>
    );

    return (
        <View style={[flat.screen, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + 130 }} showsVerticalScrollIndicator={false}>
                <View style={{ paddingHorizontal: 16 }}>
                    <ScreenTitle
                        title={station.name}
                        subtitle={station.address}
                        onBack={() => navigation.goBack()}
                        right={
                            <>
                                <HeaderIcon label="Share station" onPress={share}>
                                    <Share2 size={18} color={colors.text} />
                                </HeaderIcon>
                                <HeaderIcon label={fav ? 'Remove from saved' : 'Save station'} active={fav} onPress={() => toggleFavorite(station.id)}>
                                    <Heart size={18} color={fav ? ink : colors.text} fill={fav ? ink : 'none'} />
                                </HeaderIcon>
                            </>
                        }
                    />

                    <View style={styles.meta}>
                        <View style={styles.metaItem}>
                            <Star size={13} color={colors.sun} fill={colors.sun} />
                            <ThemedText style={[styles.metaText, { color: colors.text }]}>{station.rating.toFixed(1)}</ThemedText>
                        </View>
                        <ThemedText style={[styles.metaText, { color: colors.textMuted }]}>· {station.distanceKm} km</ThemedText>
                        <ThemedText style={[styles.metaText, { color: colors.textMuted }]}>· from ₹{allInPrice(minPrice).toFixed(0)}/kWh</ThemedText>
                    </View>
                    <View style={styles.pills}>
                        <View style={[styles.pill, { borderColor: colors.border }]}>
                            <Clock3 size={14} color={colors.text} />
                            <ThemedText style={[styles.pillText, { color: colors.text }]}>{hours}</ThemedText>
                        </View>
                        <View style={[styles.pill, { borderColor: colors.border }]}>
                            <Lock size={14} color={colors.text} />
                            <ThemedText style={[styles.pillText, { color: colors.text }]}>{station.accessType ?? 'Public'}</ThemedText>
                        </View>
                    </View>
                    <View style={{ marginTop: 8 }}>
                        <StatusText tone={isStatusFresh(age) ? 'ok' : 'wait'} label={`${isStatusFresh(age) ? 'Live status' : 'Status may be stale'} · updated ${formatAgo(age)}`} />
                    </View>

                    <View style={[flat.rowGap, { marginTop: 14 }]}>
                        <PulseButton title="Directions" variant="ink" size="md" icon={<Navigation size={16} color={colors.background} />} onPress={directions} style={{ flex: 1 }} />
                        <PulseButton title="Help" variant="ghost" size="md" icon={<LifeBuoy size={16} color={colors.text} />} onPress={help} style={{ flex: 1 }} />
                    </View>

                </View>


                <View style={{ paddingHorizontal: 16 }}>
                    {/* 1. Chargers: all of them in one card, available first, best connector already selected */}
                    <View style={styles.secHead}>
                        <ThemedText style={[styles.secTitle, { color: colors.text }]}>Chargers</ThemedText>
                        <ThemedText style={[styles.secSub, { color: colors.textMuted }]}>{freeTotal} of {station.connectors.length} available</ThemedText>
                    </View>
                    <SkinCard skin="ink" pattern="arcs" style={{ flex: 0 }}>
                        <View style={styles.cardInner}>
                            {shownGroups.map((g, gi) => {
                                const free = g.connectors.filter((c) => c.status === 'Available').length;
                                const secs = tracked[g.chargerId];
                                const tracking = !!secs && secs > 0;
                                return (
                                    <View key={g.chargerId} style={gi > 0 ? styles.groupGap : undefined}>
                                        <View style={styles.groupHead}>
                                            <View style={[styles.numTag, { backgroundColor: colors.lime }]}>
                                                <ThemedText style={[styles.numTagText, { color: ink }]}>{g.chargerId}</ThemedText>
                                            </View>
                                            <ThemedText style={[styles.groupMeta, { color: SKINS.ink.sub }]} numberOfLines={1}>
                                                {free} of {g.connectors.length} available
                                            </ThemedText>
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={tracking ? `Stop tracking ${g.chargerId}` : `Track ${g.chargerId}`}
                                                onPress={() => {
                                                    tap();
                                                    setTracked((p) => {
                                                        const n = { ...p };
                                                        if (n[g.chargerId]) delete n[g.chargerId];
                                                        else n[g.chargerId] = NOTIFY_SECONDS;
                                                        return n;
                                                    });
                                                }}
                                                style={({ pressed }) => [styles.track, { backgroundColor: tracking ? colors.sun : '#FFFFFF', opacity: pressed ? 0.8 : 1 }]}
                                            >
                                                {tracking ? <BellRing size={13} color={ink} /> : <Bell size={13} color={ink} />}
                                                <ThemedText style={[styles.trackText, { color: ink }]}>{tracking ? fmtCount(secs) : 'Track'}</ThemedText>
                                            </Pressable>
                                        </View>
                                        {g.connectors.map((c) => {
                                            const sel = c.id === activeId;
                                            const isFree = c.status === 'Available';
                                            const fits = isConnectorCompatible(c.type, vehicleType);
                                            const kind = c.currentType ?? (c.type === 'Type 2' ? 'AC' : 'DC');
                                            return (
                                                <React.Fragment key={c.id}>
                                                <Pressable
                                                    accessibilityRole="radio"
                                                    accessibilityState={{ checked: sel }}
                                                    accessibilityLabel={`${c.type} ${c.power} kilowatt, charger ${c.chargerId ?? ''}, ${c.gunLabel ?? ''}, ${c.status}`}
                                                    onPress={() => {
                                                        tap();
                                                        setSelectedId(c.id);
                                                    }}
                                                    style={[styles.conn, { backgroundColor: sel ? colors.lime : 'rgba(255,255,255,0.08)', opacity: fits || sel ? 1 : 0.5 }]}
                                                >
                                                    <View style={[styles.radio, sel ? { backgroundColor: ink, borderColor: ink } : { borderColor: 'rgba(255,255,255,0.5)' }]}>
                                                        {sel ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : null}
                                                    </View>
                                                    <ConnectorIcon type={c.type} size={22} color={sel ? ink : '#FFFFFF'} />
                                                    <View style={{ flex: 1 }}>
                                                        <ThemedText style={[styles.connTitle, { color: sel ? ink : '#FFFFFF' }]} numberOfLines={1}>
                                                            {c.gunLabel ?? 'Gun'} · {c.type}{c.id === bestId ? '  ★' : ''}
                                                        </ThemedText>
                                                        <ThemedText style={[styles.connSub, { color: sel ? 'rgba(11,11,15,0.7)' : SKINS.ink.sub }]} numberOfLines={1}>
                                                            {c.power} kW {kind} · ₹{allInPrice(c.pricePerKWh).toFixed(0)}/kWh{!fits ? ' · not for your car' : ''}
                                                        </ThemedText>
                                                    </View>
                                                    <View style={styles.wStatus}>
                                                        <View style={[styles.wDot, { backgroundColor: isFree ? colors.mint : 'rgba(255,255,255,0.4)' }]} />
                                                        <ThemedText style={[styles.wStatusText, { color: sel ? ink : isFree ? colors.mint : SKINS.ink.sub }]}>
                                                            {isFree ? 'Available' : c.status === 'Busy' && c.waitMinutes ? `${c.waitMinutes}m` : c.status}
                                                        </ThemedText>
                                                    </View>
                                                </Pressable>
                                                {sel ? actionBlock : null}
                                                </React.Fragment>
                                            );
                                        })}
                                    </View>
                                );
                            })}
                            {sortedGroups.length > GROUPS_SHOWN ? (
                                <Pressable accessibilityRole="button" onPress={() => setShowAll((v) => !v)} style={styles.more}>
                                    <ThemedText style={styles.moreText}>
                                        {showAll ? 'Show less' : `Show more · ${sortedGroups.length - GROUPS_SHOWN} more charger${sortedGroups.length - GROUPS_SHOWN === 1 ? '' : 's'}`}
                                    </ThemedText>
                                </Pressable>
                            ) : null}

                        </View>
                    </SkinCard>

                    <Pressable accessibilityRole="button" onPress={() => setTariffOpen(true)} style={styles.tariffLink}>
                        <ThemedText style={[styles.tariffLinkText, { color: colors.textMuted }]}>Tariff and penalty schedule</ThemedText>
                    </Pressable>
                </View>
            </ScrollView>

            <View style={[flat.bottomBar, styles.bar, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open wallet"
                    onPress={() => navigation.navigate('Wallet', { focusTopUp: true })}
                    style={[styles.wallet, { flex: 1, justifyContent: 'space-between', borderColor: lowBalance ? colors.sun : colors.border }]}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Wallet size={16} color={lowBalance ? colors.sun : colors.text} />
                        <View>
                            <ThemedText style={[styles.walletVal, { color: colors.text }]}>{formatRupees(user.walletBalance)}</ThemedText>
                            <ThemedText style={[styles.walletLbl, { color: lowBalance ? colors.sun : colors.textMuted }]}>Wallet balance</ThemedText>
                        </View>
                    </View>
                    <ThemedText style={[styles.walletAdd, { color: lowBalance ? colors.sun : colors.text }]}>{lowBalance ? 'Top up needed' : 'Add money'}</ThemedText>
                </Pressable>
            </View>

            {/* Tariff and penalty schedule */}
            <Modal visible={tariffOpen} transparent animationType="slide" onRequestClose={() => setTariffOpen(false)}>
                <View style={styles.overlay}>
                    <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.sheetHead}>
                            <ThemedText style={[styles.sheetTitle, { color: colors.text }]}>Tariff & penalty schedule</ThemedText>
                            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setTariffOpen(false)} hitSlop={10}>
                                <X size={22} color={colors.text} />
                            </Pressable>
                        </View>
                        <ThemedText style={[flat.caption, { color: colors.textMuted, marginBottom: 8 }]}>{station.name}</ThemedText>
                        {[
                            ['Energy', `₹${minPrice.toFixed(2)} / kWh`],
                            ['GST (CGST 9% + SGST 9%)', '+18%'],
                            ['You pay', `₹${allInPrice(minPrice).toFixed(2)} / kWh`],
                            ['Idle fee grace', '15 min free'],
                            ['Idle fee after that', '₹5 / min'],
                        ].map(([k, v], i) => (
                            <View key={k} style={[styles.tariffRow, { borderTopColor: colors.border }, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth }]}>
                                <ThemedText style={[styles.tariffKey, { color: i === 2 ? colors.text : colors.textMuted }]}>{k}</ThemedText>
                                <ThemedText style={[styles.tariffVal, { color: i === 4 ? colors.error : colors.text }]}>{v}</ThemedText>
                            </View>
                        ))}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13.5 },
    pills: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1 },
    pillText: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13 },
    secHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
    secTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 20, letterSpacing: -0.4 },
    secSub: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13 },
    cardInner: { padding: 16 },
    groupGap: { marginTop: 16 },
    groupHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    numTag: { height: 28, paddingHorizontal: 12, borderRadius: 14, justifyContent: 'center' },
    numTagText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 14 },
    groupMeta: { flex: 1, fontFamily: FONT_FAMILIES.medium, fontSize: 12 },
    track: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, paddingHorizontal: 12, borderRadius: 15 },
    trackText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 12, lineHeight: 16 },
    conn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 16, marginTop: 6 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    connTitle: { fontFamily: FONT_FAMILIES.bold, fontSize: 14 },
    connSub: { fontFamily: FONT_FAMILIES.medium, fontSize: 12, marginTop: 1 },
    wStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    wDot: { width: 8, height: 8, borderRadius: 4 },
    wStatusText: { fontFamily: FONT_FAMILIES.bold, fontSize: 12 },
    more: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
    moreText: { fontFamily: FONT_FAMILIES.bold, fontSize: 14, color: '#FFFFFF' },
    perf: { marginTop: 18, marginBottom: 14 },
    dash: { borderTopWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.3)' },
    inline: { marginTop: 8, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)' },
    setToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
    setSummary: { fontFamily: FONT_FAMILIES.medium, fontSize: 11.5, marginTop: 2 },
    setSub2: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
    setHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    setTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 16, color: '#FFFFFF' },
    setClear: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13, color: '#FFFFFF' },
    modes: { flexDirection: 'row', gap: 6 },
    modeBtn: { flex: 1, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    modeText: { fontFamily: FONT_FAMILIES.bold, fontSize: 12.5 },
    bigVal: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 40, lineHeight: 46, letterSpacing: -1.2, marginTop: 14, color: '#FFFFFF' },
    bigNote: { fontFamily: FONT_FAMILIES.medium, fontSize: 12.5, marginTop: 2 },
    slider: { height: 56, borderRadius: 20, marginTop: 16, justifyContent: 'center' },
    nowFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
    limitFill: { position: 'absolute', top: 0, bottom: 0 },
    thumb: { position: 'absolute', top: -6, width: 24, height: 68, marginLeft: -12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 3 },
    grip: { width: 2, height: 22, borderRadius: 1, backgroundColor: '#0B0B0F' },
    scale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    scaleText: { fontFamily: FONT_FAMILIES.medium, fontSize: 11.5 },
    estRow: { flexDirection: 'row', marginTop: 16 },
    estItem: { flex: 1, alignItems: 'center' },
    estValue: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 15 },
    estLabel: { fontFamily: FONT_FAMILIES.medium, fontSize: 11, marginTop: 2 },
    basis: { fontFamily: FONT_FAMILIES.medium, fontSize: 11.5, lineHeight: 16, marginTop: 10 },
    tariffLink: { alignItems: 'center', paddingVertical: 14 },
    tariffLinkText: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13 },
    bar: { flexDirection: 'row', gap: 10 },
    wallet: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1.5, height: 58 },
    walletVal: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 14 },
    walletAdd: { fontFamily: FONT_FAMILIES.bold, fontSize: 13 },
    walletLbl: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 11 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
    sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    sheetTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 20, letterSpacing: -0.4 },
    tariffRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
    tariffKey: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 15 },
    tariffVal: { fontFamily: FONT_FAMILIES.bold, fontSize: 15 },
});
