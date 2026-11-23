import React, { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Clock3, Heart, MapPin, Route as RouteIcon, Trash2, Zap } from '../../components/sf/icons';
import { ThemedText } from '../../components/ThemedText';
import { MOCK_STATIONS, getRecommendedConnector } from '../../constants/Stations';
import { useVehicles } from '../../context/VehicleContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useIndiaChargingStations } from '../../hooks/useIndiaChargingStations';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSavedTrips, SavedTrip } from '../../context/SavedTripsContext';
import { BackButton } from '../../components/BackButton';
import { Segmented } from '../../components/stack/StackKit';

function fmtDur(mins?: number) {
    if (!mins) return '—';
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return h > 0 ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
}

/** Saved (iOS 27 style): large title, white grouped cards, tinted SF icon tiles. */
export default function FavoritesScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const { selectedVehicle } = useVehicles();
    const { isFavorite, toggleFavorite } = useFavorites();
    const { stations: allStations } = useIndiaChargingStations();
    const { savedTrips, removeTrip } = useSavedTrips();
    const [tab, setTab] = useState<'stations' | 'trips'>('stations');

    const stationsList = useMemo(() => {
        const pool = allStations && allStations.length > 0 ? allStations : MOCK_STATIONS;
        return pool.filter((s) => isFavorite(s.id)).sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }, [allStations, isFavorite]);

    const tint = isDark ? '#4E9EDB' : '#6DB8F2';
    const light = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const empty = (icon: React.ReactNode, title: string, body: string) => (
        <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>{icon}</View>
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>{title}</ThemedText>
            <ThemedText style={[styles.emptyBody, { color: colors.textMuted }]}>{body}</ThemedText>
        </View>
    );

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <BackButton onPress={() => navigation.navigate('Map')} />
                <ThemedText style={[styles.title, { color: colors.text }]}>Saved</ThemedText>
                <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>Your saved stations and trips</ThemedText>

                <View style={{ marginBottom: 16 }}>
                    <Segmented
                        options={[
                            { value: 'stations', label: `Stations · ${stationsList.length}` },
                            { value: 'trips', label: `Trips · ${savedTrips.length}` },
                        ]}
                        value={tab}
                        onChange={setTab}
                    />
                </View>

                {tab === 'trips' &&
                    (savedTrips.length === 0
                        ? empty(<RouteIcon size={34} color={colors.textMuted} />, 'No saved trips yet', 'Plan a trip and tap Save trip to keep it here.')
                        : savedTrips.map((trip: SavedTrip) => (
                              <TouchableOpacity
                                  key={trip.id}
                                  activeOpacity={0.85}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Open trip ${trip.origin?.name} to ${trip.destination?.name}`}
                                  onPress={() => {
                                      light();
                                      navigation.navigate('Explore', { openTrip: trip });
                                  }}
                                  style={[styles.card, { backgroundColor: colors.surface }]}
                              >
                                  <View style={styles.row}>
                                      <View style={[styles.tile, { backgroundColor: isDark ? '#9886DB' : '#B9A6F2' }]}>
                                          <RouteIcon size={20} color="#0B0B0F" />
                                      </View>
                                      <View style={styles.flex}>
                                          <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={2}>
                                              {trip.origin?.name} → {trip.destination?.name}
                                          </ThemedText>
                                          <ThemedText style={[styles.meta, { color: colors.textMuted }]}>{trip.routeTag ?? 'Trip'} route</ThemedText>
                                      </View>
                                      <TouchableOpacity
                                          accessibilityRole="button"
                                          accessibilityLabel="Remove saved trip"
                                          hitSlop={8}
                                          style={[styles.round, { backgroundColor: 'rgba(255,59,48,0.12)' }]}
                                          onPress={() =>
                                              Alert.alert('Remove saved trip?', `${trip.origin?.name} → ${trip.destination?.name}`, [
                                                  { text: 'Cancel', style: 'cancel' },
                                                  { text: 'Remove', style: 'destructive', onPress: () => removeTrip(trip.id) },
                                              ])
                                          }
                                      >
                                          <Trash2 size={16} color={colors.error} />
                                      </TouchableOpacity>
                                  </View>
                                  <View style={styles.pills}>
                                      <View style={[styles.pill, { backgroundColor: colors.background }]}>
                                          <MapPin size={12} color={colors.textMuted} />
                                          <ThemedText style={[styles.pillText, { color: colors.text }]}>{trip.distanceKm ?? '—'} km</ThemedText>
                                      </View>
                                      <View style={[styles.pill, { backgroundColor: colors.background }]}>
                                          <Clock3 size={12} color={colors.textMuted} />
                                          <ThemedText style={[styles.pillText, { color: colors.text }]}>{fmtDur(trip.durationMins)}</ThemedText>
                                      </View>
                                  </View>
                              </TouchableOpacity>
                          )))}

                {tab === 'stations' &&
                    (stationsList.length === 0
                        ? empty(<Heart size={34} color={colors.textMuted} />, 'No favorites yet', 'Tap the heart on any charging station to save it here.')
                        : stationsList.map((station) => {
                              const connector = getRecommendedConnector(station, selectedVehicle?.connectorType);
                              const isFav = isFavorite(station.id);
                              return (
                                  <TouchableOpacity
                                      key={station.id}
                                      activeOpacity={0.85}
                                      onPress={() => {
                                          light();
                                          navigation.navigate('StationDetails', { stationId: station.id });
                                      }}
                                      style={[styles.card, { backgroundColor: colors.surface }]}
                                  >
                                      <View style={styles.row}>
                                          <View style={[styles.tile, { backgroundColor: tint }]}>
                                              <Zap size={20} color="#0B0B0F" fill="#0B0B0F" />
                                          </View>
                                          <View style={styles.flex}>
                                              <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={1}>{station.name}</ThemedText>
                                              <ThemedText style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
                                                  {station.distanceKm} km away{station.etaMinutes ? ` · ${station.etaMinutes} min` : ''}
                                              </ThemedText>
                                          </View>
                                          <TouchableOpacity
                                              accessibilityRole="button"
                                              accessibilityLabel={isFav ? 'Remove from favorites' : 'Add to favorites'}
                                              hitSlop={8}
                                              style={[styles.round, { backgroundColor: 'rgba(255,59,48,0.12)' }]}
                                              onPress={() => {
                                                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                  toggleFavorite(station.id);
                                              }}
                                          >
                                              <Heart size={16} color={colors.error} fill={isFav ? colors.error : 'none'} />
                                          </TouchableOpacity>
                                      </View>
                                      <View style={styles.pills}>
                                          <View style={[styles.pill, { backgroundColor: colors.background }]}>
                                              <ThemedText style={[styles.pillText, { color: colors.text }]}>
                                                  {connector.type} · {connector.power} kW
                                              </ThemedText>
                                          </View>
                                          <ThemedText style={[styles.price, { color: colors.primary }]}>₹{connector.pricePerKWh.toFixed(0)}/kWh</ThemedText>
                                      </View>
                                  </TouchableOpacity>
                              );
                          }))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 140 },
    title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
    subtitle: { fontSize: 16, fontWeight: '500', marginTop: 2.0, marginBottom: 16 },
    card: { borderRadius: 28, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    flex: { flex: 1 },
    tile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    name: { fontSize: 17, fontWeight: '700' },
    meta: { fontSize: 14, fontWeight: '500', marginTop: 2.0 },
    round: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    pills: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: 30, borderRadius: 15 },
    pillText: { fontSize: 13, fontWeight: '600' },
    price: { marginLeft: 'auto', fontSize: 15, fontWeight: '700' },
    empty: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 28 },
    emptyIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    emptyBody: { fontSize: 15, textAlign: 'center', lineHeight: 21 },
});
