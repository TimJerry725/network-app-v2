import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Image as RNImage,
    LayoutAnimation,
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
import { TextInput } from '../../components/ThemedTextInput';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft,
    Share2,
    Heart,
    Clock,
    Navigation,
    Wifi,
    ShoppingBag,
    User,
    Coffee,
    Image as PhotoIcon,
    Plug,
    CircleCheck,
    Zap,
    Headphones,
    Bell,
    BellRing,
    X,
    ChevronUp,
    ChevronDown,
    Check,
} from '../../components/sf/icons';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';
import { useFavorites } from '../../context/FavoritesContext';
import { Connector, MOCK_STATIONS, Station, ensureChargers, getStationById, isConnectorCompatible } from '../../constants/Stations';
import { stationService } from '../../services/api/stationService';
import { Glass, GlassButton } from '../../components/glass/Glass';
import { Tile, Eyebrow, IconDot } from '../../components/bento/Bento';
import { BENTO } from '../../constants/Colors';
import { ConnectorIcon } from '../../components/stack/StationCard';
import { allInPrice, formatAgo, formatRupees, isStatusFresh, statusAgeSeconds } from '../../utils/pulse';

const NOTIFY_SECONDS = 59 * 60 + 30;
const FALLBACK_GALLERY = [
    'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1558441719-7d885a5a7b63?auto=format&fit=crop&q=80&w=800',
];

function fmtCount(sec: number) {
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
}

function tap() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function amenityIcon(name: string, color: string) {
    const n = name.toLowerCase();
    if (n.includes('wifi')) return <Wifi size={26} color={color} />;
    if (n.includes('rest') || n.includes('wash')) return <User size={26} color={color} />;
    if (n.includes('mall') || n.includes('store') || n.includes('shop')) return <ShoppingBag size={26} color={color} />;
    return <Coffee size={26} color={color} />;
}

