import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ArrowUpRight, Heart, MapPin, Zap } from 'lucide-react-native';
import { CredCard } from '../../components/CredCard';
import { ThemedText } from '../../components/ThemedText';
import { MOCK_STATIONS, getRecommendedConnector } from '../../constants/Stations';
import { FONT_FAMILIES, FONTS, RADIUS, SPACING } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useIndiaChargingStations } from '../../hooks/useIndiaChargingStations';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function FavoritesScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const { selectedVehicle } = useVehicles();
    const { isFavorite, toggleFavorite } = useFavorites();
    const { stations: allStations } = useIndiaChargingStations();

    const stationsList = useMemo(() => {
        const pool = allStations && allStations.length > 0 ? allStations : MOCK_STATIONS;
        const favs = pool.filter((station) => isFavorite(station.id));
        return favs.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }, [allStations, isFavorite]);

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
                            Your favorite chargers and network stops
                        </ThemedText>
                    </View>
                </View>

                {stationsList.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View
                            style={[
                                styles.emptyIconCircle,
                                {
                                    backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                },
                            ]}
                        >
                            <Heart size={36} color={colors.textMuted} />
                        </View>
                        <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                            No Favorites Yet
                        </ThemedText>
                        <ThemedText style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                            Tap the heart icon on any charging station to save it here for fast access.
                        </ThemedText>
                    </View>
                ) : (
                    stationsList.map((station) => {
                        const connector = getRecommendedConnector(
                            station,
                            selectedVehicle?.connectorType
                        );
                        const isFav = isFavorite(station.id);

                        return (
                            <TouchableOpacity
                                key={station.id}
                                activeOpacity={0.85}
                                onPress={() => {
                                    if (Platform.OS !== 'web') {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }
                                    navigation.navigate('StationDetails', { stationId: station.id });
                                }}
                            >
                                <CredCard variant="default" style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.stationInfo}>
                                            <ThemedText style={styles.stationName} numberOfLines={1}>
                                                {station.name}
                                            </ThemedText>
                                            <View style={styles.metaRow}>
                                                <MapPin size={13} color={colors.textMuted} />
                                                <ThemedText style={{ color: colors.textMuted, ...FONTS.caption }} numberOfLines={1}>
                                                    {station.distanceKm} km away{station.etaMinutes ? ` • ${station.etaMinutes} min ETA` : ''}
                                                </ThemedText>
                                            </View>
                                            <View style={styles.metaRow}>
                                                <Zap size={13} color={colors.primary} />
                                                <ThemedText style={{ color: colors.textMuted, ...FONTS.caption }}>
                                                    {connector.type} • {connector.power} kW • ₹
                                                    {connector.pricePerKWh.toFixed(2)}/kWh
                                                </ThemedText>
                                            </View>
                                        </View>

                                        {/* Action Icons aligned in a straight line */}
                                        <View style={styles.cardTopActions}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.favoriteHeartBtn,
                                                    {
                                                        backgroundColor: isFav
                                                            ? (isDark ? '#23242B' : '#FFFFFF')
                                                            : (isDark ? '#16161D' : '#F0F0F2'),
                                                        borderColor: isFav
                                                            ? (isDark ? 'rgba(239, 68, 68, 0.5)' : '#FECDD3')
                                                            : (isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)'),
                                                    },
                                                ]}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    if (Platform.OS !== 'web') {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                    }
                                                    toggleFavorite(station.id);
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <Heart
                                                    size={16}
                                                    color="#EF4444"
                                                    fill="#EF4444"
                                                />
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[
                                                    styles.cardActionCircle,
                                                    {
                                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                                                    },
                                                ]}
                                                onPress={() => {
                                                    if (Platform.OS !== 'web') {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    }
                                                    navigation.navigate('StationDetails', { stationId: station.id });
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <ArrowUpRight
                                                    size={16}
                                                    color={colors.text}
                                                    strokeWidth={2.4}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </CredCard>
                            </TouchableOpacity>
                        );
                    })
                )}
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
    card: {
        marginBottom: 14,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    stationInfo: {
        flex: 1,
        marginRight: 8,
    },
    cardTopActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 34,
    },
    favoriteHeartBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1.2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
        elevation: 1,
    },
    cardActionCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1.2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
        elevation: 1,
    },
    stationName: {
        ...FONTS.h3,
        fontSize: 18,
        lineHeight: 22,
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 70,
        paddingHorizontal: 28,
    },
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: FONT_FAMILIES.bold,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.regular,
        textAlign: 'center',
        lineHeight: 18,
    },
});
