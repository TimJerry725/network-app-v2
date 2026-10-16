import React, { useRef } from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { House, Compass, ScanLine, Heart, History } from 'lucide-react-native';
import TripPlannerScreen from '../screens/Explore';
import StationMapScreen from '../screens/Home/StationMapScreen';
import VehicleListScreen from '../screens/Profile/VehicleListScreen';
import ScanScreen from '../screens/Charging/ScanScreen';
import FavoritesScreen from '../screens/Favorites/FavoritesScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

type TabConfig = {
    name: string;
    label: string;
};

const TAB_CONFIG: TabConfig[] = [
    { name: 'Map', label: 'Map' },
    { name: 'Explore', label: 'Trip Planner' },
    { name: 'Scan', label: 'Scan' },
    { name: 'Favorite', label: 'Favorites' },
    { name: 'Vehicles', label: 'Sessions' },
];

function getTabIcon(name: string, isFocused: boolean) {
    const iconColor = isFocused ? '#0A0D14' : 'rgba(255, 255, 255, 0.45)';
    const strokeWidth = isFocused ? 2.4 : 1.9;
    const size = 20;

    switch (name) {
        case 'Map':
            return <House size={size} color={iconColor} strokeWidth={strokeWidth} />;
        case 'Explore':
            return <Compass size={size} color={iconColor} strokeWidth={strokeWidth} />;
        case 'Scan':
            return <ScanLine size={size} color={iconColor} strokeWidth={strokeWidth} />;
        case 'Favorite':
            return (
                <Heart
                    size={size}
                    color={iconColor}
                    fill={isFocused ? '#0A0D14' : 'none'}
                    strokeWidth={strokeWidth}
                />
            );
        case 'Vehicles':
            return <History size={size} color={iconColor} strokeWidth={strokeWidth} />;
        default:
            return <House size={size} color={iconColor} strokeWidth={strokeWidth} />;
    }
}

interface TabBarItemProps {
    name: string;
    label: string;
    isFocused: boolean;
    onPress: () => void;
}

function TabBarItem({ name, label, isFocused, onPress }: TabBarItemProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.88,
            useNativeDriver: true,
            speed: 30,
            bounciness: 0,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 8,
        }).start();
    };

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={label}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            style={styles.tabSlot}
        >
            <Animated.View
                style={[
                    styles.tabInner,
                    isFocused && styles.tabInnerActive,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                {getTabIcon(name, isFocused)}
            </Animated.View>
        </Pressable>
    );
}

function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
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
                { bottom: Math.max(18, insets.bottom + 8) },
            ]}
            pointerEvents="box-none"
        >
            {/* Floating Matte Obsidian Capsule Dock */}
            <View style={styles.dockContainer}>
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;
                    const config = TAB_CONFIG.find((t) => t.name === route.name) ?? {
                        name: route.name,
                        label: route.name,
                    };

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
                        <TabBarItem
                            key={route.key}
                            name={route.name}
                            label={config.label}
                            isFocused={isFocused}
                            onPress={onPress}
                        />
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
        zIndex: 1000,
    },
    dockContainer: {
        width: '100%',
        height: 62,
        borderRadius: 31,
        backgroundColor: '#111218',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.09)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12,
    },
    tabSlot: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabInner: {
        width: 48,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabInnerActive: {
        backgroundColor: '#BAE6FD',
    },
});
