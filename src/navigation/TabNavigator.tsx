import React from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import TripPlannerScreen from '../screens/Explore';
import StationMapScreen from '../screens/Home/StationMapScreen';
import VehicleListScreen from '../screens/Profile/VehicleListScreen';
import ScanScreen from '../screens/Charging/ScanScreen';
import FavoritesScreen from '../screens/Favorites/FavoritesScreen';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RADIUS, SPACING } from '../constants/Tokens';
import { Neo3DIcon } from '../components/Neo3DIcon';

const Tab = createBottomTabNavigator();

type TabConfig = {
    name: string;
    icon: string;
    label: string;
};

const TAB_CONFIG: TabConfig[] = [
    { name: 'Map', icon: 'map', label: 'Map' },
    { name: 'Explore', icon: 'compass', label: 'Trip Planner' },
    { name: 'Scan', icon: 'bolt-lightning', label: 'Scan' },
    { name: 'Favorite', icon: 'heart', label: 'Favorites' },
    { name: 'Vehicles', icon: 'clock-rotate-left', label: 'Sessions' },
];

function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();

    const currentTabRoute = state.routes[state.index];
    const shouldHideTabBar =
        Boolean((currentTabRoute.params as { hideTabBar?: boolean } | undefined)?.hideTabBar);

    if (shouldHideTabBar) {
        return null;
    }

    return (
        <View
            style={[
                styles.barOuter,
                { bottom: Math.max(16, insets.bottom + 6) },
            ]}
            pointerEvents="box-none"
        >
            {/* Elevated Minimal Floating Capsule Dock Chassis */}
            <View
                style={[
                    styles.dockContainer,
                    {
                        backgroundColor: isDark ? 'rgba(20, 21, 28, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    },
                ]}
            >
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;
                    const config = TAB_CONFIG.find((t) => t.name === route.name) ?? {
                        name: route.name,
                        icon: 'circle',
                        label: route.name,
                    };
                    const isScan = route.name === 'Scan';

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <View
                            key={route.key}
                            style={isScan ? styles.centerScanSlot : styles.wingTabSlot}
                        >
                            <Neo3DIcon
                                name={config.icon}
                                label={config.label}
                                isSelected={isFocused}
                                onPress={onPress}
                                isPrimaryAction={isScan}
                            />
                        </View>
                    );
                })}
            </View>
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
            }}
        >
            <Tab.Screen name="Map" component={StationMapScreen} />
            <Tab.Screen name="Explore" component={TripPlannerScreen} />
            <Tab.Screen name="Scan" component={ScanScreen} />
            <Tab.Screen name="Favorite" component={FavoritesScreen} />
            <Tab.Screen name="Vehicles" component={VehicleListScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    barOuter: {
        position: 'absolute',
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 999,
    },
    dockContainer: {
        width: '100%',
        height: 60,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        position: 'relative',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    wingTabSlot: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    centerScanSlot: {
        width: 60,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
});
