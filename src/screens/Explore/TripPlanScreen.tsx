import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Linking,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    useWindowDimensions,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    Bookmark,
    BookmarkCheck,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronUp,
    Flag,
    Navigation,
    Plus,
    RotateCcw,
    Route as RouteIcon,
    SlidersHorizontal,
    Zap,
} from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles, Vehicle } from '../../context/VehicleContext';
import { useSavedTrips } from '../../context/SavedTripsContext';
import { TRIP_LOCATIONS, TripLocation, TripPlan, TripStop, createTripPlan } from '../../constants/TripPlanner';
import { FONT_FAMILIES } from '../../constants/Tokens';
import { DEFAULT_MAP_FILTERS, MapFilterSheet, MapFilterState, countMapFilters, stationMatchesMapFilters } from '../../components/MapFilterSheet';
import { tripPlannerService } from '../../services/api/tripPlannerService';
import { buildRouteOptionCoordinates, getRouteCorridorNames } from '../../utils/tripRoutes';
import { PulseButton } from '../../components/pulse/PulseKit';
import { CardField, SkinCard, SKINS, CardSkin } from '../../components/stack/StackKit';
import { formatRupees } from '../../utils/pulse';

type RouteOption = {
    id: string;
    name: string;
    tag: 'Fastest' | 'Route 2' | 'Route 3';
    distanceKm: number;
    driveMinutes: number;
    stopsCount: number;
    energyKWh: number;
    arrivalSocPercent: number;
    viaDescription: string;
    coordinates: { latitude: number; longitude: number }[];
    plan: TripPlan;
};

const VIOLET = '#7B5CFF';
const SOFT = '#A996FF';
const INK = '#0B0B0F';

function tap(s: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
    if (Platform.OS !== 'web') Haptics.impactAsync(s).catch(() => {});
}

function fmtDur(mins: number) {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return h > 0 ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
}

/**
 * Trip page (opens from the Trips planner).
 * Full-screen map, floating top bar, and the draggable bottom sheet:
 * summary header, route options, KPI tiles, chargers along the route, journey itinerary, start navigation.
 */
