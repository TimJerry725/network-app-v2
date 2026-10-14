import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    Sparkles,
    Accessibility,
} from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ThemedText } from '../../components/ThemedText';
import { NeoCard } from '../../components/NeoCard';
import { GradientButton } from '../../components/GradientButton';
import { FONTS, SPACING, SHADOWS, RADIUS } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';

export default function ProfileScreen() {
    const { colors, theme, setTheme } = useAppTheme();
    const { user, topUpWallet, toggleSeniorMode } = useVehicles();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [topUpAmount, setTopUpAmount] = useState('500');

    const handleThemeToggle = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleTopUp = () => {
        const val = parseFloat(topUpAmount);
        if (isNaN(val) || val <= 0) {
            Alert.alert('Invalid amount', 'Please enter a valid amount to recharge your wallet.');
            return;
        }
        topUpWallet(val);
        Alert.alert('Wallet Recharged', `₹${val.toFixed(2)} added to your Iris EV Wallet successfully.`);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color={colors.text} />
                </TouchableOpacity>
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Profile & Account</ThemedText>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* User Card */}
                <NeoCard gradientBorder style={styles.profileCard}>
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
                </NeoCard>

                {/* Iris EV Wallet Balance Card */}
                <NeoCard style={styles.walletCard}>
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
                        {['200', '500', '1000'].map((amt) => (
                            <TouchableOpacity
                                key={amt}
                                style={[
                                    styles.quickTopUpPill,
                                    { backgroundColor: colors.surfaceMuted },
                                ]}
                                onPress={() => setTopUpAmount(amt)}
                            >
                                <ThemedText style={{ color: colors.text, ...FONTS.caption, fontWeight: '700' }}>
                                    +₹{amt}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <GradientButton
                        title={`Quick Add ₹${topUpAmount} to Wallet`}
                        style={{ marginTop: 12 }}
                        onPress={handleTopUp}
                    />
                </NeoCard>

                {/* Accessibility & Preferences */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
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
                                { backgroundColor: theme === 'dark' ? colors.primary : colors.surfaceMuted },
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
                                { backgroundColor: user.isSeniorMode ? colors.primary : colors.surfaceMuted },
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
                </View>

                {/* 24/7 Driver Support Card */}
                <NeoCard style={styles.supportCard}>
                    <View style={styles.supportRow}>
                        <PhoneCall size={20} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                            <ThemedText style={FONTS.bodyStrong}>24/7 CPO Driver Helpline</ThemedText>
                            <ThemedText style={{ color: colors.textMuted, ...FONTS.caption }}>
                                Need help unplugging or with station faults? Call 1800-419-IRIS
                            </ThemedText>
                        </View>
                    </View>
                </NeoCard>
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
        padding: SPACING.xs,
        marginLeft: -SPACING.xs,
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
        borderRadius: 26,
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
        borderRadius: RADIUS.pill,
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
        borderRadius: RADIUS.input,
    },
    section: {
        borderRadius: RADIUS.card,
        padding: SPACING.md,
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
        borderRadius: 12,
        justifyContent: 'center',
    },
    toggleKnob: {
        width: 20,
        height: 20,
        borderRadius: 10,
        position: 'absolute',
    },
    supportCard: {
        padding: SPACING.md,
    },
    supportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
});
