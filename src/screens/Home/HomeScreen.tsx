import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    ScrollViewInstance,
    StyleSheet,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
    Search,
    SlidersHorizontal,
    Map as MapIcon,
    Layers,
    LocateFixed,
    CircleCheck,
    Clock3,
    Coffee,
    X,
    Sparkles,
    MapPinned,
    Star,
    Zap,
} from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';
import { useCharging } from '../../context/ChargingContext';
import { useWallet } from '../../context/WalletContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useIndiaChargingStations } from '../../hooks/useIndiaChargingStations';
import { Station } from '../../constants/Stations';
import { FONT_FAMILIES } from '../../constants/Tokens';
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
import {
    CardChip,
    Chip,
    DeckDots,
    IconBtn,
    SkinCard,
    SKINS,
    SwipeDeck,
    stackStyles,
} from '../../components/stack/StackKit';
import { StationCard } from '../../components/stack/StationCard';
import { Squish } from '../../components/pulse/PulseKit';
import { DEFAULT_REGION, distanceKm, greeting } from '../../utils/geo';
import { allInPrice, formatRupees } from '../../utils/pulse';


type QuickFilter = '' | 'CCS2' | 'Type 2' | 'Available' | '24/7' | 'Amenities';

const CARD_W = 280;
const CARD_GAP = 12;
const NEARBY_KM = 25;
const NEARBY_MAX = 10;

const DARK_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#15151C' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8C8894' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0B0F' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#262630' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0B0B0F' }] },
];

