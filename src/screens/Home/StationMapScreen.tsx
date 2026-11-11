import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
    Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import {
    ArrowRight,
    Bell,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Coffee,
    MapPin,
    MapPinned,
    Mic,
    Search,
    ShoppingBag,
    Sparkles,
    Star,
    Wifi,
    X,
    Zap,
    Navigation,
    Wallet,
    Plus,
    Plug,
    User,
    Filter,
} from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { DcPinIcon } from '../../components/DcPinIcon';
import { CarPinIcon } from '../../components/CarPinIcon';
import { Ccs2Icon } from '../../components/Ccs2Icon';
import { Type2Icon } from '../../components/Type2Icon';
import { ChademoIcon } from '../../components/ChademoIcon';
import { Neo3DMorphIcon } from '../../components/Neo3DMorphIcon';
import { SlidersHorizontal } from 'lucide-react-native';
import { DEFAULT_MAP_FILTERS, MapFilterSheet, MapFilterState, stationMatchesMapFilters } from '../../components/MapFilterSheet';
import {
    Connector,
    Station,
    getRecommendedConnector,
} from '../../constants/Stations';
import { FONT_FAMILIES, FONTS, RADIUS, SHADOWS, SPACING } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';
import { useIndiaChargingStations } from '../../hooks/useIndiaChargingStations';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
    hasGoogleMapsGeocodeKey,
    reverseGeocodeLocation,
} from '../../services/googleMaps';

const DARK_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#1A1A1A' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#A0C0A8' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1A1A1A' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2C2C2C' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#202020' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#121212' }] },
];

const filterOptions = [
    { id: 'Fastest', label: 'Fastest', icon: 'bolt-lightning' },
    { id: 'Cheapest', label: 'Cheapest', icon: 'tags' },
    { id: 'Available', label: 'Available', icon: 'circle-check' },
    { id: '24/7', label: 'Open 24/7', icon: 'clock' },
    { id: 'Amenities', label: 'Amenities', icon: 'mug-hot' },
];

const UK_INITIAL_REGION = {
    latitude: 11.0168,
    longitude: 76.9558,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
};

function toRadians(value: number) {
    return (value * Math.PI) / 180;
}

