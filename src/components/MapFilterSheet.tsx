import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BedDouble, Check, ChevronLeft, ChevronRight, Coffee, Plug, ShoppingBag, Sofa, Store, Utensils, Wifi, Bath, Zap } from 'lucide-react-native';
import { ThemedText } from './ThemedText';
import { Ccs2Icon } from './Ccs2Icon';
import { Type2Icon } from './Type2Icon';
import { ChademoIcon } from './ChademoIcon';
import { useAppTheme } from '../hooks/useAppTheme';
import { FONT_FAMILIES, RADIUS } from '../constants/Tokens';

export type MapFilterState = {
    chargerTypes: string[];
    connectorTypes: string[];
    peakPower: string;
    tariffRange: [number, number];
    chargerTypeFilter: 'Any' | 'AC' | 'DC';
    selectedBrands: string[];
    amenities: string[];
};

export const DEFAULT_MAP_FILTERS: MapFilterState = {
    chargerTypes: [],
    connectorTypes: [],
    peakPower: 'Any',
    tariffRange: [0, 50],
    chargerTypeFilter: 'Any',
    selectedBrands: [],
    amenities: [],
};

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


export function countMapFilters(f: MapFilterState) {
    return (
        (f.chargerTypeFilter !== 'Any' ? 1 : 0) +
        f.connectorTypes.length +
        f.selectedBrands.length +
        f.amenities.length
    );
}

/** Same AC/DC, plug and brand matching rules the map screen applies to stations. */
export function stationMatchesMapFilters(station: any, f: MapFilterState) {
    const conns: any[] = station.connectors ?? [];
    if (f.chargerTypeFilter === 'DC' && !conns.some((c) => c.currentType === 'DC' || c.type === 'CCS2' || c.type === 'CHAdeMO' || c.power >= 50)) return false;
    if (f.chargerTypeFilter === 'AC' && !conns.some((c) => c.currentType === 'AC' || c.type === 'Type 2' || c.power < 50)) return false;
    if (
        f.connectorTypes.length > 0 &&
        !conns.some((c) => {
            let mapped = c.type as string;
            if (c.type === 'Type 2') mapped = 'Type II';
            if (c.type === 'CHAdeMO') mapped = 'CHAdeMo';
            return f.connectorTypes.includes(mapped) || f.connectorTypes.includes(c.type);
        })
    ) return false;
    if (
        f.selectedBrands.length > 0 &&
        !f.selectedBrands.some(
            (b) =>
                String(station.name ?? '').toLowerCase().includes(b.toLowerCase()) ||
                String(station.tagline ?? '').toLowerCase().includes(b.toLowerCase())
        )
    ) return false;
    if (f.amenities.length > 0) {
        const have: string[] = station.amenities ?? [];
        const ok = f.amenities.every((id) => {
            const item = AMENITY_ITEMS.find((a) => a.id === id);
            return !item || item.matches.some((m) => have.includes(m));
        });
        if (!ok) return false;
    }
    return true;
}

export type AmenityFilterItem = {
    id: string;
    label: string;
    /** Station amenity names this entry matches */
    matches: string[];
    renderIcon: (color: string, size?: number) => React.ReactNode;
};

export const AMENITY_ITEMS: AmenityFilterItem[] = [
    { id: 'Cafe', label: 'Cafe', matches: ['Cafe', 'Coffee'], renderIcon: (c, size = 32) => <Coffee size={size} color={c} /> },
    { id: 'WiFi', label: 'WiFi', matches: ['WiFi'], renderIcon: (c, size = 32) => <Wifi size={size} color={c} /> },
    { id: 'Restroom', label: 'Restroom', matches: ['Restroom', 'Washroom'], renderIcon: (c, size = 32) => <Bath size={size} color={c} /> },
    { id: 'Food', label: 'Food', matches: ['Restaurant', 'Food Court'], renderIcon: (c, size = 32) => <Utensils size={size} color={c} /> },
    { id: 'Lounge', label: 'Lounge', matches: ['Lounge'], renderIcon: (c, size = 32) => <Sofa size={size} color={c} /> },
    { id: 'Hotel', label: 'Hotel', matches: ['Hotel'], renderIcon: (c, size = 32) => <BedDouble size={size} color={c} /> },
    { id: 'Shopping', label: 'Shopping', matches: ['Mall'], renderIcon: (c, size = 32) => <ShoppingBag size={size} color={c} /> },
    { id: 'Store', label: 'Store', matches: ['Convenience Store', 'Grocery'], renderIcon: (c, size = 32) => <Store size={size} color={c} /> },
];

