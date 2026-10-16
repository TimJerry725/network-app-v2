import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    TextInput,
    Platform,
    KeyboardAvoidingView,
    Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft,
    ChevronDown,
    X,
    User,
    Mail,
    Phone,
    Shield,
    Car,
    CarFront,
    BatteryCharging,
    Zap,
    Plus,
    Trash2,
    Check,
} from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ThemedText } from '../../components/ThemedText';
import { CredCard } from '../../components/CredCard';
import { CredButton } from '../../components/CredButton';
import { FONT_FAMILIES, FONTS, SPACING, RADIUS } from '../../constants/Tokens';
import { useVehicles, ConnectorStandard, Vehicle } from '../../context/VehicleContext';

export const EV_CATALOG: Record<string, { models: string[]; defaultBattery: number; defaultDcRate: number; defaultRange: number }> = {
    'Tata': {
        models: ['Nexon.ev', 'Punch.ev', 'Tiago.ev', 'Tigor.ev', 'Curvv.ev', 'Harrier.ev'],
        defaultBattery: 45,
        defaultDcRate: 60,
        defaultRange: 320,
    },
    'Mahindra': {
        models: ['XUV400', 'BE 6e', 'XEV 9e'],
        defaultBattery: 39.4,
        defaultDcRate: 50,
        defaultRange: 310,
    },
    'MG': {
        models: ['ZS EV', 'Comet EV', 'Windsor EV'],
        defaultBattery: 50.3,
        defaultDcRate: 50,
        defaultRange: 340,
    },
    'Hyundai': {
        models: ['IONIQ 5', 'Kona Electric', 'Creta Electric'],
        defaultBattery: 72.6,
        defaultDcRate: 230,
        defaultRange: 450,
    },
    'Kia': {
        models: ['EV6', 'EV9'],
        defaultBattery: 77.4,
        defaultDcRate: 240,
        defaultRange: 480,
    },
    'BYD': {
        models: ['Atto 3', 'Seal', 'e6', 'Sealion 6'],
        defaultBattery: 60.5,
        defaultDcRate: 80,
        defaultRange: 420,
    },
    'BMW': {
        models: ['i4', 'iX1', 'iX', 'i7', 'i5'],
        defaultBattery: 83.9,
        defaultDcRate: 205,
        defaultRange: 490,
    },
    'Mercedes-Benz': {
        models: ['EQB', 'EQE', 'EQS', 'EQA'],
        defaultBattery: 70.5,
        defaultDcRate: 100,
        defaultRange: 425,
    },
    'Audi': {
        models: ['Q8 e-tron', 'e-tron GT', 'Q4 e-tron'],
        defaultBattery: 95,
        defaultDcRate: 170,
        defaultRange: 440,
    },
    'Volvo': {
        models: ['XC40 Recharge', 'C40 Recharge', 'EX30', 'EX90'],
        defaultBattery: 78,
        defaultDcRate: 150,
        defaultRange: 418,
    },
    'Tesla': {
        models: ['Model 3', 'Model Y', 'Model S', 'Model X'],
        defaultBattery: 75,
        defaultDcRate: 250,
        defaultRange: 500,
    },
    'Porsche': {
        models: ['Taycan', 'Macan EV'],
        defaultBattery: 93.4,
        defaultDcRate: 270,
        defaultRange: 450,
    },
    'Other': {
        models: ['Custom EV Model'],
        defaultBattery: 50,
        defaultDcRate: 60,
        defaultRange: 300,
    },
};

const CONNECTOR_OPTIONS: ConnectorStandard[] = ['CCS2', 'Type 2', 'CHAdeMO', 'GB/T'];