function calculateDistanceKm(
    latitudeA: number,
    longitudeA: number,
    latitudeB: number,
    longitudeB: number
) {
    const earthRadiusKm = 6371;
    const deltaLatitude = toRadians(latitudeB - latitudeA);
    const deltaLongitude = toRadians(longitudeB - longitudeA);
    const originLatitude = toRadians(latitudeA);
    const targetLatitude = toRadians(latitudeB);
    const a =
        Math.sin(deltaLatitude / 2) ** 2 +
        Math.cos(originLatitude) *
            Math.cos(targetLatitude) *
            Math.sin(deltaLongitude / 2) ** 2;

    return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function uniqueStationsById(stations: Station[]) {
    const seenStationIds = new Set<string>();

    return stations.filter((station) => {
        if (seenStationIds.has(station.id)) {
            return false;
        }

        seenStationIds.add(station.id);
        return true;
    });
}

function AmenityIcon({ amenity, color }: { amenity: string; color: string }) {
    if (amenity === 'Cafe' || amenity === 'Coffee') {
        return <Coffee size={14} color={color} />;
    }

    if (amenity === 'WiFi') {
        return <Wifi size={14} color={color} />;
    }

    return <ShoppingBag size={14} color={color} />;
}

function getConnectorStatusTheme(
    status: Connector['status'],
    colors: ReturnType<typeof useAppTheme>['colors']
) {
    if (status === 'Available') {
        return {
            backgroundColor: colors.primarySoft,
            iconColor: colors.primary,
            textColor: colors.primaryStrong,
        };
    }

    if (status === 'Busy') {
        return {
            backgroundColor: 'rgba(204, 146, 30, 0.14)',
            iconColor: colors.accent,
            textColor: colors.accent,
        };
    }

    return {
        backgroundColor: 'rgba(200, 79, 71, 0.12)',
        iconColor: colors.error,
        textColor: colors.error,
    };
}

type StationDemandSnapshot = {
    station: Station;
    connector: Connector;
    currentPrice: number;
    availableCount: number;
    totalCount: number;
    waitMinutes: number | null;
};

type StationDemandInsight = {
    currentPriceLabel: string;
    availabilityLabel: string;
    occupancyLabel: string;
    waitLabel: string;
    notification: string;
    recommendation: string;
    compactSummary: string;
    actionLabel: string;
    shouldWarn: boolean;
    alternativeStation?: StationDemandSnapshot;
};

function getStationDemandSnapshot(
    station: Station,
    preferredType?: Connector['type']
): StationDemandSnapshot {
    const connector = getRecommendedConnector(station, preferredType);
    const availableCount = station.connectors.filter(
        (item) => item.status === 'Available'
    ).length;
    const busyWaits = station.connectors
        .filter((item) => item.status === 'Busy' && item.waitMinutes > 0)
        .map((item) => item.waitMinutes);
    const waitMinutes =
        availableCount > 0 ? 0 : busyWaits.length > 0 ? Math.min(...busyWaits) : null;

    return {
        station,
        connector,
        currentPrice: connector.pricePerKWh,
        availableCount,
        totalCount: station.connectors.length,
        waitMinutes,
    };
}

function formatPriceLabel(price: number) {
    return `$${price.toFixed(2)}/kWh`;
}

function formatWaitLabel(
    waitMinutes: number | null,
    availableCount: number
) {
    if (availableCount > 0) {
        return 'Ready now';
    }

    if (waitMinutes === null) {
        return 'No wait estimate';
    }

    return `${waitMinutes} min wait`;
}

function buildStationDemandInsight(
    station: Station,
    stations: Station[],
    preferredType?: Connector['type']
): StationDemandInsight {
    const current = getStationDemandSnapshot(station, preferredType);
    const alternativeStation = stations
        .filter((item) => item.id !== station.id)
        .map((item) => getStationDemandSnapshot(item, preferredType))
        .filter(
            (item) =>
                item.currentPrice + 0.02 < current.currentPrice &&
                (item.availableCount > 0 || item.waitMinutes !== null)
        )
        .sort((left, right) => {
            if (left.availableCount !== right.availableCount) {
                return right.availableCount - left.availableCount;
            }

            if (left.currentPrice !== right.currentPrice) {
                return left.currentPrice - right.currentPrice;
            }

            const leftWait = left.waitMinutes ?? Number.MAX_SAFE_INTEGER;
            const rightWait = right.waitMinutes ?? Number.MAX_SAFE_INTEGER;

            if (leftWait !== rightWait) {
                return leftWait - rightWait;
            }

            return left.station.etaMinutes - right.station.etaMinutes;
        })[0];

    const priceGap = alternativeStation
        ? current.currentPrice - alternativeStation.currentPrice
        : 0;
    const highDemand =
        station.occupancyLabel === 'Busy' ||
        current.availableCount === 0 ||
        (current.waitMinutes ?? 0) >= 8 ||
        priceGap >= 0.05;
    const moderateDemand =
        !highDemand &&
        (station.occupancyLabel === 'Balanced' ||
            current.availableCount <= 1 ||
            (current.waitMinutes ?? 0) > 0);

    let notification = 'Price is stable for the current demand at this location.';
    let recommendation =
        'AI suggests starting now. Availability and wait time look favorable.';
    let compactSummary = `${formatPriceLabel(current.currentPrice)} • ${formatWaitLabel(
        current.waitMinutes,
        current.availableCount
    )}`;
    let actionLabel = 'Charge here';

    if (highDemand) {
        notification = 'High price due to high demand at this location.';

        if (alternativeStation && priceGap >= 0.03) {
            recommendation = `AI suggests moving to ${alternativeStation.station.name} for ${formatPriceLabel(
                alternativeStation.currentPrice
            )} with ${formatWaitLabel(
                alternativeStation.waitMinutes,
                alternativeStation.availableCount
            ).toLowerCase()}.`;
            compactSummary = `Try nearby • ${formatPriceLabel(
                alternativeStation.currentPrice
            )}`;
            actionLabel = 'Move to cheaper station';
        } else if ((current.waitMinutes ?? 0) > 0) {
            recommendation = `AI suggests waiting about ${current.waitMinutes} min for demand to reduce before starting.`;
            compactSummary = `Wait • ${formatWaitLabel(
                current.waitMinutes,
                current.availableCount
            )}`;
            actionLabel = 'Wait a bit';
        } else {
            recommendation =
                'AI suggests charging now only if you need an immediate top-up.';
            compactSummary = `Urgent only • ${formatPriceLabel(current.currentPrice)}`;
            actionLabel = 'Charge only if urgent';
        }
    } else if (moderateDemand) {
        notification = 'Demand is building at this location, so pricing may fluctuate.';

        if (alternativeStation && priceGap >= 0.03) {
            recommendation = `AI suggests comparing ${alternativeStation.station.name} before starting to save on price.`;
            compactSummary = `Compare nearby • ${formatPriceLabel(
                alternativeStation.currentPrice
            )}`;
            actionLabel = 'Check other stations';
        } else {
            recommendation =
                'AI suggests starting now. Pricing and availability are still manageable.';
            compactSummary = `Start now • ${formatPriceLabel(current.currentPrice)}`;
            actionLabel = 'Charge here';
        }
    }

    return {
        currentPriceLabel: formatPriceLabel(current.currentPrice),
        availabilityLabel: `${current.availableCount}/${current.totalCount} ready`,
        occupancyLabel: `${station.occupancyLabel} occupancy`,
        waitLabel: formatWaitLabel(current.waitMinutes, current.availableCount),
        notification,
        recommendation,
        compactSummary,
        actionLabel,
        shouldWarn: highDemand,
        alternativeStation,
    };
}

export default function StationMapScreen({ navigation }: any) {
    const handleLocateMe = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            const location = await Location.getCurrentPositionAsync({});
            setUserLocation(location.coords);
            mapRef.current?.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            }, 1000);
        } catch (e) {
            console.log('Location error:', e);
        }
    };
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { selectedVehicle, user, topUpWallet } = useVehicles();
    const { stations: allStations } = useIndiaChargingStations();
    const mapRef = useRef<MapView>(null);

    const [searchText, setSearchText] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

    const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
    const [filterCriteria, setFilterCriteria] = useState<MapFilterState>(DEFAULT_MAP_FILTERS);
    const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
    const [mapRegion, setMapRegion] = useState(UK_INITIAL_REGION);
    const [resolvedAddresses, setResolvedAddresses] = useState<Record<string, string>>({});

    // Auto-fetch location once on mount and center map immediately
    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;

                // 1. Immediately center on last known position if available
                const lastKnown = await Location.getLastKnownPositionAsync({});
                if (lastKnown && isMounted) {
                    setUserLocation(lastKnown.coords);
                    const fastRegion = {
                        latitude: lastKnown.coords.latitude,
                        longitude: lastKnown.coords.longitude,
                        latitudeDelta: 0.04,
                        longitudeDelta: 0.04,
                    };
                    setMapRegion(fastRegion);
                    mapRef.current?.animateToRegion(fastRegion, 400);
                }

                // 2. Fetch fresh GPS fix and smoothly animate
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                if (location && isMounted) {
                    setUserLocation(location.coords);
                    const region = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.04,
                        longitudeDelta: 0.04,
                    };
                    setMapRegion(region);
                    mapRef.current?.animateToRegion(region, 800);
                }
            } catch (e) {
                console.log('Auto-locate error:', e);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, []);

    const visibleStations = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase();
        const matchingStations = uniqueStationsById(
            allStations.filter((station: Station) => {
                let match = true;
                
                // 1. Text Search
                if (normalizedSearch) {
                    const searchMatch = station.name.toLowerCase().includes(normalizedSearch) ||
                                        station.address.toLowerCase().includes(normalizedSearch) ||
                                        station.tagline.toLowerCase().includes(normalizedSearch);
                    if (!searchMatch) match = false;
                }

                // 2. Charger Type (from advanced FilterScreen)
                if (filterCriteria.chargerTypes.length > 0) {
                    const hasDC = station.connectors.some(c => c.type === 'CCS2' || c.type === 'CHAdeMO');
                    const hasAC = station.connectors.some(c => c.type === 'Type 2');
                    const wantsDC = filterCriteria.chargerTypes.includes('DC');
                    const wantsAC = filterCriteria.chargerTypes.includes('AC');
                    if (!( (wantsDC && hasDC) || (wantsAC && hasAC) )) match = false;
                }

                // 3. Connector Type (from advanced FilterScreen)
                if (filterCriteria.connectorTypes.length > 0) {
                    const hasConnector = station.connectors.some(c => {
                        // Map the UI string ('Type II', 'CHAdeMo') to the data type ('Type 2', 'CHAdeMO')
                        let mappedType = c.type as string;
                        if (c.type === 'Type 2') mappedType = 'Type II';
                        if (c.type === 'CHAdeMO') mappedType = 'CHAdeMo';
                        return filterCriteria.connectorTypes.includes(mappedType) || filterCriteria.connectorTypes.includes(c.type);
                    });
                    if (!hasConnector) match = false;
                }

                // 4. Peak Power (from advanced FilterScreen)
                if (filterCriteria.peakPower !== 'Any') {
                    const maxPower = Math.max(...station.connectors.map(c => c.power));
                    if (filterCriteria.peakPower === '<22kW' && maxPower >= 22) match = false;
                    if (filterCriteria.peakPower === '60kW+' && maxPower < 50) match = false;
                    if (filterCriteria.peakPower === '120kW+' && maxPower < 120) match = false;
                }

                // 5. Tariff Range (from advanced FilterScreen)
                const hasValidTariff = station.connectors.some(c => c.pricePerKWh >= filterCriteria.tariffRange[0] && c.pricePerKWh <= filterCriteria.tariffRange[1]);
                if (!hasValidTariff) match = false;


                // 7. Charger AC or DC Filter
                if (filterCriteria.chargerTypeFilter !== 'Any') {
                    if (filterCriteria.chargerTypeFilter === 'DC') {
                        const hasDC = station.connectors.some(
                            c => c.currentType === 'DC' || c.type === 'CCS2' || c.type === 'CHAdeMO' || c.power >= 50
                        );
                        if (!hasDC) match = false;
                    } else if (filterCriteria.chargerTypeFilter === 'AC') {
                        const hasAC = station.connectors.some(
                            c => c.currentType === 'AC' || c.type === 'Type 2' || c.power < 50
                        );
                        if (!hasAC) match = false;
                    }
                }

                // 8. Brand Filter
                if (filterCriteria.selectedBrands.length > 0) {
                    const matchesBrand = filterCriteria.selectedBrands.some(b =>
                        station.name.toLowerCase().includes(b.toLowerCase()) ||
                        station.tagline.toLowerCase().includes(b.toLowerCase())
                    );
                    if (!matchesBrand) match = false;
                }

                // 9. Amenities filter
                if (!stationMatchesMapFilters({ ...station, connectors: [] , name: '', tagline: '' }, { ...DEFAULT_MAP_FILTERS, amenities: filterCriteria.amenities })) match = false;

                // 6. Quick filter chips — actually filter (not just sort)
                if (activeFilter === 'Fastest') {
                    // Show only stations that have fast chargers (50kW+)
                    const hasFastCharger = station.connectors.some(
                        c => c.power >= 50 || c.type === 'CCS2' || c.type === 'CHAdeMO'
                    );
                    if (!hasFastCharger) match = false;
                } else if (activeFilter === 'Cheapest') {
                    // Show only stations with economical rates (<= 16/kWh)
                    const hasCheapRate = station.connectors.some(
                        c => c.pricePerKWh <= 16
                    );
                    if (!hasCheapRate) match = false;
                } else if (activeFilter === 'Available') {
                    // Show only stations that have at least one available connector
                    const hasAvailable = station.connectors.some(c => c.status === 'Available');
                    if (!hasAvailable) match = false;
                } else if (activeFilter === '24/7') {
                    // Show only stations open 24/7
                    if (station.openTime !== '24/7') match = false;
                } else if (activeFilter === 'Amenities') {
                    // Show only stations that have amenities
                    if (!station.amenities || station.amenities.length === 0) match = false;
                }

                return match;
            })
        );

        const enrichedStations = matchingStations.map((station) => {
            const refLat = userLocation ? userLocation.latitude : mapRegion.latitude;
            const refLng = userLocation ? userLocation.longitude : mapRegion.longitude;

            const distanceKm = calculateDistanceKm(
                refLat,
                refLng,
                station.latitude,
                station.longitude
            );

            return {
                ...station,
                distanceKm: Number(distanceKm.toFixed(1)),
                etaMinutes: Math.max(3, Math.round(distanceKm * 1.6)),
            };
        });

        const sortedStations = [...enrichedStations];

        // Sort by the active quick filter for best-first ordering
        if (activeFilter === 'Fastest') {
            sortedStations.sort((a, b) => {
                const bestA = getRecommendedConnector(a, selectedVehicle?.connectorType).power;
                const bestB = getRecommendedConnector(b, selectedVehicle?.connectorType).power;
                return bestB - bestA || a.distanceKm - b.distanceKm;
            });
        } else if (activeFilter === 'Cheapest') {
            sortedStations.sort((a, b) => {
                const bestA = Math.min(...a.connectors.map(c => c.pricePerKWh));
                const bestB = Math.min(...b.connectors.map(c => c.pricePerKWh));
                return bestA - bestB || a.distanceKm - b.distanceKm;
            });
        } else if (activeFilter === 'Available') {
            sortedStations.sort((a, b) => {
                const availableA = a.connectors.filter(
                    (connector) => connector.status === 'Available'
                ).length;
                const availableB = b.connectors.filter(
                    (connector) => connector.status === 'Available'
                ).length;
                return availableB - availableA || a.distanceKm - b.distanceKm;
            });
        } else if (activeFilter === '24/7') {
            sortedStations.sort((a, b) => {
                const fullTimeA = a.openTime === '24/7' ? 1 : 0;
                const fullTimeB = b.openTime === '24/7' ? 1 : 0;
                return fullTimeB - fullTimeA || a.distanceKm - b.distanceKm;
            });
        } else if (activeFilter === 'Amenities') {
            sortedStations.sort((a, b) => {
                return b.amenities.length - a.amenities.length || b.rating - a.rating || a.distanceKm - b.distanceKm;
            });
        } else {
            sortedStations.sort((a, b) => a.distanceKm - b.distanceKm);
        }

        return sortedStations;
    }, [activeFilter, allStations, mapRegion.latitude, mapRegion.longitude, searchText, selectedVehicle?.connectorType, userLocation, filterCriteria]);

    const nearbyStations = useMemo(
        () => visibleStations.slice(0, 5),
        [visibleStations]
    );

    const selectedStation =
        visibleStations.find((station: Station) => station.id === selectedStationId) ??
        nearbyStations[0] ??
        visibleStations[0] ??
        allStations[0];

    const stationsForAddressResolution = useMemo(() => {
        if (!selectedStation) {
            return nearbyStations;
        }

        if (nearbyStations.some((station) => station.id === selectedStation.id)) {
            return nearbyStations;
        }

        return [selectedStation, ...nearbyStations];
    }, [nearbyStations, selectedStation]);

    const selectedAddress = selectedStation
        ? resolvedAddresses[selectedStation.id] ?? selectedStation.address
        : '';
    const recommendedConnector = selectedStation
        ? getRecommendedConnector(selectedStation, selectedVehicle?.connectorType)
        : null;
    const availableConnectorCount = selectedStation
        ? selectedStation.connectors.filter(
              (connector) => connector.status === 'Available'
          ).length
        : 0;
    const isAlwaysOpen = selectedStation?.openTime === '24/7';
    const stationHours = selectedStation
        ? isAlwaysOpen
            ? 'Open 24/7'
            : `${selectedStation.openTime} - ${selectedStation.closeTime}`
        : '';
    const stationInsights = useMemo(() => {
        const nextInsights = new Map<string, StationDemandInsight>();

        visibleStations.forEach((station) => {
            nextInsights.set(
                station.id,
                buildStationDemandInsight(
                    station,
                    visibleStations,
                    selectedVehicle?.connectorType
                )
            );
        });

        return nextInsights;
    }, [selectedVehicle?.connectorType, visibleStations]);
    const selectedInsight = selectedStation
        ? stationInsights.get(selectedStation.id)
        : undefined;
    const tabBarOffset = 72 + insets.bottom;


    useEffect(() => {
        if (!selectedStation && visibleStations[0]) {
            setSelectedStationId(visibleStations[0].id);
            return;
        }

        if (!selectedStation) {
            return;
        }

        setSelectedStationId((currentStationId) =>
            currentStationId ?? selectedStation.id
        );
    }, [selectedStation, visibleStations]);



    useEffect(() => {
        if (!hasGoogleMapsGeocodeKey()) {
            return;
        }

        let isCancelled = false;
        const unresolvedStations = stationsForAddressResolution.filter(
            (station) => !resolvedAddresses[station.id]
        );

        if (unresolvedStations.length === 0) {
            return;
        }

        const fetchAddresses = async () => {
            try {
                await Promise.all(
                    unresolvedStations.map(async (station) => {
                        const address = await reverseGeocodeLocation(
                            station.latitude,
                            station.longitude
                        );

                        if (!address || isCancelled) {
                            return;
                        }

                        setResolvedAddresses((currentAddresses) => {
                            if (currentAddresses[station.id]) {
                                return currentAddresses;
                            }

                            return {
                                ...currentAddresses,
                                [station.id]: address,
                            };
                        });
                    })
                );
            } catch {
                return;
            }
        };

        fetchAddresses();

        return () => {
            isCancelled = true;
        };
    }, [resolvedAddresses, stationsForAddressResolution]);

    const handleSelectStation = (
        station: Station,
        options?: { openSheet?: boolean }
    ) => {
        setSelectedStationId(station.id);

        if (options?.openSheet) {
            navigation.navigate('StationDetails', { 
                stationId: station.id, 
                stationSnapshot: station 
            });
        }

        mapRef.current?.animateToRegion(
            {
                latitude: station.latitude,
                longitude: station.longitude,
                latitudeDelta: 0.18,
                longitudeDelta: 0.18,
            },
            280
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                initialRegion={UK_INITIAL_REGION}
                onRegionChangeComplete={setMapRegion}
                customMapStyle={Platform.OS === 'android' && isDark ? DARK_MAP_STYLE : undefined}
                userInterfaceStyle={isDark ? 'dark' : 'light'}
                showsUserLocation={true}
                showsMyLocationButton={false}
            >
                {visibleStations.map((station: Station) => {
                    const isSelected = station.id === selectedStation?.id;

                    return (
                        <Marker
                            key={station.id}
                            coordinate={{
                                latitude: station.latitude,
                                longitude: station.longitude,
                            }}
                            anchor={{ x: 0.5, y: 0.95 }}
                            zIndex={isSelected ? 999 : 1}
                            onPress={() =>
                                handleSelectStation(station, { openSheet: true })
                            }
                        >
                            <DcPinIcon
                                size={isSelected ? 44 : 36}
                                color={isSelected ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#141418' : '#000000')}
                                iconColor={isSelected ? (isDark ? '#000000' : '#FFFFFF') : '#FFFFFF'}
                                stroke={isDark ? (isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)') : (isSelected ? '#000000' : 'rgba(255, 255, 255, 0.35)')}
                                strokeWidth={isSelected ? 1.5 : 1}
                            />
                        </Marker>
                    );
                })}
                {userLocation && (
                    <Marker
                        key={`user-loc-${userLocation.latitude}-${userLocation.longitude}`}
                        coordinate={userLocation}
                        anchor={{ x: 0.5, y: 0.5 }}
                        zIndex={999}
                        tracksViewChanges={true}
                    >
                        <View style={{ width: 56, height: 56 }}><CarPinIcon size={56} /></View>
                    </Marker>
                )}
            </MapView>

            <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
                <View style={styles.topOverlay} pointerEvents="box-none">
                    <View
                        style={[
                            styles.searchBarWrapper,
                            {
                                backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                            },
                        ]}
                    >
                        <Search size={20} color={colors.textSoft} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search here"
                            placeholderTextColor={colors.textSoft}
                            value={searchText}
                            onChangeText={(value) => {
                                setSearchText(value);
                            }}
                        />
                        <View style={styles.searchActions}>
                            <TouchableOpacity style={styles.searchActionIcon}>
                                <Mic size={18} color={colors.textSoft} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.profileWrapper}
                                onPress={() => navigation.navigate('Profile' as never)}
                            >
                                <View style={[styles.profileCircle, { backgroundColor: colors.primarySoft }]}>
                                    <User size={14} color={colors.primary} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.filterScroll}
                        contentContainerStyle={styles.filterContainer}
                        pointerEvents="auto"
                    >
                        {filterOptions.map((filter) => {
                            const isActive = activeFilter === filter.id;

                            return (
                                <TouchableOpacity
                                    key={filter.id}
                                    activeOpacity={0.82}
                                    style={[
                                        styles.filterChip,
                                        isActive
                                            ? {
                                                  backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                                  borderColor: isDark ? '#FFFFFF' : '#000000',
                                                  borderWidth: 1.5,
                                                  borderBottomWidth: 3.5,
                                                  borderBottomColor: isDark ? '#A0A0A8' : '#222228',
                                                  transform: [{ translateY: 1.5 }],
                                              }
                                            : {
                                                  backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.10)',
                                                  borderWidth: 1,
                                                  borderBottomWidth: 2,
                                                  borderBottomColor: isDark ? '#050508' : '#D0D0D5',
                                              },
                                    ]}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }
                                        setActiveFilter((prev) => (prev === filter.id ? '' : filter.id));
                                    }}
                                >
                                    <Neo3DMorphIcon
                                        name={filter.id.toLowerCase()}
                                        isSelected={isActive}
                                        size={12}
                                        activeColor={isDark ? '#000000' : '#FFFFFF'}
                                        inactiveColor={isDark ? '#FFFFFF' : '#1C1C1E'}
                                        style={{ marginRight: 6 }}
                                    />
                                    <ThemedText
                                        style={{
                                            color: isActive
                                                ? (isDark ? '#000000' : '#FFFFFF')
                                                : (isDark ? '#FFFFFF' : '#000000'),
                                            fontSize: 12,
                                            fontWeight: isActive ? '800' : '600',
                                            fontFamily: isActive
                                                ? FONT_FAMILIES.sansExtraBold
                                                : FONT_FAMILIES.sansSemiBold,
                                        }}
                                    >
                                        {filter.label}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Wallet Balance Chip in Right Corner below Filters */}
                    <View style={styles.walletFilterRow} pointerEvents="box-none">
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.10)',
                                    borderWidth: 1,
                                    borderBottomWidth: 2,
                                    borderBottomColor: isDark ? '#050508' : '#D0D0D5',
                                },
                            ]}
                            onPress={() => navigation.navigate('Profile' as never)}
                        >
                            <Wallet
                                size={13}
                                color={isDark ? '#FFFFFF' : '#000000'}
                                style={{ marginRight: 6 }}
                            />
                            <ThemedText
                                style={{
                                    color: isDark ? '#FFFFFF' : '#000000',
                                    ...FONTS.caption,
                                    fontWeight: '700',
                                }}
                            >
                                ₹{user.walletBalance.toFixed(2)}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>

                
                <View
                    style={[styles.bottomOverlay, { bottom: tabBarOffset + 22 }]}
                    pointerEvents="box-none"
                >
                    <View style={styles.floatingActionStack} pointerEvents="box-none">
                        <TouchableOpacity
                            style={[
                                styles.floatingActionButton,
                                {
                                    backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
                                    borderBottomColor: isDark ? '#050508' : '#C8C8D0',
                                },
                            ]}
                            activeOpacity={0.82}
                            onPress={() => {
                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                handleLocateMe();
                            }}
                        >
                            <Navigation size={18} color={colors.text} fill={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.floatingActionButton,
                                {
                                    backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
                                    borderBottomColor: isDark ? '#050508' : '#C8C8D0',
                                },
                            ]}
                            activeOpacity={0.82}
                            onPress={() => {
                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setIsFilterSheetVisible(true);
                            }}
                        >
                            <Filter size={18} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.floatingActionButton,
                                {
                                    backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
                                    borderBottomColor: isDark ? '#050508' : '#C8C8D0',
                                },
                            ]}
                            activeOpacity={0.82}
                            onPress={() => {
                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                        >
                            <Bell size={18} color={colors.text} fill={colors.text} />
                        </TouchableOpacity>
                    </View>
                        <View style={styles.sheetHeader}>
                            <View
                                style={[
                                    styles.countBadge,
                                    {
                                        backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                                        borderBottomColor: isDark ? '#050508' : '#D0D0D5',
                                    },
                                ]}
                            >
                                <MapPinned size={14} color={isDark ? '#FFFFFF' : '#000000'} />
                                <ThemedText style={{ color: isDark ? '#FFFFFF' : '#000000', ...FONTS.caption, fontFamily: FONT_FAMILIES.bold, letterSpacing: 0.8 }}>
                                    {nearbyStations.length} STATIONS NEARBY
                                </ThemedText>
                            </View>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.listContent}
                            snapToInterval={280 + 12}
                            decelerationRate="fast"
                        >
                            {nearbyStations.map((station: Station) => {
                                const connector = getRecommendedConnector(
                                    station,
                                    selectedVehicle?.connectorType
                                );
                                const isSelected = station.id === selectedStation?.id;

                                return (
                                    <TouchableOpacity
                                        key={station.id}
                                        activeOpacity={0.85}
                                        style={[
                                            styles.stationRow,
                                            isSelected
                                                ? {
                                                      backgroundColor: isDark ? '#1C1C24' : '#FFFFFF',
                                                      borderColor: isDark ? '#FFFFFF' : '#000000',
                                                      borderWidth: 1.5,
                                                      borderBottomWidth: 4,
                                                      borderBottomColor: isDark ? '#A0A0A8' : '#000000',
                                                      transform: [{ translateY: -1 }],
                                                  }
                                                : {
                                                      backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)',
                                                      borderWidth: 1,
                                                      borderBottomWidth: 2.5,
                                                      borderBottomColor: isDark ? '#050508' : '#D0D0D5',
                                                  },
                                        ]}
                                        onPress={() => {
                                            if (Platform.OS !== 'web') {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            }
                                            handleSelectStation(station, {
                                                openSheet: true,
                                            });
                                        }}
                                    >
                                        <View style={styles.stationRowTop}>
                                            <View style={styles.stationInfo}>
                                                <ThemedText
                                                    style={[
                                                        styles.stationName,
                                                        {
                                                            color: isSelected
                                                                ? (isDark ? '#FFFFFF' : '#000000')
                                                                : colors.text,
                                                        },
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {station.name}
                                                </ThemedText>
                                                <ThemedText
                                                    style={{
                                                        color: isSelected
                                                            ? (isDark ? '#A0A0A8' : '#55555A')
                                                            : colors.textMuted,
                                                        ...FONTS.caption,
                                                    }}
                                                    numberOfLines={1}
                                                >
                                                    {resolvedAddresses[station.id] ?? station.address}
                                                </ThemedText>
                                                <ThemedText
                                                    style={{
                                                        color: isSelected
                                                            ? (isDark ? '#A0A0A8' : '#55555A')
                                                            : colors.textMuted,
                                                        ...FONTS.caption,
                                                    }}
                                                >
                                                    {station.distanceKm} km • {station.etaMinutes} min •{' '}
                                                    {station.rating.toFixed(1)}★
                                                </ThemedText>
                                                <View style={styles.stationMetaRow}>
                                                    <View
                                                        style={[
                                                            styles.typeBadge,
                                                            {
                                                                backgroundColor: isSelected
                                                                    ? (isDark ? 'rgba(255,255,255,0.2)' : '#E0E0E6')
                                                                    : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
                                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                                                                borderWidth: 1,
                                                            },
                                                        ]}
                                                    >
                                                        <Zap
                                                            size={11}
                                                            color={isDark ? '#FFFFFF' : '#000000'}
                                                            fill={isDark ? '#FFFFFF' : '#000000'}
                                                        />
                                                        <ThemedText style={[styles.typeText, { color: isDark ? '#FFFFFF' : '#000000', fontWeight: '700' }]}>
                                                            {connector.power}kW
                                                        </ThemedText>
                                                    </View>
                                                    <ThemedText
                                                        style={{
                                                            color: isSelected
                                                                ? (isDark ? '#A0A0A8' : '#55555A')
                                                                : colors.textMuted,
                                                            ...FONTS.caption,
                                                        }}
                                                    >
                                                        ₹{connector.pricePerKWh.toFixed(2)}/kWh
                                                    </ThemedText>
                                                </View>


                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                </View>

                </SafeAreaView>

            <MapFilterSheet
                visible={isFilterSheetVisible}
                criteria={filterCriteria}
                onClose={() => setIsFilterSheetVisible(false)}
                onApply={(next) => setFilterCriteria(next)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    topOverlay: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        paddingHorizontal: SPACING.md,
    },
    searchBarWrapper: {
        height: 52,
        borderRadius: RADIUS.input,
        paddingHorizontal: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        ...FONTS.body,
        marginLeft: 12,
        height: '100%',
    },
    searchActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchActionIcon: {
        padding: 4,
    },
    profileWrapper: {
        marginLeft: 4,
    },
    profileCircle: {
        width: 34,
        height: 34,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterScroll: {
        marginTop: 12,
        flexGrow: 0,
    },
    filterContainer: {
        paddingRight: SPACING.md,
        gap: SPACING.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: RADIUS.chip,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    filterIconChip: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    walletFilterRow: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    markerOuter: {
        width: 34,
        height: 34,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingActionStack: {
        position: 'absolute',
        top: -154,
        right: SPACING.md,
        alignItems: 'center',
        gap: 8,
        zIndex: 10,
    },
    floatingActionButton: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderBottomWidth: 3,
    },
    bottomOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        paddingHorizontal: 0,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: SPACING.md,
    },
    sheetHandle: {
        width: 40,
        height: 5,
        borderRadius: RADIUS.pill,
        marginBottom: 8,
    },
    countBadge: {
        minWidth: 48,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: RADIUS.chip,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderBottomWidth: 2,
    },
    listContent: {
        paddingLeft: 20,
        paddingRight: 10,
        paddingBottom: 20,
        flexDirection: 'row',
        gap: 12,
    },
    stationRow: {
        width: 250,
        borderRadius: RADIUS.card,
        padding: 14,
    },
    stationRowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stationInfo: {
        flex: 1,
    },
    stationMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.chip,
    },
    typeText: {
        ...FONTS.label,
        fontSize: 10,
    },
    stationName: {
        ...FONTS.h3,
        marginBottom: 2,
    },
    stationInsightChip: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        borderRadius: RADIUS.chip,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    stationInsightChipText: {
        ...FONTS.caption,
        fontWeight: '700',
    },
    detailSheetWrap: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'flex-end',
    },
    detailSheet: {
        maxHeight: '76%',
        borderTopLeftRadius: RADIUS.bottomSheet,
        borderTopRightRadius: RADIUS.bottomSheet,
    },
    detailSheetHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        paddingHorizontal: 20,
        paddingBottom: 6,
    },
    detailHeaderCopy: {
        flex: 1,
    },
    detailEyebrow: {
        ...FONTS.label,
        marginBottom: 6,
    },
    detailTitle: {
        ...FONTS.h2,
        fontSize: 26,
        lineHeight: 30,
    },
    detailCloseButton: {
        width: 38,
        height: 38,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailSheetContent: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    detailAddressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 4,
    },
    detailAddress: {
        ...FONTS.body,
        flex: 1,
    },
    detailStatusRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 16,
    },
    detailStatusPill: {
        borderRadius: RADIUS.chip,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailStatusText: {
        ...FONTS.caption,
        fontWeight: '700',
    },
    detailMetricsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    detailMetricCard: {
        flex: 1,
        borderRadius: RADIUS.card,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    detailMetricLabel: {
        ...FONTS.label,
        fontSize: 10,
        marginBottom: 6,
    },
    detailMetricValue: {
        ...FONTS.h3,
        fontSize: 17,
    },
    aiInsightCard: {
        marginTop: 18,
        borderRadius: RADIUS.card,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    aiInsightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    aiInsightBadge: {
        borderRadius: RADIUS.chip,
        paddingHorizontal: 10,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    aiInsightBadgeText: {
        ...FONTS.label,
        fontSize: 10,
    },
    aiNotificationBanner: {
        borderRadius: RADIUS.tile,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    aiNotificationText: {
        ...FONTS.bodyStrong,
        fontSize: 13,
        lineHeight: 18,
    },
    aiRecommendationText: {
        ...FONTS.caption,
        marginTop: 4,
        lineHeight: 17,
    },
    detailHeroImage: {
        width: '100%',
        height: 180,
        borderRadius: RADIUS.card,
        marginTop: 18,
    },
    detailTagline: {
        ...FONTS.body,
        marginTop: 14,
    },
    detailSectionHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 22,
        marginBottom: 12,
    },
    detailSectionTitle: {
        ...FONTS.h3,
    },
    detailSectionCaption: {
        ...FONTS.caption,
    },
    amenityWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    amenityChip: {
        borderRadius: RADIUS.chip,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    amenityText: {
        ...FONTS.caption,
    },
    connectorList: {
        gap: 10,
    },
    connectorCard: {
        borderRadius: RADIUS.card,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    connectorTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
    },
    connectorTitleWrap: {
        flex: 1,
    },
    connectorTitle: {
        ...FONTS.h3,
        fontSize: 17,
    },
    connectorMetaText: {
        ...FONTS.caption,
        marginTop: 2,
    },
    connectorStatusPill: {
        borderRadius: RADIUS.chip,
        paddingHorizontal: 10,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    connectorStatusText: {
        ...FONTS.caption,
        fontWeight: '700',
    },
    connectorBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 10,
    },
    recommendedText: {
        ...FONTS.caption,
        fontWeight: '700',
    },
    detailActionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 22,
    },
    detailActionButton: {
        flex: 1,
    },

    // Filter Bottom Sheet (Reference Image Design)
    sheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    filterSheetContainer: {
        borderTopLeftRadius: RADIUS.bottomSheet,
        borderTopRightRadius: RADIUS.bottomSheet,
        borderTopWidth: 2,
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    dragHandleBar: {
        width: 40,
        height: 4.5,
        borderRadius: RADIUS.pill,
        alignSelf: 'center',
        marginBottom: 16,
    },
    filterSheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    filterSheetTitle: {
        fontSize: 18,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    filterSaveBtn: {
        paddingHorizontal: 20,
        paddingVertical: 9,
        borderRadius: RADIUS.button,
        borderWidth: 1.5,
        borderBottomWidth: 3.5,
    },
    filterSaveBtnText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.extraBold,
        letterSpacing: 0.8,
    },
    filterSheetDivider: {
        height: 1,
        marginVertical: 14,
    },
    filterRowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    filterRowLabel: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
    },
    segmentedControl: {
        flexDirection: 'row',
        borderRadius: RADIUS.button,
        padding: 3,
        borderWidth: 1.5,
        borderBottomWidth: 3,
        width: 140,
    },
    segmentOption: {
        flex: 1,
        paddingVertical: 7,
        borderRadius: RADIUS.chip,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentOptionSelected: {},
    segmentText: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.medium,
    },
    segmentTextSelected: {
        fontFamily: FONT_FAMILIES.extraBold,
    },
    filterNavCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: RADIUS.card,
        borderWidth: 1.5,
        borderBottomWidth: 3,
    },
    filterNavTitle: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
    },
    filterNavSubtitle: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.medium,
        marginTop: 2,
    },
    navChevronCircle: {
        width: 28,
        height: 28,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    brandLogosCluster: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 4,
    },
    brandAvatar: {
        width: 24,
        height: 24,
        borderRadius: RADIUS.circle,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandAvatarText: {
        fontSize: 8,
        fontFamily: FONT_FAMILIES.bold,
        color: '#FFFFFF',
    },
    filterResetBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 14,
        borderRadius: RADIUS.button,
        borderWidth: 1.5,
        borderBottomWidth: 3,
    },
    filterResetText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.extraBold,
        color: '#DC2626',
        letterSpacing: 0.8,
    },
    sheetBackCircleBtn: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderBottomWidth: 3,
    },
    brandScrollContent: {
        paddingBottom: 24,
    },
    brandActionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 10,
        paddingVertical: 4,
    },
    brandCountText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.medium,
    },
    brandDeselectText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
    },
    brandItemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: RADIUS.tile,
        borderWidth: 1.5,
        borderBottomWidth: 3,
        marginBottom: 8,
    },
    brandItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    brandItemAvatar: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandItemName: {
        fontSize: 14,
        fontFamily: FONT_FAMILIES.semiBold,
    },
    sheetHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    subModalSubtitle: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.medium,
        marginBottom: 14,
    },
    plugFilterCardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    plugFilterCard: {
        width: '48%',
        borderRadius: RADIUS.card,
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    plugCardCheckmarkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    plugFilterCardIconContainer: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    plugFilterCardLabel: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
        textAlign: 'center',
    },
    plugTypeChip: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.chip,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
    },
    plugTypeChipText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.5,
    },
    plugsQuickBar: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    quickBarBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: RADIUS.button,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderBottomWidth: 3,
    },
    plugsQuickActionText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.6,
    },
});
