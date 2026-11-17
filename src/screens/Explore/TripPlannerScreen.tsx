import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ArrowLeftRight, Navigation, Plus, Minus, X, Ticket } from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles, Vehicle } from '../../context/VehicleContext';
import { useSavedTrips, SavedTrip } from '../../context/SavedTripsContext';
import { POPULAR_ROUTES, TRIP_LOCATIONS } from '../../constants/TripPlanner';
import { FONT_FAMILIES } from '../../constants/Tokens';
import { CardField, CardSkin, Chip, FanStack, IconBtn, SkinCard, SKINS, StackHeader, stackStyles } from '../../components/stack/StackKit';
import { PulseButton } from '../../components/pulse/PulseKit';

const SAVED_SKINS: CardSkin[] = ['violet', 'ink', 'violet', 'ink', 'violet', 'ink'];

function tap(s: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
    if (Platform.OS !== 'web') Haptics.impactAsync(s).catch(() => {});
}

function fmtDur(mins?: number) {
    if (!mins) return '—';
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return h > 0 ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
}

function code3(label: string) {
    return label.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
}

function Stepper({ label, value, unit, onChange, step, min, max }: { label: string; value: number; unit: string; onChange: (v: number) => void; step: number; min: number; max: number }) {
    return (
        <View style={styles.stepper}>
            <ThemedText style={styles.stepLabel}>{label}</ThemedText>
            <View style={styles.stepRow}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} onPress={() => { tap(); onChange(Math.max(min, value - step)); }} style={styles.stepBtn}>
                    <Minus size={14} color="#FFFFFF" />
                </Pressable>
                <ThemedText style={styles.stepVal}>{value}{unit}</ThemedText>
                <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} onPress={() => { tap(); onChange(Math.min(max, value + step)); }} style={styles.stepBtn}>
                    <Plus size={14} color="#FFFFFF" />
                </Pressable>
            </View>
        </View>
    );
}

/**
 * Trips tab: the planner form (from, to, battery, car).
 * "Plan my trip" opens the trip page with the map and the full plan.
 */
