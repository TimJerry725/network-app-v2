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
    Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft,
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
    const [vehicleNickname, setVehicleNickname] = useState(currentVehicle?.nickname ?? '');
    const [vehicleMake, setVehicleMake] = useState(currentVehicle?.make ?? '');
    const [vehicleModel, setVehicleModel] = useState(currentVehicle?.model ?? '');
    const [vehicleYear, setVehicleYear] = useState(currentVehicle?.year ?? '2024');
    const [vehicleRegNo, setVehicleRegNo] = useState(currentVehicle?.registrationNumber ?? '');
    const [batteryCapacity, setBatteryCapacity] = useState(
        currentVehicle ? String(currentVehicle.batteryCapacity) : '60'
    );
    const [currentBattery, setCurrentBattery] = useState(
        currentVehicle ? String(currentVehicle.currentBattery) : '75'
    );
    const [estRangeKm, setEstRangeKm] = useState(
        currentVehicle ? String(currentVehicle.estRangeKm) : '250'
    );
    const [maxDcRateKw, setMaxDcRateKw] = useState(
        currentVehicle ? String(currentVehicle.maxDcRateKw) : '150'
    );
    const [connectorType, setConnectorType] = useState<ConnectorStandard>(
        currentVehicle?.connectorType ?? 'CCS2'
    );
    const [autochargeEnabled, setAutochargeEnabled] = useState(
        currentVehicle?.autochargeEnabled ?? true
    );

    // Load vehicle details into form when active vehicle selection changes
    const loadVehicleIntoForm = (v: Vehicle) => {
        setActiveVehicleId(v.id);
        selectVehicle(v.id);
        setVehicleNickname(v.nickname);
        setVehicleMake(v.make);
        setVehicleModel(v.model);
        setVehicleYear(v.year);
        setVehicleRegNo(v.registrationNumber);
        setBatteryCapacity(String(v.batteryCapacity));
        setCurrentBattery(String(v.currentBattery));
        setEstRangeKm(String(v.estRangeKm));
        setMaxDcRateKw(String(v.maxDcRateKw));
        setConnectorType(v.connectorType);
        setAutochargeEnabled(v.autochargeEnabled);
    };

    const handleAddNewVehicle = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const newId = String(Date.now());
        const newVehicle: Vehicle = {
            id: newId,
            nickname: 'My New EV',
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
            `Are you sure you want to remove "${currentVehicle?.nickname || currentVehicle?.model}" from your profile?`,
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
                nickname: vehicleNickname.trim() || `${vehicleMake.trim()} ${vehicleModel.trim()}`,
                make: vehicleMake.trim() || 'EV',
                model: vehicleModel.trim() || 'Car',
                year: vehicleYear.trim() || '2024',
                registrationNumber: vehicleRegNo.trim().toUpperCase() || 'KA 01 EV 0001',
                batteryCapacity: parseFloat(batteryCapacity) || 60,
                currentBattery: Math.min(100, Math.max(0, parseInt(currentBattery, 10) || 75)),
                estRangeKm:
                    parseInt(estRangeKm, 10) ||
                    Math.round((parseFloat(batteryCapacity) || 60) * 4.2),
                maxDcRateKw: parseFloat(maxDcRateKw) || 120,
                connectorType,
                autochargeEnabled,
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
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                                        borderBottomColor: isDark ? '#050508' : '#D0D0D5',
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
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                                        borderBottomColor: isDark ? '#050508' : '#D0D0D5',
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
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                                        borderBottomColor: isDark ? '#050508' : '#D0D0D5',
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
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                                        borderBottomColor: isDark ? '#050508' : '#D0D0D5',
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
                                                {v.nickname || `${v.make} ${v.model}`}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                VEHICLE NICKNAME
                            </ThemedText>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                        color: colors.text,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                                        borderBottomColor: isDark ? '#050508' : '#D0D0D5',
                                    },
                                ]}
                                value={vehicleNickname}
                                onChangeText={setVehicleNickname}
                                placeholder="e.g. Daily Sprint, City Commuter"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={styles.rowTwoCols}>
                            <View style={[styles.fieldGroup, { flex: 1 }]}>
                                <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                    MAKE / BRAND
                                </ThemedText>
                                <TextInput
                                    style={[
                                        styles.textInput,
                                        {
                                            backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                            color: colors.text,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                                            borderBottomColor: isDark ? '#050508' : '#D0D0D5',
                                        },
                                    ]}
                                    value={vehicleMake}
                                    onChangeText={setVehicleMake}
                                    placeholder="e.g. Hyundai, Tata"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                            <View style={[styles.fieldGroup, { flex: 1 }]}>
                                <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                    MODEL
                                </ThemedText>
                                <TextInput
                                    style={[
                                        styles.textInput,
                                        {
                                            backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                            color: colors.text,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                                            borderBottomColor: isDark ? '#050508' : '#D0D0D5',
                                        },
                                    ]}
                                    value={vehicleModel}
                                    onChangeText={setVehicleModel}
                                    placeholder="e.g. IONIQ 5, Nexon EV"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        </View>

                        <View style={styles.rowTwoCols}>
                            <View style={[styles.fieldGroup, { flex: 1 }]}>
                                <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                    YEAR
                                </ThemedText>
                                <TextInput
                                    style={[
                                        styles.textInput,
                                        {
                                            backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                            color: colors.text,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                                            borderBottomColor: isDark ? '#050508' : '#D0D0D5',
                                        },
                                    ]}
                                    value={vehicleYear}
                                    onChangeText={setVehicleYear}
                                    placeholder="e.g. 2024"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.fieldGroup, { flex: 1.4 }]}>
                                <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                    REGISTRATION / PLATE
                                </ThemedText>
                                <TextInput
                                    style={[
                                        styles.textInput,
                                        {
                                            backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                            color: colors.text,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                                            borderBottomColor: isDark ? '#050508' : '#D0D0D5',
                                        },
                                    ]}
                                    value={vehicleRegNo}
                                    onChangeText={setVehicleRegNo}
                                    placeholder="e.g. TN 38 BZ 9021"
                                    placeholderTextColor={colors.textMuted}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </View>

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
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                                            borderBottomColor: isDark ? '#050508' : '#D0D0D5',
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
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                                            borderBottomColor: isDark ? '#050508' : '#D0D0D5',
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

                        <View style={styles.rowTwoCols}>
                            <View style={[styles.fieldGroup, { flex: 1 }]}>
                                <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                    CURRENT SoC (%)
                                </ThemedText>
                                <TextInput
                                    style={[
                                        styles.textInput,
                                        {
                                            backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                            color: colors.text,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                                            borderBottomColor: isDark ? '#050508' : '#D0D0D5',
                                        },
                                    ]}
                                    value={currentBattery}
                                    onChangeText={setCurrentBattery}
                                    placeholder="e.g. 58"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="numeric"
                                    maxLength={3}
                                />
                            </View>
                            <View style={[styles.fieldGroup, { flex: 1 }]}>
                                <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                    EST. RANGE (km)
                                </ThemedText>
                                <TextInput
                                    style={[
                                        styles.textInput,
                                        {
                                            backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                            color: colors.text,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                                            borderBottomColor: isDark ? '#050508' : '#D0D0D5',
                                        },
                                    ]}
                                    value={estRangeKm}
                                    onChangeText={setEstRangeKm}
                                    placeholder="e.g. 270"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

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

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <ThemedText style={{ fontSize: 13, fontFamily: FONT_FAMILIES.bold, color: colors.text }}>
                                    Autocharge / Plug & Charge
                                </ThemedText>
                                <ThemedText style={{ fontSize: 11, color: colors.textMuted }}>
                                    Automatically start session on Iris network chargers without manual app trigger.
                                </ThemedText>
                            </View>
                            <Switch
                                value={autochargeEnabled}
                                onValueChange={setAutochargeEnabled}
                                trackColor={{ false: colors.surfaceMuted, true: '#10B981' }}
                                thumbColor="#FFFFFF"
                            />
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

                {/* Save and Cancel Buttons in the same row */}
                <View style={styles.actionButtonsRow}>
                    <CredButton
                        title="SAVE"
                        variant="neon"
                        showTrailingIcon={false}
                        containerStyle={{ flex: 1 }}
                        onPress={handleSave}
                    />
                    <CredButton
                        title="CANCEL"
                        variant="outline"
                        showTrailingIcon={false}
                        containerStyle={{ flex: 1 }}
                        onPress={() => navigation.goBack()}
                    />
                </View>
            </ScrollView>
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
        padding: SPACING.md,
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
        borderWidth: 1.5,
        borderBottomWidth: 3,
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
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        paddingBottom: 4,
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
});
