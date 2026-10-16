import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    ArrowRight,
    Camera as CameraIcon,
    Check,
    ChevronLeft,
    Flashlight,
    FlashlightOff,
    Keyboard,
    ScanLine,
    ShieldCheck,
    SlidersHorizontal,
    X,
    Zap,
} from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { CredButton } from '../../components/CredButton';
import { Ccs2Icon } from '../../components/Ccs2Icon';
import { Type2Icon } from '../../components/Type2Icon';
import { ChademoIcon } from '../../components/ChademoIcon';
import {
    Connector,
    MOCK_STATIONS,
    Station,
    findStationByConnector,
    getRecommendedConnector,
    getStationById,
} from '../../constants/Stations';
import { FONT_FAMILIES, FONTS, RADIUS, SPACING } from '../../constants/Tokens';
import { useVehicles } from '../../context/VehicleContext';
import { useIndiaChargingStations } from '../../hooks/useIndiaChargingStations';
import { useAppTheme } from '../../hooks/useAppTheme';
import { stationService } from '../../services/api/stationService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIEWFINDER_SIZE = Math.min(SCREEN_WIDTH * 0.62, 230);

// Helper to render connector icon with type badge pod (Matches StationDetailScreen)
function ConnectorBadge({
    type,
    isSelected = false,
    isDark = false,
}: {
    type: Connector['type'];
    isSelected?: boolean;
    isDark?: boolean;
}) {
    const iconColor = isDark
        ? (isSelected ? '#FFFFFF' : '#E5E5EA')
        : (isSelected ? '#000000' : '#1C1C22');
    const iconSize = 26;

    return (
        <View style={styles.connectorIconContainer}>
            {type === 'CCS2' ? (
                <Ccs2Icon size={iconSize} color={iconColor} />
            ) : type === 'Type 2' ? (
                <Type2Icon size={iconSize} color={iconColor} />
            ) : (
                <ChademoIcon size={iconSize} color={iconColor} />
            )}
            <ThemedText style={[styles.connectorSublabel, { color: iconColor }]}>
                {type}
            </ThemedText>
        </View>
    );
}

