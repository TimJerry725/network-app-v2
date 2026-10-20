import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    Modal,
    PanResponder,
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
    ArrowUpRight,
    Bell,
    Check,
    CircleCheck,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
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
export type MapFilterState = {
    chargerTypes: string[];
    connectorTypes: string[];
    peakPower: string;
    tariffRange: [number, number];
    chargerTypeFilter: 'Any' | 'AC' | 'DC';
    selectedBrands: string[];
};
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

export const FILTER_CHIP_COLORS: Record<string, { color: string }> = {
    Fastest: { color: '#FF5B45' },
    Cheapest: { color: '#F59E0B' },
    Available: { color: '#10B981' },
    '24/7': { color: '#0284C7' },
    Amenities: { color: '#5B61F6' },
};

function getFilterIcon(id: string, isActive: boolean, isDark: boolean) {
    const config = FILTER_CHIP_COLORS[id] || { color: '#FF5B45' };
    const iconColor = isActive ? '#FFFFFF' : config.color;
    switch (id) {
        case 'Fastest':
            return <Zap size={13} color={iconColor} fill={isActive ? '#FFFFFF' : 'none'} style={{ marginRight: 6 }} />;
        case 'Cheapest':
            return <Zap size={13} color={iconColor} style={{ marginRight: 6 }} />;
        case 'Available':
            return <CircleCheck size={13} color={iconColor} style={{ marginRight: 6 }} />;
        case '24/7':
            return <Clock3 size={13} color={iconColor} style={{ marginRight: 6 }} />;
        case 'Amenities':
            return <Coffee size={13} color={iconColor} style={{ marginRight: 6 }} />;
        default:
            return <Zap size={13} color={iconColor} style={{ marginRight: 6 }} />;
    }
}

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
        renderIcon: (color: string) => <Plug size={32} color={color} />,
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
        bgColor: '#FFFFFF',
        renderIcon: () => <Zap size={13} color="#000000" fill="#000000" />,
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
        renderIcon: () => <Zap size={13} color="#FFFFFF" fill="#FFFFFF" />,
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
        bgColor: '#222228',
        renderIcon: () => <Plug size={13} color="#FFFFFF" />,
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

    const { height: SCREEN_HEIGHT } = Dimensions.get('window');
    const sheetSnapMin = tabBarOffset + 76;
    const sheetSnapMid = Math.round(SCREEN_HEIGHT * 0.44);
    const sheetSnapMax = Math.round(SCREEN_HEIGHT * 0.82);

    const snapMinRef = useRef(sheetSnapMin);
    const snapMidRef = useRef(sheetSnapMid);
    const snapMaxRef = useRef(sheetSnapMax);

    useEffect(() => {
        snapMinRef.current = sheetSnapMin;
        snapMidRef.current = sheetSnapMid;
        snapMaxRef.current = sheetSnapMax;
    }, [sheetSnapMin, sheetSnapMid, sheetSnapMax]);

    const [isSheetExpanded, setIsSheetExpanded] = useState(true);
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

    const floatingButtonsOpacity = sheetHeight.interpolate({
        inputRange: [sheetSnapMid, sheetSnapMax - 50],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });


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
                            onPress={() => {
                                handleSelectStation(station, { openSheet: false });
                                if (currentSheetHeight.current <= snapMinRef.current + 30) {
                                    snapTo(snapMidRef.current);
                                }
                            }}
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
                    {/* Search Bar at Top - Nothing above it */}
                    <View
                        style={[
                            styles.searchBarWrapper,
                            {
                                backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                            },
                        ]}
                    >
                        <Search size={18} color={colors.textSoft} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search stations, cities or areas..."
                            placeholderTextColor={colors.textSoft}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                        <View style={styles.searchActions}>
                            <TouchableOpacity
                                style={styles.profileWrapper}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('Profile' as never)}
                            >
                                <View style={[styles.profileCircle, { backgroundColor: isDark ? '#22242F' : '#F3F4F8' }]}>
                                    <User size={15} color={colors.text} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Filter Chips Scroll */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.filterScroll}
                        contentContainerStyle={styles.filterContainer}
                        pointerEvents="auto"
                    >
                        {filterOptions.map((filter) => {
                            const isActive = activeFilter === filter.id;
                            const chipTheme = FILTER_CHIP_COLORS[filter.id] || { color: '#FF5B45' };

                            return (
                                <TouchableOpacity
                                    key={filter.id}
                                    activeOpacity={0.82}
                                    style={[
                                        styles.filterChip,
                                        isActive
                                            ? {
                                                  backgroundColor: chipTheme.color,
                                                  borderColor: chipTheme.color,
                                              }
                                            : {
                                                  backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                                              },
                                    ]}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }
                                        setActiveFilter((prev) => (prev === filter.id ? '' : filter.id));
                                    }}
                                >
                                    {getFilterIcon(filter.id, isActive, isDark)}
                                    <ThemedText
                                        style={{
                                            color: isActive ? '#FFFFFF' : colors.text,
                                            fontSize: 12,
                                            fontFamily: FONT_FAMILIES.bold,
                                        }}
                                    >
                                        {filter.label}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Wallet Balance Pill below Search Bar & Filters */}
                    <View style={styles.walletFilterRow} pointerEvents="box-none">
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[
                                styles.walletHeaderPill,
                                {
                                    backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                                },
                            ]}
                            onPress={() => navigation.navigate('Profile' as never)}
                        >
                            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(245, 158, 11, 0.18)', alignItems: 'center', justifyContent: 'center' }}>
                                <Wallet size={12} color="#F59E0B" />
                            </View>
                            <ThemedText style={[styles.walletHeaderText, { color: colors.text }]}>
                                ₹{user.walletBalance.toFixed(0)}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            {/* Floating Action Buttons above Bottom Sheet */}
            <Animated.View
                style={[
                    styles.floatingActionStack,
                    {
                        bottom: Animated.add(sheetHeight, 14),
                        opacity: floatingButtonsOpacity,
                    },
                ]}
                pointerEvents="box-none"
            >
                <TouchableOpacity
                    style={[
                        styles.floatingActionButton,
                        {
                            backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
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
                            backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        },
                    ]}
                    activeOpacity={0.82}
                    onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setTempFilterCriteria({ ...filterCriteria });
                        setIsFilterSheetVisible(true);
                    }}
                >
                    <Filter size={18} color={colors.text} />
                </TouchableOpacity>
            </Animated.View>

            {/* ── Draggable Bottom Sheet ── */}
            <Animated.View
                style={[
                    styles.bottomSheetContainer,
                    {
                        backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        height: sheetHeight,
                    },
                ]}
            >
                {/* Drag Handle & Header Area (PanResponder) */}
                <View {...panResponder.panHandlers} style={styles.sheetHeaderWrapper}>
                    <TouchableOpacity
                        style={styles.sheetHandleTouchArea}
                        activeOpacity={0.8}
                        onPress={toggleSheet}
                    >
                        <View
                            style={[
                                styles.bottomSheetDragHandleBar,
                                { backgroundColor: isDark ? '#3E4150' : '#D1D5DB' },
                            ]}
                        />
                    </TouchableOpacity>

                    <View style={styles.sheetHeaderRow}>
                        <TouchableOpacity
                            style={{ flex: 1, marginRight: 8 }}
                            activeOpacity={0.85}
                            onPress={toggleSheet}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <MapPinned size={15} color={colors.coral} />
                                <ThemedText
                                    style={[styles.sheetTitle, { color: colors.text }]}
                                    numberOfLines={1}
                                >
                                    Nearby Stations
                                </ThemedText>
                                <View
                                    style={[
                                        styles.countBadge,
                                        {
                                            backgroundColor: isDark ? 'rgba(255, 91, 69, 0.16)' : '#FFE5E0',
                                            borderColor: 'transparent',
                                            paddingVertical: 2,
                                            paddingHorizontal: 8,
                                        },
                                    ]}
                                >
                                    <ThemedText
                                        style={{
                                            color: colors.coral,
                                            fontSize: 11,
                                            fontFamily: FONT_FAMILIES.sansBold,
                                            fontWeight: '700',
                                        }}
                                    >
                                        {visibleStations.length}
                                    </ThemedText>
                                </View>
                            </View>
                            <ThemedText
                                style={[styles.sheetSubtitle, { color: colors.textMuted }]}
                                numberOfLines={1}
                            >
                                {selectedStation
                                    ? `${selectedStation.name} • ${selectedStation.distanceKm} km away`
                                    : 'Select a station on the map'}
                            </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.sheetExpandToggleBtn,
                                {
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                },
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

                {/* Collapsed Peek Row */}
                {!isSheetExpanded && selectedStation && (
                    <TouchableOpacity
                        style={[
                            styles.collapsedPeekRow,
                            {
                                backgroundColor: isDark ? '#1C1D26' : '#F8FAFC',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                            },
                        ]}
                        activeOpacity={0.88}
                        onPress={() => snapTo(sheetSnapMid)}
                    >
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <ThemedText
                                style={[styles.peekStationName, { color: colors.text }]}
                                numberOfLines={1}
                            >
                                {selectedStation.name}
                            </ThemedText>
                            <ThemedText
                                style={[styles.peekStationMeta, { color: colors.textMuted }]}
                                numberOfLines={1}
                            >
                                {selectedStation.distanceKm} km • {recommendedConnector?.power ?? 60}kW Fast • ₹{recommendedConnector?.pricePerKWh.toFixed(0) ?? 21}/kWh
                            </ThemedText>
                        </View>

                        <TouchableOpacity
                            style={[styles.peekViewBtn, { backgroundColor: colors.coral }]}
                            activeOpacity={0.82}
                            onPress={() => {
                                navigation.navigate('StationDetails', {
                                    stationId: selectedStation.id,
                                    stationSnapshot: selectedStation,
                                });
                            }}
                        >
                            <ThemedText style={styles.peekViewBtnText}>View</ThemedText>
                            <ArrowUpRight size={14} color="#FFFFFF" strokeWidth={2.5} />
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}

                {/* Expanded Scrollable List of Stations */}
                {isSheetExpanded && (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                        contentContainerStyle={[
                            styles.sheetScrollListContent,
                            { paddingBottom: tabBarOffset + 30 },
                        ]}
                    >
                        {visibleStations.map((station: Station) => {
                            const connector = getRecommendedConnector(
                                station,
                                selectedVehicle?.connectorType
                            );
                            const isSelected = station.id === selectedStation?.id;
                            const availableCount = station.connectors.filter(
                                (c) => c.status === 'Available'
                            ).length;

                            return (
                                <TouchableOpacity
                                    key={station.id}
                                    activeOpacity={0.88}
                                    style={[
                                        styles.sheetStationCard,
                                        {
                                            backgroundColor: isSelected
                                                ? (isDark ? '#1C1D26' : '#FFFFFF')
                                                : (isDark ? '#14151D' : '#F9FAFB'),
                                            borderColor: isSelected
                                                ? colors.coral
                                                : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'),
                                            borderWidth: isSelected ? 1.5 : 1,
                                        },
                                    ]}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }
                                        handleSelectStation(station, { openSheet: false });
                                    }}
                                >
                                    <View style={styles.sheetStationCardTop}>
                                        <View style={styles.sheetStationCardInfo}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <ThemedText
                                                    style={[
                                                        styles.sheetStationCardName,
                                                        { color: colors.text },
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {station.name}
                                                </ThemedText>
                                                {station.rating && (
                                                    <View style={styles.ratingBadge}>
                                                        <Star size={10} color="#F59E0B" fill="#F59E0B" />
                                                        <ThemedText style={styles.ratingText}>
                                                            {station.rating.toFixed(1)}
                                                        </ThemedText>
                                                    </View>
                                                )}
                                            </View>
                                            <ThemedText
                                                style={[styles.sheetStationCardAddress, { color: colors.textMuted }]}
                                                numberOfLines={1}
                                            >
                                                {resolvedAddresses[station.id] ?? station.address}
                                            </ThemedText>
                                        </View>

                                        {/* Button-in-Button Action Arrow (↗) navigates to StationDetails */}
                                        <TouchableOpacity
                                            style={[
                                                styles.cardActionCircle,
                                                {
                                                    backgroundColor: isSelected
                                                        ? colors.coral
                                                        : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'),
                                                },
                                            ]}
                                            activeOpacity={0.8}
                                            onPress={() => {
                                                if (Platform.OS !== 'web') {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                }
                                                handleSelectStation(station, { openSheet: true });
                                            }}
                                        >
                                            <ArrowUpRight
                                                size={16}
                                                color={isSelected ? '#FFFFFF' : colors.text}
                                                strokeWidth={2.5}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.sheetStationMetaRow}>
                                        <View
                                            style={[
                                                styles.typeBadge,
                                                {
                                                    backgroundColor: isDark
                                                        ? 'rgba(255, 91, 69, 0.14)'
                                                        : '#FFE5E0',
                                                },
                                            ]}
                                        >
                                            <Zap
                                                size={11}
                                                color={colors.coral}
                                                fill={colors.coral}
                                            />
                                            <ThemedText
                                                style={[styles.typeText, { color: colors.coral }]}
                                            >
                                                {connector.power}kW Fast
                                            </ThemedText>
                                        </View>

                                        <View
                                            style={[
                                                styles.typeBadge,
                                                {
                                                    backgroundColor: isDark
                                                        ? (availableCount > 0 ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)')
                                                        : (availableCount > 0 ? '#D1FAE5' : '#FEF3C7'),
                                                },
                                            ]}
                                        >
                                            <ThemedText
                                                style={[
                                                    styles.typeText,
                                                    {
                                                        color: availableCount > 0 ? colors.mint : colors.accent,
                                                    },
                                                ]}
                                            >
                                                {availableCount > 0
                                                    ? `${availableCount} available`
                                                    : 'In use'}
                                            </ThemedText>
                                        </View>

                                        <ThemedText
                                            style={{
                                                color: colors.textMuted,
                                                ...FONTS.caption,
                                                marginLeft: 'auto',
                                            }}
                                        >
                                            {station.distanceKm} km • ₹{connector.pricePerKWh.toFixed(0)}/kWh
                                        </ThemedText>
                                    </View>

                                    {/* Amenities micro chips */}
                                    {station.amenities && station.amenities.length > 0 && (
                                        <View style={styles.amenitiesPreviewRow}>
                                            {station.amenities.slice(0, 3).map((amenity, idx) => (
                                                <View
                                                    key={idx}
                                                    style={[
                                                        styles.amenityPreviewChip,
                                                        {
                                                            backgroundColor: isDark
                                                                ? 'rgba(255, 255, 255, 0.05)'
                                                                : 'rgba(0, 0, 0, 0.03)',
                                                        },
                                                    ]}
                                                >
                                                    <AmenityIcon amenity={amenity} color={colors.textMuted} />
                                                    <ThemedText
                                                        style={[styles.amenityPreviewText, { color: colors.textMuted }]}
                                                    >
                                                        {amenity}
                                                    </ThemedText>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}
            </Animated.View>

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
                                backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
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
                                    <ThemedText style={[styles.filterSheetTitle, { color: colors.text }]}>
                                        Filter
                                    </ThemedText>
                                    <TouchableOpacity
                                        style={[
                                            styles.filterSaveBtn,
                                            {
                                                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                                borderColor: isDark ? '#FFFFFF' : '#000000',
                                                borderBottomColor: isDark ? '#A0A0A8' : '#333338',
                                            },
                                        ]}
                                        activeOpacity={0.82}
                                        onPress={() => {
                                            if (Platform.OS !== 'web') {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                            }
                                            setFilterCriteria({ ...tempFilterCriteria });
                                            setIsFilterSheetVisible(false);
                                        }}
                                    >
                                        <ThemedText style={[styles.filterSaveBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
                                            SAVE
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>

                                {/* Thin divider */}
                                <View style={[styles.filterSheetDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />

                                {/* 1. Charger Segmented Row (AC or DC) */}
                                <View style={styles.filterRowItem}>
                                    <ThemedText style={[styles.filterRowLabel, { color: colors.text }]}>
                                        Charger
                                    </ThemedText>
                                    <View
                                        style={[
                                            styles.segmentedControl,
                                            {
                                                backgroundColor: isDark ? '#1C1C24' : '#F2F2F6',
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                                                borderBottomColor: isDark ? '#050508' : '#D0D0D8',
                                            },
                                        ]}
                                    >
                                        {(['AC', 'DC'] as const).map((type) => {
                                            const isSelected = tempFilterCriteria.chargerTypeFilter === type;
                                            return (
                                                <TouchableOpacity
                                                    key={type}
                                                    style={[
                                                        styles.segmentOption,
                                                        isSelected && [
                                                            styles.segmentOptionSelected,
                                                            {
                                                                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                                            },
                                                        ],
                                                    ]}
                                                    activeOpacity={0.82}
                                                    onPress={() => {
                                                        if (Platform.OS !== 'web') {
                                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                        }
                                                        setTempFilterCriteria((prev) => ({
                                                            ...prev,
                                                            chargerTypeFilter: prev.chargerTypeFilter === type ? 'Any' : type,
                                                        }));
                                                    }}
                                                >
                                                    <ThemedText
                                                        style={[
                                                            styles.segmentText,
                                                            {
                                                                color: isSelected
                                                                    ? (isDark ? '#000000' : '#FFFFFF')
                                                                    : colors.textMuted,
                                                            },
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

                                {/* 2. Plugs Row (Tappable Tactile Card) */}
                                <TouchableOpacity
                                    style={[
                                        styles.filterNavCard,
                                        {
                                            backgroundColor: isDark ? '#181820' : '#F6F6F8',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                            borderBottomColor: isDark ? '#050508' : '#D0D0D8',
                                        },
                                    ]}
                                    activeOpacity={0.82}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setFilterSheetView('plugs');
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={[styles.filterNavTitle, { color: colors.text }]}>Plugs</ThemedText>
                                        <ThemedText style={[styles.filterNavSubtitle, { color: colors.textMuted }]}>
                                            {tempFilterCriteria.connectorTypes.length > 0
                                                 ? tempFilterCriteria.connectorTypes.join(', ')
                                                 : 'All plugs (CCS2, Type 2, CHAdeMO, GB/T)'}
                                        </ThemedText>
                                    </View>
                                    <View style={[styles.navChevronCircle, { backgroundColor: isDark ? '#262630' : '#ECECF0' }]}>
                                        <ChevronRight size={15} color={colors.text} strokeWidth={2.5} />
                                    </View>
                                </TouchableOpacity>

                                {/* 3. Chargers Row (Tappable Tactile Card with Avatars) */}
                                <TouchableOpacity
                                    style={[
                                        styles.filterNavCard,
                                        {
                                            backgroundColor: isDark ? '#181820' : '#F6F6F8',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                            borderBottomColor: isDark ? '#050508' : '#D0D0D8',
                                            marginTop: 10,
                                        },
                                    ]}
                                    activeOpacity={0.82}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setFilterSheetView('brands');
                                    }}
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
                                        <View style={[styles.brandAvatar, { backgroundColor: '#FFFFFF', borderColor: isDark ? '#181820' : '#F6F6F8' }]}>
                                            <Zap size={9} color="#000" fill="#000" />
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#005AA9', borderColor: isDark ? '#181820' : '#F6F6F8', marginLeft: -8 }]}>
                                            <ThemedText style={[styles.brandAvatarText, { fontSize: 8 }]}>EZ</ThemedText>
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#009A44', borderColor: isDark ? '#181820' : '#F6F6F8', marginLeft: -8 }]}>
                                            <ThemedText style={[styles.brandAvatarText, { fontSize: 8 }]}>bp</ThemedText>
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#F59E0B', borderColor: isDark ? '#181820' : '#F6F6F8', marginLeft: -8 }]}>
                                            <Zap size={10} color="#FFF" fill="#FFF" />
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#2563EB', borderColor: isDark ? '#181820' : '#F6F6F8', marginLeft: -8 }]}>
                                            <ThemedText style={[styles.brandAvatarText, { fontSize: 9 }]}>Z</ThemedText>
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#10B981', borderColor: isDark ? '#181820' : '#F6F6F8', marginLeft: -8 }]}>
                                            <Zap size={9} color="#FFF" fill="#FFF" />
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#FF5722', borderColor: isDark ? '#181820' : '#F6F6F8', marginLeft: -8 }]}>
                                            <ThemedText style={[styles.brandAvatarText, { fontSize: 9 }]}>A</ThemedText>
                                        </View>
                                    </View>

                                    <View style={[styles.navChevronCircle, { backgroundColor: isDark ? '#262630' : '#ECECF0' }]}>
                                        <ChevronRight size={15} color={colors.text} strokeWidth={2.5} />
                                    </View>
                                </TouchableOpacity>

                                {/* Reset All Filters Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.filterResetBtn,
                                        {
                                            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2',
                                            borderColor: '#EF4444',
                                            borderBottomColor: '#B91C1C',
                                        },
                                    ]}
                                    activeOpacity={0.82}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        }
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
                                    <ThemedText style={styles.filterResetText}>
                                        RESET ALL FILTERS
                                    </ThemedText>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* ── Sub-View: Plugs Selection with Connector Icons ── */}
                        {filterSheetView === 'plugs' && (
                            <>
                                <View style={styles.filterSheetHeader}>
                                    <View style={styles.sheetHeaderLeft}>
                                        <TouchableOpacity
                                            style={[
                                                styles.sheetBackCircleBtn,
                                                {
                                                    backgroundColor: isDark ? '#1C1C24' : '#FFFFFF',
                                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                                                    borderBottomColor: isDark ? '#050508' : '#C8C8D0',
                                                },
                                            ]}
                                            activeOpacity={0.8}
                                            onPress={() => {
                                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                setFilterSheetView('main');
                                            }}
                                        >
                                            <ChevronLeft size={20} color={colors.text} strokeWidth={2.5} />
                                        </TouchableOpacity>
                                        <ThemedText style={[styles.filterSheetTitle, { color: colors.text }]}>
                                            Select Plugs
                                        </ThemedText>
                                    </View>
                                    <TouchableOpacity
                                        style={[
                                            styles.filterSaveBtn,
                                            {
                                                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                                borderColor: isDark ? '#FFFFFF' : '#000000',
                                                borderBottomColor: isDark ? '#A0A0A8' : '#333338',
                                            },
                                        ]}
                                        activeOpacity={0.82}
                                        onPress={() => {
                                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                            setFilterSheetView('main');
                                        }}
                                    >
                                        <ThemedText style={[styles.filterSaveBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
                                            DONE
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>

                                <View style={[styles.filterSheetDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />

                                <ThemedText style={[styles.subModalSubtitle, { color: colors.textMuted }]}>
                                    Choose connector types compatible with your vehicle
                                </ThemedText>

                                <View style={styles.plugFilterCardsGrid}>
                                    {CONNECTOR_ITEMS.map((item) => {
                                        const selected = isConnectorSelected(item);
                                        const iconColor = selected
                                            ? (isDark ? '#FFFFFF' : '#000000')
                                            : (isDark ? '#8E8E93' : '#4B4B52');
                                        return (
                                            <TouchableOpacity
                                                key={item.id}
                                                activeOpacity={0.85}
                                                style={[
                                                    styles.plugFilterCard,
                                                    selected
                                                        ? {
                                                              backgroundColor: isDark ? '#1C1D26' : '#FFFFFF',
                                                              borderColor: colors.coral,
                                                              borderWidth: 1.5,
                                                          }
                                                        : {
                                                              backgroundColor: isDark ? '#16171E' : '#F6F6F8',
                                                              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                                              borderWidth: 1,
                                                          },
                                                ]}
                                                onPress={() => {
                                                    if (Platform.OS !== 'web') {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                    }
                                                    toggleConnector(item);
                                                }}
                                            >
                                                {/* Selection Checkmark Badge */}
                                                <View
                                                    style={[
                                                        styles.plugCardCheckmarkBadge,
                                                        selected
                                                            ? {
                                                                  backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                                                  borderColor: isDark ? '#FFFFFF' : '#000000',
                                                              }
                                                            : {
                                                                  backgroundColor: 'transparent',
                                                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                                                              },
                                                    ]}
                                                >
                                                    {selected && <Check size={11} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={3} />}
                                                </View>

                                                {/* Connector SVG Icon */}
                                                <View style={styles.plugFilterCardIconContainer}>
                                                    {item.renderIcon(iconColor)}
                                                </View>

                                                {/* Connector Name */}
                                                <ThemedText
                                                    style={[
                                                        styles.plugFilterCardLabel,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    {item.label}
                                                </ThemedText>

                                                {/* AC / DC Chip */}
                                                <View
                                                    style={[
                                                        styles.plugTypeChip,
                                                        {
                                                            backgroundColor: isDark
                                                                ? 'rgba(255, 255, 255, 0.14)'
                                                                : (selected ? '#000000' : '#E5E5EA'),
                                                        },
                                                    ]}
                                                >
                                                    <ThemedText
                                                        style={[
                                                            styles.plugTypeChipText,
                                                            {
                                                                color: isDark
                                                                    ? '#FFFFFF'
                                                                    : (selected ? '#FFFFFF' : '#000000'),
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
                                        activeOpacity={0.8}
                                        style={[
                                            styles.quickBarBtn,
                                            {
                                                backgroundColor: isDark ? '#1C1C24' : '#FFFFFF',
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                                                borderBottomColor: isDark ? '#050508' : '#C8C8D0',
                                            },
                                        ]}
                                        onPress={() => {
                                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setTempFilterCriteria((prev) => ({
                                                ...prev,
                                                connectorTypes: CONNECTOR_ITEMS.map((c) => c.id),
                                            }));
                                        }}
                                    >
                                        <ThemedText style={[styles.plugsQuickActionText, { color: colors.text }]}>
                                            SELECT ALL
                                        </ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        style={[
                                            styles.quickBarBtn,
                                            {
                                                backgroundColor: isDark ? '#1C1C24' : '#FFFFFF',
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                                                borderBottomColor: isDark ? '#050508' : '#C8C8D0',
                                            },
                                        ]}
                                        onPress={() => {
                                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setTempFilterCriteria((prev) => ({
                                                ...prev,
                                                connectorTypes: [],
                                            }));
                                        }}
                                    >
                                        <ThemedText style={[styles.plugsQuickActionText, { color: colors.textMuted }]}>
                                            CLEAR ALL
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* ── Sub-View: Charger Brands Selection ── */}
                        {filterSheetView === 'brands' && (
                            <>
                                <View style={styles.filterSheetHeader}>
                                    <View style={styles.sheetHeaderLeft}>
                                        <TouchableOpacity
                                            style={[
                                                styles.sheetBackCircleBtn,
                                                {
                                                    backgroundColor: isDark ? '#1C1C24' : '#FFFFFF',
                                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                                                    borderBottomColor: isDark ? '#050508' : '#C8C8D0',
                                                },
                                            ]}
                                            activeOpacity={0.8}
                                            onPress={() => {
                                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                setFilterSheetView('main');
                                            }}
                                        >
                                            <ChevronLeft size={20} color={colors.text} strokeWidth={2.5} />
                                        </TouchableOpacity>
                                        <ThemedText style={[styles.filterSheetTitle, { color: colors.text }]}>
                                            Select Chargers
                                        </ThemedText>
                                    </View>
                                    <TouchableOpacity
                                        style={[
                                            styles.filterSaveBtn,
                                            {
                                                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                                borderColor: isDark ? '#FFFFFF' : '#000000',
                                                borderBottomColor: isDark ? '#A0A0A8' : '#333338',
                                            },
                                        ]}
                                        activeOpacity={0.82}
                                        onPress={() => {
                                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                            setFilterSheetView('main');
                                        }}
                                    >
                                        <ThemedText style={[styles.filterSaveBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
                                            DONE
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>

                                <View style={[styles.filterSheetDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />

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
                                                style={[
                                                    styles.brandItemCard,
                                                    {
                                                        backgroundColor: isDark ? '#181820' : '#FFFFFF',
                                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                                        borderBottomColor: isDark ? '#050508' : '#D4D4DC',
                                                    },
                                                ]}
                                                activeOpacity={0.8}
                                                onPress={() => {
                                                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    toggleBrand(brand.name);
                                                }}
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
                                                    onValueChange={() => {
                                                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                        toggleBrand(brand.name);
                                                    }}
                                                    trackColor={{
                                                        false: isDark ? '#33333E' : '#E2E8F0',
                                                        true: isDark ? '#FFFFFF' : '#000000',
                                                    }}
                                                    thumbColor={selected ? (isDark ? '#000000' : '#FFFFFF') : '#FFFFFF'}
                                                    ios_backgroundColor={isDark ? '#33333E' : '#E2E8F0'}
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
        top: 50,
        left: 0,
        right: 0,
        paddingHorizontal: SPACING.md,
    },
    searchBarWrapper: {
        height: 50,
        borderRadius: RADIUS.input,
        paddingHorizontal: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    searchInput: {
        flex: 1,
        ...FONTS.body,
        marginLeft: 10,
        height: '100%',
    },
    searchActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    searchActionIcon: {
        padding: 4,
    },
    profileWrapper: {
        marginLeft: 2,
    },
    profileCircle: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterScroll: {
        marginTop: 10,
        flexGrow: 0,
    },
    filterContainer: {
        paddingRight: SPACING.md,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    walletFilterRow: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    walletHeaderPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: RADIUS.pill,
        gap: 6,
        borderWidth: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    walletHeaderText: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.bold,
    },
    cardActionCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingActionStack: {
        position: 'absolute',
        right: SPACING.md,
        alignItems: 'center',
        gap: 8,
        zIndex: 25,
    },
    floatingActionButton: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    bottomSheetContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: RADIUS.bottomSheet,
        borderTopRightRadius: RADIUS.bottomSheet,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        overflow: 'hidden',
        zIndex: 30,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 12,
    },
    sheetHeaderWrapper: {
        paddingBottom: 6,
    },
    sheetHandleTouchArea: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    bottomSheetDragHandleBar: {
        width: 38,
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
    sheetTitle: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    sheetSubtitle: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
        marginTop: 2,
    },
    sheetExpandToggleBtn: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    collapsedPeekRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: SPACING.md,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: RADIUS.card,
        borderWidth: 1,
    },
    peekStationName: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    peekStationMeta: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
        marginTop: 2,
    },
    peekActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    peekViewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.chip,
    },
    peekViewBtnText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    sheetScrollListContent: {
        paddingHorizontal: SPACING.md,
        paddingTop: 6,
        gap: 10,
    },
    sheetStationCard: {
        borderRadius: RADIUS.card,
        padding: 14,
        gap: 8,
    },
    sheetStationCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    sheetStationCardInfo: {
        flex: 1,
    },
    sheetStationCardName: {
        ...FONTS.h3,
        fontSize: 14,
    },
    sheetStationCardAddress: {
        ...FONTS.caption,
        fontSize: 11,
        marginTop: 2,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(245, 158, 11, 0.14)',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: RADIUS.pill,
    },
    ratingText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        color: '#F59E0B',
    },
    sheetStationMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    amenitiesPreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    amenityPreviewChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: RADIUS.chip,
    },
    amenityPreviewText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.sansMedium,
    },
    countBadge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: RADIUS.pill,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
    },
    listContent: {
        paddingLeft: 20,
        paddingRight: 10,
        paddingBottom: 16,
        flexDirection: 'row',
        gap: 12,
    },
    stationRow: {
        width: 290,
        borderRadius: RADIUS.card,
        padding: 16,
    },
    stationRowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        borderTopWidth: 1,
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
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: RADIUS.button,
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
        borderRadius: RADIUS.pill,
        padding: 3,
        borderWidth: 1,
        width: 140,
    },
    segmentOption: {
        flex: 1,
        paddingVertical: 7,
        borderRadius: RADIUS.pill,
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
        borderWidth: 1,
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
        borderWidth: 1,
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
        borderWidth: 1,
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
        borderRadius: RADIUS.card,
        borderWidth: 1,
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
        borderWidth: 1,
    },
    plugsQuickActionText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.6,
    },
});
