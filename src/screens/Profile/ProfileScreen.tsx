import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft,
    Moon,
    Sun,
    Wallet,
    Plus,
    User,
    Shield,
    PhoneCall,
    Info,
    Pencil,
    CarFront,
    BatteryCharging,
    Zap,
} from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ThemedText } from '../../components/ThemedText';
import { CredCard } from '../../components/CredCard';
import { CredButton } from '../../components/CredButton';
import { FONT_FAMILIES, FONTS, SPACING, SHADOWS, RADIUS } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';

export default function ProfileScreen() {
    const { colors, theme, setTheme, isDark } = useAppTheme();
    const { user, topUpWallet, selectedVehicle, vehicles } = useVehicles();
    const activeVehicle = selectedVehicle ?? vehicles[0];
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [topUpAmount, setTopUpAmount] = useState('500');

    const handleThemeToggle = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleTopUp = () => {
        const val = parseFloat(topUpAmount);
        if (isNaN(val) || val <= 0) {
            Alert.alert('Invalid amount', 'Please enter a valid amount to recharge your wallet.');
            return;
        }
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        topUpWallet(val);
        Alert.alert('Wallet Recharged', `₹${val.toFixed(2)} added to your Iris EV Wallet successfully.`);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
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
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Profile & Account</ThemedText>
                <View style={{ width: 38 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* User Card */}
                <CredCard variant="default" style={styles.profileCard}>
                    <View style={styles.userTopRow}>
                        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
                            <User size={28} color={colors.primary} />
                        </View>
                        <View style={styles.userInfo}>
                            <View style={styles.userHeaderRow}>
                                <ThemedText style={FONTS.h3}>{user.fullName}</ThemedText>
                                <TouchableOpacity
                                    style={[
                                        styles.editPillBtn,
                                        {
                                            backgroundColor: isDark ? '#1C1C24' : '#FFFFFF',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                                            borderBottomColor: isDark ? '#050508' : '#C8C8D0',
                                        },
                                    ]}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        navigation.navigate('EditProfile', { tab: 'profile' });
                                    }}
                                >
                                    <Pencil size={11} color={colors.text} style={{ marginRight: 4 }} />
                                    <ThemedText style={[styles.editPillText, { color: colors.text }]}>EDIT</ThemedText>
                                </TouchableOpacity>
                            </View>
                            <ThemedText style={{ color: colors.textMuted, ...FONTS.body }}>
                                {user.phone}
                            </ThemedText>
                            <ThemedText style={{ color: colors.textMuted, ...FONTS.caption }}>
                                {user.email}
                            </ThemedText>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.surfaceMuted }]} />

                    <View style={styles.rfidRow}>
                        <Shield size={15} color={colors.primary} />
                        <ThemedText style={{ color: colors.textMuted, ...FONTS.caption }}>
                            RFID:
                        </ThemedText>
                        <ThemedText style={[FONTS.caption, { fontWeight: '700' }]}>
                            {user.rfidTag}
                        </ThemedText>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.surfaceMuted }]} />

                    {/* Active Vehicle Details Section */}
                    <View style={styles.vehicleTitleRow}>
                        <View style={[styles.vehicleIconCircle, { backgroundColor: colors.primarySoft }]}>
                            <CarFront size={22} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={FONTS.h3} numberOfLines={1}>
                                {activeVehicle
                                    ? `${activeVehicle.make} ${activeVehicle.model}`
                                    : 'No Vehicle Connected'}
                            </ThemedText>
                            <ThemedText style={{ color: colors.textMuted, ...FONTS.caption, marginTop: 2 }}>
                                {activeVehicle
                                    ? activeVehicle.registrationNumber
                                    : 'Connect your EV'}
                            </ThemedText>
                        </View>
                    </View>

                    {activeVehicle && (
                        <>
                            <View style={[styles.divider, { backgroundColor: colors.surfaceMuted }]} />

                            {/* 3 Telemetry Metrics: Capacity, Est. Range, Max DC Speed */}
                            <View style={styles.vehicleMetricsRow}>
                                <View style={styles.vehicleMetricItem}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Zap size={13} color={colors.primary} />
                                        <ThemedText style={[FONTS.caption, { color: colors.textMuted, fontSize: 10 }]}>CAPACITY</ThemedText>
                                    </View>
                                    <ThemedText style={[FONTS.h3, { color: colors.text, marginTop: 2 }]}>
                                        {activeVehicle.batteryCapacity} kWh
                                    </ThemedText>
                                    <ThemedText style={{ color: colors.textMuted, fontSize: 10 }}>
                                        {activeVehicle.connectorType}
                                    </ThemedText>
                                </View>

                                <View style={styles.vehicleMetricItem}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <BatteryCharging size={13} color="#10B981" />
                                        <ThemedText style={[FONTS.caption, { color: colors.textMuted, fontSize: 10 }]}>EST. RANGE</ThemedText>
                                    </View>
                                    <ThemedText style={[FONTS.h3, { color: colors.text, marginTop: 2 }]}>
                                        ~{activeVehicle.estRangeKm} km
                                    </ThemedText>
                                    <ThemedText style={{ color: colors.textMuted, fontSize: 10 }}>
                                        Combined
                                    </ThemedText>
                                </View>

                                <View style={styles.vehicleMetricItem}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Zap size={13} color="#F59E0B" />
                                        <ThemedText style={[FONTS.caption, { color: colors.textMuted, fontSize: 10 }]}>MAX SPEED</ThemedText>
                                    </View>
                                    <ThemedText style={[FONTS.h3, { color: colors.text, marginTop: 2 }]}>
                                        {activeVehicle.maxDcRateKw} kW
                                    </ThemedText>
                                    <ThemedText style={{ color: colors.textMuted, fontSize: 10 }}>
                                        DC Fast
                                    </ThemedText>
                                </View>
                            </View>
                        </>
                    )}
                </CredCard>

                {/* Iris EV Wallet Balance Card */}
                <CredCard variant="recessed" style={styles.walletCard}>
                    <View style={styles.walletHeader}>
                        <View style={styles.walletTitleRow}>
                            <Wallet size={20} color={colors.primary} />
                            <ThemedText style={FONTS.h3}>Iris EV Wallet</ThemedText>
                        </View>
                        <ThemedText style={[FONTS.h1, { color: colors.primary }]}>
                            ₹{user.walletBalance.toFixed(2)}
                        </ThemedText>
                    </View>
                    <ThemedText style={{ color: colors.textMuted, ...FONTS.caption, marginTop: 4 }}>
                        Instant one-tap payment authorization for fast charging hubs.
                    </ThemedText>

                    {/* Custom Recharge Amount Input Field */}
                    <View style={styles.amountInputContainer}>
                        <ThemedText style={[styles.inputLabel, { color: colors.textMuted }]}>
                            RECHARGE AMOUNT
                        </ThemedText>
                        <View
                            style={[
                                styles.inputBox,
                                {
                                    backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                                },
                            ]}
                        >
                            <ThemedText style={[styles.currencyPrefix, { color: colors.primary }]}>
                                ₹
                            </ThemedText>
                            <TextInput
                                style={[styles.textInput, { color: colors.text }]}
                                placeholder="Enter amount"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="number-pad"
                                value={topUpAmount}
                                onChangeText={(text) => setTopUpAmount(text.replace(/[^0-9]/g, ''))}
                                maxLength={6}
                            />
                            {topUpAmount.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => {
                                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setTopUpAmount('');
                                    }}
                                    style={styles.clearBtn}
                                    activeOpacity={0.7}
                                >
                                    <ThemedText style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                                        CLEAR
                                    </ThemedText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Quick Preset Pills */}
                    <View style={styles.topUpRow}>
                        {['200', '500', '1000', '2000'].map((amt) => {
                            const isSelected = topUpAmount === amt;
                            return (
                                <TouchableOpacity
                                    key={amt}
                                    style={[
                                        styles.quickTopUpPill,
                                        isSelected
                                            ? {
                                                  backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                                  borderColor: isDark ? '#FFFFFF' : '#000000',
                                                  borderWidth: 1.5,
                                                  borderBottomWidth: 3,
                                                  borderBottomColor: isDark ? '#A0A0A8' : '#222228',
                                              }
                                            : {
                                                  backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)',
                                                  borderWidth: 1,
                                                  borderBottomWidth: 2,
                                                  borderBottomColor: isDark ? '#050508' : '#D0D0D5',
                                              },
                                    ]}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setTopUpAmount(amt);
                                    }}
                                >
                                    <ThemedText
                                        style={{
                                            color: isSelected ? (isDark ? '#000000' : '#FFFFFF') : colors.text,
                                            ...FONTS.caption,
                                            fontWeight: '800',
                                        }}
                                    >
                                        +₹{amt}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <CredButton
                        title={
                            topUpAmount && parseFloat(topUpAmount) > 0
                                ? `ADD ₹${topUpAmount} TO WALLET`
                                : 'ENTER AMOUNT TO RECHARGE'
                        }
                        variant="neon"
                        containerStyle={{ marginTop: 14 }}
                        onPress={handleTopUp}
                        disabled={!topUpAmount || parseFloat(topUpAmount) <= 0}
                    />
                </CredCard>

                {/* Display & Preferences */}
                <CredCard variant="default" style={styles.section}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                        Display & Preferences
                    </ThemedText>

                    {/* Dark Mode Toggle */}
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            {theme === 'dark' ? (
                                <Moon size={22} color={colors.primary} />
                            ) : (
                                <Sun size={22} color={colors.primary} />
                            )}
                            <View>
                                <ThemedText style={[styles.rowTitle, { color: colors.text }]}>
                                    Dark Mode
                                </ThemedText>
                                <ThemedText style={{ color: colors.textMuted, ...FONTS.caption }}>
                                    High contrast for outdoor & night driving
                                </ThemedText>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.toggleContainer,
                                {
                                    backgroundColor: theme === 'dark' ? colors.primary : colors.surfaceMuted,
                                    borderWidth: 1,
                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                },
                            ]}
                            onPress={handleThemeToggle}
                            activeOpacity={0.8}
                        >
                            <View
                                style={[
                                    styles.toggleKnob,
                                    {
                                        backgroundColor: '#FFFFFF',
                                        transform: [{ translateX: theme === 'dark' ? 20 : 2 }],
                                    },
                                ]}
                            />
                        </TouchableOpacity>
                    </View>
                </CredCard>

                {/* 24/7 Driver Support Card */}
                <CredCard variant="default" style={styles.supportCard}>
                    <View style={styles.supportRow}>
                        <PhoneCall size={20} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                            <ThemedText style={FONTS.bodyStrong}>24/7 CPO Driver Helpline</ThemedText>
                            <ThemedText style={{ color: colors.textMuted, ...FONTS.caption }}>
                                Need help unplugging or with station faults? Call 1800-419-IRIS
                            </ThemedText>
                        </View>
                    </View>
                </CredCard>
            </ScrollView>
        </View>
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
    },
    content: {
        padding: SPACING.md,
        paddingBottom: SPACING.xl,
    },
    profileCard: {
        marginBottom: SPACING.md,
    },
    userTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    editPillBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: RADIUS.pill,
        borderWidth: 1.5,
        borderBottomWidth: 3,
    },
    editPillText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.extraBold,
        letterSpacing: 0.8,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    userInfo: {
        flex: 1,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginVertical: 12,
    },
    rfidRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    vehicleTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    vehicleIconCircle: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    vehicleMetricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    vehicleMetricItem: {
        flex: 1,
    },
    walletCard: {
        marginBottom: SPACING.md,
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    walletTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    amountInputContainer: {
        marginTop: 14,
    },
    inputLabel: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.extraBold,
        letterSpacing: 1.2,
        marginBottom: 6,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderRadius: RADIUS.input,
        paddingHorizontal: 16,
        borderWidth: 1,
    },
    currencyPrefix: {
        fontSize: 20,
        fontFamily: FONT_FAMILIES.bold,
        marginRight: 6,
    },
    textInput: {
        flex: 1,
        fontSize: 18,
        fontFamily: FONT_FAMILIES.bold,
        height: '100%',
    },
    clearBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    topUpRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    quickTopUpPill: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: RADIUS.button,
    },
    section: {
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        ...FONTS.h3,
        marginBottom: SPACING.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.xs,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        flex: 1,
    },
    rowTitle: {
        ...FONTS.bodyStrong,
    },
    toggleContainer: {
        width: 44,
        height: 24,
        borderRadius: RADIUS.circle,
        justifyContent: 'center',
    },
    toggleKnob: {
        width: 20,
        height: 20,
        borderRadius: RADIUS.circle,
        position: 'absolute',
    },
    supportCard: {
        marginBottom: SPACING.md,
    },
    supportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
});
