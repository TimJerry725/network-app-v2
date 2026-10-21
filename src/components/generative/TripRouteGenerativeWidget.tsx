import React, { useState } from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
    ArrowRight,
    ArrowUpRight,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    Compass,
    MapPin,
    Navigation,
    Route,
    ShieldCheck,
    Sparkles,
    Zap,
} from 'lucide-react-native';

import { ThemedText } from '../ThemedText';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../constants/Tokens';
import { useAppTheme } from '../../hooks/useAppTheme';

export interface RouteCharger {
    id: string;
    name: string;
    location: string;
    distanceAlongRouteKm: number;
    powerKw: number;
    connectorType: string;
    availableGuns: number;
    totalGuns: number;
    pricePerKWh: number;
    isRecommended?: boolean;
    arrivalSocPercent?: number;
    departureSocPercent?: number;
    recommendedChargeMin?: number;
    amenities?: string[];
}

export interface TripRouteGenerativeWidgetProps {
    origin?: string;
    destination?: string;
    distanceKm?: number;
    durationHours?: string;
    chargingStopsCount?: number;
    chargingTimeMin?: number;
    recommendedStop?: string;
    recommendedCharger?: RouteCharger;
    routeChargers?: RouteCharger[];
    energyKWh?: number;
    onOpenTripPlanner?: () => void;
    onSelectCharger?: (charger: RouteCharger) => void;
    onStartCharge?: (charger: RouteCharger) => void;
}

const DEFAULT_RECOMMENDED: RouteCharger = {
    id: 'iris-thoppur-01',
    name: 'Iris Thoppur Superhub',
    location: 'Thoppur Valley Toll Plaza, NH 44',
    distanceAlongRouteKm: 184,
    powerKw: 150,
    connectorType: 'CCS2 Dual Gun',
    availableGuns: 4,
    totalGuns: 4,
    pricePerKWh: 18.00,
    isRecommended: true,
    arrivalSocPercent: 18,
    departureSocPercent: 82,
    recommendedChargeMin: 22,
    amenities: ['Café Coffee Day', 'Food Court', 'Washrooms', 'AC Lounge'],
};

const DEFAULT_ROUTE_CHARGERS: RouteCharger[] = [
    {
        id: 'iris-salem-01',
        name: 'Iris Salem Bypass Hub',
        location: 'Salem Outer Ring Road, NH 44',
        distanceAlongRouteKm: 122,
        powerKw: 60,
        connectorType: 'CCS2',
        availableGuns: 2,
        totalGuns: 2,
        pricePerKWh: 16.00,
        isRecommended: false,
        arrivalSocPercent: 44,
        amenities: ['Restaurant', 'Washroom'],
    },
    DEFAULT_RECOMMENDED,
    {
        id: 'iris-krishnagiri-01',
        name: 'Iris Krishnagiri Express Point',
        location: 'Krishnagiri Highway Plaza, NH 44',
        distanceAlongRouteKm: 268,
        powerKw: 120,
        connectorType: 'CCS2',
        availableGuns: 3,
        totalGuns: 4,
        pricePerKWh: 17.00,
        isRecommended: false,
        arrivalSocPercent: 54,
        amenities: ['Food Court', 'ATM'],
    },
    {
        id: 'iris-hosur-01',
        name: 'Iris Hosur Gateway Hub',
        location: 'Hosur Border Plaza, Attibele, NH 44',
        distanceAlongRouteKm: 328,
        powerKw: 60,
        connectorType: 'CCS2',
        availableGuns: 2,
        totalGuns: 2,
        pricePerKWh: 16.50,
        isRecommended: false,
        arrivalSocPercent: 36,
        amenities: ['Retail Plaza', 'Restroom'],
    },
];

/**
 * Generative UI: Trip Route & Charging Planner Widget
 * Features:
 * 1. Origin -> Destination Route summary & metrics
 * 2. Dedicated Featured Recommended Charger card with SOC curves & quick actions
 * 3. Route Stepper / Timeline showing all chargers along the highway route
 */
