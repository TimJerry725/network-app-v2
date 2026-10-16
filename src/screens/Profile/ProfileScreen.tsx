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
    Accessibility,
} from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ThemedText } from '../../components/ThemedText';
import { CredCard } from '../../components/CredCard';
import { CredButton } from '../../components/CredButton';
import { FONT_FAMILIES, FONTS, SPACING, SHADOWS, RADIUS } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';

export default function ProfileScreen() {
    const { colors, theme, setTheme, isDark } = useAppTheme();
    const { user, topUpWallet, toggleSeniorMode } = useVehicles();
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
                            <ThemedText style={FONTS.h3}>{user.fullName}</ThemedText>
                            <ThemedText style={{ color: colors.textMuted, ...FONTS.body }}>
                                {user.phone}
                            </ThemedText>
                            <ThemedText style={{ color: colors.textMuted, ...FONTS.caption }}>
                                {user.email}
                            </ThemedText>
                        </View>
                        <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
                            <ThemedText style={{ color: colors.primary, ...FONTS.caption, fontWeight: '700' }}>
                                {user.membershipTier}
                            </ThemedText>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.surfaceMuted }]} />

                    <View style={styles.rfidRow}>
                        <Shield size={16} color={colors.primary} />
                        <ThemedText style={{ color: colors.textMuted, ...FONTS.caption }}>
                            Active RFID Tag:
                        </ThemedText>
                        <ThemedText style={[FONTS.caption, { fontWeight: '700' }]}>
                            {user.rfidTag}
                        </ThemedText>
                    </View>
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

                    <View style={styles.topUpRow}>
                        {['200', '500', '1000'].map((amt) => {
                            const isSelected = topUpAmount === amt;
                            return (
                                <TouchableOpacity
                                    key={amt}
                                    style={[
                                        styles.quickTopUpPill,
                                        isSelected
                                            ? {
                                                  backgroundColor: colors.coral,
                                                  borderColor: colors.coral,
                                                  borderWidth: 1,
                                              }
                                            : {
                                                  backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                                                  borderWidth: 1,
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
                        title={`ADD ₹${topUpAmount} TO WALLET`}
                        variant="neon"
                        containerStyle={{ marginTop: 14 }}
                        onPress={handleTopUp}
                    />
                </CredCard>

                {/* Accessibility & Preferences */}
                <CredCard variant="default" style={styles.section}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                        Display & Accessibility
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

                    {/* Senior / High Contrast Mode Toggle */}
                    <View style={[styles.row, { marginTop: 12 }]}>
                        <View style={styles.rowLeft}>
                            <Accessibility size={22} color={colors.primary} />
                            <View>
                                <ThemedText style={[styles.rowTitle, { color: colors.text }]}>
                                    Senior & Easy View
                                </ThemedText>
                                <ThemedText style={{ color: colors.textMuted, ...FONTS.caption }}>
                                    Larger touch targets and simplified details
                                </ThemedText>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.toggleContainer,
                                {
                                    backgroundColor: user.isSeniorMode ? colors.primary : colors.surfaceMuted,
                                    borderWidth: 1,
                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                },
                            ]}
                            onPress={toggleSeniorMode}
                            activeOpacity={0.8}
                        >
                            <View
                                style={[
                                    styles.toggleKnob,
                                    {
                                        backgroundColor: '#FFFFFF',
                                        transform: [{ translateX: user.isSeniorMode ? 20 : 2 }],
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
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    userTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.chip,
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
    walletCard: {
        padding: SPACING.md,
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
    topUpRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    quickTopUpPill: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: RADIUS.pill,
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
