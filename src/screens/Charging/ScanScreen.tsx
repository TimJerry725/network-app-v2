import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScanLine, ShieldCheck, Zap } from 'lucide-react-native';
import { CredButton } from '../../components/CredButton';
import { CredCard } from '../../components/CredCard';
import { ThemedText } from '../../components/ThemedText';
import {
    MOCK_STATIONS,
    findStationByConnector,
    getRecommendedConnector,
    getStationById,
} from '../../constants/Stations';
import { FONT_FAMILIES, FONTS, RADIUS, SPACING } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function ScanScreen({ navigation, route }: any) {
    const { colors, isDark } = useAppTheme();
    const { selectedVehicle } = useVehicles();
    const preselectedStation = getStationById(route.params?.stationId);
    const preselectedMatch = findStationByConnector(route.params?.connectorId);
    const initialStation =
        preselectedStation ?? preselectedMatch?.station ?? MOCK_STATIONS[0];

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scannerOpen, setScannerOpen] = useState(Boolean(route.params?.openScanner));
    const [scanned, setScanned] = useState(false);
    const [manualCode, setManualCode] = useState(route.params?.connectorId ?? '');

    const suggestedConnector = useMemo(
        () =>
            preselectedMatch?.connector ??
            getRecommendedConnector(initialStation, selectedVehicle?.connectorType),
        [initialStation, preselectedMatch?.connector, selectedVehicle?.connectorType]
    );

    useEffect(() => {
        if (!route.params?.connectorId) {
            setManualCode(suggestedConnector.id);
        }
    }, [route.params?.connectorId, suggestedConnector.id]);

    useEffect(() => {
        if (!scannerOpen || hasPermission !== null) {
            return;
        }

        const requestPermission = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        requestPermission();
    }, [hasPermission, scannerOpen]);

    const startSession = (connectorId?: string) => {
        const resolvedCode = connectorId?.trim() || manualCode.trim() || suggestedConnector.id;

        if (!resolvedCode) {
            Alert.alert('Enter charger code', 'Add a charger code or scan the QR to continue.');
            return;
        }

        const match = findStationByConnector(resolvedCode);
        const stationId = match?.station.id ?? initialStation.id;
        const finalConnectorId = match?.connector.id ?? resolvedCode;

        navigation.navigate('ChargingSession', {
            stationId,
            connectorId: finalConnectorId,
        });
    };

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        setScanned(true);
        setManualCode(data);
        setScannerOpen(false);
        startSession(data);
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                style={styles.safeArea}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <View>
                            <ThemedText type="title">Charge in one tap</ThemedText>
                            <ThemedText style={{ color: colors.textMuted, ...FONTS.body }}>
                                Start with the best connector or scan when needed
                            </ThemedText>
                        </View>
                        <View
                            style={[
                                styles.headerBadge,
                                {
                                    backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
                                    borderBottomColor: isDark ? '#050508' : '#D0D0D5',
                                },
                            ]}
                        >
                            <Zap size={13} color={colors.primary} fill={colors.primary} />
                            <ThemedText
                                style={{
                                    color: colors.text,
                                    fontSize: 10,
                                    fontWeight: '800',
                                    fontFamily: FONT_FAMILIES.sansExtraBold,
                                    letterSpacing: 0.8,
                                }}
                            >
                                FAST CHARGE READY
                            </ThemedText>
                        </View>
                    </View>

                    <CredCard variant="default" style={styles.recommendedCard}>
                        <ThemedText type="label" style={{ color: colors.textMuted }}>
                            Suggested for {selectedVehicle?.nickname ?? 'your EV'}
                        </ThemedText>
                        <ThemedText style={styles.cardTitle}>{initialStation.name}</ThemedText>
                        <ThemedText style={{ color: colors.textMuted, marginTop: 6, ...FONTS.body }}>
                            {suggestedConnector.type} • {suggestedConnector.power} kW •{' '}
                            ₹{suggestedConnector.pricePerKWh.toFixed(2)}/kWh
                        </ThemedText>
                        <View style={styles.cardMetaRow}>
                            <View style={[styles.metaPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.backgroundAlt }]}>
                                <ShieldCheck size={14} color={colors.primary} />
                                <ThemedText style={FONTS.caption}>Vehicle matched</ThemedText>
                            </View>
                            <View style={[styles.metaPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.backgroundAlt }]}>
                                <ScanLine size={14} color={colors.primary} />
                                <ThemedText style={FONTS.caption}>Manual QR optional</ThemedText>
                            </View>
                        </View>
                        <CredButton
                            title="START SMART CHARGE"
                            variant="neon"
                            containerStyle={{ marginTop: 18 }}
                            onPress={() => startSession(suggestedConnector.id)}
                        />
                    </CredCard>

                    <CredCard variant="recessed" style={styles.manualCard}>
                        <ThemedText style={styles.cardTitle}>Use charger code</ThemedText>
                        <ThemedText style={{ color: colors.textMuted, marginTop: 6, ...FONTS.body }}>
                            Enter or scan the code from the connector to start manually
                        </ThemedText>
                        <View
                            style={[
                                styles.codeInputWrap,
                                {
                                    backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
                                    borderBottomColor: isDark ? '#050508' : '#C8C8D0',
                                },
                            ]}
                        >
                            <TextInput
                                style={[styles.codeInput, { color: colors.text }]}
                                value={manualCode}
                                onChangeText={setManualCode}
                                placeholder="e.g. IG-01"
                                placeholderTextColor={colors.textSoft}
                                autoCapitalize="characters"
                                returnKeyType="done"
                            />
                        </View>
                        <View style={styles.buttonRow}>
                            <CredButton
                                title="START WITH CODE"
                                variant="neon"
                                containerStyle={styles.flexButton}
                                onPress={() => startSession()}
                            />
                            <CredButton
                                title={scannerOpen ? 'CLOSE SCANNER' : 'OPEN SCANNER'}
                                variant="outline"
                                containerStyle={styles.flexButton}
                                onPress={() => {
                                    setScanned(false);
                                    setScannerOpen((current) => !current);
                                }}
                            />
                        </View>
                    </CredCard>

                    {scannerOpen && (
                        <CredCard variant="default" style={styles.scannerCard}>
                            <ThemedText style={styles.cardTitle}>Scan QR code</ThemedText>
                            <ThemedText style={{ color: colors.textMuted, marginTop: 6, ...FONTS.body }}>
                                Keep the charger QR inside the frame
                            </ThemedText>

                            <View style={styles.cameraWrap}>
                                {hasPermission === false ? (
                                    <View
                                        style={[
                                            styles.permissionState,
                                            { backgroundColor: colors.surfaceMuted },
                                        ]}
                                    >
                                        <ThemedText style={{ textAlign: 'center' }}>
                                            Camera access is off. You can still use the charger code.
                                        </ThemedText>
                                    </View>
                                ) : (
                                    <CameraView
                                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                )}
                                <View pointerEvents="none" style={styles.scanOverlay}>
                                    <View style={styles.scanFrame} />
                                </View>
                            </View>

                            {scanned && (
                                <CredButton
                                    title="SCAN AGAIN"
                                    variant="outline"
                                    containerStyle={{ marginTop: SPACING.md }}
                                    onPress={() => setScanned(false)}
                                />
                            )}
                        </CredCard>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    content: {
        padding: SPACING.lg - 4,
        paddingBottom: 140,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    headerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: RADIUS.pill,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    recommendedCard: {
        marginTop: SPACING.lg - 2,
    },
    cardTitle: {
        ...FONTS.h2,
        marginTop: 8,
    },
    cardMetaRow: {
        marginTop: 14,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: RADIUS.pill,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    manualCard: {
        marginTop: 14,
    },
    codeInputWrap: {
        marginTop: 18,
        borderRadius: RADIUS.input,
        minHeight: 56,
        justifyContent: 'center',
        paddingHorizontal: SPACING.md,
        borderWidth: 1.5,
        borderBottomWidth: 3.5,
    },
    codeInput: {
        ...FONTS.h3,
        letterSpacing: 1,
    },
    buttonRow: {
        marginTop: SPACING.md,
        flexDirection: 'row',
        gap: 12,
    },
    flexButton: {
        flex: 1,
    },
    scannerCard: {
        marginTop: 14,
    },
    cameraWrap: {
        marginTop: 18,
        height: 300,
        borderRadius: RADIUS.bottomSheet,
        overflow: 'hidden',
        position: 'relative',
    },
    permissionState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    scanOverlay: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanFrame: {
        width: 220,
        height: 220,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    scanAgainButton: {
        marginTop: SPACING.md,
        minHeight: 46,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.button,
    },
});
