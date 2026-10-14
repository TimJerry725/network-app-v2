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
import {
    ArrowLeft,
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
} from 'lucide-react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { GradientButton } from '../../components/GradientButton';
import { ThemedText } from '../../components/ThemedText';
import { DcPinIcon } from '../../components/DcPinIcon';
import { CarPinIcon } from '../../components/CarPinIcon';
import { Ccs2Icon } from '../../components/Ccs2Icon';
import { Type2Icon } from '../../components/Type2Icon';
import { ChademoIcon } from '../../components/ChademoIcon';
export type MapFilterState = {
    chargerTypes: string[];
    connectorTypes: string[];
    peakPower: string;
    tariffRange: [number, number];
    chargerTypeFilter: 'Any' | 'AC' | 'DC';
    selectedBrands: string[];
};
import { SlidersHorizontal } from 'lucide-react-native';
import {
    Connector,
    Station,
    getRecommendedConnector,
} from '../../constants/Stations';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../../constants/Tokens';
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

export type ConnectorFilterItem = {
    id: string;
    altId?: string;
    label: string;
    currentType: 'AC' | 'DC';
    renderIcon: (color: string) => React.ReactNode;
};

const CONNECTOR_ITEMS: ConnectorFilterItem[] = [
    {
        id: 'CCS2',
        label: 'CCS2',
        currentType: 'DC',
        renderIcon: (color: string) => <Ccs2Icon size={38} color={color} />,
    },
    {
        id: 'Type 2',
        altId: 'Type II',
        label: 'Type 2',
        currentType: 'AC',
        renderIcon: (color: string) => <Type2Icon size={38} color={color} />,
    },
    {
        id: 'CHAdeMO',
        altId: 'CHAdeMo',
        label: 'CHAdeMO',
        currentType: 'DC',
        renderIcon: (color: string) => <ChademoIcon size={38} color={color} />,
    },
    {
        id: 'GB/T',
        label: 'GB/T',
        currentType: 'DC',
        renderIcon: (color: string) => <FontAwesome6 name="plug" size={32} color={color} />,
    },
];

export type BrandFilterItem = {
    id: string;
    name: string;
    bgColor: string;
    renderIcon: () => React.ReactNode;
};

