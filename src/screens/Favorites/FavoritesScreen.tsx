import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ArrowUpRight, Heart, MapPin, Zap } from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { RetroMascot } from '../../components/RetroMascot';
import { RetroButton } from '../../components/RetroButton';
import { MOCK_STATIONS, getRecommendedConnector } from '../../constants/Stations';
import { FONT_FAMILIES, FONTS, RADIUS, SPACING } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useIndiaChargingStations } from '../../hooks/useIndiaChargingStations';
import { useAppTheme } from '../../hooks/useAppTheme';

function getBentoFavTheme(index: number, isDark: boolean) {
    return {
        bg: isDark ? '#142C50' : '#FFFFFF',
        textColor: isDark ? '#F8FAFC' : '#0B1E3B',
        subColor: isDark ? '#B7C8E2' : '#64748B',
        pillBg: isDark ? 'rgba(34, 211, 238, 0.15)' : 'rgba(59, 130, 246, 0.10)',
        pillText: isDark ? '#22D3EE' : '#2563EB',
        actionBg: '#3B82F6',
        actionColor: '#FFFFFF',
        heartBgFav: isDark ? '#0B1E3B' : '#FEE2E2',
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
                        <View style={{ marginBottom: 16 }}>
                            <RetroMascot size={110} expression="wink" animated />
                        </View>
                        <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                            No Starred Chargers Yet
                        </ThemedText>
                        <ThemedText style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                            Tap the heart icon on any charging station in the grid to bookmark it for rapid access.
                        </ThemedText>
                        <RetroButton
                            title="EXPLORE RADAR MAP"
                            onPress={() => navigation.navigate('Map')}
                            size="md"
                            containerStyle={{ marginTop: 20 }}
                        />
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

                                        <TouchableOpacity
                                            style={[
                                                styles.cardActionCircle,
                                                {
                                                    backgroundColor: theme.actionBg,
                                                },
                                            ]}
                                            onPress={() => {
                                                if (Platform.OS !== 'web') {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                }
                                                navigation.navigate('StationDetails', { stationId: station.id });
                                            }}
                                            activeOpacity={0.75}
                                        >
                                            <ArrowUpRight
                                                size={16}
                                                color={theme.actionColor}
                                                strokeWidth={2.4}
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
