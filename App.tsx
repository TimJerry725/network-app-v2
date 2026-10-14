import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import {
    useFonts,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
    Cinzel_700Bold,
    Cinzel_800ExtraBold,
} from '@expo-google-fonts/cinzel';
import {
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold,
} from '@expo-google-fonts/playfair-display';
import {
    RedHatDisplay_400Regular,
    RedHatDisplay_500Medium,
    RedHatDisplay_600SemiBold,
    RedHatDisplay_700Bold,
    RedHatDisplay_800ExtraBold,
    RedHatDisplay_900Black,
} from '@expo-google-fonts/red-hat-display';
import RootNavigator from './src/navigation/RootNavigator';
import { VehicleProvider } from './src/context/VehicleContext';
import { PostChargeGraceProvider } from './src/context/PostChargeGraceContext';
import { ChargingProvider } from './src/context/ChargingContext';
import { ThemeProvider } from './src/hooks/useAppTheme';

export default function App() {
    const [fontsLoaded] = useFonts({
        // CRED Modern Geometric Sans (Gilroy equivalent)
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
        PlusJakartaSans_800ExtraBold,

        // CRED High-Contrast Luxury Display Serif (Cirka equivalent)
        Cinzel_700Bold,
        Cinzel_800ExtraBold,
        PlayfairDisplay_700Bold,
        PlayfairDisplay_800ExtraBold,

        // Backward compatibility
        RedHatDisplay_400Regular,
        RedHatDisplay_500Medium,
        RedHatDisplay_600SemiBold,
        RedHatDisplay_700Bold,
        RedHatDisplay_800ExtraBold,
        RedHatDisplay_900Black,
    });

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#070709' }}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <VehicleProvider>
                    <ChargingProvider>
                        <PostChargeGraceProvider>
                            <RootNavigator />
                        </PostChargeGraceProvider>
                    </ChargingProvider>
                </VehicleProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
