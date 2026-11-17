import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Plus, Trash2, Check, ChevronDown, X } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ThemedText } from '../../components/ThemedText';
import { FONT_FAMILIES } from '../../constants/Tokens';
import { useVehicles, ConnectorStandard, Vehicle } from '../../context/VehicleContext';
import { EV_CATALOG } from '../../constants/EvCatalog';
import { Chip, Segmented } from '../../components/stack/StackKit';
import { ScreenTitle } from '../../components/flat/FlatKit';
import { PulseButton } from '../../components/pulse/PulseKit';

const CONNECTORS: ConnectorStandard[] = ['CCS2', 'Type 2', 'CHAdeMO', 'GB/T'];

function tap(s: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
    if (Platform.OS !== 'web') Haptics.impactAsync(s).catch(() => {});
}

function Field({ label, value, onChange, keyboard, upper }: { label: string; value: string; onChange: (t: string) => void; keyboard?: 'default' | 'phone-pad' | 'email-address' | 'decimal-pad' | 'number-pad'; upper?: boolean }) {
    const { colors } = useAppTheme();
    return (
        <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</ThemedText>
            <TextInput
                value={value}
                onChangeText={onChange}
                keyboardType={keyboard ?? 'default'}
                autoCapitalize={upper ? 'characters' : keyboard === 'email-address' ? 'none' : 'words'}
                style={[styles.fieldInput, { color: colors.text }]}
                accessibilityLabel={label}
                placeholderTextColor={colors.textSoft}
            />
        </View>
    );
}

