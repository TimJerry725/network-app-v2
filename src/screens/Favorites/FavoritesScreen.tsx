import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Heart, MapPin, Zap, ArrowUpRight } from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { MOCK_STATIONS, getRecommendedConnector } from '../../constants/Stations';
import { FONT_FAMILIES, FONTS, RADIUS, SPACING } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useIndiaChargingStations } from '../../hooks/useIndiaChargingStations';
import { useAppTheme } from '../../hooks/useAppTheme';

function getBentoFavTheme(index: number, isDark: boolean) {
    const cycle = index % 5;
    if (cycle === 0) {
        return {
            bg: '#FFC043',
            textColor: '#101114',
            subColor: 'rgba(16, 17, 20, 0.72)',
            pillBg: 'rgba(0, 0, 0, 0.12)',
            pillText: '#101114',
            actionBg: '#101114',
            actionColor: '#FFC043',
            tag: 'FAVORITE STOP',
        };
    }
    if (cycle === 1) {
        return {
            bg: '#5B61F6',
            textColor: '#FFFFFF',
            subColor: 'rgba(255, 255, 255, 0.82)',
            pillBg: 'rgba(255, 255, 255, 0.22)',
            pillText: '#FFFFFF',
            actionBg: '#FFFFFF',
            actionColor: '#5B61F6',
            tag: 'FREQUENT PICK',
        };
    }
    if (cycle === 2) {
        return {
            bg: '#FF5B45',
            textColor: '#FFFFFF',
            subColor: 'rgba(255, 255, 255, 0.82)',
            pillBg: 'rgba(255, 255, 255, 0.22)',
            pillText: '#FFFFFF',
            actionBg: '#FFFFFF',
            actionColor: '#FF5B45',
            tag: 'RAPID CHARGER',
        };
    }
    if (cycle === 3) {
        return {
            bg: '#10B981',
            textColor: '#FFFFFF',
            subColor: 'rgba(255, 255, 255, 0.85)',
            pillBg: 'rgba(255, 255, 255, 0.22)',
            pillText: '#FFFFFF',
            actionBg: '#FFFFFF',
            actionColor: '#10B981',
            tag: 'SOLAR POWERED',
        };
    }
    return {
        bg: isDark ? '#16171E' : '#FFFFFF',
        textColor: isDark ? '#FFFFFF' : '#101114',
        subColor: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.6)',
        pillBg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
        pillText: isDark ? '#F4F4F6' : '#101114',
        actionBg: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
        actionColor: isDark ? '#FFFFFF' : '#101114',
        tag: 'SAVED CHARGER',
    };
}

export default function FavoritesScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const { selectedVehicle } = useVehicles();
    const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
    const { stations: allStations } = useIndiaChargingStations();

    const stationsList = useMemo(() => {
        const pool = allStations && allStations.length > 0 ? allStations : MOCK_STATIONS;
        return [...pool].sort((a, b) => {
            const favA = isFavorite(a.id) ? 1 : 0;
            const favB = isFavorite(b.id) ? 1 : 0;
            if (favA !== favB) return favB - favA;
            return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
        });
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

                {stationsList.map((station, index) => {
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
                            {/* Top Row: Tag Capsule, Favorite Heart & Diagonal Arrow Action */}
                            <View style={styles.cardHeader}>
                                <View style={[styles.bentoPill, { backgroundColor: theme.pillBg }]}>
                                    <ThemedText style={[styles.bentoPillText, { color: theme.pillText }]}>
                                        • {theme.tag}
                                    </ThemedText>
                                </View>

                                <View style={styles.cardTopActions}>
                                    <TouchableOpacity
                                        style={[
                                            styles.favoriteHeartBtn,
                                            {
                                                backgroundColor: isFav
                                                    ? 'rgba(239, 68, 68, 0.2)'
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
                                            color={isFav ? '#EF4444' : theme.textColor}
                                            fill={isFav ? '#EF4444' : 'none'}
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
                                        <ArrowUpRight
                                            size={16}
                                            color={theme.actionColor}
                                            strokeWidth={2.5}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Station Title & Location */}
                            <View style={styles.stationInfo}>
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
        borderRadius: RADIUS.button,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        borderWidth: 1,
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
    stationInfo: {
        marginBottom: 14,
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
});
