import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Sparkles, Mic, Zap, ArrowUpRight, Plus, Route, Heart, History, ChevronDown, ChevronUp } from '../../components/sf/icons';
import { ThemedText } from '../../components/ThemedText';
import { Tile, Eyebrow, BigNumber, IconDot, Pill, useBento } from '../../components/bento/Bento';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';
import { useCharging } from '../../context/ChargingContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useSavedTrips } from '../../context/SavedTripsContext';
import { useIndiaChargingStations } from '../../hooks/useIndiaChargingStations';
import { DEFAULT_REGION, distanceKm, greeting } from '../../utils/geo';
import { formatRupees } from '../../utils/pulse';

const NEAR_KM = 5;
const FALLBACK_KM = 25;

/** Home (neo-bento): one calm grid of pastel tiles. Each tile answers one question. */
export default function HomeScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { user } = useVehicles();
    const { activeSession, sessionHistory } = useCharging();
    const { favoriteIds } = useFavorites() as any;
    const { savedTrips } = useSavedTrips();
    const { stations: all } = useIndiaChargingStations();
    const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number } | null>(null);
    const mapRef = useRef<MapView>(null);
    const [fastOpen, setFastOpen] = useState(false);
    const toggleFast = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFastOpen((v) => !v);
    };

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
                // optional
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const ref = userLoc ?? DEFAULT_REGION;
    const withDistance = useMemo(
        () =>
            all
                .map((s) => ({ ...s, dist: distanceKm(ref.latitude, ref.longitude, s.latitude, s.longitude) }))
                .sort((a, b) => a.dist - b.dist),
        [all, ref.latitude, ref.longitude]
    );
    const radius = withDistance.some((s) => s.dist <= NEAR_KM) ? NEAR_KM : FALLBACK_KM;
    const nearby = withDistance.filter((s) => s.dist <= radius);
    const fastAll = withDistance.filter((s) => s.connectors.some((c) => c.power >= 50));
    const fastList = (fastAll.length >= 5 ? fastAll : withDistance).slice(0, 5);

    const blue = useBento('blue');
    const ink = useBento('ink');
    const gap = 8;
    const favCount = Array.isArray(favoriteIds) ? favoriteIds.length : 0;
    useEffect(() => {
        const pts = (fastOpen ? fastList : fastList.slice(0, 1)).map((f) => ({ latitude: f.latitude, longitude: f.longitude }));
        if (!pts.length) return;
        mapRef.current?.fitToCoordinates([...pts, { latitude: ref.latitude, longitude: ref.longitude }], {
            edgePadding: { top: 30, right: 30, bottom: 30, left: 30 },
            animated: true,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fastOpen, fastList.map((f) => f.id).join(',')]);
    const openMap = () => navigation.navigate('NearbyMap');
    const initial = (user.fullName || 'U').charAt(0).toUpperCase();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={{ paddingTop: insets.top + 4, paddingHorizontal: 12, paddingBottom: insets.bottom + 96 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <ThemedText style={[styles.hello, { color: colors.textMuted }]}>{greeting()}</ThemedText>
                        <ThemedText style={[styles.title, { color: colors.text }]}>Where to charge?</ThemedText>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => navigation.navigate('Profile')} style={[styles.avatar, { backgroundColor: isDark ? '#FFFFFF' : '#0B0B0F' }]}>
                        <ThemedText style={[styles.avatarText, { color: isDark ? '#0B0B0F' : '#FFFFFF' }]}>{initial}</ThemedText>
                    </Pressable>
                </View>

                {/* Search */}
                <Pressable accessibilityRole="search" accessibilityLabel="Ask Iris or search stations" onPress={openMap} style={[styles.search, { backgroundColor: colors.surface }]}>
                    <Sparkles size={18} color={colors.primary} />
                    <ThemedText style={[styles.searchText, { color: colors.textMuted }]} numberOfLines={1}>
                        Ask Iris or search stations…
                    </ThemedText>
                    <View style={[styles.mic, { backgroundColor: colors.background }]}>
                        <Mic size={16} color={colors.text} />
                    </View>
                </Pressable>

                {/* Nearest fast chargers: collapsed = the closest one beside wallet/trips; expanded = full-width list of five */}
                {(() => {
                    const walletTile = (
                        <Tile tone="coral" style={{ flex: 1 }} onPress={() => navigation.navigate('Wallet')} label="Wallet">
                            <Eyebrow tone="coral">WALLET</Eyebrow>
                            <ThemedText style={[styles.walletAmount, { color: '#FFFFFF' }]} numberOfLines={1} adjustsFontSizeToFit>
                                {formatRupees(user.walletBalance, 0)}
                            </ThemedText>
                            <Pill tone="coral" onPress={() => navigation.navigate('Wallet', { focusTopUp: true })} style={{ marginTop: 6 }}>
                                <Plus size={13} color="#FFFFFF" />
                                <ThemedText style={styles.pillText}>Top up</ThemedText>
                            </Pill>
                        </Tile>
                    );
                    const tripTile = (
                        <Tile tone="lilac" style={{ flex: 1 }} onPress={() => navigation.navigate('Main', { screen: 'Explore' })} label="Plan a trip">
                            <IconDot tone="lilac" size={40}>
                                <Route size={18} color="#0B0B0F" />
                            </IconDot>
                            <ThemedText style={[styles.planTitle, { color: '#0B0B0F', marginTop: 6 }]} numberOfLines={1}>Plan a trip</ThemedText>
                            <ThemedText style={[styles.planSub, { color: 'rgba(11,11,15,0.62)' }]} numberOfLines={1}>
                                {savedTrips.length ? `${savedTrips.length} saved` : 'Charge on the way'}
                            </ThemedText>
                        </Tile>
                    );
                    const head = (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ expanded: fastOpen }}
                            accessibilityLabel={fastOpen ? 'Collapse nearest fast chargers' : 'Expand to see 5 nearest fast chargers'}
                            onPress={toggleFast}
                            style={[styles.sideHead, fastOpen && { padding: 14, paddingBottom: 10 }]}
                        >
                            <IconDot tone="blue" size={fastOpen ? 40 : 36}>
                                <Zap size={16} color={blue.fg} fill={blue.fg} />
                            </IconDot>
                            {fastOpen ? (
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Eyebrow tone="blue">NEAREST FAST CHARGERS</Eyebrow>
                                    <ThemedText style={[styles.tileTitle, { color: blue.fg, marginTop: 0 }]}>
                                        {fastList.length} within {fastList.length ? Math.ceil(fastList[fastList.length - 1].dist) : 0} km
                                    </ThemedText>
                                </View>
                            ) : null}
                            <IconDot tone="ink" size={32}>
                                {fastOpen ? <ChevronUp size={15} color="#FFFFFF" /> : <ChevronDown size={15} color="#FFFFFF" />}
                            </IconDot>
                        </Pressable>
                    );

                    if (!fastOpen) {
                        return (
                            <View style={[styles.row, { gap, alignItems: 'stretch' }]}>
                                <Tile tone="blue" padded={false} style={{ flex: 1.15 }}>
                                    {head}
                                    <View style={styles.sideBody}>
                                        <Eyebrow tone="blue">NEAREST FAST CHARGER</Eyebrow>
                                        <ThemedText style={[styles.tileTitle, { color: blue.fg }]} numberOfLines={2}>
                                            {fastList[0]?.name ?? 'Finding chargers…'}
                                        </ThemedText>
                                        {fastList[0] ? (
                                            <ThemedText style={[styles.tileSub, { color: blue.sub }]}>
                                                {fastList[0].dist.toFixed(1)} km · {Math.max(3, Math.round(fastList[0].dist * 1.6))} min
                                            </ThemedText>
                                        ) : null}
                                        <View style={{ marginTop: 2 }}>
                                            <BigNumber tone="blue" unit="kW" size={36}>
                                                {fastList[0] ? [...fastList[0].connectors].sort((x, y) => y.power - x.power)[0]?.power ?? '—' : '—'}
                                            </BigNumber>
                                        </View>
                                        <ThemedText style={[styles.hint, { color: blue.sub }]}>Tap for 5 nearest</ThemedText>
                                    </View>
                                </Tile>
                                <View style={{ flex: 1, gap }}>
                                    {walletTile}
                                    {tripTile}
                                </View>
                            </View>
                        );
                    }
                    return (
                        <>
                            <Tile tone="blue" padded={false}>
                                {head}
                                <View style={styles.fastList}>
                                    {fastList.map((st, i) => {
                                        const best = [...st.connectors].sort((x, y) => y.power - x.power)[0];
                                        const free = st.connectors.filter((c) => c.status === 'Available').length;
                                        const total = st.connectors.length;
                                        return (
                                            <Pressable
                                                key={st.id}
                                                accessibilityRole="button"
                                                accessibilityLabel={`${st.name}, ${st.dist.toFixed(1)} kilometres, ${best?.power ?? 0} kilowatt, ${free} of ${total} free`}
                                                onPress={() => navigation.navigate('StationDetails', { stationId: st.id, stationSnapshot: st })}
                                                style={({ pressed }) => [styles.fastCard, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
                                            >
                                                <View style={styles.rank}>
                                                    <ThemedText style={styles.rankText}>{i + 1}</ThemedText>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <ThemedText style={[styles.fastName, { color: colors.text }]} numberOfLines={1}>{st.name}</ThemedText>
                                                    <ThemedText style={[styles.fastSub, { color: colors.textMuted }]} numberOfLines={1}>
                                                        {st.dist.toFixed(1)} km · {Math.max(3, Math.round(st.dist * 1.6))} min
                                                    </ThemedText>
                                                </View>
                                                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                                    <View style={styles.kwPill}>
                                                        <ThemedText style={styles.kwText}>{best?.power ?? '—'} kW</ThemedText>
                                                    </View>
                                                    <View style={styles.freeRow}>
                                                        <View style={[styles.freeDot, { backgroundColor: free > 0 ? '#2E9E68' : '#EE6C58' }]} />
                                                        <ThemedText style={[styles.freeText, { color: free > 0 ? '#2E9E68' : '#EE6C58' }]}>{free}/{total} free</ThemedText>
                                                    </View>
                                                </View>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </Tile>
                            <View style={[styles.row, { gap, marginTop: gap }]}>
                                {walletTile}
                                {tripTile}
                            </View>
                        </>
                    );
                })()}

                {/* Around you: full-width map that follows the chargers list */}
                <Tile tone="white" padded={false} style={{ marginTop: gap }} onPress={openMap} label="Open map">
                    <View style={styles.aroundHead}>
                        <View style={{ flex: 1 }}>
                            <Eyebrow tone="white">AROUND YOU</Eyebrow>
                            <ThemedText style={[styles.tileTitle, { color: colors.text }]}>
                                {nearby.length} station{nearby.length === 1 ? '' : 's'} within {radius} km
                            </ThemedText>
                        </View>
                        <IconDot tone="white" size={40}>
                            <ArrowUpRight size={18} color={colors.text} />
                        </IconDot>
                    </View>
                    <View style={styles.mapWrap} pointerEvents="none">
                        <MapView
                            ref={mapRef}
                            style={StyleSheet.absoluteFill}
                            provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                            initialRegion={{ latitude: ref.latitude, longitude: ref.longitude, latitudeDelta: radius * 0.02, longitudeDelta: radius * 0.02 }}
                            scrollEnabled={false}
                            zoomEnabled={false}
                            rotateEnabled={false}
                            pitchEnabled={false}
                            userInterfaceStyle={isDark ? 'dark' : 'light'}
                            showsUserLocation={false}
                            toolbarEnabled={false}
                        >
                            {nearby
                                .filter((s) => !fastList.some((f) => f.id === s.id))
                                .slice(0, 10)
                                .map((s) => (
                                    <Marker key={s.id} coordinate={{ latitude: s.latitude, longitude: s.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
                                        <View style={[styles.mapDot, { backgroundColor: '#B8BDC7' }]} />
                                    </Marker>
                                ))}
                            {fastList.slice(0, fastOpen ? 5 : 1).map((s, i) => (
                                <Marker key={`f-${s.id}`} coordinate={{ latitude: s.latitude, longitude: s.longitude }} anchor={{ x: 0.5, y: 0.5 }} zIndex={10}>
                                    <View style={[styles.rankPin, { backgroundColor: i === 0 ? '#6DB8F2' : '#0B0B0F' }]}>
                                        <ThemedText style={[styles.rankPinText, { color: i === 0 ? '#0B0B0F' : '#FFFFFF' }]}>{i + 1}</ThemedText>
                                    </View>
                                </Marker>
                            ))}
                            <Marker coordinate={{ latitude: ref.latitude, longitude: ref.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
                                <View style={[styles.mapDot, styles.me]} />
                            </Marker>
                        </MapView>
                    </View>
                </Tile>

                {/* Live charge */}
                {activeSession ? (
                    <Tile
                        tone="ink"
                        style={{ marginTop: gap }}
                        onPress={() => navigation.navigate('ChargingSession', { stationId: activeSession.stationId, connectorId: activeSession.connectorId })}
                        label="Open live charge"
                    >
                        <View style={styles.liveRow}>
                            <IconDot tone="ink" size={44}>
                                <Zap size={20} color={ink.fg} fill={ink.fg} />
                            </IconDot>
                            <View style={{ flex: 1 }}>
                                <Eyebrow tone="ink">CHARGING NOW</Eyebrow>
                                <ThemedText style={[styles.tileTitle, { color: ink.fg }]} numberOfLines={1}>
                                    {activeSession.stationName}
                                </ThemedText>
                            </View>
                            <ThemedText style={[styles.livePct, { color: ink.fg }]}>{Math.round(activeSession.currentSoc)}%</ThemedText>
                        </View>
                    </Tile>
                ) : null}

                {/* Row: plan a trip + favourites */}
                <View style={[styles.row, { gap, marginTop: gap }]}>
                    <Tile tone="white" style={{ flex: 1 }} onPress={() => navigation.navigate('Main', { screen: 'Vehicles' })} label="Sessions">
                        <View style={styles.planRow}>
                            <IconDot tone="mint" size={40}>
                                <History size={18} color="#52BE89" />
                            </IconDot>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={[styles.planTitle, { color: colors.text }]}>Sessions</ThemedText>
                                <ThemedText style={[styles.planSub, { color: colors.textMuted }]} numberOfLines={1}>
                                    {sessionHistory.length ? `${sessionHistory.length} charges` : 'Your history'}
                                </ThemedText>
                            </View>
                        </View>
                    </Tile>
                    <Tile tone="ink" style={{ flex: 1 }} onPress={() => navigation.navigate('Main', { screen: 'Favorite' })} label="Favourites">
                        <View style={styles.planRow}>
                            <IconDot tone="coral" size={40}>
                                <Heart size={18} color="#EE6C58" fill="#EE6C58" />
                            </IconDot>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={[styles.planTitle, { color: '#FFFFFF' }]}>Favourites</ThemedText>
                                <ThemedText style={[styles.planSub, { color: 'rgba(255,255,255,0.65)' }]} numberOfLines={1}>
                                    {favCount ? `${favCount} saved` : 'Save your spots'}
                                </ThemedText>
                            </View>
                        </View>
                    </Tile>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    hello: { fontSize: 13, fontWeight: '600' },
    title: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.8 },
    avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18, fontWeight: '800' },
    search: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 48, borderRadius: 24, paddingLeft: 16, paddingRight: 6, marginTop: 8, marginBottom: 8 },
    searchText: { flex: 1, fontSize: 15, fontWeight: '500' },
    mic: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    row: { flexDirection: 'row' },
    fastHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 10 },
    fastList: { gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
    fastRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, paddingHorizontal: 12, height: 60 },
    rank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#0B0B0F', alignItems: 'center', justifyContent: 'center' },
    rankText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
    fastName: { fontSize: 15, fontWeight: '800', color: '#0B0B0F' },
    fastSub: { fontSize: 12, fontWeight: '600', color: 'rgba(11,11,15,0.62)', marginTop: 1 },
    kwPill: { height: 28, paddingHorizontal: 12, borderRadius: 14, justifyContent: 'center', backgroundColor: '#0B0B0F' },
    kwText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
    sideHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, paddingBottom: 0 },
    fastCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 10 },
    freeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    freeText: { fontSize: 11, fontWeight: '700' },
    sideBody: { padding: 12, paddingTop: 6 },
    hint: { fontSize: 11, fontWeight: '700', marginTop: 4 },
    miniRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 8, height: 42 },
    miniName: { fontSize: 13, fontWeight: '800', color: '#0B0B0F' },
    miniSub: { fontSize: 11, fontWeight: '600', color: 'rgba(11,11,15,0.62)', marginTop: 1 },
    freeDot: { width: 8, height: 8, borderRadius: 4 },
    mapBadge: { position: 'absolute', left: 10, top: 10, right: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 32, paddingHorizontal: 12, borderRadius: 16 },
    mapBadgeText: { fontSize: 12, fontWeight: '800' },
    tileTop: { flexDirection: 'row', justifyContent: 'space-between' },
    tileTitle: { fontSize: 18, lineHeight: 23, fontWeight: '800', letterSpacing: -0.3, marginTop: 4 },
    tileSub: { fontSize: 13, fontWeight: '500', marginTop: 2 },
    walletAmount: { fontSize: 24, lineHeight: 28, fontWeight: '800', letterSpacing: -0.6, marginTop: 2 },
    pillText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
    freeNumber: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.6, color: '#FFFFFF', marginTop: 6 },
    liveRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    livePct: { fontSize: 28, fontWeight: '800' },
    aroundHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingBottom: 8 },
    mapWrap: { height: 220, marginHorizontal: 8, marginBottom: 8, borderRadius: 20, overflow: 'hidden' },
    rankPin: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    rankPinText: { fontSize: 12, fontWeight: '800' },
    mapDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#FFFFFF' },
    me: { backgroundColor: '#2F8CF0', width: 18, height: 18, borderRadius: 9 },
    planRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    planTitle: { fontSize: 15, fontWeight: '800' },
    planSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
});
