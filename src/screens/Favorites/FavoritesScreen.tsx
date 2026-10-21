import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Heart, MapPin, Zap, Navigation } from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { MOCK_STATIONS, getRecommendedConnector } from '../../constants/Stations';
import { FONT_FAMILIES, FONTS, RADIUS, SPACING } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useIndiaChargingStations } from '../../hooks/useIndiaChargingStations';
import { useAppTheme } from '../../hooks/useAppTheme';

function getBentoFavTheme(index: number, isDark: boolean) {
    const cycle = index % 4;
    if (cycle === 0) {
        return {
            bg: '#38BDF8', // Primary: Ice Blue
            textColor: '#0A0D14',
            subColor: 'rgba(10, 13, 20, 0.75)',
            pillBg: 'rgba(0, 0, 0, 0.12)',
            pillText: '#0A0D14',
            actionBg: '#0A0D14',
            actionColor: '#38BDF8',
            heartBgFav: '#FFFFFF',
            heartColorFav: '#EF4444',
        };
    }
    if (cycle === 1) {
        return {
            bg: '#FF5B45', // Secondary: Sunset Coral
            textColor: '#FFFFFF',
            subColor: 'rgba(255, 255, 255, 0.85)',
            pillBg: 'rgba(255, 255, 255, 0.22)',
            pillText: '#FFFFFF',
            actionBg: '#FFFFFF',
            actionColor: '#FF5B45',
            heartBgFav: '#FFFFFF',
            heartColorFav: '#EF4444',
        };
    }
    if (cycle === 2) {
        return {
            bg: '#10B981', // Tertiary: Neo Mint
            textColor: '#FFFFFF',
            subColor: 'rgba(255, 255, 255, 0.85)',
            pillBg: 'rgba(255, 255, 255, 0.22)',
            pillText: '#FFFFFF',
            actionBg: '#FFFFFF',
            actionColor: '#10B981',
            heartBgFav: '#FFFFFF',
            heartColorFav: '#EF4444',
        };
    }
    return {
        bg: isDark ? '#16171E' : '#FFFFFF',
        textColor: isDark ? '#FFFFFF' : '#101114',
        subColor: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.6)',
        pillBg: isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(56, 189, 248, 0.10)',
        actionBg: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(56, 189, 248, 0.10)',
        actionColor: '#38BDF8',
        heartBgFav: isDark ? '#FFFFFF' : '#FEE2E2',
        heartColorFav: '#EF4444',
    };
}

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
                                    backgroundColor: isDark ? '#16171E' : '#FFFFFF',
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
                                            style={{ color: theme.subColor, ...FONTS.caption }}
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
                                                    shadowColor: '#000000',
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: isFav ? 0.15 : 0,
                                                    shadowRadius: 3,
                                                    elevation: isFav ? 2 : 0,
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

                                        <View
                                            style={[
                                                styles.cardActionCircle,
                                                {
                                                    backgroundColor: theme.actionBg,
                                                },
                                            ]}
                                        >
                                            <Navigation
                                                size={13}
                                                color={theme.actionColor}
                                                fill={theme.actionColor}
                                            />
                                        </View>
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
                }))}
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
        alignItems: 'center',
        marginBottom: 12,
    },
    stationTitleWrap: {
        flex: 1,
        marginRight: 12,
    },
    cardTopActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardActionCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stationName: {
        ...FONTS.h3,
        fontSize: 18,
        marginBottom: 3,
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
