import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Heart, MapPin, Zap } from 'lucide-react-native';
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
    const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
    const { stations: allStations } = useIndiaChargingStations();

    const stationsList = useMemo(() => {
        const pool = allStations && allStations.length > 0 ? allStations : MOCK_STATIONS;
        return [...pool].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }, [allStations]);

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
                            Your saved chargers and network stops
                        </ThemedText>
                    </View>
                    <View
                        style={[
                            styles.headerBadge,
                            {
                                backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                            },
                        ]}
                    >
                        <Heart size={14} color="#EF4444" fill="#EF4444" />
                        <ThemedText
                            style={{
                                color: colors.text,
                                ...FONTS.caption,
                                fontFamily: FONT_FAMILIES.bold,
                                letterSpacing: 0.5,
                            }}
                        >
                            {favoriteIds.length} SAVED
                        </ThemedText>
                    </View>
                </View>

                {stationsList.map((station) => {
                    const connector = getRecommendedConnector(
                        station,
                        selectedVehicle?.connectorType
                    );
                    const isFav = isFavorite(station.id);

                    return (
                        <TouchableOpacity
                            key={station.id}
                            activeOpacity={0.82}
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

                                    {/* Heart Icon Button to toggle Favorite */}
                                    <TouchableOpacity
                                        style={[
                                            styles.favoriteHeartBtn,
                                            {
                                                backgroundColor: isFav
                                                    ? (isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.10)')
                                                    : (isDark ? '#16161D' : '#F0F0F2'),
                                                borderColor: isFav
                                                    ? 'rgba(239, 68, 68, 0.45)'
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
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Heart
                                            size={17}
                                            color={isFav ? '#EF4444' : (isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.35)')}
                                            fill={isFav ? '#EF4444' : 'none'}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {station.tagline ? (
                                    <ThemedText
                                        style={[styles.tagline, { color: colors.textMuted }]}
                                        numberOfLines={2}
                                    >
                                        {station.tagline}
                                    </ThemedText>
                                ) : null}
                            </CredCard>
                        </TouchableOpacity>
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
        borderRadius: RADIUS.pill,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        borderWidth: 1,
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
    favoriteHeartBtn: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.circle,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tagline: {
        marginTop: 12,
        ...FONTS.body,
        lineHeight: 20,
    },
});
