import React from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Moon, Sun, Wallet, Plus, User, LifeBuoy, Pencil, CarFront } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ThemedText } from '../../components/ThemedText';
import { useVehicles } from '../../context/VehicleContext';

/** Profile: who you are, your vehicle, then dark mode, help and wallet. */
export default function ProfileScreen() {
    const { colors, theme, setTheme, isDark } = useAppTheme();
    const { user, topUpWallet, selectedVehicle, vehicles } = useVehicles();
    const car = selectedVehicle ?? vehicles[0];
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const tap = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };
    const callHelp = () =>
        Alert.alert('24/7 driver help', 'Charger fault, stuck gun, or payment issue? Talk to a person now.', [
            { text: 'Call 1800-419-4747', onPress: () => Linking.openURL('tel:18004194747').catch(() => {}) },
            { text: 'Not now', style: 'cancel' },
        ]);
    const addMoney = () =>
        Alert.alert('Add money', `Balance ₹${user.walletBalance.toFixed(2)}`, [
            ...[200, 500, 1000, 2000].map((amt) => ({
                text: `Add ₹${amt}`,
                onPress: () => {
                    topUpWallet(amt);
                    Alert.alert('Wallet recharged', `₹${amt.toFixed(2)} added to your Iris EV Wallet.`);
                },
            })),
            { text: 'Cancel', style: 'cancel' as const },
        ]);

    const card = { backgroundColor: colors.surface, borderColor: colors.border };
    const soft = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                    onPress={() => {
                        tap();
                        navigation.goBack();
                    }}
                    style={[styles.circle, card]}
                    activeOpacity={0.8}
                >
                    <ChevronLeft size={20} color={colors.text} strokeWidth={2.5} />
                </TouchableOpacity>
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Profile</ThemedText>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Edit profile"
                    onPress={() => {
                        tap();
                        navigation.navigate('EditProfile', { tab: 'profile' });
                    }}
                    style={[styles.circle, card]}
                    activeOpacity={0.8}
                >
                    <Pencil size={16} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, gap: 12 }} showsVerticalScrollIndicator={false}>
                {/* Who you are */}
                <View style={[styles.card, card]}>
                    <View style={styles.row}>
                        <View style={[styles.avatar, { backgroundColor: soft }]}>
                            <User size={26} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={1}>{user.fullName}</ThemedText>
                            <ThemedText style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>{user.phone}</ThemedText>
                            <ThemedText style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>{user.email}</ThemedText>
                        </View>
                    </View>
                </View>

                {/* Your vehicle */}
                <View style={[styles.card, card]}>
                    <View style={styles.row}>
                        <View style={[styles.avatar, { backgroundColor: soft }]}>
                            <CarFront size={24} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                                {car ? `${car.make} ${car.model}` : 'No vehicle yet'}
                            </ThemedText>
                            <ThemedText style={[styles.sub, { color: colors.textMuted }]}>{car ? car.registrationNumber : 'Connect your EV'}</ThemedText>
                        </View>
                        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('EditProfile', { tab: 'vehicle' })} hitSlop={8}>
                            <ThemedText style={[styles.link, { color: colors.primary }]}>Manage</ThemedText>
                        </TouchableOpacity>
                    </View>
                    {car ? (
                        <View style={styles.stats}>
                            {[
                                ['Battery', `${car.currentBattery}%`],
                                ['Range', `${car.estRangeKm} km`],
                                ['Max DC', `${car.maxDcRateKw} kW`],
                                ['Plug', car.connectorType],
                            ].map(([label, value]) => (
                                <View key={label} style={[styles.stat, { backgroundColor: soft }]}>
                                    <ThemedText style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>{value}</ThemedText>
                                    <ThemedText style={[styles.statLabel, { color: colors.textMuted }]}>{label}</ThemedText>
                                </View>
                            ))}
                        </View>
                    ) : null}
                </View>

                {/* Dark mode, help, wallet */}
                <View style={[styles.card, card, { paddingVertical: 4 }]}>
                    <View style={styles.listRow}>
                        {theme === 'dark' ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
                        <ThemedText style={[styles.listTitle, { color: colors.text }]}>Dark mode</ThemedText>
                        <Switch
                            value={theme === 'dark'}
                            onValueChange={() => {
                                tap();
                                setTheme(theme === 'dark' ? 'light' : 'dark');
                            }}
                            trackColor={{ false: soft, true: colors.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <TouchableOpacity accessibilityRole="button" style={styles.listRow} onPress={callHelp} activeOpacity={0.7}>
                        <LifeBuoy size={20} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                            <ThemedText style={[styles.listTitle, { color: colors.text }]}>Help</ThemedText>
                            <ThemedText style={[styles.sub, { color: colors.textMuted }]}>24/7 helpline · 1800-419-4747</ThemedText>
                        </View>
                    </TouchableOpacity>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <TouchableOpacity accessibilityRole="button" style={styles.listRow} onPress={addMoney} activeOpacity={0.7}>
                        <Wallet size={20} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                            <ThemedText style={[styles.listTitle, { color: colors.text }]}>Wallet</ThemedText>
                            <ThemedText style={[styles.sub, { color: colors.textMuted }]}>₹{user.walletBalance.toFixed(2)}</ThemedText>
                        </View>
                        <Plus size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    circle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    card: { borderRadius: 24, borderWidth: 1, padding: 16 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    name: { fontSize: 18, fontWeight: '700' },
    sub: { fontSize: 13, fontWeight: '500', marginTop: 2 },
    link: { fontSize: 14, fontWeight: '700' },
    stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
    stat: { flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
    statValue: { fontSize: 14, fontWeight: '700' },
    statLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
    listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8 },
    listTitle: { flex: 1, fontSize: 16, fontWeight: '600' },
    divider: { height: StyleSheet.hairlineWidth },
});
