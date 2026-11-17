import React, { useRef } from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { House, ScanLine, Receipt, Route, Heart, Zap } from 'lucide-react-native';
import HomeScreen from '../screens/Home/HomeScreen';
import TripPlannerScreen from '../screens/Explore';
import FavoritesScreen from '../screens/Favorites/FavoritesScreen';
import VehicleListScreen from '../screens/Profile/VehicleListScreen';
import ScanScreen from '../screens/Charging/ScanScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useCharging } from '../context/ChargingContext';
import { useVehicles } from '../context/VehicleContext';
import { ThemedText } from '../components/ThemedText';
import { FONT_FAMILIES } from '../constants/Tokens';

const Tab = createBottomTabNavigator();

/**
 * Navigation built around what drivers do most (from the review research):
 *   1. find a working charger     → Home
 *   2. start / watch a charge     → big centre button (turns into a live-charge button)
 *   3. plan a trip                → Trips (the product's headline feature)
 *   4. find a bill or past charge → Sessions
 *   5. keep go-to stations        → Saved
 * Wallet balance already shows on Home. Profile opens from the Home avatar.
 */

const INK = '#15151C';
const LIME = '#A996FF';

function tap(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
    if (Platform.OS !== 'web') Haptics.impactAsync(style).catch(() => {});
}

function DockItem({
    label,
    icon,
    focused,
    onPress,
    badge,
}: {
    label: string;
    icon: React.ReactNode;
    focused: boolean;
    onPress: () => void;
    badge?: boolean;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
                tap();
                onPress();
            }}
            style={styles.item}
        >
            <View style={[styles.itemIcon, focused && styles.itemIconOn]}>
                {icon}
                {badge ? <View style={styles.badge} /> : null}
            </View>
            <ThemedText style={[styles.itemLabel, { color: focused ? LIME : 'rgba(255,255,255,0.55)' }]} numberOfLines={1}>
                {label}
            </ThemedText>
        </Pressable>
    );
}

function CenterButton({ focused, onPress }: { focused: boolean; onPress: () => void }) {
    const { activeSession } = useCharging();
    const scale = useRef(new Animated.Value(1)).current;
    const live = !!activeSession && activeSession.status !== 'COMPLETED' && activeSession.status !== 'STOPPED';
    const soc = activeSession ? Math.round(activeSession.currentSoc) : 0;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={live ? `Charging ${soc} percent. Open live charge` : 'Scan to charge'}
            onPressIn={() => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 40, bounciness: 0 }).start()}
            onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10 }).start()}
            onPress={() => {
                tap(Haptics.ImpactFeedbackStyle.Medium);
                onPress();
            }}
            style={styles.centerWrap}
        >
            <Animated.View style={[styles.center, focused && !live && styles.centerFocused, { transform: [{ scale }] }]}>
                {live ? (
                    <>
                        <Zap size={16} color="#0B0B0F" fill="#0B0B0F" />
                        <ThemedText style={styles.centerPct}>{soc}%</ThemedText>
                    </>
                ) : (
                    <ScanLine size={28} color="#0B0B0F" strokeWidth={2.4} />
                )}
            </Animated.View>
            <ThemedText style={[styles.itemLabel, { color: LIME, marginTop: 4 }]}>{live ? 'Charging' : 'Scan'}</ThemedText>
        </Pressable>
    );
}

function AppTabBar({ state, navigation }: BottomTabBarProps) {
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

    // Wallet and Profile are full screens above the tabs
    const goRoot = (name: string, params?: object) =>
        (navigation as any).getParent()?.navigate(name, params) ?? (navigation as any).navigate(name, params);

    return (
        <>
            <View style={[styles.barOuter, { bottom: Math.max(14, insets.bottom + 6) }]} pointerEvents="box-none">
                <View style={styles.dock}>
                    <DockItem label="Home" focused={focusedName === 'Map'} icon={<House size={21} color={focusedName === 'Map' ? '#0B0B0F' : '#FFFFFF'} strokeWidth={2.2} />} onPress={() => goTab('Map')} />
                    <DockItem label="Trips" focused={focusedName === 'Explore'} icon={<Route size={21} color={focusedName === 'Explore' ? '#0B0B0F' : '#FFFFFF'} strokeWidth={2.2} />} onPress={() => goTab('Explore')} />
                    <View style={styles.centerSlot} />
                    <DockItem label="Sessions" focused={focusedName === 'Vehicles'} icon={<Receipt size={21} color={focusedName === 'Vehicles' ? '#0B0B0F' : '#FFFFFF'} strokeWidth={2.2} />} onPress={() => goTab('Vehicles')} />
                    <DockItem label="Saved" focused={focusedName === 'Favorite'} icon={<Heart size={21} color={focusedName === 'Favorite' ? '#0B0B0F' : '#FFFFFF'} strokeWidth={2.2} fill={focusedName === 'Favorite' ? '#0B0B0F' : 'none'} />} onPress={() => goTab('Favorite')} />
                </View>
                <View style={styles.centerFloat} pointerEvents="box-none">
                    <CenterButton
                        focused={focusedName === 'Scan'}
                        onPress={() => {
                            if (live && activeSession) {
                                goRoot('ChargingSession', { stationId: activeSession.stationId, connectorId: activeSession.connectorId });
                            } else {
                                goTab('Scan');
                            }
                        }}
                    />
                </View>
            </View>

        </>
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
    barOuter: { position: 'absolute', left: 14, right: 14, alignItems: 'center', zIndex: 99999, elevation: 999 },
    dock: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 66,
        borderRadius: 26,
        backgroundColor: INK,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 18,
        elevation: 999,
    },
    item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 56 },
    itemIcon: { width: 44, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    itemIconOn: { backgroundColor: LIME },
    itemLabel: { fontFamily: FONT_FAMILIES.bold, fontSize: 10.5, letterSpacing: 0.1 },
    badge: { position: 'absolute', top: 2, right: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: '#7B5CFF', borderWidth: 1.5, borderColor: INK },
    centerSlot: { flex: 1.1 },
    centerFloat: { position: 'absolute', top: -22, alignSelf: 'center' },
    centerWrap: { alignItems: 'center' },
    center: {
        width: 66,
        height: 66,
        borderRadius: 24,
        backgroundColor: LIME,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#0B0B0F',
        shadowColor: LIME,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 1000,
    },
    centerFocused: { backgroundColor: '#CBBFFF' },
    centerPct: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 15, color: '#0B0B0F', marginTop: 1 },
});