export function TripRouteGenerativeWidget({
    origin = 'Coimbatore',
    destination = 'Bangalore',
    distanceKm = 365,
    durationHours = '5h 15m',
    chargingStopsCount = 1,
    chargingTimeMin = 22,
    recommendedStop,
    recommendedCharger,
    routeChargers,
    energyKWh = 52,
    onOpenTripPlanner,
    onSelectCharger,
    onStartCharge,
}: TripRouteGenerativeWidgetProps) {
    const { colors, isDark } = useAppTheme();
    const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);

    const activeRecommended: RouteCharger =
        recommendedCharger ??
        (recommendedStop
            ? { ...DEFAULT_RECOMMENDED, name: recommendedStop }
            : DEFAULT_RECOMMENDED);

    const allRouteChargers: RouteCharger[] =
        routeChargers && routeChargers.length > 0 ? routeChargers : DEFAULT_ROUTE_CHARGERS;

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? '#141622' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 91, 69, 0.28)' : 'rgba(255, 91, 69, 0.20)',
                },
            ]}
        >
            {/* Header: Origin -> Destination */}
            <View style={styles.headerRow}>
                <View style={styles.routeHeader}>
                    <ThemedText style={styles.originText}>{origin}</ThemedText>
                    <ArrowRight size={14} color="#FF5B45" />
                    <ThemedText style={styles.destinationText}>{destination}</ThemedText>
                </View>
                <View
                    style={[
                        styles.tagPill,
                        { backgroundColor: isDark ? 'rgba(255, 91, 69, 0.16)' : '#FFF0ED' },
                    ]}
                >
                    <Route size={11} color="#FF5B45" />
                    <ThemedText style={styles.tagText}>{chargingStopsCount} Charge Stop</ThemedText>
                </View>
            </View>

            {/* Metrics Ribbon */}
            <View
                style={[
                    styles.metricsRibbon,
                    { backgroundColor: isDark ? '#1C1F2E' : '#F8FAFC' },
                ]}
            >
                <View style={styles.metricItem}>
                    <ThemedText style={[styles.metricLabel, { color: colors.textMuted }]}>Distance</ThemedText>
                    <ThemedText style={styles.metricValue}>{distanceKm} km</ThemedText>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                    <ThemedText style={[styles.metricLabel, { color: colors.textMuted }]}>Drive Time</ThemedText>
                    <ThemedText style={styles.metricValue}>{durationHours}</ThemedText>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                    <ThemedText style={[styles.metricLabel, { color: colors.textMuted }]}>Charging</ThemedText>
                    <ThemedText style={[styles.metricValue, { color: '#FF5B45' }]}>+{chargingTimeMin}m</ThemedText>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                    <ThemedText style={[styles.metricLabel, { color: colors.textMuted }]}>Est. Energy</ThemedText>
                    <ThemedText style={[styles.metricValue, { color: '#38BDF8' }]}>~{energyKWh} kWh</ThemedText>
                </View>
            </View>

            {/* 1. RECOMMENDED CHARGER (Spotlight Card) */}
            <View
                style={[
                    styles.recommendedContainer,
                    {
                        backgroundColor: isDark ? '#181B27' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 91, 69, 0.40)' : 'rgba(255, 91, 69, 0.30)',
                    },
                ]}
            >
                {/* Header Badge */}
                <View style={styles.recommendedBadgeRow}>
                    <LinearGradient
                        colors={['#FF5B45', '#FF8A7A']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.recommendedPill}
                    >
                        <Zap size={11} color="#FFFFFF" fill="#FFFFFF" />
                        <ThemedText style={styles.recommendedPillText}>RECOMMENDED CHARGER</ThemedText>
                    </LinearGradient>
                    <View
                        style={[
                            styles.milestoneBadge,
                            { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : '#E0F2FE' },
                        ]}
                    >
                        <ThemedText style={styles.milestoneBadgeText}>
                            At KM {activeRecommended.distanceAlongRouteKm}
                        </ThemedText>
                    </View>
                </View>

                {/* Station Name & Location */}
                <ThemedText style={styles.recommendedName} numberOfLines={1}>
                    {activeRecommended.name}
                </ThemedText>
                <ThemedText style={[styles.recommendedLocation, { color: colors.textMuted }]} numberOfLines={1}>
                    {activeRecommended.location}
                </ThemedText>

                {/* Battery SOC Prediction Ribbon */}
                <View
                    style={[
                        styles.socPredictionBox,
                        { backgroundColor: isDark ? '#222536' : '#F1F5F9' },
                    ]}
                >
                    <View style={styles.socStat}>
                        <ThemedText style={[styles.socLabel, { color: colors.textMuted }]}>Arrival SOC</ThemedText>
                        <ThemedText style={[styles.socValue, { color: '#F59E0B' }]}>
                            {activeRecommended.arrivalSocPercent ?? 18}%
                        </ThemedText>
                    </View>

                    {/* Progress Track */}
                    <View style={styles.socTrackContainer}>
                        <View style={styles.socBarBg}>
                            <View
                                style={[
                                    styles.socBarFill,
                                    { width: `${activeRecommended.departureSocPercent ?? 82}%` },
                                ]}
                            />
                        </View>
                        <ThemedText style={[styles.chargeDurationText, { color: '#FF5B45' }]}>
                            +{activeRecommended.recommendedChargeMin ?? 22} min session
                        </ThemedText>
                    </View>

                    <View style={styles.socStat}>
                        <ThemedText style={[styles.socLabel, { color: colors.textMuted }]}>Departure</ThemedText>
                        <ThemedText style={[styles.socValue, { color: '#10B981' }]}>
                            {activeRecommended.departureSocPercent ?? 82}%
                        </ThemedText>
                    </View>
                </View>

                {/* Specs: Power, Available Guns, Price */}
                <View style={styles.specsRow}>
                    <View
                        style={[
                            styles.specPill,
                            { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : '#E0F2FE' },
                        ]}
                    >
                        <Zap size={11} color="#38BDF8" fill="#38BDF8" />
                        <ThemedText style={styles.specPillText}>
                            {activeRecommended.powerKw} kW DC
                        </ThemedText>
                    </View>

                    <View
                        style={[
                            styles.specPill,
                            { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5' },
                        ]}
                    >
                        <CheckCircle2 size={11} color="#10B981" />
                        <ThemedText style={[styles.specPillText, { color: '#10B981' }]}>
                            {activeRecommended.availableGuns}/{activeRecommended.totalGuns} Guns Open
                        </ThemedText>
                    </View>

                    <ThemedText style={[styles.priceTag, { color: colors.textMuted }]}>
                        ₹{activeRecommended.pricePerKWh.toFixed(2)}/kWh
                    </ThemedText>
                </View>

                {/* Action Buttons for Recommended Stop */}
                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                        style={[
                            styles.navButton,
                            {
                                backgroundColor: isDark ? '#272B3C' : '#F1F5F9',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                            },
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onSelectCharger?.(activeRecommended);
                        }}
                    >
                        <ArrowUpRight size={13} color="#FF5B45" />
                        <ThemedText style={styles.navButtonText}>Navigate</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.chargeButton}
                        activeOpacity={0.85}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            onStartCharge?.(activeRecommended);
                        }}
                    >
                        <Zap size={13} color="#FFFFFF" fill="#FFFFFF" />
                        <ThemedText style={styles.chargeButtonText}>Start Charge</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 2. CHARGERS ALONG THE ROUTE LIST */}
            <View style={styles.routeChargersSection}>
                <TouchableOpacity
                    style={styles.sectionHeaderToggle}
                    activeOpacity={0.8}
                    onPress={() => setIsTimelineExpanded(!isTimelineExpanded)}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Route size={13} color="#FF5B45" />
                        <ThemedText style={styles.sectionHeading}>
                            Chargers Along Route ({allRouteChargers.length})
                        </ThemedText>
                    </View>
                    {isTimelineExpanded ? (
                        <ChevronUp size={16} color={colors.textMuted} />
                    ) : (
                        <ChevronDown size={16} color={colors.textMuted} />
                    )}
                </TouchableOpacity>

                {isTimelineExpanded && (
                    <View style={styles.timelineList}>
                        {allRouteChargers.map((station, index) => {
                            const isRec = station.isRecommended;
                            const isLast = index === allRouteChargers.length - 1;

                            return (
                                <View key={station.id} style={styles.timelineItem}>
                                    {/* Left Track Column */}
                                    <View style={styles.trackCol}>
                                        <View
                                            style={[
                                                styles.trackNode,
                                                isRec
                                                    ? styles.trackNodeRecommended
                                                    : {
                                                          backgroundColor: isDark ? '#222536' : '#E2E8F0',
                                                          borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                                                      },
                                            ]}
                                        >
                                            <ThemedText
                                                style={[
                                                    styles.trackNodeText,
                                                    { color: isRec ? '#FFFFFF' : colors.textMuted },
                                                ]}
                                            >
                                                {index + 1}
                                            </ThemedText>
                                        </View>
                                        {!isLast && <View style={[styles.trackLine, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' }]} />}
                                    </View>

                                    {/* Right Content Card */}
                                    <TouchableOpacity
                                        style={[
                                            styles.stationRowCard,
                                            {
                                                backgroundColor: isDark ? '#1A1C29' : '#F8FAFC',
                                                borderColor: isRec
                                                    ? 'rgba(255, 91, 69, 0.35)'
                                                    : isDark
                                                    ? 'rgba(255, 255, 255, 0.06)'
                                                    : 'rgba(0, 0, 0, 0.05)',
                                            },
                                        ]}
                                        activeOpacity={0.78}
                                        onPress={() => {
                                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            onSelectCharger?.(station);
                                        }}
                                    >
                                        <View style={styles.stationRowTop}>
                                            <View style={{ flex: 1, marginRight: 6 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                                    <ThemedText style={styles.stationRowName} numberOfLines={1}>
                                                        {station.name}
                                                    </ThemedText>
                                                    {isRec && (
                                                        <View style={styles.recBadgeSmall}>
                                                            <ThemedText style={styles.recBadgeSmallText}>BEST STOP</ThemedText>
                                                        </View>
                                                    )}
                                                </View>
                                                <ThemedText style={[styles.stationRowKm, { color: colors.textMuted }]}>
                                                    KM {station.distanceAlongRouteKm} • {station.location}
                                                </ThemedText>
                                            </View>

                                            {/* Power Badge */}
                                            <View
                                                style={[
                                                    styles.powerBadgeSmall,
                                                    { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : '#E0F2FE' },
                                                ]}
                                            >
                                                <Zap size={10} color="#38BDF8" fill="#38BDF8" />
                                                <ThemedText style={styles.powerBadgeSmallText}>
                                                    {station.powerKw} kW
                                                </ThemedText>
                                            </View>
                                        </View>

                                        {/* Row Meta */}
                                        <View style={styles.stationRowMeta}>
                                            <ThemedText style={[styles.stationMetaText, { color: '#10B981' }]}>
                                                🟢 {station.availableGuns} Guns Available
                                            </ThemedText>
                                            {station.arrivalSocPercent && (
                                                <ThemedText style={[styles.stationMetaText, { color: colors.textMuted }]}>
                                                    Arrive at ~{station.arrivalSocPercent}% SOC
                                                </ThemedText>
                                            )}
                                            <ThemedText style={[styles.stationMetaText, { color: colors.textMuted }]}>
                                                ₹{station.pricePerKWh.toFixed(1)}/kWh
                                            </ThemedText>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Open in Trip Planner Full Screen Button */}
            <TouchableOpacity
                style={[styles.openTripBtn, { backgroundColor: colors.coral }]}
                activeOpacity={0.82}
                onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onOpenTripPlanner?.();
                }}
            >
                <Compass size={14} color="#FFFFFF" />
                <ThemedText style={styles.openTripText}>
                    Open in Full Trip Planner
                </ThemedText>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: RADIUS.card,
        padding: 14,
        marginVertical: 6,
        borderWidth: 1.2,
        shadowColor: '#FF5B45',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    routeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    originText: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
    },
    destinationText: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
    },
    tagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.chip,
    },
    tagText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        color: '#FF5B45',
    },
    metricsRibbon: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: RADIUS.chip,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    metricItem: {
        alignItems: 'center',
    },
    metricDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(150, 150, 150, 0.2)',
    },
    metricLabel: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.medium,
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.bold,
    },

    // 1. Recommended Charger Box
    recommendedContainer: {
        borderRadius: RADIUS.card,
        borderWidth: 1.2,
        padding: 12,
        marginBottom: 14,
        shadowColor: '#FF5B45',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },
    recommendedBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    recommendedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.pill,
    },
    recommendedPillText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.4,
    },
    milestoneBadge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: RADIUS.pill,
    },
    milestoneBadgeText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        color: '#38BDF8',
    },
    recommendedName: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
        marginBottom: 2,
    },
    recommendedLocation: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.regular,
        marginBottom: 10,
    },
    socPredictionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: RADIUS.chip,
        marginBottom: 10,
    },
    socStat: {
        alignItems: 'center',
    },
    socLabel: {
        fontSize: 9,
        fontFamily: FONT_FAMILIES.medium,
        marginBottom: 1,
    },
    socValue: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.bold,
    },
    socTrackContainer: {
        flex: 1,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    socBarBg: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(150, 150, 150, 0.2)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 3,
    },
    socBarFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 3,
    },
    chargeDurationText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
    },
    specsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    specPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.pill,
    },
    specPillText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        color: '#38BDF8',
    },
    priceTag: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
        marginLeft: 'auto',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    navButton: {
        flex: 1,
        height: 34,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    navButtonText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
        color: '#FF5B45',
    },
    chargeButton: {
        flex: 1.2,
        height: 34,
        borderRadius: RADIUS.pill,
        backgroundColor: '#FF5B45',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    chargeButtonText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
        color: '#FFFFFF',
    },

    // 2. Chargers Along Route Section
    routeChargersSection: {
        marginBottom: 12,
    },
    sectionHeaderToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
        marginBottom: 4,
    },
    sectionHeading: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.2,
    },
    timelineList: {
        marginTop: 4,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    trackCol: {
        width: 24,
        alignItems: 'center',
        marginRight: 8,
        paddingTop: 4,
    },
    trackNode: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        zIndex: 2,
    },
    trackNodeRecommended: {
        backgroundColor: '#FF5B45',
        borderColor: '#FF7A66',
    },
    trackNodeText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
    },
    trackLine: {
        width: 2,
        flex: 1,
        marginTop: 2,
    },
    stationRowCard: {
        flex: 1,
        borderRadius: RADIUS.card,
        borderWidth: 1,
        padding: 9,
    },
    stationRowTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    stationRowName: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
    },
    recBadgeSmall: {
        backgroundColor: 'rgba(255, 91, 69, 0.16)',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: RADIUS.pill,
    },
    recBadgeSmallText: {
        fontSize: 8,
        fontFamily: FONT_FAMILIES.bold,
        color: '#FF5B45',
    },
    stationRowKm: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.regular,
    },
    powerBadgeSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: RADIUS.pill,
    },
    powerBadgeSmallText: {
        fontSize: 9,
        fontFamily: FONT_FAMILIES.bold,
        color: '#38BDF8',
    },
    stationRowMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    stationMetaText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.regular,
    },

    // Bottom Action
    openTripBtn: {
        height: 40,
        borderRadius: RADIUS.pill,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    openTripText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
    },
});
