import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
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
    Check,
} from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ThemedText } from '../../components/ThemedText';
import { CredCard } from '../../components/CredCard';
import { CredButton } from '../../components/CredButton';
import { FONT_FAMILIES, FONTS, SPACING, RADIUS } from '../../constants/Tokens';
import { useVehicles, ConnectorStandard } from '../../context/VehicleContext';

const CONNECTOR_OPTIONS: ConnectorStandard[] = ['CCS2', 'Type 2', 'CHAdeMO', 'GB/T'];
const MEMBERSHIP_OPTIONS: ('Standard' | 'Pro' | 'Iris Fleet')[] = ['Standard', 'Pro', 'Iris Fleet'];

export default function EditProfileScreen() {
    const { colors, isDark } = useAppTheme();
    const { user, updateUser, selectedVehicle, updateVehicle, vehicles, selectVehicle } = useVehicles();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    // User Form State
    const [fullName, setFullName] = useState(user.fullName);
    const [phone, setPhone] = useState(user.phone);
    const [email, setEmail] = useState(user.email);
    const [rfidTag, setRfidTag] = useState(user.rfidTag);
    const [membershipTier, setMembershipTier] = useState(user.membershipTier);

    // Active Vehicle Form State
    const activeVehicle = selectedVehicle ?? vehicles[0];
    const [vehicleNickname, setVehicleNickname] = useState(activeVehicle?.nickname ?? '');
    const [vehicleMake, setVehicleMake] = useState(activeVehicle?.make ?? '');
    const [vehicleModel, setVehicleModel] = useState(activeVehicle?.model ?? '');
    const [vehicleYear, setVehicleYear] = useState(activeVehicle?.year ?? '');
    const [vehicleRegNo, setVehicleRegNo] = useState(activeVehicle?.registrationNumber ?? '');
    const [batteryCapacity, setBatteryCapacity] = useState(
        activeVehicle ? String(activeVehicle.batteryCapacity) : '60'
    );
    const [maxDcRateKw, setMaxDcRateKw] = useState(
        activeVehicle ? String(activeVehicle.maxDcRateKw) : '150'
    );
    const [connectorType, setConnectorType] = useState<ConnectorStandard>(
        activeVehicle?.connectorType ?? 'CCS2'
    );
    const [autochargeEnabled, setAutochargeEnabled] = useState(
        activeVehicle?.autochargeEnabled ?? false
    );

    const handleSave = () => {
        if (!fullName.trim()) {
            Alert.alert('Required Field', 'Please enter your full name.');
            return;
        }

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Save User Updates
        updateUser({
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            rfidTag: rfidTag.trim(),
            membershipTier,
        });

        // Save Vehicle Updates
        if (activeVehicle) {
            updateVehicle(activeVehicle.id, {
                nickname: vehicleNickname.trim(),
                make: vehicleMake.trim(),
                model: vehicleModel.trim(),
                year: vehicleYear.trim(),
                registrationNumber: vehicleRegNo.trim().toUpperCase(),
                batteryCapacity: parseFloat(batteryCapacity) || activeVehicle.batteryCapacity,
                maxDcRateKw: parseFloat(maxDcRateKw) || activeVehicle.maxDcRateKw,
                connectorType,
                autochargeEnabled,
            });
        }

        Alert.alert('Success', 'Profile and vehicle details have been saved successfully.', [
            {
                text: 'OK',
                onPress: () => navigation.goBack(),
            },
        ]);
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

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* 1. Driver Profile Section */}
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
                            placeholder="Enter your name"
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
                            RFID CARD TAG
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

                    <View style={styles.fieldGroup}>
                        <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                            MEMBERSHIP TIER
                        </ThemedText>
                        <View style={styles.pillRow}>
                            {MEMBERSHIP_OPTIONS.map((tier) => {
                                const isSelected = membershipTier === tier;
                                return (
                                    <TouchableOpacity
                                        key={tier}
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
                                            setMembershipTier(tier);
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
                                            {tier}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </CredCard>

                {/* 2. Active Vehicle Section */}
                <CredCard variant="default" style={styles.sectionCard}>
                    <View style={styles.sectionHeaderRow}>
                        <CarFront size={18} color={colors.primary} />
                        <ThemedText style={FONTS.h3}>Active Vehicle Details</ThemedText>
                    </View>

                    {vehicles.length > 1 && (
                        <View style={styles.fieldGroup}>
                            <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                SELECT PRIMARY VEHICLE
                            </ThemedText>
                            <View style={styles.pillRow}>
                                {vehicles.map((v) => {
                                    const isSelected = activeVehicle?.id === v.id;
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
                                                selectVehicle(v.id);
                                                setVehicleNickname(v.nickname);
                                                setVehicleMake(v.make);
                                                setVehicleModel(v.model);
                                                setVehicleYear(v.year);
                                                setVehicleRegNo(v.registrationNumber);
                                                setBatteryCapacity(String(v.batteryCapacity));
                                                setMaxDcRateKw(String(v.maxDcRateKw));
                                                setConnectorType(v.connectorType);
                                                setAutochargeEnabled(v.autochargeEnabled);
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
                                                {v.nickname || `${v.make} ${v.model}`}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

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
                            placeholder="e.g. Daily Sprint"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <View style={styles.rowTwoCols}>
                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <ThemedText style={[styles.fieldLabel, { color: colors.textMuted }]}>
                                MAKE
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
                                placeholder="e.g. Hyundai"
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
                                placeholder="e.g. IONIQ 5"
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
                                BATTERY (kWh)
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
                                MAX DC (kW)
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
                                Automatically start charging and billing on Iris certified chargers.
                            </ThemedText>
                        </View>
                        <Switch
                            value={autochargeEnabled}
                            onValueChange={setAutochargeEnabled}
                            trackColor={{ false: colors.surfaceMuted, true: '#10B981' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </CredCard>

                {/* Save and Cancel Buttons */}
                <CredButton
                    title="SAVE ALL CHANGES"
                    variant="neon"
                    containerStyle={{ marginTop: 8 }}
                    onPress={handleSave}
                />

                <CredButton
                    title="CANCEL"
                    variant="outline"
                    containerStyle={{ marginTop: 10, marginBottom: 30 }}
                    onPress={() => navigation.goBack()}
                />
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
    },
});
