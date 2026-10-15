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
    CheckCircle2,
    ChevronLeft,
    Flashlight,
    FlashlightOff,
    Keyboard,
    MapPin,
    Radio,
    RotateCcw,
    ScanLine,
    ShieldCheck,
    Sparkles,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIEWFINDER_SIZE = Math.min(SCREEN_WIDTH * 0.62, 230);

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

        navigation.navigate('ChargingSession', {
            stationId: stationToUse.id,
            connectorId: connectorToUse,
            stationSnapshot: stationToUse,
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

    // Cycle nearby station
    const handleNextStation = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        setCurrentStationIndex((prev) => (prev + 1) % Math.min(stationsList.length, 5));
    };

    // Connector Icon Resolver
    const renderConnectorIcon = (type: Connector['type'], size = 22, color = '#FFFFFF') => {
        switch (type) {
            case 'CCS2':
                return <Ccs2Icon size={size} color={color} />;
            case 'Type 2':
                return <Type2Icon size={size} color={color} />;
            case 'CHAdeMO':
                return <ChademoIcon size={size} color={color} />;
            default:
                return <Zap size={size} color={color} />;
        }
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
                                onPress={() => navigation.goBack()}
                                activeOpacity={0.8}
                            >
                                <ChevronLeft size={20} color="#FFFFFF" />
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
                                onPress={() => setIsManualModalVisible(true)}
                                activeOpacity={0.8}
                            >
                                <Keyboard size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>

                {/* ── CENTRAL TARGETING RETICLE & ANIMATED LASER BEAM ── */}
                <View style={styles.reticleWrap} pointerEvents="none">
                    <View style={styles.reticleBox}>
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
                    <View style={styles.reticleHint}>
                        <ThemedText style={styles.reticleHintText}>
                            Point camera at the QR code on the charger dispenser
                        </ThemedText>
                    </View>
                </View>
            </View>

            {/* ── BOTTOM SECTION: NEARBY CHARGER DRAWER ── */}
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

                        {/* Switch station if other chargers nearby */}
                        {stationsList.length > 1 && (
                            <TouchableOpacity
                                style={[
                                    styles.switchStationBtn,
                                    {
                                        backgroundColor: isDark ? '#1C1C24' : '#F2F2F6',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#000000',
                                    },
                                ]}
                                onPress={handleNextStation}
                                activeOpacity={0.8}
                            >
                                <RotateCcw size={12} color={isDark ? '#FFFFFF' : '#000000'} />
                                <ThemedText style={styles.switchStationBtnText}>
                                    NEXT ({currentStationIndex + 1}/{Math.min(stationsList.length, 5)})
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* ── CONNECTOR SELECTOR TILES ── */}
                    <ThemedText style={styles.selectConnectorLabel}>
                        SELECT CHARGING CONNECTOR
                    </ThemedText>

                    <View style={styles.connectorsRow}>
                        {nearbyStation.connectors.map((conn, idx) => {
                            const isSelected = conn.id === selectedConnectorId;
                            const isVehicleMatch =
                                selectedVehicle?.connectorType &&
                                conn.type.toUpperCase().includes(
                                    selectedVehicle.connectorType.toUpperCase()
                                );
                            const isAvailable = conn.status === 'Available';

                            return (
                                <TouchableOpacity
                                    key={conn.id}
                                    style={[
                                        styles.connectorTile,
                                        {
                                            backgroundColor: isSelected
                                                ? (isDark ? '#1C1C26' : '#F6F6FA')
                                                : (isDark ? '#13131A' : '#FFFFFF'),
                                            borderColor: isSelected
                                                ? (isDark ? '#00F2FE' : '#000000')
                                                : (isDark ? 'rgba(255, 255, 255, 0.12)' : '#E0E0E6'),
                                            borderWidth: isSelected ? 2 : 1.5,
                                            borderBottomWidth: isSelected ? 4 : 2.5,
                                        },
                                    ]}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }
                                        setSelectedConnectorId(conn.id);
                                    }}
                                    activeOpacity={0.88}
                                >
                                    {/* Match Badge */}
                                    {isVehicleMatch && (
                                        <View style={styles.vehicleMatchBadge}>
                                            <ShieldCheck size={10} color="#00F2FE" />
                                            <ThemedText style={styles.vehicleMatchText}>
                                                EV MATCH
                                            </ThemedText>
                                        </View>
                                    )}

                                    {/* Icon & Gun Label */}
                                    <View style={styles.tileTopRow}>
                                        <View
                                            style={[
                                                styles.connectorIconCircle,
                                                {
                                                    backgroundColor: isSelected
                                                        ? (isDark ? '#FFFFFF' : '#000000')
                                                        : (isDark ? '#262632' : '#ECECEE'),
                                                },
                                            ]}
                                        >
                                            {renderConnectorIcon(
                                                conn.type,
                                                18,
                                                isSelected
                                                    ? (isDark ? '#000000' : '#FFFFFF')
                                                    : (isDark ? '#FFFFFF' : '#000000')
                                            )}
                                        </View>

                                        <View style={styles.gunMeta}>
                                            <ThemedText style={styles.gunLabel}>
                                                {conn.gunLabel ?? `Gun ${idx + 1}`}
                                            </ThemedText>
                                            <ThemedText style={styles.connType}>
                                                {conn.type}
                                            </ThemedText>
                                        </View>
                                    </View>

                                    {/* Power & Tariff Stats */}
                                    <View style={styles.tileBottomRow}>
                                        <View style={styles.powerBadge}>
                                            <Zap size={11} color="#00F2FE" fill="#00F2FE" />
                                            <ThemedText style={styles.powerBadgeText}>
                                                {conn.power} kW
                                            </ThemedText>
                                        </View>

                                        <ThemedText style={styles.tariffText}>
                                            ₹{conn.pricePerKWh.toFixed(2)}/kWh
                                        </ThemedText>
                                    </View>

                                    {/* Availability Chip */}
                                    <View style={styles.statusRow}>
                                        <View
                                            style={[
                                                styles.statusDot,
                                                {
                                                    backgroundColor: isAvailable
                                                        ? '#10B981'
                                                        : '#F59E0B',
                                                },
                                            ]}
                                        />
                                        <ThemedText style={styles.statusLabel}>
                                            {conn.status}
                                        </ThemedText>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* ── INSTANT ACTION BUTTON ── */}
                    <CredButton
                        title={`START CHARGING • ${activeConnector.gunLabel ?? activeConnector.type}`}
                        variant="neon"
                        containerStyle={styles.startChargeBtn}
                        onPress={() => handleStartSession(activeConnector.id)}
                    />

                    {/* Manual Code Option Link */}
                    <TouchableOpacity
                        style={styles.manualEntryLink}
                        onPress={() => setIsManualModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={styles.manualEntryLinkText}>
                            Can't scan? Enter 6-digit Charger Code manually
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
        width: 42,
        height: 42,
        borderRadius: RADIUS.circle,
        backgroundColor: 'rgba(20, 20, 26, 0.75)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
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
        marginTop: -30,
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
        marginTop: 14,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: RADIUS.pill,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    reticleHintText: {
        fontFamily: FONT_FAMILIES.medium,
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
        letterSpacing: 0.2,
    },

    // ── Bottom Drawer (Nearby Charger) ──
    bottomDrawer: {
        borderTopLeftRadius: RADIUS.bottomSheet,
        borderTopRightRadius: RADIUS.bottomSheet,
        borderWidth: 2,
        borderBottomWidth: 0,
        position: 'relative',
        maxHeight: SCREEN_HEIGHT * 0.48,
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
    switchStationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: RADIUS.pill,
        borderWidth: 1.2,
    },
    switchStationBtnText: {
        fontFamily: FONT_FAMILIES.bold,
        fontSize: 9.5,
        letterSpacing: 0.5,
    },

    // ── Connectors ──
    selectConnectorLabel: {
        fontFamily: FONT_FAMILIES.bold,
        fontSize: 10,
        color: '#8E8E93',
        letterSpacing: 0.8,
        marginTop: 14,
        marginBottom: 8,
    },
    connectorsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    connectorTile: {
        flex: 1,
        borderRadius: RADIUS.card,
        padding: 12,
        position: 'relative',
    },
    vehicleMatchBadge: {
        position: 'absolute',
        top: -8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#000000',
        borderWidth: 1,
        borderColor: '#00F2FE',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: RADIUS.pill,
    },
    vehicleMatchText: {
        fontFamily: FONT_FAMILIES.extraBold,
        fontSize: 8,
        color: '#00F2FE',
        letterSpacing: 0.5,
    },
    tileTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    connectorIconCircle: {
        width: 34,
        height: 34,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gunMeta: {
        flex: 1,
    },
    gunLabel: {
        fontFamily: FONT_FAMILIES.bold,
        fontSize: 12,
    },
    connType: {
        fontFamily: FONT_FAMILIES.semiBold,
        fontSize: 10,
        color: '#8E8E93',
    },
    tileBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    powerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(0, 242, 254, 0.12)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: RADIUS.chip,
    },
    powerBadgeText: {
        fontFamily: FONT_FAMILIES.extraBold,
        fontSize: 10,
        color: '#00F2FE',
    },
    tariffText: {
        fontFamily: FONT_FAMILIES.bold,
        fontSize: 10.5,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 6,
    },
    statusDot: {
        width: 5,
        height: 5,
        borderRadius: RADIUS.circle,
    },
    statusLabel: {
        fontFamily: FONT_FAMILIES.medium,
        fontSize: 9.5,
        color: '#8E8E93',
    },

    // ── Start Charge Button ──
    startChargeBtn: {
        marginTop: 14,
    },
    manualEntryLink: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
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
        borderWidth: 1.8,
        borderBottomWidth: 3.5,
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
});