export default function ScanScreen({ navigation, route }: any) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { selectedVehicle } = useVehicles();
    const { stations: allStations } = useIndiaChargingStations();

    // Permissions & Camera Controls
    const [permission, requestPermission] = useCameraPermissions();
    const [torchOn, setTorchOn] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [isManualModalVisible, setIsManualModalVisible] = useState(false);
    const [manualCode, setManualCode] = useState(route.params?.connectorId ?? '');
    const [isCpidFocused, setIsCpidFocused] = useState(false);
    const cpidInputRef = useRef<TextInput>(null);
    const [isChargeSettingsVisible, setIsChargeSettingsVisible] = useState(false);
    const [cutoffPercent, setCutoffPercent] = useState('80%');

    // Station & Connector resolution
    const preselectedStation = getStationById(route.params?.stationId);
    const preselectedMatch = findStationByConnector(route.params?.connectorId);

    // Nearby station list (sorted with closest first)
    const stationsList = useMemo(() => {
        const pool = allStations && allStations.length > 0 ? allStations : MOCK_STATIONS;
        return [...pool].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }, [allStations]);

    // Active nearby station state
    const [currentStationIndex, setCurrentStationIndex] = useState(0);
    const nearbyStation: Station =
        preselectedStation ??
        preselectedMatch?.station ??
        stationsList[currentStationIndex] ??
        MOCK_STATIONS[0];

    // Selected connector state
    const [selectedConnectorId, setSelectedConnectorId] = useState<string>(
        route.params?.connectorId ??
        preselectedMatch?.connector?.id ??
        getRecommendedConnector(nearbyStation, selectedVehicle?.connectorType).id
    );

    // Sync selected connector when station changes
    useEffect(() => {
        if (!nearbyStation.connectors.some((c) => c.id === selectedConnectorId)) {
            const recommended = getRecommendedConnector(
                nearbyStation,
                selectedVehicle?.connectorType
            );
            setSelectedConnectorId(recommended.id);
        }
    }, [nearbyStation, selectedConnectorId, selectedVehicle?.connectorType]);

    // Auto-match nearby station & connector when CPID is typed (local list & live API)
    useEffect(() => {
        const trimmed = manualCode.trim();
        if (!trimmed) return;

        const match = findStationByConnector(trimmed);
        if (match) {
            const idx = stationsList.findIndex((s) => s.id === match.station.id);
            if (idx !== -1) {
                setCurrentStationIndex(idx);
            }
            setSelectedConnectorId(match.connector.id);
            return;
        }

        if (trimmed.length >= 4) {
            stationService.getStationByChargePointId(trimmed)
                .then((liveStation) => {
                    if (liveStation && liveStation.connectors.length > 0) {
                        setSelectedConnectorId(liveStation.connectors[0].id);
                    }
                })
                .catch(() => {});
        }
    }, [manualCode, stationsList]);

    const activeConnector = useMemo(() => {
        return (
            nearbyStation.connectors.find((c) => c.id === selectedConnectorId) ??
            nearbyStation.connectors[0]
        );
    }, [nearbyStation, selectedConnectorId]);

    // Laser scanning sweep animation
    const laserAnim = useRef(new Animated.Value(0)).current;
    const pulseBeacon = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        const laserLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(laserAnim, {
                    toValue: 1,
                    duration: 1800,
                    useNativeDriver: true,
                }),
                Animated.timing(laserAnim, {
                    toValue: 0,
                    duration: 1800,
                    useNativeDriver: true,
                }),
            ])
        );
        laserLoop.start();

        const beaconLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseBeacon, {
                    toValue: 1.15,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseBeacon, {
                    toValue: 0.9,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ])
        );
        beaconLoop.start();

        return () => {
            laserLoop.stop();
            beaconLoop.stop();
        };
    }, [laserAnim, pulseBeacon]);

    // Haptic Start Session handler
    const handleStartSession = (connectorIdToUse?: string) => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        const resolvedCode = (
            connectorIdToUse ||
            selectedConnectorId ||
            activeConnector.id
        ).trim();

        const match = findStationByConnector(resolvedCode);
        const stationToUse = match?.station ?? nearbyStation;
        const connectorToUse = match?.connector?.id ?? resolvedCode;
        const parsedCutoff = parseInt(cutoffPercent, 10) || 80;

        navigation.navigate('ChargingSession', {
            stationId: stationToUse.id,
            connectorId: connectorToUse,
            stationSnapshot: stationToUse,
            targetSoc: parsedCutoff,
        });
    };

    // Camera Barcode Detected
    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        handleStartSession(data);
    };

    // Toggle Torch
    const handleToggleTorch = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setTorchOn((prev) => !prev);
    };

    const isCameraAvailable = Platform.OS !== 'web' && permission?.granted;

    return (
        <View style={styles.root}>
            {/* ── TOP SECTION: CAMERA QR SCANNER ── */}
            <View style={styles.scannerContainer}>
                {isCameraAvailable ? (
                    <CameraView
                        facing="back"
                        enableTorch={torchOn}
                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        style={StyleSheet.absoluteFill}
                    />
                ) : (
                    /* High-Tech Cyber Camera Simulation Viewport for Web / Simulator / Pending Permission */
                    <View style={styles.simulatedCameraView}>
                        <View style={styles.gridBackdrop} />
                        {!permission?.granted && Platform.OS !== 'web' && (
                            <TouchableOpacity
                                style={styles.permissionPrompt}
                                onPress={requestPermission}
                                activeOpacity={0.85}
                            >
                                <CameraIcon size={24} color="#00F2FE" />
                                <ThemedText style={styles.permissionText}>
                                    Tap to Enable Camera
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Dark Vignette / Camera Overlay */}
                <View style={styles.cameraVignette} pointerEvents="none" />

                {/* Top Floating Controls Bar */}
                <SafeAreaView edges={['top']} style={styles.topControlsSafe}>
                    <View style={styles.topControlsRow}>
                        {navigation.canGoBack() ? (
                            <TouchableOpacity
                                style={styles.tactileRoundBtn}
                                onPress={() => {
                                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    navigation.goBack();
                                }}
                                activeOpacity={0.8}
                            >
                                <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.topBadgeChip}>
                                <ScanLine size={14} color="#00F2FE" />
                                <ThemedText style={styles.topBadgeText}>SCANNER ACTIVE</ThemedText>
                            </View>
                        )}

                        {/* Title pill */}
                        <View style={styles.titlePill}>
                            <ThemedText style={styles.titlePillText}>ALIGN QR TO CHARGE</ThemedText>
                        </View>

                        {/* Action Buttons: Torch & Manual Code */}
                        <View style={styles.topRightBtns}>
                            <TouchableOpacity
                                style={[
                                    styles.tactileRoundBtn,
                                    torchOn && styles.tactileRoundBtnActive,
                                ]}
                                onPress={handleToggleTorch}
                                activeOpacity={0.8}
                            >
                                {torchOn ? (
                                    <FlashlightOff size={18} color="#000000" />
                                ) : (
                                    <Flashlight size={18} color="#FFFFFF" />
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.tactileRoundBtn}
                                onPress={() => {
                                    if (cpidInputRef.current) {
                                        cpidInputRef.current.focus();
                                    } else {
                                        setIsManualModalVisible(true);
                                    }
                                }}
                                activeOpacity={0.8}
                            >
                                <Keyboard size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>

                {/* ── CENTRAL TARGETING RETICLE & ANIMATED LASER BEAM ── */}
                <View style={styles.reticleWrap} pointerEvents="box-none">
                    <View style={styles.reticleBox} pointerEvents="none">
                        {/* 4 Cyber Corner Brackets */}
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />

                        {/* Animated Sweeping Laser Line */}
                        <Animated.View
                            style={[
                                styles.laserLine,
                                {
                                    transform: [
                                        {
                                            translateY: laserAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [12, VIEWFINDER_SIZE - 16],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <View style={styles.laserBeamGlow} />
                        </Animated.View>

                        {/* Center Target Crosshair */}
                        <View style={styles.centerTargetCross}>
                            <View style={styles.crosshairDot} />
                        </View>
                    </View>

                    {/* Hint text below reticle */}
                    <View style={styles.reticleHint} pointerEvents="none">
                        <ThemedText style={styles.reticleHintText}>
                            Point camera at QR code on charger dispenser
                        </ThemedText>
                    </View>

                    {/* ── DIRECT CPID INPUT TEXT BOX BELOW SCANNER ── */}
                    <View style={styles.cpidInputContainer} pointerEvents="box-none">
                        <View
                            style={[
                                styles.cpidInputBox,
                                isCpidFocused && styles.cpidInputBoxFocused,
                            ]}
                        >
                            <View style={styles.cpidBadge}>
                                <ThemedText style={styles.cpidBadgeText}>CPID</ThemedText>
                            </View>
                            <TextInput
                                ref={cpidInputRef}
                                style={styles.cpidTextInput}
                                value={manualCode}
                                onChangeText={setManualCode}
                                placeholder="Type Charger ID (e.g. CP1233)"
                                placeholderTextColor="rgba(255, 255, 255, 0.45)"
                                autoCapitalize="characters"
                                autoCorrect={false}
                                returnKeyType="go"
                                onFocus={() => setIsCpidFocused(true)}
                                onBlur={() => setIsCpidFocused(false)}
                                onSubmitEditing={() => {
                                    if (manualCode.trim()) {
                                        handleStartSession(manualCode.trim());
                                    }
                                }}
                            />
                            {manualCode.trim().length > 0 ? (
                                <TouchableOpacity
                                    style={styles.cpidSubmitBtn}
                                    onPress={() => handleStartSession(manualCode.trim())}
                                    activeOpacity={0.8}
                                >
                                    <ArrowRight size={14} color="#000000" strokeWidth={2.6} />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.cpidKeyboardBtn}
                                    onPress={() => cpidInputRef.current?.focus()}
                                    activeOpacity={0.7}
                                >
                                    <Keyboard size={15} color="rgba(255, 255, 255, 0.45)" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </View>

            {/* ── BOTTOM SECTION: NEARBY CHARGER DRAWER (MATCHES STATION DETAIL SCREEN) ── */}
            <View
                style={[
                    styles.bottomDrawer,
                    {
                        backgroundColor: isDark ? '#0E0E13' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#000000',
                        borderBottomColor: '#000000',
                        paddingBottom: Math.max(88, insets.bottom + 76),
                    },
                ]}
            >
                {/* 3D Specular Highlight Line on Drawer Top */}
                <View
                    style={[
                        styles.drawerSpecularLine,
                        {
                            backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.2)'
                                : 'rgba(255, 255, 255, 0.9)',
                        },
                    ]}
                />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    contentContainerStyle={styles.drawerScrollContent}
                >
                    {/* Live Radar Detection Bar */}
                    <View style={styles.stationHeaderRow}>
                        <View style={styles.stationHeaderLeft}>
                            <View style={styles.liveBeaconWrap}>
                                <Animated.View
                                    style={[
                                        styles.liveBeaconHalo,
                                        { transform: [{ scale: pulseBeacon }] },
                                    ]}
                                />
                                <View style={styles.liveBeaconDot} />
                                <ThemedText style={styles.liveBeaconText}>
                                    NEARBY CHARGER DETECTED • {nearbyStation.distanceKm ?? 12}M AWAY
                                </ThemedText>
                            </View>

                            <ThemedText style={styles.stationName} numberOfLines={1}>
                                {nearbyStation.name}
                            </ThemedText>
                            <ThemedText style={styles.stationAddress} numberOfLines={1}>
                                {nearbyStation.address}
                            </ThemedText>
                        </View>
                    </View>

                    {/* ── CONNECTOR CARDS (MATCHES STATION DETAIL SCREEN LAYOUT) ── */}
                    <ThemedText style={styles.selectConnectorLabel}>
                        SELECT CHARGING CONNECTOR
                    </ThemedText>

                    <View style={styles.connectorsStack}>
                        {nearbyStation.connectors.map((connector) => {
                            const isSelected = selectedConnectorId === connector.id;
                            const isAvailable = connector.status === 'Available';
                            const isPreparing = connector.status === 'Preparing';
                            const currentType =
                                connector.currentType ??
                                (connector.type === 'Type 2' ? 'AC' : 'DC');
                            const isVehicleMatch =
                                selectedVehicle?.connectorType &&
                                connector.type.toUpperCase().includes(
                                    selectedVehicle.connectorType.toUpperCase()
                                );

                            return (
                                <TouchableOpacity
                                    key={connector.id}
                                    activeOpacity={0.88}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        }
                                        setSelectedConnectorId(connector.id);
                                    }}
                                    style={[
                                        styles.connectorWholeCard,
                                        isSelected
                                            ? [
                                                  styles.connectorCardSelected,
                                                  {
                                                      backgroundColor: isDark ? '#1C1C24' : '#FFFFFF',
                                                      borderColor: isDark ? '#FFFFFF' : '#000000',
                                                      borderBottomColor: isDark ? '#9E9EA8' : '#000000',
                                                  },
                                              ]
                                            : [
                                                  styles.connectorCardUnselected,
                                                  {
                                                      backgroundColor: isDark ? '#101014' : '#F7F7F9',
                                                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                                                      borderBottomColor: isDark ? '#050508' : '#D4D4DC',
                                                  },
                                              ],
                                    ]}
                                >
                                    {/* Vehicle Match Badge if applicable */}
                                    {isVehicleMatch && (
                                        <View style={styles.vehicleMatchBadge}>
                                            <ShieldCheck size={10} color="#00F2FE" />
                                            <ThemedText style={styles.vehicleMatchText}>
                                                EV MATCH
                                            </ThemedText>
                                        </View>
                                    )}

                                    {/* Top Info Row inside the Connector Card */}
                                    <View style={styles.connectorInfoRow}>
                                        <ConnectorBadge
                                            type={connector.type}
                                            isSelected={isSelected}
                                            isDark={isDark}
                                        />

                                        <View style={styles.powerGroup}>
                                            <View
                                                style={[
                                                    styles.acDcBadge,
                                                    currentType === 'DC'
                                                        ? {
                                                              backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : '#DCFCE7',
                                                              borderColor: isDark ? 'rgba(34, 197, 94, 0.35)' : '#86EFAC',
                                                          }
                                                        : {
                                                              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : '#E0F2FE',
                                                              borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : '#7DD3FC',
                                                          },
                                                ]}
                                            >
                                                <ThemedText
                                                    style={[
                                                        styles.acDcBadgeText,
                                                        {
                                                            color: currentType === 'DC'
                                                                ? (isDark ? '#4ADE80' : '#15803D')
                                                                : (isDark ? '#38BDF8' : '#0369A1'),
                                                        },
                                                    ]}
                                                >
                                                    {currentType}
                                                </ThemedText>
                                            </View>
                                            <ThemedText style={[styles.powerText, { color: colors.text }]}>
                                                {connector.power} kW
                                            </ThemedText>
                                        </View>

                                        <ThemedText style={[styles.tariffPrice, { color: colors.text }]}>
                                            ₹{connector.pricePerKWh.toFixed(0)}
                                            <ThemedText style={[styles.tariffUnit, { color: colors.textMuted }]}>
                                                /kWh
                                            </ThemedText>
                                        </ThemedText>

                                        <View style={styles.statusColumn}>
                                            <ThemedText
                                                style={[
                                                    styles.statusText,
                                                    {
                                                        color: isAvailable
                                                            ? (isDark ? '#4ADE80' : '#15803D')
                                                            : isPreparing
                                                            ? '#D97706'
                                                            : colors.textMuted,
                                                    },
                                                ]}
                                            >
                                                {connector.status}
                                            </ThemedText>
                                        </View>
                                    </View>

                                    {/* Action Buttons INSIDE the same Selected Card (Matches StationDetailScreen) */}
                                    {isSelected && (
                                        <View style={styles.connectorActionsRow}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.smartCutoffButton,
                                                    {
                                                        backgroundColor: isDark ? '#22222A' : '#FFFFFF',
                                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#000000',
                                                        borderBottomColor: isDark ? '#050508' : '#000000',
                                                    },
                                                ]}
                                                onPress={() => {
                                                    if (Platform.OS !== 'web') {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    }
                                                    setIsChargeSettingsVisible(true);
                                                }}
                                                activeOpacity={0.82}
                                            >
                                                <SlidersHorizontal
                                                    size={14}
                                                    color={isDark ? '#FFFFFF' : '#000000'}
                                                />
                                                <ThemedText
                                                    style={[
                                                        styles.smartCutoffText,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    Charge Settings
                                                </ThemedText>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[
                                                    styles.startChargingButton,
                                                    {
                                                        backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                                        borderColor: isDark ? '#FFFFFF' : '#000000',
                                                        borderBottomColor: isDark ? '#B0B0B8' : '#333338',
                                                    },
                                                ]}
                                                onPress={() => {
                                                    if (Platform.OS !== 'web') {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                                    }
                                                    handleStartSession(connector.id);
                                                }}
                                                activeOpacity={0.82}
                                            >
                                                <Zap
                                                    size={15}
                                                    color={isDark ? '#000000' : '#FFFFFF'}
                                                    fill={isDark ? '#000000' : '#FFFFFF'}
                                                />
                                                <ThemedText
                                                    style={[
                                                        styles.startChargingText,
                                                        { color: isDark ? '#000000' : '#FFFFFF' },
                                                    ]}
                                                >
                                                    Start Charging
                                                </ThemedText>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Manual Code Option Link */}
                    <TouchableOpacity
                        style={styles.manualEntryLink}
                        onPress={() => {
                            if (cpidInputRef.current) {
                                cpidInputRef.current.focus();
                            } else {
                                setIsManualModalVisible(true);
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={styles.manualEntryLinkText}>
                            Can't scan? Enter Charger ID (CPID) above
                        </ThemedText>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* ── MANUAL CHARGER CODE MODAL ── */}
            <Modal
                visible={isManualModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsManualModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalBackdrop}
                >
                    <View
                        style={[
                            styles.manualModalCard,
                            {
                                backgroundColor: isDark ? '#14141C' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#000000',
                            },
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>ENTER CHARGER CODE</ThemedText>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setIsManualModalVisible(false)}
                            >
                                <X size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                            </TouchableOpacity>
                        </View>

                        <ThemedText style={styles.modalSubtitle}>
                            Look for the 6-digit identification code printed on the charger or connector label.
                        </ThemedText>

                        <View
                            style={[
                                styles.modalInputWrap,
                                {
                                    backgroundColor: isDark ? '#0D0D12' : '#F4F4F6',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#000000',
                                },
                            ]}
                        >
                            <TextInput
                                style={[
                                    styles.modalTextInput,
                                    { color: isDark ? '#FFFFFF' : '#000000' },
                                ]}
                                value={manualCode}
                                onChangeText={setManualCode}
                                placeholder="e.g. CP1233-01"
                                placeholderTextColor={colors.textSoft}
                                autoCapitalize="characters"
                                autoFocus={true}
                                returnKeyType="done"
                            />
                        </View>

                        <View style={styles.modalBtnRow}>
                            <CredButton
                                title="CONFIRM & CHARGE"
                                variant="neon"
                                containerStyle={{ flex: 1 }}
                                onPress={() => {
                                    setIsManualModalVisible(false);
                                    handleStartSession(manualCode.trim() || activeConnector.id);
                                }}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ── CHARGE SETTINGS MODAL ── */}
            <Modal
                visible={isChargeSettingsVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsChargeSettingsVisible(false)}
            >
                <View style={styles.settingsModalOverlay}>
                    <View
                        style={[
                            styles.settingsModalSheet,
                            {
                                backgroundColor: isDark ? '#141418' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.settingsModalHandle,
                                { backgroundColor: isDark ? '#33333C' : '#D1D5DB' },
                            ]}
                        />
                        <View style={styles.settingsModalHeader}>
                            <ThemedText style={[styles.settingsModalTitle, { color: colors.text }]}>
                                Charge Settings
                            </ThemedText>
                            <TouchableOpacity
                                onPress={() => setIsChargeSettingsVisible(false)}
                                style={styles.settingsModalClose}
                            >
                                <X size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ThemedText style={[styles.settingsModalSub, { color: colors.textMuted }]}>
                            Auto-stop charging to prevent battery degradation and idle fees.
                        </ThemedText>

                        {[
                            '80% (Recommended for battery health)',
                            '90% (Extended trip)',
                            '100% (Full battery)',
                        ].map((option, i) => {
                            const isOptionActive = cutoffPercent.startsWith(option.slice(0, 3));
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        styles.cutoffOption,
                                        isOptionActive
                                            ? {
                                                  backgroundColor: isDark ? '#1E1E26' : '#FFFFFF',
                                                  borderColor: isDark ? '#FFFFFF' : '#000000',
                                                  borderBottomColor: isDark ? '#9E9EA8' : '#000000',
                                              }
                                            : {
                                                  backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                                                  borderBottomColor: isDark ? '#050508' : '#D0D0D8',
                                              },
                                    ]}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }
                                        setCutoffPercent(option);
                                        setIsChargeSettingsVisible(false);
                                    }}
                                    activeOpacity={0.82}
                                >
                                    <ThemedText style={[styles.cutoffOptionText, { color: colors.text }]}>
                                        {option}
                                    </ThemedText>
                                    {isOptionActive && (
                                        <Check size={18} color={colors.primary} strokeWidth={2.5} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#000000',
    },

    // ── Scanner Viewport ──
    scannerContainer: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#050508',
        justifyContent: 'center',
        alignItems: 'center',
    },
    simulatedCameraView: {
        ...StyleSheet.absoluteFill,
        backgroundColor: '#09090E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridBackdrop: {
        ...StyleSheet.absoluteFill,
        opacity: 0.12,
        backgroundColor: '#0A0A10',
    },
    permissionPrompt: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: RADIUS.button,
        borderWidth: 1.5,
        borderColor: '#00F2FE',
        backgroundColor: 'rgba(0, 242, 254, 0.1)',
        gap: 8,
    },
    permissionText: {
        fontFamily: FONT_FAMILIES.bold,
        fontSize: 13,
        color: '#00F2FE',
        letterSpacing: 0.5,
    },
    cameraVignette: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },

    // ── Top Controls ──
    topControlsSafe: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
    },
    topControlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingTop: Platform.OS === 'android' ? 12 : 6,
    },
    tactileRoundBtn: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.circle,
        backgroundColor: 'rgba(20, 20, 26, 0.75)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderBottomWidth: 3,
        borderBottomColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tactileRoundBtnActive: {
        backgroundColor: '#00F2FE',
        borderColor: '#00F2FE',
    },
    topBadgeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: RADIUS.pill,
        backgroundColor: 'rgba(20, 20, 26, 0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    topBadgeText: {
        fontFamily: FONT_FAMILIES.bold,
        fontSize: 9.5,
        color: '#00F2FE',
        letterSpacing: 0.8,
    },
    titlePill: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: RADIUS.pill,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        borderWidth: 1.2,
        borderColor: 'rgba(255, 255, 255, 0.18)',
    },
    titlePillText: {
        fontFamily: FONT_FAMILIES.extraBold,
        fontSize: 10.5,
        color: '#FFFFFF',
        letterSpacing: 1.2,
    },
    topRightBtns: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    // ── Reticle HUD ──
    reticleWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -16,
    },
    reticleBox: {
        width: VIEWFINDER_SIZE,
        height: VIEWFINDER_SIZE,
        position: 'relative',
        borderRadius: RADIUS.cardLg,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        overflow: 'hidden',
    },
    corner: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderColor: '#00F2FE',
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderTopWidth: 3.5,
        borderLeftWidth: 3.5,
        borderTopLeftRadius: RADIUS.card,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderTopWidth: 3.5,
        borderRightWidth: 3.5,
        borderTopRightRadius: RADIUS.card,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 3.5,
        borderLeftWidth: 3.5,
        borderBottomLeftRadius: RADIUS.card,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 3.5,
        borderRightWidth: 3.5,
        borderBottomRightRadius: RADIUS.card,
    },
    laserLine: {
        position: 'absolute',
        left: 8,
        right: 8,
        height: 2.5,
        backgroundColor: '#00F2FE',
        borderRadius: 2,
    },
    laserBeamGlow: {
        position: 'absolute',
        top: -6,
        left: 0,
        right: 0,
        height: 14,
        backgroundColor: 'rgba(0, 242, 254, 0.25)',
        borderRadius: 4,
    },
    centerTargetCross: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -4,
        marginTop: -4,
        width: 8,
        height: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    crosshairDot: {
        width: 5,
        height: 5,
        borderRadius: RADIUS.circle,
        backgroundColor: '#00F2FE',
    },
    reticleHint: {
        marginTop: 10,
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: RADIUS.pill,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    reticleHintText: {
        fontFamily: FONT_FAMILIES.medium,
        fontSize: 10.5,
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
        letterSpacing: 0.2,
    },

    // ── Inline CPID Manual Input Box ──
    cpidInputContainer: {
        marginTop: 10,
        width: SCREEN_WIDTH - 48,
        maxWidth: 320,
    },
    cpidInputBox: {
        width: '100%',
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 15, 20, 0.85)',
        borderRadius: RADIUS.button,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.18)',
        paddingHorizontal: 10,
        gap: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    cpidInputBoxFocused: {
        borderColor: '#00F2FE',
        backgroundColor: 'rgba(10, 10, 16, 0.96)',
        shadowColor: '#00F2FE',
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    cpidBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: 'rgba(0, 242, 254, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(0, 242, 254, 0.35)',
    },
    cpidBadgeText: {
        fontFamily: FONT_FAMILIES.extraBold,
        fontSize: 10,
        color: '#00F2FE',
        letterSpacing: 1,
    },
    cpidTextInput: {
        flex: 1,
        fontFamily: FONT_FAMILIES.semiBold,
        fontSize: 12.5,
        color: '#FFFFFF',
        letterSpacing: 0.6,
        paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    },
    cpidSubmitBtn: {
        width: 28,
        height: 28,
        borderRadius: RADIUS.circle,
        backgroundColor: '#00F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cpidKeyboardBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Bottom Drawer (Nearby Charger) ──
    bottomDrawer: {
        borderTopLeftRadius: RADIUS.bottomSheet,
        borderTopRightRadius: RADIUS.bottomSheet,
        borderWidth: 2,
        borderBottomWidth: 0,
        position: 'relative',
        maxHeight: SCREEN_HEIGHT * 0.52,
    },
    drawerSpecularLine: {
        position: 'absolute',
        top: 0,
        left: 28,
        right: 28,
        height: 1.5,
        borderRadius: 1,
    },
    drawerScrollContent: {
        paddingHorizontal: SPACING.md + 2,
        paddingTop: 16,
    },
    stationHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
    },
    stationHeaderLeft: {
        flex: 1,
    },
    liveBeaconWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        position: 'relative',
        marginBottom: 4,
    },
    liveBeaconDot: {
        width: 6.5,
        height: 6.5,
        borderRadius: RADIUS.circle,
        backgroundColor: '#10B981',
    },
    liveBeaconHalo: {
        position: 'absolute',
        left: -2,
        width: 10.5,
        height: 10.5,
        borderRadius: RADIUS.circle,
        backgroundColor: 'rgba(16, 185, 129, 0.4)',
    },
    liveBeaconText: {
        fontFamily: FONT_FAMILIES.extraBold,
        fontSize: 9.5,
        color: '#10B981',
        letterSpacing: 0.8,
    },
    stationName: {
        fontFamily: FONT_FAMILIES.bold,
        fontSize: 16,
        letterSpacing: -0.3,
    },
    stationAddress: {
        fontFamily: FONT_FAMILIES.medium,
        fontSize: 11.5,
        color: '#8E8E93',
        marginTop: 2,
    },

    // ── Connectors (Matches StationDetailScreen) ──
    selectConnectorLabel: {
        fontFamily: FONT_FAMILIES.bold,
        fontSize: 10,
        color: '#8E8E93',
        letterSpacing: 0.8,
        marginTop: 14,
        marginBottom: 8,
    },
    connectorsStack: {
        gap: 10,
    },
    connectorWholeCard: {
        borderRadius: RADIUS.card,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1.5,
        position: 'relative',
    },
    connectorCardSelected: {
        borderWidth: 2,
        borderBottomWidth: 4.5,
    },
    connectorCardUnselected: {
        borderWidth: 1.5,
        borderBottomWidth: 3,
    },
    vehicleMatchBadge: {
        position: 'absolute',
        top: -8,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#000000',
        borderWidth: 1,
        borderColor: '#00F2FE',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: RADIUS.pill,
        zIndex: 5,
    },
    vehicleMatchText: {
        fontFamily: FONT_FAMILIES.extraBold,
        fontSize: 8.5,
        color: '#00F2FE',
        letterSpacing: 0.5,
    },
    connectorInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    connectorIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        minWidth: 38,
    },
    connectorSublabel: {
        fontSize: 8.5,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
        marginTop: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    powerGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginRight: 10,
    },
    acDcBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: RADIUS.chip,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acDcBadgeText: {
        fontSize: 9,
        fontFamily: FONT_FAMILIES.bold,
        lineHeight: 12,
    },
    powerText: {
        fontSize: 14,
        fontFamily: FONT_FAMILIES.bold,
        minWidth: 50,
    },
    tariffPrice: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.extraBold,
    },
    tariffUnit: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
    },
    statusColumn: {
        marginLeft: 'auto',
    },
    statusText: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.bold,
    },
    connectorActionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    smartCutoffButton: {
        flex: 1,
        flexDirection: 'row',
        borderRadius: RADIUS.button,
        paddingVertical: 11,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1.5,
        borderBottomWidth: 3.5,
    },
    smartCutoffText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.3,
    },
    startChargingButton: {
        flex: 1.2,
        flexDirection: 'row',
        borderRadius: RADIUS.button,
        paddingVertical: 11,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1.5,
        borderBottomWidth: 3.5,
    },
    startChargingText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.extraBold,
        letterSpacing: 0.3,
    },

    // ── Manual Entry Link ──
    manualEntryLink: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 4,
    },
    manualEntryLinkText: {
        fontFamily: FONT_FAMILIES.semiBold,
        fontSize: 11,
        color: '#8E8E93',
        textDecorationLine: 'underline',
    },

    // ── Manual Modal ──
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'flex-end',
    },
    manualModalCard: {
        borderTopLeftRadius: RADIUS.bottomSheet,
        borderTopRightRadius: RADIUS.bottomSheet,
        borderWidth: 2,
        borderBottomWidth: 0,
        padding: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalTitle: {
        fontFamily: FONT_FAMILIES.extraBold,
        fontSize: 16,
        letterSpacing: 0.8,
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSubtitle: {
        fontFamily: FONT_FAMILIES.medium,
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 6,
        lineHeight: 18,
    },
    modalInputWrap: {
        marginTop: 16,
        borderRadius: RADIUS.input,
        borderWidth: 1,
        paddingHorizontal: 14,
        height: 54,
        justifyContent: 'center',
    },
    modalTextInput: {
        fontFamily: FONT_FAMILIES.bold,
        fontSize: 18,
        letterSpacing: 1.5,
    },
    modalBtnRow: {
        marginTop: 18,
    },
    settingsModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    settingsModalSheet: {
        borderTopLeftRadius: RADIUS.bottomSheet,
        borderTopRightRadius: RADIUS.bottomSheet,
        borderTopWidth: 2,
        padding: SPACING.lg,
        paddingBottom: 36,
    },
    settingsModalHandle: {
        width: 36,
        height: 4,
        borderRadius: RADIUS.pill,
        alignSelf: 'center',
        marginBottom: 14,
    },
    settingsModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingsModalTitle: {
        fontSize: 17,
        fontFamily: FONT_FAMILIES.bold,
    },
    settingsModalClose: {
        padding: 4,
    },
    settingsModalSub: {
        fontSize: 12.5,
        fontFamily: FONT_FAMILIES.medium,
        marginTop: 4,
        marginBottom: 16,
        lineHeight: 18,
    },
    cutoffOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: RADIUS.button,
        marginVertical: 4,
        borderWidth: 1.5,
        borderBottomWidth: 3,
    },
    cutoffOptionText: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.semiBold,
    },
});
