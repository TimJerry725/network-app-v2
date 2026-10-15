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
    { name: 'Map', icon: 'map-location-dot', label: 'Map' },
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
                { bottom: Math.max(12, insets.bottom) },
            ]}
            pointerEvents="box-none"
        >
            {/* 3D Physical Drop-Plate Shadow Slab */}
            <View
                style={[
                    styles.dockShadowPlate,
                    { backgroundColor: isDark ? '#000000' : '#141418' },
                ]}
            />

            {/* Elevated Spatial Neo-Brutalist Dock Chassis */}
            <View
                style={[
                    styles.dockContainer,
                    {
                        backgroundColor: isDark ? '#101016' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#000000',
                        borderBottomColor: isDark ? '#000000' : '#000000',
                    },
                ]}
            >
                {/* Specular Top Light Reflection */}
                <View
                    style={[
                        styles.dockSpecularLine,
                        {
                            backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.18)'
                                : 'rgba(255, 255, 255, 0.95)',
                        },
                    ]}
                />

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
        left: 14,
        right: 14,
        alignItems: 'center',
        zIndex: 999,
    },
    dockShadowPlate: {
        position: 'absolute',
        top: 3.5,
        left: 0,
        right: 0,
        bottom: -3.5,
        borderRadius: RADIUS.bottomSheet,
    },
    dockContainer: {
        width: '100%',
        height: 64,
        borderRadius: RADIUS.bottomSheet,
        borderWidth: 1.8,
        borderBottomWidth: 3.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 6,
        position: 'relative',
        overflow: 'visible',
    },
    dockSpecularLine: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        height: 1.2,
        borderRadius: 1,
    },
    wingTabSlot: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    centerScanSlot: {
        width: 68,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        overflow: 'visible',
    },
});
