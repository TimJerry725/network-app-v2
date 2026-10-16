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
import { useAppTheme } from '../hooks/useAppTheme';

const Tab = createBottomTabNavigator();

type TabConfig = {
    name: string;
    label: string;
};

const TAB_CONFIG: TabConfig[] = [
    { name: 'Map', label: 'Map' },
    { name: 'Explore', label: 'Trip Planner' },
    { name: 'Favorite', label: 'Favorites' },
    { name: 'Vehicles', label: 'Sessions' },
    { name: 'Scan', label: 'Scan' },
];

function getTabIcon(name: string, isFocused: boolean, isDark: boolean) {
    const strokeWidth = isFocused ? 2.4 : 1.9;
    const size = 20;

    let iconColor: string;
    if (isFocused) {
        switch (name) {
            case 'Map':
                iconColor = '#38BDF8'; // Ice Blue
                break;
            case 'Explore':
                iconColor = '#5B61F6'; // Electric Lavender
                break;
            case 'Favorite':
                iconColor = '#FF5B45'; // Sunset Coral
                break;
            case 'Vehicles':
                iconColor = '#10B981'; // Neo Mint
                break;
            default:
                iconColor = isDark ? '#FFFFFF' : '#0A0D14';
        }
    } else {
        iconColor = isDark ? 'rgba(255, 255, 255, 0.42)' : 'rgba(0, 0, 0, 0.38)';
    }

    switch (name) {
        case 'Map':
            return <House size={size} color={iconColor} strokeWidth={strokeWidth} />;
        case 'Explore':
            return <Compass size={size} color={iconColor} strokeWidth={strokeWidth} />;
        case 'Favorite':
            return (
                <Heart
                    size={size}
                    color={iconColor}
                    fill={isFocused ? iconColor : 'none'}
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
    isDark: boolean;
}

function TabBarItem({ name, label, isFocused, onPress, isDark }: TabBarItemProps) {
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
                    isFocused && {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.10)' : '#F1F2F6',
                    },
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                {getTabIcon(name, isFocused, isDark)}
            </Animated.View>
        </Pressable>
    );
}

/**
 * Standalone Floating Action Button for Scan in the right corner, separated from the main dock
 */
function SeparatedScanButton({
    isFocused,
    onPress,
    isDark,
}: {
    isFocused: boolean;
    onPress: () => void;
    isDark: boolean;
}) {
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel="Scan QR"
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            style={styles.scanButtonOuter}
        >
            <Animated.View
                style={[
                    styles.scanButtonInner,
                    isFocused
                        ? styles.scanButtonActive
                        : {
                              backgroundColor: isDark ? '#12131A' : '#FFFFFF',
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                          },
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                <ScanLine
                    size={24}
                    color={isFocused ? '#FFFFFF' : '#FF5B45'}
                    strokeWidth={isFocused ? 2.5 : 2.2}
                />
            </Animated.View>
        </Pressable>
    );
}

function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();

    const currentTabRoute = state.routes[state.index];
    const shouldHideTabBar =
        Boolean((currentTabRoute.params as { hideTabBar?: boolean } | undefined)?.hideTabBar);

    if (shouldHideTabBar) {
        return null;
    }

    // Main dock routes (Map, Explore, Favorite, Vehicles)
    const mainRoutes = state.routes.filter((r) => r.name !== 'Scan');
    // Dedicated Scan route placed on the far right corner
    const scanRoute = state.routes.find((r) => r.name === 'Scan');
    const isScanFocused = state.routes[state.index]?.name === 'Scan';

    const handleScanPress = () => {
        if (!scanRoute) return;
        const event = navigation.emit({
            type: 'tabPress',
            target: scanRoute.key,
            canPreventDefault: true,
        });

        if (!isScanFocused && !event.defaultPrevented) {
            navigation.navigate(scanRoute.name);
        }
    };

    return (
        <View
            style={[
                styles.barOuter,
                { bottom: Math.max(18, insets.bottom + 8) },
            ]}
            pointerEvents="box-none"
        >
            {/* Main Navigation Capsule Dock (Left / Center) */}
            <View
                style={[
                    styles.dockContainer,
                    {
                        backgroundColor: isDark ? '#12131A' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.08)',
                    },
                ]}
            >
                {mainRoutes.map((route) => {
                    const isFocused = state.routes[state.index]?.name === route.name;
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
                            isDark={isDark}
                        />
                    );
                })}
            </View>

            {/* Dedicated Scan Floating Action Island in the Right Corner */}
            {scanRoute && (
                <SeparatedScanButton
                    isFocused={isScanFocused}
                    onPress={handleScanPress}
                    isDark={isDark}
                />
            )}
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
            <Tab.Screen name="Favorite" component={FavoritesScreen} />
            <Tab.Screen name="Vehicles" component={VehicleListScreen} />
            <Tab.Screen name="Scan" component={ScanScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    barOuter: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1000,
        gap: 12,
    },
    dockContainer: {
        flex: 1,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 6,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 10,
    },
    tabSlot: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabInner: {
        width: 48,
        height: 40,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanButtonOuter: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 10,
    },
    scanButtonActive: {
        backgroundColor: '#FF5B45',
        borderColor: '#FF5B45',
        shadowColor: '#FF5B45',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 12,
    },
});
