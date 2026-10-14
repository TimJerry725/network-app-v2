import React from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import TripPlannerScreen from '../screens/Explore';
import StationMapScreen from '../screens/Home/StationMapScreen';
import VehicleListScreen from '../screens/Profile/VehicleListScreen';
import ScanScreen from '../screens/Charging/ScanScreen';
import FavoritesScreen from '../screens/Favorites/FavoritesScreen';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '../constants/Tokens';
import { Neo3DIcon } from '../components/Neo3DIcon';

const Tab = createBottomTabNavigator();

type TabConfig = {
    name: string;
    icon: string;
    label: string;
};

const TAB_CONFIG: TabConfig[] = [
    { name: 'Map', icon: 'location-dot', label: 'Map' },
    { name: 'Explore', icon: 'route', label: 'Trip Planner' },
    { name: 'Scan', icon: 'qrcode', label: 'Scan' },
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
        <View style={styles.barOuter}>
            <View
                style={[
                    styles.barContainer,
                    {
                        backgroundColor: isDark ? '#070709' : '#FFFFFF',
                        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        paddingBottom: Math.max(10, insets.bottom),
                        height: 70 + Math.max(10, insets.bottom),
                    },
                ]}
            >
                {/* Inset specular top light highlight */}
                <View
                    style={[
                        styles.topHairline,
                        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' },
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
                        <View key={route.key} style={styles.tabSlot}>
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
        bottom: 0,
        left: 0,
        right: 0,
    },
    barContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        paddingHorizontal: SPACING.xs,
        position: 'relative',
    },
    topHairline: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
    },
    tabSlot: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
