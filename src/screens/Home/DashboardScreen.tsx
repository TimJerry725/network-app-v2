import React, { useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    Activity,
    ArrowRight,
    BatteryCharging,
    ChevronRight,
    Cpu,
    Gauge,
    MapPinned,
    ScanLine,
    ShieldAlert,
    SlidersHorizontal,
    Sparkles,
    Zap,
} from 'lucide-react-native';

import { CredBadge } from '../../components/CredBadge';
import { CredButton } from '../../components/CredButton';
import { CredCard } from '../../components/CredCard';
import { Neo3DSelectTile } from '../../components/Neo3DSelectTile';
import { ThemedText } from '../../components/ThemedText';
import { MOCK_STATIONS, getRecommendedConnector } from '../../constants/Stations';
import { RADIUS, SPACING } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';
import { useAppTheme } from '../../hooks/useAppTheme';

interface SmartAutomation {
    id: string;
    title: string;
    description: string;
    active: boolean;
    badge: string;
}

export default function DashboardScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const { selectedVehicle } = useVehicles();
    const featuredStation = MOCK_STATIONS[0];
    const recommendedConnector = getRecommendedConnector(
        featuredStation,
        selectedVehicle?.connectorType
    );

    // Smart automations (functional EV settings, zero rewards/points slop)
    const [automations, setAutomations] = useState<SmartAutomation[]>([
        {
            id: 'auto-1',
            title: '80% Battery Health Guard',
            description: 'Preserves lithium cell chemistry on DC Fast Chargers',
            active: true,
            badge: 'OPTIMAL',
        },
        {
            id: 'auto-2',
            title: 'Off-Peak Tariff Priority',
            description: 'Prefers slots when power is under ₹16.00/kWh',
            active: true,
            badge: 'SMART GRID',
        },
        {
            id: 'auto-3',
            title: 'Cabin Climate Pre-conditioning',
            description: 'Draws power from grid before scheduled departure',
            active: false,
            badge: 'COMFORT',
        },
    ]);

    const toggleAutomation = (id: string) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setAutomations((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, active: !item.active } : item
            )
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Top Hardware Status Bar ── */}
                <View style={styles.header}>
                    <View>
                        <ThemedText style={[styles.eyebrow, { color: colors.primary }]}>
                            EV TELEMETRY • SYSTEM ACTIVE
                        </ThemedText>
                        <ThemedText style={styles.headerTitle}>
                            {selectedVehicle?.nickname ?? 'Nexon EV Long Range'}
                        </ThemedText>
                    </View>

                    {/* Online status indicator beacon */}
                    <View
                        style={[
                            styles.statusBeacon,
                            {
                                backgroundColor: isDark ? '#141418' : '#ECECE8',
                                borderColor: colors.cardBorder,
                            },
                        ]}
                    >
                        <View style={[styles.beaconDot, { backgroundColor: colors.primary }]} />
                        <ThemedText style={[styles.beaconText, { color: colors.primary }]}>
                            ONLINE
                        </ThemedText>
                    </View>
                </View>

                {/* ── Hero Battery & State of Charge Pod (CRED Double Bezel) ── */}
                <CredCard variant="neon" style={styles.heroCard}>
                    <View style={styles.heroTopRow}>
                        <View style={styles.heroMetrics}>
                            <ThemedText style={[styles.cardEyebrow, { color: colors.textMuted }]}>
                                STATE OF CHARGE
                            </ThemedText>
                            <View style={styles.socRow}>
                                <ThemedText style={styles.heroSocNumber}>
                                    {selectedVehicle?.currentBattery ?? 62}
                                </ThemedText>
                                <ThemedText style={[styles.heroSocUnit, { color: colors.primary }]}>
                                    %
                                </ThemedText>
                            </View>
                            <ThemedText style={[styles.heroRangeText, { color: colors.textMuted }]}>
                                <ThemedText style={[styles.rangeBold, { color: colors.text }]}>
                                    {selectedVehicle?.estRangeKm ?? 286} km
                                </ThemedText>{' '}
                                estimated range
                            </ThemedText>
                        </View>

                        {/* Hardware Telemetry Badge */}
                        <View
                            style={[
                                styles.telemetryBox,
                                {
                                    backgroundColor: isDark ? '#0A0A0E' : '#ECECE8',
                                    borderColor: colors.cardBorder,
                                },
                            ]}
                        >
                            <View style={styles.telemetryItem}>
                                <ThemedText style={[styles.telemetryLabel, { color: colors.textMuted }]}>
                                    RECOMMENDED
                                </ThemedText>
                                <ThemedText style={styles.telemetryVal}>
                                    {recommendedConnector.type}
                                </ThemedText>
                            </View>
                            <View style={styles.telemetryDivider} />
                            <View style={styles.telemetryItem}>
                                <ThemedText style={[styles.telemetryLabel, { color: colors.textMuted }]}>
                                    MAX RATE
                                </ThemedText>
                                <ThemedText style={[styles.telemetryVal, { color: colors.primary }]}>
                                    {recommendedConnector.power} kW
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Concentric Double-Rail Battery Gauge */}
                    <View
                        style={[
                            styles.batteryRailOuter,
                            { backgroundColor: isDark ? '#0A0A0D' : '#E8E8E4' },
                        ]}
                    >
                        <View
                            style={[
                                styles.batteryRailInner,
                                {
                                    width: `${selectedVehicle?.currentBattery ?? 62}%`,
                                    backgroundColor: colors.primary,
                                },
                            ]}
                        >
                            {/* Top specular highlight in the rail */}
                            <View style={styles.railSpecular} />
                        </View>
                    </View>

                    {/* Hero CTA Button */}
                    <View style={styles.heroCtaWrap}>
                        <CredButton
                            title="START CHARGE"
                            variant="neon"
                            onPress={() =>
                                navigation.navigate('ChargingSession', {
                                    stationId: featuredStation.id,
                                    connectorId: recommendedConnector.id,
                                })
                            }
                        />
                    </View>
                </CredCard>

                {/* ── 3D Hardware Telemetry Pods ── */}
                <View style={styles.statsRow}>
                    <View
                        style={[
                            styles.tactileStatPod,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.cardBorder,
                            },
                        ]}
                    >
                        <View style={styles.podIconHeader}>
                            <Cpu size={16} color={colors.primary} />
                            <ThemedText style={[styles.podBadgeLabel, { color: colors.primary }]}>
                                HEALTH
                            </ThemedText>
                        </View>
                        <ThemedText style={styles.podValue}>98%</ThemedText>
                        <ThemedText style={[styles.podSublabel, { color: colors.textMuted }]}>
                            Cell state optimal
                        </ThemedText>
                    </View>

                    <View
                        style={[
                            styles.tactileStatPod,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.cardBorder,
                            },
                        ]}
                    >
                        <View style={styles.podIconHeader}>
                            <Gauge size={16} color={colors.accent} />
                            <ThemedText style={[styles.podBadgeLabel, { color: colors.accent }]}>
                                EFFICIENCY
                            </ThemedText>
                        </View>
                        <ThemedText style={styles.podValue}>7.2</ThemedText>
                        <ThemedText style={[styles.podSublabel, { color: colors.textMuted }]}>
                            km/kWh avg
                        </ThemedText>
                    </View>

                    <View
                        style={[
                            styles.tactileStatPod,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.cardBorder,
                            },
                        ]}
                    >
                        <View style={styles.podIconHeader}>
                            <Zap size={16} color={colors.primary} />
                            <ThemedText style={[styles.podBadgeLabel, { color: colors.primary }]}>
                                TARIFF
                            </ThemedText>
                        </View>
                        <ThemedText style={styles.podValue}>₹16.5</ThemedText>
                        <ThemedText style={[styles.podSublabel, { color: colors.textMuted }]}>
                            Off-peak rate
                        </ThemedText>
                    </View>
                </View>

                {/* ── Quick Action Hardware Dock (3D Neo-Brutalist Tiles) ── */}
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>TACTILE SHORTCUTS</ThemedText>
                    <ThemedText style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                        Direct hardware controls
                    </ThemedText>
                </View>

                <View style={styles.actionGrid}>
                    <Neo3DSelectTile
                        label="Start Charge"
                        sublabel="Nearest DC Hub"
                        width="48%"
                        isSelected={false}
                        badge="FAST"
                        onPress={() =>
                            navigation.navigate('ChargingSession', {
                                stationId: featuredStation.id,
                                connectorId: recommendedConnector.id,
                            })
                        }
                        icon={<BatteryCharging size={24} color={colors.primary} />}
                    />
                    <Neo3DSelectTile
                        label="Trip Planner"
                        sublabel="Elevation & Stops"
                        width="48%"
                        isSelected={false}
                        onPress={() => navigation.navigate('Explore')}
                        icon={<MapPinned size={24} color={colors.primary} />}
                    />
                    <Neo3DSelectTile
                        label="Scan QR"
                        sublabel="Optical Reader"
                        width="48%"
                        isSelected={false}
                        onPress={() => navigation.navigate('Scan')}
                        icon={<ScanLine size={24} color={colors.primary} />}
                    />
                    <Neo3DSelectTile
                        label="Filter Hubs"
                        sublabel="CCS2 & Power"
                        width="48%"
                        isSelected={false}
                        onPress={() => navigation.navigate('Filter')}
                        icon={<SlidersHorizontal size={24} color={colors.primary} />}
                    />
                </View>

                {/* ── Best Nearby Charging Hubs ── */}
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>FEATURED DC FAST HUBS</ThemedText>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Map')}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={[styles.seeAllText, { color: colors.primary }]}>
                            EXPLORE ALL
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                {MOCK_STATIONS.slice(0, 2).map((station) => {
                    const connector = getRecommendedConnector(
                        station,
                        selectedVehicle?.connectorType
                    );

                    return (
                        <CredCard key={station.id} style={styles.stationCard}>
                            <View style={styles.stationTopRow}>
                                <View style={styles.stationInfo}>
                                    <View style={styles.stationTitleRow}>
                                        <ThemedText style={styles.stationName}>
                                            {station.name}
                                        </ThemedText>
                                        <CredBadge
                                            label={station.occupancyLabel}
                                            variant={
                                                station.occupancyLabel === 'Calm'
                                                    ? 'neon'
                                                    : 'muted'
                                            }
                                        />
                                    </View>

                                    <ThemedText
                                        style={[styles.stationAddress, { color: colors.textMuted }]}
                                        numberOfLines={1}
                                    >
                                        {station.address}
                                    </ThemedText>

                                    <View style={styles.specsRow}>
                                        <ThemedText style={[styles.specItem, { color: colors.text }]}>
                                            {station.distanceKm} km
                                        </ThemedText>
                                        <ThemedText style={[styles.specDot, { color: colors.textMuted }]}>
                                            •
                                        </ThemedText>
                                        <ThemedText style={[styles.specItem, { color: colors.text }]}>
                                            {station.etaMinutes} min ETA
                                        </ThemedText>
                                        <ThemedText style={[styles.specDot, { color: colors.textMuted }]}>
                                            •
                                        </ThemedText>
                                        <ThemedText
                                            style={[styles.specItemBold, { color: colors.primary }]}
                                        >
                                            {connector.power} kW DC
                                        </ThemedText>
                                    </View>
                                </View>
                            </View>

                            <View
                                style={[
                                    styles.stationFooter,
                                    {
                                        borderTopColor: colors.cardBorder,
                                    },
                                ]}
                            >
                                <View>
                                    <ThemedText
                                        style={[styles.tariffLabel, { color: colors.textMuted }]}
                                    >
                                        TARIFF
                                    </ThemedText>
                                    <ThemedText style={styles.tariffRate}>
                                        ₹{connector.pricePerKWh.toFixed(2)}
                                        <ThemedText
                                            style={[
                                                styles.tariffUnit,
                                                { color: colors.textMuted },
                                            ]}
                                        >
                                            /kWh
                                        </ThemedText>
                                    </ThemedText>
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.stationChargeBtn,
                                        {
                                            backgroundColor: colors.primary,
                                        },
                                    ]}
                                    activeOpacity={0.82}
                                    onPress={() =>
                                        navigation.navigate('ChargingSession', {
                                            stationId: station.id,
                                            connectorId: connector.id,
                                        })
                                    }
                                >
                                    <ThemedText style={styles.stationChargeBtnText}>
                                        CHARGE NOW
                                    </ThemedText>
                                    <ArrowRight size={14} color="#000000" />
                                </TouchableOpacity>
                            </View>
                        </CredCard>
                    );
                })}

                {/* ── Smart Automations (Replacing Gamified Rewards) ── */}
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>SMART BATTERY AUTOMATIONS</ThemedText>
                    <ThemedText style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                        Hardware protection profiles
                    </ThemedText>
                </View>

                {automations.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.85}
                        onPress={() => toggleAutomation(item.id)}
                        style={[
                            styles.automationCard,
                            {
                                backgroundColor: colors.surface,
                                borderColor: item.active ? colors.primary : colors.cardBorder,
                                borderBottomColor: item.active
                                    ? '#008F47'
                                    : isDark
                                    ? '#060608'
                                    : '#D0D0D0',
                                borderBottomWidth: item.active ? 2 : 3.5,
                                transform: [{ translateY: item.active ? 2 : 0 }],
                            },
                        ]}
                    >
                        <View style={styles.automationLeft}>
                            <View style={styles.automationTitleRow}>
                                <ThemedText style={styles.automationTitle}>
                                    {item.title}
                                </ThemedText>
                                <CredBadge
                                    label={item.badge}
                                    variant={item.active ? 'neon' : 'muted'}
                                />
                            </View>
                            <ThemedText
                                style={[
                                    styles.automationDesc,
                                    { color: colors.textMuted },
                                ]}
                            >
                                {item.description}
                            </ThemedText>
                        </View>

                        {/* 3D Tactile Toggle Switch Pod */}
                        <View
                            style={[
                                styles.toggleSwitchPod,
                                {
                                    backgroundColor: item.active
                                        ? colors.primary
                                        : isDark
                                        ? '#1E1E24'
                                        : '#E0E0DC',
                                    borderColor: item.active
                                        ? '#008F47'
                                        : colors.cardBorder,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.toggleKnob,
                                    {
                                        backgroundColor: item.active
                                            ? '#000000'
                                            : isDark
                                            ? '#FFFFFF'
                                            : '#333333',
                                        alignSelf: item.active
                                            ? 'flex-end'
                                            : 'flex-start',
                                    },
                                ]}
                            />
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 120,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    eyebrow: {
        fontSize: 10,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        letterSpacing: 1.4,
        marginBottom: 3,
    },
    headerTitle: {
        fontSize: 19,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    statusBeacon: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        gap: 6,
    },
    beaconDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    beaconText: {
        fontSize: 10,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        letterSpacing: 1,
    },

    // ── Hero Battery Card ──
    heroCard: {
        marginBottom: 16,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    heroMetrics: {
        flex: 1,
    },
    cardEyebrow: {
        fontSize: 10,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    socRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    heroSocNumber: {
        fontSize: 52,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        letterSpacing: -1,
        lineHeight: 56,
    },
    heroSocUnit: {
        fontSize: 24,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        marginLeft: 2,
    },
    heroRangeText: {
        fontSize: 13,
        marginTop: 4,
    },
    rangeBold: {
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    telemetryBox: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'flex-end',
    },
    telemetryItem: {
        alignItems: 'flex-end',
    },
    telemetryDivider: {
        height: 1,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        marginVertical: 6,
    },
    telemetryLabel: {
        fontSize: 9,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    telemetryVal: {
        fontSize: 13,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        marginTop: 2,
    },
    batteryRailOuter: {
        height: 10,
        borderRadius: 999,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        marginBottom: 16,
    },
    batteryRailInner: {
        height: '100%',
        borderRadius: 999,
        position: 'relative',
    },
    railSpecular: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    heroCtaWrap: {
        marginTop: 4,
    },

    // ── Telemetry Pods ──
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    tactileStatPod: {
        flex: 1,
        padding: 12,
        borderRadius: RADIUS.bezelInner,
        borderWidth: 1,
        borderBottomWidth: 3,
        borderBottomColor: '#070709',
    },
    podIconHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    podBadgeLabel: {
        fontSize: 9,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    podValue: {
        fontSize: 20,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        marginBottom: 2,
    },
    podSublabel: {
        fontSize: 10,
        fontFamily: 'RedHatDisplay_500Medium',
    },

    // ── Section Headers ──
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 11,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        letterSpacing: 1.2,
        opacity: 0.85,
    },
    sectionSubtitle: {
        fontSize: 11,
        fontFamily: 'RedHatDisplay_500Medium',
    },
    seeAllText: {
        fontSize: 11,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        letterSpacing: 0.8,
    },

    // ── Quick Action Dock ──
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },

    // ── Station Cards ──
    stationCard: {
        marginBottom: 14,
    },
    stationTopRow: {
        marginBottom: 12,
    },
    stationInfo: {
        flex: 1,
    },
    stationTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    stationName: {
        fontSize: 16,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
        flex: 1,
        marginRight: 8,
    },
    stationAddress: {
        fontSize: 12,
        marginBottom: 8,
    },
    specsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    specItem: {
        fontSize: 12,
        fontFamily: 'RedHatDisplay_600SemiBold',
    },
    specDot: {
        fontSize: 12,
    },
    specItemBold: {
        fontSize: 12,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
    },
    stationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    tariffLabel: {
        fontSize: 9,
        fontFamily: 'RedHatDisplay_700Bold',
        letterSpacing: 0.8,
    },
    tariffRate: {
        fontSize: 15,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
    },
    tariffUnit: {
        fontSize: 11,
        fontFamily: 'RedHatDisplay_500Medium',
    },
    stationChargeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#006633',
    },
    stationChargeBtnText: {
        color: '#000000',
        fontSize: 11,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        letterSpacing: 0.8,
    },

    // ── Automations ──
    automationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: RADIUS.bezelInner,
        borderWidth: 1.5,
        marginBottom: 10,
    },
    automationLeft: {
        flex: 1,
        marginRight: 12,
    },
    automationTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    automationTitle: {
        fontSize: 13,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    automationDesc: {
        fontSize: 11,
        lineHeight: 16,
    },
    toggleSwitchPod: {
        width: 44,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        padding: 2,
        justifyContent: 'center',
    },
    toggleKnob: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
});
