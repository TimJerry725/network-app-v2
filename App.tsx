import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { VehicleProvider } from './src/context/VehicleContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { PostChargeGraceProvider } from './src/context/PostChargeGraceContext';
import { ChargingProvider } from './src/context/ChargingContext';
import { WalletProvider } from './src/context/WalletContext';
import { SavedTripsProvider } from './src/context/SavedTripsContext';
import { ThemeProvider } from './src/hooks/useAppTheme';

export default function App() {
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
