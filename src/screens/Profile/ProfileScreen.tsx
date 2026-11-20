import React from 'react';
import { Alert, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Pencil, Moon, Sun, LifeBuoy, Eye, Info, Plus, CreditCard, Crown, Receipt, Heart, Route, Car, Sparkles, LogOut } from '../../components/sf/icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ThemedText } from '../../components/ThemedText';
import { FONT_FAMILIES } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';
import { useWallet } from '../../context/WalletContext';
import { useCharging } from '../../context/ChargingContext';
import { Chip } from '../../components/stack/StackKit';
import { PulseButton } from '../../components/pulse/PulseKit';
import { Divider, HeaderIcon, ON_HIGHLIGHT, Panel, Row, ScreenTitle, Section, StatGrid, flat } from '../../components/flat/FlatKit';
import { formatRupees } from '../../utils/pulse';

const CAR_IMAGE = require('../../../assets/images/profile-car.webp');

export default function ProfileScreen() {
    const { colors, theme, setTheme } = useAppTheme();
    const { user, selectedVehicle, vehicles, selectVehicle, toggleSeniorMode } = useVehicles();
    const { rewardVolts } = useWallet();
    const { sessionHistory } = useCharging();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const car = selectedVehicle ?? vehicles[0] ?? null;
    const tap = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    };
    const goTab = (screen: string) => navigation.navigate('Main', { screen });
    const callHelp = () =>
        Alert.alert('24/7 driver help', 'Charger fault, stuck gun, or payment issue? Talk to a person now.', [
            { text: 'Call 1800-419-4747', onPress: () => Linking.openURL('tel:18004194747').catch(() => {}) },
            { text: 'Not now', style: 'cancel' },
        ]);
    const batteryColor = !car ? colors.textMuted : car.currentBattery < 25 ? colors.error : car.currentBattery < 50 ? colors.sun : colors.mint;
    const imgW = width - 32 - 2;

    return (
        <View style={[flat.screen, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 6, paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
                <ScreenTitle
                    title=""
                    onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
                    right={
                        <HeaderIcon label="Edit profile" onPress={() => navigation.navigate('EditProfile', { tab: 'profile' })}>
                            <Pencil size={17} color={colors.text} />
                        </HeaderIcon>
                    }
                />

                <View style={styles.me}>
                    <View style={[styles.avatar, { backgroundColor: colors.lime }]}>
                        <ThemedText style={styles.avatarText}>{user.fullName.charAt(0)}</ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                        <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={1}>{user.fullName}</ThemedText>
                        <ThemedText style={[flat.caption, { color: colors.textMuted }]}>
                            {user.membershipTier} member · {sessionHistory.length} charges
                        </ThemedText>
                    </View>
                </View>

                {/* Car */}
                <Section title="Your car" action="Manage" onAction={() => navigation.navigate('EditProfile', { tab: 'vehicle' })}>
                    <Panel padded={false}>
                        <View style={styles.carImageWrap}>
                            <Image source={CAR_IMAGE} style={{ width: imgW, height: imgW * 0.5 }} resizeMode="contain" accessibilityLabel={car ? `${car.make} ${car.model}` : 'Your car'} />
                        </View>
                        <View style={{ padding: 16 }}>
                            <View style={styles.carHead}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={[flat.h2, { color: colors.text }]} numberOfLines={1}>
                                        {car ? `${car.make} ${car.model}` : 'No car yet'}
                                    </ThemedText>
                                    <ThemedText style={[flat.caption, { color: colors.textMuted }]}>{car?.registrationNumber ?? 'Add your car to match chargers'}</ThemedText>
                                </View>
                                {car ? <ThemedText style={[styles.pct, { color: colors.text }]}>{car.currentBattery}%</ThemedText> : null}
                            </View>
                            {car ? (
                                <>
                                    <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
                                        <View style={[styles.fill, { width: `${car.currentBattery}%`, backgroundColor: batteryColor }]} />
                                        <View style={[styles.tick, { left: `${car.chargeTarget}%`, backgroundColor: colors.text }]} />
                                    </View>
                                    <StatGrid
                                        columns={3}
                                        items={[
                                            { label: 'Range', value: `${car.estRangeKm} km` },
                                            { label: 'Max DC', value: `${car.maxDcRateKw} kW` },
                                            { label: 'Plug', value: car.connectorType },
                                        ]}
                                    />
                                </>
                            ) : null}
                            {vehicles.length > 1 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
                                    {vehicles.map((v) => (
                                        <Chip key={v.id} label={`${v.make} ${v.model.split(' ')[0]}`} active={v.id === car?.id} onPress={() => { tap(); selectVehicle(v.id); }} />
                                    ))}
                                </ScrollView>
                            ) : null}
                        </View>
                    </Panel>
                </Section>

                {/* Wallet: the one highlight */}
                <Section title="Wallet">
                    <Panel tone="highlight" onPress={() => navigation.navigate('Wallet')} accessibilityLabel="Open wallet">
                        <ThemedText style={[flat.caption, { color: ON_HIGHLIGHT.sub }]}>Iris Wallet balance</ThemedText>
                        <ThemedText style={styles.balance}>{formatRupees(user.walletBalance, 2)}</ThemedText>
                        <ThemedText style={[flat.caption, { color: ON_HIGHLIGHT.sub }]}>
                            {rewardVolts.toLocaleString('en-IN')} Volts
                        </ThemedText>
                    </Panel>
                    <PulseButton title="Add money" variant="ghost" size="md" icon={<Plus size={15} color={colors.text} />} onPress={() => navigation.navigate('Wallet', { focusTopUp: true })} style={{ marginTop: 8 }} />
                </Section>

                <Section title="Cards and membership">
                    <Panel padded={false}>
                        <Row icon={<CreditCard size={16} color={colors.text} />} title="RFID card" subtitle={`${user.rfidTag} · tap on any Iris charger`} onPress={() => Alert.alert('RFID card', `Tap ${user.rfidTag} on any Iris charger to start without your phone. Lost it? Call 1800-419-4747 to block it.`)} chevron />
                        <Divider inset={60} />
                        <Row icon={<Crown size={16} color={colors.text} />} title={`${user.membershipTier} membership`} subtitle="Earn Volts on top-ups and off-peak charges" onPress={() => navigation.navigate('Wallet')} chevron />
                        <Divider inset={60} />
                        <Row icon={<Sparkles size={16} color={colors.text} />} title={`${rewardVolts.toLocaleString('en-IN')} Volts`} subtitle="10 Volts = ₹1" onPress={() => navigation.navigate('Wallet')} chevron />
                    </Panel>
                </Section>

                <Section title="Shortcuts">
                    <Panel padded={false}>
                        <Row icon={<Receipt size={16} color={colors.text} />} title="Sessions and invoices" onPress={() => goTab('Vehicles')} chevron />
                        <Divider inset={60} />
                        <Row icon={<Heart size={16} color={colors.text} />} title="Saved stations" onPress={() => goTab('Favorite')} chevron />
                        <Divider inset={60} />
                        <Row icon={<Route size={16} color={colors.text} />} title="Trips" onPress={() => goTab('Explore')} chevron />
                        <Divider inset={60} />
                        <Row icon={<Car size={16} color={colors.text} />} title="Manage cars" onPress={() => navigation.navigate('EditProfile', { tab: 'vehicle' })} chevron />
                    </Panel>
                </Section>

                <Section title="Settings">
                    <Panel padded={false}>
                        <Row icon={<Pencil size={16} color={colors.text} />} title="Contact details" subtitle={`${user.phone} · ${user.email}`} onPress={() => navigation.navigate('EditProfile', { tab: 'profile' })} chevron />
                        <Divider inset={60} />
                        <Toggle icon={theme === 'dark' ? <Moon size={16} color={colors.text} /> : <Sun size={16} color={colors.text} />} title="Dark mode" value={theme === 'dark'} onToggle={() => { tap(); setTheme(theme === 'dark' ? 'light' : 'dark'); }} />
                        <Divider inset={60} />
                        <Toggle icon={<Eye size={16} color={colors.text} />} title="Easy view" subtitle="Bigger text and buttons" value={user.isSeniorMode} onToggle={() => { tap(); toggleSeniorMode(); }} />
                        <Divider inset={60} />
                        <Row icon={<LifeBuoy size={16} color={colors.text} />} title="24/7 driver helpline" subtitle="1800-419-4747" onPress={callHelp} chevron />
                        <Divider inset={60} />
                        <Row icon={<Info size={16} color={colors.text} />} title="About Iris" subtitle="Version 1.0.0 · Terms · Privacy" onPress={() => Alert.alert('Iris EV', 'Version 1.0.0')} chevron />
                    </Panel>
                </Section>

                <Panel padded={false} style={{ marginTop: 16 }}>
                    <Row
                        icon={<LogOut size={16} color={colors.error} />}
                        title="Log out"
                        titleStyle={{ color: colors.error }}
                        onPress={() =>
                            Alert.alert('Log out?', 'You will need to sign in again.', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Log out', style: 'destructive', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) },
                            ])
                        }
                    />
                </Panel>
                <View style={{ height: 8 }} />
            </ScrollView>
        </View>
    );
}