export default function EditProfileScreen() {
    const { colors, isDark } = useAppTheme();
    const {
        user,
        updateUser,
        selectedVehicle,
        updateVehicle,
        vehicles,
        selectVehicle,
        addVehicle,
        removeVehicle,
    } = useVehicles();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();

    const initialTab = (route.params?.tab as 'profile' | 'vehicle') || 'profile';
    const [activeTab, setActiveTab] = useState<'profile' | 'vehicle'>(initialTab);

    // User Form State
    const [fullName, setFullName] = useState(user.fullName);
    const [phone, setPhone] = useState(user.phone);
    const [email, setEmail] = useState(user.email);
    const [rfidTag, setRfidTag] = useState(user.rfidTag);

    // Active Vehicle Selection
    const [activeVehicleId, setActiveVehicleId] = useState<string>(
        selectedVehicle?.id ?? vehicles[0]?.id ?? '1'
    );

    const currentVehicle =
        vehicles.find((v) => v.id === activeVehicleId) ?? selectedVehicle ?? vehicles[0];

    // Vehicle Form State
    const [vehicleMake, setVehicleMake] = useState(currentVehicle?.make || 'Tata');
    const [vehicleModel, setVehicleModel] = useState(currentVehicle?.model || 'Nexon.ev');
    const [vehicleRegNo, setVehicleRegNo] = useState(currentVehicle?.registrationNumber ?? '');
    const [isTempReg, setIsTempReg] = useState(
        currentVehicle?.registrationNumber?.startsWith('TR-') ||
        currentVehicle?.registrationNumber?.startsWith('TEMP-') ||
        false
    );
    const [batteryCapacity, setBatteryCapacity] = useState(
        currentVehicle ? String(currentVehicle.batteryCapacity) : '45'
    );
    const [estRangeKm, setEstRangeKm] = useState(
        currentVehicle ? String(currentVehicle.estRangeKm) : '320'
    );
    const [maxDcRateKw, setMaxDcRateKw] = useState(
        currentVehicle ? String(currentVehicle.maxDcRateKw) : '60'
    );
    const [connectorType, setConnectorType] = useState<ConnectorStandard>(
        currentVehicle?.connectorType ?? 'CCS2'
    );
    const [makeModalVisible, setMakeModalVisible] = useState(false);
    const [modelModalVisible, setModelModalVisible] = useState(false);

    // Derived list of makes and models for selected make
    const availableMakes = Array.from(new Set([...Object.keys(EV_CATALOG), vehicleMake].filter(Boolean)));
    const modelsForSelectedMake = Array.from(
        new Set([
            ...(EV_CATALOG[vehicleMake]?.models ?? []),
            vehicleModel,
        ].filter(Boolean))
    );

    // Load vehicle details into form when active vehicle selection changes
    const loadVehicleIntoForm = (v: Vehicle) => {
        setActiveVehicleId(v.id);
        selectVehicle(v.id);
        setVehicleMake(v.make);
        setVehicleModel(v.model);
        setVehicleRegNo(v.registrationNumber);
        setIsTempReg(v.registrationNumber.startsWith('TR-') || v.registrationNumber.startsWith('TEMP-'));
        setBatteryCapacity(String(v.batteryCapacity));
        setEstRangeKm(String(v.estRangeKm));
        setMaxDcRateKw(String(v.maxDcRateKw));
        setConnectorType(v.connectorType);
    };

    const handleSelectMake = (make: string) => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setVehicleMake(make);
        const catalogEntry = EV_CATALOG[make];
        const models = catalogEntry ? catalogEntry.models : ['Custom EV Model'];
        setVehicleModel(models[0] || 'Custom EV Model');
        if (catalogEntry) {
            setBatteryCapacity(String(catalogEntry.defaultBattery));
            setMaxDcRateKw(String(catalogEntry.defaultDcRate));
            setEstRangeKm(String(catalogEntry.defaultRange));
        }
        setMakeModalVisible(false);
    };

    const handleSelectModel = (model: string) => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setVehicleModel(model);
        setModelModalVisible(false);
    };

    const handleToggleTempReg = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsTempReg(!isTempReg);
    };

    const handleAddNewVehicle = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const newId = String(Date.now());
        const newVehicle: Vehicle = {
            id: newId,
            nickname: 'Tata Punch.ev',
            make: 'Tata',
            model: 'Punch.ev',
            year: '2025',
            registrationNumber: 'KA 03 EV 2025',
            connectorType: 'CCS2',
            batteryCapacity: 35.0,
            maxDcRateKw: 50,
            currentBattery: 85,
            estRangeKm: 265,
            chargeTarget: 90,
            autochargeEnabled: true,
            vidTag: `VID-TAT-${Math.floor(1000 + Math.random() * 9000)}`,
            perks: ['Fast Charge Capable', 'City Range Optimized'],
        };

        addVehicle(newVehicle);
        loadVehicleIntoForm(newVehicle);
        setActiveTab('vehicle');
    };

    const handleRemoveVehicle = (id: string) => {
        if (vehicles.length <= 1) {
            Alert.alert('Cannot Remove', 'You must have at least one registered vehicle.');
            return;
        }

        Alert.alert(
            'Remove Vehicle',
            `Are you sure you want to remove "${currentVehicle?.make} ${currentVehicle?.model}" from your profile?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        removeVehicle(id);
                        const remaining = vehicles.filter((v) => v.id !== id);
                        if (remaining.length > 0) {
                            loadVehicleIntoForm(remaining[0]);
                        }
                    },
                },
            ]
        );
    };

    const handleSave = () => {
        if (!fullName.trim()) {
            Alert.alert('Required Field', 'Please enter your full name.');
            return;
        }

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }

        // 1. Update Driver Profile
        updateUser({
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            rfidTag: rfidTag.trim(),
        });

        // 2. Update Active Vehicle Details
        if (activeVehicleId) {
            updateVehicle(activeVehicleId, {
                nickname: `${vehicleMake.trim()} ${vehicleModel.trim()}`,
                make: vehicleMake.trim() || 'EV',
                model: vehicleModel.trim() || 'Car',
                registrationNumber: vehicleRegNo.trim().toUpperCase() || (isTempReg ? 'TR-KA-01-XXXX' : 'KA 01 EV 0001'),
                batteryCapacity: parseFloat(batteryCapacity) || 60,
                estRangeKm:
                    parseInt(estRangeKm, 10) ||
                    Math.round((parseFloat(batteryCapacity) || 60) * 4.2),
                maxDcRateKw: parseFloat(maxDcRateKw) || 120,
                connectorType,
            });
        }

        // Return with success
        if (Platform.OS === 'web') {
            navigation.goBack();
        } else {
            Alert.alert('Saved', 'Profile and vehicle details have been updated successfully.', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.goBack();
                    }}
                    style={[
                        styles.backButton,
                        {
                            backgroundColor: isDark ? '#1C1C24' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                            borderBottomColor: isDark ? '#050508' : '#C8C8D0',
                        },
                    ]}
                    activeOpacity={0.8}
                >
                    <ChevronLeft size={20} color={colors.text} strokeWidth={2.5} />
                </TouchableOpacity>
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Edit Profile & Vehicle</ThemedText>
                <View style={{ width: 38 }} />
            </View>

            {/* Segmented Tab Switcher */}
            <View style={styles.tabSwitcherContainer}>
                <View
                    style={[
                        styles.tabSwitcherBg,
                        {
                            backgroundColor: isDark ? '#141418' : '#F0F0F4',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={[
                            styles.tabOption,
                            activeTab === 'profile' && {
                                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                            },
                        ]}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setActiveTab('profile');
                        }}
                        activeOpacity={0.85}
                    >
                        <User
                            size={14}
                            color={
                                activeTab === 'profile'
                                    ? isDark
                                        ? '#000000'
                                        : '#FFFFFF'
                                    : colors.textMuted
                            }
                            style={{ marginRight: 6 }}
                        />
                        <ThemedText
                            style={[
                                styles.tabOptionText,
                                {
                                    color:
                                        activeTab === 'profile'
                                            ? isDark
                                                ? '#000000'
                                                : '#FFFFFF'
                                            : colors.textMuted,
                                    fontFamily:
                                        activeTab === 'profile'
                                            ? FONT_FAMILIES.extraBold
                                            : FONT_FAMILIES.bold,
                                },
                            ]}
                        >
                            DRIVER PROFILE
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tabOption,
                            activeTab === 'vehicle' && {
                                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                            },
                        ]}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setActiveTab('vehicle');
                        }}
                        activeOpacity={0.85}
                    >
                        <CarFront
                            size={14}
                            color={
                                activeTab === 'vehicle'
                                    ? isDark
                                        ? '#000000'
                                        : '#FFFFFF'
                                    : colors.textMuted
                            }
                            style={{ marginRight: 6 }}
                        />
                        <ThemedText
                            style={[
                                styles.tabOptionText,
                                {
                                    color:
                                        activeTab === 'vehicle'
                                            ? isDark
                                                ? '#000000'
                                                : '#FFFFFF'
                                            : colors.textMuted,
                                    fontFamily:
                                        activeTab === 'vehicle'
                                            ? FONT_FAMILIES.extraBold
                                            : FONT_FAMILIES.bold,
                                },
                            ]}
                        >
                            VEHICLE DETAILS
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {activeTab === 'profile' ? (
                    /* ----------------- DRIVER PROFILE TAB ----------------- */
                    <CredCard variant="default" style={styles.sectionCard}>
                        <View style={styles.sectionHeaderRow}>
                            <User size={18} color={colors.primary} />
                            <ThemedText style={FONTS.h3}>Driver Information</ThemedText>
                        </View>

                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                FULL NAME
                            </ThemedText>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                        color: colors.text,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                                    },
                                ]}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter your full name"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                PHONE NUMBER
                            </ThemedText>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                        color: colors.text,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                                    },
                                ]}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+91 Phone number"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                EMAIL ADDRESS
                            </ThemedText>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                        color: colors.text,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                                    },
                                ]}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email address"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                RFID CARD IDENTIFIER
                            </ThemedText>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                        color: colors.text,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                                    },
                                ]}
                                value={rfidTag}
                                onChangeText={setRfidTag}
                                placeholder="IRIS-RFID-XXXX"
                                placeholderTextColor={colors.textMuted}
                                autoCapitalize="characters"
                            />
                        </View>
                    </CredCard>
                ) : (
                    /* ----------------- VEHICLE DETAILS TAB ----------------- */
                    <CredCard variant="default" style={styles.sectionCard}>
                        {/* Vehicle Selector Header with Add Button */}
                        <View style={styles.vehicleSelectHeader}>
                            <ThemedText style={[styles.fieldLabel, { color: colors.textMuted, marginBottom: 0 }]}>
                                SELECT OR SWITCH EV
                            </ThemedText>
                            <TouchableOpacity
                                style={[
                                    styles.addEvBtn,
                                    {
                                        backgroundColor: isDark ? '#1C1C24' : '#FFFFFF',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)',
                                    },
                                ]}
                                onPress={handleAddNewVehicle}
                                activeOpacity={0.8}
                            >
                                <Plus size={12} color={colors.primary} style={{ marginRight: 4 }} />
                                <ThemedText style={{ fontSize: 11, fontFamily: FONT_FAMILIES.bold, color: colors.primary }}>
                                    ADD EV
                                </ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* Vehicle Pill Chips */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                            <View style={styles.pillRow}>
                                {vehicles.map((v) => {
                                    const isSelected = activeVehicleId === v.id;
                                    return (
                                        <TouchableOpacity
                                            key={v.id}
                                            style={[
                                                styles.choicePill,
                                                isSelected
                                                    ? {
                                                          backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                                          borderColor: isDark ? '#FFFFFF' : '#000000',
                                                      }
                                                    : {
                                                          backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                                          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)',
                                                      },
                                            ]}
                                            onPress={() => {
                                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                loadVehicleIntoForm(v);
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <Car size={12} color={isSelected ? (isDark ? '#000000' : '#FFFFFF') : colors.textMuted} style={{ marginRight: 6 }} />
                                            <ThemedText
                                                style={{
                                                    color: isSelected ? (isDark ? '#000000' : '#FFFFFF') : colors.text,
                                                    fontSize: 12,
                                                    fontFamily: FONT_FAMILIES.bold,
                                                }}
                                            >
                                                {v.make} {v.model}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        {/* Make & Model Dependent Dropdowns */}
                        <View style={styles.rowTwoCols}>
                            <View style={[styles.fieldGroup, { flex: 1 }]}>
                                <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                    MAKE / BRAND
                                </ThemedText>
                                <TouchableOpacity
                                    style={[
                                        styles.dropdownTrigger,
                                        {
                                            backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                                        },
                                    ]}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setMakeModalVisible(true);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <ThemedText style={[styles.dropdownValue, { color: colors.text }]} numberOfLines={1}>
                                        {vehicleMake || 'Select Make'}
                                    </ThemedText>
                                    <ChevronDown size={15} color={colors.textMuted} />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.fieldGroup, { flex: 1 }]}>
                                <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                    MODEL
                                </ThemedText>
                                <TouchableOpacity
                                    style={[
                                        styles.dropdownTrigger,
                                        {
                                            backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                                        },
                                    ]}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setModelModalVisible(true);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <ThemedText style={[styles.dropdownValue, { color: colors.text }]} numberOfLines={1}>
                                        {vehicleModel || 'Select Model'}
                                    </ThemedText>
                                    <ChevronDown size={15} color={colors.textMuted} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Registration Number - Long Text Box with Temporary Checkbox below */}
                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                {isTempReg ? 'TEMPORARY REGISTRATION NUMBER (TR)' : 'REGISTRATION NUMBER'}
                            </ThemedText>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                        color: colors.text,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                                    },
                                ]}
                                value={vehicleRegNo}
                                onChangeText={setVehicleRegNo}
                                placeholder={isTempReg ? 'e.g. TR-2024-KA-01-XXXX' : 'e.g. KA 01 EQ 1234'}
                                placeholderTextColor={colors.textMuted}
                                autoCapitalize="characters"
                            />

                            {/* Checkbox below Registration */}
                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={handleToggleTempReg}
                                activeOpacity={0.8}
                            >
                                <View
                                    style={[
                                        styles.checkboxBox,
                                        isTempReg
                                            ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                            : {
                                                  backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.20)',
                                              },
                                    ]}
                                >
                                    {isTempReg && <Check size={12} color="#000000" strokeWidth={3.5} />}
                                </View>
                                <ThemedText style={[styles.checkboxLabel, { color: isTempReg ? colors.text : colors.textMuted }]}>
                                    This vehicle has a temporary registration number (TR)
                                </ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* Battery Capacity & Max DC Rate */}
                        <View style={styles.rowTwoCols}>
                            <View style={[styles.fieldGroup, { flex: 1 }]}>
                                <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                    BATTERY SIZE (kWh)
                                </ThemedText>
                                <TextInput
                                    style={[
                                        styles.textInput,
                                        {
                                            backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                            color: colors.text,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                                        },
                                    ]}
                                    value={batteryCapacity}
                                    onChangeText={setBatteryCapacity}
                                    placeholder="e.g. 72.6"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.fieldGroup, { flex: 1 }]}>
                                <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                    MAX DC RATE (kW)
                                </ThemedText>
                                <TextInput
                                    style={[
                                        styles.textInput,
                                        {
                                            backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                            color: colors.text,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                                        },
                                    ]}
                                    value={maxDcRateKw}
                                    onChangeText={setMaxDcRateKw}
                                    placeholder="e.g. 220"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Est. Range (km) */}
                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                EST. FULL RANGE (km)
                            </ThemedText>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                        color: colors.text,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                                    },
                                ]}
                                value={estRangeKm}
                                onChangeText={setEstRangeKm}
                                placeholder="e.g. 320"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Connector Standard */}
                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                CHARGING CONNECTOR STANDARD
                            </ThemedText>
                            <View style={styles.pillRow}>
                                {CONNECTOR_OPTIONS.map((cType) => {
                                    const isSelected = connectorType === cType;
                                    return (
                                        <TouchableOpacity
                                            key={cType}
                                            style={[
                                                styles.choicePill,
                                                isSelected
                                                    ? {
                                                          backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                                          borderColor: isDark ? '#FFFFFF' : '#000000',
                                                      }
                                                    : {
                                                          backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                                          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)',
                                                      },
                                            ]}
                                            onPress={() => {
                                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                setConnectorType(cType);
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <ThemedText
                                                style={{
                                                    color: isSelected ? (isDark ? '#000000' : '#FFFFFF') : colors.text,
                                                    fontSize: 12,
                                                    fontFamily: FONT_FAMILIES.bold,
                                                }}
                                            >
                                                {cType}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {vehicles.length > 1 && (
                            <TouchableOpacity
                                style={styles.deleteVehicleBtn}
                                onPress={() => handleRemoveVehicle(activeVehicleId)}
                                activeOpacity={0.8}
                            >
                                <Trash2 size={14} color="#EF4444" style={{ marginRight: 6 }} />
                                <ThemedText style={{ fontSize: 12, fontFamily: FONT_FAMILIES.bold, color: '#EF4444' }}>
                                    REMOVE THIS VEHICLE
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                    </CredCard>
                )}

                {/* Cancel and Save Buttons in the same row */}
                <View style={styles.actionButtonsRow}>
                    <CredButton
                        title="CANCEL"
                        variant="outline"
                        showTrailingIcon={false}
                        containerStyle={{ flex: 1 }}
                        onPress={() => navigation.goBack()}
                    />
                    <CredButton
                        title="SAVE"
                        variant="dark"
                        showTrailingIcon={false}
                        containerStyle={{ flex: 1 }}
                        onPress={handleSave}
                    />
                </View>
            </ScrollView>

            {/* Modal for Selecting Make */}
            <Modal
                visible={makeModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMakeModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setMakeModalVisible(false)}
                    />
                    <CredCard variant="default" style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <CarFront size={18} color={colors.primary} />
                                <ThemedText style={FONTS.h3}>Select EV Make</ThemedText>
                            </View>
                            <TouchableOpacity
                                onPress={() => setMakeModalVisible(false)}
                                style={styles.modalCloseBtn}
                            >
                                <X size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 340 }}>
                            {availableMakes.map((make) => {
                                const isSelected = vehicleMake === make;
                                return (
                                    <TouchableOpacity
                                        key={make}
                                        style={[
                                            styles.modalItemRow,
                                            {
                                                backgroundColor: isSelected
                                                    ? (isDark ? '#22222A' : '#E8E8EC')
                                                    : 'transparent',
                                                borderColor: colors.surfaceMuted,
                                            },
                                        ]}
                                        onPress={() => handleSelectMake(make)}
                                        activeOpacity={0.7}
                                    >
                                        <ThemedText
                                            style={{
                                                fontSize: 14,
                                                fontFamily: isSelected ? FONT_FAMILIES.bold : FONT_FAMILIES.medium,
                                                color: isSelected ? colors.primary : colors.text,
                                            }}
                                        >
                                            {make}
                                        </ThemedText>
                                        {isSelected && <Check size={16} color={colors.primary} strokeWidth={2.5} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </CredCard>
                </View>
            </Modal>

            {/* Modal for Selecting Model */}
            <Modal
                visible={modelModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModelModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setModelModalVisible(false)}
                    />
                    <CredCard variant="default" style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Car size={18} color={colors.primary} />
                                <ThemedText style={FONTS.h3}>{vehicleMake} Models</ThemedText>
                            </View>
                            <TouchableOpacity
                                onPress={() => setModelModalVisible(false)}
                                style={styles.modalCloseBtn}
                            >
                                <X size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 340 }}>
                            {modelsForSelectedMake.map((m) => {
                                const isSelected = vehicleModel === m;
                                return (
                                    <TouchableOpacity
                                        key={m}
                                        style={[
                                            styles.modalItemRow,
                                            {
                                                backgroundColor: isSelected
                                                    ? (isDark ? '#22222A' : '#E8E8EC')
                                                    : 'transparent',
                                                borderColor: colors.surfaceMuted,
                                            },
                                        ]}
                                        onPress={() => handleSelectModel(m)}
                                        activeOpacity={0.7}
                                    >
                                        <ThemedText
                                            style={{
                                                fontSize: 14,
                                                fontFamily: isSelected ? FONT_FAMILIES.bold : FONT_FAMILIES.medium,
                                                color: isSelected ? colors.primary : colors.text,
                                            }}
                                        >
                                            {m}
                                        </ThemedText>
                                        {isSelected && <Check size={16} color={colors.primary} strokeWidth={2.5} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </CredCard>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderBottomWidth: 3,
    },
    headerTitle: {
        ...FONTS.h2,
        fontSize: 18,
    },
    tabSwitcherContainer: {
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
    },
    tabSwitcherBg: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
    },
    tabOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        borderRadius: RADIUS.pill,
    },
    tabOptionText: {
        fontSize: 11,
        letterSpacing: 0.8,
    },
    content: {
        padding: SPACING.md,
        paddingBottom: SPACING.xxl,
    },
    sectionCard: {
        marginBottom: SPACING.md,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    vehicleSelectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    addEvBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
    },
    fieldGroup: {
        marginBottom: 14,
    },
    fieldLabel: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.extraBold,
        letterSpacing: 1.2,
        marginBottom: 6,
    },
    textInput: {
        height: 48,
        borderRadius: RADIUS.input,
        paddingHorizontal: 14,
        fontSize: 14,
        fontFamily: FONT_FAMILIES.bold,
        borderWidth: 1,
    },
    rowTwoCols: {
        flexDirection: 'row',
        gap: 10,
    },
    pillRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    choicePill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: RADIUS.button,
        borderWidth: 1.5,
        borderBottomWidth: 3,
        borderBottomColor: '#222228',
    },
    dropdownTrigger: {
        height: 48,
        borderRadius: RADIUS.input,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
    },
    dropdownValue: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.bold,
        flex: 1,
        marginRight: 6,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 8,
    },
    checkboxBox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxLabel: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.medium,
        flex: 1,
    },
    deleteVehicleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        marginTop: 12,
        borderRadius: RADIUS.button,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
        marginBottom: 36,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.md,
    },
    modalCard: {
        width: '100%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 8,
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: RADIUS.card,
        marginBottom: 4,
    },
});
