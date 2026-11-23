import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Image as RNImage,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    View,
    useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft,
    ChevronRight,
    Share2,
    Heart,
    Clock,
    Navigation,
    Lock,
    Headphones,
    Receipt,
    Zap,
    Bell,
    BellRing,
    Check,
    SlidersHorizontal,
    X,
} from '../../components/sf/icons';
import { ThemedText } from '../../components/ThemedText';
import { TextInput } from '../../components/ThemedTextInput';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';
import { useFavorites } from '../../context/FavoritesContext';
import { Connector, MOCK_STATIONS, Station, ensureChargers, getStationById, isConnectorCompatible } from '../../constants/Stations';
import { stationService } from '../../services/api/stationService';
import { ConnectorIcon } from '../../components/stack/StationCard';
import { Glass, GlassButton } from '../../components/glass/Glass';
import { allInPrice, formatAgo, formatRupees, isStatusFresh, statusAgeSeconds } from '../../utils/pulse';

const NOTIFY_SECONDS = 59 * 60 + 30;
const FALLBACK_GALLERY = [
    'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1558441719-7d885a5a7b63?auto=format&fit=crop&q=80&w=800',
];

type LimitType = 'percent' | 'amount' | 'energy' | 'time';
const LIMITS: { id: LimitType; label: string; unit: string; word: string }[] = [
    { id: 'percent', label: 'Battery', unit: '%', word: 'battery %' },
    { id: 'amount', label: 'Amount', unit: '₹', word: 'amount' },
    { id: 'energy', label: 'Energy', unit: 'kWh', word: 'energy' },
    { id: 'time', label: 'Time', unit: 'min', word: 'minutes' },
];

function tap() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function fmtCount(sec: number) {
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
}

const fmtMins = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

/**
 * Station details (iOS style).
 * Approach: grouped lists per charger, one tap to pick a connector, and the optional
 * charge settings live in a bottom sheet opened from the action bar.
 */