export default function TripPlanScreen({ navigation, route: navRoute }: any) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { height: screenH } = useWindowDimensions();
    const { vehicles, selectedVehicle } = useVehicles();
    const { addTrip, isTripSaved } = useSavedTrips();
    const mapRef = useRef<MapView>(null);

    const p = navRoute?.params ?? {};
    const originId: string = p.originId ?? 'coimbatore';
    const destinationId: string = p.destinationId ?? 'bengaluru';
    const arriveSoc: number = p.arriveSoc ?? 20;

    const baseVehicle: Vehicle =
        vehicles.find((v) => v.id === p.vehId) ??
        selectedVehicle ??
        vehicles[0] ??
        ({
            id: 'fallback-v1', nickname: 'Primary EV', make: 'Hyundai', model: 'IONIQ 5', year: '2024',
            registrationNumber: 'TN 38 EV 0001', connectorType: 'CCS2', batteryCapacity: 72.6, maxDcRateKw: 220,
            currentBattery: 65, estRangeKm: 350, chargeTarget: 85, autochargeEnabled: true, perks: [],
        } as Vehicle);
    const vehicle: Vehicle = useMemo(
        () => ({ ...baseVehicle, estRangeKm: p.rangeKm ?? baseVehicle.estRangeKm, currentBattery: p.leaveSoc ?? baseVehicle.currentBattery }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [baseVehicle.id, p.rangeKm, p.leaveSoc]
    );

    const [routeId, setRouteId] = useState('route-fastest');
    const [extraStops, setExtraStops] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [filters, setFilters] = useState<MapFilterState>(DEFAULT_MAP_FILTERS);
    const [showFilters, setShowFilters] = useState(false);
    const [showRouteOptions, setShowRouteOptions] = useState(false);
    const [showChargers, setShowChargers] = useState(false);

    const origin: TripLocation = useMemo(() => TRIP_LOCATIONS.find((l) => l.id === originId) ?? TRIP_LOCATIONS[0], [originId]);
    const destination: TripLocation = useMemo(() => TRIP_LOCATIONS.find((l) => l.id === destinationId) ?? TRIP_LOCATIONS[1], [destinationId]);
    const saved = isTripSaved(originId, destinationId);

    const mk = (focus: 'Fastest' | 'Comfort' | 'Budget') =>
        createTripPlan({ originId, destinationId, vehicle, focus, departureTimeMinutes: 9 * 60 + 30, targetArrivalSoc: arriveSoc });
    const fastest = useMemo(() => mk('Fastest'), [originId, destinationId, vehicle, arriveSoc]); // eslint-disable-line react-hooks/exhaustive-deps
    const scenic = useMemo(() => mk('Comfort'), [originId, destinationId, vehicle, arriveSoc]); // eslint-disable-line react-hooks/exhaustive-deps
    const eco = useMemo(() => mk('Budget'), [originId, destinationId, vehicle, arriveSoc]); // eslint-disable-line react-hooks/exhaustive-deps
    const corridors = useMemo(() => getRouteCorridorNames(originId, destinationId), [originId, destinationId]);

    const routes: RouteOption[] = useMemo(
        () => [
            { id: 'route-fastest', name: corridors[0], tag: 'Fastest', distanceKm: fastest.totalDistanceKm, driveMinutes: fastest.driveMinutes, stopsCount: fastest.stops.length, energyKWh: fastest.energyNeededKWh, arrivalSocPercent: fastest.arrivalBatteryPercent, viaDescription: 'Fastest corridor with high-power highway chargers', coordinates: fastest.routeCoordinates, plan: fastest },
            { id: 'route-scenic', name: corridors[1], tag: 'Route 2', distanceKm: Math.round(fastest.totalDistanceKm * 1.06), driveMinutes: Math.round(fastest.driveMinutes * 1.11), stopsCount: Math.max(1, scenic.stops.length), energyKWh: Math.round(fastest.energyNeededKWh * 1.05 * 10) / 10, arrivalSocPercent: Math.max(10, fastest.arrivalBatteryPercent - 4), viaDescription: 'Alternate route with rest plazas along the way', coordinates: buildRouteOptionCoordinates(origin, destination, scenic.stops, 'scenic'), plan: scenic },
            { id: 'route-eco', name: corridors[2], tag: 'Route 3', distanceKm: Math.round(fastest.totalDistanceKm * 1.02), driveMinutes: Math.round(fastest.driveMinutes * 1.04), stopsCount: Math.max(1, eco.stops.length), energyKWh: Math.round(fastest.energyNeededKWh * 0.94 * 10) / 10, arrivalSocPercent: Math.min(95, fastest.arrivalBatteryPercent + 3), viaDescription: 'Alternate route with lower battery consumption', coordinates: buildRouteOptionCoordinates(origin, destination, eco.stops, 'eco'), plan: eco },
        ],
        [fastest, scenic, eco, corridors, origin, destination]
    );
    const route = routes.find((r) => r.id === routeId) ?? routes[0];
    const plan: TripPlan = useMemo(
        () => ({ ...route.plan, totalDistanceKm: route.distanceKm, driveMinutes: route.driveMinutes, energyNeededKWh: route.energyKWh, arrivalBatteryPercent: route.arrivalSocPercent, routeCoordinates: route.coordinates }),
        [route]
    );
    const recommended = useMemo(() => plan.recommendedStations.filter((r) => stationMatchesMapFilters(r.station, filters)), [plan.recommendedStations, filters]);

    const stops: TripStop[] = useMemo(() => {
        const base = [...plan.stops];
        const ids = new Set(base.map((s) => s.station.id));
        extraStops.forEach((id) => {
            if (ids.has(id)) return;
            const rec = plan.recommendedStations.find((r) => r.station.id === id);
            if (!rec) return;
            const chargeMins = Math.max(18, Math.round(((80 - Math.min(rec.arrivalBatteryPercent, 65)) / 100) * vehicle.batteryCapacity * (60 / Math.max(rec.connector.power * 0.78, 30))));
            const addedKWh = Math.max(12, Math.round(((80 - Math.min(rec.arrivalBatteryPercent, 65)) / 100) * vehicle.batteryCapacity));
            base.push({
                ...rec,
                distanceFromPreviousKm: rec.distanceFromOriginKm,
                departureBatteryPercent: Math.max(80, rec.arrivalBatteryPercent + 20),
                chargeMinutes: chargeMins,
                queueMinutes: rec.predictedWaitMinutes,
                totalStopMinutes: chargeMins + rec.predictedWaitMinutes,
                departureTimeMinutes: rec.arrivalTimeMinutes + chargeMins,
                departureTimeLabel: rec.arrivalTimeLabel,
                addedEnergyKWh: addedKWh,
                chargeCost: Math.round(addedKWh * rec.connector.pricePerKWh),
            });
            ids.add(id);
        });
        return base.sort((a, b) => a.distanceFromOriginKm - b.distanceFromOriginKm);
    }, [plan, extraStops, vehicle.batteryCapacity]);

    const chargeMins = stops.reduce((s, x) => s + x.chargeMinutes, 0);
    const filterCount = countMapFilters(filters);
    const usableRange = Math.round((vehicle.estRangeKm * vehicle.currentBattery) / 100);

    /* ── Draggable bottom sheet (min / mid / max) ── */
    const SNAP_MIN = 138 + Math.max(insets.bottom, 10);
    const SNAP_MID = Math.round(screenH * 0.52);
    const SNAP_MAX = Math.round(screenH - insets.top - 70);
    const sheetH = useRef(new Animated.Value(SNAP_MID)).current;
    const curH = useRef(SNAP_MID);
    const startH = useRef(SNAP_MID);
    const [expanded, setExpanded] = useState(true);

    useEffect(() => {
        const id = sheetH.addListener(({ value }) => {
            curH.current = value;
        });
        return () => sheetH.removeListener(id);
    }, [sheetH]);

    const snapTo = (target: number) => {
        Animated.spring(sheetH, { toValue: target, useNativeDriver: false, bounciness: 4, speed: 14 }).start();
        curH.current = target;
        setExpanded(target > SNAP_MIN + 20);
    };
    const toggleSheet = () => snapTo(curH.current <= SNAP_MIN + 30 ? SNAP_MID : SNAP_MIN);

    const pan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
            onMoveShouldSetPanResponderCapture: (_e, g) => Math.abs(g.dy) > 4,
            onPanResponderGrant: () => {
                startH.current = curH.current;
            },
            onPanResponderMove: (_e, g) => {
                sheetH.setValue(Math.max(SNAP_MIN, Math.min(SNAP_MAX, startH.current - g.dy)));
            },
            onPanResponderRelease: (_e, g) => {
                const h = curH.current;
                let t = SNAP_MID;
                if (g.vy < -0.35) t = h > SNAP_MID - 20 ? SNAP_MAX : SNAP_MID;
                else if (g.vy > 0.35) t = h < SNAP_MID + 20 ? SNAP_MIN : SNAP_MID;
                else if (h < (SNAP_MIN + SNAP_MID) / 2) t = SNAP_MIN;
                else if (h > (SNAP_MID + SNAP_MAX) / 2) t = SNAP_MAX;
                snapTo(t);
            },
        })
    ).current;

    const fit = (coords: { latitude: number; longitude: number }[]) => {
        if (coords.length > 1) {
            mapRef.current?.fitToCoordinates(coords, {
                edgePadding: { top: insets.top + 80, right: 40, bottom: Math.min(Math.round(curH.current * 0.75 + 30), Math.round(screenH * 0.45)), left: 40 },
                animated: true,
            });
        }
    };
    useEffect(() => {
        const t = setTimeout(() => fit(plan.routeCoordinates), 450);
        return () => clearTimeout(t);
    }, [routeId]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectRoute = (id: string) => {
        tap();
        setRouteId(id);
    };

    const save = async () => {
        if (saving) return;
        if (saved) {
            Alert.alert('Trip saved', `${origin.label} → ${destination.label} is already in your saved trips.`);
            return;
        }
        setSaving(true);
        try {
            await tripPlannerService.saveTrip({
                origin: { id: origin.id, name: origin.label, latitude: origin.latitude, longitude: origin.longitude },
                destination: { id: destination.id, name: destination.label, latitude: destination.latitude, longitude: destination.longitude },
                distanceKm: plan.totalDistanceKm, durationMins: plan.driveMinutes, vehicleId: vehicle.id, initialSoc: vehicle.currentBattery,
                targetArrivalSoc: arriveSoc, plannedAt: new Date().toISOString(), routeOption: route.name, routeTag: route.tag,
            });
        } catch {
            // saved locally even if the API is unavailable
        } finally {
            addTrip({ origin: { id: origin.id, name: origin.label }, destination: { id: destination.id, name: destination.label }, distanceKm: plan.totalDistanceKm, durationMins: plan.driveMinutes, plannedAt: new Date().toISOString(), routeTag: route.tag });
            setSaving(false);
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
    };

    const startNavigation = () => {
        const wp = stops.map((s) => `${s.station.latitude},${s.station.longitude}`).join('|');
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}${wp ? `&waypoints=${encodeURIComponent(wp)}` : ''}&travelmode=driving`;
        Linking.openURL(url).catch(() => Alert.alert('Navigation', 'Could not open Google Maps.'));
    };

    const triggerBorder = (open: boolean) => (open ? VIOLET : colors.border);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* 1. Full-screen map */}
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                userInterfaceStyle={isDark ? 'dark' : 'light'}
                initialRegion={{
                    latitude: (origin.latitude + destination.latitude) / 2,
                    longitude: (origin.longitude + destination.longitude) / 2,
                    latitudeDelta: Math.abs(origin.latitude - destination.latitude) * 1.5 + 0.8,
                    longitudeDelta: Math.abs(origin.longitude - destination.longitude) * 1.5 + 0.8,
                }}
                onMapReady={() => setTimeout(() => fit(plan.routeCoordinates), 300)}
            >
                {routes
                    .filter((r) => r.id !== route.id)
                    .map((alt) => (
                        <Polyline
                            key={`alt-${alt.id}`}
                            coordinates={alt.coordinates}
                            strokeColor={isDark ? '#6E6E7E' : '#A6A3AD'}
                            strokeWidth={3.5}
                            lineDashPattern={[7, 4]}
                            tappable
                            onPress={() => selectRoute(alt.id)}
                        />
                    ))}
                <Polyline key={`active-${route.id}`} coordinates={route.coordinates} strokeColor={VIOLET} strokeWidth={5} />

                <Marker coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}>
                    <View style={[styles.pin, { backgroundColor: VIOLET }]}>
                        <ThemedText style={styles.pinText}>Start • {origin.label}</ThemedText>
                    </View>
                </Marker>
                {stops.map((s, i) => (
                    <Marker
                        key={`stop-${s.station.id}-${i}`}
                        coordinate={{ latitude: s.station.latitude, longitude: s.station.longitude }}
                        onPress={() => navigation.navigate('StationDetails', { stationId: s.station.id, stationSnapshot: s.station })}
                    >
                        <View style={[styles.pin, { backgroundColor: INK, borderColor: SOFT, borderWidth: 1.5 }]}>
                            <Zap size={10} color={SOFT} fill={SOFT} />
                            <ThemedText style={styles.pinText}>Stop {i + 1}</ThemedText>
                        </View>
                    </Marker>
                ))}
                <Marker coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}>
                    <View style={[styles.pin, { backgroundColor: '#FFFFFF' }]}>
                        <Flag size={10} color={INK} />
                        <ThemedText style={[styles.pinText, { color: INK }]}>{destination.label}</ThemedText>
                    </View>
                </Marker>
            </MapView>

            {/* 2. Floating top bar */}
            <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
                <Pressable accessibilityRole="button" accessibilityLabel="Back to planner" onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ChevronLeft size={20} color={colors.text} strokeWidth={2.5} />
                </Pressable>
                <View style={[styles.titlePill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ThemedText style={[styles.titleText, { color: colors.text }]} numberOfLines={1}>
                        {origin.label} → {destination.label} • {route.tag}
                    </ThemedText>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Fit route on map" onPress={() => fit(route.coordinates)} style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <RotateCcw size={16} color={colors.text} />
                </Pressable>
            </View>

            {/* 3. Draggable bottom sheet */}
            <Animated.View style={[styles.sheet, { height: sheetH, backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
                <View {...pan.panHandlers} style={styles.headerWrap}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Expand or collapse trip details" onPress={toggleSheet} style={styles.handleTouch}>
                        <View style={[styles.handle, { backgroundColor: colors.border }]} />
                    </Pressable>

                    <View style={styles.headerRow}>
                        <Pressable onPress={toggleSheet} style={{ flex: 1, marginRight: 8 }}>
                            <ThemedText style={[styles.sheetTitle, { color: colors.text }]} numberOfLines={1}>
                                {origin.label} → {destination.label}
                            </ThemedText>
                            <ThemedText style={[styles.sheetSubtitle, { color: colors.textMuted }]}>
                                {plan.totalDistanceKm} km • {fmtDur(plan.driveMinutes + chargeMins)} total • {stops.length} stop{stops.length === 1 ? '' : 's'}
                            </ThemedText>
                        </Pressable>

                        <View style={styles.headerActions}>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={saved ? 'Trip saved' : 'Save trip'}
                                onPress={save}
                                disabled={saving}
                                style={[styles.saveBtn, saved ? { backgroundColor: SOFT, borderColor: SOFT } : { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                            >
                                {saving ? <ActivityIndicator size="small" color={colors.text} /> : saved ? <BookmarkCheck size={14} color={INK} /> : <Bookmark size={14} color={colors.text} />}
                                <ThemedText style={[styles.saveText, { color: saved ? INK : colors.text }]}>{saving ? 'Saving…' : saved ? 'Saved' : 'Save Trip'}</ThemedText>
                            </Pressable>
                            <Pressable accessibilityRole="button" accessibilityLabel={expanded ? 'Collapse' : 'Expand'} onPress={toggleSheet} style={[styles.chevBtn, { backgroundColor: colors.surfaceMuted }]}>
                                {expanded ? <ChevronDown size={18} color={colors.text} /> : <ChevronUp size={18} color={colors.text} />}
                            </Pressable>
                        </View>
                    </View>

                    {/* Peek bar when collapsed */}
                    {!expanded ? (
                        <View style={styles.peekRow}>
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => {
                                    snapTo(SNAP_MID);
                                    setShowChargers(true);
                                }}
                                style={[styles.peekChargers, { backgroundColor: 'rgba(123,92,255,0.16)' }]}
                            >
                                <Zap size={13} color={colors.violet} fill={colors.violet} />
                                <ThemedText style={[styles.peekChargersText, { color: colors.violet }]}>{recommended.length} Chargers • Drag up</ThemedText>
                                <ChevronUp size={13} color={colors.violet} strokeWidth={2.5} />
                            </Pressable>
                            <Pressable accessibilityRole="button" onPress={startNavigation} style={[styles.peekNav, { backgroundColor: VIOLET }]}>
                                <Navigation size={13} color="#FFFFFF" fill="#FFFFFF" />
                                <ThemedText style={styles.peekNavText}>Start Nav</ThemedText>
                            </Pressable>
                        </View>
                    ) : null}
                </View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    {/* Route options (collapsible) */}
                    <View>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ expanded: showRouteOptions }}
                            onPress={() => {
                                tap();
                                setShowRouteOptions((v) => !v);
                            }}
                            style={[styles.trigger, { backgroundColor: colors.surfaceMuted, borderColor: triggerBorder(showRouteOptions) }]}
                        >
                            <View style={styles.triggerLeft}>
                                <RouteIcon size={14} color={colors.violet} />
                                <ThemedText style={[styles.triggerTitle, { color: colors.text }]}>Route Options</ThemedText>
                                <View style={[styles.tagPill, { backgroundColor: 'rgba(123,92,255,0.18)' }]}>
                                    <ThemedText style={[styles.tagPillText, { color: colors.violet }]}>{route.tag}</ThemedText>
                                </View>
                            </View>
                            <View style={styles.triggerRight}>
                                <ThemedText style={[styles.triggerHint, { color: colors.textMuted }]}>{routes.length} available</ThemedText>
                                {showRouteOptions ? <ChevronUp size={16} color={colors.text} /> : <ChevronDown size={16} color={colors.text} />}
                            </View>
                        </Pressable>

                        {showRouteOptions ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 10 }}>
                                {routes.map((r) => {
                                    const sel = r.id === route.id;
                                    const skin: CardSkin = r.tag === 'Fastest' ? 'violet' : r.tag === 'Route 2' ? 'ink' : 'lime';
                                    const sk = SKINS[skin];
                                    return (
                                        <SkinCard
                                            key={r.id}
                                            skin={skin}
                                            onPress={() => selectRoute(r.id)}
                                            accessibilityLabel={`${r.tag}, ${r.name}, ${r.distanceKm} kilometres`}
                                            style={[styles.payCard, sel && { borderWidth: 3, borderColor: colors.text }]}
                                        >
                                            <View style={styles.payPad}>
                                                <View style={styles.payTop}>
                                                    <View style={styles.payBrandRow}>
                                                        {sel ? <Check size={16} color={sk.fg} strokeWidth={3} /> : null}
                                                        <ThemedText style={[styles.payBrand, { color: sk.fg }]}>{r.tag.toUpperCase()}</ThemedText>
                                                    </View>
                                                </View>
                                                <ThemedText style={[styles.payNumber, { color: sk.fg }]} numberOfLines={1}>
                                                    {r.distanceKm}  KM  •  {r.stopsCount}  STOP{r.stopsCount === 1 ? '' : 'S'}
                                                </ThemedText>
                                                <View style={styles.payBottom}>
                                                    <View style={{ flex: 1, marginRight: 10 }}>
                                                        <ThemedText style={[styles.payLbl, { color: sk.sub }]}>VIA</ThemedText>
                                                        <ThemedText style={[styles.payVal, { color: sk.fg }]} numberOfLines={1}>{r.name.replace(/^Via\s+/i, '')}</ThemedText>
                                                    </View>
                                                    <CardField label="Drive" value={fmtDur(r.driveMinutes)} fg={sk.fg} sub={sk.sub} />
                                                    <View style={{ width: 14 }} />
                                                    <CardField label="Arrive" value={`${r.arrivalSocPercent}%`} fg={sk.fg} sub={sk.sub} align="right" />
                                                </View>
                                            </View>
                                        </SkinCard>
                                    );
                                })}
                            </ScrollView>
                        ) : null}
                    </View>

                    {/* KPI tiles */}
                    <View style={styles.kpiGrid}>
                        <View style={[styles.kpi, { backgroundColor: VIOLET }]}>
                            <ThemedText style={[styles.kpiLabel, { color: 'rgba(255,255,255,0.8)' }]}>DISTANCE</ThemedText>
                            <ThemedText style={[styles.kpiValue, { color: '#FFFFFF' }]}>{plan.totalDistanceKm} km</ThemedText>
                        </View>
                        <View style={[styles.kpi, { backgroundColor: INK }]}>
                            <ThemedText style={[styles.kpiLabel, { color: 'rgba(255,255,255,0.65)' }]}>CHARGING STOPS</ThemedText>
                            <ThemedText style={[styles.kpiValue, { color: '#FFFFFF' }]}>{stops.length} • {fmtDur(chargeMins)}</ThemedText>
                        </View>
                        <View style={[styles.kpi, { backgroundColor: SOFT }]}>
                            <ThemedText style={[styles.kpiLabel, { color: 'rgba(11,11,15,0.7)' }]}>ENERGY NEEDED</ThemedText>
                            <ThemedText style={[styles.kpiValue, { color: INK }]}>{plan.energyNeededKWh} kWh</ThemedText>
                        </View>
                        <View style={[styles.kpi, { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border }]}>
                            <ThemedText style={[styles.kpiLabel, { color: colors.textMuted }]}>ARRIVAL BATTERY</ThemedText>
                            <ThemedText style={[styles.kpiValue, { color: colors.text }]}>{plan.arrivalBatteryPercent}%</ThemedText>
                        </View>
                    </View>

                    {/* Chargers along the route (collapsible) */}
                    {plan.recommendedStations.length > 0 ? (
                        <View style={styles.block}>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityState={{ expanded: showChargers }}
                                onPress={() => {
                                    tap();
                                    setShowChargers((v) => !v);
                                }}
                                style={[styles.trigger, { backgroundColor: colors.surfaceMuted, borderColor: triggerBorder(showChargers) }]}
                            >
                                <View style={styles.triggerLeft}>
                                    <Zap size={14} color={colors.violet} />
                                    <ThemedText style={[styles.triggerTitle, { color: colors.text }]}>Chargers Along Route</ThemedText>
                                </View>
                                <View style={styles.triggerRight}>
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Charger filters"
                                        hitSlop={8}
                                        onPress={() => setShowFilters(true)}
                                        style={[styles.filterChip, filterCount > 0 ? { backgroundColor: SOFT } : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                                    >
                                        <SlidersHorizontal size={12} color={filterCount > 0 ? INK : colors.text} />
                                        <ThemedText style={[styles.filterChipText, { color: filterCount > 0 ? INK : colors.text }]}>{filterCount > 0 ? `Filters · ${filterCount}` : 'Filters'}</ThemedText>
                                    </Pressable>
                                    <ThemedText style={[styles.triggerHint, { color: colors.textMuted }]}>{recommended.length}</ThemedText>
                                    {showChargers ? <ChevronUp size={16} color={colors.text} /> : <ChevronDown size={16} color={colors.text} />}
                                </View>
                            </Pressable>

                            {showChargers ? (
                                <View style={{ marginTop: 10 }}>
                                    <ThemedText style={[styles.hint, { color: colors.textMuted }]}>Tap + Add to plan extra stops along this corridor</ThemedText>
                                    {recommended.map((rec) => {
                                        const isAuto = plan.stops.some((s) => s.station.id === rec.station.id);
                                        const added = extraStops.includes(rec.station.id);
                                        const inPlan = isAuto || added;
                                        return (
                                            <View key={`rec-${rec.station.id}`} style={[styles.rec, { backgroundColor: inPlan ? 'rgba(123,92,255,0.12)' : colors.surfaceMuted, borderColor: inPlan ? 'rgba(123,92,255,0.35)' : colors.border }]}>
                                                <Pressable
                                                    accessibilityRole="button"
                                                    onPress={() => navigation.navigate('StationDetails', { stationId: rec.station.id, stationSnapshot: rec.station })}
                                                    style={styles.recInfo}
                                                >
                                                    <View style={[styles.recAvatar, { backgroundColor: inPlan ? VIOLET : colors.surface }]}>
                                                        <Zap size={14} color={inPlan ? '#FFFFFF' : colors.violet} />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <ThemedText style={[styles.recName, { color: colors.text }]} numberOfLines={1}>{rec.station.name}</ThemedText>
                                                        <ThemedText style={[styles.recMeta, { color: colors.textMuted }]} numberOfLines={1}>
                                                            {rec.distanceFromOriginKm} km from start • {rec.connector.power} kW • ₹{rec.bestPricePerKWh}/kWh
                                                        </ThemedText>
                                                    </View>
                                                </Pressable>
                                                {isAuto ? (
                                                    <View style={[styles.planned, { backgroundColor: 'rgba(123,92,255,0.2)' }]}>
                                                        <Check size={12} color={colors.violet} />
                                                        <ThemedText style={[styles.plannedText, { color: colors.violet }]}>Planned</ThemedText>
                                                    </View>
                                                ) : (
                                                    <Pressable
                                                        accessibilityRole="button"
                                                        onPress={() => {
                                                            tap();
                                                            setExtraStops((prev) => (prev.includes(rec.station.id) ? prev.filter((x) => x !== rec.station.id) : [...prev, rec.station.id]));
                                                        }}
                                                        style={[styles.addBtn, added ? { backgroundColor: SOFT } : { backgroundColor: VIOLET }]}
                                                    >
                                                        {added ? <Check size={13} color={INK} /> : <Plus size={13} color="#FFFFFF" strokeWidth={2.5} />}
                                                        <ThemedText style={[styles.addText, { color: added ? INK : '#FFFFFF' }]}>{added ? 'Added' : 'Add'}</ThemedText>
                                                    </Pressable>
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            ) : null}
                        </View>
                    ) : null}

                    {/* Journey itinerary */}
                    <View style={styles.block}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Journey Itinerary</ThemedText>

                        <View style={styles.step}>
                            <View style={styles.stepCol}>
                                <View style={[styles.dot, { backgroundColor: VIOLET }]} />
                                <View style={[styles.line, { backgroundColor: colors.border }]} />
                            </View>
                            <View style={styles.stepBody}>
                                <ThemedText style={[styles.stepTitle, { color: colors.text }]}>Depart {origin.label}</ThemedText>
                                <ThemedText style={[styles.stepSub, { color: colors.textMuted }]}>
                                    {plan.departureTimeLabel} • Start with {vehicle.currentBattery}% (~{usableRange} km range)
                                </ThemedText>
                            </View>
                        </View>

                        {stops.map((s, i) => (
                            <View key={`tl-${s.station.id}-${i}`} style={styles.step}>
                                <View style={styles.stepCol}>
                                    <View style={[styles.dot, { backgroundColor: VIOLET }]}>
                                        <Zap size={8} color="#FFFFFF" fill="#FFFFFF" />
                                    </View>
                                    <View style={[styles.line, { backgroundColor: colors.border }]} />
                                </View>
                                <Pressable
                                    accessibilityRole="button"
                                    onPress={() => navigation.navigate('StationDetails', { stationId: s.station.id, stationSnapshot: s.station })}
                                    style={styles.stepBody}
                                >
                                    <View style={styles.stopHead}>
                                        <ThemedText style={[styles.stopBadge, { color: colors.violet }]}>Charging Stop {i + 1}</ThemedText>
                                        <ThemedText style={[styles.stopDur, { color: colors.textMuted }]}>{s.chargeMinutes} mins</ThemedText>
                                    </View>
                                    <ThemedText style={[styles.stepTitle, { color: colors.text }]} numberOfLines={1}>{s.station.name}</ThemedText>
                                    <ThemedText style={[styles.stepSub, { color: colors.textMuted }]}>
                                        Arrive {s.arrivalTimeLabel} • {s.arrivalBatteryPercent}% → {s.departureBatteryPercent}% • +{s.addedEnergyKWh} kWh ({formatRupees(s.chargeCost)})
                                    </ThemedText>
                                </Pressable>
                            </View>
                        ))}

                        <View style={styles.step}>
                            <View style={styles.stepCol}>
                                <View style={[styles.dot, { backgroundColor: colors.text }]}>
                                    <Flag size={8} color={colors.background} />
                                </View>
                            </View>
                            <View style={styles.stepBody}>
                                <ThemedText style={[styles.stepTitle, { color: colors.text }]}>Arrive in {destination.label}</ThemedText>
                                <ThemedText style={[styles.stepSub, { color: colors.textMuted }]}>
                                    {plan.arrivalTimeLabel} • {plan.arrivalBatteryPercent}% battery buffer remaining
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    <PulseButton variant="violet" title="Start navigation" icon={<Navigation size={17} color="#FFFFFF" fill="#FFFFFF" />} onPress={startNavigation} style={{ marginTop: 22 }} />
                    <ThemedText style={[styles.navHint, { color: colors.textMuted }]}>Turn-by-turn route via Google Maps</ThemedText>
                    <View style={{ height: 24 }} />
                </ScrollView>
            </Animated.View>

            <MapFilterSheet visible={showFilters} criteria={filters} onClose={() => setShowFilters(false)} onApply={(n) => { setFilters(n); setShowFilters(false); }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    pin: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    pinText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 11, color: '#FFFFFF' },
    topBar: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
    iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    titlePill: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, justifyContent: 'center' },
    titleText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 14 },
    sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, overflow: 'hidden' },
    headerWrap: { paddingHorizontal: 16, paddingBottom: 8 },
    handleTouch: { alignItems: 'center', paddingTop: 10, paddingBottom: 10 },
    handle: { width: 42, height: 5, borderRadius: 3 },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    sheetTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 19, letterSpacing: -0.4 },
    sheetSubtitle: { fontFamily: FONT_FAMILIES.medium, fontSize: 12.5, marginTop: 2 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
    saveText: { fontFamily: FONT_FAMILIES.bold, fontSize: 12.5 },
    chevBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    peekRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    peekChargers: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 12, borderRadius: 12 },
    peekChargersText: { flex: 1, fontFamily: FONT_FAMILIES.bold, fontSize: 12.5 },
    peekNav: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 12 },
    peekNavText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 12.5, color: '#FFFFFF' },
    content: { paddingHorizontal: 16, paddingTop: 6 },
    block: { marginTop: 18 },
    trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5 },
    triggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
    triggerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    triggerTitle: { fontFamily: FONT_FAMILIES.bold, fontSize: 14 },
    triggerHint: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 12 },
    tagPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    tagPillText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 10.5 },
    filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 26, paddingHorizontal: 8, borderRadius: 9 },
    filterChipText: { fontFamily: FONT_FAMILIES.bold, fontSize: 11 },
    payCard: { width: 272, height: 172, flex: 0 },
    payPad: { flex: 1, padding: 16 },
    payTop: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    payBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    payBrand: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 12, letterSpacing: 1.6 },
    payNumber: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 18, letterSpacing: 2, marginTop: 16 },
    payBottom: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 'auto' },
    payLbl: { fontFamily: FONT_FAMILIES.bold, fontSize: 9.5, letterSpacing: 1.2 },
    payVal: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 14, marginTop: 2 },
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
    kpi: { width: '48.5%', borderRadius: 20, padding: 14, minHeight: 78, justifyContent: 'space-between' },
    kpiLabel: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 10, letterSpacing: 1 },
    kpiValue: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 20, letterSpacing: -0.5, marginTop: 8 },
    hint: { fontFamily: FONT_FAMILIES.medium, fontSize: 12, marginBottom: 8, marginLeft: 2 },
    rec: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
    recInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    recAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    recName: { fontFamily: FONT_FAMILIES.bold, fontSize: 14 },
    recMeta: { fontFamily: FONT_FAMILIES.medium, fontSize: 11.5, marginTop: 1 },
    planned: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 10, borderRadius: 10 },
    plannedText: { fontFamily: FONT_FAMILIES.bold, fontSize: 11.5 },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 12, borderRadius: 10 },
    addText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 12 },
    sectionTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 17, letterSpacing: -0.3, marginBottom: 12 },
    step: { flexDirection: 'row', gap: 12 },
    stepCol: { alignItems: 'center', width: 16 },
    dot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    line: { width: 2, flex: 1, marginVertical: 2, minHeight: 28 },
    stepBody: { flex: 1, paddingBottom: 16 },
    stepTitle: { fontFamily: FONT_FAMILIES.bold, fontSize: 14.5 },
    stepSub: { fontFamily: FONT_FAMILIES.medium, fontSize: 12.5, lineHeight: 18, marginTop: 2 },
    stopHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stopBadge: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 11.5 },
    stopDur: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 11.5 },
    navHint: { fontFamily: FONT_FAMILIES.medium, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
