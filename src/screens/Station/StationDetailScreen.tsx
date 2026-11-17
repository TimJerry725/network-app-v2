import React, { Fragment, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Image,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Heart, Share2, Navigation, LifeBuoy, Star, Bell, BellRing, Wallet, Zap, Check, Clock3, Lock, Coffee } from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';
import { useFavorites } from '../../context/FavoritesContext';
import { Connector, MOCK_STATIONS, Station, getStationById, isConnectorCompatible } from '../../constants/Stations';
import { FONT_FAMILIES } from '../../constants/Tokens';
import { stationService } from '../../services/api/stationService';
import { ConnectorIcon } from '../../components/stack/StationCard';
import { PulseButton } from '../../components/pulse/PulseKit';
import { Divider, HeaderIcon, KeyValue, Option, Panel, Row, ScreenTitle, Section, StatusText, flat } from '../../components/flat/FlatKit';
import { allInPrice, formatAgo, formatRupees, isStatusFresh, statusAgeSeconds } from '../../utils/pulse';

const TARGETS = [80, 85, 90, 100];
const NOTIFY_SECONDS = 59 * 60 + 30;
const FALLBACK_GALLERY = [
    'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1558441719-7d885a5a7b63?auto=format&fit=crop&q=80&w=600',
];

function tap() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export default function StationDetailScreen({ route, navigation }: any) {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
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
    const firstGood = station.connectors.find((c) => c.status === 'Available' && isConnectorCompatible(c.type, vehicleType)) ?? station.connectors[0];
    const [selectedId, setSelectedId] = useState<string | null>(firstGood?.id ?? null);
    const [target, setTarget] = useState(selectedVehicle?.chargeTarget && TARGETS.includes(selectedVehicle.chargeTarget) ? selectedVehicle.chargeTarget : 80);
    const [tracked, setTracked] = useState<Record<string, number>>({});

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

    const groups = useMemo(() => {
        const map: Record<string, Connector[]> = {};
        station.connectors.forEach((c, i) => {
            const key = c.chargerId || c.id.split('-')[0] || `CP${i + 1}`;
            (map[key] ??= []).push(c);
        });
        return Object.entries(map).map(([chargerId, connectors]) => ({ chargerId, connectors }));
    }, [station.connectors]);

    const selected = station.connectors.find((c) => c.id === selectedId) ?? null;
    const selectedOk = !!selected && selected.status === 'Available' && isConnectorCompatible(selected.type, vehicleType);
    const fav = isFavorite(station.id);
    const minPrice = Math.min(...station.connectors.map((c) => c.pricePerKWh));
    const age = statusAgeSeconds(station.id);
    const gallery = station.galleryImages?.length ? station.galleryImages : FALLBACK_GALLERY;
    const estKwh = selectedVehicle ? Math.max(0, ((target - selectedVehicle.currentBattery) / 100) * selectedVehicle.batteryCapacity) : 0;
    const estCost = selected ? estKwh * allInPrice(selected.pricePerKWh) : 0;
    const lowBalance = estCost > 0 && user.walletBalance < estCost;

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
    const go = () => navigation.navigate('ChargingSession', { stationId: station.id, stationSnapshot: station, connectorId: selected!.id, targetSoc: target });
    const start = () => {
        if (!selected) return;
        if (!selectedOk) {
            Alert.alert(
                selected.status !== 'Available' ? 'This connector is busy' : 'Not compatible',
                selected.status !== 'Available' ? 'Pick a free connector, or tap “Notify me”.' : `Your car uses ${vehicleType}. Choose a matching connector.`
            );
            return;
        }
        if (lowBalance) {
            Alert.alert('Top up first?', `This charge is about ${formatRupees(estCost)} and your wallet has ${formatRupees(user.walletBalance)}.`, [
                { text: 'Add money', onPress: () => navigation.navigate('Wallet', { focusTopUp: true }) },
                { text: 'Start anyway', onPress: go },
                { text: 'Cancel', style: 'cancel' },
            ]);
            return;
        }
        go();
    };

    return (
        <View style={[flat.screen, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 6, paddingHorizontal: 16, paddingBottom: insets.bottom + 130 }} showsVerticalScrollIndicator={false}>
                <ScreenTitle
                    title={station.name}
                    subtitle={station.address}
                    onBack={() => navigation.goBack()}
                    right={
                        <>
                            <HeaderIcon label="Share station" onPress={share}>
                                <Share2 size={18} color={colors.text} />
                            </HeaderIcon>
                            <HeaderIcon label={fav ? 'Remove from saved' : 'Save station'} active={fav} onPress={() => toggleFavorite(station.id)}>
                                <Heart size={18} color={fav ? '#0B0B0F' : colors.text} fill={fav ? '#0B0B0F' : 'none'} />
                            </HeaderIcon>
                        </>
                    }
                />

                <View style={styles.meta}>
                    <View style={styles.metaItem}>
                        <Star size={13} color={colors.sun} fill={colors.sun} />
                        <ThemedText style={[styles.metaText, { color: colors.text }]}>{station.rating.toFixed(1)}</ThemedText>
                    </View>
                    <ThemedText style={[styles.metaText, { color: colors.textMuted }]}>· {station.distanceKm} km</ThemedText>
                    <ThemedText style={[styles.metaText, { color: colors.textMuted }]}>· from ₹{allInPrice(minPrice).toFixed(0)}/kWh</ThemedText>
                </View>
                <View style={{ marginTop: 8 }}>
                    <StatusText tone={isStatusFresh(age) ? 'ok' : 'wait'} label={`${isStatusFresh(age) ? 'Live status' : 'Status may be stale'} · updated ${formatAgo(age)}`} />
                </View>

                <View style={[flat.rowGap, { marginTop: 14 }]}>
                    <PulseButton title="Directions" variant="ink" size="md" icon={<Navigation size={16} color={colors.background} />} onPress={directions} style={{ flex: 1 }} />
                    <PulseButton title="Help" variant="ghost" size="md" icon={<LifeBuoy size={16} color={colors.text} />} onPress={help} style={{ flex: 1 }} />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 16 }}>
                    {gallery.map((uri, i) => (
                        <Image key={i} source={{ uri }} style={styles.photo} accessibilityLabel={`${station.name} photo ${i + 1}`} />
                    ))}
                </ScrollView>

                <Section title="Connectors">
                    <Panel padded={false}>
                        {groups.map((g, gi) => {
                            const anyFree = g.connectors.some((c) => c.status === 'Available');
                            const secs = tracked[g.chargerId];
                            return (
                                <Fragment key={g.chargerId}>
                                    {gi > 0 ? <Divider /> : null}
                                    <View style={styles.groupHead}>
                                        <ThemedText style={[styles.groupId, { color: colors.textMuted }]}>Charger {g.chargerId}</ThemedText>
                                        {!anyFree ? (
                                            <Pressable
                                                accessibilityRole="button"
                                                onPress={() => {
                                                    tap();
                                                    setTracked((p) => {
                                                        const c = { ...p };
                                                        if (c[g.chargerId]) delete c[g.chargerId];
                                                        else c[g.chargerId] = NOTIFY_SECONDS;
                                                        return c;
                                                    });
                                                }}
                                                hitSlop={8}
                                                style={styles.notify}
                                            >
                                                {secs ? <BellRing size={14} color={colors.primary} /> : <Bell size={14} color={colors.primary} />}
                                                <ThemedText style={[styles.notifyText, { color: colors.primary }]}>
                                                    {secs ? `Watching · ${Math.floor(secs / 60)}m` : 'Notify me when free'}
                                                </ThemedText>
                                            </Pressable>
                                        ) : null}
                                    </View>
                                    {g.connectors.map((c) => {
                                        const isSel = c.id === selectedId;
                                        const ok = isConnectorCompatible(c.type, vehicleType);
                                        const free = c.status === 'Available';
                                        return (
                                            <Pressable
                                                key={c.id}
                                                accessibilityRole="radio"
                                                accessibilityState={{ checked: isSel }}
                                                accessibilityLabel={`${c.type} ${c.power} kilowatt, ${c.status}`}
                                                onPress={() => {
                                                    tap();
                                                    setSelectedId(c.id);
                                                }}
                                                style={[styles.conn, isSel && { backgroundColor: colors.surfaceMuted }]}
                                            >
                                                <View style={[styles.radio, { borderColor: isSel ? colors.lime : colors.border, backgroundColor: isSel ? colors.lime : 'transparent' }]}>
                                                    {isSel ? <Check size={12} color="#0B0B0F" strokeWidth={3} /> : null}
                                                </View>
                                                <ConnectorIcon type={c.type} size={20} color={colors.text} />
                                                <View style={{ flex: 1 }}>
                                                    <ThemedText style={[styles.connTitle, { color: colors.text }]}>
                                                        {c.gunLabel ? `${c.gunLabel} · ` : ''}
                                                        {c.type} · {c.currentType ?? (c.power >= 50 ? 'DC' : 'AC')} · {c.power} kW
                                                    </ThemedText>
                                                    <ThemedText style={[styles.connSub, { color: colors.textMuted }]}>
                                                        ₹{allInPrice(c.pricePerKWh).toFixed(0)}/kWh incl. GST{!ok ? ' · not for your car' : ''}
                                                    </ThemedText>
                                                </View>
                                                <StatusText
                                                    tone={free ? 'ok' : c.status === 'Preparing' ? 'wait' : 'muted'}
                                                    label={free ? 'Free' : c.status === 'Busy' && c.waitMinutes ? `Busy · ${c.waitMinutes}m` : c.status}
                                                />
                                            </Pressable>
                                        );
                                    })}
                                </Fragment>
                            );
                        })}
                    </Panel>
                </Section>

                <Section title="Charge to">
                    <View style={flat.rowGap}>
                        {TARGETS.map((t) => (
                            <Option key={t} label={`${t}%`} selected={t === target} onPress={() => setTarget(t)} style={{ flex: 1 }} />
                        ))}
                    </View>
                    {selected && selectedVehicle ? (
                        <ThemedText style={[flat.caption, { color: colors.textMuted, marginTop: 8 }]}>
                            {selectedVehicle.currentBattery}% → {target}% ≈ {estKwh.toFixed(1)} kWh ≈ {formatRupees(estCost)} incl. GST
                        </ThemedText>
                    ) : null}
                </Section>

                <Section title="What you pay">
                    <Panel>
                        <KeyValue label="Energy" value={`₹${(selected?.pricePerKWh ?? minPrice).toFixed(2)} / kWh`} />
                        <KeyValue label="GST (CGST 9% + SGST 9%)" value="+18%" />
                        <KeyValue label="Idle fee grace" value="15 min free" />
                        <KeyValue label="Idle fee after that" value="₹5 / min" valueColor={colors.error} />
                        <KeyValue label="You pay" value={`₹${allInPrice(selected?.pricePerKWh ?? minPrice).toFixed(2)} / kWh`} strong />
                    </Panel>
                </Section>

                <Section title="About this station">
                    <Panel padded={false}>
                        <Row icon={<Clock3 size={16} color={colors.text} />} title={station.openTime === '24/7' ? 'Open 24/7' : `${station.openTime} – ${station.closeTime}`} subtitle="Hours" />
                        <Divider inset={60} />
                        <Row icon={<Lock size={16} color={colors.text} />} title={station.accessType ?? 'Public'} subtitle="Access" />
                        {station.amenities?.length ? (
                            <>
                                <Divider inset={60} />
                                <Row icon={<Coffee size={16} color={colors.text} />} title={station.amenities.join(', ')} subtitle="Amenities" />
                            </>
                        ) : null}
                    </Panel>
                    {station.tagline ? <ThemedText style={[flat.caption, { color: colors.textMuted, marginTop: 10 }]}>{station.tagline}</ThemedText> : null}
                </Section>
            </ScrollView>

            <View style={[flat.bottomBar, styles.bar, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open wallet"
                    onPress={() => navigation.navigate('Wallet', { focusTopUp: true })}
                    style={[styles.wallet, { borderColor: lowBalance ? colors.sun : colors.border }]}
                >
                    <Wallet size={15} color={lowBalance ? colors.sun : colors.text} />
                    <View>
                        <ThemedText style={[styles.walletVal, { color: colors.text }]}>{formatRupees(user.walletBalance)}</ThemedText>
                        <ThemedText style={[styles.walletLbl, { color: lowBalance ? colors.sun : colors.textMuted }]}>{lowBalance ? 'Top up' : 'Wallet'}</ThemedText>
                    </View>
                </Pressable>
                <PulseButton
                    title={selectedOk ? `Start · ${selected?.type} ${selected?.power}kW` : 'Pick a free connector'}
                    icon={<Zap size={17} color="#0B0B0F" fill="#0B0B0F" />}
                    onPress={start}
                    disabled={!selected}
                    style={{ flex: 1 }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13.5 },
    photo: { width: 200, height: 120, borderRadius: 16, backgroundColor: '#1F1F28' },
    groupHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
    groupId: { fontFamily: FONT_FAMILIES.bold, fontSize: 12.5 },
    notify: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 28 },
    notifyText: { fontFamily: FONT_FAMILIES.bold, fontSize: 12.5 },
    conn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 60 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    connTitle: { fontFamily: FONT_FAMILIES.bold, fontSize: 14 },
    connSub: { fontFamily: FONT_FAMILIES.medium, fontSize: 12, marginTop: 1 },
    bar: { flexDirection: 'row', gap: 10 },
    wallet: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1.5, height: 58 },
    walletVal: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 14 },
    walletLbl: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 11 },
});