export default function StationDetailScreen({ route, navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
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
    const [photoIdx, setPhotoIdx] = useState(0);
    const [tariffOpen, setTariffOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [showAllChargers, setShowAllChargers] = useState(false);
    const [limitType, setLimitType] = useState<LimitType>('percent');
    const [limitValue, setLimitValue] = useState('');

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

    const fav = isFavorite(station.id);
    const age = statusAgeSeconds(station.id);
    const gallery = station.galleryImages?.length ? station.galleryImages : FALLBACK_GALLERY;
    const minPrice = Math.min(...station.connectors.map((c) => c.pricePerKWh));

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

    // The best connector for your car is preselected, so one tap on Start is enough
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
    const GROUPS_SHOWN = 3;
    const shownGroups = showAllChargers ? sortedGroups : sortedGroups.slice(0, GROUPS_SHOWN);
    const freeTotal = station.connectors.filter((c) => c.status === 'Available').length;

    const activeConn = station.connectors.find((c) => c.id === activeId) ?? null;
    const activeGroup = groups.find((g) => g.connectors.some((c) => c.id === activeId));
    const activeFree = !!activeConn && activeConn.status === 'Available';
    const activeFits = !!activeConn && isConnectorCompatible(activeConn.type, vehicleType);
    const canStart = activeFree && activeFits;

    // Everything about charge settings is worked out from the connector's speed and your car
    const limitNum = parseFloat(limitValue) || 0;
    const limitMeta = LIMITS.find((l) => l.id === limitType)!;
    const vehicleName = selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'your car';
    const speedFor = (c: Connector) => {
        const carMax = (c.currentType ?? (c.type === 'Type 2' ? 'AC' : 'DC')) === 'AC' ? 11 : selectedVehicle?.maxDcRateKw ?? c.power;
        const usable = Math.min(c.power, carMax);
        return { usable, effective: usable * 0.85 };
    };
    const estimate = (c: Connector) => {
        const cap = selectedVehicle?.batteryCapacity ?? 60;
        const cur = selectedVehicle?.currentBattery ?? 20;
        const price = allInPrice(c.pricePerKWh);
        const power = speedFor(c).effective;
        let kwh = Math.max(0, ((100 - cur) / 100) * cap); // nothing entered: charge until you stop
        if (limitType === 'percent' && limitNum > 0) kwh = Math.max(0, ((Math.min(limitNum, 100) - cur) / 100) * cap);
        if (limitType === 'energy' && limitNum > 0) kwh = limitNum;
        if (limitType === 'amount' && limitNum > 0) kwh = limitNum / price;
        if (limitType === 'time' && limitNum > 0) kwh = (power * limitNum) / 60;
        kwh = Math.min(kwh, ((100 - cur) / 100) * cap);
        const mins = limitType === 'time' && limitNum > 0 ? limitNum : power > 0 ? Math.round((kwh / power) * 60) : 0;
        return { kwh, mins, cost: kwh * price, endSoc: Math.min(100, Math.round(cur + (kwh / cap) * 100)) };
    };
    const quickFor = (c: Connector, type: LimitType): number[] => {
        const cap = selectedVehicle?.batteryCapacity ?? 60;
        const cur = selectedVehicle?.currentBattery ?? 20;
        const price = allInPrice(c.pricePerKWh);
        const power = speedFor(c).effective;
        const room = Math.max(0, ((100 - cur) / 100) * cap);
        const steps = [0.25, 0.5, 0.75, 1];
        const uniq = (a: number[]) => Array.from(new Set(a)).filter((v) => v > 0);
        if (type === 'percent') {
            const opts = [60, 70, 80, 90, 100].filter((v) => v > cur + 5);
            return opts.length ? opts.slice(-4) : [100];
        }
        if (type === 'energy') return uniq(steps.map((f) => Math.max(1, Math.round(room * f))));
        if (type === 'amount') return uniq(steps.map((f) => Math.max(50, Math.round((room * f * price) / 50) * 50)));
        const fullMins = power > 0 ? (room / power) * 60 : 0;
        return uniq(steps.map((f) => Math.max(5, Math.round((fullMins * f) / 5) * 5)));
    };
    const activeEstimate = activeConn ? estimate(activeConn) : { kwh: 0, mins: 0, cost: 0, endSoc: 0 };

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

    const go = (c: Connector) =>
        navigation.navigate('ChargingSession', {
            stationId: station.id,
            stationSnapshot: station,
            connectorId: c.id,
            targetSoc: limitType === 'percent' && limitNum > 0 ? Math.min(limitNum, 100) : 100,
            maxSpend: limitType === 'amount' && limitNum > 0 ? limitNum : undefined,
            maxEnergyKwh: limitType === 'energy' && limitNum > 0 ? limitNum : undefined,
            maxMinutes: limitType === 'time' && limitNum > 0 ? limitNum : undefined,
        });
    const start = (c: Connector) => {
        const est = estimate(c).cost;
        if (est > 0 && user.walletBalance < est) {
            Alert.alert('Top up first?', `This charge is about ${formatRupees(est)} and your wallet has ${formatRupees(user.walletBalance)}.`, [
                { text: 'Add money', onPress: () => navigation.navigate('Wallet', { focusTopUp: true }) },
                { text: 'Start anyway', onPress: () => go(c) },
                { text: 'Cancel', style: 'cancel' },
            ]);
            return;
        }
        go(c);
    };

    const hours = station.openTime === '24/7' ? 'Open 24 hrs' : `${station.openTime} – ${station.closeTime}`;
    const rowTint = isDark ? 'rgba(10,132,255,0.2)' : 'rgba(0,122,255,0.10)';
    const settingsSummary = limitNum > 0 ? `${limitMeta.label} ${limitNum}${limitMeta.unit}` : 'Not set';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
                <View style={styles.topRow}>
                    <GlassButton label="Back" size={44} onPress={() => navigation.goBack()}>
                        <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
                    </GlassButton>
                    <View style={styles.topRight}>
                        <GlassButton label="Share station" size={44} onPress={share}>
                            <Share2 size={19} color={colors.text} />
                        </GlassButton>
                        <GlassButton
                            label={fav ? 'Remove from favorites' : 'Add to favorites'}
                            size={44}
                            onPress={() => {
                                tap();
                                toggleFavorite(station.id);
                            }}
                        >
                            <Heart size={19} color={fav ? colors.error : colors.text} fill={fav ? colors.error : 'none'} />
                        </GlassButton>
                    </View>
                </View>

                <ThemedText style={[styles.title, { color: colors.text }]}>{station.name}</ThemedText>
                <ThemedText style={[styles.address, { color: colors.textMuted }]} numberOfLines={2}>{station.address}</ThemedText>
                <View style={styles.facts}>
                    <View style={[styles.fact, { backgroundColor: colors.surface }]}>
                        <Navigation size={14} color={colors.primary} />
                        <ThemedText style={[styles.factText, { color: colors.text }]}>{station.distanceKm} km · {station.etaMinutes} min</ThemedText>
                    </View>
                    <View style={[styles.fact, { backgroundColor: colors.surface }]}>
                        <Clock size={14} color={colors.primary} />
                        <ThemedText style={[styles.factText, { color: colors.text }]}>{hours}</ThemedText>
                    </View>
                    <View style={[styles.fact, { backgroundColor: colors.surface }]}>
                        <Lock size={14} color={colors.primary} />
                        <ThemedText style={[styles.factText, { color: colors.text }]}>{station.accessType ?? 'Public'}</ThemedText>
                    </View>
                </View>
                <ThemedText style={[styles.fresh, { color: colors.textMuted }]}>
                    {isStatusFresh(age) ? 'Live status' : 'Status may be stale'} · updated {formatAgo(age)}
                </ThemedText>

                {/* Photos */}
                <View style={[styles.photo, { width: width - 32 }]}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / (width - 32)))}
                    >
                        {gallery.map((uri, i) => (
                            <View key={uri + i} style={{ width: width - 32, height: 190 }}>
                                <LinearGradient colors={isDark ? ['#1C3A5E', '#3A2A5C'] : ['#A8CCFA', '#F2C8D0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                                <RNImage source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel={`${station.name} photo ${i + 1}`} />
                            </View>
                        ))}
                    </ScrollView>
                    {gallery.length > 1 ? (
                        <Glass radius={12} style={styles.photoBadge}>
                            <ThemedText style={[styles.photoBadgeText, { color: colors.text }]}>{photoIdx + 1} / {gallery.length}</ThemedText>
                        </Glass>
                    ) : null}
                </View>

                {/* Chargers: one grouped list per charger */}
                <View style={styles.sectionHead}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Chargers</ThemedText>
                    <ThemedText style={[styles.sectionCount, { color: colors.textMuted }]}>{freeTotal} of {station.connectors.length} available</ThemedText>
                </View>

                {shownGroups.map((g) => {
                    const free = g.connectors.filter((c) => c.status === 'Available').length;
                    const secs = tracked[g.chargerId];
                    const tracking = !!secs && secs > 0;
                    return (
                        <View key={g.chargerId} style={[styles.group, { backgroundColor: colors.surface }]}>
                            <View style={styles.groupHead}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={[styles.groupTitle, { color: colors.text }]}>Charger {g.chargerId}</ThemedText>
                                    <ThemedText style={[styles.groupSub, { color: colors.textMuted }]}>
                                        {g.connectors.length} connector{g.connectors.length === 1 ? '' : 's'} · {free} available
                                    </ThemedText>
                                </View>
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
                                    style={({ pressed }) => [styles.trackBtn, { backgroundColor: tracking ? 'rgba(255,149,0,0.16)' : rowTint, opacity: pressed ? 0.7 : 1 }]}
                                >
                                    {tracking ? <BellRing size={14} color={colors.warning} /> : <Bell size={14} color={colors.primary} />}
                                    <ThemedText style={[styles.trackText, { color: tracking ? colors.warning : colors.primary }]}>
                                        {tracking ? `Tracking ${fmtCount(secs)}` : 'Track'}
                                    </ThemedText>
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
                                        style={[styles.row, { borderTopColor: colors.border, backgroundColor: sel ? rowTint : 'transparent', opacity: fits || sel ? 1 : 0.55 }]}
                                    >
                                        <View style={[styles.rowIcon, { backgroundColor: sel ? colors.primary : rowTint }]}>
                                            <ConnectorIcon type={c.type} size={20} color={sel ? '#FFFFFF' : colors.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <ThemedText style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                                                {c.gunLabel ?? 'Gun'} · {c.type}
                                            </ThemedText>
                                            <ThemedText style={[styles.rowSub, { color: colors.textMuted }]} numberOfLines={1}>
                                                {c.power} kW {kind} · ₹{allInPrice(c.pricePerKWh).toFixed(0)}/kWh{!fits ? ' · not for your car' : ''}
                                            </ThemedText>
                                            {c.id === bestId ? <ThemedText style={[styles.reco, { color: colors.primary }]}>Recommended for your car</ThemedText> : null}
                                        </View>
                                        <ThemedText style={[styles.rowStatus, { color: isFree ? colors.success : colors.textMuted }]}>
                                            {isFree ? 'Available' : c.status === 'Busy' && c.waitMinutes ? `${c.waitMinutes} min` : c.status}
                                        </ThemedText>
                                        <View style={[styles.check, sel ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.textSoft }]}>
                                            {sel ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
                                        </View>
                                    </Pressable>
                                    {sel ? (
                                        <View style={[styles.actions, { backgroundColor: rowTint }]}>
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel="Charge settings"
                                                onPress={() => {
                                                    tap();
                                                    setSettingsOpen(true);
                                                }}
                                                style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 }]}
                                            >
                                                <SlidersHorizontal size={16} color={colors.primary} />
                                                <ThemedText style={[styles.actionText, { color: colors.primary }]} numberOfLines={1}>
                                                    {limitNum > 0 ? settingsSummary : 'Charge settings'}
                                                </ThemedText>
                                            </Pressable>
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`Start charging on ${c.type}`}
                                                disabled={!isFree || !fits}
                                                onPress={() => {
                                                    tap();
                                                    start(c);
                                                }}
                                                style={({ pressed }) => [styles.actionBtn, { flex: 1.2, backgroundColor: isFree && fits ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.85 : 1 }]}
                                            >
                                                <Zap size={16} color={isFree && fits ? '#FFFFFF' : colors.textSoft} fill={isFree && fits ? '#FFFFFF' : 'none'} />
                                                <ThemedText style={[styles.actionText, { color: isFree && fits ? '#FFFFFF' : colors.textSoft }]} numberOfLines={1}>
                                                    {isFree && fits ? 'Start Charging' : !isFree ? 'Connector busy' : 'Not compatible'}
                                                </ThemedText>
                                            </Pressable>
                                        </View>
                                    ) : null}
                                    </React.Fragment>
                                );
                            })}
                        </View>
                    );
                })}

                {sortedGroups.length > GROUPS_SHOWN ? (
                    <Pressable accessibilityRole="button" onPress={() => setShowAllChargers((v) => !v)} style={styles.more}>
                        <ThemedText style={[styles.moreText, { color: colors.primary }]}>
                            {showAllChargers ? 'Show Less' : `Show More · ${sortedGroups.length - GROUPS_SHOWN} more charger${sortedGroups.length - GROUPS_SHOWN === 1 ? '' : 's'}`}
                        </ThemedText>
                    </Pressable>
                ) : null}

                <Pressable accessibilityRole="button" onPress={() => setTariffOpen(true)} style={styles.tariffLink}>
                    <ThemedText style={[styles.tariffLinkText, { color: colors.primary }]}>View full tariff and penalty schedule</ThemedText>
                </Pressable>
            </ScrollView>

            {/* Bottom actions, like before: Help Support and Get Direction */}
            <Glass radius={0} style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                        tap();
                        help();
                    }}
                    style={({ pressed }) => [styles.bottomBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth * 2, opacity: pressed ? 0.8 : 1 }]}
                >
                    <Headphones size={22} color={colors.text} />
                    <ThemedText style={[styles.bottomText, { color: colors.text }]}>Help Support</ThemedText>
                </Pressable>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                        tap();
                        directions();
                    }}
                    style={({ pressed }) => [styles.bottomBtn, { backgroundColor: isDark ? '#FFFFFF' : '#000000', opacity: pressed ? 0.8 : 1 }]}
                >
                    <Navigation size={22} color={isDark ? '#000000' : '#FFFFFF'} />
                    <ThemedText style={[styles.bottomText, { color: isDark ? '#000000' : '#FFFFFF' }]}>Get Direction</ThemedText>
                </Pressable>
            </Glass>

            {/* Charge settings sheet (all optional) */}
            <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setSettingsOpen(false)} accessibilityLabel="Close settings" />
                    <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
                        <View style={[styles.grab, { backgroundColor: colors.border }]} />
                        <View style={styles.sheetHead}>
                            <ThemedText style={[styles.sheetTitle, { color: colors.text }]}>Charge settings</ThemedText>
                            <Pressable accessibilityRole="button" onPress={() => setSettingsOpen(false)} hitSlop={10}>
                                <ThemedText style={[styles.done, { color: colors.primary }]}>Done</ThemedText>
                            </Pressable>
                        </View>
                        {activeConn ? (
                            <ThemedText style={[styles.basis, { color: colors.textMuted }]}>
                                For {vehicleName}
                                {selectedVehicle ? ` (${selectedVehicle.currentBattery}%, ${selectedVehicle.batteryCapacity} kWh)` : ''} on {activeConn.type} {activeConn.power} kW: about {speedFor(activeConn).usable} kW
                            </ThemedText>
                        ) : null}

                        {/* Segmented control: what should stop the charge */}
                        <View style={[styles.segment, { backgroundColor: isDark ? 'rgba(118,118,128,0.24)' : 'rgba(118,118,128,0.12)' }]}>
                            {LIMITS.map((l) => {
                                const on = limitType === l.id;
                                return (
                                    <Pressable
                                        key={l.id}
                                        accessibilityRole="tab"
                                        accessibilityState={{ selected: on }}
                                        onPress={() => {
                                            tap();
                                            setLimitType(l.id);
                                            setLimitValue('');
                                        }}
                                        style={[styles.segItem, on && { backgroundColor: colors.surface }]}
                                    >
                                        <ThemedText style={[styles.segText, { color: on ? colors.text : colors.textMuted }]}>{l.label}</ThemedText>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Big value field */}
                        <View style={[styles.valueBox, { backgroundColor: colors.surface }]}>
                            <TextInput
                                value={limitValue}
                                onChangeText={(t) => setLimitValue(t.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                                maxLength={5}
                                placeholder={`Enter ${limitMeta.word}`}
                                placeholderTextColor={colors.textSoft}
                                style={[styles.valueInput, { color: colors.text }]}
                                accessibilityLabel="Limit value"
                            />
                            <ThemedText style={[styles.valueUnit, { color: colors.textMuted }]}>{limitMeta.unit}</ThemedText>
                        </View>
                        {activeConn ? (
                            <View style={styles.quickRow}>
                                {quickFor(activeConn, limitType).map((q) => {
                                    const on = limitNum === q;
                                    return (
                                        <Pressable
                                            key={q}
                                            accessibilityRole="button"
                                            onPress={() => setLimitValue(String(q))}
                                            style={[styles.quick, { backgroundColor: on ? colors.primary : colors.surface }]}
                                        >
                                            <ThemedText style={[styles.quickText, { color: on ? '#FFFFFF' : colors.text }]}>{q}{limitMeta.unit}</ThemedText>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        ) : null}

                        {/* Estimate, as an inset grouped table */}
                        <View style={[styles.table, { backgroundColor: colors.surface }]}>
                            {[
                                ['Energy', activeEstimate.kwh > 0 ? `${activeEstimate.kwh.toFixed(1)} kWh` : '—'],
                                ['Time', activeEstimate.mins > 0 ? fmtMins(activeEstimate.mins) : '—'],
                                ['Cost', activeEstimate.cost > 0 ? formatRupees(activeEstimate.cost) : '—'],
                                ['Battery at finish', selectedVehicle ? `${activeEstimate.endSoc}%` : '—'],
                            ].map(([k, v], i) => (
                                <View key={k} style={[styles.tableRow, i > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                                    <ThemedText style={[styles.tableKey, { color: colors.textMuted }]}>{k}</ThemedText>
                                    <ThemedText style={[styles.tableVal, { color: colors.text }]}>{v}</ThemedText>
                                </View>
                            ))}
                        </View>
                        {limitNum > 0 ? (
                            <Pressable accessibilityRole="button" onPress={() => setLimitValue('')} style={styles.clear}>
                                <ThemedText style={[styles.clearText, { color: colors.error }]}>Clear limit</ThemedText>
                            </Pressable>
                        ) : null}
                    </View>
                </KeyboardAvoidingView>
            </Modal>

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
                        <ThemedText style={[styles.basis, { color: colors.textMuted }]}>{station.name}</ThemedText>
                        {[
                            ['Energy', `₹${minPrice.toFixed(2)} / kWh`],
                            ['GST (CGST 9% + SGST 9%)', '+18%'],
                            ['You pay', `₹${allInPrice(minPrice).toFixed(2)} / kWh`],
                            ['Idle fee grace', '15 min free'],
                            ['Idle fee after that', '₹5 / min'],
                        ].map(([k, v], i) => (
                            <View key={k} style={[styles.tableRow, { borderTopColor: colors.border }, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth }]}>
                                <ThemedText style={[styles.tableKey, { color: i === 2 ? colors.text : colors.textMuted, fontWeight: i === 2 ? '700' : '500' }]}>{k}</ThemedText>
                                <ThemedText style={[styles.tableVal, { color: i === 4 ? colors.error : colors.text }]}>{v}</ThemedText>
                            </View>
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
    topRight: { flexDirection: 'row', gap: 8 },
    title: { fontSize: 34, lineHeight: 41, fontWeight: '800', letterSpacing: -0.6, marginTop: 14 },
    address: { fontSize: 15, fontWeight: '500', marginTop: 4 },
    facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    fact: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 16 },
    factText: { fontSize: 13, fontWeight: '600' },
    fresh: { fontSize: 12, fontWeight: '500', marginTop: 8 },
    photo: { marginTop: 16, height: 190, borderRadius: 26, overflow: 'hidden' },
    photoBadge: { position: 'absolute', right: 12, bottom: 12, height: 26, paddingHorizontal: 10, justifyContent: 'center' },
    photoBadgeText: { fontSize: 12, fontWeight: '700' },
    sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 22, marginBottom: 8, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 22, fontWeight: '800' },
    sectionCount: { fontSize: 13, fontWeight: '600' },
    group: { borderRadius: 22, overflow: 'hidden', marginBottom: 12 },
    groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
    groupTitle: { fontSize: 17, fontWeight: '700' },
    groupSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
    trackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, minWidth: 84, paddingHorizontal: 14, borderRadius: 17 },
    trackText: { fontSize: 13, lineHeight: 17, fontWeight: '700' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
    rowIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    rowTitle: { fontSize: 16, fontWeight: '600' },
    rowSub: { fontSize: 12.5, fontWeight: '500', marginTop: 1 },
    reco: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },
    rowStatus: { fontSize: 12.5, fontWeight: '600' },
    check: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    more: { alignItems: 'center', paddingVertical: 10 },
    moreText: { fontSize: 15, fontWeight: '600' },
    listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 54 },
    listIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    listLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
    bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 16, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
    bottomBtn: { flex: 1, height: 58, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    bottomText: { fontSize: 17, fontWeight: '700' },
    actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
    actionBtn: { flex: 1, height: 46, borderRadius: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
    actionText: { fontSize: 14, fontWeight: '700' },
    tariffLink: { alignItems: 'center', paddingVertical: 14 },
    tariffLinkText: { fontSize: 16, fontWeight: '700' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 16 },
    grab: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 12 },
    sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sheetTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
    done: { fontSize: 17, fontWeight: '600' },
    basis: { fontSize: 13, fontWeight: '500', lineHeight: 18, marginTop: 6, marginBottom: 12 },
    segment: { flexDirection: 'row', borderRadius: 12, padding: 3 },
    segItem: { flex: 1, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    segText: { fontSize: 13, fontWeight: '700' },
    valueBox: { flexDirection: 'row', alignItems: 'center', height: 64, borderRadius: 18, paddingHorizontal: 18, marginTop: 14 },
    valueInput: { flex: 1, fontSize: 28, fontWeight: '800' },
    valueUnit: { fontSize: 18, fontWeight: '700', marginLeft: 8 },
    quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    quick: { height: 36, paddingHorizontal: 16, borderRadius: 18, justifyContent: 'center' },
    quickText: { fontSize: 14, fontWeight: '700' },
    table: { borderRadius: 18, marginTop: 14, paddingHorizontal: 16 },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13 },
    tableKey: { fontSize: 15 },
    tableVal: { fontSize: 15, fontWeight: '700' },
    clear: { alignItems: 'center', paddingVertical: 12 },
    clearText: { fontSize: 15, fontWeight: '600' },
});
