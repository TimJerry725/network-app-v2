import React, { useState } from 'react';
import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, BatteryCharging, ChevronRight, MapPin, SlidersHorizontal, Sparkles, Zap } from 'lucide-react-native';

import { Ccs2Icon } from '../../components/Ccs2Icon';
import { ChademoIcon } from '../../components/ChademoIcon';
import { CredButton } from '../../components/CredButton';
import { Neo3DSelectTile } from '../../components/Neo3DSelectTile';
import { ThemedText } from '../../components/ThemedText';
import { Type2Icon } from '../../components/Type2Icon';
import { CRED_BEZEL, FONT_FAMILIES, RADIUS, SPACING } from '../../constants/Tokens';
import { useAppTheme } from '../../hooks/useAppTheme';

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
    const { colors, isDark } = useAppTheme();
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RootStackParamList, 'Filter'>>();
    const insets = useSafeAreaInsets();

    const [filters, setFilters] = useState<FilterState>(
        route.params?.initialFilters || DEFAULT_FILTERS
    );

    const toggleSelection = (
        key: keyof Omit<FilterState, 'tariffRange' | 'peakPower'>,
        value: string
    ) => {
        setFilters((prev) => {
            const list = prev[key] as string[];
            if (list.includes(value)) {
                return { ...prev, [key]: list.filter((item) => item !== value) };
            }
            return { ...prev, [key]: [...list, value] };
        });
    };

    const setPeakPower = (value: string) => {
        setFilters((prev) => ({
            ...prev,
            peakPower: prev.peakPower === value ? 'Any' : value,
        }));
    };

    const isSelected = (
        key: keyof Omit<FilterState, 'tariffRange' | 'peakPower'>,
        value: string
    ) => {
        return (filters[key] as string[]).includes(value);
    };

    const isPeakPowerSelected = (value: string) => filters.peakPower === value;

    const handleClear = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setFilters(DEFAULT_FILTERS);
    };

    const handleApply = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        if (route.params?.onApply) {
            route.params.onApply(filters);
        }
        navigation.goBack();
    };

    const showDC =
        filters.chargerTypes.length === 0 || filters.chargerTypes.includes('DC');
    const showAC =
        filters.chargerTypes.length === 0 || filters.chargerTypes.includes('AC');

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View
                style={[
                    styles.header,
                    {
                        paddingTop: Math.max(insets.top, 16),
                        borderBottomColor: colors.cardBorder,
                    },
                ]}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[
                        styles.backButton,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.cardBorder,
                        },
                    ]}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={20} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.headerTitleWrap}>
                    <ThemedText style={[styles.eyebrow, { color: colors.primary }]}>
                        HARDWARE FILTERS
                    </ThemedText>
                    <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Filter Options</ThemedText>
                </View>

                <TouchableOpacity
                    onPress={handleClear}
                    style={styles.clearHeaderButton}
                    activeOpacity={0.7}
                >
                    <ThemedText style={[styles.resetText, { color: colors.textMuted }]}>
                        Reset
                    </ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Charger Type */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <ThemedText style={styles.sectionTitle}>CHARGER TYPE</ThemedText>
                        <ThemedText style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                            Fast DC or Destination AC
                        </ThemedText>
                    </View>
                    <View style={styles.row}>
                        <Neo3DSelectTile
                            label="DC Fast Chargers"
                            sublabel="Up to 350 kW"
                            width="48%"
                            isSelected={isSelected('chargerTypes', 'DC')}
                            onPress={() => toggleSelection('chargerTypes', 'DC')}
                            iconName="bolt"
                            outlineIcon={<Zap size={22} color={colors.textMuted} strokeWidth={1.8} />}
                        />
                        <Neo3DSelectTile
                            label="AC Destination"
                            sublabel="Up to 22 kW"
                            width="48%"
                            isSelected={isSelected('chargerTypes', 'AC')}
                            onPress={() => toggleSelection('chargerTypes', 'AC')}
                            iconName="map-pin"
                            outlineIcon={<MapPin size={22} color={colors.textMuted} strokeWidth={1.8} />}
                        />
                    </View>
                </View>

                {/* Connector Type */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <ThemedText style={styles.sectionTitle}>CONNECTOR INTERFACE</ThemedText>
                        <ThemedText style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                            Select matching vehicle port
                        </ThemedText>
                    </View>
                    <View style={styles.connectorRow}>
                        {showDC && (
                            <Neo3DSelectTile
                                label="CCS2"
                                sublabel="Fast DC"
                                width="31%"
                                badge="POPULAR"
                                isSelected={isSelected('connectorTypes', 'CCS2')}
                                onPress={() => toggleSelection('connectorTypes', 'CCS2')}
                                outlineIcon={<Ccs2Icon size={32} color={colors.textMuted} />}
                                selected3DIcon={<Ccs2Icon size={32} color={isDark ? '#000000' : '#FFFFFF'} />}
                            />
                        )}

                        {showAC && (
                            <Neo3DSelectTile
                                label="Type 2"
                                sublabel="Standard AC"
                                width="31%"
                                isSelected={isSelected('connectorTypes', 'Type II')}
                                onPress={() => toggleSelection('connectorTypes', 'Type II')}
                                outlineIcon={<Type2Icon size={32} color={colors.textMuted} />}
                                selected3DIcon={<Type2Icon size={32} color={isDark ? '#000000' : '#FFFFFF'} />}
                            />
                        )}

                        {showDC && (
                            <Neo3DSelectTile
                                label="CHAdeMO"
                                sublabel="DC Japan"
                                width="31%"
                                isSelected={isSelected('connectorTypes', 'CHAdeMo')}
                                onPress={() => toggleSelection('connectorTypes', 'CHAdeMo')}
                                outlineIcon={<ChademoIcon size={32} color={colors.textMuted} />}
                                selected3DIcon={<ChademoIcon size={32} color={isDark ? '#000000' : '#FFFFFF'} />}
                            />
                        )}
                    </View>
                </View>

                {/* Peak Power */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <ThemedText style={styles.sectionTitle}>MINIMUM POWER THRESHOLD</ThemedText>
                        <ThemedText style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                            Output rating kW
                        </ThemedText>
                    </View>
                    <View style={styles.row}>
                        <Neo3DSelectTile
                            label="Any Power"
                            compact
                            width="48%"
                            isSelected={isPeakPowerSelected('Any')}
                            onPress={() => setPeakPower('Any')}
                            iconName="sliders"
                            outlineIcon={<SlidersHorizontal size={18} color={colors.textMuted} strokeWidth={1.8} />}
                        />
                        <Neo3DSelectTile
                            label="< 22 kW"
                            sublabel="Standard AC"
                            compact
                            width="48%"
                            isSelected={isPeakPowerSelected('<22kW')}
                            onPress={() => setPeakPower('<22kW')}
                            iconName="battery"
                            outlineIcon={<BatteryCharging size={18} color={colors.textMuted} strokeWidth={1.8} />}
                        />
                    </View>
                    <View style={styles.row}>
                        <Neo3DSelectTile
                            label="60 kW+"
                            sublabel="DC Rapid"
                            compact
                            width="48%"
                            isSelected={isPeakPowerSelected('60kW+')}
                            onPress={() => setPeakPower('60kW+')}
                            iconName="bolt"
                            outlineIcon={<Zap size={18} color={colors.textMuted} strokeWidth={1.8} />}
                        />
                        <Neo3DSelectTile
                            label="120 kW+"
                            sublabel="Ultra Flash"
                            compact
                            width="48%"
                            badge="ULTRA"
                            isSelected={isPeakPowerSelected('120kW+')}
                            onPress={() => setPeakPower('120kW+')}
                            iconName="sparkles"
                            outlineIcon={<Sparkles size={18} color={colors.textMuted} strokeWidth={1.8} />}
                        />
                    </View>
                </View>

                {/* Tariff Range */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <ThemedText style={styles.sectionTitle}>TARIFF RANGE (₹/KWH)</ThemedText>
                        <ThemedText style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                            ₹{filters.tariffRange[0]} — ₹{filters.tariffRange[1]} per kWh
                        </ThemedText>
                    </View>

                    <View
                        style={[
                            styles.sliderCard,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.cardBorder,
                            },
                        ]}
                    >
                        <View style={styles.sliderWrap}>
                            <MultiSlider
                                values={[filters.tariffRange[0], filters.tariffRange[1]]}
                                sliderLength={SCREEN_WIDTH - SPACING.xl * 2 - 32}
                                onValuesChange={(values) =>
                                    setFilters({
                                        ...filters,
                                        tariffRange: [values[0], values[1]],
                                    })
                                }
                                min={0}
                                max={50}
                                step={1}
                                selectedStyle={{ backgroundColor: colors.primary }}
                                unselectedStyle={{
                                    backgroundColor: isDark
                                        ? 'rgba(255, 255, 255, 0.1)'
                                        : 'rgba(0, 0, 0, 0.1)',
                                }}
                                markerStyle={{
                                    backgroundColor: colors.primary,
                                    width: 22,
                                    height: 22,
                                    borderRadius: 11,
                                    borderWidth: 3,
                                    borderColor: isDark ? '#0A0A0B' : '#FFFFFF',
                                }}
                                containerStyle={{ height: 38 }}
                                trackStyle={{ height: 6, borderRadius: 3 }}
                            />
                        </View>

                        <View style={styles.inputsRow}>
                            <View style={styles.inputContainer}>
                                <ThemedText
                                    style={[styles.inputLabel, { color: colors.textMuted }]}
                                >
                                    MIN TARIFF
                                </ThemedText>
                                <View
                                    style={[
                                        styles.inputBox,
                                        {
                                            backgroundColor: isDark ? '#141418' : '#F4F4F2',
                                            borderColor: colors.cardBorder,
                                        },
                                    ]}
                                >
                                    <ThemedText
                                        style={[styles.currencyPrefix, { color: colors.textMuted }]}
                                    >
                                        ₹
                                    </ThemedText>
                                    <TextInput
                                        style={[
                                            styles.textInput,
                                            { color: colors.text },
                                        ]}
                                        keyboardType="numeric"
                                        value={filters.tariffRange[0].toString()}
                                        onChangeText={(text) => {
                                            const val = parseInt(text, 10) || 0;
                                            setFilters({
                                                ...filters,
                                                tariffRange: [val, filters.tariffRange[1]],
                                            });
                                        }}
                                    />
                                </View>
                            </View>

                            <View style={{ width: SPACING.md }} />

                            <View style={styles.inputContainer}>
                                <ThemedText
                                    style={[styles.inputLabel, { color: colors.textMuted }]}
                                >
                                    MAX TARIFF
                                </ThemedText>
                                <View
                                    style={[
                                        styles.inputBox,
                                        {
                                            backgroundColor: isDark ? '#141418' : '#F4F4F2',
                                            borderColor: colors.cardBorder,
                                        },
                                    ]}
                                >
                                    <ThemedText
                                        style={[styles.currencyPrefix, { color: colors.textMuted }]}
                                    >
                                        ₹
                                    </ThemedText>
                                    <TextInput
                                        style={[
                                            styles.textInput,
                                            { color: colors.text },
                                        ]}
                                        keyboardType="numeric"
                                        value={filters.tariffRange[1].toString()}
                                        onChangeText={(text) => {
                                            const val = parseInt(text, 10) || 0;
                                            setFilters({
                                                ...filters,
                                                tariffRange: [filters.tariffRange[0], val],
                                            });
                                        }}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Dock CTA */}
            <View
                style={[
                    styles.footer,
                    {
                        paddingBottom: Math.max(insets.bottom, SPACING.md) + 4,
                        backgroundColor: colors.surface,
                        borderTopColor: colors.cardBorder,
                    },
                ]}
            >
                <CredButton
                    title="APPLY FILTERS"
                    variant="neon"
                    onPress={handleApply}
                />
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
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    headerTitleWrap: {
        alignItems: 'center',
    },
    eyebrow: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.sansExtraBold,
        fontWeight: '800',
        letterSpacing: 1.4,
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 17,
        fontFamily: FONT_FAMILIES.serifHeading,
        fontWeight: '800',
    },
    clearHeaderButton: {
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    resetText: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.sansSemiBold,
        fontWeight: '600',
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: 40,
    },
    section: {
        marginBottom: SPACING.lg,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    sectionTitle: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansExtraBold,
        fontWeight: '800',
        letterSpacing: 1.2,
        opacity: 0.9,
    },
    sectionSubtitle: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansMedium,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    connectorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sliderCard: {
        padding: 16,
        borderRadius: RADIUS.bezelInner,
        borderWidth: 1,
        marginTop: 4,
    },
    sliderWrap: {
        alignItems: 'center',
        marginVertical: 4,
    },
    inputsRow: {
        flexDirection: 'row',
        marginTop: 8,
    },
    inputContainer: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    currencyPrefix: {
        fontSize: 14,
        fontFamily: FONT_FAMILIES.serifHeading,
        marginRight: 4,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
        padding: 0,
    },
    footer: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
    },
});
