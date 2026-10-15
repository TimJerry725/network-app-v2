import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Heart, MapPin, Star, Zap } from 'lucide-react-native';
import { CredCard } from '../../components/CredCard';
import { ThemedText } from '../../components/ThemedText';
import { MOCK_STATIONS, getRecommendedConnector } from '../../constants/Stations';
import { FONT_FAMILIES, FONTS, RADIUS, SPACING } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';
import { useIndiaChargingStations } from '../../hooks/useIndiaChargingStations';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function FavoritesScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const { selectedVehicle } = useVehicles();
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
                            Charging stations network
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
                            {stationsList.length} STATIONS
                        </ThemedText>
                    </View>
                </View>

                {stationsList.map((station) => {
                    const connector = getRecommendedConnector(
                        station,
                        selectedVehicle?.connectorType
                    );

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
        borderRadius: RADIUS.chip,
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
        borderRadius: RADIUS.chip,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    tagline: {
        marginTop: 12,
        ...FONTS.body,
        lineHeight: 20,
    },
});
