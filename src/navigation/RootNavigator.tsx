import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/Auth/SplashScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import OtpScreen from '../screens/Auth/OtpScreen';
import ProfileSetupScreen from '../screens/Auth/ProfileSetupScreen';
import AddVehicleScreen from '../screens/Auth/AddVehicleScreen';
import TabNavigator from './TabNavigator';
import StationDetailScreen from '../screens/Station/StationDetailScreen';
import ScanScreen from '../screens/Charging/ScanScreen';
import ChargingSessionScreen from '../screens/Charging/ChargingSessionScreen';
import PaymentScreen from '../screens/Charging/PaymentScreen';
import FilterScreen from '../screens/Home/FilterScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import WalletScreen from '../screens/Wallet/WalletScreen';
import TripPlanScreen from '../screens/Explore/TripPlanScreen';
import { useAppTheme } from '../hooks/useAppTheme';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    const { colors, isDark } = useAppTheme();
    const navigationTheme = {
        ...(isDark ? DarkTheme : DefaultTheme),
        colors: {
            ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: 'transparent',
            notification: colors.accent,
        },
    };

    return (
        <NavigationContainer theme={navigationTheme}>
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                    contentStyle: { backgroundColor: colors.background },
                }}
            >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Otp" component={OtpScreen} options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="AddVehicle" component={AddVehicleScreen} options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen name="StationDetails" component={StationDetailScreen} />
                <Stack.Screen name="Scan" component={ScanScreen} />
                <Stack.Screen name="ChargingSession" component={ChargingSessionScreen} />
                <Stack.Screen name="Payment" component={PaymentScreen} />
                <Stack.Screen name="Filter" component={FilterScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                <Stack.Screen name="TripPlan" component={TripPlanScreen} options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="Wallet" component={WalletScreen} options={{ animation: 'slide_from_bottom' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
