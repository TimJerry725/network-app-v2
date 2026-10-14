import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, DimensionValue, TextInput } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../../constants/Tokens';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { MapPin, Zap, Check, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ccs2Icon } from '../../components/Ccs2Icon';
import { Type2Icon } from '../../components/Type2Icon';
import { ChademoIcon } from '../../components/ChademoIcon';

export type FilterState = {
    chargerTypes: string[];
    connectorTypes: string[];
    peakPower: string;
    tariffRange: [number, number];
};

type RootStackParamList = {
    Filter: {
        initialFilters?: FilterState;
        onApply: (filters: FilterState) => void;
    };
};

const SCREEN_WIDTH = Dimensions.get('window').width;

const DEFAULT_FILTERS: FilterState = {
    chargerTypes: [],
    connectorTypes: [],
    peakPower: 'Any',
    tariffRange: [10, 30],
};

export default function FilterScreen() {
    const { colors } = useAppTheme();
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RootStackParamList, 'Filter'>>();
    const insets = useSafeAreaInsets();

    const [filters, setFilters] = useState<FilterState>(
        route.params?.initialFilters || DEFAULT_FILTERS
    );

    const toggleSelection = (key: keyof Omit<FilterState, 'tariffRange' | 'peakPower'>, value: string) => {
        setFilters(prev => {
            const list = prev[key] as string[];
            if (list.includes(value)) {
                return { ...prev, [key]: list.filter(item => item !== value) };
            }
            return { ...prev, [key]: [...list, value] };
        });
    };

    const setPeakPower = (value: string) => {
        setFilters(prev => ({
            ...prev,
            peakPower: prev.peakPower === value ? 'Any' : value,
        }));
    };

    const isSelected = (key: keyof Omit<FilterState, 'tariffRange' | 'peakPower'>, value: string) => {
        return (filters[key] as string[]).includes(value);
    };

    const isPeakPowerSelected = (value: string) => filters.peakPower === value;

    const handleClear = () => {
        setFilters(DEFAULT_FILTERS);
    };

    const handleApply = () => {
        if (route.params?.onApply) {
            route.params.onApply(filters);
        }
        navigation.goBack();
    };

    const renderToggleButton = (key: keyof Omit<FilterState, 'tariffRange' | 'peakPower'>, value: string, label: string, icon?: React.ReactNode, width?: DimensionValue) => {
        const selected = isSelected(key, value);
        return (
            <TouchableOpacity
                style={[
                    styles.toggleButton,
                    { width: width || '48%' },
                    { backgroundColor: selected ? colors.primarySoft : colors.surface },
                ]}
                onPress={() => toggleSelection(key, value)}
                activeOpacity={0.7}
            >
                {icon}
                <ThemedText style={[styles.toggleText, { color: selected ? colors.primaryStrong : colors.text }]}>
                    {label}
                </ThemedText>
            </TouchableOpacity>
        );
    };

    const renderPeakPowerButton = (value: string, label: string) => {
        const selected = isPeakPowerSelected(value);
        return (
            <TouchableOpacity
                style={[
                    styles.toggleButton,
                    { width: '48%' },
                    { backgroundColor: selected ? colors.primarySoft : colors.surface },
                ]}
                onPress={() => setPeakPower(value)}
                activeOpacity={0.7}
            >
                <ThemedText style={[styles.toggleText, { color: selected ? colors.primaryStrong : colors.text }]}>
                    {label}
                </ThemedText>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Filter Options</ThemedText>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Charger Type */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Select Charger Type</ThemedText>
                    <View style={styles.row}>
                        {renderToggleButton('chargerTypes', 'DC', 'DC Chargers', <MapPin size={16} color={isSelected('chargerTypes', 'DC') ? colors.primaryStrong : colors.text} style={{ marginRight: 6 }} />)}
                        {renderToggleButton('chargerTypes', 'AC', 'AC Chargers', <MapPin size={16} color={isSelected('chargerTypes', 'AC') ? colors.primaryStrong : colors.text} style={{ marginRight: 6 }} />)}
                    </View>
                </View>

                {/* Connector Type */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Select Connector Type</ThemedText>
                    <View style={styles.connectorRow}>
                        {(() => {
                            const showDC = filters.chargerTypes.length === 0 || filters.chargerTypes.includes('DC');
                            const showAC = filters.chargerTypes.length === 0 || filters.chargerTypes.includes('AC');
                            return (
                                <>
                                {showDC && (
                                    <TouchableOpacity
                                        style={[
                                            styles.squareButton,
                                            { backgroundColor: isSelected('connectorTypes', 'CCS2') ? colors.primarySoft : colors.surface },
                                        ]}
                                        onPress={() => toggleSelection('connectorTypes', 'CCS2')}
                                    >
                                        <Ccs2Icon size={32} color={isSelected('connectorTypes', 'CCS2') ? colors.primaryStrong : colors.text} />
                                        <ThemedText style={[styles.squareText, { color: isSelected('connectorTypes', 'CCS2') ? colors.primaryStrong : colors.text }]}>CCS2</ThemedText>
                                    </TouchableOpacity>
                                )}

                                {showAC && (
                                    <TouchableOpacity
                                        style={[
                                            styles.squareButton,
                                            { backgroundColor: isSelected('connectorTypes', 'Type II') ? colors.primarySoft : colors.surface },
                                        ]}
                                        onPress={() => toggleSelection('connectorTypes', 'Type II')}
                                    >
                                        <Type2Icon size={32} color={isSelected('connectorTypes', 'Type II') ? colors.primaryStrong : colors.text} />
                                        <ThemedText style={[styles.squareText, { color: isSelected('connectorTypes', 'Type II') ? colors.primaryStrong : colors.text }]}>Type II</ThemedText>
                                    </TouchableOpacity>
                                )}

                                {showDC && (
                                    <TouchableOpacity
                                        style={[
                                            styles.squareButton,
                                            { backgroundColor: isSelected('connectorTypes', 'CHAdeMo') ? colors.primarySoft : colors.surface },
                                        ]}
                                        onPress={() => toggleSelection('connectorTypes', 'CHAdeMo')}
                                    >
                                        <ChademoIcon size={32} color={isSelected('connectorTypes', 'CHAdeMo') ? colors.primaryStrong : colors.text} />
                                        <ThemedText style={[styles.squareText, { color: isSelected('connectorTypes', 'CHAdeMo') ? colors.primaryStrong : colors.text }]}>CHAdeMo</ThemedText>
                                    </TouchableOpacity>
                                )}
                                </>
                            );
                        })()}
                    </View>
                </View>

                {/* Peak Power */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Peak Power</ThemedText>
                    <View style={styles.row}>
                        {renderPeakPowerButton('Any', 'Any')}
                        {renderPeakPowerButton('<22kW', '<22kW')}
                    </View>
                    <View style={[styles.row, { marginTop: SPACING.sm }]}>
                        {renderPeakPowerButton('60kW+', '60kW+')}
                        {renderPeakPowerButton('120kW+', '120kW+')}
                    </View>
                </View>

                {/* Tariff Range */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Tariff Range</ThemedText>
                    <View style={{ alignItems: 'center', marginBottom: SPACING.md }}>
                        <MultiSlider
                            values={[filters.tariffRange[0], filters.tariffRange[1]]}
                            sliderLength={SCREEN_WIDTH - SPACING.xl * 2}
                            onValuesChange={(values) => setFilters({ ...filters, tariffRange: [values[0], values[1]] })}
                            min={0}
                            max={50}
                            step={1}
                            selectedStyle={{ backgroundColor: colors.primary }}
                            unselectedStyle={{ backgroundColor: '#E0E0E0' }}
                            markerStyle={{ backgroundColor: colors.primary, width: 24, height: 24, borderRadius: 12, marginTop: 4 }}
                            containerStyle={{ height: 40 }}
                            trackStyle={{ height: 6, borderRadius: 3 }}
                        />
                    </View>
                    <View style={styles.row}>
                        <View style={styles.inputContainer}>
                            <ThemedText style={styles.inputLabel}>From (₹)</ThemedText>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text }]}
                                keyboardType="numeric"
                                value={filters.tariffRange[0].toString()}
                                onChangeText={(text) => {
                                    const val = parseInt(text) || 0;
                                    setFilters({ ...filters, tariffRange: [val, filters.tariffRange[1]] });
                                }}
                            />
                        </View>
                        <View style={{ width: SPACING.md }} />
                        <View style={styles.inputContainer}>
                            <ThemedText style={styles.inputLabel}>To (₹)</ThemedText>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text }]}
                                keyboardType="numeric"
                                value={filters.tariffRange[1].toString()}
                                onChangeText={(text) => {
                                    const val = parseInt(text) || 0;
                                    setFilters({ ...filters, tariffRange: [filters.tariffRange[0], val] });
                                }}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
                <TouchableOpacity onPress={handleClear} style={[styles.clearBtn, { backgroundColor: colors.surfaceMuted }]}>
                    <ThemedText style={[styles.clearText, { color: colors.primary }]}>Clear</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary }]} onPress={handleApply}>
                    <ThemedText style={styles.applyText}>Apply</ThemedText>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
    },
    headerTitle: {
        ...FONTS.h3,
        fontWeight: '700',
    },
    backButton: {
        padding: 4,
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: 20,
    },
    section: {
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        ...FONTS.body,
        fontWeight: '700',
        marginBottom: SPACING.sm,
        color: '#333333',
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipText: {
        ...FONTS.caption,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    connectorRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: SPACING.md,
    },
    inputContainer: {
        flex: 1,
    },
    inputLabel: {
        ...FONTS.caption,
        fontWeight: '600',
        marginBottom: 8,
    },
    textInput: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: RADIUS.button,
        ...FONTS.body,
        fontWeight: '600',
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: RADIUS.button,
    },
    toggleText: {
        ...FONTS.caption,
        fontWeight: '600',
    },
    squareButton: {
        width: '30%',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.button,
    },
    squareText: {
        ...FONTS.caption,
        fontWeight: '600',
        marginTop: 6,
    },
    tariffHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    tariffBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
    },
    tariffBadgeText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 12,
    },
    tariffResultBadge: {
        position: 'absolute',
        right: 0,
        top: -10,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#FFFFFF',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        backgroundColor: '#FFFFFF',
    },
    clearBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginRight: SPACING.md,
        borderRadius: RADIUS.button,
    },
    clearText: {
        fontWeight: '700',
        fontSize: 15,
    },
    applyBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: RADIUS.button,
    },
    applyText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
});