const INDIAN_CHARGER_BRANDS: BrandFilterItem[] = [
    {
        id: 'iris_network',
        name: 'Iris Network',
        bgColor: '#1E9731',
        renderIcon: () => <FontAwesome6 name="bolt" size={13} color="#FFFFFF" solid />,
    },
    {
        id: 'tata_power',
        name: 'Tata Power EZ Charge',
        bgColor: '#005AA9',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 10 }}>EZ</ThemedText>,
    },
    {
        id: 'jio_bp',
        name: 'Jio-bp pulse',
        bgColor: '#009A44',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 10 }}>bp</ThemedText>,
    },
    {
        id: 'statiq',
        name: 'Statiq',
        bgColor: '#F59E0B',
        renderIcon: () => <Zap size={14} color="#FFFFFF" fill="#FFFFFF" />,
    },
    {
        id: 'zeon_charging',
        name: 'Zeon Charging',
        bgColor: '#2563EB',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>Z</ThemedText>,
    },
    {
        id: 'chargezone',
        name: 'ChargeZone',
        bgColor: '#10B981',
        renderIcon: () => <FontAwesome6 name="bolt" size={13} color="#FFFFFF" solid />,
    },
    {
        id: 'ather_grid',
        name: 'Ather Grid',
        bgColor: '#FF5722',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>A</ThemedText>,
    },
    {
        id: 'glida',
        name: 'Glida (Fortum)',
        bgColor: '#00A3A6',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>G</ThemedText>,
    },
    {
        id: 'kazam',
        name: 'Kazam',
        bgColor: '#7C3AED',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>K</ThemedText>,
    },
    {
        id: 'blusmart',
        name: 'BluSmart Charge',
        bgColor: '#0EA5E9',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 10 }}>BLU</ThemedText>,
    },
    {
        id: 'bpcl',
        name: 'BPCL e-Drive',
        bgColor: '#1E40AF',
        renderIcon: () => <ThemedText style={{ color: '#FACC15', fontWeight: '800', fontSize: 10 }}>BP</ThemedText>,
    },
    {
        id: 'hpcl',
        name: 'HPCL EV Drive',
        bgColor: '#DC2626',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 10 }}>HP</ThemedText>,
    },
    {
        id: 'iocl',
        name: 'IndianOil EV',
        bgColor: '#EA580C',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 10 }}>IO</ThemedText>,
    },
    {
        id: 'bolt_earth',
        name: 'Bolt.Earth',
        bgColor: '#EAB308',
        renderIcon: () => <Zap size={13} color="#000000" fill="#000000" />,
    },
    {
        id: 'magenta',
        name: 'Magenta ChargeGrid',
        bgColor: '#C026D3',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 11 }}>M</ThemedText>,
    },
    {
        id: 'charzer',
        name: 'Charzer',
        bgColor: '#059669',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>C</ThemedText>,
    },
    {
        id: 'relux',
        name: 'Relux Electric',
        bgColor: '#4F46E5',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>R</ThemedText>,
    },
    {
        id: 'goego',
        name: 'goEgo Network',
        bgColor: '#0D9488',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 10 }}>go</ThemedText>,
    },
    {
        id: 'lioncharge',
        name: 'LionCharge',
        bgColor: '#D97706',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>L</ThemedText>,
    },
    {
        id: 'plugngo',
        name: 'PlugNgo',
        bgColor: '#F97316',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 11 }}>P</ThemedText>,
    },
    {
        id: 'efill',
        name: 'E-Fill Electric',
        bgColor: '#3B82F6',
        renderIcon: () => <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 10 }}>EF</ThemedText>,
    },
    {
        id: 'electreefi',
        name: 'ElectreeFi',
        bgColor: '#16A34A',
        renderIcon: () => <FontAwesome6 name="plug" size={13} color="#FFFFFF" />,
    },
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
    const [filterCriteria, setFilterCriteria] = useState<MapFilterState>({
        chargerTypes: [],
        connectorTypes: [],
        peakPower: 'Any',
        tariffRange: [0, 50],
        chargerTypeFilter: 'Any',
        selectedBrands: [],
    });
    const [tempFilterCriteria, setTempFilterCriteria] = useState<MapFilterState>({
        chargerTypes: [],
        connectorTypes: [],
        peakPower: 'Any',
        tariffRange: [0, 50],
        chargerTypeFilter: 'Any',
        selectedBrands: [],
    });
    const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
    const [filterSheetView, setFilterSheetView] = useState<'main' | 'plugs' | 'brands'>('main');
    const [mapRegion, setMapRegion] = useState(UK_INITIAL_REGION);
    const [resolvedAddresses, setResolvedAddresses] = useState<Record<string, string>>({});

    const isConnectorSelected = (item: ConnectorFilterItem) => {
        return tempFilterCriteria.connectorTypes.includes(item.id) ||
            Boolean(item.altId && tempFilterCriteria.connectorTypes.includes(item.altId));
    };

    const toggleConnector = (item: ConnectorFilterItem) => {
        setTempFilterCriteria(prev => {
            const selected = isConnectorSelected(item);
            const filtered = prev.connectorTypes.filter(c => c !== item.id && c !== item.altId);
            const next = selected ? filtered : [...filtered, item.id];
            return { ...prev, connectorTypes: next };
        });
    };

    const isBrandSelected = (brandName: string) => {
        return tempFilterCriteria.selectedBrands.includes(brandName);
    };

    const toggleBrand = (brandName: string) => {
        setTempFilterCriteria(prev => {
            const exists = prev.selectedBrands.includes(brandName);
            const next = exists
                ? prev.selectedBrands.filter(b => b !== brandName)
                : [...prev.selectedBrands, brandName];
            return { ...prev, selectedBrands: next };
        });
    };

    const allBrandNames = useMemo(() => INDIAN_CHARGER_BRANDS.map(b => b.name), []);

    const isAllBrandsSelected =
        allBrandNames.length > 0 && allBrandNames.every(name => tempFilterCriteria.selectedBrands.includes(name));

    const handleToggleAllBrands = () => {
        setTempFilterCriteria(prev => {
            if (isAllBrandsSelected) {
                return {
                    ...prev,
                    selectedBrands: [],
                };
            } else {
                return {
                    ...prev,
                    selectedBrands: [...allBrandNames],
                };
            }
        });
    };

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
                            onPress={() =>
                                handleSelectStation(station, { openSheet: true })
                            }
                        >
                            <DcPinIcon size={38} color={isSelected ? colors.primary : colors.textMuted} />
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
                                backgroundColor: colors.surface,
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
                                    <FontAwesome6 name="user" size={13} color={colors.primary} solid />
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
                                    activeOpacity={0.8}
                                    style={[
                                        styles.filterChip,
                                        {
                                            backgroundColor: isActive ? colors.primary : colors.surface,
                                        },
                                    ]}
                                    onPress={() => {
                                        setActiveFilter(prev => prev === filter.id ? '' : filter.id);
                                    }}
                                >
                                    <FontAwesome6
                                        name={filter.icon}
                                        size={11}
                                        color={isActive ? '#FFFFFF' : colors.primary}
                                        style={{ marginRight: 6 }}
                                        solid
                                    />
                                    <ThemedText
                                        style={{
                                            color: isActive ? '#FFFFFF' : colors.text,
                                            ...FONTS.caption,
                                            fontWeight: '600',
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
                                    backgroundColor: colors.surface,
                                },
                            ]}
                            onPress={() => navigation.navigate('Profile' as never)}
                        >
                            <FontAwesome6
                                name="wallet"
                                size={12}
                                color={colors.primary}
                                style={{ marginRight: 6 }}
                                solid
                            />
                            <ThemedText
                                style={{
                                    color: colors.text,
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
                                { backgroundColor: colors.surface }
                            ]}
                            onPress={handleLocateMe}
                        >
                            <Navigation size={20} color={colors.text} fill={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.floatingActionButton,
                                { backgroundColor: colors.surface }
                            ]}
                            onPress={() => {
                                setTempFilterCriteria({ ...filterCriteria });
                                setIsFilterSheetVisible(true);
                            }}
                        >
                            <FontAwesome6 name="filter" size={18} color={colors.text} solid />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.floatingActionButton,
                                { backgroundColor: colors.surface }
                            ]}
                            onPress={() => {}}
                        >
                            <Bell size={20} color={colors.text} fill={colors.text} />
                        </TouchableOpacity>
                    </View>
                        <View style={styles.sheetHeader}>
                            <View style={[styles.countBadge, { backgroundColor: colors.primarySoft }]}>
                                <MapPinned size={14} color={colors.primary} />
                                <ThemedText style={{ color: colors.primaryStrong, ...FONTS.caption, fontWeight: '700' }}>
                                    {nearbyStations.length}
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
                                            {
                                                backgroundColor: isSelected
                                                    ? (isDark ? '#1C3825' : '#E8F5E9')
                                                    : colors.surface,
                                            },
                                        ]}
                                        onPress={() => {
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
                                                                ? (isDark ? colors.primary : colors.primaryStrong)
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
                                                            ? (isDark ? '#98DCA9' : '#2C6E3D')
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
                                                            ? (isDark ? '#98DCA9' : '#2C6E3D')
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
                                                                    ? (isDark ? 'rgba(255,255,255,0.12)' : '#D5EED8')
                                                                    : colors.primarySoft,
                                                            },
                                                        ]}
                                                    >
                                                        <FontAwesome6
                                                            name="bolt"
                                                            size={10}
                                                            color={isDark ? colors.primary : colors.primaryStrong}
                                                            solid
                                                        />
                                                        <ThemedText style={[styles.typeText, { color: colors.primaryStrong }]}>
                                                            {connector.power}kW
                                                        </ThemedText>
                                                    </View>
                                                    <ThemedText
                                                        style={{
                                                            color: isSelected
                                                                ? (isDark ? '#98DCA9' : '#2C6E3D')
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

            {/* ── Filter Bottom Sheet Modal ── */}
            <Modal
                visible={isFilterSheetVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    setIsFilterSheetVisible(false);
                    setFilterSheetView('main');
                }}
            >
                <View style={styles.sheetOverlay}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => {
                            setIsFilterSheetVisible(false);
                            setFilterSheetView('main');
                        }}
                    />
                    <View
                        style={[
                            styles.filterSheetContainer,
                            {
                                backgroundColor: colors.surface,
                                maxHeight: filterSheetView === 'brands' ? '90%' : filterSheetView === 'plugs' ? '82%' : undefined,
                                paddingBottom: Math.max(insets.bottom, 24),
                            },
                        ]}
                    >
                        {/* Drag Handle */}
                        <View style={[styles.dragHandleBar, { backgroundColor: isDark ? '#383838' : '#D1D5DB' }]} />

                        {filterSheetView === 'main' && (
                            <>
                                {/* Sheet Header: Filter title & Save button */}
                                <View style={styles.filterSheetHeader}>
                                    <ThemedText style={[styles.filterSheetTitle, { color: colors.text }]}>Filter</ThemedText>
                                    <TouchableOpacity
                                        style={[styles.filterSaveBtn, { backgroundColor: colors.primary }]}
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            setFilterCriteria({ ...tempFilterCriteria });
                                            setIsFilterSheetVisible(false);
                                        }}
                                    >
                                        <ThemedText style={[styles.filterSaveBtnText, { color: '#FFFFFF' }]}>Save</ThemedText>
                                    </TouchableOpacity>
                                </View>

                                {/* Thin divider */}
                                <View style={[styles.filterSheetDivider, { backgroundColor: isDark ? colors.surfaceMuted : colors.backgroundAlt }]} />

                                {/* 1. Charger Segmented Row (AC or DC) */}
                                <View style={styles.filterRowItem}>
                                    <ThemedText style={[styles.filterRowLabel, { color: colors.text }]}>Charger</ThemedText>
                                    <View style={[styles.segmentedControl, { width: 140, backgroundColor: isDark ? colors.surfaceMuted : colors.backgroundAlt }]}>
                                        {(['AC', 'DC'] as const).map((type) => {
                                            const isSelected = tempFilterCriteria.chargerTypeFilter === type;
                                            return (
                                                <TouchableOpacity
                                                    key={type}
                                                    style={[
                                                        styles.segmentOption,
                                                        { flex: 1 },
                                                        isSelected && [styles.segmentOptionSelected, { backgroundColor: colors.primary }],
                                                    ]}
                                                    activeOpacity={0.8}
                                                    onPress={() => {
                                                        setTempFilterCriteria((prev) => ({
                                                            ...prev,
                                                            chargerTypeFilter: prev.chargerTypeFilter === type ? 'Any' : type,
                                                        }));
                                                    }}
                                                >
                                                    <ThemedText
                                                        style={[
                                                            styles.segmentText,
                                                            { color: isSelected ? '#FFFFFF' : colors.textMuted },
                                                            isSelected && styles.segmentTextSelected,
                                                        ]}
                                                    >
                                                        {type}
                                                    </ThemedText>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* 2. Plugs Row (Tappable with Chevron) */}
                                <TouchableOpacity
                                    style={styles.filterNavRow}
                                    activeOpacity={0.7}
                                    onPress={() => setFilterSheetView('plugs')}
                                >
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={[styles.filterNavTitle, { color: colors.text }]}>Plugs</ThemedText>
                                        <ThemedText style={[styles.filterNavSubtitle, { color: colors.textMuted }]}>
                                            {tempFilterCriteria.connectorTypes.length > 0
                                                 ? tempFilterCriteria.connectorTypes.join(', ')
                                                 : 'All plugs (CCS2, Type 2, CHAdeMO, GB/T)'}
                                        </ThemedText>
                                    </View>
                                    <ChevronRight size={18} color={colors.textMuted} />
                                </TouchableOpacity>

                                {/* 3. Chargers Row (Network Logos + Chevron) */}
                                <TouchableOpacity
                                    style={styles.filterNavRow}
                                    activeOpacity={0.7}
                                    onPress={() => setFilterSheetView('brands')}
                                >
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={[styles.filterNavTitle, { color: colors.text }]}>Chargers</ThemedText>
                                        <ThemedText style={[styles.filterNavSubtitle, { color: colors.textMuted }]}>
                                            {tempFilterCriteria.selectedBrands.length > 0
                                                ? `${tempFilterCriteria.selectedBrands.length} selected`
                                                : `Showing ${INDIAN_CHARGER_BRANDS.length} brands`}
                                        </ThemedText>
                                    </View>

                                    {/* Overlapping Brand Logo Avatars */}
                                    <View style={styles.brandLogosCluster}>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#1E9731' }]}>
                                            <FontAwesome6 name="bolt" size={9} color="#FFF" />
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#005AA9', marginLeft: -8 }]}>
                                            <ThemedText style={[styles.brandAvatarText, { fontSize: 8 }]}>EZ</ThemedText>
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#009A44', marginLeft: -8 }]}>
                                            <ThemedText style={[styles.brandAvatarText, { fontSize: 8 }]}>bp</ThemedText>
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#F59E0B', marginLeft: -8 }]}>
                                            <Zap size={10} color="#FFF" fill="#FFF" />
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#2563EB', marginLeft: -8 }]}>
                                            <ThemedText style={[styles.brandAvatarText, { fontSize: 9 }]}>Z</ThemedText>
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#10B981', marginLeft: -8 }]}>
                                            <FontAwesome6 name="bolt" size={8} color="#FFF" />
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#FF5722', marginLeft: -8 }]}>
                                            <ThemedText style={[styles.brandAvatarText, { fontSize: 9 }]}>A</ThemedText>
                                        </View>
                                    </View>

                                    <ChevronRight size={18} color={colors.textMuted} />
                                </TouchableOpacity>

                                {/* Reset All Filters Button */}
                                <TouchableOpacity
                                    style={styles.filterResetBtn}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        setTempFilterCriteria({
                                            chargerTypes: [],
                                            connectorTypes: [],
                                            peakPower: 'Any',
                                            tariffRange: [0, 50],
                                            chargerTypeFilter: 'Any',
                                            selectedBrands: [],
                                        });
                                    }}
                                >
                                    <ThemedText style={[styles.filterResetText, { color: colors.error }]}>Reset All</ThemedText>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* ── Sub-View: Plugs Selection with Connector Icons ── */}
                        {filterSheetView === 'plugs' && (
                            <>
                                <View style={styles.filterSheetHeader}>
                                    <View style={styles.sheetHeaderLeft}>
                                        <TouchableOpacity
                                            style={styles.sheetBackBtn}
                                            activeOpacity={0.7}
                                            onPress={() => setFilterSheetView('main')}
                                        >
                                            <ArrowLeft size={20} color={colors.text} />
                                        </TouchableOpacity>
                                        <ThemedText style={[styles.filterSheetTitle, { color: colors.text }]}>Select Plugs</ThemedText>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.filterSaveBtn, { backgroundColor: colors.primary }]}
                                        activeOpacity={0.8}
                                        onPress={() => setFilterSheetView('main')}
                                    >
                                        <ThemedText style={[styles.filterSaveBtnText, { color: '#FFFFFF' }]}>Done</ThemedText>
                                    </TouchableOpacity>
                                </View>

                                <View style={[styles.filterSheetDivider, { backgroundColor: isDark ? colors.surfaceMuted : colors.backgroundAlt }]} />

                                <ThemedText style={[styles.subModalSubtitle, { color: colors.textMuted }]}>
                                    Choose connector types compatible with your vehicle
                                </ThemedText>

                                <View style={styles.plugFilterCardsGrid}>
                                    {CONNECTOR_ITEMS.map((item) => {
                                        const selected = isConnectorSelected(item);
                                        const iconColor = selected ? (isDark ? colors.primary : colors.primaryStrong) : (isDark ? '#E5E7EB' : '#374151');
                                        return (
                                            <TouchableOpacity
                                                key={item.id}
                                                activeOpacity={0.75}
                                                style={[
                                                    styles.plugFilterCard,
                                                    {
                                                        backgroundColor: selected ? colors.primarySoft : (isDark ? colors.surfaceMuted : colors.backgroundAlt),
                                                    },
                                                ]}
                                                onPress={() => toggleConnector(item)}
                                            >
                                                {/* Selection Checkmark Badge */}
                                                <View
                                                    style={[
                                                        styles.plugCardCheckmarkBadge,
                                                        {
                                                            backgroundColor: selected ? colors.primary : 'transparent',
                                                        },
                                                    ]}
                                                >
                                                    {selected && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                                                </View>

                                                {/* Connector SVG Icon */}
                                                <View style={styles.plugFilterCardIconContainer}>
                                                    {item.renderIcon(iconColor)}
                                                </View>

                                                {/* Connector Name */}
                                                <ThemedText
                                                    style={[
                                                        styles.plugFilterCardLabel,
                                                        { color: selected ? (isDark ? colors.primary : colors.primaryStrong) : colors.text },
                                                    ]}
                                                >
                                                    {item.label}
                                                </ThemedText>

                                                {/* AC / DC Chip - Light & High-Contrast */}
                                                <View
                                                    style={[
                                                        styles.plugTypeChip,
                                                        {
                                                            backgroundColor: isDark
                                                                ? (item.currentType === 'DC' ? 'rgba(34, 197, 94, 0.22)' : 'rgba(56, 189, 248, 0.22)')
                                                                : (selected
                                                                    ? '#FFFFFF'
                                                                    : (item.currentType === 'DC' ? '#DCFCE7' : '#E0F2FE')),
                                                        },
                                                    ]}
                                                >
                                                    <ThemedText
                                                        style={[
                                                            styles.plugTypeChipText,
                                                            {
                                                                color: isDark
                                                                    ? (item.currentType === 'DC' ? '#4ADE80' : '#38BDF8')
                                                                    : (item.currentType === 'DC' ? '#15803D' : '#0369A1'),
                                                            },
                                                        ]}
                                                    >
                                                        {item.currentType}
                                                    </ThemedText>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                <View style={styles.plugsQuickBar}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            setTempFilterCriteria((prev) => ({
                                                ...prev,
                                                connectorTypes: CONNECTOR_ITEMS.map((c) => c.id),
                                            }));
                                        }}
                                    >
                                        <ThemedText style={[styles.plugsQuickActionText, { color: colors.primary }]}>Select All</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            setTempFilterCriteria((prev) => ({
                                                ...prev,
                                                connectorTypes: [],
                                            }));
                                        }}
                                    >
                                        <ThemedText style={[styles.plugsQuickActionText, { color: colors.textMuted }]}>Clear</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* ── Sub-View: Charger Brands Selection ── */}
                        {filterSheetView === 'brands' && (
                            <>
                                {/* Top Header: < back circle, centered "Chargers", Save button */}
                                <View style={styles.brandSheetHeader}>
                                    <TouchableOpacity
                                        style={[
                                            styles.brandBackBtn,
                                            { backgroundColor: isDark ? colors.surfaceMuted : colors.backgroundAlt },
                                        ]}
                                        activeOpacity={0.7}
                                        onPress={() => setFilterSheetView('main')}
                                    >
                                        <ChevronLeft size={22} color={colors.text} />
                                    </TouchableOpacity>

                                    <ThemedText style={[styles.brandSheetTitle, { color: colors.text }]}>
                                        Chargers
                                    </ThemedText>

                                    <TouchableOpacity
                                        style={[styles.brandSaveBtn, { backgroundColor: colors.primary }]}
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            setFilterCriteria({ ...tempFilterCriteria });
                                            setFilterSheetView('main');
                                        }}
                                    >
                                        <ThemedText style={styles.brandSaveBtnText}>Save</ThemedText>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.brandScrollContent}
                                >
                                    {/* Unified Top Action Bar */}
                                    <View style={styles.brandActionBar}>
                                        <ThemedText style={[styles.brandCountText, { color: colors.textMuted }]}>
                                            {tempFilterCriteria.selectedBrands.length === 0
                                                ? `All ${INDIAN_CHARGER_BRANDS.length} brands visible`
                                                : `${tempFilterCriteria.selectedBrands.length} of ${INDIAN_CHARGER_BRANDS.length} selected`}
                                        </ThemedText>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={handleToggleAllBrands}
                                        >
                                            <ThemedText style={[styles.brandDeselectText, { color: colors.primary }]}>
                                                {isAllBrandsSelected ? 'Deselect all' : 'Select all'}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    </View>

                                    {INDIAN_CHARGER_BRANDS.map((brand) => {
                                        const selected = isBrandSelected(brand.name);
                                        return (
                                            <TouchableOpacity
                                                key={brand.id}
                                                style={styles.brandItemRow}
                                                activeOpacity={0.75}
                                                onPress={() => toggleBrand(brand.name)}
                                            >
                                                <View style={styles.brandItemLeft}>
                                                    <View style={[styles.brandItemAvatar, { backgroundColor: brand.bgColor }]}>
                                                        {brand.renderIcon()}
                                                    </View>
                                                    <ThemedText style={[styles.brandItemName, { color: colors.text }]}>
                                                        {brand.name}
                                                    </ThemedText>
                                                </View>
                                                <Switch
                                                    value={selected}
                                                    onValueChange={() => toggleBrand(brand.name)}
                                                    trackColor={{
                                                        false: isDark ? '#334155' : '#E2E8F0',
                                                        true: colors.primary,
                                                    }}
                                                    thumbColor="#FFFFFF"
                                                    ios_backgroundColor={isDark ? '#334155' : '#E2E8F0'}
                                                />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
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
        borderRadius: 26,
        paddingHorizontal: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
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
        borderRadius: 17,
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
        borderRadius: RADIUS.pill,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    filterIconChip: {
        width: 36,
        height: 36,
        borderRadius: 18,
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
        borderRadius: 17,
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
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
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
        borderRadius: 999,
        marginBottom: 8,
    },
    countBadge: {
        minWidth: 48,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: RADIUS.pill,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    listContent: {
        paddingLeft: 20,
        paddingRight: 10,
        paddingBottom: 20,
        flexDirection: 'row',
        gap: 12,
    },
    stationRow: {
        width: 240,
        borderRadius: RADIUS.cardLg,
        padding: 12,
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
        borderRadius: RADIUS.input,
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
        borderRadius: RADIUS.pill,
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
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
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
        borderRadius: 19,
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
        borderRadius: RADIUS.pill,
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
        borderRadius: RADIUS.cardLg,
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
        borderRadius: 18,
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
        borderRadius: RADIUS.pill,
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
        borderRadius: 14,
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
        borderRadius: 22,
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
        borderRadius: RADIUS.pill,
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
        borderRadius: RADIUS.cardLg,
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
        borderRadius: RADIUS.pill,
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
        paddingHorizontal: 22,
        paddingTop: 12,
    },
    dragHandleBar: {
        width: 38,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    filterSheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    filterSheetTitle: {
        fontSize: 20,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    filterSaveBtn: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: RADIUS.button,
    },
    filterSaveBtnText: {
        fontSize: 14,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    filterSheetDivider: {
        height: 1,
        marginVertical: 18,
    },
    filterRowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    filterRowLabel: {
        fontSize: 17,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    segmentedControl: {
        flexDirection: 'row',
        borderRadius: RADIUS.button,
        padding: 3,
        alignItems: 'center',
    },
    segmentOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: RADIUS.button - 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentOptionSelected: {},
    segmentText: {
        fontSize: 14,
        fontFamily: 'RedHatDisplay_500Medium',
        fontWeight: '500',
    },
    segmentTextSelected: {
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    filterNavRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    filterNavTitle: {
        fontSize: 17,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    filterNavSubtitle: {
        fontSize: 12,
        fontFamily: 'RedHatDisplay_400Regular',
        marginTop: 3,
    },
    brandLogosCluster: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    brandAvatar: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandAvatarText: {
        fontSize: 11,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
        color: '#FFFFFF',
    },
    filterResetBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 8,
        borderRadius: RADIUS.button,
    },
    filterResetText: {
        fontSize: 14,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
    },
    brandSheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
        marginBottom: 8,
    },
    brandBackBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandSheetTitle: {
        fontSize: 18,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    brandSaveBtn: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: RADIUS.button,
    },
    brandSaveBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    brandScrollContent: {
        paddingBottom: 24,
    },
    brandActionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 8,
        paddingVertical: 4,
    },
    brandCountText: {
        fontSize: 13,
        fontFamily: 'RedHatDisplay_500Medium',
        fontWeight: '500',
    },
    brandDeselectText: {
        fontSize: 13,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
    },
    brandItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    brandItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
    },
    brandItemAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandItemName: {
        fontSize: 15,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
    },
    sheetHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sheetBackBtn: {
        padding: 6,
        marginLeft: -4,
        borderRadius: RADIUS.button,
    },
    subModalSubtitle: {
        fontSize: 13,
        fontFamily: 'RedHatDisplay_400Regular',
        marginBottom: 16,
    },
    plugFilterCardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    plugFilterCard: {
        width: '48%',
        borderRadius: RADIUS.button,
        paddingVertical: 18,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    plugCardCheckmarkBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    plugFilterCardIconContainer: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    plugFilterCardLabel: {
        fontSize: 16,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
        textAlign: 'center',
    },
    plugTypeChip: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        minWidth: 38,
    },
    plugTypeChipText: {
        fontSize: 11,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    plugsQuickBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginTop: 4,
    },
    plugsQuickActionText: {
        fontSize: 14,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
    },
});
