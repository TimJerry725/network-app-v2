import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, TextInput, TextInputInstance, View, useWindowDimensions } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import * as Haptics from 'expo-haptics';
import { Car, Check, ChevronDown } from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AuthShell, authStyles } from '../../components/auth/AuthShell';
import { PulseButton } from '../../components/pulse/PulseKit';
import { useVehicles, Vehicle } from '../../context/VehicleContext';
import { EV_CATALOG } from '../../constants/EvCatalog';
import { getCarImage } from '../../constants/EvImages';
import { FONT_FAMILIES } from '../../constants/Tokens';

const MAKES = Object.keys(EV_CATALOG);
const PARTS = [
    { key: 'state', placeholder: 'TN', len: 2, letters: true },
    { key: 'district', placeholder: '38', len: 2, letters: false },
    { key: 'series', placeholder: 'BZ', len: 2, letters: true },
    { key: 'number', placeholder: '7927', len: 4, letters: false },
] as const;

function tap() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Inline dropdown: a field that opens a list right below it. */
function Dropdown({
    label,
    value,
    placeholder,
    options,
    open,
    onToggle,
    onSelect,
    disabled,
}: {
    label: string;
    value: string;
    placeholder: string;
    options: string[];
    open: boolean;
    onToggle: () => void;
    onSelect: (v: string) => void;
    disabled?: boolean;
}) {
    const { colors } = useAppTheme();
    return (
        <View style={{ zIndex: open ? 10 : 1 }}>
            <ThemedText style={[authStyles.label, { color: colors.text }]}>{label}</ThemedText>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ expanded: open, disabled: !!disabled }}
                disabled={disabled}
                onPress={onToggle}
                style={[
                    styles.select,
                    { backgroundColor: colors.surface, borderColor: open ? colors.violet : value ? colors.violet : colors.border, opacity: disabled ? 0.5 : 1 },
                ]}
            >
                <ThemedText style={[styles.selectText, { color: value ? colors.text : colors.textSoft }]} numberOfLines={1}>
                    {value || placeholder}
                </ThemedText>
                <ChevronDown size={18} color={colors.textMuted} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
            </Pressable>
            {open ? (
                <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {options.map((o, i) => {
                            const active = o === value;
                            return (
                                <Pressable
                                    key={o}
                                    accessibilityRole="menuitem"
                                    accessibilityState={{ selected: active }}
                                    onPress={() => onSelect(o)}
                                    style={({ pressed }) => [
                                        styles.option,
                                        i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                                        active && { backgroundColor: colors.surfaceMuted },
                                        pressed && { opacity: 0.6 },
                                    ]}
                                >
                                    <ThemedText style={[styles.optionText, { color: colors.text }]}>{o}</ThemedText>
                                    {active ? <Check size={16} color={colors.violet} strokeWidth={3} /> : null}
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>
            ) : null}
        </View>
    );
}

/** Step 4: add the first vehicle. The car appears as soon as a model is picked. */
export default function AddVehicleScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const { width } = useWindowDimensions();
    const { addVehicle, selectVehicle } = useVehicles();

    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [range, setRange] = useState(225);
    const [parts, setParts] = useState<Record<string, string>>({ state: '', district: '', series: '', number: '' });
    const [temp, setTemp] = useState(false);
    const [tempReg, setTempReg] = useState('');
    const [isDefault, setIsDefault] = useState(true);
    const [openMenu, setOpenMenu] = useState<'make' | 'model' | null>(null);
    const refs = useRef<(TextInputInstance | null)[]>([]);

    const models = make ? EV_CATALOG[make]?.models ?? [] : [];
    const cat = make ? EV_CATALOG[make] : undefined;
    const regOk = temp ? tempReg.trim().length >= 4 : PARTS.every((p) => (parts[p.key] ?? '').length === p.len);
    const valid = !!make && !!model && regOk;

    // The car slides in when a model is chosen
    const reveal = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        reveal.setValue(0);
        if (model) Animated.spring(reveal, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
    }, [model, reveal]);

    const pickMake = (m: string) => {
        tap();
        setMake(m);
        setModel('');
        setOpenMenu(null);
        const c = EV_CATALOG[m];
        if (c) setRange(Math.min(700, Math.max(100, c.defaultRange)));
    };

    const setPart = (i: number, text: string) => {
        const p = PARTS[i];
        const clean = (p.letters ? text.replace(/[^a-zA-Z]/g, '') : text.replace(/[^0-9]/g, '')).toUpperCase().slice(0, p.len);
        setParts((prev) => ({ ...prev, [p.key]: clean }));
        if (clean.length === p.len && i < PARTS.length - 1) refs.current[i + 1]?.focus();
    };

    const finish = () => {
        if (!valid) return;
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        const reg = temp ? tempReg.trim().toUpperCase() : `${parts.state} ${parts.district} ${parts.series} ${parts.number}`;
        const v: Vehicle = {
            id: String(Date.now()),
            nickname: `${make} ${model}`,
            make,
            model,
            year: String(new Date().getFullYear()),
            registrationNumber: reg,
            connectorType: 'CCS2',
            batteryCapacity: cat?.defaultBattery ?? 50,
            maxDcRateKw: cat?.defaultDcRate ?? 60,
            currentBattery: 60,
            estRangeKm: range,
            chargeTarget: 80,
            autochargeEnabled: false,
            vidTag: `VID-${make.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
            perks: [],
        };
        addVehicle(v);
        if (isDefault) selectVehicle(v.id);
        navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Map', params: { showGracePeriod: true } } }] });
    };

    const heroW = width - 40;
    const heroH = heroW * 0.58;

    return (
        <AuthShell
            step={4}
            title="Add your car"
            subtitle="Pick your model and we will only show chargers that fit."
            onBack={() => navigation.goBack()}
            footer={<PulseButton variant="violet" title="Finish" icon={<Check size={18} color="#FFFFFF" strokeWidth={3} />} onPress={finish} disabled={!valid} />}
        >
            {/* Car hero: empty until a model is chosen, then the car slides in */}
            <View style={[styles.hero, { height: heroH, backgroundColor: model ? '#FFFFFF' : colors.surface, borderColor: colors.border, borderWidth: model ? 0 : 1.5, borderStyle: model ? 'solid' : 'dashed' }]}>
                {model ? (
                    <>
                        <ThemedText style={[styles.ghost, { fontSize: Math.min(88, heroW / 4.2) }]} numberOfLines={1} adjustsFontSizeToFit>
                            {model.split(' ')[0].toUpperCase()}
                        </ThemedText>
                        <Animated.Image
                            key={`${make}-${model}`}
                            source={getCarImage(make, model)}
                            resizeMode="contain"
                            accessibilityLabel={`${make} ${model}`}
                            style={{
                                width: heroW - 16,
                                height: heroH - 28,
                                opacity: reveal,
                                transform: [
                                    { translateX: reveal.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
                                    { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
                                ],
                            }}
                        />
                        <View style={styles.heroLabel}>
                            <ThemedText style={styles.heroMake}>{make}</ThemedText>
                            <ThemedText style={styles.heroModel}>{model}</ThemedText>
                        </View>
                    </>
                ) : (
                    <View style={styles.empty}>
                        <Car size={34} color={colors.textMuted} />
                        <ThemedText style={[styles.emptyText, { color: colors.textMuted }]}>
                            {make ? 'Now pick your model' : 'Your car will show up here'}
                        </ThemedText>
                    </View>
                )}
            </View>

            {model && cat ? (
                <View style={styles.specs}>
                    {[
                        ['Battery', `${cat.defaultBattery} kWh`],
                        ['Max DC', `${cat.defaultDcRate} kW`],
                        ['Range', `${range} km`],
                    ].map(([l, v]) => (
                        <View key={l} style={[styles.spec, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <ThemedText style={[styles.specV, { color: colors.text }]}>{v}</ThemedText>
                            <ThemedText style={[styles.specL, { color: colors.textMuted }]}>{l}</ThemedText>
                        </View>
                    ))}
                </View>
            ) : null}

            <Dropdown
                label="Manufacturer *"
                value={make}
                placeholder="Select manufacturer"
                options={MAKES}
                open={openMenu === 'make'}
                onToggle={() => setOpenMenu((m) => (m === 'make' ? null : 'make'))}
                onSelect={pickMake}
            />
            <Dropdown
                label="Model *"
                value={model}
                placeholder={make ? 'Select model' : 'Pick a manufacturer first'}
                options={models}
                disabled={!make}
                open={openMenu === 'model'}
                onToggle={() => setOpenMenu((m) => (m === 'model' ? null : 'model'))}
                onSelect={(m) => {
                    tap();
                    setModel(m);
                    setOpenMenu(null);
                }}
            />

            <View style={styles.rangeHead}>
                <ThemedText style={[authStyles.label, { color: colors.text, marginBottom: 0, marginTop: 0 }]}>Range *</ThemedText>
                <View style={[styles.rangeTag, { backgroundColor: colors.violet }]}>
                    <ThemedText style={styles.rangeTagText}>{range} km</ThemedText>
                </View>
            </View>
            <View style={{ alignItems: 'center' }}>
                <MultiSlider
                    values={[range]}
                    sliderLength={width - 40 - 16}
                    onValuesChange={(v) => setRange(v[0])}
                    min={100}
                    max={700}
                    step={5}
                    selectedStyle={{ backgroundColor: colors.violet }}
                    unselectedStyle={{ backgroundColor: colors.surfaceMuted }}
                    markerStyle={{ backgroundColor: colors.violet, width: 26, height: 26, borderRadius: 13, borderWidth: 3, borderColor: isDark ? '#0B0B0F' : '#FFFFFF' }}
                    containerStyle={{ height: 40 }}
                    trackStyle={{ height: 6, borderRadius: 3 }}
                />
            </View>

            <ThemedText style={[authStyles.label, { color: colors.text }]}>Registration number *</ThemedText>
            {temp ? (
                <TextInput
                    value={tempReg}
                    onChangeText={(t) => setTempReg(t.toUpperCase())}
                    placeholder="Enter registration number"
                    placeholderTextColor={colors.textSoft}
                    autoCapitalize="characters"
                    style={[authStyles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: tempReg.length >= 4 ? colors.violet : colors.border }]}
                    accessibilityLabel="Temporary registration number"
                />
            ) : (
                <View style={[styles.plate, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.plateStripe}>
                        <ThemedText style={styles.plateStripeText}>IND</ThemedText>
                    </View>
                    {PARTS.map((p, i) => (
                        <TextInput
                            key={p.key}
                            ref={(r) => {
                                refs.current[i] = r;
                            }}
                            value={parts[p.key]}
                            onChangeText={(t) => setPart(i, t)}
                            onKeyPress={({ nativeEvent }) => {
                                if (nativeEvent.key === 'Backspace' && parts[p.key].length === 0 && i > 0) refs.current[i - 1]?.focus();
                            }}
                            placeholder={p.placeholder}
                            placeholderTextColor={colors.textSoft}
                            autoCapitalize="characters"
                            keyboardType={p.letters ? 'default' : 'number-pad'}
                            maxLength={p.len}
                            textAlign="center"
                            style={[styles.plateInput, { flex: p.len === 4 ? 1.6 : 1, color: colors.text }]}
                            accessibilityLabel={`Registration part ${i + 1}`}
                        />
                    ))}
                </View>
            )}
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: temp }} onPress={() => { tap(); setTemp((t) => !t); }} style={styles.tempRow}>
                <View style={[styles.box, { borderColor: colors.border, backgroundColor: temp ? colors.violet : 'transparent' }]}>
                    {temp ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
                </View>
                <ThemedText style={[styles.tempText, { color: colors.textMuted }]}>Temporary or Bharat (BH) registration</ThemedText>
            </Pressable>

            <Pressable accessibilityRole="switch" accessibilityState={{ checked: isDefault }} onPress={() => { tap(); setIsDefault((d) => !d); }} style={[styles.defaultRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.defaultText, { color: colors.text }]}>Make this my default car</ThemedText>
                    <ThemedText style={[styles.defaultSub, { color: colors.textMuted }]}>Used to match chargers and plan trips</ThemedText>
                </View>
                <View style={[styles.toggle, { backgroundColor: isDefault ? colors.violet : colors.surfaceMuted }]}>
                    <View style={[styles.knob, { backgroundColor: '#FFFFFF', transform: [{ translateX: isDefault ? 20 : 0 }] }]} />
                </View>
            </Pressable>
        </AuthShell>
    );
}

const styles = StyleSheet.create({
    hero: { borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    ghost: { position: 'absolute', top: 14, left: 12, right: 12, textAlign: 'center', fontFamily: FONT_FAMILIES.extraBold, color: '#EFEAE2', letterSpacing: -3 },
    heroLabel: { position: 'absolute', left: 16, bottom: 12 },
    heroMake: { fontFamily: FONT_FAMILIES.bold, fontSize: 11.5, color: '#5F5C66', letterSpacing: 1.2, textTransform: 'uppercase' },
    heroModel: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 20, color: '#0B0B0F', letterSpacing: -0.5 },
    empty: { alignItems: 'center', gap: 8 },
    emptyText: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 14 },
    specs: { flexDirection: 'row', gap: 8, marginTop: 10 },
    spec: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12 },
    specV: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 15 },
    specL: { fontFamily: FONT_FAMILIES.medium, fontSize: 11.5, marginTop: 2 },
    select: { height: 54, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    selectText: { flex: 1, fontFamily: FONT_FAMILIES.semiBold, fontSize: 16 },
    menu: { marginTop: 6, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: 16 },
    optionText: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 15 },
    rangeHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 },
    rangeTag: { paddingHorizontal: 12, height: 28, borderRadius: 10, justifyContent: 'center' },
    rangeTagText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 13, color: '#FFFFFF' },
    plate: { flexDirection: 'row', alignItems: 'center', height: 62, borderRadius: 14, borderWidth: 2, overflow: 'hidden' },
    plateStripe: { width: 30, height: '100%', backgroundColor: '#1F3FBF', alignItems: 'center', justifyContent: 'center' },
    plateStripeText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 9, color: '#FFFFFF', transform: [{ rotate: '-90deg' }], width: 40, textAlign: 'center' },
    plateInput: { height: '100%', fontFamily: FONT_FAMILIES.extraBold, fontSize: 22, letterSpacing: 1, paddingHorizontal: 2 },
    tempRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, minHeight: 36 },
    box: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    tempText: { fontFamily: FONT_FAMILIES.medium, fontSize: 13, flex: 1 },
    defaultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, padding: 14, borderRadius: 18, borderWidth: 1, minHeight: 64 },
    defaultText: { fontFamily: FONT_FAMILIES.bold, fontSize: 15 },
    defaultSub: { fontFamily: FONT_FAMILIES.medium, fontSize: 12, marginTop: 1 },
    toggle: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
    knob: { width: 22, height: 22, borderRadius: 11 },
});
