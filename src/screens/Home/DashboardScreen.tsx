import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    ArrowRight,
    BatteryCharging,
    Cpu,
    Gauge,
    MapPinned,
    ScanLine,
    SlidersHorizontal,
    Zap,
} from 'lucide-react-native';

import { CredBadge } from '../../components/CredBadge';
import { CredButton } from '../../components/CredButton';
import { CredCard } from '../../components/CredCard';
import { Neo3DSelectTile } from '../../components/Neo3DSelectTile';
import { ThemedText } from '../../components/ThemedText';
import { MOCK_STATIONS, getRecommendedConnector } from '../../constants/Stations';
import { FONT_FAMILIES, RADIUS } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';
import { useAppTheme } from '../../hooks/useAppTheme';

interface SmartAutomation {
    id: string;
    title: string;
    description: string;
    active: boolean;
    badge: string;
}

/**
 * Animated 3D Hardware Toggle Switch
 */
function AnimatedToggleSwitch({
    active,
    onToggle,
}: {
    active: boolean;
    onToggle: () => void;
}) {
    const { isDark } = useAppTheme();
    const knobX = useRef(new Animated.Value(active ? 18 : 0)).current;

    useEffect(() => {
        Animated.spring(knobX, {
            toValue: active ? 18 : 0,
            tension: 300,
            friction: 18,
            useNativeDriver: true,
        }).start();
    }, [active, knobX]);

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onToggle}
            style={[
                styles.toggleSwitchPod,
                {
                    backgroundColor: active
                        ? (isDark ? '#FFFFFF' : '#000000')
                        : isDark
                        ? '#1C1C22'
                        : '#E0E0DC',
                    borderColor: active
                        ? (isDark ? '#FFFFFF' : '#000000')
                        : isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(0, 0, 0, 0.1)',
                },
            ]}
        >
            <Animated.View
                style={[
                    styles.toggleKnob,
                    {
                        backgroundColor: active
                            ? (isDark ? '#000000' : '#FFFFFF')
                            : isDark
                            ? '#7E7E84'
                            : '#8E8E93',
                        transform: [{ translateX: knobX }],
                    },
                ]}
            />
        </TouchableOpacity>
    );
}

/**
 * Animated Pressable Station Card Button
 */
