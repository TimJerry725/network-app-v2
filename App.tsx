import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import {
    useFonts,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black,
} from '@expo-google-fonts/montserrat';
import RootNavigator from './src/navigation/RootNavigator';
import { VehicleProvider } from './src/context/VehicleContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { PostChargeGraceProvider } from './src/context/PostChargeGraceContext';
import { ChargingProvider } from './src/context/ChargingContext';
import { ThemeProvider } from './src/hooks/useAppTheme';

export default function App() {
    const [fontsLoaded] = useFonts({
        // Primary Modern Font: Montserrat
        Montserrat_400Regular,
        Montserrat_500Medium,
        Montserrat_600SemiBold,
        Montserrat_700Bold,
        Montserrat_800ExtraBold,
        Montserrat_900Black,
    });

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
                <ActivityIndicator size="large" color="#000000" />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <VehicleProvider>
                    <FavoritesProvider>
                        <ChargingProvider>
                            <PostChargeGraceProvider>
                                <RootNavigator />
                            </PostChargeGraceProvider>
                        </ChargingProvider>
                    </FavoritesProvider>
                </VehicleProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
