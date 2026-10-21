import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
    View,
    StyleSheet,
    Pressable,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { House, Compass, ScanLine, Heart, History, Sparkles } from 'lucide-react-native';
import TripPlannerScreen from '../screens/Explore';
import HomeScreen from '../screens/Home/HomeScreen';
import VehicleListScreen from '../screens/Profile/VehicleListScreen';
import ScanScreen from '../screens/Charging/ScanScreen';
import FavoritesScreen from '../screens/Favorites/FavoritesScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAppMode } from '../context/AppModeContext';
import { FONT_FAMILIES } from '../constants/Tokens';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Tab = createBottomTabNavigator();

type TabConfig = {
    name: string;
    label: string;
};

const TAB_CONFIG: TabConfig[] = [
    { name: 'Map', label: 'Home' },
    { name: 'Explore', label: 'Trips' },
    { name: 'Favorite', label: 'Favorites' },
    { name: 'Vehicles', label: 'Sessions' },
    { name: 'Scan', label: 'Scan' },
];

export const TAB_THEME: Record<string, {
    color: string;
    bgDark: string;
    bgLight: string;
    borderDark: string;
    borderLight: string;
    contentColor: string;
}> = {
    Map: {
        color: '#38BDF8', // Primary: Ice Blue
        bgDark: 'rgba(56, 189, 248, 0.18)',
        bgLight: 'rgba(56, 189, 248, 0.12)',
        borderDark: 'rgba(56, 189, 248, 0.28)',
        borderLight: 'rgba(56, 189, 248, 0.18)',
        contentColor: '#38BDF8',
    },
    Explore: {
        color: '#38BDF8', // Primary: Ice Blue
        bgDark: 'rgba(56, 189, 248, 0.18)',
        bgLight: 'rgba(56, 189, 248, 0.12)',
        borderDark: 'rgba(56, 189, 248, 0.28)',
        borderLight: 'rgba(56, 189, 248, 0.18)',
        contentColor: '#38BDF8',
    },
    Favorite: {
        color: '#FF5B45', // Secondary: Sunset Coral
        bgDark: 'rgba(255, 91, 69, 0.18)',
        bgLight: 'rgba(255, 91, 69, 0.12)',
        borderDark: 'rgba(255, 91, 69, 0.28)',
        borderLight: 'rgba(255, 91, 69, 0.18)',
        contentColor: '#FF5B45',
    },
    Vehicles: {
        color: '#10B981', // Tertiary: Neo Mint
        bgDark: 'rgba(16, 185, 129, 0.18)',
        bgLight: 'rgba(16, 185, 129, 0.12)',
        borderDark: 'rgba(16, 185, 129, 0.28)',
        borderLight: 'rgba(16, 185, 129, 0.18)',
        contentColor: '#10B981',
    },
};

function getTabIcon(name: string, isFocused: boolean, isDark: boolean, isAiMode?: boolean) {
    const strokeWidth = isFocused ? 2.2 : 1.9;
    const size = 18;

    let iconColor: string;
    if (isFocused) {
        iconColor = TAB_THEME[name]?.contentColor ?? (isDark ? '#FFFFFF' : '#0A0D14');
    } else {
        iconColor = isDark ? 'rgba(255, 255, 255, 0.42)' : 'rgba(0, 0, 0, 0.38)';
    }

    switch (name) {
        case 'Map':
            if (isAiMode) {
                return (
                    <Sparkles
                        size={size}
                        color={iconColor}
                        fill={isFocused ? iconColor : 'none'}
                        strokeWidth={strokeWidth}
                    />
                );
            }
            return (
                <House
                    size={size}
                    color={iconColor}
                    fill={isFocused ? iconColor : 'none'}
                    strokeWidth={strokeWidth}
                />
            );
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
    isAiMode?: boolean;
}

function TabBarItem({ name, label, isFocused, onPress, isDark, isAiMode }: TabBarItemProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const labelOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(labelOpacity, {
            toValue: isFocused ? 1 : 0,
            duration: 160,
            useNativeDriver: true,
        }).start();
    }, [isFocused]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.92,
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

    const theme = TAB_THEME[name] ?? {
        color: isDark ? '#FFFFFF' : '#0A0D14',
        bgDark: 'rgba(255, 255, 255, 0.10)',
        bgLight: '#F1F2F6',
        borderDark: 'rgba(255, 255, 255, 0.16)',
        borderLight: 'rgba(0, 0, 0, 0.08)',
        contentColor: isDark ? '#FFFFFF' : '#0A0D14',
    };

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={label}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            style={[
                styles.tabSlot,
                isFocused && styles.tabSlotFocused,
            ]}
        >
            <Animated.View
                style={[
                    styles.tabInner,
                    isFocused
                        ? [
                              styles.tabInnerFocused,
                              {
                                  backgroundColor: isDark ? theme.bgDark : theme.bgLight,
                                  borderColor: isDark ? theme.borderDark : theme.borderLight,
                              },
                          ]
                        : styles.tabInnerUnfocused,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                {getTabIcon(name, isFocused, isDark, isAiMode)}
                {isFocused && (
                    <Animated.Text
                        style={[
                            styles.tabLabel,
                            {
                                color: theme.contentColor,
                                opacity: labelOpacity,
                            },
                        ]}
                        numberOfLines={1}
                    >
                        {label}
                    </Animated.Text>
                )}
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
    const { mode } = useAppMode();
    const isAi = mode === 'ai';

    const prevIndexRef = useRef(state.index);
    useEffect(() => {
        if (prevIndexRef.current !== state.index) {
            prevIndexRef.current = state.index;
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
    }, [state.index]);

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
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            navigation.navigate(route.name);
                        }
                    };

                    const tabLabel = route.name === 'Map' ? (isAi ? 'Gemini AI' : 'Home') : config.label;

                    return (
                        <TabBarItem
                            key={route.key}
                            name={route.name}
                            label={tabLabel}
                            isFocused={isFocused}
                            onPress={onPress}
                            isDark={isDark}
                            isAiMode={isAi}
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
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    elevation: 0,
                },
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
    barOuter: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 99999,
        elevation: 999,
        gap: 10,
    },
    dockContainer: {
        flex: 1,
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 6,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 999,
        zIndex: 100000,
    },
    tabSlot: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabSlotFocused: {
        flex: 1.45,
    },
    tabInner: {
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabInnerUnfocused: {
        width: 36,
        height: 36,
    },
    tabInnerFocused: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        maxWidth: '100%',
    },
    tabLabel: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.semiBold,
        fontWeight: '600',
        letterSpacing: -0.1,
        marginLeft: 5,
    },
    scanButtonOuter: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        elevation: 999,
    },
    scanButtonInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 999,
    },
    scanButtonActive: {
        backgroundColor: '#FF5B45',
        borderColor: '#FF5B45',
        shadowColor: '#FF5B45',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 1000,
    },
});