function StationChargeButton({ onPress }: { onPress: () => void }) {
    const { isDark } = useAppTheme();
    const depth = 3;
    const pressAnim = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
        Animated.spring(pressAnim, {
            toValue: depth,
            tension: 400,
            friction: 14,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressAnim, {
            toValue: 0,
            tension: 300,
            friction: 10,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        onPress();
    };

    const btnBg = isDark ? '#FFFFFF' : '#000000';
    const textColor = isDark ? '#000000' : '#FFFFFF';
    const borderColor = isDark ? '#FFFFFF' : '#000000';

    return (
        <View style={styles.stationChargeBtnContainer}>
            {/* 3D Extruded Shadow Slab Base */}
            <View
                style={[
                    styles.stationChargeBtnShadow,
                    {
                        top: depth,
                        left: depth,
                        backgroundColor: '#000000',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.4)' : '#000000',
                        borderWidth: 1.5,
                    },
                ]}
            />

            {/* Elevated Button Face */}
            <Animated.View
                style={{
                    marginRight: depth,
                    marginBottom: depth,
                    transform: [
                        { translateX: pressAnim },
                        { translateY: pressAnim },
                    ],
                }}
            >
                <TouchableOpacity
                    style={[
                        styles.stationChargeBtn,
                        {
                            backgroundColor: btnBg,
                            borderColor: borderColor,
                            borderWidth: 1.5,
                        },
                    ]}
                    activeOpacity={1}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handlePress}
                >
                    <ThemedText
                        style={[
                            styles.stationChargeBtnText,
                            {
                                color: textColor,
                            },
                        ]}
                    >
                        CHARGE NOW
                    </ThemedText>
                    <ArrowRight size={13} color={textColor} strokeWidth={2.8} />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

export default function DashboardScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const { selectedVehicle } = useVehicles();
    const featuredStation = MOCK_STATIONS[0];
    const recommendedConnector = getRecommendedConnector(
        featuredStation,
        selectedVehicle?.connectorType
    );

    // Continuous breathing pulse for status beacon
    const beaconPulse = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(beaconPulse, {
                    toValue: 1.0,
                    duration: 1400,
                    useNativeDriver: true,
                }),
                Animated.timing(beaconPulse, {
                    toValue: 0.35,
                    duration: 1400,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [beaconPulse]);

    // Functional EV automations (zero rewards/points slop)
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
            description: 'Prefers slots when grid power is under ₹16.00/kWh',
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
                        <ThemedText style={[styles.eyebrow, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            EV TELEMETRY • SYSTEM ACTIVE
                        </ThemedText>
                        <ThemedText style={styles.headerTitle}>
                            {selectedVehicle?.nickname ?? 'Nexon EV Long Range'}
                        </ThemedText>
                    </View>

                    {/* Online status indicator beacon with animated breathing pulse */}
                    <View
                        style={[
                            styles.statusBeacon,
                            {
                                backgroundColor: isDark ? '#141418' : '#ECECE8',
                                borderColor: colors.cardBorder,
                            },
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.beaconDot,
                                {
                                    backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                    opacity: beaconPulse,
                                },
                            ]}
                        />
                        <ThemedText
                            style={[
                                styles.beaconText,
                                { color: isDark ? '#FFFFFF' : '#000000' },
                            ]}
                        >
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
                                <ThemedText style={[styles.heroSocUnit, { color: colors.text }]}>
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
                                <ThemedText style={[styles.telemetryVal, { color: colors.text }]}>
                                    {recommendedConnector.power} kW
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Concentric Double-Rail Battery Gauge in Stark Monochrome */}
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
                                    backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                },
                            ]}
                        >
                            {/* Top specular highlight in the rail */}
                            <View style={styles.railSpecular} />
                        </View>
                    </View>

                    {/* Hero CTA Button with spring motion */}
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

                {/* ── 3D Hardware Telemetry Pods (Stark Monochrome) ── */}
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
                            <Cpu size={16} color={colors.text} />
                            <ThemedText style={[styles.podBadgeLabel, { color: colors.text }]}>
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
                            <Gauge size={16} color={colors.text} />
                            <ThemedText style={[styles.podBadgeLabel, { color: colors.text }]}>
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
                            <Zap size={16} color={colors.text} />
                            <ThemedText style={[styles.podBadgeLabel, { color: colors.text }]}>
                                TARIFF
                            </ThemedText>
                        </View>
                        <ThemedText style={styles.podValue}>₹16.5</ThemedText>
                        <ThemedText style={[styles.podSublabel, { color: colors.textMuted }]}>
                            Off-peak rate
                        </ThemedText>
                    </View>
                </View>

                {/* ── Quick Action Hardware Dock (3D Neo-Brutalist Tiles with Spring Motion) ── */}
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
                        iconName="bolt"
                        outlineIcon={<BatteryCharging size={24} color={isDark ? '#8E8E93' : '#6B6B70'} strokeWidth={1.8} />}
                    />
                    <Neo3DSelectTile
                        label="Trip Planner"
                        sublabel="Elevation & Stops"
                        width="48%"
                        isSelected={false}
                        onPress={() => navigation.navigate('Explore')}
                        iconName="trip"
                        outlineIcon={<MapPinned size={24} color={isDark ? '#8E8E93' : '#6B6B70'} strokeWidth={1.8} />}
                    />
                    <Neo3DSelectTile
                        label="Scan QR"
                        sublabel="Optical Reader"
                        width="48%"
                        isSelected={false}
                        onPress={() => navigation.navigate('Scan')}
                        iconName="scan"
                        outlineIcon={<ScanLine size={24} color={isDark ? '#8E8E93' : '#6B6B70'} strokeWidth={1.8} />}
                    />
                    <Neo3DSelectTile
                        label="Filter Hubs"
                        sublabel="CCS2 & Power"
                        width="48%"
                        isSelected={false}
                        onPress={() => navigation.navigate('Filter')}
                        iconName="filter"
                        outlineIcon={<SlidersHorizontal size={24} color={isDark ? '#8E8E93' : '#6B6B70'} strokeWidth={1.8} />}
                    />
                </View>

                {/* ── Best Nearby Charging Hubs ── */}
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>FEATURED DC FAST HUBS</ThemedText>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Map')}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={[styles.seeAllText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
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
                                            style={[styles.specItemBold, { color: colors.text }]}
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

                                <StationChargeButton
                                    onPress={() =>
                                        navigation.navigate('ChargingSession', {
                                            stationId: station.id,
                                            connectorId: connector.id,
                                        })
                                    }
                                />
                            </View>
                        </CredCard>
                    );
                })}

                {/* ── Smart Automations with Animated Switches ── */}
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>SMART BATTERY AUTOMATIONS</ThemedText>
                    <ThemedText style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                        Hardware protection profiles
                    </ThemedText>
                </View>

                {automations.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.88}
                        onPress={() => toggleAutomation(item.id)}
                        style={[
                            styles.automationCard,
                            {
                                backgroundColor: colors.surface,
                                borderColor: item.active
                                    ? (isDark ? '#FFFFFF' : '#000000')
                                    : colors.cardBorder,
                                borderBottomColor: item.active
                                    ? (isDark ? '#B0B0B8' : '#222228')
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

                        {/* 3D Tactile Toggle Switch Pod with Spring Animation */}
                        <AnimatedToggleSwitch
                            active={item.active}
                            onToggle={() => toggleAutomation(item.id)}
                        />
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
        fontFamily: FONT_FAMILIES.sansExtraBold,
        fontWeight: '800',
        letterSpacing: 1.4,
        marginBottom: 3,
    },
    headerTitle: {
        fontSize: 19,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    statusBeacon: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.chip,
        borderWidth: 1,
        gap: 6,
    },
    beaconDot: {
        width: 6,
        height: 6,
        borderRadius: RADIUS.circle,
    },
    beaconText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.sansExtraBold,
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
        fontFamily: FONT_FAMILIES.sansExtraBold,
        fontWeight: '800',
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    socRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    heroSocNumber: {
        fontSize: 54,
        fontFamily: FONT_FAMILIES.serifDisplayBlack,
        fontWeight: '800',
        letterSpacing: -1,
        lineHeight: 58,
    },
    heroSocUnit: {
        fontSize: 24,
        fontFamily: FONT_FAMILIES.sansExtraBold,
        fontWeight: '800',
        marginLeft: 2,
    },
    heroRangeText: {
        fontSize: 13,
        marginTop: 4,
    },
    rangeBold: {
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    telemetryBox: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: RADIUS.tile,
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
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    telemetryVal: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.sansExtraBold,
        fontWeight: '800',
        marginTop: 2,
    },
    batteryRailOuter: {
        height: 10,
        borderRadius: RADIUS.pill,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        marginBottom: 16,
    },
    batteryRailInner: {
        height: '100%',
        borderRadius: RADIUS.pill,
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
        borderRadius: RADIUS.card,
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
        fontFamily: FONT_FAMILIES.sansExtraBold,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    podValue: {
        fontSize: 20,
        fontFamily: FONT_FAMILIES.serifHeading,
        fontWeight: '800',
        marginBottom: 2,
    },
    podSublabel: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.sansMedium,
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
        fontFamily: FONT_FAMILIES.sansExtraBold,
        fontWeight: '800',
        letterSpacing: 1.2,
        opacity: 0.9,
    },
    sectionSubtitle: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansMedium,
    },
    seeAllText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansExtraBold,
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
        fontFamily: FONT_FAMILIES.sansBold,
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
        fontFamily: FONT_FAMILIES.sansSemiBold,
    },
    specDot: {
        fontSize: 12,
    },
    specItemBold: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.sansExtraBold,
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
        fontFamily: FONT_FAMILIES.sansBold,
        letterSpacing: 0.8,
    },
    tariffRate: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.serifHeading,
        fontWeight: '800',
    },
    tariffUnit: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansMedium,
    },
    stationChargeBtnContainer: {
        position: 'relative',
    },
    stationChargeBtnShadow: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        borderRadius: RADIUS.button,
    },
    stationChargeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: RADIUS.button,
    },
    stationChargeBtnText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.sansExtraBold,
        fontWeight: '800',
        letterSpacing: 0.8,
    },

    // ── Automations ──
    automationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: RADIUS.card,
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
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    automationDesc: {
        fontSize: 11,
        lineHeight: 16,
    },
    toggleSwitchPod: {
        width: 44,
        height: 24,
        borderRadius: RADIUS.circle,
        borderWidth: 1.5,
        padding: 2,
        justifyContent: 'center',
    },
    toggleKnob: {
        width: 16,
        height: 16,
        borderRadius: RADIUS.circle,
    },
});
