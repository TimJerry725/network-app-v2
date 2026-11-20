import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BedDouble, Check, ChevronLeft, ChevronRight, Coffee, Plug, ShoppingBag, Sofa, Store, Utensils, Wifi, Bath, Zap } from './sf/icons';
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
        bgColor: '#FF9500',
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
        bgColor: '#34C759',
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
        bgColor: '#FF3B30',
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
    const [filterSheetView, setFilterSheetView] = useState<'main' | 'brands' | 'amenities'>('main');

    useEffect(() => {
        if (visible) {
            setTempFilterCriteria({ ...criteria });
            setFilterSheetView('main');
        }
    }, [visible]);

    const visibleConnectors = CONNECTOR_ITEMS.filter(
        (c) => tempFilterCriteria.chargerTypeFilter === 'Any' || c.currentType === tempFilterCriteria.chargerTypeFilter
    );

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

    const bottomBar = (onClear: () => void) => (
        <View style={[styles.filterBottomBar, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Clear selection"
                style={[styles.filterResetFull, { backgroundColor: colors.surface }]}
                activeOpacity={0.85}
                onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onClear();
                }}
            >
                <ThemedText style={[styles.filterResetFullText, { color: colors.text }]}>Clear</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Done"
                style={styles.filterSaveFull}
                activeOpacity={0.85}
                onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setFilterSheetView('main');
                }}
            >
                <ThemedText style={styles.filterSaveFullText}>Done</ThemedText>
            </TouchableOpacity>
        </View>
    );

    return (
            <Modal
                visible={visible}
                transparent={false}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => {
                    onClose();
                    setFilterSheetView('main');
                }}
            >
                <View
                    style={[
                        styles.filterPage,
                        {
                            backgroundColor: colors.background,
                            paddingTop: insets.top + 8,
                        },
                    ]}
                >
                        {filterSheetView === 'main' && (
                            <>
                                {/* Page header: close, title, reset */}
                                <View style={styles.filterSheetHeader}>
                                    <View style={styles.sheetHeaderLeft}>
                                        <TouchableOpacity
                                            accessibilityRole="button"
                                            accessibilityLabel="Close filters"
                                            style={[
                                                styles.sheetBackCircleBtn,
                                                {
                                                    backgroundColor: colors.surface,
                                                    borderColor: colors.border,
                                                },
                                            ]}
                                            activeOpacity={0.8}
                                            onPress={() => {
                                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                onClose();
                                                setFilterSheetView('main');
                                            }}
                                        >
                                            <ChevronLeft size={20} color={colors.text} strokeWidth={2.5} />
                                        </TouchableOpacity>
                                        <ThemedText style={[styles.filterSheetTitle, { color: colors.text }]}>
                                            Filter
                                        </ThemedText>
                                    </View>
                                </View>

                                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                                                backgroundColor: isDark ? 'rgba(118,118,128,0.24)' : 'rgba(118,118,128,0.12)',
                                                borderColor: 'transparent',
                                            },
                                        ]}
                                    >
                                        {(['Any', 'AC', 'DC'] as const).map((type) => {
                                            const isSelected = tempFilterCriteria.chargerTypeFilter === type;
                                            return (
                                                <TouchableOpacity
                                                    key={type}
                                                    style={[
                                                        styles.segmentOption,
                                                        isSelected && [
                                                            styles.segmentOptionSelected,
                                                            {
                                                                backgroundColor: colors.primary,
                                                            },
                                                        ],
                                                    ]}
                                                    activeOpacity={0.82}
                                                    onPress={() => {
                                                        if (Platform.OS !== 'web') {
                                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                        }
                                                        setTempFilterCriteria((prev) => {
                                                            const next = prev.chargerTypeFilter === type ? 'Any' : type;
                                                            const allowed = CONNECTOR_ITEMS.filter((c) => next === 'Any' || c.currentType === next);
                                                            return {
                                                                ...prev,
                                                                chargerTypeFilter: next,
                                                                connectorTypes: prev.connectorTypes.filter((id) =>
                                                                    allowed.some((c) => c.id === id || c.altId === id)
                                                                ),
                                                            };
                                                        });
                                                    }}
                                                >
                                                    <ThemedText
                                                        style={[
                                                            styles.segmentText,
                                                            {
                                                                color: isSelected
                                                                    ? ('#FFFFFF')
                                                                    : colors.textMuted,
                                                            },
                                                            isSelected && styles.segmentTextSelected,
                                                        ]}
                                                    >
                                                        {type === 'Any' ? 'All' : type}
                                                    </ThemedText>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* 2. Plugs, shown inline and narrowed by the charger type above */}
                                <View style={styles.plugsInlineHeader}>
                                    <ThemedText style={[styles.filterRowLabel, { color: colors.text }]}>Plugs</ThemedText>
                                    <ThemedText style={[styles.filterNavSubtitle, { color: colors.textMuted }]}>
                                        {tempFilterCriteria.chargerTypeFilter === 'Any'
                                            ? 'All AC and DC plugs'
                                            : `${tempFilterCriteria.chargerTypeFilter} plugs only`}
                                        {tempFilterCriteria.connectorTypes.length > 0 ? ` · ${tempFilterCriteria.connectorTypes.length} selected` : ''}
                                    </ThemedText>
                                </View>
                                <View style={styles.plugFilterCardsGrid}>
                                    {visibleConnectors.map((item) => {
                                        const selected = isConnectorSelected(item);
                                        const iconColor = selected
                                            ? (colors.primary)
                                            : (colors.textMuted);
                                        return (
                                            <TouchableOpacity
                                                key={item.id}
                                                activeOpacity={0.85}
                                                style={[
                                                    styles.plugFilterCard,
                                                    styles.plugInlineCard,
                                                    selected
                                                        ? {
                                                              backgroundColor: isDark ? 'rgba(10,132,255,0.2)' : 'rgba(0,122,255,0.1)',
                                                              borderColor: colors.primary,
                                                              borderWidth: 2,
                                                          }
                                                        : {
                                                              backgroundColor: colors.surface,
                                                              borderColor: 'transparent',
                                                              borderWidth: 2,
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
                                                                  backgroundColor: colors.primary,
                                                                  borderColor: colors.primary,
                                                              }
                                                            : {
                                                                  backgroundColor: 'transparent',
                                                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                                                              },
                                                    ]}
                                                >
                                                    {selected && <Check size={11} color={'#FFFFFF'} strokeWidth={3} />}
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
                                                                : (selected ? colors.primary : 'rgba(118,118,128,0.14)'),
                                                        },
                                                    ]}
                                                >
                                                    <ThemedText
                                                        style={[
                                                            styles.plugTypeChipText,
                                                            {
                                                                color: isDark
                                                                    ? '#FFFFFF'
                                                                    : (selected ? '#FFFFFF' : colors.text),
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

                                {/* 3. Chargers Row (Tappable Tactile Card with Avatars) */}
                                <TouchableOpacity
                                    style={[
                                        styles.filterNavCard,
                                        {
                                            backgroundColor: colors.surface,
                                            borderColor: 'transparent',
                                            marginTop: 8,
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
                                        <View style={[styles.brandAvatar, { backgroundColor: '#FFFFFF', borderColor: colors.surface }]}>
                                            <Zap size={9} color="#000" fill="#000" />
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#005AA9', borderColor: colors.surface, marginLeft: -8 }]}>
                                            <ThemedText style={[styles.brandAvatarText, { fontSize: 8 }]}>EZ</ThemedText>
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#009A44', borderColor: colors.surface, marginLeft: -8 }]}>
                                            <ThemedText style={[styles.brandAvatarText, { fontSize: 8 }]}>bp</ThemedText>
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#FF9500', borderColor: colors.surface, marginLeft: -8 }]}>
                                            <Zap size={10} color="#FFF" fill="#FFF" />
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#2563EB', borderColor: colors.surface, marginLeft: -8 }]}>
                                            <ThemedText style={[styles.brandAvatarText, { fontSize: 9 }]}>Z</ThemedText>
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#34C759', borderColor: colors.surface, marginLeft: -8 }]}>
                                            <Zap size={9} color="#FFF" fill="#FFF" />
                                        </View>
                                        <View style={[styles.brandAvatar, { backgroundColor: '#FF5722', borderColor: colors.surface, marginLeft: -8 }]}>
                                            <ThemedText style={[styles.brandAvatarText, { fontSize: 9 }]}>A</ThemedText>
                                        </View>
                                    </View>

                                    <View style={[styles.navChevronCircle, { backgroundColor: isDark ? 'rgba(118,118,128,0.3)' : 'rgba(118,118,128,0.14)' }]}>
                                        <ChevronRight size={15} color={colors.text} strokeWidth={2.5} />
                                    </View>
                                </TouchableOpacity>

                                {/* Amenities Row (Tappable Tactile Card) */}
                                <TouchableOpacity
                                    style={[
                                        styles.filterNavCard,
                                        {
                                            backgroundColor: colors.surface,
                                            borderColor: 'transparent',
                                            marginTop: 8,
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
                                                style={[styles.brandAvatar, { backgroundColor: isDark ? 'rgba(118,118,128,0.3)' : 'rgba(118,118,128,0.14)', borderColor: colors.surface, marginLeft: i === 0 ? 0 : -8 }]}
                                            >
                                                {a.renderIcon(colors.primary, 11)}
                                            </View>
                                        ))}
                                    </View>
                                    <View style={[styles.navChevronCircle, { backgroundColor: isDark ? 'rgba(118,118,128,0.3)' : 'rgba(118,118,128,0.14)' }]}>
                                        <ChevronRight size={15} color={colors.text} strokeWidth={2.5} />
                                    </View>
                                </TouchableOpacity>

                                </ScrollView>

                                {/* Save pinned to the bottom */}
                                <View
                                    style={[
                                        styles.filterBottomBar,
                                        {
                                            paddingBottom: Math.max(insets.bottom, 16),
                                            backgroundColor: colors.background,
                                            borderTopColor: colors.border,
                                        },
                                    ]}
                                >
                                    <TouchableOpacity
                                        accessibilityRole="button"
                                        accessibilityLabel="Reset all filters"
                                        style={[styles.filterResetFull, { borderColor: colors.border, backgroundColor: colors.surface }]}
                                        activeOpacity={0.85}
                                        onPress={() => {
                                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            setTempFilterCriteria({ ...DEFAULT_MAP_FILTERS });
                                        }}
                                    >
                                        <ThemedText style={[styles.filterResetFullText, { color: colors.text }]}>Reset</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        accessibilityRole="button"
                                        accessibilityLabel="Save filters"
                                        style={styles.filterSaveFull}
                                        activeOpacity={0.85}
                                        onPress={() => {
                                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                            onApply({ ...tempFilterCriteria });
                                            onClose();
                                        }}
                                    >
                                        <ThemedText style={styles.filterSaveFullText}>
                                            {countMapFilters(tempFilterCriteria) > 0 ? `Save · ${countMapFilters(tempFilterCriteria)} filters` : 'Save'}
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* ── Sub-View: Plugs Selection with Connector Icons ── */}
                        {filterSheetView === 'amenities' && (
                            <>
                                <View style={styles.filterSheetHeader}>
                                    <View style={styles.sheetHeaderLeft}>
                                        <TouchableOpacity
                                            style={[
                                                styles.sheetBackCircleBtn,
                                                {
                                                    backgroundColor: colors.surface,
                                                    borderColor: 'transparent',
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
                                </View>

                                <View style={[styles.filterSheetDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />

                                <View style={styles.brandActionBar}>
                                    <ThemedText style={[styles.brandCountText, { color: colors.textMuted }]}>
                                        {tempFilterCriteria.amenities.length === 0
                                            ? 'Show chargers with these facilities'
                                            : `${tempFilterCriteria.amenities.length} of ${AMENITY_ITEMS.length} selected`}
                                    </ThemedText>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() =>
                                            setTempFilterCriteria((prev) => ({
                                                ...prev,
                                                amenities: prev.amenities.length === AMENITY_ITEMS.length ? [] : AMENITY_ITEMS.map((c) => c.id),
                                            }))
                                        }
                                    >
                                        <ThemedText style={[styles.brandDeselectText, { color: colors.primary }]}>
                                            {tempFilterCriteria.amenities.length === AMENITY_ITEMS.length ? 'Deselect all' : 'Select all'}
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
<View style={styles.plugFilterCardsGrid}>
                                    {AMENITY_ITEMS.map((item) => {
                                        const selected = isAmenitySelected(item);
                                        const iconColor = selected
                                            ? (colors.primary)
                                            : (colors.textMuted);
                                        return (
                                            <TouchableOpacity
                                                key={item.id}
                                                activeOpacity={0.85}
                                                style={[
                                                    styles.plugFilterCard,
                                                    selected
                                                        ? {
                                                              backgroundColor: isDark ? 'rgba(10,132,255,0.2)' : 'rgba(0,122,255,0.1)',
                                                              borderColor: colors.primary,
                                                              borderWidth: 2,
                                                          }
                                                        : {
                                                              backgroundColor: colors.surface,
                                                              borderColor: 'transparent',
                                                              borderWidth: 2,
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
                                                                  backgroundColor: colors.primary,
                                                                  borderColor: colors.primary,
                                                              }
                                                            : {
                                                                  backgroundColor: 'transparent',
                                                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                                                              },
                                                    ]}
                                                >
                                                    {selected && <Check size={11} color={'#FFFFFF'} strokeWidth={3} />}
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

                                {bottomBar(() => setTempFilterCriteria((prev) => ({ ...prev, amenities: [] })))}
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
                                                    backgroundColor: colors.surface,
                                                    borderColor: 'transparent',
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
                                </View>

                                <View style={[styles.filterSheetDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />

                                <ScrollView
                                    style={{ flex: 1 }}
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
                                                        backgroundColor: colors.surface,
                                                        borderColor: 'transparent',
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
                                                        true: colors.success,
                                                    }}
                                                    thumbColor="#FFFFFF"
                                                    ios_backgroundColor={isDark ? '#33333E' : '#E2E8F0'}
                                                />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                                {bottomBar(() => setTempFilterCriteria((prev) => ({ ...prev, selectedBrands: [] })))}
                            </>
                        )}
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
        marginBottom: 8,
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
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: RADIUS.tile,
        borderWidth: 1.5,
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
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 22,
    },
    filterNavSubtitle: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.medium,
        marginTop: 2.0,
    },
    filterNavTitle: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
    },
    filterResetBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 16,
        borderRadius: RADIUS.button,
        borderWidth: 1.5,
    },
    filterResetText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.extraBold,
        color: '#FF3B30',
        letterSpacing: 0.8,
    },
    filterRowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    filterRowLabel: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
    },
    filterSaveBtn: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: RADIUS.button,
        borderWidth: 1.5,
    },
    filterSaveBtnText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.extraBold,
        letterSpacing: 0.8,
    },
    filterPage: {
        flex: 1,
        paddingHorizontal: 20,
    },
    filterBottomBar: {
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        gap: 8,
    },
    filterResetFull: {
        flex: 1,
        height: 54,
        borderRadius: 27,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterResetFullText: {
        fontSize: 16,
        fontFamily: FONT_FAMILIES.extraBold,
    },
    filterSaveFull: {
        flex: 2,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterSaveFullText: {
        fontSize: 16,
        fontFamily: FONT_FAMILIES.extraBold,
        color: '#FFFFFF',
    },
    filterSheetContainer: {
        borderTopLeftRadius: RADIUS.bottomSheet,
        borderTopRightRadius: RADIUS.bottomSheet,
        borderTopWidth: 2,
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    filterSheetDivider: {
        height: StyleSheet.hairlineWidth,
        marginVertical: 12,
    },
    filterSheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    filterSheetTitle: {
        fontSize: 28,
        fontFamily: FONT_FAMILIES.extraBold,
        letterSpacing: -0.6,
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
        borderRadius: 22,
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
    plugsInlineHeader: {
        marginTop: 16,
        marginBottom: 8,
        gap: 2.0,
    },
    plugInlineCard: {
        paddingVertical: 12,
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
        paddingVertical: 4,
        borderRadius: RADIUS.chip,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
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
        gap: 8,
        marginTop: 8,
    },
    quickBarBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: RADIUS.button,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    segmentOption: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 10,
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
        borderRadius: 12,
        padding: 4,
        width: 150,
    },
    sheetBackCircleBtn: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    sheetHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    subModalSubtitle: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.medium,
        marginBottom: 16,
    },
    segmentOptionSelected: {},
});
