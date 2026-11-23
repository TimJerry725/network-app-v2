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
import { BENTO } from '../constants/Colors';
import { ThemedText } from '../components/ThemedText';

const Tab = createBottomTabNavigator();

/**
 * iOS 27 bar (from the UI/UX document): a floating Liquid Glass pill with
 * Home, Trips, Favorites, Sessions, and the Scan button on its own, to the right.
 * While a charge is running, the Scan button shows the live battery instead.
 */
const ITEMS = [
    { name: 'Map', label: 'Home', Icon: House },
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

    const onScanScreen = focusedName === 'Scan';
    return (
        <View style={[styles.outer, { bottom: Math.max(16, insets.bottom + 4) }]} pointerEvents="box-none">
            <View />
            {!onScanScreen ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={live ? `Charging ${Math.round(activeSession?.currentSoc ?? 0)} percent. Open live charge` : 'Scan to charge'}
                    onPress={() => {
                        tap();
                        if (live && activeSession) goRoot('ChargingSession', { stationId: activeSession.stationId, connectorId: activeSession.connectorId });
                        else goTab('Scan');
                    }}
                    style={({ pressed }) => [styles.scan, { backgroundColor: BENTO.light.blue.bg, opacity: pressed ? 0.88 : 1 }]}
                >
                    {live ? (
                        <View style={{ alignItems: 'center' }}>
                            <Zap size={20} color="#0B0B0F" fill="#0B0B0F" />
                            <ThemedText style={styles.scanLabel}>{Math.round(activeSession?.currentSoc ?? 0)}%</ThemedText>
                        </View>
                    ) : (
                        <ScanLine size={30} color="#0B0B0F" strokeWidth={2.2} />
                    )}
                </Pressable>
            ) : null}
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
    outer: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', zIndex: 99999, elevation: 999 },
    home: { width: 56, height: 56, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    scan: { width: 68, height: 68, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#6DB8F2', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
    scanLabel: { fontSize: 11, fontWeight: '800', color: '#0B0B0F' },
});
