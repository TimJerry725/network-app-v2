import React, { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Clock3, Heart, MapPin, Route as RouteIcon, Trash2, Zap } from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { MOCK_STATIONS, getRecommendedConnector } from '../../constants/Stations';
import { FONT_FAMILIES, FONTS, RADIUS, SPACING } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useIndiaChargingStations } from '../../hooks/useIndiaChargingStations';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSavedTrips, SavedTrip } from '../../context/SavedTripsContext';
import { Segmented } from '../../components/stack/StackKit';

function fmtDur(mins?: number) {
    if (!mins) return '—';
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return h > 0 ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
}

// Palette: violet, lime, ink and surface only (same four roles as the rest of the app)
function getBentoFavTheme(index: number, isDark: boolean) {
    const cycle = index % 4;
    if (cycle === 0) {
        return {
            bg: '#7B5CFF',
            textColor: '#FFFFFF',
            subColor: 'rgba(255, 255, 255, 0.8)',
            pillBg: 'rgba(255, 255, 255, 0.2)',
            pillText: '#FFFFFF',
            actionBg: '#FFFFFF',
            actionColor: '#5B3DF0',
            heartBgFav: '#FFFFFF',
            heartColorFav: '#EF4444',
        };
    }
    if (cycle === 1) {
        return {
            bg: '#A996FF',
            textColor: '#0B0B0F',
            subColor: 'rgba(11, 11, 15, 0.65)',
            pillBg: 'rgba(11, 11, 15, 0.10)',
            pillText: '#0B0B0F',
            actionBg: '#0B0B0F',
            actionColor: '#A996FF',
            heartBgFav: '#FFFFFF',
            heartColorFav: '#EF4444',
        };
    }
    if (cycle === 2) {
        return {
            bg: '#15151C',
            textColor: '#FFFFFF',
            subColor: 'rgba(255, 255, 255, 0.65)',
            pillBg: 'rgba(255, 255, 255, 0.12)',
            pillText: '#FFFFFF',
            actionBg: '#A996FF',
            actionColor: '#0B0B0F',
            heartBgFav: '#FFFFFF',
            heartColorFav: '#EF4444',
        };
    }
    return {
        bg: isDark ? '#1F1F28' : '#FFFFFF',
        textColor: isDark ? '#FFFFFF' : '#0B0B0F',
        subColor: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(11, 11, 15, 0.6)',
        pillBg: isDark ? 'rgba(123, 92, 255, 0.18)' : 'rgba(123, 92, 255, 0.10)',
        pillText: isDark ? '#FFFFFF' : '#5B3DF0',
        actionBg: isDark ? 'rgba(123, 92, 255, 0.2)' : 'rgba(123, 92, 255, 0.10)',
        actionColor: '#7B5CFF',
        heartBgFav: isDark ? '#FFFFFF' : '#FEE2E2',
        heartColorFav: '#EF4444',
    };
}

