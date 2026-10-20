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
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
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
                {/* User & EV Unified Card */}
                <CredCard variant="default" style={styles.profileCard}>
                    <View style={styles.userTopRow}>
                        <View style={[styles.avatar, { backgroundColor: 'rgba(255, 91, 69, 0.16)' }]}>
                            <User size={26} color="#FF5B45" />
                        </View>
                        <View style={styles.userInfo}>
                            <View style={styles.userHeaderRow}>
                                <ThemedText style={FONTS.h3}>{user.fullName}</ThemedText>
                                <TouchableOpacity
                                    style={[
                                        styles.editPillBtn,
                                        {
                                            backgroundColor: isDark ? 'rgba(255, 91, 69, 0.14)' : '#FFEAE6',
                                            borderColor: 'rgba(255, 91, 69, 0.25)',
                                        },
                                    ]}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        navigation.navigate('EditProfile', { tab: 'profile' });
                                    }}
                                >
                                    <Pencil size={11} color="#FF5B45" style={{ marginRight: 4 }} />
                                    <ThemedText style={[styles.editPillText, { color: '#FF5B45' }]}>EDIT</ThemedText>
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

                    <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]} />

                    <View style={styles.rfidRow}>
                        <Shield size={15} color="#5B61F6" />
                        <ThemedText style={{ color: colors.textMuted, ...FONTS.caption }}>
                            RFID Card:
                        </ThemedText>
                        <ThemedText style={[FONTS.caption, { fontWeight: '700', color: colors.text }]}>
                            {user.rfidTag}
                        </ThemedText>
                    </View>

                    <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]} />

                    {/* Active Vehicle Details Section */}
                    <View style={styles.vehicleTitleRow}>
                        <View style={[styles.vehicleIconCircle, { backgroundColor: 'rgba(91, 97, 246, 0.14)' }]}>
                            <CarFront size={22} color="#5B61F6" />
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
                            {/* 3 Colorful Telemetry Pods */}
                            <View style={styles.vehicleMetricsRow}>
                                <View style={[styles.metricPod, { backgroundColor: isDark ? 'rgba(91, 97, 246, 0.10)' : '#EEF0FF' }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Zap size={12} color="#5B61F6" />
                                        <ThemedText style={[FONTS.caption, { color: '#5B61F6', fontSize: 10, fontWeight: '700' }]}>CAPACITY</ThemedText>
                                    </View>
                                    <ThemedText style={[FONTS.h3, { color: colors.text, marginTop: 4, fontSize: 16 }]}>
                                        {activeVehicle.batteryCapacity} kWh
                                    </ThemedText>
                                    <ThemedText style={{ color: colors.textMuted, fontSize: 10 }}>
                                        {activeVehicle.connectorType}
                                    </ThemedText>
                                </View>

                                <View style={[styles.metricPod, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.10)' : '#ECFDF5' }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <BatteryCharging size={12} color="#10B981" />
                                        <ThemedText style={[FONTS.caption, { color: '#10B981', fontSize: 10, fontWeight: '700' }]}>EST. RANGE</ThemedText>
                                    </View>
                                    <ThemedText style={[FONTS.h3, { color: colors.text, marginTop: 4, fontSize: 16 }]}>
                                        ~{activeVehicle.estRangeKm} km
                                    </ThemedText>
                                    <ThemedText style={{ color: colors.textMuted, fontSize: 10 }}>
                                        Combined
                                    </ThemedText>
                                </View>

                                <View style={[styles.metricPod, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.10)' : '#FEF3C7' }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Zap size={12} color="#F59E0B" />
                                        <ThemedText style={[FONTS.caption, { color: '#F59E0B', fontSize: 10, fontWeight: '700' }]}>MAX DC</ThemedText>
                                    </View>
                                    <ThemedText style={[FONTS.h3, { color: colors.text, marginTop: 4, fontSize: 16 }]}>
                                        {activeVehicle.maxDcRateKw} kW
                                    </ThemedText>
                                    <ThemedText style={{ color: colors.textMuted, fontSize: 10 }}>
                                        Fast Charge
                                    </ThemedText>
                                </View>
                            </View>
                        </>
                    )}
                </CredCard>

                {/* Iris EV Wallet Balance Card */}
                <CredCard variant="default" style={styles.walletCard}>
                    <View style={styles.walletHeader}>
                        <View style={styles.walletTitleRow}>
                            <View style={[styles.walletIconPod, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                <Wallet size={18} color="#F59E0B" />
                            </View>
                            <ThemedText style={FONTS.h3}>Iris EV Wallet</ThemedText>
                        </View>
                        <ThemedText style={[FONTS.h1, { color: '#F59E0B' }]}>
                            ₹{user.walletBalance.toFixed(2)}
                        </ThemedText>
                    </View>
                    <ThemedText style={{ color: colors.textMuted, ...FONTS.caption, marginTop: 4 }}>
                        Instant one-tap payment authorization across all network hubs.
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
                                    backgroundColor: isDark ? '#1C1D26' : '#F3F4F8',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                },
                            ]}
                        >
                            <ThemedText style={[styles.currencyPrefix, { color: '#FF5B45' }]}>
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
                                                  backgroundColor: '#FF5B45',
                                                  borderColor: '#FF5B45',
                                              }
                                            : {
                                                  backgroundColor: isDark ? '#1C1D26' : '#F3F4F8',
                                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                              },
                                    ]}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setTopUpAmount(amt);
                                    }}
                                >
                                    <ThemedText
                                        style={{
                                            color: isSelected ? '#FFFFFF' : colors.text,
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
                        variant="coral"
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
                                <Moon size={22} color="#5B61F6" />
                            ) : (
                                <Sun size={22} color="#F59E0B" />
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
                                    backgroundColor: theme === 'dark' ? '#10B981' : colors.surfaceMuted,
                                    borderWidth: 1,
                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
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
                        <View style={[styles.supportIconPod, { backgroundColor: 'rgba(56, 189, 248, 0.14)' }]}>
                            <PhoneCall size={18} color="#38BDF8" />
                        </View>
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
        borderWidth: 1,
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
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.button,
        borderWidth: 1,
    },
    editPillText: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.extraBold,
        letterSpacing: 0.8,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: RADIUS.squircle ?? 24,
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
        gap: 12,
        flex: 1,
        marginBottom: 10,
    },
    vehicleIconCircle: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.squircle ?? 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    vehicleMetricsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 6,
    },
    metricPod: {
        flex: 1,
        borderRadius: RADIUS.tile,
        padding: 10,
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
        gap: 10,
    },
    walletIconPod: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.tile,
        alignItems: 'center',
        justifyContent: 'center',
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
        height: 52,
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
        paddingVertical: 9,
        alignItems: 'center',
        borderRadius: RADIUS.button,
        borderWidth: 1,
    },
    supportIconPod: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.tile,
        alignItems: 'center',
        justifyContent: 'center',
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
