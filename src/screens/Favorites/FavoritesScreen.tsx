import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MapPin, Star, Zap } from 'lucide-react-native';
import { CredButton } from '../../components/CredButton';
import { CredCard } from '../../components/CredCard';
import { ThemedText } from '../../components/ThemedText';
import { MOCK_STATIONS, getRecommendedConnector } from '../../constants/Stations';
import { FONT_FAMILIES, FONTS, RADIUS, SPACING } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';
import { useAppTheme } from '../../hooks/useAppTheme';

const favoriteStationIds = ['1', '3', '4'];

export default function FavoritesScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const { selectedVehicle } = useVehicles();

    const favoriteStations = favoriteStationIds
        .map((stationId) => MOCK_STATIONS.find((station) => station.id === stationId))
        .filter((station): station is NonNullable<typeof station> => Boolean(station));

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View>
                        <ThemedText type="title">Favorites</ThemedText>
                        <ThemedText style={{ color: colors.textMuted, ...FONTS.body }}>
                            Your saved chargers and quick-return stops
                        </ThemedText>
                    </View>
                    <View
                        style={[
                            styles.headerBadge,
                            {
                                backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                                borderBottomColor: isDark ? '#050508' : '#D0D0D5',
                            },
                        ]}
                    >
                        <Heart size={14} color={colors.primary} fill={colors.primary} />
                        <ThemedText
                            style={{
                                color: colors.text,
                                ...FONTS.caption,
                                fontFamily: FONT_FAMILIES.bold,
                                letterSpacing: 0.5,
                            }}
                        >
                            {favoriteStations.length} SAVED
                        </ThemedText>
                    </View>
                </View>

                {favoriteStations.map((station) => {
                    const connector = getRecommendedConnector(
                        station,
                        selectedVehicle?.connectorType
                    );

                    return (
                        <CredCard key={station.id} variant="default" style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.stationInfo}>
                                    <ThemedText style={styles.stationName}>{station.name}</ThemedText>
                                    <View style={styles.metaRow}>
                                        <MapPin size={14} color={colors.textMuted} />
                                        <ThemedText style={{ color: colors.textMuted, ...FONTS.caption }}>
                                            {station.distanceKm} km away
                                        </ThemedText>
                                    </View>
                                    <View style={styles.metaRow}>
                                        <Zap size={14} color={colors.primary} />
                                        <ThemedText style={{ color: colors.textMuted, ...FONTS.caption }}>
                                            {connector.type} • {connector.power} kW • ₹
                                            {connector.pricePerKWh.toFixed(2)}/kWh
                                        </ThemedText>
                                    </View>
                                </View>
                                <View
                                    style={[
                                        styles.ratingBadge,
                                        {
                                            backgroundColor: isDark ? '#141418' : '#F4F4F6',
                                            borderColor: colors.cardBorder,
                                            borderWidth: 1,
                                        },
                                    ]}
                                >
                                    <Star size={13} color={colors.text} fill={colors.text} />
                                    <ThemedText style={{ color: colors.text, ...FONTS.caption, fontWeight: '700' }}>
                                        {station.rating.toFixed(1)}
                                    </ThemedText>
                                </View>
                            </View>

                            <ThemedText style={[styles.tagline, { color: colors.textMuted }]}>
                                {station.tagline}
                            </ThemedText>

                            <View style={styles.actionRow}>
                                <CredButton
                                    title="DETAILS"
                                    variant="outline"
                                    containerStyle={{ flex: 1 }}
                                    onPress={() =>
                                        navigation.navigate('StationDetails', { stationId: station.id })
                                    }
                                />
                                <CredButton
                                    title="CHARGE"
                                    variant="neon"
                                    containerStyle={{ flex: 1 }}
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
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    content: {
        padding: SPACING.lg - 4,
        paddingBottom: 140,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: SPACING.lg - 4,
    },
    headerBadge: {
        minWidth: 52,
        height: 38,
        borderRadius: 19,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    card: {
        marginBottom: 14,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    stationInfo: {
        flex: 1,
    },
    stationName: {
        ...FONTS.h3,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        borderRadius: RADIUS.pill,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    tagline: {
        marginTop: 14,
        ...FONTS.body,
        lineHeight: 20,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 18,
    },
    secondaryAction: {
        flex: 1,
        minHeight: 48,
        borderRadius: RADIUS.button,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryAction: {
        minWidth: 96,
        minHeight: 48,
        borderRadius: RADIUS.button,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: SPACING.md,
    },
    primaryLabel: {
        color: '#FFFFFF',
        ...FONTS.bodyStrong,
    },
});
