import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Image as RNImage,
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    View,
    useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft,
    Share2,
    Heart,
    Clock,
    Navigation,
    Wifi,
    ShoppingBag,
    User,
    Coffee,
    Image as PhotoIcon,
    Plug,
    CircleCheck,
    Zap,
    Headphones,
    Bell,
    BellRing,
    X,
} from '../../components/sf/icons';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';
import { useFavorites } from '../../context/FavoritesContext';
import { Connector, MOCK_STATIONS, Station, getStationById, isConnectorCompatible } from '../../constants/Stations';
import { stationService } from '../../services/api/stationService';
import { Glass, GlassButton } from '../../components/glass/Glass';
import { allInPrice, formatAgo, formatRupees, isStatusFresh, statusAgeSeconds } from '../../utils/pulse';

const NOTIFY_SECONDS = 59 * 60 + 30;
const FALLBACK_GALLERY = [
    'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1558441719-7d885a5a7b63?auto=format&fit=crop&q=80&w=800',
];

function tap() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function amenityIcon(name: string, color: string) {
    const n = name.toLowerCase();
    if (n.includes('wifi')) return <Wifi size={26} color={color} />;
    if (n.includes('rest') || n.includes('wash')) return <User size={26} color={color} />;
    if (n.includes('mall') || n.includes('store') || n.includes('shop')) return <ShoppingBag size={26} color={color} />;
    return <Coffee size={26} color={color} />;
}