function Toggle({ icon, title, subtitle, value, onToggle }: { icon: React.ReactNode; title: string; subtitle?: string; value: boolean; onToggle: () => void }) {
    const { colors } = useAppTheme();
    return (
        <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={title} onPress={onToggle} style={styles.toggleRow}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(0,122,255,0.12)' }]}>{React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { color: colors.primary }) : icon}</View>
            <View style={{ flex: 1 }}>
                <ThemedText style={[styles.rowTitle, { color: colors.text }]}>{title}</ThemedText>
                {subtitle ? <ThemedText style={[flat.caption, { color: colors.textMuted }]}>{subtitle}</ThemedText> : null}
            </View>
            <View style={[styles.toggle, { backgroundColor: value ? colors.success : 'rgba(118,118,128,0.3)' }]}>
                <View style={[styles.knob, { backgroundColor: '#FFFFFF', transform: [{ translateX: value ? 20 : 0 }] }]} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    me: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 24, color: '#FFFFFF' },
    name: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 24, letterSpacing: -0.6 },
    carImageWrap: { backgroundColor: 'transparent', alignItems: 'center', paddingVertical: 8 },
    carHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pct: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 26, letterSpacing: -0.8 },
    track: { height: 10, borderRadius: 5, marginTop: 12, marginBottom: 8, justifyContent: 'center' },
    fill: { height: 10, borderRadius: 5 },
    tick: { position: 'absolute', width: 3, height: 18, borderRadius: 2, marginLeft: -1.5 },
    balance: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 34, lineHeight: 42, letterSpacing: -1.2, color: '#FFFFFF', marginVertical: 2.0 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, minHeight: 56 },
    rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    rowTitle: { fontFamily: FONT_FAMILIES.bold, fontSize: 15 },
    toggle: { width: 48, height: 28, borderRadius: 14, padding: 4, justifyContent: 'center' },
    knob: { width: 22, height: 22, borderRadius: 11 },
});
