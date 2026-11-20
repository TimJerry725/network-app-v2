import React from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { House, Compass, Heart, History, ScanLine, Zap } from '../components/sf/icons';
import HomeScreen from '../screens/Home/HomeScreen';
import TripPlannerScreen from '../screens/Explore';
import FavoritesScreen from '../screens/Favorites/FavoritesScreen';
import VehicleListScreen from '../screens/Profile/VehicleListScreen';
import ScanScreen from '../screens/Charging/ScanScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useCharging } from '../context/ChargingContext';
import { Glass } from '../components/glass/Glass';
import { ThemedText } from '../components/ThemedText';

const Tab = createBottomTabNavigator();

/**
 * iOS 27 bar (from the UI/UX document): a floating Liquid Glass pill with
 * Home, Trips, Favorites, Sessions, and the Scan button on its own, to the right.
 * While a charge is running, the Scan button shows the live battery instead.
 */
const ITEMS = [
    { name: 'Map', label: 'Home', Icon: House },
    { name: 'Explore', label: 'Trips', Icon: Compass },
    { name: 'Favorite', label: 'Favorites', Icon: Heart },
    { name: 'Vehicles', label: 'Sessions', Icon: History },
] as const;

function tap() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function AppTabBar({ state, navigation }: BottomTabBarProps) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { activeSession } = useCharging();

    const current = state.routes[state.index];
    const hide = Boolean((current.params as { hideTabBar?: boolean } | undefined)?.hideTabBar);
    if (hide) return null;

    const focusedName = current.name;
    const live = !!activeSession && activeSession.status !== 'COMPLETED' && activeSession.status !== 'STOPPED';

    const goTab = (name: string) => {
        const route = state.routes.find((r) => r.name === name);
        if (!route) return;
        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (focusedName !== name && !event.defaultPrevented) navigation.navigate(name);
    };
    const goRoot = (name: string, params?: object) =>
        (navigation as any).getParent()?.navigate(name, params) ?? (navigation as any).navigate(name, params);

    const renderItem = ({ name, label, Icon }: (typeof ITEMS)[number]) => {
        const focused = focusedName === name;
        const tint = focused ? colors.primary : colors.textMuted;
        return (
            <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                onPress={() => {
                    tap();
                    goTab(name);
                }}
                style={styles.itemWrap}
            >
                <Icon size={26} color={tint} strokeWidth={2} fill={focused ? tint : 'none'} />
                <ThemedText style={[styles.label, { color: tint }]} numberOfLines={1}>
                    {label}
                </ThemedText>
            </Pressable>
        );
    };

    return (
        <View style={[styles.outer, { bottom: Math.max(10, insets.bottom - 4) }]} pointerEvents="box-none">
            <Glass radius={32} style={styles.dock}>
                {ITEMS.slice(0, 2).map(renderItem)}
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={live ? `Charging ${Math.round(activeSession?.currentSoc ?? 0)} percent. Open live charge` : 'Scan to charge'}
                    onPress={() => {
                        tap();
                        if (live && activeSession) goRoot('ChargingSession', { stationId: activeSession.stationId, connectorId: activeSession.connectorId });
                        else goTab('Scan');
                    }}
                    style={({ pressed }) => [styles.scan, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
                >
                    {live ? (
                        <View style={styles.liveCol}>
                            <Zap size={18} color="#FFFFFF" fill="#FFFFFF" />
                            <ThemedText style={styles.livePct}>{Math.round(activeSession?.currentSoc ?? 0)}%</ThemedText>
                        </View>
                    ) : (
                        <ScanLine size={30} color="#FFFFFF" strokeWidth={2.2} />
                    )}
                </Pressable>
                {ITEMS.slice(2).map(renderItem)}
            </Glass>
        </View>
    );
}

export default function TabNavigator() {
    return (
        <Tab.Navigator
            initialRouteName="Map"
            tabBar={(props) => <AppTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarStyle: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 },
            }}
        >
            <Tab.Screen name="Map" component={HomeScreen} />
            <Tab.Screen name="Explore" component={TripPlannerScreen} />
            <Tab.Screen name="Favorite" component={FavoritesScreen} />
            <Tab.Screen name="Vehicles" component={VehicleListScreen} />
            <Tab.Screen name="Scan" component={ScanScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    outer: { position: 'absolute', left: 20, right: 20, zIndex: 99999, elevation: 999 },
    dock: { height: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
    itemWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, height: 64 },
    label: { fontSize: 11, fontWeight: '600' },
    scan: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
    liveCol: { alignItems: 'center', justifyContent: 'center' },
    livePct: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
});