/** Station details (iOS 27 design). */
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
    type LimitType = 'percent' | 'amount' | 'energy' | 'time';
    const [limitType, setLimitType] = useState<LimitType>('percent');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [limitValue, setLimitValue] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [tracked, setTracked] = useState<Record<string, number>>({});
    const [photoIdx, setPhotoIdx] = useState(0);
    const [tariffOpen, setTariffOpen] = useState(false);

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
    // Best match is preselected, so one tap on Start is enough
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
    const [showAllChargers, setShowAllChargers] = useState(false);
    // Chargers with a free connector come first (by number), busy ones after; free connectors lead inside each charger
    const sortedGroups = useMemo(() => {
        const freeOf = (g: { connectors: Connector[] }) => g.connectors.filter((c) => c.status === 'Available').length;
        // The recommended (selected) charger leads, then other chargers with a free connector, then busy ones
        const rank = (g: { connectors: Connector[] }) => (g.connectors.some((c) => c.id === bestId) ? 0 : freeOf(g) > 0 ? 1 : 2);
        return groups
            .map((g) => ({ ...g, connectors: [...g.connectors].sort((a, b) => Number(b.status === 'Available') - Number(a.status === 'Available')) }))
            .sort((x, y) => rank(x) - rank(y) || x.chargerId.localeCompare(y.chargerId, undefined, { numeric: true }));
    }, [groups, bestId]);
    const GROUPS_SHOWN = 3;
    const shownGroups = showAllChargers ? sortedGroups : sortedGroups.slice(0, GROUPS_SHOWN);
    const freeTotal = station.connectors.filter((c) => c.status === 'Available').length;

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

    const limitNum = parseFloat(limitValue) || 0;
    // Everything below is worked out from the connector's speed and your car's battery and charge rate
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
        let kwh = Math.max(0, ((100 - cur) / 100) * cap); // no value entered: charge until you stop
        if (limitType === 'percent' && limitNum > 0) kwh = Math.max(0, ((Math.min(limitNum, 100) - cur) / 100) * cap);
        if (limitType === 'energy' && limitNum > 0) kwh = limitNum;
        if (limitType === 'amount' && limitNum > 0) kwh = limitNum / price;
        if (limitType === 'time' && limitNum > 0) kwh = (power * limitNum) / 60;
        kwh = Math.min(kwh, ((100 - cur) / 100) * cap); // a battery can only take so much
        const mins = limitType === 'time' && limitNum > 0 ? limitNum : power > 0 ? Math.round((kwh / power) * 60) : 0;
        return { kwh, mins, cost: kwh * price, endSoc: Math.min(100, Math.round(cur + (kwh / cap) * 100)) };
    };
    // Suggested values for each limit type, for the selected connector and car
    const quickFor = (c: Connector, type: LimitType): number[] => {
        const cap = selectedVehicle?.batteryCapacity ?? 60;
        const cur = selectedVehicle?.currentBattery ?? 20;
        const price = allInPrice(c.pricePerKWh);
        const power = speedFor(c).effective;
        const room = Math.max(0, ((100 - cur) / 100) * cap); // kWh the battery can still take
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

    const chipBg = isDark ? 'rgba(255,255,255,0.10)' : '#FFFFFF';

    const activeConn = station.connectors.find((c) => c.id === activeId) ?? null;
    const activeFree = !!activeConn && activeConn.status === 'Available';
    const activeFits = !!activeConn && isConnectorCompatible(activeConn.type, vehicleType);
    const canStart = activeFree && activeFits;
    const activeEstimate = activeConn ? estimate(activeConn) : { kwh: 0, mins: 0, cost: 0, endSoc: 0 };
    const fmtMins = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);
    const LIMITS: { id: LimitType; label: string; unit: string }[] = [
        { id: 'percent', label: 'Battery %', unit: '%' },
        { id: 'amount', label: 'Amount', unit: '₹' },
        { id: 'energy', label: 'Energy', unit: 'kWh' },
        { id: 'time', label: 'Time', unit: 'min' },
    ];
    const hours = station.openTime === '24/7' ? 'Open 24 hrs' : `${station.openTime} – ${station.closeTime}`;

    const settingsBlock = activeConn ? (
        <View style={[styles.settings, { backgroundColor: colors.background }]}>
            <ThemedText style={[styles.basis, { color: colors.textMuted }]}>
                For {vehicleName}{selectedVehicle ? ` (${selectedVehicle.currentBattery}%, ${selectedVehicle.batteryCapacity} kWh)` : ''} on {activeConn.type} {activeConn.power} kW: about {speedFor(activeConn).usable} kW
            </ThemedText>
            <ThemedText style={[styles.setLabel, { color: colors.textMuted }]}>Stop when</ThemedText>
            <View style={styles.chipsWrap}>
                {LIMITS.map((l) => {
                    const on = limitType === l.id;
                    return (
                        <Pressable
                            key={l.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected: on }}
                            onPress={() => {
                                tap();
                                setLimitType(l.id);
                                setLimitValue('');
                            }}
                            style={[styles.setChip, { backgroundColor: on ? '#B9A6F2' : colors.surface }]}
                        >
                            <ThemedText style={[styles.setChipText, { color: on ? '#0B0B0F' : colors.text }]}>{l.label}</ThemedText>
                        </Pressable>
                    );
                })}
            </View>
            <View style={[styles.valueRow, { backgroundColor: colors.surface }]}>
                <TextInput
                    value={limitValue}
                    onChangeText={(t) => setLimitValue(t.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    maxLength={5}
                    placeholder={`Enter ${LIMITS.find((l) => l.id === limitType)?.label.toLowerCase()}`}
                    placeholderTextColor={colors.textSoft}
                    style={[styles.valueInput, { color: colors.text }]}
                    accessibilityLabel="Limit value"
                />
                <ThemedText style={[styles.unit, { color: colors.textMuted }]}>{LIMITS.find((l) => l.id === limitType)?.unit}</ThemedText>
            </View>
            <View style={styles.chipsWrap}>
                {quickFor(activeConn, limitType).map((q) => (
                    <Pressable key={q} accessibilityRole="button" onPress={() => setLimitValue(String(q))} style={[styles.setChip, { backgroundColor: colors.surface }]}>
                        <ThemedText style={[styles.setChipText, { color: colors.text }]}>{q}{LIMITS.find((l) => l.id === limitType)?.unit}</ThemedText>
                    </Pressable>
                ))}
            </View>
            <View style={[styles.estRow, { borderTopColor: colors.border }]}>
                {[
                    ['Energy', activeEstimate.kwh > 0 ? `${activeEstimate.kwh.toFixed(1)} kWh` : '—'],
                    ['Time', activeEstimate.mins > 0 ? fmtMins(activeEstimate.mins) : '—'],
                    ['Cost', activeEstimate.cost > 0 ? formatRupees(activeEstimate.cost) : '—'],
                    ['Battery', selectedVehicle ? `${activeEstimate.endSoc}%` : '—'],
                ].map(([label, value]) => (
                    <View key={label} style={styles.estItem}>
                        <ThemedText style={[styles.estValue, { color: colors.text }]} numberOfLines={1}>{value}</ThemedText>
                        <ThemedText style={[styles.estLabel, { color: colors.textMuted }]}>{label}</ThemedText>
                    </View>
                ))}
            </View>
        </View>
    ) : null;

    const settingsButton = (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: settingsOpen }}
            onPress={() => {
                tap();
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSettingsOpen((v) => !v);
            }}
            style={[styles.settingsBtn, { backgroundColor: colors.background }]}
        >
            <ThemedText style={[styles.settingsBtnText, { color: colors.text }]} numberOfLines={1}>
                Charge settings{limitNum > 0 ? ` · ${limitNum}${LIMITS.find((l) => l.id === limitType)?.unit}` : ''}
            </ThemedText>
            {settingsOpen ? <ChevronUp size={16} color={colors.text} /> : <ChevronDown size={16} color={colors.text} />}
        </Pressable>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120, paddingHorizontal: 12 }} showsVerticalScrollIndicator={false}>
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

                {/* Name and one line of facts */}
                <ThemedText style={[styles.title, { color: colors.text }]}>{station.name}</ThemedText>
                <ThemedText style={[styles.address, { color: colors.textMuted }]} numberOfLines={2}>{station.address}</ThemedText>
                <View style={styles.facts}>
                    {[`${station.distanceKm} km`, `${station.etaMinutes} min`, hours, station.accessType ?? 'Public'].map((f, i) => (
                        <View key={f + i} style={[styles.fact, { backgroundColor: colors.surface }]}>
                            <ThemedText style={[styles.factText, { color: colors.text }]}>{f}</ThemedText>
                        </View>
                    ))}
                </View>

                {/* One photo */}
                <View style={[styles.photo, { width: width - 24 }]}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / (width - 24)))}
                    >
                        {gallery.map((uri, i) => (
                            <View key={uri + i} style={{ width: width - 24, height: 168 }}>
                                <LinearGradient colors={isDark ? ['#1C3A5E', '#3A2A5C'] : ['#A8CCFA', '#F2C8D0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                                <RNImage source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel={`${station.name} photo ${i + 1}`} />
                            </View>
                        ))}
                    </ScrollView>
                    {gallery.length > 1 ? (
                        <View style={styles.dots}>
                            {gallery.map((_, i) => (
                                <View key={i} style={[styles.dotPager, { backgroundColor: i === photoIdx ? '#FFFFFF' : 'rgba(255,255,255,0.5)', width: i === photoIdx ? 16 : 6 }]} />
                            ))}
                        </View>
                    ) : null}
                </View>

                {/* Connectors, grouped by the charger number printed on each unit */}
                <View style={styles.sectionHead}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Chargers</ThemedText>
                    <ThemedText style={[styles.sectionCount, { color: colors.textMuted }]}>{freeTotal} of {station.connectors.length} connectors available</ThemedText>
                </View>


                {shownGroups.map((g) => {
                    const free = g.connectors.filter((c) => c.status === 'Available').length;
                    return (
                        <View key={g.chargerId} style={[styles.panel, { backgroundColor: colors.surface }]}>
                            <View style={styles.groupHead}>
                                <View style={styles.numTag}>
                                    <ThemedText style={styles.numTagText}>{g.chargerId}</ThemedText>
                                </View>
                                <ThemedText style={[styles.groupMeta, { color: colors.textMuted, flex: 1, marginLeft: 10 }]} numberOfLines={1}>
                                    {g.connectors.length} connector{g.connectors.length === 1 ? '' : 's'} · {free} available
                                </ThemedText>
                                {(() => {
                                    const secs = tracked[g.chargerId];
                                    const on = !!secs && secs > 0;
                                    return (
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityState={{ selected: on }}
                                            accessibilityLabel={on ? `Stop tracking ${g.chargerId}` : `Track ${g.chargerId}`}
                                            onPress={() => {
                                                tap();
                                                setTracked((p) => {
                                                    const n = { ...p };
                                                    if (n[g.chargerId]) delete n[g.chargerId];
                                                    else n[g.chargerId] = NOTIFY_SECONDS;
                                                    return n;
                                                });
                                            }}
                                            style={({ pressed }) => [styles.trackBtn, { backgroundColor: on ? '#EE6C58' : '#B9A6F2', opacity: pressed ? 0.8 : 1 }]}
                                        >
                                            {on ? <BellRing size={14} color="#FFFFFF" /> : <Bell size={14} color="#0B0B0F" />}
                                            <ThemedText style={[styles.trackText, { color: on ? '#FFFFFF' : '#0B0B0F' }]}>
                                                {on ? `Tracking ${fmtCount(secs)}` : 'Track'}
                                            </ThemedText>
                                        </Pressable>
                                    );
                                })()}
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
                                            style={[styles.conn, { backgroundColor: sel ? (isDark ? '#4E9EDB' : '#6DB8F2') : colors.background, borderColor: 'transparent', opacity: fits || sel ? 1 : 0.55 }]}
                                        >
                                            <View style={[styles.radio, sel ? { backgroundColor: '#0B0B0F', borderColor: '#0B0B0F' } : { borderColor: colors.textSoft }]}>
                                                {sel ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
                                            </View>
                                            <View style={[styles.connIcon, { backgroundColor: kind === 'DC' ? BENTO.light.mint.bg : BENTO.light.blue.bg }]}>
                                                <ConnectorIcon type={c.type} size={20} color="#0B0B0F" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={styles.titleRow}>
                                                    <ThemedText style={[styles.connTitle, { color: sel ? '#0B0B0F' : colors.text }]} numberOfLines={1}>
                                                        {c.gunLabel ?? 'Gun'} · {c.type}
                                                    </ThemedText>
                                                    {c.id === bestId ? (
                                                        <View style={styles.bestPill}>
                                                            <ThemedText style={styles.bestText}>Recommended</ThemedText>
                                                        </View>
                                                    ) : null}
                                                </View>
                                                <ThemedText style={[styles.connSub, { color: sel ? 'rgba(11,11,15,0.7)' : colors.textMuted }]} numberOfLines={1}>
                                                    {c.power} kW {kind} · ₹{allInPrice(c.pricePerKWh).toFixed(0)}/kWh{!fits ? ' · not for your car' : ''}
                                                </ThemedText>
                                            </View>
                                            <View style={styles.statusRow}>
                                                <View style={[styles.statusDot, { backgroundColor: isFree ? '#52BE89' : colors.textSoft }]} />
                                                <ThemedText style={[styles.statusText, { color: isFree ? (sel ? '#0F5C3A' : '#2E9E68') : sel ? 'rgba(11,11,15,0.7)' : colors.textMuted }]}>
                                                    {isFree ? 'Available' : c.status === 'Busy' && c.waitMinutes ? `${c.waitMinutes}m` : c.status}
                                                </ThemedText>
                                            </View>
                                        </Pressable>
                                        {sel ? (
                                            <>
                                                {settingsButton}
                                                {settingsOpen ? settingsBlock : null}
                                            </>
                                        ) : null}
                                    </React.Fragment>
                                );
                            })}
                        </View>
                    );
                })}
                {sortedGroups.length > GROUPS_SHOWN ? (
                    <Pressable accessibilityRole="button" onPress={() => setShowAllChargers((v) => !v)} style={styles.showAll}>
                        <ThemedText style={[styles.showAllText, { color: colors.text }]}>
                            {showAllChargers ? 'Show less' : `Show more · ${sortedGroups.length - GROUPS_SHOWN} more charger${sortedGroups.length - GROUPS_SHOWN === 1 ? '' : 's'}`}
                        </ThemedText>
                    </Pressable>
                ) : null}

                <View style={{ marginTop: 4 }}>
                </View>

                <Pressable accessibilityRole="button" onPress={() => setTariffOpen(true)} style={styles.tariffLink}>
                    <ThemedText style={[styles.tariffLinkText, { color: colors.textMuted }]}>Tariff and penalty schedule</ThemedText>
                </Pressable>
            </ScrollView>

            {/* Bottom: directions, help, start */}
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.background }]}>
                <GlassButton label="Get directions" size={56} onPress={directions}>
                    <Navigation size={22} color={colors.text} />
                </GlassButton>
                <GlassButton label="Help" size={56} onPress={help}>
                    <Headphones size={22} color={colors.text} />
                </GlassButton>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Start charging"
                    disabled={!canStart}
                    onPress={() => {
                        tap();
                        if (activeConn) start(activeConn);
                    }}
                    style={({ pressed }) => [styles.startBtn, { backgroundColor: canStart ? '#52BE89' : colors.surfaceMuted, opacity: pressed ? 0.85 : 1 }]}
                >
                    <Zap size={18} color={canStart ? '#0B0B0F' : colors.textSoft} fill={canStart ? '#0B0B0F' : 'none'} />
                    <ThemedText style={[styles.startText, { color: canStart ? '#0B0B0F' : colors.textSoft }]} numberOfLines={1}>
                        {canStart ? `Start · ${activeConn?.type} ${activeConn?.power} kW` : activeConn && !activeFree ? 'Connector busy' : 'Pick a connector'}
                    </ThemedText>
                </Pressable>
            </View>

            {/* Tariff and penalty schedule */}
            <Modal visible={tariffOpen} transparent animationType="slide" onRequestClose={() => setTariffOpen(false)}>
                <View style={styles.overlay}>
                    <View style={[styles.tariffSheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.tariffHead}>
                            <ThemedText style={[styles.tariffTitle, { color: colors.text }]}>Tariff & penalty schedule</ThemedText>
                            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setTariffOpen(false)} hitSlop={10}>
                                <X size={22} color={colors.text} />
                            </Pressable>
                        </View>
                        <ThemedText style={[styles.tariffSub, { color: colors.textMuted }]}>{station.name}</ThemedText>
                        {[
                            ['Energy', `₹${minPrice.toFixed(2)} / kWh`],
                            ['GST (CGST 9% + SGST 9%)', '+18%'],
                            ['You pay', `₹${allInPrice(minPrice).toFixed(2)} / kWh`],
                            ['Idle fee grace', '15 min free'],
                            ['Idle fee after that', '₹5 / min'],
                        ].map(([k, v], i) => (
                            <View key={k} style={[styles.tariffRow, { borderTopColor: colors.border }, i === 2 && { borderTopWidth: StyleSheet.hairlineWidth }]}>
                                <ThemedText style={[styles.tariffKey, { color: i === 2 ? colors.text : colors.textMuted, fontWeight: i === 2 ? '700' : '500' }]}>{k}</ThemedText>
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
    container: { flex: 1 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    topRight: { flexDirection: 'row', gap: 8 },
    title: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.6, marginTop: 14 },
    address: { fontSize: 15, fontWeight: '500', marginTop: 4 },
    facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    fact: { height: 30, paddingHorizontal: 12, borderRadius: 15, justifyContent: 'center' },
    factText: { fontSize: 13, fontWeight: '700' },
    photo: { marginTop: 14, height: 168, borderRadius: 24, overflow: 'hidden' },
    dots: { position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 4 },
    dotPager: { height: 6, borderRadius: 3 },
    sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 18, marginBottom: 8, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 20, fontWeight: '800' },
    sectionCount: { fontSize: 13, fontWeight: '600' },
    filters: { gap: 8, paddingBottom: 10 },
    filterChip: { height: 34, paddingHorizontal: 14, borderRadius: 17, justifyContent: 'center' },
    filterText: { fontSize: 13, fontWeight: '700' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { width: '31.9%', borderRadius: 20, padding: 12 },
    chipTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    chipId: { fontSize: 11, fontWeight: '700', flexShrink: 1 },
    chipDot: { width: 8, height: 8, borderRadius: 4 },
    chipPower: { fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -0.5, marginTop: 6 },
    chipUnit: { fontSize: 12, fontWeight: '700' },
    chipMeta: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    empty: { fontSize: 13, textAlign: 'center', paddingVertical: 14 },
    showAll: { alignItems: 'center', paddingVertical: 12 },
    showAllText: { fontSize: 13, fontWeight: '700' },
    panel: { borderRadius: 24, padding: 12, marginTop: 12 },
    here: { borderRadius: 24, padding: 14, marginTop: 4 },
    hereTitle: { fontSize: 16, fontWeight: '800' },
    hereSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
    hereRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
    scanBtn: { height: 48, borderRadius: 24, paddingHorizontal: 16, backgroundColor: '#6DB8F2', flexDirection: 'row', alignItems: 'center', gap: 6 },
    scanBtnText: { fontSize: 14, fontWeight: '800', color: '#0B0B0F' },
    numBox: { flex: 1, height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 4 },
    numInput: { flex: 1, fontSize: 14, fontWeight: '700' },
    goBtn: { height: 40, borderRadius: 20, paddingHorizontal: 16, backgroundColor: '#0B0B0F', justifyContent: 'center' },
    goText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
    hereMsg: { fontSize: 12, fontWeight: '600', marginTop: 8 },
    suggest: { fontSize: 12, fontWeight: '500', marginTop: 10, marginBottom: 2, paddingHorizontal: 4 },
    groupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 6 },
    numTag: { height: 28, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#F5C14D', justifyContent: 'center' },
    numTagText: { fontSize: 14, fontWeight: '800', color: '#0B0B0F' },
    trackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, minWidth: 84, paddingHorizontal: 14, borderRadius: 17 },
    trackText: { fontSize: 13, lineHeight: 17, fontWeight: '800' },
    groupMeta: { fontSize: 12, fontWeight: '600' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    bestPill: { height: 16, paddingHorizontal: 7, borderRadius: 8, backgroundColor: '#F5C14D', alignItems: 'center', justifyContent: 'center' },
    bestText: { fontSize: 9, lineHeight: 11, fontWeight: '800', color: '#0B0B0F', textAlign: 'center', includeFontPadding: false },
    basis: { fontSize: 12, fontWeight: '500', lineHeight: 17 },
    settingsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44, borderRadius: 14, paddingHorizontal: 14, marginTop: 4, marginBottom: 4 },
    settingsBtnText: { fontSize: 14, fontWeight: '700', flex: 1 },
    settings: { borderRadius: 18, padding: 12, marginTop: 6, marginBottom: 4 },
    settingsTitleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    setChip: { height: 34, paddingHorizontal: 14, borderRadius: 17, justifyContent: 'center' },
    setChipText: { fontSize: 13, fontWeight: '700' },
    valueRow: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 16, paddingHorizontal: 14, marginTop: 10 },
    valueInput: { flex: 1, fontSize: 18, fontWeight: '700' },
    unit: { fontSize: 15, fontWeight: '700', marginLeft: 8 },
    settingsHead: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 4 },
    panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 8 },
    panelTitle: { fontSize: 17, fontWeight: '800' },
    panelSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
    notify: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    notifyText: { fontSize: 12, fontWeight: '700' },
    conn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 2, paddingHorizontal: 10, paddingVertical: 10, marginTop: 6 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    connIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    connTitle: { fontSize: 15, fontWeight: '700' },
    connSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 13, fontWeight: '700' },
    setLabel: { fontSize: 13, fontWeight: '600', marginTop: 10, paddingHorizontal: 4 },
    targets: { flexDirection: 'row', gap: 8, marginTop: 8 },
    target: { flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    targetText: { fontSize: 14, fontWeight: '700' },
    note: { fontSize: 12, fontWeight: '500', marginTop: 8, paddingHorizontal: 4 },
    estRow: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
    estItem: { flex: 1, alignItems: 'center' },
    estValue: { fontSize: 16, fontWeight: '800' },
    estLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
    tariffLink: { alignItems: 'center', paddingVertical: 14 },
    tariffLinkText: { fontSize: 13, fontWeight: '600' },
    bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10 },
    startBtn: { flex: 1, height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
    startText: { fontSize: 16, fontWeight: '800' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    tariffSheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
    tariffHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tariffTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    tariffSub: { fontSize: 15, fontWeight: '500', marginTop: 4, marginBottom: 8 },
    tariffRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 },
    tariffKey: { fontSize: 16 },
    tariffVal: { fontSize: 16, fontWeight: '700' },
});
