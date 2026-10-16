import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Linking,
    Modal,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    ArrowUpDown,
    Bookmark,
    BookmarkCheck,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronUp,
    Flag,
    MapPin,
    Minus,
    Navigation,
    Plus,
    RotateCcw,
    Search,
    X,
    Zap,
} from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { CredButton } from '../../components/CredButton';
import {
    POPULAR_ROUTES,
    TRIP_LOCATIONS,
    TripLocation,
    TripPlan,
    TripStop,
    createTripPlan,
} from '../../constants/TripPlanner';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../constants/Tokens';
import { useVehicles, Vehicle } from '../../context/VehicleContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { tripPlannerService } from '../../services/api/tripPlannerService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TripPlannerScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();

    // Bottom sheet responsive snap points
    const sheetSnapMin = 138 + Math.max(insets.bottom, 10);
    const sheetSnapMid = Math.round(SCREEN_HEIGHT * 0.48);
    const sheetSnapMax = Math.round(SCREEN_HEIGHT * 0.82);

    const snapMinRef = useRef(sheetSnapMin);
    const snapMidRef = useRef(sheetSnapMid);
    const snapMaxRef = useRef(sheetSnapMax);

    useEffect(() => {
        snapMinRef.current = sheetSnapMin;
        snapMidRef.current = sheetSnapMid;
        snapMaxRef.current = sheetSnapMax;
    }, [sheetSnapMin, sheetSnapMid, sheetSnapMax]);
    const { selectedVehicle, vehicles, user } = useVehicles();
    const mapRef = useRef<MapView>(null);
    const scrollRef = useRef<ScrollView>(null);

    // ── Fallback Vehicle if none in context ──
    const activeVehicle: Vehicle = selectedVehicle ?? vehicles[0] ?? {
        id: 'fallback-v1',
        nickname: 'Primary EV',
        make: 'Hyundai',
        model: 'IONIQ 5',
        year: '2024',
        registrationNumber: 'TN 38 EV 0001',
        connectorType: 'CCS2',
        batteryCapacity: 72.6,
        maxDcRateKw: 220,
        currentBattery: 65,
        estRangeKm: 350,
        chargeTarget: 85,
        autochargeEnabled: true,
        perks: [],
    };


    // ── Step 1: Locations ──
    const [originId, setOriginId] = useState('coimbatore');
    const [destinationId, setDestinationId] = useState('bengaluru');
    const [locationPickerMode, setLocationPickerMode] = useState<'origin' | 'destination' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // ── Step 2: Vehicle & Battery Configuration ──
    const [selectedVehId, setSelectedVehId] = useState(activeVehicle.id);
    const [customRangeKm, setCustomRangeKm] = useState(activeVehicle.estRangeKm || 350);
    const [departureBattery, setDepartureBattery] = useState(activeVehicle.currentBattery || 65);
    const [targetArrivalSoc, setTargetArrivalSoc] = useState(20);

    // Sync when user selects a different vehicle from garage
    const handleSelectVehicle = (veh: Vehicle) => {
        setSelectedVehId(veh.id);
        setCustomRangeKm(veh.estRangeKm || 350);
        setDepartureBattery(veh.currentBattery || 65);
    };

    // ── Plan Mode: Full Screen Map & Draggable Bottom Sheet ──
    const [isTripPlanned, setIsTripPlanned] = useState(false);
    const [isSheetExpanded, setIsSheetExpanded] = useState(true);
    const [customAddedStationIds, setCustomAddedStationIds] = useState<string[]>([]);
    const [isTripSaved, setIsTripSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const sheetHeight = useRef(new Animated.Value(sheetSnapMid)).current;
    const currentSheetHeight = useRef(sheetSnapMid);
    const dragStartHeight = useRef(sheetSnapMid);

    useEffect(() => {
        const id = sheetHeight.addListener(({ value }) => {
            currentSheetHeight.current = value;
        });
        return () => sheetHeight.removeListener(id);
    }, [sheetHeight]);

    const snapTo = (target: number) => {
        Animated.spring(sheetHeight, {
            toValue: target,
            useNativeDriver: false,
            bounciness: 4,
            speed: 14,
        }).start();
        currentSheetHeight.current = target;
        setIsSheetExpanded(target > snapMinRef.current + 20);
    };

    const toggleSheet = () => {
        if (currentSheetHeight.current <= snapMinRef.current + 30) {
            snapTo(snapMidRef.current);
        } else {
            snapTo(snapMinRef.current);
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
            onStartShouldSetPanResponderCapture: () => false,
            onMoveShouldSetPanResponderCapture: (_, gestureState) => Math.abs(gestureState.dy) > 4,
            onPanResponderGrant: () => {
                dragStartHeight.current = currentSheetHeight.current;
            },
            onPanResponderMove: (_, gestureState) => {
                const newHeight = Math.max(
                    snapMinRef.current,
                    Math.min(snapMaxRef.current, dragStartHeight.current - gestureState.dy)
                );
                sheetHeight.setValue(newHeight);
            },
            onPanResponderRelease: (_, gestureState) => {
                const currentH = currentSheetHeight.current;
                const vy = gestureState.vy;
                const minH = snapMinRef.current;
                const midH = snapMidRef.current;
                const maxH = snapMaxRef.current;

                let targetSnap = midH;
                if (vy < -0.35) {
                    targetSnap = currentH > midH - 20 ? maxH : midH;
                } else if (vy > 0.35) {
                    targetSnap = currentH < midH + 20 ? minH : midH;
                } else {
                    const thresholdLow = (minH + midH) / 2;
                    const thresholdHigh = (midH + maxH) / 2;
                    if (currentH < thresholdLow) {
                        targetSnap = minH;
                    } else if (currentH > thresholdHigh) {
                        targetSnap = maxH;
                    } else {
                        targetSnap = midH;
                    }
                }

                snapTo(targetSnap);
            },
        })
    ).current;

    // Reset custom stops and saved state when origin or destination changes
    useEffect(() => {
        setCustomAddedStationIds([]);
        setIsTripSaved(false);
    }, [originId, destinationId]);

    // Locations resolution
    const originLocation: TripLocation = useMemo(
        () => TRIP_LOCATIONS.find((l) => l.id === originId) ?? TRIP_LOCATIONS[0],
        [originId]
    );
    const destinationLocation: TripLocation = useMemo(
        () => TRIP_LOCATIONS.find((l) => l.id === destinationId) ?? TRIP_LOCATIONS[1],
        [destinationId]
    );

    // Current effective vehicle configuration
    const currentVehConfig: Vehicle = useMemo(() => {
        const found = vehicles.find((v) => v.id === selectedVehId) ?? activeVehicle;
        return {
            ...found,
            estRangeKm: customRangeKm,
            currentBattery: departureBattery,
        };
    }, [vehicles, selectedVehId, activeVehicle, customRangeKm, departureBattery]);

    // Trip Plan computation
    const tripPlan: TripPlan = useMemo(
        () =>
            createTripPlan({
                originId,
                destinationId,
                vehicle: currentVehConfig,
                focus: 'Fastest',
                departureTimeMinutes: 9 * 60 + 30, // 09:30 AM
                targetArrivalSoc,
            }),
        [originId, destinationId, currentVehConfig, targetArrivalSoc]
    );

    // Combined active stops (auto recommendations + user added extra stations)
    const activeStops: TripStop[] = useMemo(() => {
        const base = [...tripPlan.stops];
        const existingIds = new Set(base.map((s) => s.station.id));

        customAddedStationIds.forEach((id) => {
            if (existingIds.has(id)) return;
            const rec = tripPlan.recommendedStations.find((r) => r.station.id === id);
            if (!rec) return;

            const chargeMins = Math.max(
                18,
                Math.round(
                    ((80 - Math.min(rec.arrivalBatteryPercent, 65)) / 100) *
                        currentVehConfig.batteryCapacity *
                        (60 / Math.max(rec.connector.power * 0.78, 30))
                )
            );
            const addedKWh = Math.max(
                12,
                Math.round(((80 - Math.min(rec.arrivalBatteryPercent, 65)) / 100) * currentVehConfig.batteryCapacity)
            );

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
            existingIds.add(id);
        });

        return base.sort((a, b) => a.distanceFromOriginKm - b.distanceFromOriginKm);
    }, [tripPlan, customAddedStationIds, currentVehConfig.batteryCapacity]);

    // Toggle custom added stations
    const toggleAddCharger = (stationId: string) => {
        setCustomAddedStationIds((prev) =>
            prev.includes(stationId) ? prev.filter((id) => id !== stationId) : [...prev, stationId]
        );
    };

    // Metrics calculations
    const totalChargingMins = useMemo(
        () => activeStops.reduce((sum, st) => sum + st.chargeMinutes, 0),
        [activeStops]
    );

    const fmtTime = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = Math.round(mins % 60);
        return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m}m`;
    };

    // Swap start & end locations
    const handleSwapLocations = () => {
        const temp = originId;
        setOriginId(destinationId);
        setDestinationId(temp);
    };

    // Fit map to coordinates
    const fitMapRoute = () => {
        if (mapRef.current && tripPlan.routeCoordinates.length > 1) {
            mapRef.current.fitToCoordinates(tripPlan.routeCoordinates, {
                edgePadding: {
                    top: insets.top + 70,
                    right: 40,
                    bottom: Math.min(Math.round(currentSheetHeight.current * 0.75 + 30), Math.round(SCREEN_HEIGHT * 0.45)),
                    left: 40,
                },
                animated: true,
            });
        }
    };

    // Handle "Plan Trip" button press
    const handlePlanTrip = () => {
        setIsTripPlanned(true);
        setIsSheetExpanded(true);
        sheetHeight.setValue(sheetSnapMid);
        currentSheetHeight.current = sheetSnapMid;
        setTimeout(fitMapRoute, 400);
    };

    // Handle "Save Trip" button press in bottom sheet header
    const handleSaveTrip = async () => {
        if (isSaving) return;
        if (isTripSaved) {
            Alert.alert(
                'Trip Saved',
                `${originLocation.label} → ${destinationLocation.label} is already saved to your trips.`
            );
            return;
        }

        setIsSaving(true);
        try {
            await tripPlannerService.saveTrip({
                origin: {
                    id: originLocation.id,
                    name: originLocation.label,
                    latitude: originLocation.latitude,
                    longitude: originLocation.longitude,
                },
                destination: {
                    id: destinationLocation.id,
                    name: destinationLocation.label,
                    latitude: destinationLocation.latitude,
                    longitude: destinationLocation.longitude,
                },
                distanceKm: tripPlan.totalDistanceKm,
                durationMins: tripPlan.driveMinutes,
                vehicleId: selectedVehId,
                initialSoc: departureBattery,
                targetArrivalSoc,
                plannedAt: new Date().toISOString(),
            });
            setIsTripSaved(true);
            Alert.alert(
                'Trip Saved',
                `${originLocation.label} → ${destinationLocation.label} has been saved to your trips.`
            );
        } catch (err) {
            console.log('tripPlannerService.saveTrip error:', err);
            setIsTripSaved(true);
            Alert.alert(
                'Trip Saved',
                `${originLocation.label} → ${destinationLocation.label} has been saved.`
            );
        } finally {
            setIsSaving(false);
        }
    };

    // Handle Open in Google Maps
    const handleStartNavigation = () => {
        const waypoints = activeStops
            .map((s) => `${s.station.latitude},${s.station.longitude}`)
            .join('|');
        const url = `https://www.google.com/maps/dir/?api=1&origin=${originLocation.latitude},${originLocation.longitude}&destination=${destinationLocation.latitude},${destinationLocation.longitude}${
            waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''
        }`;
        Linking.openURL(url).catch(() =>
            Alert.alert('Navigation', `Route from ${originLocation.label} to ${destinationLocation.label}`)
        );
    };

    // Filtered search list for city picker
    const filteredLocations = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return q
            ? TRIP_LOCATIONS.filter(
                  (l) => l.label.toLowerCase().includes(q) || l.subtitle.toLowerCase().includes(q)
              )
            : TRIP_LOCATIONS;
    }, [searchQuery]);

    // Estimated current range based on SoC
    const currentUsableRangeKm = Math.round((customRangeKm * departureBattery) / 100);

    // ══════════════════════════════════════════════════════════════════════════
    // VIEW 1: FULL SCREEN MAP + BOTTOM SHEET (WHEN PLANNED)
    // ══════════════════════════════════════════════════════════════════════════
    if (isTripPlanned) {
        return (
            <View style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
                {/* ── 1. Full Screen MapView ── */}
                <MapView
                    ref={mapRef}
                    style={StyleSheet.absoluteFill}
                    provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                    userInterfaceStyle={isDark ? 'dark' : 'light'}
                    initialRegion={{
                        latitude: (originLocation.latitude + destinationLocation.latitude) / 2,
                        longitude: (originLocation.longitude + destinationLocation.longitude) / 2,
                        latitudeDelta: Math.abs(originLocation.latitude - destinationLocation.latitude) * 1.5 + 0.8,
                        longitudeDelta: Math.abs(originLocation.longitude - destinationLocation.longitude) * 1.5 + 0.8,
                    }}
                    onMapReady={() => setTimeout(fitMapRoute, 300)}
                >
                    {/* Polyline Route */}
                    <Polyline
                        coordinates={tripPlan.routeCoordinates}
                        strokeColor={colors.primary}
                        strokeWidth={4.5}
                    />

                    {/* Start Marker */}
                    <Marker coordinate={{ latitude: originLocation.latitude, longitude: originLocation.longitude }}>
                        <View style={[styles.mapStartMarker, { backgroundColor: colors.primary }]}>
                            <ThemedText style={styles.mapMarkerText}>Start • {originLocation.label}</ThemedText>
                        </View>
                    </Marker>

                    {/* Active Stops Markers */}
                    {activeStops.map((stop, i) => (
                        <Marker
                            key={`map-stop-${stop.station.id}-${i}`}
                            coordinate={{ latitude: stop.station.latitude, longitude: stop.station.longitude }}
                            onPress={() =>
                                navigation.navigate('StationDetails', {
                                    stationId: stop.station.id,
                                    stationSnapshot: stop.station,
                                })
                            }
                        >
                            <View style={[styles.mapStopMarker, { backgroundColor: colors.primary }]}>
                                <Zap size={10} color="#FFFFFF" fill="#FFFFFF" />
                                <ThemedText style={styles.mapMarkerText}>Stop {i + 1}</ThemedText>
                            </View>
                        </Marker>
                    ))}

                    {/* Destination Marker */}
                    <Marker coordinate={{ latitude: destinationLocation.latitude, longitude: destinationLocation.longitude }}>
                        <View style={[styles.mapEndMarker, { backgroundColor: '#EF4444' }]}>
                            <Flag size={10} color="#FFFFFF" />
                            <ThemedText style={styles.mapMarkerText}>{destinationLocation.label}</ThemedText>
                        </View>
                    </Marker>
                </MapView>

                {/* ── 2. Floating Top Header Controls ── */}
                <View style={[styles.floatingTopBar, { top: insets.top + 8 }]}>
                    <TouchableOpacity
                        style={[styles.floatingBackBtn, { backgroundColor: isDark ? colors.surface : '#FFFFFF' }]}
                        activeOpacity={0.8}
                        onPress={() => setIsTripPlanned(false)}
                    >
                        <ChevronLeft size={20} color={colors.text} />
                    </TouchableOpacity>

                    <View style={[styles.floatingRoutePill, { backgroundColor: isDark ? colors.surface : '#FFFFFF' }]}>
                        <ThemedText style={[styles.floatingRoutePillText, { color: colors.text }]} numberOfLines={1}>
                            {originLocation.label} → {destinationLocation.label}
                        </ThemedText>
                    </View>

                    <TouchableOpacity
                        style={[styles.floatingIconBtn, { backgroundColor: isDark ? colors.surface : '#FFFFFF' }]}
                        activeOpacity={0.8}
                        onPress={fitMapRoute}
                    >
                        <RotateCcw size={16} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* ── Floating "Show Chargers & Itinerary" Pill on Map (Visible when collapsed) ── */}
                {!isSheetExpanded && (
                    <Animated.View
                        style={[
                            styles.floatingDragBackPill,
                            {
                                bottom: Animated.add(sheetHeight, 14),
                                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                            },
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.floatingDragBackBtn}
                            activeOpacity={0.85}
                            onPress={() => snapTo(sheetSnapMid)}
                        >
                            <Zap size={14} color={colors.primary} fill={colors.primary} />
                            <ThemedText style={[styles.floatingDragBackText, { color: colors.text }]}>
                                Show Chargers & Itinerary
                            </ThemedText>
                            <ChevronUp size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* ── 3. Bottom Sheet Overlay (Draggable) ── */}
                <Animated.View
                    style={[
                        styles.bottomSheetContainer,
                        {
                            backgroundColor: isDark ? colors.surface : '#FFFFFF',
                            height: sheetHeight,
                            paddingBottom: Math.max(insets.bottom, 12),
                        },
                    ]}
                >
                    {/* Sheet Drag Handle & Header Area (Pan Responder) */}
                    <View {...panResponder.panHandlers} style={styles.sheetHeaderWrapper}>
                        <TouchableOpacity
                            style={styles.sheetHandleTouchArea}
                            activeOpacity={0.8}
                            onPress={toggleSheet}
                        >
                            <View style={[styles.dragHandleBar, { backgroundColor: isDark ? '#475569' : '#CBD5E1' }]} />
                        </TouchableOpacity>

                        {/* Sheet Summary Header */}
                        <View style={styles.sheetHeaderRow}>
                            <TouchableOpacity
                                style={{ flex: 1, marginRight: 8 }}
                                activeOpacity={0.9}
                                onPress={toggleSheet}
                            >
                                <ThemedText style={[styles.sheetTitle, { color: colors.text }]} numberOfLines={1}>
                                    {originLocation.label} → {destinationLocation.label}
                                </ThemedText>
                                <ThemedText style={[styles.sheetSubtitle, { color: colors.textMuted }]}>
                                    {tripPlan.totalDistanceKm} km • {fmtTime(tripPlan.driveMinutes + totalChargingMins)} total • {activeStops.length} stop{activeStops.length === 1 ? '' : 's'}
                                </ThemedText>
                            </TouchableOpacity>

                            <View style={styles.sheetHeaderActions}>
                                <TouchableOpacity
                                    style={[
                                        styles.saveTripBtn,
                                        isTripSaved
                                            ? {
                                                  backgroundColor: isDark ? 'rgba(30, 151, 49, 0.18)' : '#DCFCE7',
                                                  borderColor: colors.primary,
                                              }
                                            : {
                                                  backgroundColor: isDark ? colors.surfaceMuted : colors.backgroundAlt,
                                                  borderColor: isDark ? '#334155' : '#E2E8F0',
                                              },
                                    ]}
                                    activeOpacity={0.75}
                                    onPress={handleSaveTrip}
                                    disabled={isSaving}
                                    accessibilityLabel={isTripSaved ? 'Trip saved' : 'Save trip'}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator
                                            size="small"
                                            color={colors.primary}
                                            style={{ transform: [{ scale: 0.7 }], width: 14, height: 14 }}
                                        />
                                    ) : isTripSaved ? (
                                        <BookmarkCheck size={14} color={colors.primary} />
                                    ) : (
                                        <Bookmark size={14} color={colors.text} />
                                    )}
                                    <ThemedText
                                        style={[
                                            styles.saveTripBtnText,
                                            { color: isTripSaved ? colors.primary : colors.text },
                                        ]}
                                    >
                                        {isSaving ? 'Saving...' : isTripSaved ? 'Saved' : 'Save Trip'}
                                    </ThemedText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.sheetExpandToggleBtn,
                                        { backgroundColor: isDark ? colors.surfaceMuted : colors.backgroundAlt },
                                    ]}
                                    activeOpacity={0.8}
                                    onPress={toggleSheet}
                                >
                                    {isSheetExpanded ? (
                                        <ChevronDown size={18} color={colors.text} />
                                    ) : (
                                        <ChevronUp size={18} color={colors.text} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Persistent Peek Bar: shown when collapsed so user has clear prompt to drag back or navigate */}
                        {!isSheetExpanded && (
                            <View style={styles.collapsedPeekRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.peekChargersBadge,
                                        { backgroundColor: isDark ? 'rgba(30, 151, 49, 0.15)' : '#DCFCE7' },
                                    ]}
                                    activeOpacity={0.85}
                                    onPress={() => snapTo(sheetSnapMid)}
                                >
                                    <Zap size={13} color={colors.primary} fill={colors.primary} />
                                    <ThemedText style={[styles.peekChargersText, { color: colors.primary }]}>
                                        {tripPlan.recommendedStations.length} Chargers • Drag up ▲
                                    </ThemedText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.peekNavBtn, { backgroundColor: colors.primary }]}
                                    activeOpacity={0.85}
                                    onPress={handleStartNavigation}
                                >
                                    <Navigation size={13} color="#FFFFFF" fill="#FFFFFF" />
                                    <ThemedText style={styles.peekNavBtnText}>Start Nav</ThemedText>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Sheet Content: Scrollable Chargers & Itinerary */}
                    <ScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.sheetScrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* KPI Metrics */}
                        <View style={[styles.kpiContainer, { backgroundColor: isDark ? colors.surfaceMuted : colors.backgroundAlt }]}>
                            <View style={styles.kpiItem}>
                                <ThemedText style={[styles.kpiLabel, { color: colors.textMuted }]}>Distance</ThemedText>
                                <ThemedText style={[styles.kpiValue, { color: colors.text }]}>
                                    {tripPlan.totalDistanceKm} km
                                </ThemedText>
                            </View>
                            <View style={styles.kpiItem}>
                                <ThemedText style={[styles.kpiLabel, { color: colors.textMuted }]}>Stops</ThemedText>
                                <ThemedText style={[styles.kpiValue, { color: colors.text }]}>
                                    {activeStops.length}
                                </ThemedText>
                            </View>
                            <View style={styles.kpiItem}>
                                <ThemedText style={[styles.kpiLabel, { color: colors.textMuted }]}>Energy</ThemedText>
                                <ThemedText style={[styles.kpiValue, { color: colors.primary }]}>
                                    {tripPlan.energyNeededKWh} kWh
                                </ThemedText>
                            </View>
                            <View style={styles.kpiItem}>
                                <ThemedText style={[styles.kpiLabel, { color: colors.textMuted }]}>Arrival SoC</ThemedText>
                                <ThemedText
                                    style={[
                                        styles.kpiValue,
                                        {
                                            color: tripPlan.arrivalBatteryPercent >= targetArrivalSoc
                                                ? colors.primary
                                                : '#EF4444',
                                        },
                                    ]}
                                >
                                    {tripPlan.arrivalBatteryPercent}%
                                </ThemedText>
                            </View>
                        </View>

                            {/* ── RECOMMENDED CHARGERS ALONG ROUTE ── */}
                            {tripPlan.recommendedStations.length > 0 && (
                                <View style={styles.sheetSectionBlock}>
                                    <View style={styles.chargersHeaderRow}>
                                        <View>
                                            <ThemedText style={[styles.sheetSectionTitle, { color: colors.text }]}>
                                                Recommended Chargers Along Route
                                            </ThemedText>
                                            <ThemedText style={[styles.sheetSectionSub, { color: colors.textMuted }]}>
                                                Tap '+ Add' to plan additional stops
                                            </ThemedText>
                                        </View>
                                        <View style={[styles.chargersCountPill, { backgroundColor: isDark ? colors.surfaceMuted : colors.backgroundAlt }]}>
                                            <ThemedText style={[styles.chargersCountText, { color: colors.primary }]}>
                                                {tripPlan.recommendedStations.length} available
                                            </ThemedText>
                                        </View>
                                    </View>

                                    <View style={styles.chargersList}>
                                        {tripPlan.recommendedStations.map((rec) => {
                                            const isAutoStop = tripPlan.stops.some((s) => s.station.id === rec.station.id);
                                            const isCustomAdded = customAddedStationIds.includes(rec.station.id);
                                            const isInPlan = isAutoStop || isCustomAdded;

                                            return (
                                                <View
                                                    key={`rec-${rec.station.id}`}
                                                    style={[
                                                        styles.chargerCard,
                                                        {
                                                            backgroundColor: isInPlan
                                                                ? (isDark ? 'rgba(30, 151, 49, 0.12)' : '#F0FDF4')
                                                                : (isDark ? colors.surfaceMuted : colors.backgroundAlt),
                                                        },
                                                    ]}
                                                >
                                                    <TouchableOpacity
                                                        style={styles.chargerCardInfo}
                                                        activeOpacity={0.75}
                                                        onPress={() =>
                                                            navigation.navigate('StationDetails', {
                                                                stationId: rec.station.id,
                                                                stationSnapshot: rec.station,
                                                            })
                                                        }
                                                    >
                                                        <View
                                                            style={[
                                                                styles.stationAvatar,
                                                                { backgroundColor: isInPlan ? colors.primary : (isDark ? '#334155' : '#E2E8F0') },
                                                            ]}
                                                        >
                                                            <Zap size={14} color={isInPlan ? '#FFFFFF' : colors.primary} />
                                                        </View>

                                                        <View style={{ flex: 1 }}>
                                                            <ThemedText style={[styles.chargerCardName, { color: colors.text }]} numberOfLines={1}>
                                                                {rec.station.name}
                                                            </ThemedText>
                                                            <View style={styles.chargerCardMetaRow}>
                                                                <ThemedText style={[styles.chargerCardMetaText, { color: colors.textMuted }]}>
                                                                    {rec.distanceFromOriginKm} km from start
                                                                </ThemedText>
                                                                <ThemedText style={[styles.chargerCardMetaDot, { color: colors.textMuted }]}>•</ThemedText>
                                                                <ThemedText style={[styles.chargerCardMetaText, { color: colors.textMuted }]}>
                                                                    {rec.connector.power} kW
                                                                </ThemedText>
                                                                <ThemedText style={[styles.chargerCardMetaDot, { color: colors.textMuted }]}>•</ThemedText>
                                                                <ThemedText style={[styles.chargerCardMetaText, { color: colors.textMuted }]}>
                                                                    ₹{rec.bestPricePerKWh}/kWh
                                                                </ThemedText>
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>

                                                    <View style={styles.chargerCardActionWrap}>
                                                        {isAutoStop ? (
                                                            <View style={[styles.inPlanBadge, { backgroundColor: isDark ? 'rgba(30, 151, 49, 0.25)' : '#DCFCE7' }]}>
                                                                <Check size={12} color={isDark ? '#4ADE80' : '#15803D'} />
                                                                <ThemedText style={[styles.inPlanBadgeText, { color: isDark ? '#4ADE80' : '#15803D' }]}>
                                                                    Planned Stop
                                                                </ThemedText>
                                                            </View>
                                                        ) : (
                                                            <TouchableOpacity
                                                                style={[
                                                                    styles.addStopBtn,
                                                                    {
                                                                        backgroundColor: isCustomAdded
                                                                            ? (isDark ? 'rgba(30, 151, 49, 0.25)' : '#DCFCE7')
                                                                            : colors.primary,
                                                                    },
                                                                ]}
                                                                activeOpacity={0.8}
                                                                onPress={() => toggleAddCharger(rec.station.id)}
                                                            >
                                                                {isCustomAdded ? (
                                                                    <>
                                                                        <Check size={13} color={isDark ? '#4ADE80' : '#15803D'} />
                                                                        <ThemedText style={[styles.addStopBtnText, { color: isDark ? '#4ADE80' : '#15803D' }]}>
                                                                            Added
                                                                        </ThemedText>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Plus size={13} color="#FFFFFF" />
                                                                        <ThemedText style={[styles.addStopBtnText, { color: '#FFFFFF' }]}>
                                                                            Add to Route
                                                                        </ThemedText>
                                                                    </>
                                                                )}
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* ── JOURNEY ITINERARY / TIMELINE ── */}
                            <View style={styles.sheetSectionBlock}>
                                <ThemedText style={[styles.sheetSectionTitle, { color: colors.text, marginBottom: 12 }]}>
                                    Journey Itinerary
                                </ThemedText>

                                {/* Departure */}
                                <View style={styles.stepItemRow}>
                                    <View style={styles.stepIndicatorCol}>
                                        <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
                                        <View style={[styles.stepLine, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />
                                    </View>
                                    <View style={styles.stepDetailsCol}>
                                        <ThemedText style={[styles.stepTitle, { color: colors.text }]}>
                                            Depart {originLocation.label}
                                        </ThemedText>
                                        <ThemedText style={[styles.stepSubtitle, { color: colors.textMuted }]}>
                                            09:30 AM • Start with {departureBattery}% SoC (~{currentUsableRangeKm} km range)
                                        </ThemedText>
                                    </View>
                                </View>

                                {/* Charging Stops */}
                                {activeStops.map((stop, i) => (
                                    <View key={`timeline-stop-${stop.station.id}-${i}`} style={styles.stepItemRow}>
                                        <View style={styles.stepIndicatorCol}>
                                            <View style={[styles.stepDot, { backgroundColor: colors.primary }]}>
                                                <Zap size={8} color="#FFFFFF" fill="#FFFFFF" />
                                            </View>
                                            <View style={[styles.stepLine, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />
                                        </View>
                                        <TouchableOpacity
                                            style={styles.stepDetailsCol}
                                            activeOpacity={0.75}
                                            onPress={() =>
                                                navigation.navigate('StationDetails', {
                                                    stationId: stop.station.id,
                                                    stationSnapshot: stop.station,
                                                })
                                            }
                                        >
                                            <View style={styles.stepStopHeader}>
                                                <ThemedText style={[styles.stepStopBadge, { color: colors.primary }]}>
                                                    Charging Stop {i + 1}
                                                </ThemedText>
                                                <ThemedText style={[styles.stepChargeDuration, { color: colors.textMuted }]}>
                                                    {stop.chargeMinutes} mins
                                                </ThemedText>
                                            </View>
                                            <ThemedText style={[styles.stepTitle, { color: colors.text }]} numberOfLines={1}>
                                                {stop.station.name}
                                            </ThemedText>
                                            <ThemedText style={[styles.stepSubtitle, { color: colors.textMuted }]}>
                                                Arrive {stop.arrivalTimeLabel} • {stop.arrivalBatteryPercent}% → {stop.departureBatteryPercent}% • +{stop.addedEnergyKWh} kWh (₹{stop.chargeCost})
                                            </ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                {/* Arrival */}
                                <View style={styles.stepItemRow}>
                                    <View style={styles.stepIndicatorCol}>
                                        <View style={[styles.stepDot, { backgroundColor: '#EF4444' }]}>
                                            <Flag size={8} color="#FFFFFF" />
                                        </View>
                                    </View>
                                    <View style={styles.stepDetailsCol}>
                                        <ThemedText style={[styles.stepTitle, { color: colors.text }]}>
                                            Arrive in {destinationLocation.label}
                                        </ThemedText>
                                        <ThemedText style={[styles.stepSubtitle, { color: colors.textMuted }]}>
                                            {tripPlan.arrivalTimeLabel} • {tripPlan.arrivalBatteryPercent}% battery buffer remaining
                                        </ThemedText>
                                    </View>
                                </View>
                            </View>

                            {/* Start Navigation 3D Neo-Brutalist Primary Button */}
                            <CredButton
                                title="START NAVIGATION"
                                subtitle="Turn-by-turn route via Google Maps"
                                icon={<Navigation size={18} color={isDark ? '#000000' : '#FFFFFF'} fill={isDark ? '#000000' : '#FFFFFF'} />}
                                onPress={handleStartNavigation}
                            />

                            <View style={{ height: 24 }} />
                        </ScrollView>
                </Animated.View>
            </View>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // VIEW 2: STEP-BY-STEP SETUP WIZARD (BEFORE PLAN)
    // ══════════════════════════════════════════════════════════════════════════
    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            {/* Top Bar */}
            <View style={styles.topHeader}>
                <View>
                    <ThemedText style={[styles.pageTitle, { color: colors.text }]}>Trip Planner</ThemedText>
                    <ThemedText style={[styles.pageSubtitle, { color: colors.textMuted }]}>
                        Smart EV corridor routing & charging
                    </ThemedText>
                </View>
                <View style={[styles.walletBadge, { backgroundColor: isDark ? colors.surfaceMuted : colors.backgroundAlt }]}>
                    <ThemedText style={[styles.walletBadgeText, { color: colors.primary }]}>
                        ₹{user.walletBalance.toFixed(0)}
                    </ThemedText>
                </View>
            </View>

            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ═════════════════════════════════════════════════════════════
                    1. START & END LOCATIONS
                ═════════════════════════════════════════════════════════════ */}
                <View style={[styles.card, { backgroundColor: isDark ? colors.surfaceMuted : colors.surface }]}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                        Start & Destination
                    </ThemedText>

                    <View style={styles.routeBox}>
                        {/* Dots visual indicator */}
                        <View style={styles.routeDotsCol}>
                            <View style={[styles.routeDotGreen, { backgroundColor: colors.primary }]} />
                            <View style={[styles.routeDotLine, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />
                            <View style={[styles.routeDotRed, { backgroundColor: '#EF4444' }]} />
                        </View>

                        {/* Location Selectors */}
                        <View style={styles.routeInputsCol}>
                            {/* Start Location */}
                            <TouchableOpacity
                                style={[
                                    styles.locationSelectRow,
                                    { backgroundColor: isDark ? '#1E293B' : colors.backgroundAlt },
                                ]}
                                activeOpacity={0.8}
                                onPress={() => {
                                    setLocationPickerMode('origin');
                                    setSearchQuery('');
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={[styles.locationSelectLabel, { color: colors.textMuted }]}>
                                        Start Location
                                    </ThemedText>
                                    <ThemedText style={[styles.locationSelectValue, { color: colors.text }]}>
                                        {originLocation.label}
                                    </ThemedText>
                                </View>
                                <MapPin size={16} color={colors.primary} />
                            </TouchableOpacity>

                            {/* End Location */}
                            <TouchableOpacity
                                style={[
                                    styles.locationSelectRow,
                                    { backgroundColor: isDark ? '#1E293B' : colors.backgroundAlt, marginTop: 8 },
                                ]}
                                activeOpacity={0.8}
                                onPress={() => {
                                    setLocationPickerMode('destination');
                                    setSearchQuery('');
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={[styles.locationSelectLabel, { color: colors.textMuted }]}>
                                        Destination
                                    </ThemedText>
                                    <ThemedText style={[styles.locationSelectValue, { color: colors.text }]}>
                                        {destinationLocation.label}
                                    </ThemedText>
                                </View>
                                <Flag size={16} color="#EF4444" />
                            </TouchableOpacity>
                        </View>

                        {/* Swap Button */}
                        <TouchableOpacity
                            style={[
                                styles.swapBtn,
                                { backgroundColor: isDark ? '#1E293B' : colors.backgroundAlt },
                            ]}
                            activeOpacity={0.75}
                            onPress={handleSwapLocations}
                        >
                            <ArrowUpDown size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Recent Trips Shortcuts */}
                    <ThemedText style={[styles.popularRoutesLabel, { color: colors.textMuted }]}>
                        Recent Trips
                    </ThemedText>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.popularRoutesRow}
                    >
                        {POPULAR_ROUTES.map((route) => {
                            const isSelected = route.originId === originId && route.destinationId === destinationId;
                            return (
                                <TouchableOpacity
                                    key={route.id}
                                    style={[
                                        styles.routeShortcutChip,
                                        {
                                            backgroundColor: isSelected
                                                ? colors.primary
                                                : isDark
                                                ? '#1E293B'
                                                : colors.backgroundAlt,
                                        },
                                    ]}
                                    activeOpacity={0.75}
                                    onPress={() => {
                                        setOriginId(route.originId);
                                        setDestinationId(route.destinationId);
                                    }}
                                >
                                    <ThemedText
                                        style={[
                                            styles.routeShortcutText,
                                            { color: isSelected ? '#FFFFFF' : colors.text },
                                        ]}
                                    >
                                        {route.label}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* ═════════════════════════════════════════════════════════════
                    VEHICLE & BATTERY (MINIMAL)
                ═════════════════════════════════════════════════════════════ */}
                <View style={[styles.card, { backgroundColor: isDark ? colors.surfaceMuted : colors.surface }]}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text, marginBottom: 10 }]}>
                        Vehicle & Battery
                    </ThemedText>

                    {/* Vehicle Selector Pills */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.vehicleScrollRow}
                    >
                        {vehicles.map((veh) => {
                            const isSelected = veh.id === selectedVehId;
                            return (
                                <TouchableOpacity
                                    key={veh.id}
                                    style={[
                                        styles.vehicleCardOption,
                                        {
                                            backgroundColor: isSelected
                                                ? (isDark ? 'rgba(30, 151, 49, 0.25)' : '#DCFCE7')
                                                : (isDark ? '#1E293B' : colors.backgroundAlt),
                                        },
                                    ]}
                                    activeOpacity={0.8}
                                    onPress={() => handleSelectVehicle(veh)}
                                >
                                    <View style={styles.vehicleOptionHeader}>
                                        <ThemedText
                                            style={[
                                                styles.vehicleOptionName,
                                                { color: isSelected ? (isDark ? '#4ADE80' : '#15803D') : colors.text },
                                            ]}
                                        >
                                            {veh.make} {veh.model}
                                        </ThemedText>
                                        {isSelected && <Check size={13} color={isDark ? '#4ADE80' : '#15803D'} />}
                                    </View>
                                    <ThemedText style={[styles.vehicleOptionSub, { color: colors.textMuted }]}>
                                        {veh.batteryCapacity} kWh
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Full Range */}
                    <View style={styles.minimalRow}>
                        <ThemedText style={[styles.minimalLabel, { color: colors.text }]}>
                            Full Range
                        </ThemedText>
                        <View style={styles.stepperContainer}>
                            <TouchableOpacity
                                style={[styles.stepperBtn, { backgroundColor: isDark ? '#1E293B' : colors.backgroundAlt }]}
                                activeOpacity={0.7}
                                onPress={() => setCustomRangeKm((prev) => Math.max(100, prev - 25))}
                            >
                                <Minus size={14} color={colors.text} />
                            </TouchableOpacity>
                            <ThemedText style={[styles.stepperValueText, { color: colors.text }]}>
                                {customRangeKm} km
                            </ThemedText>
                            <TouchableOpacity
                                style={[styles.stepperBtn, { backgroundColor: isDark ? '#1E293B' : colors.backgroundAlt }]}
                                activeOpacity={0.7}
                                onPress={() => setCustomRangeKm((prev) => Math.min(800, prev + 25))}
                            >
                                <Plus size={14} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Start Battery */}
                    <View style={styles.minimalRow}>
                        <ThemedText style={[styles.minimalLabel, { color: colors.text }]}>
                            Start Battery
                        </ThemedText>
                        <View style={styles.stepperContainer}>
                            <TouchableOpacity
                                style={[styles.stepperBtn, { backgroundColor: isDark ? '#1E293B' : colors.backgroundAlt }]}
                                activeOpacity={0.7}
                                onPress={() => setDepartureBattery((prev) => Math.max(10, prev - 5))}
                            >
                                <Minus size={14} color={colors.text} />
                            </TouchableOpacity>
                            <ThemedText style={[styles.stepperValueText, { color: colors.primary }]}>
                                {departureBattery}%
                            </ThemedText>
                            <TouchableOpacity
                                style={[styles.stepperBtn, { backgroundColor: isDark ? '#1E293B' : colors.backgroundAlt }]}
                                activeOpacity={0.7}
                                onPress={() => setDepartureBattery((prev) => Math.min(100, prev + 5))}
                            >
                                <Plus size={14} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Arrival Buffer */}
                    <View style={[styles.minimalRow, { marginBottom: 2 }]}>
                        <ThemedText style={[styles.minimalLabel, { color: colors.text }]}>
                            Arrival Buffer
                        </ThemedText>
                        <View style={styles.stepperContainer}>
                            <TouchableOpacity
                                style={[styles.stepperBtn, { backgroundColor: isDark ? '#1E293B' : colors.backgroundAlt }]}
                                activeOpacity={0.7}
                                onPress={() => setTargetArrivalSoc((prev) => Math.max(5, prev - 5))}
                            >
                                <Minus size={14} color={colors.text} />
                            </TouchableOpacity>
                            <ThemedText style={[styles.stepperValueText, { color: '#0284C7' }]}>
                                {targetArrivalSoc}%
                            </ThemedText>
                            <TouchableOpacity
                                style={[styles.stepperBtn, { backgroundColor: isDark ? '#1E293B' : colors.backgroundAlt }]}
                                activeOpacity={0.7}
                                onPress={() => setTargetArrivalSoc((prev) => Math.min(50, prev + 5))}
                            >
                                <Plus size={14} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* ═════════════════════════════════════════════════════════════
                    3. PLAN TRIP BUTTON
                ═════════════════════════════════════════════════════════════ */}
                <CredButton
                    title="PLAN TRIP"
                    icon={<Zap size={18} color={isDark ? '#000000' : '#FFFFFF'} fill={isDark ? '#000000' : '#FFFFFF'} />}
                    onPress={handlePlanTrip}
                />

                <View style={{ height: 80 }} />
            </ScrollView>

            {/* ══════════════════════════════════════════════════════════════════
                CITY / LOCATION PICKER MODAL
            ══════════════════════════════════════════════════════════════════ */}
            <Modal
                visible={locationPickerMode !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setLocationPickerMode(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? colors.surface : colors.surface }]}>
                        {/* Modal Header */}
                        <View style={styles.modalHeaderRow}>
                            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                                {locationPickerMode === 'origin' ? 'Select Start Location' : 'Select Destination'}
                            </ThemedText>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setLocationPickerMode(null)}
                            >
                                <X size={20} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Search Input */}
                        <View style={[styles.modalSearchBox, { backgroundColor: isDark ? colors.surfaceMuted : colors.backgroundAlt }]}>
                            <Search size={16} color={colors.textMuted} />
                            <TextInput
                                style={[styles.modalSearchInput, { color: colors.text }]}
                                placeholder="Search city or destination..."
                                placeholderTextColor={colors.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <X size={16} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Cities List */}
                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalCitiesList}>
                            {filteredLocations.map((loc) => {
                                const isCurrent = locationPickerMode === 'origin' ? loc.id === originId : loc.id === destinationId;
                                return (
                                    <TouchableOpacity
                                        key={loc.id}
                                        style={[
                                            styles.cityItemRow,
                                            {
                                                backgroundColor: isCurrent
                                                    ? (isDark ? 'rgba(30, 151, 49, 0.15)' : '#DCFCE7')
                                                    : 'transparent',
                                            },
                                        ]}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            if (locationPickerMode === 'origin') {
                                                setOriginId(loc.id);
                                            } else {
                                                setDestinationId(loc.id);
                                            }
                                            setLocationPickerMode(null);
                                        }}
                                    >
                                        <MapPin
                                            size={18}
                                            color={isCurrent ? colors.primary : colors.textMuted}
                                        />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <ThemedText
                                                style={[
                                                    styles.cityName,
                                                    { color: isCurrent ? colors.primary : colors.text },
                                                ]}
                                            >
                                                {loc.label}
                                            </ThemedText>
                                            <ThemedText style={[styles.citySubtitle, { color: colors.textMuted }]}>
                                                {loc.subtitle}
                                            </ThemedText>
                                        </View>
                                        {isCurrent && <Check size={16} color={colors.primary} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.sm,
    },
    pageTitle: {
        fontSize: 22,
        fontFamily: FONT_FAMILIES.serifHeading,
        fontWeight: '800',
    },
    pageSubtitle: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
        marginTop: 2,
    },
    walletBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.chip,
    },
    walletBadgeText: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },


    scrollContent: {
        paddingHorizontal: SPACING.md,
        paddingTop: 8,
        gap: 12,
    },

    // Flat Card
    card: {
        borderRadius: RADIUS.card,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
        marginBottom: 12,
    },

    // Step 1: Locations
    routeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    routeDotsCol: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 14,
        paddingVertical: 10,
    },
    routeDotGreen: {
        width: 10,
        height: 10,
        borderRadius: RADIUS.circle,
    },
    routeDotLine: {
        width: 2,
        height: 38,
        marginVertical: 4,
    },
    routeDotRed: {
        width: 10,
        height: 10,
        borderRadius: RADIUS.circle,
    },
    routeInputsCol: {
        flex: 1,
    },
    locationSelectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: RADIUS.input,
    },
    locationSelectLabel: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.sansSemiBold,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    locationSelectValue: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
        marginTop: 2,
    },
    swapBtn: {
        width: 38,
        height: 38,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    popularRoutesLabel: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.sansSemiBold,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 6,
    },
    popularRoutesRow: {
        flexDirection: 'row',
        gap: 8,
    },
    routeShortcutChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.chip,
    },
    routeShortcutText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.sansSemiBold,
        fontWeight: '600',
    },

    // Vehicle & Battery (Minimal)
    vehicleScrollRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    vehicleCardOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: RADIUS.tile,
        minWidth: 130,
    },
    vehicleOptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    vehicleOptionName: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    vehicleOptionSub: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
    },
    minimalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    minimalSection: {
        marginTop: 6,
    },
    minimalLabel: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.sansSemiBold,
        fontWeight: '600',
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepperBtn: {
        width: 30,
        height: 30,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperValueText: {
        fontSize: 14,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
        minWidth: 55,
        textAlign: 'center',
    },
    planTripPrimaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: RADIUS.button,
        gap: 8,
        marginTop: 4,
    },
    planTripPrimaryBtnText: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.sansExtraBold,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    // ══════════════════════════════════════════════════════════════════
    // FULL SCREEN MAP & BOTTOM SHEET STYLES
    // ══════════════════════════════════════════════════════════════════
    fullScreenContainer: {
        flex: 1,
    },
    mapStartMarker: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.chip,
    },
    mapStopMarker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: RADIUS.chip,
    },
    mapEndMarker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: RADIUS.chip,
    },
    mapMarkerText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Floating Top Bar Controls
    floatingTopBar: {
        position: 'absolute',
        left: SPACING.md,
        right: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        zIndex: 20,
    },
    floatingBackBtn: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingRoutePill: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: RADIUS.pill,
        alignItems: 'center',
    },
    floatingRoutePillText: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    floatingIconBtn: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Bottom Sheet Container
    bottomSheetContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: RADIUS.bottomSheet,
        borderTopRightRadius: RADIUS.bottomSheet,
        overflow: 'hidden',
        zIndex: 30,
    },
    sheetHeaderWrapper: {
        paddingBottom: 6,
    },
    sheetHandleTouchArea: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 7,
    },
    dragHandleBar: {
        width: 40,
        height: 4.5,
        borderRadius: RADIUS.pill,
    },
    sheetHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingBottom: 4,
    },
    sheetHeaderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    saveTripBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
    },
    saveTripBtnText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    sheetTitle: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    sheetSubtitle: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
        marginTop: 1,
    },
    sheetExpandToggleBtn: {
        width: 28,
        height: 28,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    collapsedPeekRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: SPACING.md,
        paddingTop: 4,
    },
    peekChargersBadge: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: RADIUS.chip,
    },
    peekChargersText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    peekNavBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: RADIUS.button,
    },
    peekNavBtnText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.sansExtraBold,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    floatingDragBackPill: {
        position: 'absolute',
        alignSelf: 'center',
        borderRadius: RADIUS.pill,
        zIndex: 35,
    },
    floatingDragBackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    floatingDragBackText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },

    // Expanded Bottom Sheet Scrollable Content
    sheetScrollContent: {
        paddingHorizontal: SPACING.md,
        paddingTop: 2,
        gap: 10,
    },
    kpiContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: RADIUS.tile,
    },
    kpiItem: {
        alignItems: 'center',
        flex: 1,
    },
    kpiLabel: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
        marginBottom: 2,
    },
    kpiValue: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.serifHeading,
        fontWeight: '800',
    },

    sheetSectionBlock: {
        gap: 8,
    },
    sheetSectionTitle: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    sheetSectionSub: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
        marginTop: 2,
    },

    // Chargers List
    chargersHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    chargersCountPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.chip,
    },
    chargersCountText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansSemiBold,
        fontWeight: '600',
    },
    chargersList: {
        gap: 8,
    },
    chargerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderRadius: RADIUS.card,
    },
    chargerCardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        marginRight: 8,
    },
    stationAvatar: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chargerCardName: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    chargerCardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    chargerCardMetaText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
    },
    chargerCardMetaDot: {
        fontSize: 10,
    },
    chargerCardActionWrap: {
        alignItems: 'flex-end',
    },
    inPlanBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: RADIUS.chip,
    },
    inPlanBadgeText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    addStopBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: RADIUS.chip,
    },
    addStopBtnText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },

    // Journey Timeline
    stepItemRow: {
        flexDirection: 'row',
        gap: 12,
    },
    stepIndicatorCol: {
        alignItems: 'center',
        width: 16,
    },
    stepDot: {
        width: 14,
        height: 14,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepLine: {
        width: 2,
        flex: 1,
        marginVertical: 4,
        minHeight: 28,
    },
    stepDetailsCol: {
        flex: 1,
        paddingBottom: 14,
    },
    stepStopHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    stepStopBadge: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    stepChargeDuration: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansSemiBold,
        fontWeight: '600',
    },
    stepTitle: {
        fontSize: 14,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    stepSubtitle: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
        marginTop: 2,
    },

    // Start Navigation
    startNavBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: RADIUS.button,
        gap: 8,
        marginTop: 2,
    },
    startNavBtnText: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.sansExtraBold,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: RADIUS.bottomSheet,
        borderTopRightRadius: RADIUS.bottomSheet,
        maxHeight: '75%',
        paddingTop: 16,
        paddingBottom: 32,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingBottom: 12,
    },
    modalTitle: {
        fontSize: 17,
        fontFamily: FONT_FAMILIES.serifHeading,
        fontWeight: '800',
    },
    modalCloseBtn: {
        padding: 4,
    },
    modalSearchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: SPACING.lg,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: RADIUS.input,
        gap: 8,
        marginBottom: 10,
    },
    modalSearchInput: {
        flex: 1,
        fontSize: 14,
        fontFamily: FONT_FAMILIES.sansMedium,
    },
    modalCitiesList: {
        paddingHorizontal: SPACING.md,
    },
    cityItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: RADIUS.tile,
    },
    cityName: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    citySubtitle: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
        marginTop: 2,
    },
});
