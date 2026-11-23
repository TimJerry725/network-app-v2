import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, ScrollView, ScrollViewInstance, StyleSheet, TextInputInstance, View, useWindowDimensions } from 'react-native';
import { TextInput } from '../../components/ThemedTextInput';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import {
    Sparkles,
    Mic,
    X,
    Tag,
    CircleCheck,
    CreditCard,
    SlidersHorizontal,
    LocateFixed,
    ArrowUpRight,
    Wifi,
    ShoppingBag,
    User,
    Plug,
    ChevronLeft,
} from '../../components/sf/icons';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';
import { useCharging } from '../../context/ChargingContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useIndiaChargingStations } from '../../hooks/useIndiaChargingStations';
import { Station } from '../../constants/Stations';
import {
    DEFAULT_MAP_FILTERS,
    MapFilterSheet,
    MapFilterState,
    countMapFilters,
    stationMatchesMapFilters,
} from '../../components/MapFilterSheet';
import { DcPinIcon } from '../../components/DcPinIcon';
import { CarPinIcon } from '../../components/CarPinIcon';
import { Ccs2Icon } from '../../components/Ccs2Icon';
import { Type2Icon } from '../../components/Type2Icon';
import { Glass, GlassButton } from '../../components/glass/Glass';
import { DEFAULT_REGION, distanceKm } from '../../utils/geo';
import { allInPrice, formatRupees } from '../../utils/pulse';

type QuickFilter = '' | 'CCS2' | 'Type 2' | 'Available';

const NEARBY_KM = 25;
const NEARBY_MAX = 12;

const DARK_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#14161C' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8E8E93' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0C10' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#242730' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0B0C10' }] },
];

function tap() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/**
 * Home (iOS 27 design): full-screen map, glass search bar with Iris and mic, filter chips,
 * wallet pill, coloured pins, and a glass bottom sheet with the nearby hubs.
 */