export default function EditProfileScreen() {
    const { colors } = useAppTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { user, updateUser, vehicles, updateVehicle, addVehicle, removeVehicle, selectedVehicle, selectVehicle } = useVehicles();

    const [tab, setTab] = useState<'profile' | 'vehicle'>((route.params?.tab as 'profile' | 'vehicle') || 'profile');
    const [fullName, setFullName] = useState(user.fullName);
    const [phone, setPhone] = useState(user.phone);
    const [email, setEmail] = useState(user.email);
    const [rfid, setRfid] = useState(user.rfidTag);

    const [vehId, setVehId] = useState<string>(selectedVehicle?.id ?? vehicles[0]?.id ?? '1');
    const cur = vehicles.find((v) => v.id === vehId) ?? selectedVehicle ?? vehicles[0];
    const [make, setMake] = useState(cur?.make || 'Tata');
    const [model, setModel] = useState(cur?.model || 'Nexon.ev');
    const [reg, setReg] = useState(cur?.registrationNumber ?? '');
    const [tempReg, setTempReg] = useState(!!cur && (cur.registrationNumber.startsWith('TR-') || cur.registrationNumber.startsWith('TEMP-')));
    const [battery, setBattery] = useState(cur ? String(cur.batteryCapacity) : '45');
    const [range, setRange] = useState(cur ? String(cur.estRangeKm) : '320');
    const [dc, setDc] = useState(cur ? String(cur.maxDcRateKw) : '60');
    const [plug, setPlug] = useState<ConnectorStandard>(cur?.connectorType ?? 'CCS2');
    const [picker, setPicker] = useState<'make' | 'model' | null>(null);

    const makes = Array.from(new Set([...Object.keys(EV_CATALOG), make].filter(Boolean)));
    const models = Array.from(new Set([...(EV_CATALOG[make]?.models ?? []), model].filter(Boolean)));

    const load = (v: Vehicle) => {
        setVehId(v.id);
        selectVehicle(v.id);
        setMake(v.make);
        setModel(v.model);
        setReg(v.registrationNumber);
        setTempReg(v.registrationNumber.startsWith('TR-') || v.registrationNumber.startsWith('TEMP-'));
        setBattery(String(v.batteryCapacity));
        setRange(String(v.estRangeKm));
        setDc(String(v.maxDcRateKw));
        setPlug(v.connectorType);
    };

    const pickMake = (m: string) => {
        tap();
        setMake(m);
        const c = EV_CATALOG[m];
        setModel(c?.models[0] || 'Custom EV Model');
        if (c) {
            setBattery(String(c.defaultBattery));
            setDc(String(c.defaultDcRate));
            setRange(String(c.defaultRange));
        }
        setPicker(null);
    };

    const add = () => {
        tap(Haptics.ImpactFeedbackStyle.Medium);
        const v: Vehicle = {
            id: String(Date.now()),
            nickname: 'Tata Punch.ev',
            make: 'Tata',
            model: 'Punch.ev',
            year: '2025',
            registrationNumber: 'KA 03 EV 2025',
            connectorType: 'CCS2',
            batteryCapacity: 35,
            maxDcRateKw: 50,
            currentBattery: 85,
            estRangeKm: 265,
            chargeTarget: 90,
            autochargeEnabled: true,
            vidTag: `VID-TAT-${Math.floor(1000 + Math.random() * 9000)}`,
            perks: ['Fast Charge Capable', 'City Range Optimized'],
        };
        addVehicle(v);
        load(v);
        setTab('vehicle');
    };

    const remove = () => {
        if (vehicles.length <= 1) {
            Alert.alert('Keep at least one car', 'You need one car on your profile to match chargers.');
            return;
        }
        Alert.alert('Remove car?', `${cur?.make} ${cur?.model} will be removed from your profile.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                    tap(Haptics.ImpactFeedbackStyle.Heavy);
                    removeVehicle(vehId);
                    const rest = vehicles.filter((v) => v.id !== vehId);
                    if (rest[0]) load(rest[0]);
                },
            },
        ]);
    };

    const save = () => {
        if (!fullName.trim()) {
            Alert.alert('Name needed', 'Please enter your full name.');
            return;
        }
        tap(Haptics.ImpactFeedbackStyle.Heavy);
        updateUser({ fullName: fullName.trim(), phone: phone.trim(), email: email.trim(), rfidTag: rfid.trim() });
        if (vehId) {
            updateVehicle(vehId, {
                nickname: `${make.trim()} ${model.trim()}`,
                make: make.trim() || 'EV',
                model: model.trim() || 'Car',
                registrationNumber: reg.trim().toUpperCase() || (tempReg ? 'TR-KA-01-XXXX' : 'KA 01 EV 0001'),
                batteryCapacity: parseFloat(battery) || 60,
                estRangeKm: parseInt(range, 10) || Math.round((parseFloat(battery) || 60) * 4.2),
                maxDcRateKw: parseFloat(dc) || 120,
                connectorType: plug,
            });
        }
        if (Platform.OS === 'web') navigation.goBack();
        else Alert.alert('Saved', 'Your details are updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 6, paddingHorizontal: 16, paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <ScreenTitle title={tab === 'profile' ? 'Edit profile' : 'Your cars'} onBack={() => navigation.goBack()} />
                <View style={{ height: 12 }} />
                <Segmented
                    options={[
                        { value: 'profile', label: 'Profile' },
                        { value: 'vehicle', label: 'Cars' },
                    ]}
                    value={tab}
                    onChange={setTab}
                />

                {tab === 'profile' ? (
                    <>
                        <Field label="Full name" value={fullName} onChange={setFullName} />
                        <Field label="Phone" value={phone} onChange={setPhone} keyboard="phone-pad" />
                        <Field label="Email" value={email} onChange={setEmail} keyboard="email-address" />
                        <Field label="RFID card number" value={rfid} onChange={setRfid} upper />
                    </>
                ) : (
                    <>
                        {/* Pick which car to edit */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
                            {vehicles.map((v) => (
                                <Chip key={v.id} label={`${v.make} ${v.model}`} active={v.id === vehId} onPress={() => load(v)} />
                            ))}
                            <Chip label="Add car" onPress={add} icon={<Plus size={14} color={colors.text} />} />
                        </ScrollView>

                        <View style={styles.pickRow}>
                            <Pressable accessibilityRole="button" onPress={() => setPicker('make')} style={[styles.pick, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>Make</ThemedText>
                                <View style={styles.pickVal}>
                                    <ThemedText style={[styles.fieldInput, { color: colors.text }]} numberOfLines={1}>{make}</ThemedText>
                                    <ChevronDown size={16} color={colors.textMuted} />
                                </View>
                            </Pressable>
                            <Pressable accessibilityRole="button" onPress={() => setPicker('model')} style={[styles.pick, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>Model</ThemedText>
                                <View style={styles.pickVal}>
                                    <ThemedText style={[styles.fieldInput, { color: colors.text }]} numberOfLines={1}>{model}</ThemedText>
                                    <ChevronDown size={16} color={colors.textMuted} />
                                </View>
                            </Pressable>
                        </View>

                        <Field label={tempReg ? 'Temporary registration' : 'Registration number'} value={reg} onChange={setReg} upper />
                        <Pressable accessibilityRole="switch" accessibilityState={{ checked: tempReg }} onPress={() => { tap(); setTempReg((t) => !t); }} style={styles.tempRow}>
                            <View style={[styles.box, { borderColor: colors.border, backgroundColor: tempReg ? colors.lime : 'transparent' }]}>
                                {tempReg ? <Check size={13} color="#0B0B0F" strokeWidth={3} /> : null}
                            </View>
                            <ThemedText style={[styles.tempText, { color: colors.text }]}>New car with a temporary number</ThemedText>
                        </Pressable>

                        <View style={styles.triple}>
                            <View style={{ flex: 1 }}><Field label="Battery kWh" value={battery} onChange={setBattery} keyboard="decimal-pad" /></View>
                            <View style={{ flex: 1 }}><Field label="Range km" value={range} onChange={setRange} keyboard="number-pad" /></View>
                            <View style={{ flex: 1 }}><Field label="Max DC kW" value={dc} onChange={setDc} keyboard="decimal-pad" /></View>
                        </View>

                        <ThemedText style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 16, marginBottom: 8, fontSize: 13 }]}>Charging plug</ThemedText>
                        <View style={styles.plugs}>
                            {CONNECTORS.map((c) => {
                                const active = c === plug;
                                return (
                                    <Pressable key={c} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => { tap(); setPlug(c); }} style={[styles.plug, active ? { backgroundColor: colors.lime, borderColor: colors.lime } : { borderColor: colors.border, backgroundColor: colors.surface }]}>
                                        <ThemedText style={[styles.plugText, { color: active ? '#0B0B0F' : colors.text }]}>{c}</ThemedText>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <PulseButton title="Remove this car" variant="ghost" size="md" icon={<Trash2 size={15} color={colors.error} />} onPress={remove} style={{ marginTop: 18 }} />
                    </>
                )}
            </ScrollView>

            <View style={[styles.saveBar, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <PulseButton title="Save changes" icon={<Check size={17} color="#0B0B0F" strokeWidth={3} />} onPress={save} />
            </View>

            <Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
                <View style={styles.overlay}>
                    <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.sheetHead}>
                            <ThemedText style={[styles.sheetTitle, { color: colors.text }]}>{picker === 'make' ? 'Pick a make' : `Pick a ${make} model`}</ThemedText>
                            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setPicker(null)} hitSlop={10}>
                                <X size={20} color={colors.text} />
                            </Pressable>
                        </View>
                        <ScrollView style={{ maxHeight: 420 }}>
                            <View style={styles.grid}>
                                {(picker === 'make' ? makes : models).map((m) => {
                                    const active = picker === 'make' ? m === make : m === model;
                                    return (
                                        <Pressable
                                            key={m}
                                            accessibilityRole="radio"
                                            accessibilityState={{ checked: active }}
                                            onPress={() => (picker === 'make' ? pickMake(m) : (tap(), setModel(m), setPicker(null)))}
                                            style={[styles.gridItem, active ? { backgroundColor: colors.lime, borderColor: colors.lime } : { borderColor: colors.border, backgroundColor: colors.background }]}
                                        >
                                            <ThemedText style={[styles.gridText, { color: active ? '#0B0B0F' : colors.text }]}>{m}</ThemedText>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </ScrollView>
                        {picker === 'make' ? <ThemedText style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 10 }]}>Battery, range and DC speed fill in automatically.</ThemedText> : null}
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    preview: { height: 170, flex: 0, marginTop: 16, marginBottom: 6 },
    kind: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 10.5, letterSpacing: 1.3 },
    field: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, marginTop: 10 },
    fieldLabel: { fontFamily: FONT_FAMILIES.bold, fontSize: 11.5 },
    fieldInput: { fontFamily: FONT_FAMILIES.bold, fontSize: 16, paddingVertical: 4 },
    strip: { gap: 8, paddingVertical: 14 },
    carCard: { width: 190, height: 130, flex: 0 },
    carName: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 17, lineHeight: 21, marginTop: 8 },
    addCard: { width: 120, height: 130, borderRadius: 26, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
    addText: { fontFamily: FONT_FAMILIES.bold, fontSize: 13 },
    pickRow: { flexDirection: 'row', gap: 10 },
    pick: { flex: 1, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 },
    pickVal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    tempRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, minHeight: 40 },
    box: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    tempText: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13.5 },
    triple: { flexDirection: 'row', gap: 8 },
    plugs: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    plug: { height: 42, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, justifyContent: 'center' },
    plugText: { fontFamily: FONT_FAMILIES.bold, fontSize: 13.5 },
    saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 18 },
    sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sheetTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 21, letterSpacing: -0.4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    gridItem: { paddingHorizontal: 14, height: 42, borderRadius: 14, borderWidth: 1, justifyContent: 'center' },
    gridText: { fontFamily: FONT_FAMILIES.bold, fontSize: 14 },
});