/** Station details (iOS 27 design). */
export default function StationDetailScreen({ route, navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { user, selectedVehicle } = useVehicles();
    const { isFavorite, toggleFavorite } = useFavorites();

    const [liveStation, setLiveStation] = useState<Station | null>(null);
    const routeStation: Station | undefined = route.params?.stationSnapshot ?? route.params?.station;
    const station: Station = liveStation ?? routeStation ?? getStationById(route.params?.stationId) ?? MOCK_STATIONS[0];

    useEffect(() => {
        const id = route.params?.stationId ?? station.id;
        if (!id) return;
        stationService.getPublicStationDetails(id).then((d) => d && setLiveStation(d)).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.params?.stationId]);

    const vehicleType = selectedVehicle?.connectorType;
    const target = selectedVehicle?.chargeTarget ?? 80;
    const [tracked, setTracked] = useState<Record<string, number>>({});
    const [photoIdx, setPhotoIdx] = useState(0);
    const [tariffOpen, setTariffOpen] = useState(false);

    useEffect(() => {
        const t = setInterval(() => {
            setTracked((prev) => {
                const next: Record<string, number> = {};
                let changed = false;
                Object.entries(prev).forEach(([k, v]) => {
                    if (v > 0) {
                        next[k] = v - 1;
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(t);
    }, []);

    const fav = isFavorite(station.id);
    const age = statusAgeSeconds(station.id);
    const gallery = station.galleryImages?.length ? station.galleryImages : FALLBACK_GALLERY;
    const minPrice = Math.min(...station.connectors.map((c) => c.pricePerKWh));
    const chargers = useMemo(() => [...station.connectors], [station.connectors]);

    const share = async () => {
        try {
            await Share.share({ title: station.name, message: `${station.name} — ${station.address}` });
        } catch {
            // cancelled
        }
    };
    const directions = () =>
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`).catch(() =>
            Alert.alert('Directions', `Navigating to ${station.name}`)
        );
    const help = () =>
        Alert.alert('Help at this station', 'Charger fault, blocked bay or payment issue? We are here 24/7.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call 1800-419-4747', onPress: () => Linking.openURL('tel:18004194747').catch(() => {}) },
        ]);

    const go = (c: Connector) =>
        navigation.navigate('ChargingSession', { stationId: station.id, stationSnapshot: station, connectorId: c.id, targetSoc: target });

    const start = (c: Connector) => {
        const est = selectedVehicle
            ? Math.max(0, ((target - selectedVehicle.currentBattery) / 100) * selectedVehicle.batteryCapacity) * allInPrice(c.pricePerKWh)
            : 0;
        if (est > 0 && user.walletBalance < est) {
            Alert.alert('Top up first?', `This charge is about ${formatRupees(est)} and your wallet has ${formatRupees(user.walletBalance)}.`, [
                { text: 'Add money', onPress: () => navigation.navigate('Wallet', { focusTopUp: true }) },
                { text: 'Start anyway', onPress: () => go(c) },
                { text: 'Cancel', style: 'cancel' },
            ]);
            return;
        }
        go(c);
    };

    const chipBg = isDark ? 'rgba(255,255,255,0.10)' : '#FFFFFF';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 130 }} showsVerticalScrollIndicator={false}>
                {/* Glass header buttons */}
                <View style={[styles.topRow, styles.pad]}>
                    <GlassButton label="Back" size={48} onPress={() => navigation.goBack()}>
                        <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
                    </GlassButton>
                    <View style={styles.topRight}>
                        <GlassButton label="Share station" size={48} onPress={share}>
                            <Share2 size={21} color={colors.text} />
                        </GlassButton>
                        <GlassButton
                            label={fav ? 'Remove from favorites' : 'Add to favorites'}
                            size={48}
                            tint={fav ? 'rgba(255,59,48,0.35)' : undefined}
                            onPress={() => {
                                tap();
                                toggleFavorite(station.id);
                            }}
                        >
                            <Heart size={21} color={fav ? colors.error : colors.text} fill={fav ? colors.error : 'none'} />
                        </GlassButton>
                    </View>
                </View>

                <View style={styles.pad}>
                    <ThemedText style={[styles.title, { color: colors.text }]}>{station.name}</ThemedText>
                    <ThemedText style={[styles.address, { color: colors.textMuted }]}>{station.address}</ThemedText>

                    <View style={styles.statusRow}>
                        <View style={[styles.chip, { backgroundColor: 'rgba(52,199,89,0.16)' }]}>
                            <View style={[styles.dot, { backgroundColor: colors.success }]} />
                            <ThemedText style={[styles.chipText, { color: colors.success }]}>{isStatusFresh(age) ? 'Open' : 'Check status'}</ThemedText>
                        </View>
                        <View style={[styles.chip, { backgroundColor: chipBg }]}>
                            <Clock size={16} color={colors.textMuted} />
                            <ThemedText style={[styles.chipText, { color: colors.text }]}>{station.openTime === '24/7' ? '24 hrs' : `${station.openTime} – ${station.closeTime}`}</ThemedText>
                        </View>
                        <View style={[styles.chip, { backgroundColor: chipBg }]}>
                            <Navigation size={16} color={colors.primary} />
                            <ThemedText style={[styles.chipText, { color: colors.text }]}>
                                {station.distanceKm} km · ETA: {station.etaMinutes} min
                            </ThemedText>
                        </View>
                    </View>
                    <ThemedText style={[styles.fresh, { color: colors.textMuted }]}>Live status · updated {formatAgo(age)}</ThemedText>

                    {/* Amenities */}
                    {station.amenities?.length ? (
                        <View style={styles.amenRow}>
                            {station.amenities.slice(0, 4).map((a) => (
                                <View key={a} style={styles.amen}>
                                    <View style={[styles.amenTile, { backgroundColor: 'rgba(0,122,255,0.12)' }]}>{amenityIcon(a, colors.primary)}</View>
                                    <ThemedText style={[styles.amenLabel, { color: colors.textMuted }]} numberOfLines={1}>{a}</ThemedText>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    {/* Photos */}
                    <View style={[styles.photoWrap, { width: width - 32 }]}>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(e) => setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / (width - 32)))}
                        >
                            {gallery.map((uri, i) => (
                                <View key={uri + i} style={{ width: width - 32, height: 224 }}>
                                    <LinearGradient colors={isDark ? ['#1C3A5E', '#3A2A5C'] : ['#A8CCFA', '#F2C8D0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                                    <RNImage source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel={`${station.name} photo ${i + 1}`} />
                                </View>
                            ))}
                        </ScrollView>
                        <Glass radius={20} style={styles.photoBadge}>
                            <PhotoIcon size={16} color={colors.text} />
                            <ThemedText style={[styles.photoBadgeText, { color: colors.text }]}>
                                {photoIdx + 1} / {gallery.length} photos
                            </ThemedText>
                        </Glass>
                    </View>

                    <ThemedText style={[styles.section, { color: colors.textMuted }]}>Chargers</ThemedText>

                    {chargers.map((c, i) => {
                        const free = c.status === 'Available';
                        const fits = isConnectorCompatible(c.type, vehicleType);
                        const secs = tracked[c.chargerId ?? c.id];
                        const est = selectedVehicle
                            ? Math.max(0, ((target - selectedVehicle.currentBattery) / 100) * selectedVehicle.batteryCapacity) * allInPrice(c.pricePerKWh)
                            : 0;
                        const accent = free ? colors.primary : colors.error;
                        return (
                            <View key={c.id} style={[styles.chargerCard, { backgroundColor: colors.surface }]}>
                                <View style={styles.chargerTop}>
                                    <View style={[styles.plugTile, { backgroundColor: free ? 'rgba(0,122,255,0.14)' : 'rgba(255,59,48,0.14)' }]}>
                                        <Plug size={32} color={accent} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={[styles.chargerName, { color: colors.text }]} numberOfLines={1}>
                                            {c.type} · Charger {c.gunLabel?.replace(/\D/g, '') || i + 1}
                                        </ThemedText>
                                        <ThemedText style={[styles.chargerSub, { color: colors.textMuted }]}>
                                            {c.power} kW {c.currentType ?? (c.power >= 50 ? 'DC' : 'AC')}
                                            {free ? ' • 200–920 V' : c.waitMinutes ? ` • Next free in ${c.waitMinutes} min` : ''}
                                        </ThemedText>
                                    </View>
                                    {free ? (
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <ThemedText style={[styles.price, { color: colors.text }]}>₹{allInPrice(c.pricePerKWh).toFixed(1)}</ThemedText>
                                            <ThemedText style={[styles.priceUnit, { color: colors.textMuted }]}>/kWh</ThemedText>
                                        </View>
                                    ) : (
                                        <View style={[styles.chip, { backgroundColor: 'rgba(255,59,48,0.14)' }]}>
                                            <View style={[styles.dot, { backgroundColor: colors.error }]} />
                                            <ThemedText style={[styles.chipText, { color: colors.error }]}>{c.status === 'Busy' ? 'Occupied' : c.status}</ThemedText>
                                        </View>
                                    )}
                                </View>

                                {free ? (
                                    <>
                                        <View style={styles.pillRow}>
                                            <View style={[styles.chip, { backgroundColor: 'rgba(52,199,89,0.16)' }]}>
                                                <View style={[styles.dot, { backgroundColor: colors.success }]} />
                                                <ThemedText style={[styles.chipText, { color: colors.success }]}>Available</ThemedText>
                                            </View>
                                            {fits ? (
                                                <View style={[styles.chip, { backgroundColor: 'rgba(0,122,255,0.14)' }]}>
                                                    <CircleCheck size={16} color={colors.primary} />
                                                    <ThemedText style={[styles.chipText, { color: colors.primary }]}>EV match</ThemedText>
                                                </View>
                                            ) : (
                                                <View style={[styles.chip, { backgroundColor: 'rgba(255,149,0,0.16)' }]}>
                                                    <ThemedText style={[styles.chipText, { color: colors.warning }]}>Not for your car</ThemedText>
                                                </View>
                                            )}
                                        </View>
                                        {est > 0 ? (
                                            <ThemedText style={[styles.estimate, { color: colors.textMuted }]}>
                                                Est. {selectedVehicle?.currentBattery}→{target}% • ≈ {formatRupees(est)} incl. GST
                                            </ThemedText>
                                        ) : null}
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel={`Start charging on ${c.type}`}
                                            disabled={!fits}
                                            onPress={() => {
                                                tap();
                                                start(c);
                                            }}
                                            style={({ pressed }) => [styles.startBtn, { backgroundColor: fits ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.8 : 1 }]}
                                        >
                                            <Zap size={22} color={fits ? '#FFFFFF' : colors.textSoft} fill={fits ? '#FFFFFF' : 'none'} />
                                            <ThemedText style={[styles.startText, { color: fits ? '#FFFFFF' : colors.textSoft }]}>Start Charging</ThemedText>
                                        </Pressable>
                                    </>
                                ) : (
                                    <Pressable
                                        accessibilityRole="button"
                                        onPress={() => {
                                            tap();
                                            const key = c.chargerId ?? c.id;
                                            setTracked((p) => {
                                                const n = { ...p };
                                                if (n[key]) delete n[key];
                                                else n[key] = NOTIFY_SECONDS;
                                                return n;
                                            });
                                        }}
                                        style={styles.notify}
                                    >
                                        {secs ? <BellRing size={17} color={colors.primary} /> : <Bell size={17} color={colors.primary} />}
                                        <ThemedText style={[styles.notifyText, { color: colors.primary }]}>
                                            {secs ? `Watching · ${Math.floor(secs / 60)}m left` : 'Notify me when free'}
                                        </ThemedText>
                                    </Pressable>
                                )}
                            </View>
                        );
                    })}

                    <Pressable accessibilityRole="button" onPress={() => setTariffOpen(true)} style={styles.tariffLink}>
                        <ThemedText style={[styles.tariffLinkText, { color: colors.primary }]}>View full tariff and penalty schedule</ThemedText>
                    </Pressable>
                </View>
            </ScrollView>

            {/* Bottom actions */}
            <Glass radius={0} style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
                <Pressable accessibilityRole="button" onPress={help} style={({ pressed }) => [styles.bottomBtn, styles.helpBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}>
                    <Headphones size={22} color={colors.text} />
                    <ThemedText style={[styles.bottomText, { color: colors.text }]}>Help Support</ThemedText>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={directions} style={({ pressed }) => [styles.bottomBtn, { backgroundColor: isDark ? '#FFFFFF' : '#000000', opacity: pressed ? 0.8 : 1 }]}>
                    <Navigation size={22} color={isDark ? '#000000' : '#FFFFFF'} />
                    <ThemedText style={[styles.bottomText, { color: isDark ? '#000000' : '#FFFFFF' }]}>Get Direction</ThemedText>
                </Pressable>
            </Glass>

            {/* Tariff and penalty schedule */}
            <Modal visible={tariffOpen} transparent animationType="slide" onRequestClose={() => setTariffOpen(false)}>
                <View style={styles.overlay}>
                    <View style={[styles.tariffSheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.tariffHead}>
                            <ThemedText style={[styles.tariffTitle, { color: colors.text }]}>Tariff & penalty schedule</ThemedText>
                            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setTariffOpen(false)} hitSlop={10}>
                                <X size={22} color={colors.text} />
                            </Pressable>
                        </View>
                        <ThemedText style={[styles.tariffSub, { color: colors.textMuted }]}>{station.name}</ThemedText>
                        {[
                            ['Energy', `₹${minPrice.toFixed(2)} / kWh`],
                            ['GST (CGST 9% + SGST 9%)', '+18%'],
                            ['You pay', `₹${allInPrice(minPrice).toFixed(2)} / kWh`],
                            ['Idle fee grace', '15 min free'],
                            ['Idle fee after that', '₹5 / min'],
                        ].map(([k, v], i) => (
                            <View key={k} style={[styles.tariffRow, { borderTopColor: colors.border }, i === 2 && { borderTopWidth: StyleSheet.hairlineWidth }]}>
                                <ThemedText style={[styles.tariffKey, { color: i === 2 ? colors.text : colors.textMuted, fontWeight: i === 2 ? '700' : '500' }]}>{k}</ThemedText>
                                <ThemedText style={[styles.tariffVal, { color: i === 4 ? colors.error : colors.text }]}>{v}</ThemedText>
                            </View>
                        ))}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    pad: { paddingHorizontal: 16 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    topRight: { flexDirection: 'row', gap: 8 },
    title: { fontSize: 34, fontWeight: '800', letterSpacing: -1, lineHeight: 40, marginTop: 16 },
    address: { fontSize: 17, fontWeight: '500', marginTop: 8 },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 38, paddingHorizontal: 16, borderRadius: 19 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    chipText: { fontSize: 15, fontWeight: '600' },
    fresh: { fontSize: 12.5, fontWeight: '500', marginTop: 8 },
    amenRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    amen: { alignItems: 'center', width: 76 },
    amenTile: { width: 56, height: 56, borderRadius: 16, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },
    amenLabel: { fontSize: 14, fontWeight: '500', marginTop: 8 },
    photoWrap: { marginTop: 20, height: 224, borderRadius: 28, overflow: 'hidden' },
    photoBadge: { position: 'absolute', left: 14, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 16 },
    photoBadgeText: { fontSize: 15, fontWeight: '700' },
    section: { fontSize: 17, fontWeight: '600', marginTop: 24, marginBottom: 8 },
    chargerCard: { borderRadius: 28, padding: 16, marginBottom: 12 },
    chargerTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    plugTile: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    chargerName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
    chargerSub: { fontSize: 15.5, fontWeight: '500', marginTop: 4 },
    price: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    priceUnit: { fontSize: 15, fontWeight: '500' },
    pillRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
    estimate: { fontSize: 14, fontWeight: '500', marginTop: 12 },
    startBtn: { height: 62, borderRadius: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
    startText: { fontSize: 20, fontWeight: '700' },
    notify: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, minHeight: 36 },
    notifyText: { fontSize: 15.5, fontWeight: '600' },
    tariffLink: { alignItems: 'center', paddingVertical: 16 },
    tariffLinkText: { fontSize: 17, fontWeight: '700' },
    bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 16, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
    bottomBtn: { flex: 1, height: 62, borderRadius: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    helpBtn: { borderWidth: StyleSheet.hairlineWidth * 2 },
    bottomText: { fontSize: 18, fontWeight: '700' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    tariffSheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
    tariffHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tariffTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    tariffSub: { fontSize: 15, fontWeight: '500', marginTop: 4, marginBottom: 8 },
    tariffRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 },
    tariffKey: { fontSize: 16 },
    tariffVal: { fontSize: 16, fontWeight: '700' },
});