export default function MapScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { width: screenW } = useWindowDimensions();
    const { user, selectedVehicle } = useVehicles();
    const { activeSession } = useCharging();
    const { isFavorite } = useFavorites();
    const { stations: allStations, isLoading } = useIndiaChargingStations();

    const mapRef = useRef<MapView>(null);
    const listRef = useRef<ScrollViewInstance>(null);
    const searchRef = useRef<TextInputInstance>(null);
    const [search, setSearch] = useState('');
    const [quick, setQuick] = useState<QuickFilter>('CCS2');
    const [criteria, setCriteria] = useState<MapFilterState>(DEFAULT_MAP_FILTERS);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number } | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;
                const last = await Location.getLastKnownPositionAsync({});
                if (last && mounted) setUserLoc(last.coords);
                const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                if (fix && mounted) setUserLoc(fix.coords);
            } catch {
                // Location is optional
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const stations = useMemo(() => {
        const ref = userLoc ?? DEFAULT_REGION;
        const q = search.trim().toLowerCase();
        const list = allStations
            .filter((s) => {
                if (q && !`${s.name} ${s.address}`.toLowerCase().includes(q)) return false;
                if (!stationMatchesMapFilters(s, criteria)) return false;
                if (quick === 'CCS2' || quick === 'Type 2') return s.connectors.some((c) => c.type === quick);
                if (quick === 'Available') return s.connectors.some((c) => c.status === 'Available');
                return true;
            })
            .map((s) => {
                const d = distanceKm(ref.latitude, ref.longitude, s.latitude, s.longitude);
                return { ...s, distanceKm: Number(d.toFixed(1)), etaMinutes: Math.max(3, Math.round(d * 1.6)) };
            });
        const byDistance = list.sort((a, b) => a.distanceKm - b.distanceKm);
        const close = byDistance.filter((s) => s.distanceKm <= NEARBY_KM);
        const nearby = (close.length && !q ? close : byDistance).slice(0, NEARBY_MAX);
        return nearby;
    }, [allStations, search, criteria, quick, userLoc]);

    const selected = stations.find((s) => s.id === selectedId) ?? stations[0];

    useEffect(() => {
        if (!selected) return;
        mapRef.current?.animateToRegion(
            { latitude: selected.latitude - 0.012, longitude: selected.longitude, latitudeDelta: 0.06, longitudeDelta: 0.06 },
            450
        );
    }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const openStation = (s: Station) => navigation.navigate('StationDetails', { stationId: s.id, stationSnapshot: s });
    const filterCount = countMapFilters(criteria);

    const panelBg = isDark ? 'rgba(44,44,46,0.94)' : 'rgba(255,255,255,0.92)';
    const TILE_W = Math.min(280, screenW - 64);
    const NAV_H = insets.bottom + 16;

    const chips: { id: QuickFilter; label: string; icon: (c: string) => React.ReactNode }[] = [
        { id: 'CCS2', label: 'CCS2', icon: (c) => <Ccs2Icon size={16} color={c} /> },
        { id: 'Type 2', label: 'Type 2', icon: (c) => <Type2Icon size={16} color={c} /> },
        { id: 'Available', label: 'Available', icon: (c) => <CircleCheck size={16} color={quick === 'Available' ? c : colors.success} /> },
    ];

    const pinColor = (s: Station) => {
        if (s.id === selected?.id) return colors.primary;
        return s.connectors.some((c) => c.status === 'Available') ? colors.success : colors.error;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                initialRegion={selected ? { latitude: selected.latitude, longitude: selected.longitude, latitudeDelta: 0.06, longitudeDelta: 0.06 } : DEFAULT_REGION}
                customMapStyle={Platform.OS === 'android' && isDark ? DARK_MAP_STYLE : undefined}
                userInterfaceStyle={isDark ? 'dark' : 'light'}
                showsUserLocation={false}
                showsMyLocationButton={false}
                pitchEnabled={false}
            >
                {stations.map((s) => {
                    const sel = s.id === selected?.id;
                    return (
                        <Marker
                            key={s.id}
                            coordinate={{ latitude: s.latitude, longitude: s.longitude }}
                            anchor={{ x: 0.5, y: 0.95 }}
                            zIndex={sel ? 999 : 1}
                            onPress={() => {
                                tap();
                                setSelectedId(s.id);
                                const i = stations.findIndex((x) => x.id === s.id);
                                listRef.current?.scrollTo({ x: Math.max(0, i * (TILE_W + 10)), animated: true });
                            }}
                        >
                            <DcPinIcon size={sel ? 54 : 42} color={pinColor(s)} iconColor="#FFFFFF" stroke="#FFFFFF" strokeWidth={1.6} />
                        </Marker>
                    );
                })}
                {userLoc ? (
                    <Marker coordinate={userLoc} anchor={{ x: 0.5, y: 0.5 }} zIndex={1000}>
                        <View style={{ width: 52, height: 52 }}>
                            <CarPinIcon size={44} color={colors.primary} />
                        </View>
                    </Marker>
                ) : null}
            </MapView>

            {/* Top: search, chips, wallet */}
            <View style={{ paddingTop: insets.top + 6 }} pointerEvents="box-none">
                <View style={[styles.pad, styles.searchRow]}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={() => navigation.goBack()}>
                        <Glass radius={24} interactive style={styles.avatarBtn}>
                            <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
                        </Glass>
                    </Pressable>
                    <Glass radius={28} style={[styles.search, { flex: 1, backgroundColor: panelBg }]}>
                        <Sparkles size={20} color={colors.primary} strokeWidth={2} />
                        <TextInput
                            ref={searchRef}
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Ask Iris or search stations…"
                            placeholderTextColor={colors.textMuted}
                            returnKeyType="search"
                            style={[styles.searchInput, { color: colors.text }]}
                            accessibilityLabel="Search stations or ask Iris"
                        />
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={search ? 'Clear search' : 'Voice search'}
                            onPress={() => {
                                tap();
                                if (search) setSearch('');
                                else searchRef.current?.focus();
                            }}
                            style={[styles.mic, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(120,120,128,0.14)' }]}
                        >
                            {search ? <X size={18} color={colors.text} /> : <Mic size={20} color={colors.text} />}
                        </Pressable>
                    </Glass>
                </View>

                <View style={[styles.pad, styles.chipRow]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.chips}>
                    {chips.map((c) => {
                        const active = quick === c.id;
                        const fg = active ? '#FFFFFF' : colors.text;
                        return (
                            <Pressable
                                key={c.id}
                                accessibilityRole="button"
                                accessibilityState={{ selected: active }}
                                onPress={() => {
                                    tap();
                                    setQuick((q) => (q === c.id ? '' : c.id));
                                }}
                            >
                                <Glass radius={22} tint={active ? colors.primary : undefined} style={[styles.chip, { backgroundColor: active ? colors.primary : panelBg }]}>
                                    {c.icon(fg)}
                                    <ThemedText style={[styles.chipText, { color: fg }]}>{c.label}</ThemedText>
                                </Glass>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                    <Pressable accessibilityRole="button" accessibilityLabel={`Wallet ${formatRupees(user.walletBalance, 2)}`} onPress={() => navigation.navigate('Wallet')}>
                        <Glass radius={20} style={[styles.wallet, { backgroundColor: panelBg }]}>
                            <CreditCard size={16} color={colors.success} />
                            <ThemedText style={[styles.walletValue, { color: colors.text }]}>{formatRupees(user.walletBalance, 2)}</ThemedText>
                        </Glass>
                    </Pressable>
                </View>
            </View>

            {/* Right-hand glass buttons */}
            <View style={[styles.side, { bottom: NAV_H + 160 }]} pointerEvents="box-none">
                <GlassButton label="Filters" size={44} onPress={() => setSheetOpen(true)} tint={filterCount > 0 ? colors.primary : undefined}>
                    <SlidersHorizontal size={19} color={filterCount > 0 ? '#FFFFFF' : colors.text} />
                </GlassButton>
                <GlassButton
                    label="Center on me"
                    size={44}
                    onPress={() => userLoc && mapRef.current?.animateToRegion({ ...userLoc, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 500)}
                >
                    <LocateFixed size={19} color={colors.text} />
                </GlassButton>
            </View>

            {/* Nearby stations: horizontal tiles */}
            <View style={[styles.strip, { bottom: NAV_H }]} pointerEvents="box-none">
                <View style={styles.stripHead}>
                    <ThemedText style={[styles.sheetTitle, { color: colors.text }]}>
                        {quick === 'CCS2' || quick === 'Type 2' ? `Nearby ${quick === 'CCS2' ? 'DC fast' : 'AC'} hubs` : 'Nearby stations'}
                    </ThemedText>
                    <View style={[styles.live, { backgroundColor: 'rgba(52,199,89,0.16)' }]}>
                        <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                        <ThemedText style={[styles.liveText, { color: colors.success }]}>{stations.length} · {NEARBY_KM} km</ThemedText>
                    </View>
                </View>
                <ScrollView
                    ref={listRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={TILE_W + 10}
                    decelerationRate="fast"
                    contentContainerStyle={styles.list}
                >
                    {stations.length === 0 ? (
                        <View style={[styles.card, { width: TILE_W, backgroundColor: colors.surface, borderColor: 'transparent' }]}>
                            <ThemedText style={[styles.cardName, { color: colors.text }]}>{isLoading ? 'Finding chargers…' : 'No stations match'}</ThemedText>
                            {!isLoading ? <ThemedText style={[styles.cardSub, { color: colors.textMuted }]}>Try another filter or search.</ThemedText> : null}
                        </View>
                    ) : null}
                    {stations.map((s) => {
                        const free = s.connectors.filter((c) => c.status === 'Available').length;
                        const best = [...s.connectors].sort((a, b) => b.power - a.power)[0];
                        const minPrice = Math.min(...s.connectors.map((c) => c.pricePerKWh));
                        const sel = s.id === selected?.id;
                        const fits = selectedVehicle ? s.connectors.some((c) => c.type === selectedVehicle.connectorType) : true;
                        const chipBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(120,120,128,0.14)';
                        return (
                            <Pressable
                                key={s.id}
                                accessibilityRole="button"
                                accessibilityLabel={`${s.name}, ${free} of ${s.connectors.length} available`}
                                onPress={() => {
                                    if (sel) openStation(s);
                                    else {
                                        tap();
                                        setSelectedId(s.id);
                                    }
                                }}
                                style={[styles.card, { width: TILE_W, backgroundColor: colors.surface, borderColor: sel ? colors.primary : 'transparent' }]}
                            >
                                <View style={styles.cardTop}>
                                    <View style={[styles.plugTile, { backgroundColor: 'rgba(0,122,255,0.14)' }]}>
                                        <Plug size={20} color={colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>{s.name}</ThemedText>
                                        <ThemedText style={[styles.cardSub, { color: colors.textMuted }]} numberOfLines={1}>
                                            {s.distanceKm} km · {s.etaMinutes} min · {s.openTime === '24/7' ? '24 hrs' : s.openTime}
                                        </ThemedText>
                                    </View>
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={`Open ${s.name}`}
                                        onPress={() => openStation(s)}
                                        style={[styles.arrow, { backgroundColor: chipBg }]}
                                    >
                                        <ArrowUpRight size={16} color={colors.text} />
                                    </Pressable>
                                </View>
                                <View style={styles.pills}>
                                    <View style={[styles.pill, { backgroundColor: free > 0 ? 'rgba(52,199,89,0.16)' : 'rgba(255,59,48,0.14)' }]}>
                                        <View style={[styles.pillDot, { backgroundColor: free > 0 ? colors.success : colors.error }]} />
                                        <ThemedText style={[styles.pillText, { color: free > 0 ? colors.success : colors.error }]}>{free}/{s.connectors.length}</ThemedText>
                                    </View>
                                    {best ? (
                                        <View style={[styles.pill, { backgroundColor: chipBg }]}>
                                            <ThemedText style={[styles.pillText, { color: colors.text }]}>{best.power} kW {best.currentType ?? (best.power >= 50 ? 'DC' : 'AC')}</ThemedText>
                                        </View>
                                    ) : null}
                                    <View style={[styles.pill, { backgroundColor: chipBg }]}>
                                        <ThemedText style={[styles.pillText, { color: colors.text }]}>₹{allInPrice(minPrice).toFixed(1)}/kWh</ThemedText>
                                    </View>
                                    {!fits ? (
                                        <View style={[styles.pill, { backgroundColor: 'rgba(255,149,0,0.16)' }]}>
                                            <ThemedText style={[styles.pillText, { color: colors.warning }]}>Plug mismatch</ThemedText>
                                        </View>
                                    ) : null}
                                </View>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            <MapFilterSheet visible={sheetOpen} criteria={criteria} onClose={() => setSheetOpen(false)} onApply={(c) => { setCriteria(c); setSheetOpen(false); }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    pad: { paddingHorizontal: 16 },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatarBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18, fontWeight: '800' },
    search: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingRight: 8 },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
    mic: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    chipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    chips: { gap: 8, paddingRight: 4 },
    chip: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
    chipText: { fontSize: 13, fontWeight: '600' },
    wallet: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
    walletValue: { fontSize: 13, fontWeight: '700' },
    side: { position: 'absolute', right: 16, gap: 8 },
    strip: { position: 'absolute', left: 0, right: 0 },
    stripHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
    sheetTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
    live: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 26, paddingHorizontal: 8, borderRadius: 13 },
    liveDot: { width: 6, height: 6, borderRadius: 3 },
    liveText: { fontSize: 12, fontWeight: '700' },
    list: { paddingHorizontal: 16, gap: 8 },
    card: { borderRadius: 22, padding: 12, borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    plugTile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
    cardSub: { fontSize: 12, fontWeight: '500', marginTop: 1.0 },
    arrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 26, paddingHorizontal: 8, borderRadius: 13 },
    pillDot: { width: 6, height: 6, borderRadius: 3 },
    pillText: { fontSize: 12, fontWeight: '600' },
});