export default function HomeScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { user, selectedVehicle } = useVehicles();
    const { activeSession } = useCharging();
    const { rewardVolts } = useWallet();
    const { isFavorite } = useFavorites();
    const { stations: allStations, isLoading } = useIndiaChargingStations();

    const mapRef = useRef<MapView>(null);
    const carouselRef = useRef<ScrollViewInstance>(null);
    const [mode, setMode] = useState<'deck' | 'map'>('deck');
    const [searchOpen, setSearchOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [quick, setQuick] = useState<QuickFilter>('');
    const [criteria, setCriteria] = useState<MapFilterState>(DEFAULT_MAP_FILTERS);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number } | null>(null);
    const [deckIndex, setDeckIndex] = useState(0);

    // Locate the driver once (same behaviour as before: last known, then fresh fix)
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
                // Location is optional; distances fall back to the default region
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
                if (quick === '24/7') return s.openTime === '24/7';
                if (quick === 'Amenities') return (s.amenities?.length ?? 0) > 0;
                return true;
            })
            .map((s) => {
                const d = distanceKm(ref.latitude, ref.longitude, s.latitude, s.longitude);
                return { ...s, distanceKm: Number(d.toFixed(1)), etaMinutes: Math.max(3, Math.round(d * 1.6)) };
            });
        const freeOf = (s: Station) =>
            s.connectors.filter((c) => c.status === 'Available' && (quick === 'CCS2' || quick === 'Type 2' ? c.type === quick : true)).length;
        // Home shows only nearby stations: within NEARBY_KM, at most NEARBY_MAX.
        // If nothing is that close (or a search is active), fall back to the closest few.
        const byDistance = list.sort((a, b) => a.distanceKm - b.distanceKm);
        const close = byDistance.filter((s) => s.distanceKm <= NEARBY_KM);
        const nearby = (close.length && !q ? close : byDistance).slice(0, NEARBY_MAX);
        return nearby.sort((a, b) => (quick ? freeOf(b) - freeOf(a) : 0) || a.distanceKm - b.distanceKm);
    }, [allStations, search, criteria, quick, userLoc]);

    useEffect(() => {
        if (deckIndex >= stations.length) setDeckIndex(0);
    }, [stations.length, deckIndex]);

    const current = stations[deckIndex];

    // Keep the map in sync with the deck
    useEffect(() => {
        if (mode !== 'map' || !current) return;
        mapRef.current?.animateToRegion(
            { latitude: current.latitude - 0.01, longitude: current.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 },
            450
        );
    }, [mode, current?.id]);

    // Keep the bottom carousel on the selected station (e.g. when a map pin is tapped)
    useEffect(() => {
        if (mode !== 'map') return;
        carouselRef.current?.scrollTo({ x: deckIndex * (CARD_W + CARD_GAP), animated: true });
    }, [deckIndex, mode]);

    const openStation = (s: Station) => navigation.navigate('StationDetails', { stationId: s.id, stationSnapshot: s });

    const filterCount = countMapFilters(criteria);
    const quickChips: { id: QuickFilter; label: string; icon: React.ReactNode }[] = [
        { id: 'CCS2', label: 'CCS2', icon: <Ccs2Icon size={15} color={quick === 'CCS2' ? colors.background : colors.text} /> },
        { id: 'Type 2', label: 'Type 2', icon: <Type2Icon size={15} color={quick === 'Type 2' ? colors.background : colors.text} /> },
        { id: 'Available', label: 'Free now', icon: <CircleCheck size={14} color={quick === 'Available' ? colors.background : colors.text} /> },
        { id: '24/7', label: '24/7', icon: <Clock3 size={14} color={quick === '24/7' ? colors.background : colors.text} /> },
        { id: 'Amenities', label: 'Amenities', icon: <Coffee size={14} color={quick === 'Amenities' ? colors.background : colors.text} /> },
    ];

    const header = (
        <View style={{ paddingHorizontal: 16 }}>
            <View style={styles.topRow}>
                <Squish onPress={() => navigation.navigate('Profile')} accessibilityLabel="Open profile" style={[styles.avatar, { backgroundColor: colors.lime }]}>
                    <ThemedText style={styles.avatarText}>{user.fullName.charAt(0)}</ThemedText>
                </Squish>
                <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.hello, { color: colors.textMuted }]}>{greeting()}</ThemedText>
                    <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                        {user.fullName.split(' ')[0]}
                    </ThemedText>
                </View>
                <IconBtn label="Search stations" active={searchOpen} onPress={() => setSearchOpen((v) => !v)}>
                    <Search size={18} color={searchOpen ? '#0B0B0F' : colors.text} />
                </IconBtn>
                <IconBtn label={mode === 'deck' ? 'Show map' : 'Show cards'} onPress={() => setMode((m) => (m === 'deck' ? 'map' : 'deck'))}>
                    {mode === 'deck' ? <MapIcon size={18} color={colors.text} /> : <Layers size={18} color={colors.text} />}
                </IconBtn>
            </View>

            {searchOpen ? (
                <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Search size={16} color={colors.textMuted} />
                    <TextInput
                        autoFocus
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Station, area or city"
                        placeholderTextColor={colors.textSoft}
                        style={[styles.searchInput, { color: colors.text }]}
                        returnKeyType="search"
                        accessibilityLabel="Search stations"
                    />
                    {search ? (
                        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')} hitSlop={10}>
                            <X size={16} color={colors.textMuted} />
                        </Pressable>
                    ) : null}
                </View>
            ) : null}
        </View>
    );

    const chips = (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip
                label={filterCount ? `Filters · ${filterCount}` : 'Filters'}
                active={filterCount > 0}
                onPress={() => setSheetOpen(true)}
                icon={<SlidersHorizontal size={14} color={filterCount > 0 ? colors.background : colors.text} />}
            />
            {quickChips.map((c) => (
                <Chip key={c.id} label={c.label} icon={c.icon} active={quick === c.id} onPress={() => setQuick((q) => (q === c.id ? '' : c.id))} />
            ))}
        </ScrollView>
    );

    const deck = stations.length ? (
        <>
            <SwipeDeck
                data={stations}
                index={deckIndex}
                onIndexChange={setDeckIndex}
                keyExtractor={(s) => s.id}
                cardHeight={232}
                renderCard={(s) => (
                    <StationCard
                        station={s}
                        isFavorite={isFavorite(s.id)}
                        vehicleConnector={selectedVehicle?.connectorType}
                        onPress={() => openStation(s)}
                    />
                )}
            />
            <DeckDots count={stations.length} index={deckIndex} color={colors.text} />
        </>
    ) : (
        <View style={[styles.empty, { borderColor: colors.border }]}>
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>{isLoading ? 'Finding chargers…' : 'No stations match'}</ThemedText>
            {!isLoading ? (
                <ThemedText style={[styles.emptySub, { color: colors.textMuted }]}>Try removing a filter or searching another area.</ThemedText>
            ) : null}
        </View>
    );


    /* ── MAP MODE ── */
    if (mode === 'map') {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <MapView
                    ref={mapRef}
                    style={StyleSheet.absoluteFill}
                    provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                    initialRegion={current ? { latitude: current.latitude, longitude: current.longitude, latitudeDelta: 0.06, longitudeDelta: 0.06 } : DEFAULT_REGION}
                    customMapStyle={Platform.OS === 'android' && isDark ? DARK_MAP_STYLE : undefined}
                    userInterfaceStyle={isDark ? 'dark' : 'light'}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                >
                    {stations.map((s, i) => {
                        const selected = i === deckIndex;
                        return (
                            <Marker
                                key={s.id}
                                coordinate={{ latitude: s.latitude, longitude: s.longitude }}
                                anchor={{ x: 0.5, y: 0.95 }}
                                zIndex={selected ? 999 : 1}
                                onPress={() => setDeckIndex(i)}
                            >
                                <DcPinIcon
                                    size={selected ? 46 : 34}
                                    color={selected ? '#A996FF' : '#0B0B0F'}
                                    iconColor={selected ? '#0B0B0F' : '#FFFFFF'}
                                    stroke={selected ? '#0B0B0F' : 'rgba(255,255,255,0.5)'}
                                    strokeWidth={1.2}
                                />
                            </Marker>
                        );
                    })}
                    {userLoc ? (
                        <Marker coordinate={userLoc} anchor={{ x: 0.5, y: 0.5 }} zIndex={1000}>
                            <View style={{ width: 52, height: 52 }}>
                                <CarPinIcon size={52} color={colors.primary} />
                            </View>
                        </Marker>
                    ) : null}
                </MapView>

                <View style={{ paddingTop: insets.top + 6 }} pointerEvents="box-none">
                    {header}
                    {chips}
                </View>

                <View style={[styles.mapBottom, { bottom: insets.bottom + 96 }]} pointerEvents="box-none">
                    {/* Floating action on the right (filters are in the top chip row) */}
                    <View style={styles.floatStack} pointerEvents="box-none">
                        <IconBtn
                            label="Center on me"
                            onPress={() =>
                                userLoc &&
                                mapRef.current?.animateToRegion({ ...userLoc, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 500)
                            }
                        >
                            <LocateFixed size={18} color={colors.text} />
                        </IconBtn>
                    </View>

                    {/* Nearby stations down at the bottom */}
                    <View style={[styles.countBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <MapPinned size={14} color={colors.text} />
                        <ThemedText style={[styles.countText, { color: colors.text }]}>
                            {stations.length} {stations.length === 1 ? 'STATION' : 'STATIONS'} NEARBY
                        </ThemedText>
                    </View>

                    {stations.length ? (
                        <ScrollView
                            ref={carouselRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.carouselContent}
                            snapToInterval={CARD_W + CARD_GAP}
                            decelerationRate="fast"
                            onMomentumScrollEnd={(e) => {
                                const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + CARD_GAP));
                                if (idx >= 0 && idx < stations.length && idx !== deckIndex) setDeckIndex(idx);
                            }}
                        >
                            {stations.map((st, i) => {
                                const selected = i === deckIndex;
                                const best = [...st.connectors].sort((x, y) => y.power - x.power)[0];
                                const free = st.connectors.filter((c) => c.status === 'Available').length;
                                const minPrice = Math.min(...st.connectors.map((c) => c.pricePerKWh));
                                return (
                                    <Pressable
                                        key={st.id}
                                        accessibilityRole="button"
                                        accessibilityLabel={`${st.name}, ${free} free`}
                                        onPress={() => {
                                            if (selected) openStation(st);
                                            else setDeckIndex(i);
                                        }}
                                        style={[
                                            styles.stationCard,
                                            { width: CARD_W, backgroundColor: colors.surface, borderColor: selected ? colors.lime : colors.border, borderWidth: selected ? 2 : 1 },
                                        ]}
                                    >
                                        <View style={styles.cardTop}>
                                            <ThemedText style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                                                {st.name}
                                            </ThemedText>
                                            <View style={[styles.freePill, { backgroundColor: free > 0 ? colors.lime : colors.sun }]}>
                                                <ThemedText style={styles.freePillText}>{free > 0 ? `${free} free` : 'Busy'}</ThemedText>
                                            </View>
                                        </View>
                                        <ThemedText style={[styles.cardAddr, { color: colors.textMuted }]} numberOfLines={1}>
                                            {st.address}
                                        </ThemedText>
                                        <View style={styles.cardMeta}>
                                            <ThemedText style={[styles.cardMetaText, { color: colors.textMuted }]}>
                                                {st.distanceKm} km • {st.etaMinutes} min
                                            </ThemedText>
                                            <Star size={11} color={colors.sun} fill={colors.sun} />
                                            <ThemedText style={[styles.cardMetaText, { color: colors.textMuted }]}>{st.rating.toFixed(1)}</ThemedText>
                                        </View>
                                        <View style={styles.cardMeta}>
                                            {best ? (
                                                <View style={[styles.powerChip, { backgroundColor: colors.surfaceMuted }]}>
                                                    <Zap size={11} color={colors.text} fill={colors.text} />
                                                    <ThemedText style={[styles.cardMetaText, { color: colors.text, fontFamily: FONT_FAMILIES.bold }]}>
                                                        {best.type} {best.power}kW
                                                    </ThemedText>
                                                </View>
                                            ) : null}
                                            <ThemedText style={[styles.cardMetaText, { color: colors.textMuted }]}>
                                                ₹{allInPrice(minPrice).toFixed(0)}/kWh all-in
                                            </ThemedText>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    ) : (
                        <View style={[styles.emptyMap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>{isLoading ? 'Finding chargers…' : 'No stations match'}</ThemedText>
                        </View>
                    )}
                </View>

                <MapFilterSheet visible={sheetOpen} criteria={criteria} onClose={() => setSheetOpen(false)} onApply={(c) => { setCriteria(c); setSheetOpen(false); }} />
            </View>
        );
    }

    /* ── DECK MODE ── */
    // Wallet card fills the row; when charging, the live card sits beside it and the row scrolls
    const miniW = activeSession ? Math.min(300, width * 0.72) : width - 32;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + 120 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {header}

                {/* Top row: live charge (while charging) and wallet */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={miniW + 10}
                    decelerationRate="fast"
                    contentContainerStyle={styles.walletRow}
                >
                    {activeSession ? (
                        <SkinCard
                            skin="lime"
                            style={[styles.mini, { width: miniW }]}
                            onPress={() =>
                                navigation.navigate('ChargingSession', {
                                    stationId: activeSession.stationId,
                                    connectorId: activeSession.connectorId,
                                })
                            }
                            accessibilityLabel="Open live charge"
                        >
                            <View style={stackStyles.cardPad}>
                                <View style={stackStyles.cardTopRow}>
                                    <ThemedText style={[styles.miniLabel, { color: SKINS.lime.sub }]}>CHARGING NOW</ThemedText>
                                    <View style={styles.liveDot} />
                                </View>
                                <ThemedText style={[stackStyles.bigNumber, { color: '#0B0B0F', marginTop: 6 }]}>
                                    {Math.round(activeSession.currentSoc)}%
                                </ThemedText>
                                <ThemedText style={[stackStyles.cardSub, { color: SKINS.lime.sub }]} numberOfLines={1}>
                                    {formatRupees(activeSession.totalCost, 0)} · {activeSession.energyDeliveredKwh} kWh · {activeSession.stationName}
                                </ThemedText>
                            </View>
                        </SkinCard>
                    ) : null}

                    <SkinCard skin="violet" style={[styles.mini, { width: miniW }]} onPress={() => navigation.navigate('Wallet')} accessibilityLabel="Open wallet">
                        <View style={stackStyles.cardPad}>
                            <View style={stackStyles.cardTopRow}>
                                <CardChip />
                                <ThemedText style={[styles.miniLabel, { color: SKINS.violet.sub }]}>IRIS PASS</ThemedText>
                            </View>
                            <ThemedText style={[stackStyles.bigNumber, { color: '#FFFFFF', marginTop: 8, fontSize: 32 }]}>
                                {formatRupees(user.walletBalance, 0)}
                            </ThemedText>
                            <View style={styles.rowGap}>
                                <Sparkles size={12} color="#FFFFFF" />
                                <ThemedText style={[stackStyles.cardSub, { color: SKINS.violet.sub }]} numberOfLines={1}>
                                    {rewardVolts.toLocaleString('en-IN')} Volts
                                </ThemedText>
                            </View>
                        </View>
                    </SkinCard>


                </ScrollView>

                <View style={styles.sectionRow}>
                    <ThemedText style={[stackStyles.sectionLabel, { color: colors.textMuted }]}>Near you · {stations.length}</ThemedText>
                    {current ? (
                        <ThemedText style={[styles.sectionHint, { color: colors.textMuted }]}>
                            swipe cards · from ₹{allInPrice(Math.min(...current.connectors.map((c) => c.pricePerKWh))).toFixed(0)}/kWh here
                        </ThemedText>
                    ) : null}
                </View>
                {chips}

                <View style={{ paddingHorizontal: 16, marginTop: 6 }}>
                    {deck}
                </View>

            </ScrollView>

            <MapFilterSheet visible={sheetOpen} criteria={criteria} onClose={() => setSheetOpen(false)} onApply={(c) => { setCriteria(c); setSheetOpen(false); }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 20, color: '#0B0B0F' },
    hello: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13 },
    name: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 24, letterSpacing: -0.8, lineHeight: 29 },
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 48,
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 14,
        marginTop: 12,
    },
    searchInput: { flex: 1, fontFamily: FONT_FAMILIES.semiBold, fontSize: 15 },
    walletRow: { paddingHorizontal: 16, gap: 10, paddingTop: 16 },
    mini: { height: 150, flex: 0 },
    miniLabel: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 10.5, letterSpacing: 1.3 },
    liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0B0B0F' },
    rowGap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 24 },
    sectionHint: { fontFamily: FONT_FAMILIES.medium, fontSize: 11.5 },
    chips: { paddingHorizontal: 16, gap: 8, paddingVertical: 12 },
    empty: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 26, padding: 28, alignItems: 'center' },
    emptyTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 18 },
    emptySub: { fontFamily: FONT_FAMILIES.medium, fontSize: 13, marginTop: 4, textAlign: 'center' },
    mapBottom: { position: 'absolute', left: 0, right: 0 },
    floatStack: { position: 'absolute', right: 16, bottom: 196, gap: 10, alignItems: 'center' },
    countBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        marginLeft: 16,
        marginBottom: 10,
        paddingHorizontal: 12,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
    },
    countText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 11.5, letterSpacing: 0.8 },
    carouselContent: { paddingHorizontal: 16, gap: CARD_GAP },
    stationCard: { borderRadius: 24, padding: 14, minHeight: 150 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardName: { flex: 1, fontFamily: FONT_FAMILIES.extraBold, fontSize: 16, letterSpacing: -0.3 },
    freePill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
    freePillText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 11, color: '#0B0B0F' },
    cardAddr: { fontFamily: FONT_FAMILIES.medium, fontSize: 12, marginTop: 2 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    cardMetaText: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 12 },
    powerChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9 },
    emptyMap: { marginHorizontal: 16, borderRadius: 22, borderWidth: 1, padding: 22, alignItems: 'center' },
});
