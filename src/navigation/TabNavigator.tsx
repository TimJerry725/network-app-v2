import React from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import TripPlannerScreen from '../screens/Explore';
import StationMapScreen from '../screens/Home/StationMapScreen';
import VehicleListScreen from '../screens/Profile/VehicleListScreen';
import ScanScreen from '../screens/Charging/ScanScreen';
import FavoritesScreen from '../screens/Favorites/FavoritesScreen';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../constants/Tokens';

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
    { name: 'Favorite', icon: 'heart', label: 'Favorite' },
    { name: 'Vehicles', icon: 'clock-rotate-left', label: 'Sessions' },
];

function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();


    const currentTabRoute = state.routes[state.index];
    const currentRoute = currentTabRoute.name;
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
                        backgroundColor: colors.surface,
                        paddingBottom: insets.bottom,
                        height: 72 + insets.bottom,
                    },
                ]}
            >
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;
                    const config = TAB_CONFIG.find(t => t.name === route.name)!;
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

                    if (isScan) {
                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                activeOpacity={0.75}
                                style={styles.tabItem}
                            >
                                <View style={{ height: 22, width: 22 }} />
                                <Text
                                    style={[
                                        styles.tabLabel,
                                        {
                                            color: isFocused ? colors.primary : colors.tabIconDefault,
                                            fontWeight: isFocused ? '700' : '600',
                                        },
                                    ]}
                                >
                                    {config.label}
                                </Text>
                                <LinearGradient
                                    colors={colors.primaryGradient}
                                    style={[
                                        styles.scanButton,
                                        {
                                            backgroundColor: colors.primary,
                                        },
                                    ]}
                                >
                                    <FontAwesome6 name="bolt-lightning" size={24} color="#FFFFFF" />
                                </LinearGradient>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            activeOpacity={0.75}
                            style={styles.tabItem}
                        >
                            <FontAwesome6
                                name={config.icon}
                                size={22}
                                color={isFocused ? colors.primary : colors.tabIconDefault}
                                solid
                            />
                            <Text
                                style={[
                                    styles.tabLabel,
                                    {
                                        color: isFocused ? colors.primary : colors.tabIconDefault,
                                        fontWeight: isFocused ? '700' : '600',
                                    },
                                ]}
                            >
                                {config.label}
                            </Text>
                        </TouchableOpacity>
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
        paddingHorizontal: 0,
    },
    barContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        borderRadius: 0,
        borderWidth: 0,
        borderTopWidth: 0,
        paddingHorizontal: SPACING.sm,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 3,
    },
    tabLabel: {
        ...FONTS.label,
        fontSize: 11,
        letterSpacing: 0,
        textTransform: 'none',
    },
    scanButtonWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: SPACING.xs,
    },
    scanButton: {
        position: 'absolute',
        top: -26,
        width: 62,
        height: 62,
        borderRadius: 31,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0,
    },
    scanLabel: {
        ...FONTS.label,
        fontSize: 8,
        color: '#FFFFFF',
        marginTop: 1,
    },
});
