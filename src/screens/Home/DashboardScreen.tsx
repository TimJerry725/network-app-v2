import React from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowRight,
    BatteryCharging,
    Gift,
    MapPinned,
    ScanLine,
    ShieldCheck,
    Sparkles,
    Trophy,
} from 'lucide-react-native';
import { GradientButton } from '../../components/GradientButton';
import { NeoCard } from '../../components/NeoCard';
import { ThemedText } from '../../components/ThemedText';
import { MOCK_STATIONS, getRecommendedConnector } from '../../constants/Stations';
import { useVehicles } from '../../context/VehicleContext';
import { useAppTheme } from '../../hooks/useAppTheme';

const missions = [
    { id: 'mission-1', title: 'Start one smart charge', reward: '+35 pts', progress: 1 },
    { id: 'mission-2', title: 'Use a calm station window', reward: '+20 pts', progress: 0.65 },
];

const weeklyStats = [
    { label: 'Streak', value: '6 days', icon: Trophy },
    { label: 'Green points', value: '1,280', icon: Gift },
    { label: 'Smart mode', value: '94%', icon: ShieldCheck },
];

export default function DashboardScreen({ navigation }: any) {
    const { colors } = useAppTheme();
    const { selectedVehicle } = useVehicles();
    const featuredStation = MOCK_STATIONS[0];
    const recommendedConnector = getRecommendedConnector(
        featuredStation,
        selectedVehicle?.connectorType
    );

    const quickActions = [
        {
            id: 'quick-1',
            label: 'Start charge',
            sublabel: 'One tap to your best match',
            icon: BatteryCharging,
            onPress: () =>
                navigation.navigate('ChargingSession', {
                    stationId: featuredStation.id,
                    connectorId: recommendedConnector.id,
                }),
        },
        {
            id: 'quick-2',
            label: 'Trip Planner',
            sublabel: 'Map and fast filters together',
            icon: MapPinned,
            onPress: () => navigation.navigate('Explore'),
        },
        {
            id: 'quick-3',
            label: 'Scan QR',
            sublabel: 'Manual start when needed',
            icon: ScanLine,
            onPress: () => navigation.navigate('Scan'),
        },
    ];

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View>
                        <ThemedText style={[styles.eyebrow, { color: colors.textMuted }]}>
                            Welcome back
                        </ThemedText>
                        <ThemedText type="title" style={styles.headerTitle}>
                            Ready for your next boost?
                        </ThemedText>
                    </View>
                    <View style={[styles.pointsPill, { backgroundColor: colors.primarySoft }]}>
                        <Sparkles size={16} color={colors.primary} />
                        <ThemedText style={[styles.pointsText, { color: colors.primaryStrong }]}>
                            1280 pts
                        </ThemedText>
                    </View>
                </View>

                <LinearGradient colors={colors.heroGradient} style={styles.heroCard}>
                    <View style={styles.heroTopRow}>
                        <View style={styles.heroContent}>
                            <ThemedText style={[styles.eyebrow, { color: colors.textMuted }]}>
                                {selectedVehicle?.nickname ?? 'Primary EV'}
                            </ThemedText>
                            <ThemedText type="title" style={styles.heroBattery}>
                                {selectedVehicle?.currentBattery ?? 62}%
                            </ThemedText>
                            <ThemedText style={[styles.heroSubtext, { color: colors.textMuted }]}>
                                {selectedVehicle?.estRangeKm ?? 286} km range left
                            </ThemedText>
                            <ThemedText style={[styles.heroSubtext, { color: colors.textMuted }]}>
                                Smart target {selectedVehicle?.chargeTarget ?? 90}% at{' '}
                                {featuredStation.name}
                            </ThemedText>
                        </View>
                        <View style={[styles.levelBadge, { backgroundColor: colors.overlay }]}>
                            <ThemedText style={[styles.levelLabel, { color: colors.textMuted }]}>
                                Level 4
                            </ThemedText>
                            <ThemedText style={styles.levelTitle}>Eco Sprinter</ThemedText>
                            <ThemedText style={[styles.levelMeta, { color: colors.textMuted }]}>
                                70 pts to next badge
                            </ThemedText>
                        </View>
                    </View>

                    <View style={styles.progressRail}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    backgroundColor: colors.primary,
                                    width: '72%',
                                },
                            ]}
                        />
                    </View>

                    <View style={styles.heroActionRow}>
                        <GradientButton
                            title="Charge now"
                            style={styles.heroPrimaryButton}
                            onPress={() =>
                                navigation.navigate('ChargingSession', {
                                    stationId: featuredStation.id,
                                    connectorId: recommendedConnector.id,
                                })
                            }
                        />
                        <TouchableOpacity
                            style={[
                                styles.heroSecondaryButton,
                                {
                                    backgroundColor: colors.surface,
                                },
                            ]}
                            onPress={() =>
                                navigation.navigate('StationDetails', {
                                    stationId: featuredStation.id,
                                })
                            }
                        >
                            <ThemedText style={{ color: colors.primaryStrong }}>
                                View nearby hub
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <View style={styles.statsRow}>
                    {weeklyStats.map(({ label, value, icon: Icon }) => (
                        <NeoCard key={label} style={styles.statCard}>
                            <Icon size={18} color={colors.primary} />
                            <ThemedText style={[styles.statValue, { marginTop: 12 }]}>
                                {value}
                            </ThemedText>
                            <ThemedText style={[styles.statLabel, { color: colors.textMuted }]}>
                                {label}
                            </ThemedText>
                        </NeoCard>
                    ))}
                </View>

                <View style={styles.sectionHeader}>
                    <ThemedText type="subtitle">Quick actions</ThemedText>
                    <ThemedText style={{ color: colors.textMuted }}>
                        Low-click shortcuts
                    </ThemedText>
                </View>

                <View style={styles.actionGrid}>
                    {quickActions.map(({ id, label, sublabel, icon: Icon, onPress }) => (
                        <TouchableOpacity
                            key={id}
                            style={[
                                styles.actionTile,
                                {
                                    backgroundColor: colors.surface,
                                },
                            ]}
                            activeOpacity={0.85}
                            onPress={onPress}
                        >
                            <View
                                style={[
                                    styles.actionIconWrap,
                                    { backgroundColor: colors.primarySoft },
                                ]}
                            >
                                <Icon size={20} color={colors.primary} />
                            </View>
                            <ThemedText style={styles.actionTitle}>{label}</ThemedText>
                            <ThemedText
                                style={[styles.actionSubtitle, { color: colors.textMuted }]}
                            >
                                {sublabel}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.sectionHeader}>
                    <ThemedText type="subtitle">Best nearby stations</ThemedText>
                    <TouchableOpacity onPress={() => navigation.navigate('Map')}>
                        <ThemedText style={{ color: colors.primary }}>See all</ThemedText>
                    </TouchableOpacity>
                </View>

                {MOCK_STATIONS.slice(0, 2).map((station) => {
                    const connector = getRecommendedConnector(
                        station,
                        selectedVehicle?.connectorType
                    );

                    return (
                        <NeoCard key={station.id} style={styles.stationCard}>
                            <View style={styles.stationTopRow}>
                                <View style={styles.stationInfo}>
                                    <ThemedText style={styles.stationTitle}>
                                        {station.name}
                                    </ThemedText>
                                    <ThemedText
                                        style={[styles.stationSubtitle, { color: colors.textMuted }]}
                                    >
                                        {station.distanceKm} km away • {station.etaMinutes} min •{' '}
                                        {station.occupancyLabel}
                                    </ThemedText>
                                    <ThemedText
                                        style={[styles.stationSubtitle, { color: colors.textMuted }]}
                                    >
                                        {connector.power} kW • ₹{connector.pricePerKWh.toFixed(2)}/kWh
                                    </ThemedText>
                                </View>
                                <View
                                    style={[
                                        styles.rewardTag,
                                        { backgroundColor: colors.primarySoft },
                                    ]}
                                >
                                    <Gift size={14} color={colors.primary} />
                                    <ThemedText
                                        style={[
                                            styles.rewardText,
                                            { color: colors.primaryStrong },
                                        ]}
                                    >
                                        +{station.rewardBoost}
                                    </ThemedText>
                                </View>
                            </View>

                            <View style={styles.stationFooterRow}>
                                <View>
                                    <ThemedText style={[styles.stationTagline, { color: colors.textMuted }]}>
                                        {station.tagline}
                                    </ThemedText>
                                </View>
                                <TouchableOpacity
                                    style={styles.inlineAction}
                                    onPress={() =>
                                        navigation.navigate('ChargingSession', {
                                            stationId: station.id,
                                            connectorId: connector.id,
                                        })
                                    }
                                >
                                    <ThemedText style={{ color: colors.primary }}>
                                        Start now
                                    </ThemedText>
                                    <ArrowRight size={16} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        </NeoCard>
                    );
                })}

                <View style={styles.sectionHeader}>
                    <ThemedText type="subtitle">Daily missions</ThemedText>
                    <ThemedText style={{ color: colors.textMuted }}>
                        Earn more with small wins
                    </ThemedText>
                </View>

                {missions.map((mission) => (
                    <NeoCard key={mission.id} style={styles.missionCard}>
                        <View style={styles.missionTopRow}>
                            <View>
                                <ThemedText style={styles.missionTitle}>{mission.title}</ThemedText>
                                <ThemedText style={{ color: colors.textMuted }}>
                                    Reward {mission.reward}
                                </ThemedText>
                            </View>
                            <View
                                style={[
                                    styles.missionBadge,
                                    { backgroundColor: colors.surfaceMuted },
                                ]}
                            >
                                <Trophy size={14} color={colors.accent} />
                                <ThemedText style={{ color: colors.accent }}>
                                    {Math.round(mission.progress * 100)}%
                                </ThemedText>
                            </View>
                        </View>
                        <View style={[styles.progressRail, { marginTop: 16 }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: colors.primary,
                                        width: `${mission.progress * 100}%` as `${number}%`,
                                    },
                                ]}
                            />
                        </View>
                    </NeoCard>
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
        paddingBottom: 140,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    eyebrow: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    headerTitle: {
        maxWidth: 240,
    },
    pointsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        gap: 6,
    },
    pointsText: {
        fontSize: 14,
        fontWeight: '700',
    },
    heroCard: {
        borderRadius: 30,
        padding: 24,
        marginTop: 24,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    heroContent: {
        flex: 1,
    },
    heroBattery: {
        marginBottom: 10,
    },
    heroSubtext: {
        fontSize: 14,
        lineHeight: 21,
    },
    levelBadge: {
        width: 130,
        borderRadius: 24,
        padding: 16,
        justifyContent: 'space-between',
    },
    levelLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    levelTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginVertical: 8,
    },
    levelMeta: {
        fontSize: 12,
        lineHeight: 18,
    },
    progressRail: {
        height: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        overflow: 'hidden',
        marginTop: 20,
    },
    progressFill: {
        height: '100%',
        borderRadius: 999,
    },
    heroActionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 22,
    },
    heroPrimaryButton: {
        flex: 1,
    },
    heroSecondaryButton: {
        flex: 1,
        minHeight: 54,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 18,
    },
    statCard: {
        flex: 1,
        minHeight: 118,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    statLabel: {
        marginTop: 4,
        fontSize: 13,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 28,
        marginBottom: 12,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionTile: {
        width: '48%',
        borderRadius: 24,
        padding: 18,
        minHeight: 150,
    },
    actionIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    actionSubtitle: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 20,
    },
    stationCard: {
        marginBottom: 12,
    },
    stationTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    stationInfo: {
        flex: 1,
    },
    stationTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    stationSubtitle: {
        fontSize: 13,
        marginBottom: 4,
    },
    rewardTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 8,
        alignSelf: 'flex-start',
    },
    rewardText: {
        fontSize: 12,
        fontWeight: '700',
    },
    stationFooterRow: {
        marginTop: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    stationTagline: {
        fontSize: 13,
    },
    inlineAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    missionCard: {
        marginBottom: 12,
    },
    missionTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    missionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    missionBadge: {
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 999,
        alignItems: 'center',
    },
});