type Props = {
    visible: boolean;
    criteria: MapFilterState;
    onClose: () => void;
    onApply: (criteria: MapFilterState) => void;
};

/** Shared AC/DC, plugs and charger-brand filter sheet (used by the map and the trip planner). */
export function MapFilterSheet({ visible, criteria, onClose, onApply }: Props) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const [tempFilterCriteria, setTempFilterCriteria] = useState<MapFilterState>(criteria);
    const [filterSheetView, setFilterSheetView] = useState<'main' | 'plugs' | 'brands' | 'amenities'>('main');

    useEffect(() => {
        if (visible) {
            setTempFilterCriteria({ ...criteria });
            setFilterSheetView('main');
        }
    }, [visible]);

    const isConnectorSelected = (item: ConnectorFilterItem) =>
        tempFilterCriteria.connectorTypes.includes(item.id) ||
        Boolean(item.altId && tempFilterCriteria.connectorTypes.includes(item.altId));

    const toggleConnector = (item: ConnectorFilterItem) => {
        setTempFilterCriteria((prev) => {
            const selected = prev.connectorTypes.includes(item.id) || Boolean(item.altId && prev.connectorTypes.includes(item.altId));
            const filtered = prev.connectorTypes.filter((c) => c !== item.id && c !== item.altId);
            return { ...prev, connectorTypes: selected ? filtered : [...filtered, item.id] };
        });
    };

    const isAmenitySelected = (item: AmenityFilterItem) => tempFilterCriteria.amenities.includes(item.id);
    const toggleAmenity = (item: AmenityFilterItem) => {
        setTempFilterCriteria((prev) => ({
            ...prev,
            amenities: prev.amenities.includes(item.id) ? prev.amenities.filter((a) => a !== item.id) : [...prev.amenities, item.id],
        }));
    };

    const isBrandSelected = (brandName: string) => tempFilterCriteria.selectedBrands.includes(brandName);

    const toggleBrand = (brandName: string) => {
        setTempFilterCriteria((prev) => {
            const exists = prev.selectedBrands.includes(brandName);
            return {
                ...prev,
                selectedBrands: exists ? prev.selectedBrands.filter((b) => b !== brandName) : [...prev.selectedBrands, brandName],
            };
        });
    };

    const allBrandNames = useMemo(() => INDIAN_CHARGER_BRANDS.map((b) => b.name), []);
    const isAllBrandsSelected = allBrandNames.every((name) => tempFilterCriteria.selectedBrands.includes(name));
    const handleToggleAllBrands = () => {
        setTempFilterCriteria((prev) => ({ ...prev, selectedBrands: isAllBrandsSelected ? [] : [...allBrandNames] }));
    };

    return (
            <Modal
                visible={visible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    onClose();
                    setFilterSheetView('main');
                }}
            >
                <View style={styles.sheetOverlay}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => {
                            onClose();
                            setFilterSheetView('main');
                        }}
                    />
                    <View
                        style={[
                            styles.filterSheetContainer,
                            {
                                backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                                maxHeight: filterSheetView === 'brands' ? '90%' : filterSheetView === 'plugs' || filterSheetView === 'amenities' ? '82%' : undefined,
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
                                            onApply({ ...tempFilterCriteria });
                                            onClose();
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

                                {/* Amenities Row (Tappable Tactile Card) */}
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
                                        setFilterSheetView('amenities');
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={[styles.filterNavTitle, { color: colors.text }]}>Amenities</ThemedText>
                                        <ThemedText style={[styles.filterNavSubtitle, { color: colors.textMuted }]}>
                                            {tempFilterCriteria.amenities.length > 0
                                                ? tempFilterCriteria.amenities.join(', ')
                                                : 'Cafe, WiFi, Restroom, Lounge and more'}
                                        </ThemedText>
                                    </View>
                                    <View style={styles.brandLogosCluster}>
                                        {AMENITY_ITEMS.slice(0, 4).map((a, i) => (
                                            <View
                                                key={a.id}
                                                style={[styles.brandAvatar, { backgroundColor: isDark ? '#262630' : '#ECECF0', borderColor: isDark ? '#181820' : '#F6F6F8', marginLeft: i === 0 ? 0 : -8 }]}
                                            >
                                                {a.renderIcon(isDark ? '#FFFFFF' : '#000000', 11)}
                                            </View>
                                        ))}
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
                                        setTempFilterCriteria({ ...DEFAULT_MAP_FILTERS });
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
                                                              backgroundColor: isDark ? '#1C1C24' : '#FFFFFF',
                                                              borderColor: isDark ? '#FFFFFF' : '#000000',
                                                              borderWidth: 2,
                                                              borderBottomWidth: 4.5,
                                                              borderBottomColor: isDark ? '#9E9EA8' : '#000000',
                                                          }
                                                        : {
                                                              backgroundColor: isDark ? '#121216' : '#F6F6F8',
                                                              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                                              borderWidth: 1.5,
                                                              borderBottomWidth: 3,
                                                              borderBottomColor: isDark ? '#050508' : '#D0D0D8',
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

                        {filterSheetView === 'amenities' && (
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
                                            Select Amenities
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
                                    Show chargers with these facilities
                                </ThemedText>

                                <ScrollView showsVerticalScrollIndicator={false}>
<View style={styles.plugFilterCardsGrid}>
                                    {AMENITY_ITEMS.map((item) => {
                                        const selected = isAmenitySelected(item);
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
                                                              backgroundColor: isDark ? '#1C1C24' : '#FFFFFF',
                                                              borderColor: isDark ? '#FFFFFF' : '#000000',
                                                              borderWidth: 2,
                                                              borderBottomWidth: 4.5,
                                                              borderBottomColor: isDark ? '#9E9EA8' : '#000000',
                                                          }
                                                        : {
                                                              backgroundColor: isDark ? '#121216' : '#F6F6F8',
                                                              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                                              borderWidth: 1.5,
                                                              borderBottomWidth: 3,
                                                              borderBottomColor: isDark ? '#050508' : '#D0D0D8',
                                                          },
                                                ]}
                                                onPress={() => {
                                                    if (Platform.OS !== 'web') {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                    }
                                                    toggleAmenity(item);
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
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
</ScrollView>

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
                                                amenities: AMENITY_ITEMS.map((c) => c.id),
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
                                                amenities: [],
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
    );
}

const styles = StyleSheet.create({
    brandActionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 10,
        paddingVertical: 4,
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
    brandCountText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.medium,
    },
    brandDeselectText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
    },
    brandItemAvatar: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
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
    brandItemName: {
        fontSize: 14,
        fontFamily: FONT_FAMILIES.semiBold,
    },
    brandLogosCluster: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 4,
    },
    brandScrollContent: {
        paddingBottom: 24,
    },
    dragHandleBar: {
        width: 40,
        height: 4.5,
        borderRadius: RADIUS.pill,
        alignSelf: 'center',
        marginBottom: 16,
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
    filterNavSubtitle: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.medium,
        marginTop: 2,
    },
    filterNavTitle: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
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
    filterSheetContainer: {
        borderTopLeftRadius: RADIUS.bottomSheet,
        borderTopRightRadius: RADIUS.bottomSheet,
        borderTopWidth: 2,
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    filterSheetDivider: {
        height: 1,
        marginVertical: 14,
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
    navChevronCircle: {
        width: 28,
        height: 28,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
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
    plugFilterCard: {
        width: '48%',
        borderRadius: RADIUS.card,
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
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
    plugFilterCardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
        marginBottom: 12,
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
    plugsQuickActionText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.6,
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
    segmentOption: {
        flex: 1,
        paddingVertical: 7,
        borderRadius: RADIUS.chip,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentText: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.medium,
    },
    segmentTextSelected: {
        fontFamily: FONT_FAMILIES.extraBold,
    },
    segmentedControl: {
        flexDirection: 'row',
        borderRadius: RADIUS.button,
        padding: 3,
        borderWidth: 1.5,
        borderBottomWidth: 3,
        width: 140,
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
    sheetHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    subModalSubtitle: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.medium,
        marginBottom: 14,
    },
    segmentOptionSelected: {},
});