export default function TripPlannerScreen({ navigation, route: navRoute }: any) {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { vehicles, selectedVehicle } = useVehicles();
    const { savedTrips } = useSavedTrips();

    const fallback: Vehicle = selectedVehicle ?? vehicles[0] ?? {
        id: 'fallback-v1', nickname: 'Primary EV', make: 'Hyundai', model: 'IONIQ 5', year: '2024',
        registrationNumber: 'TN 38 EV 0001', connectorType: 'CCS2', batteryCapacity: 72.6, maxDcRateKw: 220,
        currentBattery: 65, estRangeKm: 350, chargeTarget: 85, autochargeEnabled: true, perks: [],
    };

    const [originId, setOriginId] = useState('coimbatore');
    const [destinationId, setDestinationId] = useState('bengaluru');
    const [picker, setPicker] = useState<'origin' | 'destination' | null>(null);
    const [query, setQuery] = useState('');
    const [vehId, setVehId] = useState(fallback.id);
    const [rangeKm, setRangeKm] = useState(fallback.estRangeKm || 350);
    const [leaveSoc, setLeaveSoc] = useState(fallback.currentBattery || 65);
    const [arriveSoc, setArriveSoc] = useState(20);
    const [showSaved, setShowSaved] = useState(false);

    const origin = TRIP_LOCATIONS.find((l) => l.id === originId) ?? TRIP_LOCATIONS[0];
    const destination = TRIP_LOCATIONS.find((l) => l.id === destinationId) ?? TRIP_LOCATIONS[1];

    const openPlan = (o = originId, d = destinationId) => {
        tap(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate('TripPlan', { originId: o, destinationId: d, vehId, rangeKm, leaveSoc, arriveSoc });
    };

    // Opened from the Saved screen with a trip: go straight to its plan
    useEffect(() => {
        const t = navRoute?.params?.openTrip as SavedTrip | undefined;
        if (!t) return;
        const known = (id?: string) => !!id && TRIP_LOCATIONS.some((l) => l.id === id);
        if (known(t.origin?.id) && known(t.destination?.id)) {
            setOriginId(t.origin.id as string);
            setDestinationId(t.destination.id as string);
            navigation.navigate('TripPlan', { originId: t.origin.id, destinationId: t.destination.id, vehId, rangeKm, leaveSoc, arriveSoc });
        }
        navigation.setParams({ openTrip: undefined });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navRoute?.params?.openTrip]);

    const filteredLocations = TRIP_LOCATIONS.filter((l) => `${l.label} ${l.subtitle}`.toLowerCase().includes(query.trim().toLowerCase()));

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 6, paddingHorizontal: 16, paddingBottom: insets.bottom + 130 }} showsVerticalScrollIndicator={false}>
                <StackHeader
                    eyebrow="Road trip"
                    title="Plan a trip"
                    right={
                        <IconBtn label={`Saved trips, ${savedTrips.length}`} onPress={() => setShowSaved(true)}>
                            <Ticket size={18} color={colors.text} />
                        </IconBtn>
                    }
                />

                {/* Boarding pass planner */}
                <SkinCard skin="ink" style={{ flex: 0 }}>
                    <View style={{ padding: 18 }}>
                        <View style={styles.passRow}>
                            <Pressable accessibilityRole="button" accessibilityLabel={`From ${origin.label}`} onPress={() => setPicker('origin')} style={{ flex: 1 }}>
                                <ThemedText style={styles.passLbl}>FROM</ThemedText>
                                <ThemedText style={styles.passCode}>{code3(origin.label)}</ThemedText>
                                <ThemedText style={styles.passCity} numberOfLines={1}>{origin.label}</ThemedText>
                            </Pressable>
                            <Pressable accessibilityRole="button" accessibilityLabel="Swap from and to" onPress={() => { tap(); setOriginId(destinationId); setDestinationId(originId); }} style={styles.swap}>
                                <ArrowLeftRight size={22} color="#0B0B0F" strokeWidth={2.8} />
                            </Pressable>
                            <Pressable accessibilityRole="button" accessibilityLabel={`To ${destination.label}`} onPress={() => setPicker('destination')} style={{ flex: 1, alignItems: 'flex-end' }}>
                                <ThemedText style={styles.passLbl}>TO</ThemedText>
                                <ThemedText style={styles.passCode}>{code3(destination.label)}</ThemedText>
                                <ThemedText style={styles.passCity} numberOfLines={1}>{destination.label}</ThemedText>
                            </Pressable>
                        </View>
                        <View style={styles.perforation}>
                            {Array.from({ length: 22 }).map((_, i) => <View key={i} style={styles.perfDot} />)}
                        </View>
                        <View style={styles.steppers}>
                            <Stepper label="Leave with" value={leaveSoc} unit="%" step={5} min={10} max={100} onChange={setLeaveSoc} />
                            <Stepper label="Arrive with" value={arriveSoc} unit="%" step={5} min={5} max={60} onChange={setArriveSoc} />
                        </View>
                        <View style={[styles.steppers, { marginTop: 10 }]}>
                            <Stepper label="Full range" value={rangeKm} unit=" km" step={10} min={100} max={700} onChange={setRangeKm} />
                        </View>
                        {vehicles.length > 1 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 12 }}>
                                {vehicles.map((v) => {
                                    const active = v.id === vehId;
                                    return (
                                        <Pressable
                                            key={v.id}
                                            accessibilityRole="radio"
                                            accessibilityState={{ checked: active }}
                                            onPress={() => { tap(); setVehId(v.id); setRangeKm(v.estRangeKm || 350); setLeaveSoc(v.currentBattery || 65); }}
                                            style={[styles.carChip, active && { backgroundColor: '#A996FF', borderColor: '#A996FF' }]}
                                        >
                                            <ThemedText style={[styles.carChipText, { color: active ? '#0B0B0F' : '#FFFFFF' }]}>{v.make} {v.model.split(' ')[0]}</ThemedText>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        ) : null}
                    </View>
                </SkinCard>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
                    {POPULAR_ROUTES.map((r) => (
                        <Chip key={r.id} label={r.label} active={r.originId === originId && r.destinationId === destinationId} onPress={() => { setOriginId(r.originId); setDestinationId(r.destinationId); }} />
                    ))}
                </ScrollView>

                <PulseButton title="Plan my trip" icon={<Navigation size={17} color="#0B0B0F" />} onPress={() => openPlan()} />
            </ScrollView>

            {/* City picker */}
            <Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
                <View style={styles.overlay}>
                    <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.sheetHead}>
                            <ThemedText style={[styles.sheetTitle, { color: colors.text }]}>{picker === 'origin' ? 'Starting from' : 'Going to'}</ThemedText>
                            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setPicker(null)} hitSlop={10}>
                                <X size={20} color={colors.text} />
                            </Pressable>
                        </View>
                        <TextInput value={query} onChangeText={setQuery} placeholder="Search city" placeholderTextColor={colors.textSoft} style={[styles.searchBox, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} />
                        <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
                            {filteredLocations.map((l) => (
                                <Pressable
                                    key={l.id}
                                    accessibilityRole="button"
                                    onPress={() => {
                                        if (picker === 'origin') setOriginId(l.id);
                                        else setDestinationId(l.id);
                                        setPicker(null);
                                        setQuery('');
                                    }}
                                    style={[styles.cityRow, { borderColor: colors.border }]}
                                >
                                    <ThemedText style={[styles.cityCode, { color: colors.primary }]}>{code3(l.label)}</ThemedText>
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={[styles.cityName, { color: colors.text }]}>{l.label}</ThemedText>
                                        <ThemedText style={[styles.citySub, { color: colors.textMuted }]} numberOfLines={1}>{l.subtitle}</ThemedText>
                                    </View>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Saved trips: a wallet of boarding passes */}
            <Modal visible={showSaved} transparent animationType="slide" onRequestClose={() => setShowSaved(false)}>
                <View style={styles.overlay}>
                    <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16, maxHeight: '85%' }]}>
                        <View style={styles.sheetHead}>
                            <ThemedText style={[styles.sheetTitle, { color: colors.text }]}>Saved trips · {savedTrips.length}</ThemedText>
                            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setShowSaved(false)} hitSlop={10}>
                                <X size={20} color={colors.text} />
                            </Pressable>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <FanStack
                                items={savedTrips}
                                keyExtractor={(t: SavedTrip) => String(t.id)}
                                cardHeight={170}
                                peekHeight={62}
                                renderCard={(t: SavedTrip) => {
                                    const idx = savedTrips.indexOf(t);
                                    const skin = SAVED_SKINS[idx % SAVED_SKINS.length];
                                    const s = SKINS[skin];
                                    return (
                                        <SkinCard skin={skin}>
                                            <View style={stackStyles.cardPad}>
                                                <View style={stackStyles.cardTopRow}>
                                                    <ThemedText style={[styles.savedRoute, { color: s.fg }]} numberOfLines={1}>
                                                        {code3(t.origin?.name ?? '')} → {code3(t.destination?.name ?? '')}
                                                    </ThemedText>
                                                    <ThemedText style={[styles.savedTag, { color: s.sub }]}>{t.routeTag ?? 'Trip'}</ThemedText>
                                                </View>
                                                <ThemedText style={[stackStyles.cardSub, { color: s.sub }]} numberOfLines={1}>
                                                    {t.origin?.name} to {t.destination?.name}
                                                </ThemedText>
                                                <View style={stackStyles.cardBottomRow}>
                                                    <CardField label="Distance" value={`${t.distanceKm ?? '—'} km`} fg={s.fg} sub={s.sub} />
                                                    <CardField label="Drive" value={fmtDur(t.durationMins)} fg={s.fg} sub={s.sub} align="right" />
                                                </View>
                                            </View>
                                        </SkinCard>
                                    );
                                }}
                                renderDetail={(t: SavedTrip) => (
                                    <PulseButton
                                        title="Open this trip"
                                        size="md"
                                        onPress={() => {
                                            setShowSaved(false);
                                            if (t.origin?.id && t.destination?.id) openPlan(t.origin.id, t.destination.id);
                                        }}
                                    />
                                )}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    passRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    passLbl: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 10, letterSpacing: 1.4, color: 'rgba(255,255,255,0.55)' },
    passCode: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 40, lineHeight: 46, letterSpacing: -1, color: '#FFFFFF' },
    passCity: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    swap: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#A996FF', borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    perforation: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16 },
    perfDot: { width: 6, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    steppers: { flexDirection: 'row', gap: 10 },
    stepper: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 10 },
    stepLabel: { fontFamily: FONT_FAMILIES.bold, fontSize: 11, color: 'rgba(255,255,255,0.6)' },
    stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    stepBtn: { width: 32, height: 32, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    stepVal: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 17, color: '#FFFFFF' },
    carChip: { height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center' },
    carChipText: { fontFamily: FONT_FAMILIES.bold, fontSize: 12.5 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 18 },
    sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sheetTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 22, letterSpacing: -0.5 },
    searchBox: { height: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontFamily: FONT_FAMILIES.semiBold, fontSize: 15, marginBottom: 8 },
    cityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
    cityCode: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 16, width: 44 },
    cityName: { fontFamily: FONT_FAMILIES.bold, fontSize: 15 },
    citySub: { fontFamily: FONT_FAMILIES.medium, fontSize: 12 },
    savedRoute: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 22, letterSpacing: -0.4 },
    savedTag: { fontFamily: FONT_FAMILIES.bold, fontSize: 12 },
});
