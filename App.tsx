import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import {
    useFonts,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import RootNavigator from './src/navigation/RootNavigator';
import { VehicleProvider } from './src/context/VehicleContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { PostChargeGraceProvider } from './src/context/PostChargeGraceContext';
import { ChargingProvider } from './src/context/ChargingContext';
import { WalletProvider } from './src/context/WalletContext';
import { SavedTripsProvider } from './src/context/SavedTripsContext';
import { ThemeProvider } from './src/hooks/useAppTheme';

export default function App() {
    const [fontsLoaded] = useFonts({
        // Pulse style: Plus Jakarta Sans
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
        PlusJakartaSans_800ExtraBold,
    });

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0F' }}>
                <ActivityIndicator size="large" color="#A996FF" />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <VehicleProvider>
                    <WalletProvider>
                        <FavoritesProvider>
                            <SavedTripsProvider>
                                <ChargingProvider>
                                    <PostChargeGraceProvider>
                                        <RootNavigator />
                                    </PostChargeGraceProvider>
                                </ChargingProvider>
                            </SavedTripsProvider>
                        </FavoritesProvider>
                    </WalletProvider>
                </VehicleProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