export default function FavoritesScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const { selectedVehicle } = useVehicles();
    const { isFavorite, toggleFavorite } = useFavorites();
    const { stations: allStations } = useIndiaChargingStations();
    const { savedTrips, removeTrip } = useSavedTrips();
    const [tab, setTab] = useState<'stations' | 'trips'>('stations');

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
                        <ThemedText type="title">Saved</ThemedText>
                        <ThemedText style={{ color: colors.textMuted, ...FONTS.body }}>
                            Your saved stations and trips
                        </ThemedText>
                    </View>
                </View>

                <View style={{ marginBottom: SPACING.md }}>
                    <Segmented
                        options={[
                            { value: 'stations', label: `Stations · ${stationsList.length}` },
                            { value: 'trips', label: `Trips · ${savedTrips.length}` },
                        ]}
                        value={tab}
                        onChange={setTab}
                    />
                </View>

                {tab === 'trips' ? (
                    savedTrips.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#15151C' : '#FFFFFF', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                                <RouteIcon size={36} color={colors.textMuted} />
                            </View>
                            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No Saved Trips Yet</ThemedText>
                            <ThemedText style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                                Plan a trip and tap Save trip to keep it here.
                            </ThemedText>
                        </View>
                    ) : (
                        savedTrips.map((trip: SavedTrip, index: number) => {
                            const theme = getBentoFavTheme(index, isDark);
                            return (
                                <TouchableOpacity
                                    key={trip.id}
                                    activeOpacity={0.88}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Open trip ${trip.origin?.name} to ${trip.destination?.name}`}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        navigation.navigate('Explore', { openTrip: trip });
                                    }}
                                    style={[styles.bentoFavCard, { backgroundColor: theme.bg, borderWidth: index % 4 === 3 ? 1 : 0, borderColor: colors.cardBorder }]}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={styles.stationTitleWrap}>
                                            <ThemedText style={[styles.stationName, { color: theme.textColor }]} numberOfLines={2}>
                                                {trip.origin?.name} → {trip.destination?.name}
                                            </ThemedText>
                                            <ThemedText style={[styles.stationMeta, { color: theme.subColor }]}>
                                                {trip.routeTag ?? 'Trip'} route
                                            </ThemedText>
                                        </View>
                                        <View style={styles.cardTopActions}>
                                            <TouchableOpacity
                                                accessibilityRole="button"
                                                accessibilityLabel="Remove saved trip"
                                                activeOpacity={0.8}
                                                style={[styles.favoriteHeartBtn, { backgroundColor: theme.heartBgFav }]}
                                                onPress={() =>
                                                    Alert.alert('Remove saved trip?', `${trip.origin?.name} → ${trip.destination?.name}`, [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        { text: 'Remove', style: 'destructive', onPress: () => removeTrip(trip.id) },
                                                    ])
                                                }
                                            >
                                                <Trash2 size={15} color={theme.heartColorFav} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={styles.bottomMetaRow}>
                                        <View style={[styles.bentoPill, { backgroundColor: theme.pillBg }]}>
                                            <MapPin size={11} color={theme.pillText ?? theme.textColor} />
                                            <ThemedText style={[styles.bentoPillText, { color: theme.pillText ?? theme.textColor }]}>
                                                {trip.distanceKm ?? '—'} KM
                                            </ThemedText>
                                        </View>
                                        <View style={[styles.bentoPill, { backgroundColor: theme.pillBg }]}>
                                            <Clock3 size={11} color={theme.pillText ?? theme.textColor} />
                                            <ThemedText style={[styles.bentoPillText, { color: theme.pillText ?? theme.textColor }]}>
                                                {fmtDur(trip.durationMins)}
                                            </ThemedText>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )
                ) : null}

                {tab === 'stations' && stationsList.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View
                            style={[
                                styles.emptyIconCircle,
                                {
                                    backgroundColor: isDark ? '#15151C' : '#FFFFFF',
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
                            Tap the heart icon on any charging station to add it to your favorites.
                        </ThemedText>
                    </View>
                ) : tab === 'stations' ? (
                    stationsList.map((station, index) => {
                        const connector = getRecommendedConnector(
                            station,
                            selectedVehicle?.connectorType
                        );
                        const isFav = isFavorite(station.id);
                        const theme = getBentoFavTheme(index, isDark);

                        return (
                            <TouchableOpacity
                                key={station.id}
                                activeOpacity={0.88}
                                onPress={() => {
                                    if (Platform.OS !== 'web') {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }
                                    navigation.navigate('StationDetails', { stationId: station.id });
                                }}
                                style={[
                                    styles.bentoFavCard,
                                    {
                                        backgroundColor: theme.bg,
                                        borderWidth: 1,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                    },
                                ]}
                            >
                                {/* Top Row: Station Name on Left, Actions on Right */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.stationTitleWrap}>
                                        <ThemedText
                                            style={[styles.stationName, { color: theme.textColor }]}
                                            numberOfLines={1}
                                        >
                                            {station.name}
                                        </ThemedText>
                                        <ThemedText
                                            style={[styles.stationMeta, { color: theme.subColor }]}
                                            numberOfLines={1}
                                        >
                                            {station.distanceKm} km away{station.etaMinutes ? ` • ${station.etaMinutes} min ETA` : ''}
                                        </ThemedText>
                                    </View>

                                    <View style={styles.cardTopActions}>
                                        <TouchableOpacity
                                            style={[
                                                styles.favoriteHeartBtn,
                                                {
                                                    backgroundColor: isFav
                                                        ? theme.heartBgFav
                                                        : theme.pillBg,
                                                },
                                            ]}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                if (Platform.OS !== 'web') {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                }
                                                toggleFavorite(station.id);
                                            }}
                                            activeOpacity={0.75}
                                        >
                                            <Heart
                                                size={16}
                                                color={isFav ? theme.heartColorFav : theme.textColor}
                                                fill={isFav ? theme.heartColorFav : 'none'}
                                            />
                                        </TouchableOpacity>

                                    </View>
                                </View>

                            {/* Bottom Meta Row with Pills */}
                            <View style={styles.bottomMetaRow}>
                                <View style={[styles.bentoPill, { backgroundColor: theme.pillBg }]}>
                                    <Zap size={11} color={theme.textColor} fill={theme.textColor} />
                                    <ThemedText style={[styles.bentoPillText, { color: theme.textColor }]}>
                                        {connector.type} • {connector.power} kW
                                    </ThemedText>
                                </View>

                                <ThemedText style={{ color: theme.subColor, ...FONTS.caption, fontWeight: '700', marginLeft: 'auto' }}>
                                    ₹{connector.pricePerKWh.toFixed(0)}/kWh
                                </ThemedText>
                            </View>
                        </TouchableOpacity>
                    );
                })) : null}
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
    bentoFavCard: {
        borderRadius: RADIUS.card,
        padding: 18,
        marginBottom: 14,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 12,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    stationTitleWrap: {
        flex: 1,
        marginRight: 12,
        justifyContent: 'center',
    },
    cardTopActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 34,
    },
    bentoPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: RADIUS.chip,
        alignSelf: 'flex-start',
    },
    bentoPillText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.5,
    },
    favoriteHeartBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
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
        marginBottom: 3,
    },
    stationMeta: {
        ...FONTS.caption,
        lineHeight: 16,
    },
    bottomMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
