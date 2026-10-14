import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import {
    useFonts,
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
        RedHatDisplay_400Regular,
        RedHatDisplay_500Medium,
        RedHatDisplay_600SemiBold,
        RedHatDisplay_700Bold,
        RedHatDisplay_800ExtraBold,
        RedHatDisplay_900Black,
    });
    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F8F1' }}>
                <ActivityIndicator size="large" color="#1E9731" />
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
