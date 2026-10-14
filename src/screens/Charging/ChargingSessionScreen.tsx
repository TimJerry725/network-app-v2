import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
    Circle,
    Defs,
    Line,
    LinearGradient as SvgGradient,
    Path,
    Rect,
    Stop,
} from 'react-native-svg';
import {
    BatteryCharging,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Coffee,
    Info,
    Pencil,
    ShieldCheck,
    Wifi,
    X,
    Zap,
} from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import {
    MOCK_STATIONS,
    Station,
    findStationByConnector,
    getRecommendedConnector,
    getStationById,
} from '../../constants/Stations';
import { RADIUS, SPACING } from '../../constants/Tokens';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles, Vehicle } from '../../context/VehicleContext';
import { useCharging } from '../../context/ChargingContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 150;
const RING_SIZE = 170;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function ChargingSessionScreen({ navigation, route }: any) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { vehicles, selectedVehicle, selectVehicle } = useVehicles();
    const {
        activeSession,
        startChargingSession,
        stopChargingSession,
        updateTargetSoc: setContextTargetSoc,
    } = useCharging();

    // ── Station & Connector Resolution ──
    const routeStation = route.params?.stationSnapshot as Station | undefined;
    const station: Station =
        routeStation ??
        getStationById(route.params?.stationId) ??
        findStationByConnector(route.params?.connectorId)?.station ??
        MOCK_STATIONS[0];

    const connector =
        station.connectors.find((item) => item.id === route.params?.connectorId) ??
        getRecommendedConnector(station);

    const initialTargetSoc = route.params?.targetSoc ?? selectedVehicle?.chargeTarget ?? 80;

    // ── Target SoC State & Controller ──
    const [targetSoc, setTargetSoc] = useState<number>(activeSession?.targetSoc ?? initialTargetSoc);

    // ── Curve Type Toggle: Speed vs. Time ──
    const [curveType, setCurveType] = useState<'speed' | 'time'>('speed');

    // ── Modals State ──
    const [isVehicleModalVisible, setIsVehicleModalVisible] = useState(false);
    const [isStopConfirmVisible, setIsStopConfirmVisible] = useState(false);

    // Start session if none active
    useEffect(() => {
        if (!activeSession) {
            startChargingSession({
                stationId: station.id,
                stationName: station.name,
                stationAddress: station.address,
                chargerId: connector.id,
                connectorId: connector.id,
                connectorType: connector.type,
                powerRatingKw: connector.power,
                pricePerKWh: connector.pricePerKWh,
                vehicleId: selectedVehicle?.id ?? '1',
                vehicleModel: selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'Hyundai Ioniq 5',
                vehicleRegNo: selectedVehicle?.registrationNumber ?? 'TN 38 BZ 7927',
                startSoc: selectedVehicle?.currentBattery ?? 33,
                targetSoc,
            });
        }
    }, [activeSession, connector, selectedVehicle, startChargingSession, station, targetSoc]);

    // Handle updating charge limit
    const handleSelectTargetSoc = (newTarget: number) => {
        setTargetSoc(newTarget);
        setContextTargetSoc(newTarget);
    };

    // Live Metrics
    const soc = activeSession ? Math.round(activeSession.currentSoc) : (selectedVehicle?.currentBattery ?? 45);
    const startSoc = activeSession?.startSoc ?? 33;
    const currentPower = activeSession ? activeSession.currentPowerKw : Math.min(22, connector.power);
    const maxPower = connector.power || 24;
    const deliveredKwh = activeSession ? activeSession.energyDeliveredKwh : 5.50;
    const totalCost = activeSession ? activeSession.totalCost : Number((deliveredKwh * connector.pricePerKWh).toFixed(2));
    const elapsedSecondsTotal = activeSession ? activeSession.elapsedSeconds : 15 * 60 + 5;
    const rangeAdded = Math.round(deliveredKwh * 6.36); // ~35 km for 5.5 kWh

    // Driver Insights & Calculations
    const remainingSoc = Math.max(0, targetSoc - soc);
    const estMinutesRemaining = Math.max(1, Math.round(remainingSoc * 0.42)); // ~14m from 45% to 80%
    const etaString = useMemo(() => {
        const d = new Date(Date.now() + estMinutesRemaining * 60 * 1000);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, [estMinutesRemaining]);

    const speedEfficiencyPercent = Math.min(100, Math.round((currentPower / maxPower) * 100));
    const kmPerMinIntake = ((currentPower / (selectedVehicle?.batteryCapacity ?? 72.6)) * (selectedVehicle?.estRangeKm ?? 320) / 60).toFixed(1);

    // Format time as HH : MM : SS
    const formatTime = (totalSeconds: number) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const pad = (n: number) => String(n).padStart(2, '0');
        if (hrs > 0) {
            return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
        }
        return `${pad(mins)}m ${pad(secs)}s`;
    };

    // Autocharge state
    const [isAutochargeEnabled, setIsAutochargeEnabled] = useState(selectedVehicle?.autochargeEnabled ?? true);

    // Current Vehicle Display
    const currentVeh = selectedVehicle ?? vehicles[0] ?? {
        id: '1',
        nickname: 'Primary EV',
        make: 'Hyundai',
        model: 'Ioniq 5',
        year: '2024',
        registrationNumber: 'TN 38 BZ 7927',
        connectorType: 'CCS2',
        batteryCapacity: 72.6,
        maxDcRateKw: 220,
        currentBattery: 45,
        estRangeKm: 320,
        chargeTarget: 80,
        autochargeEnabled: true,
        perks: [],
    };

    // ── Hero Ring Coordinates ──
    const clampedSoc = Math.min(Math.max(soc, 0), 100);
    const ringDashoffset = RING_CIRCUMFERENCE * (1 - clampedSoc / 100);

    // Target Marker position on the circular ring
    const targetAngleRad = ((targetSoc / 100) * 360 - 90) * (Math.PI / 180);
    const targetMarkerX = RING_SIZE / 2 + RING_RADIUS * Math.cos(targetAngleRad);
    const targetMarkerY = RING_SIZE / 2 + RING_RADIUS * Math.sin(targetAngleRad);

    // ── Chart Geometry: Speed vs SoC & Speed vs Time ──
    const [cardContentWidth, setCardContentWidth] = useState(SCREEN_WIDTH - 32);
    const yAxisWidth = 32;
    const chartW = Math.max(100, cardContentWidth - yAxisWidth);
    const padTop = 18;
    const padBottom = 16;
    const usableH = CHART_HEIGHT - padTop - padBottom;
    const yPeak = padTop;
    const yBase = CHART_HEIGHT - padBottom;

    // Speed coordinates
    const speedCurrX = (clampedSoc / 100) * chartW;
    const taperX = 0.8 * chartW;
    const speedCurrY = useMemo(() => {
        if (clampedSoc <= 80) return yPeak;
        const t = (clampedSoc - 80) / 20;
        return yPeak + t * (usableH * 0.78);
    }, [clampedSoc, yPeak, usableH]);

    const speedFilledPath = useMemo(() => {
        const rampW = Math.min(20, speedCurrX * 0.35);
        if (clampedSoc <= 80) {
            return `M 0 ${yBase} C ${rampW * 0.5} ${yBase}, ${rampW * 0.8} ${yPeak}, ${rampW} ${yPeak} L ${speedCurrX} ${yPeak} L ${speedCurrX} ${yBase} Z`;
        }
        return `M 0 ${yBase} C ${rampW * 0.5} ${yBase}, ${rampW * 0.8} ${yPeak}, ${rampW} ${yPeak} L ${taperX} ${yPeak} C ${taperX + 8} ${yPeak}, ${speedCurrX - 8} ${speedCurrY}, ${speedCurrX} ${speedCurrY} L ${speedCurrX} ${yBase} Z`;
    }, [clampedSoc, speedCurrX, speedCurrY, taperX, yBase, yPeak]);

    const speedCrestPath = useMemo(() => {
        const rampW = Math.min(20, speedCurrX * 0.35);
        if (clampedSoc <= 80) {
            return `M 0 ${yBase} C ${rampW * 0.5} ${yBase}, ${rampW * 0.8} ${yPeak}, ${rampW} ${yPeak} L ${speedCurrX} ${yPeak}`;
        }
        return `M 0 ${yBase} C ${rampW * 0.5} ${yBase}, ${rampW * 0.8} ${yPeak}, ${rampW} ${yPeak} L ${taperX} ${yPeak} C ${taperX + 8} ${yPeak}, ${speedCurrX - 8} ${speedCurrY}, ${speedCurrX} ${speedCurrY}`;
    }, [clampedSoc, speedCurrX, speedCurrY, taperX, yBase, yPeak]);

    // Time coordinates (0 to 30 mins)
    const elapsedMinutes = Math.min(30, Math.floor(elapsedSecondsTotal / 60));
    const timeCurrX = Math.max(10, (elapsedMinutes / 30) * chartW);
    const timeCurrY = yPeak;

    const timeFilledPath = useMemo(() => {
        const rampW = Math.min(24, timeCurrX * 0.4);
        return `M 0 ${yBase} C ${rampW * 0.5} ${yBase}, ${rampW * 0.8} ${yPeak}, ${rampW} ${yPeak} L ${timeCurrX} ${yPeak} L ${timeCurrX} ${yBase} Z`;
    }, [timeCurrX, yBase, yPeak]);

    const timeCrestPath = useMemo(() => {
        const rampW = Math.min(24, timeCurrX * 0.4);
        return `M 0 ${yBase} C ${rampW * 0.5} ${yBase}, ${rampW * 0.8} ${yPeak}, ${rampW} ${yPeak} L ${timeCurrX} ${yPeak}`;
    }, [timeCurrX, yBase, yPeak]);

    // Stop Charging confirmation flow
    const executeStopCharging = () => {
        setIsStopConfirmVisible(false);
        const receipt = stopChargingSession('Driver initiated stop');
        if (receipt) {
            navigation.navigate('Payment', {
                receipt,
                stationSnapshot: station,
                totalEnergy: receipt.energyDeliveredKwh,
                totalTime: Math.max(1, Math.floor(elapsedSecondsTotal / 60)),
                cost: receipt.totalAmountPaid,
                earnedPoints: Math.round(deliveredKwh * 3 + 20),
                endingSoc: receipt.endSoc,
            });
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            {/* ── 1. Top Navigation Bar ── */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    style={[styles.backChevronBtn, { backgroundColor: isDark ? colors.surface : '#FFFFFF' }]}
                    activeOpacity={0.75}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={22} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.stationInfoWrap}>
                    <ThemedText style={[styles.stationTitle, { color: colors.text }]} numberOfLines={1}>
                        {station.name}
                    </ThemedText>
                    <ThemedText style={[styles.stationSub, { color: colors.textMuted }]}>
                        Bay 02 • {connector.type} {connector.power} kW Fast Charger
                    </ThemedText>
                </View>

                {/* Live Pulse Badge */}
                <View style={[styles.activeStatusPill, { backgroundColor: isDark ? 'rgba(91, 194, 114, 0.15)' : '#DCFCE7' }]}>
                    <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
                    <ThemedText style={[styles.activeStatusText, { color: colors.primary }]}>
                        Charging
                    </ThemedText>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
            >
                {/* ── 2. HERO BATTERY & TIME STATUS CARD ── */}
                <View style={[styles.heroCard, { backgroundColor: isDark ? colors.surface : '#FFFFFF' }]}>
                    {/* Ring Container */}
                    <View style={styles.ringCenterWrap}>
                        <Svg width={RING_SIZE} height={RING_SIZE}>
                            {/* Track Circle */}
                            <Circle
                                cx={RING_SIZE / 2}
                                cy={RING_SIZE / 2}
                                r={RING_RADIUS}
                                stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}
                                strokeWidth={RING_STROKE}
                                fill="none"
                            />

                            {/* Active Emerald Progress Arc */}
                            <Circle
                                cx={RING_SIZE / 2}
                                cy={RING_SIZE / 2}
                                r={RING_RADIUS}
                                stroke={colors.primary}
                                strokeWidth={RING_STROKE}
                                strokeDasharray={RING_CIRCUMFERENCE}
                                strokeDashoffset={ringDashoffset}
                                strokeLinecap="round"
                                fill="none"
                                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                            />

                            {/* Target Marker Tick on Ring */}
                            <Circle
                                cx={targetMarkerX}
                                cy={targetMarkerY}
                                r={5}
                                fill={isDark ? '#F59E0B' : '#D97706'}
                            />
                            <Circle
                                cx={targetMarkerX}
                                cy={targetMarkerY}
                                r={2}
                                fill="#FFFFFF"
                            />
                        </Svg>

                        {/* Inside Ring Content */}
                        <View style={styles.ringInterior} pointerEvents="none">
                            <View style={styles.boltPill}>
                                <Zap size={14} color={colors.primary} fill={colors.primary} />
                                <ThemedText style={[styles.boltRateText, { color: colors.primary }]}>
                                    {currentPower} kW
                                </ThemedText>
                            </View>

                            <ThemedText style={[styles.ringBigPercent, { color: colors.text }]}>
                                {soc}%
                            </ThemedText>

                            <ThemedText style={[styles.ringRangeAdded, { color: colors.textMuted }]}>
                                +{rangeAdded} km added
                            </ThemedText>
                        </View>
                    </View>

                    {/* Time Remaining & Target ETA Banner */}
                    <View style={[styles.timeCountdownBanner, { backgroundColor: isDark ? colors.surfaceMuted : '#F8FAFC' }]}>
                        <Clock size={16} color={colors.primary} style={{ marginRight: 6 }} />
                        <ThemedText style={[styles.countdownPrimaryText, { color: colors.text }]}>
                            ~{estMinutesRemaining} mins remaining
                        </ThemedText>
                        <ThemedText style={[styles.countdownEtaText, { color: colors.textMuted }]}>
                            • Ready by {etaString} ({targetSoc}%)
                        </ThemedText>
                    </View>

                    {/* Target Limit Selector */}
                    <View style={styles.targetLimitSection}>
                        <View style={styles.targetLimitHeaderRow}>
                            <ThemedText style={[styles.targetLimitLabel, { color: colors.textMuted }]}>
                                Charge Target Limit
                            </ThemedText>
                            <ThemedText style={[styles.targetLimitValue, { color: colors.primary }]}>
                                {targetSoc}% {targetSoc === 80 ? '• Recommended' : ''}
                            </ThemedText>
                        </View>

                        {/* Quick Presets: 70%, 80%, 90%, 100% */}
                        <View style={styles.targetPresetRow}>
                            {[70, 80, 90, 100].map((preset) => {
                                const isSelected = targetSoc === preset;
                                return (
                                    <TouchableOpacity
                                        key={`preset-${preset}`}
                                        style={[
                                            styles.targetPresetBtn,
                                            {
                                                backgroundColor: isSelected
                                                    ? colors.primary
                                                    : (isDark ? colors.surfaceMuted : '#F1F5F9'),
                                            },
                                        ]}
                                        activeOpacity={0.8}
                                        onPress={() => handleSelectTargetSoc(preset)}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.targetPresetText,
                                                { color: isSelected ? '#FFFFFF' : colors.text },
                                                isSelected && { fontFamily: 'RedHatDisplay_700Bold', fontWeight: '700' },
                                            ]}
                                        >
                                            {preset}%{preset === 80 ? ' ★' : ''}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <ThemedText style={[styles.bmsAdviceNote, { color: colors.textMuted }]}>
                            Tip: 80% daily charge protects battery health and charges 3× faster.
                        </ThemedText>
                    </View>
                </View>

                {/* ── 3. TELEMETRY DASHBOARD (2×2 UNIFIED QUADRANT) ── */}
                <View style={[styles.telemetryCard, { backgroundColor: isDark ? colors.surface : '#FFFFFF' }]}>
                    <View style={styles.telemetryRow}>
                        {/* 3A. Charging Speed */}
                        <View style={styles.telemetryQuadrant}>
                            <View style={styles.telemetryLabelRow}>
                                <Zap size={14} color={colors.primary} style={{ marginRight: 5 }} />
                                <ThemedText style={[styles.telemetryLabel, { color: colors.textMuted }]}>
                                    Charging Speed
                                </ThemedText>
                            </View>
                            <ThemedText style={[styles.telemetryMainVal, { color: colors.text }]}>
                                {currentPower} <ThemedText style={[styles.telemetryUnit, { color: colors.textMuted }]}>kW</ThemedText>
                            </ThemedText>
                            <ThemedText style={[styles.telemetrySubText, { color: colors.textMuted }]}>
                                {speedEfficiencyPercent}% Peak • +{kmPerMinIntake} km/m
                            </ThemedText>
                        </View>

                        <View style={[styles.verticalDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]} />

                        {/* 3B. Charging Time */}
                        <View style={styles.telemetryQuadrant}>
                            <View style={styles.telemetryLabelRow}>
                                <Clock size={14} color={colors.primary} style={{ marginRight: 5 }} />
                                <ThemedText style={[styles.telemetryLabel, { color: colors.textMuted }]}>
                                    Elapsed Time
                                </ThemedText>
                            </View>
                            <ThemedText style={[styles.telemetryMainVal, { color: colors.text }]}>
                                {formatTime(elapsedSecondsTotal)}
                            </ThemedText>
                            <ThemedText style={[styles.telemetrySubText, { color: colors.textMuted }]}>
                                Session Active
                            </ThemedText>
                        </View>
                    </View>

                    <View style={[styles.horizontalDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]} />

                    <View style={styles.telemetryRow}>
                        {/* 3C. Energy Delivered */}
                        <View style={styles.telemetryQuadrant}>
                            <View style={styles.telemetryLabelRow}>
                                <BatteryCharging size={14} color={colors.primary} style={{ marginRight: 5 }} />
                                <ThemedText style={[styles.telemetryLabel, { color: colors.textMuted }]}>
                                    Energy Delivered
                                </ThemedText>
                            </View>
                            <ThemedText style={[styles.telemetryMainVal, { color: colors.text }]}>
                                {deliveredKwh.toFixed(2)} <ThemedText style={[styles.telemetryUnit, { color: colors.textMuted }]}>kWh</ThemedText>
                            </ThemedText>
                            <ThemedText style={[styles.telemetrySubText, { color: colors.textMuted }]}>
                                @ ₹{connector.pricePerKWh.toFixed(2)} / kWh
                            </ThemedText>
                        </View>

                        <View style={[styles.verticalDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]} />

                        {/* 3D. Live Bill */}
                        <View style={styles.telemetryQuadrant}>
                            <View style={styles.telemetryLabelRow}>
                                <ShieldCheck size={14} color={colors.primary} style={{ marginRight: 5 }} />
                                <ThemedText style={[styles.telemetryLabel, { color: colors.textMuted }]}>
                                    Live Session Cost
                                </ThemedText>
                            </View>
                            <ThemedText style={[styles.telemetryMainVal, { color: colors.text }]}>
                                ₹{totalCost.toFixed(2)}
                            </ThemedText>
                            <ThemedText style={[styles.telemetrySubText, { color: colors.primary }]}>
                                Iris Wallet Auto-pay
                            </ThemedText>
                        </View>
                    </View>
                </View>

                {/* ── 4. POWER INTAKE CURVE CARD ── */}
                <View
                    style={[styles.curveCard, { backgroundColor: isDark ? colors.surface : '#FFFFFF' }]}
                    onLayout={(e) => {
                        const w = e.nativeEvent.layout.width - 20;
                        if (w > 0) setCardContentWidth(w);
                    }}
                >
                    <View style={styles.curveHeader}>
                        <View>
                            <ThemedText style={[styles.curveCardTitle, { color: colors.text }]}>
                                Power Flow Analytics
                            </ThemedText>
                            <ThemedText style={[styles.curveCardSub, { color: colors.textMuted }]}>
                                Real-time dispenser intake rate
                            </ThemedText>
                        </View>

                        {/* Segmented Toggle: Speed vs Time */}
                        <View style={[styles.miniToggleWrap, { backgroundColor: isDark ? colors.surfaceMuted : '#F1F5F9' }]}>
                            <TouchableOpacity
                                style={[
                                    styles.miniToggleBtn,
                                    curveType === 'speed' && [
                                        styles.miniToggleBtnActive,
                                        { backgroundColor: isDark ? 'rgba(91, 194, 114, 0.2)' : '#DCFCE7' },
                                    ],
                                ]}
                                activeOpacity={0.8}
                                onPress={() => setCurveType('speed')}
                            >
                                <ThemedText
                                    style={[
                                        styles.miniToggleText,
                                        { color: curveType === 'speed' ? colors.primary : colors.textMuted },
                                    ]}
                                >
                                    SoC %
                                </ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.miniToggleBtn,
                                    curveType === 'time' && [
                                        styles.miniToggleBtnActive,
                                        { backgroundColor: isDark ? 'rgba(91, 194, 114, 0.2)' : '#DCFCE7' },
                                    ],
                                ]}
                                activeOpacity={0.8}
                                onPress={() => setCurveType('time')}
                            >
                                <ThemedText
                                    style={[
                                        styles.miniToggleText,
                                        { color: curveType === 'time' ? colors.primary : colors.textMuted },
                                    ]}
                                >
                                    Time
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Chart Svg Canvas */}
                    <View style={styles.chartContainer}>
                        {/* Y-Axis Column */}
                        <View style={styles.yAxisColumn}>
                            <ThemedText style={[styles.yTickText, { color: colors.textMuted }]}>
                                {maxPower}
                            </ThemedText>
                            <ThemedText style={[styles.yAxisLabel, { color: colors.textMuted }]}>
                                Speed (kW)
                            </ThemedText>
                            <ThemedText style={[styles.yTickText, { color: colors.textMuted }]}>
                                0
                            </ThemedText>
                        </View>

                        {/* Chart Area */}
                        <View style={[styles.canvasBox, { width: chartW, height: CHART_HEIGHT }]}>
                            <Svg width={chartW} height={CHART_HEIGHT}>
                                <Defs>
                                    <SvgGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <Stop offset="0%" stopColor={colors.primary} stopOpacity={isDark ? '0.65' : '0.45'} />
                                        <Stop offset="100%" stopColor={colors.primary} stopOpacity={isDark ? '0.12' : '0.08'} />
                                    </SvgGradient>
                                </Defs>

                                {/* 80% to 100% BMS Taper Zone Background */}
                                {curveType === 'speed' && (
                                    <Rect
                                        x={taperX}
                                        y={padTop}
                                        width={chartW - taperX}
                                        height={usableH}
                                        fill={isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(30, 151, 49, 0.05)'}
                                    />
                                )}

                                {/* 80% Taper Divider Line */}
                                {curveType === 'speed' && (
                                    <Line
                                        x1={taperX}
                                        y1={padTop}
                                        x2={taperX}
                                        y2={yBase}
                                        stroke={isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(30, 151, 49, 0.2)'}
                                        strokeWidth={1.5}
                                    />
                                )}

                                {/* Baseline Track Line */}
                                <Line
                                    x1={0}
                                    y1={yBase}
                                    x2={chartW}
                                    y2={yBase}
                                    stroke={isDark ? 'rgba(255, 255, 255, 0.15)' : '#E2E8F0'}
                                    strokeWidth={1}
                                />

                                {/* Filled Curve Wave */}
                                <Path
                                    d={curveType === 'speed' ? speedFilledPath : timeFilledPath}
                                    fill="url(#curveGradient)"
                                />

                                {/* Top Crest Stroke */}
                                <Path
                                    d={curveType === 'speed' ? speedCrestPath : timeCrestPath}
                                    stroke={colors.primary}
                                    strokeWidth={2.5}
                                    fill="none"
                                    strokeLinecap="round"
                                />

                                {/* Live Vertical Guideline */}
                                <Line
                                    x1={curveType === 'speed' ? speedCurrX : timeCurrX}
                                    y1={curveType === 'speed' ? speedCurrY : timeCurrY}
                                    x2={curveType === 'speed' ? speedCurrX : timeCurrX}
                                    y2={yBase}
                                    stroke={colors.primary}
                                    strokeWidth={1}
                                    strokeDasharray="2 2"
                                />

                                {/* Live Front Point Beacon */}
                                <Circle
                                    cx={curveType === 'speed' ? speedCurrX : timeCurrX}
                                    cy={curveType === 'speed' ? speedCurrY : timeCurrY}
                                    r={5}
                                    fill={colors.primary}
                                />
                                <Circle
                                    cx={curveType === 'speed' ? speedCurrX : timeCurrX}
                                    cy={curveType === 'speed' ? speedCurrY : timeCurrY}
                                    r={2}
                                    fill="#FFFFFF"
                                />
                            </Svg>

                            {/* Watermark in center */}
                            <View style={styles.watermarkWrap} pointerEvents="none">
                                <ThemedText
                                    style={[
                                        styles.watermarkText,
                                        { color: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(30, 151, 49, 0.14)' },
                                    ]}
                                >
                                    {curveType === 'speed' ? `${soc}%` : `${elapsedMinutes}m`}
                                </ThemedText>
                            </View>

                            {/* 3 kW Trickle Tag at Bottom Right */}
                            {curveType === 'speed' && (
                                <View style={styles.trickleTag} pointerEvents="none">
                                    <ThemedText style={[styles.trickleTagText, { color: isDark ? '#A1A1AA' : '#94A3B8' }]}>
                                        3 kW Trickle
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* X-Axis Scale */}
                    <View style={[styles.xAxisRow, { paddingLeft: yAxisWidth }]}>
                        {curveType === 'speed' ? (
                            <>
                                <ThemedText style={[styles.xTickText, { color: colors.textMuted }]}>0</ThemedText>
                                <ThemedText style={[styles.xAxisLabel, { color: colors.textMuted }]}>Battery SoC (%)</ThemedText>
                                <ThemedText style={[styles.xTickText, { color: colors.textMuted }]}>80%</ThemedText>
                                <ThemedText style={[styles.xTickText, { color: colors.textMuted }]}>100%</ThemedText>
                            </>
                        ) : (
                            <>
                                <ThemedText style={[styles.xTickText, { color: colors.textMuted }]}>0m</ThemedText>
                                <ThemedText style={[styles.xAxisLabel, { color: colors.textMuted }]}>Charging Time (min)</ThemedText>
                                <ThemedText style={[styles.xTickText, { color: colors.textMuted }]}>15m</ThemedText>
                                <ThemedText style={[styles.xTickText, { color: colors.textMuted }]}>30m</ThemedText>
                            </>
                        )}
                    </View>
                </View>

                {/* ── 5. CONNECTED VEHICLE & AUTOCHARGE CARD ── */}
                <View style={[styles.vehicleCard, { backgroundColor: isDark ? colors.surface : '#FFFFFF' }]}>
                    <View style={styles.vehicleCardMainRow}>
                        <View style={styles.vehicleInfoCol}>
                            <ThemedText style={[styles.vehicleModelName, { color: colors.text }]}>
                                {currentVeh.make} {currentVeh.model}
                            </ThemedText>
                            <ThemedText style={[styles.vehiclePlateSpecs, { color: colors.textMuted }]}>
                                {currentVeh.registrationNumber} • {currentVeh.batteryCapacity} kWh ({currentVeh.connectorType})
                            </ThemedText>
                        </View>

                        <TouchableOpacity
                            style={[styles.editPencilBtn, { backgroundColor: isDark ? colors.surfaceMuted : '#F8FAFC' }]}
                            activeOpacity={0.7}
                            onPress={() => setIsVehicleModalVisible(true)}
                        >
                            <Pencil size={17} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Autocharge Strip inside Vehicle Card */}
                    <TouchableOpacity
                        style={[
                            styles.autochargeRow,
                            {
                                backgroundColor: isAutochargeEnabled
                                    ? (isDark ? 'rgba(91, 194, 114, 0.12)' : '#F0FDF4')
                                    : (isDark ? colors.surfaceMuted : '#F8FAFC'),
                            },
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setIsAutochargeEnabled((prev) => !prev)}
                    >
                        <View style={[styles.autochargeDot, { backgroundColor: isAutochargeEnabled ? colors.primary : '#94A3B8' }]} />
                        <ThemedText style={[styles.autochargeRowTitle, { color: colors.text }]}>
                            {isAutochargeEnabled ? 'Autocharge Active — Plug & Charge enabled' : 'Tap to enable Autocharge'}
                        </ThemedText>
                        <ChevronRight size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* ── 6. STATION AMENITIES WHILE WAITING ── */}
                <View style={[styles.amenitiesCard, { backgroundColor: isDark ? colors.surface : '#FFFFFF' }]}>
                    <ThemedText style={[styles.amenitiesHeader, { color: colors.textMuted }]}>
                        Amenities at this station
                    </ThemedText>
                    <View style={styles.amenitiesRow}>
                        <View style={[styles.amenityChip, { backgroundColor: isDark ? colors.surfaceMuted : '#F8FAFC' }]}>
                            <Coffee size={13} color={colors.primary} style={{ marginRight: 5 }} />
                            <ThemedText style={[styles.amenityText, { color: colors.text }]}>
                                Coffee Lounge
                            </ThemedText>
                        </View>
                        <View style={[styles.amenityChip, { backgroundColor: isDark ? colors.surfaceMuted : '#F8FAFC' }]}>
                            <Wifi size={13} color={colors.primary} style={{ marginRight: 5 }} />
                            <ThemedText style={[styles.amenityText, { color: colors.text }]}>
                                Free Wi-Fi
                            </ThemedText>
                        </View>
                        <View style={[styles.amenityChip, { backgroundColor: isDark ? colors.surfaceMuted : '#F8FAFC' }]}>
                            <ThemedText style={[styles.amenityText, { color: colors.text }]}>
                                🚻 Restrooms
                            </ThemedText>
                        </View>
                    </View>
                </View>

                {/* ── 7. STOP CHARGING ACTION BUTTON ── */}
                <TouchableOpacity
                    style={[styles.stopChargingBtn, { backgroundColor: colors.primary }]}
                    activeOpacity={0.85}
                    onPress={() => setIsStopConfirmVisible(true)}
                >
                    <ThemedText style={styles.stopChargingBtnText}>
                        Stop Charging
                    </ThemedText>
                </TouchableOpacity>
            </ScrollView>

            {/* ── 8. SAFE STOP CHARGING CONFIRMATION MODAL ── */}
            <Modal
                visible={isStopConfirmVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsStopConfirmVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsStopConfirmVisible(false)}
                >
                    <View
                        style={[
                            styles.modalSheet,
                            {
                                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                                paddingBottom: insets.bottom + 16,
                            },
                        ]}
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={styles.modalHeader}>
                            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                                Stop Charging Session?
                            </ThemedText>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setIsStopConfirmVisible(false)}
                            >
                                <X size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ThemedText style={[styles.modalSub, { color: colors.textMuted }]}>
                            Battery has reached {soc}%. Your receipt and invoice will be generated immediately.
                        </ThemedText>

                        {/* Session Snapshot in Modal */}
                        <View style={[styles.modalSummaryBox, { backgroundColor: isDark ? colors.surfaceMuted : '#F8FAFC' }]}>
                            <View style={styles.modalSummaryItem}>
                                <ThemedText style={[styles.modalSummaryLabel, { color: colors.textMuted }]}>Battery</ThemedText>
                                <ThemedText style={[styles.modalSummaryVal, { color: colors.text }]}>{soc}%</ThemedText>
                            </View>
                            <View style={styles.modalSummaryItem}>
                                <ThemedText style={[styles.modalSummaryLabel, { color: colors.textMuted }]}>Energy</ThemedText>
                                <ThemedText style={[styles.modalSummaryVal, { color: colors.text }]}>{deliveredKwh.toFixed(2)} kWh</ThemedText>
                            </View>
                            <View style={styles.modalSummaryItem}>
                                <ThemedText style={[styles.modalSummaryLabel, { color: colors.textMuted }]}>Amount</ThemedText>
                                <ThemedText style={[styles.modalSummaryVal, { color: colors.primary }]}>₹{totalCost.toFixed(2)}</ThemedText>
                            </View>
                        </View>

                        <View style={styles.modalActionButtonsRow}>
                            <TouchableOpacity
                                style={[styles.modalCancelBtn, { backgroundColor: isDark ? colors.surfaceMuted : '#F1F5F9' }]}
                                activeOpacity={0.8}
                                onPress={() => setIsStopConfirmVisible(false)}
                            >
                                <ThemedText style={[styles.modalCancelText, { color: colors.text }]}>
                                    Keep Charging
                                </ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalConfirmStopBtn, { backgroundColor: '#DC2626' }]}
                                activeOpacity={0.85}
                                onPress={executeStopCharging}
                            >
                                <ThemedText style={styles.modalConfirmStopText}>
                                    Confirm & Stop
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── 9. VEHICLE SELECTION MODAL ── */}
            <Modal
                visible={isVehicleModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsVehicleModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsVehicleModalVisible(false)}
                >
                    <View
                        style={[
                            styles.modalSheet,
                            {
                                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                                paddingBottom: insets.bottom + 16,
                            },
                        ]}
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={styles.modalHeader}>
                            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                                Switch Charging Vehicle
                            </ThemedText>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setIsVehicleModalVisible(false)}
                            >
                                <X size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ThemedText style={[styles.modalSub, { color: colors.textMuted }]}>
                            Select the vehicle currently connected to this charger
                        </ThemedText>

                        <View style={styles.modalVehicleList}>
                            {vehicles.map((veh) => {
                                const isCurrent = currentVeh.id === veh.id;
                                return (
                                    <TouchableOpacity
                                        key={`modal-veh-${veh.id}`}
                                        style={[
                                            styles.modalVehicleItem,
                                            {
                                                backgroundColor: isCurrent
                                                    ? (isDark ? 'rgba(91, 194, 114, 0.12)' : '#F0FDF4')
                                                    : (isDark ? colors.surfaceMuted : '#F8FAFC'),
                                            },
                                        ]}
                                        activeOpacity={0.75}
                                        onPress={() => {
                                            selectVehicle(veh.id);
                                            setIsVehicleModalVisible(false);
                                        }}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <ThemedText style={[styles.modalVehName, { color: colors.text }]}>
                                                {veh.make} {veh.model}
                                            </ThemedText>
                                            <ThemedText style={[styles.modalVehPlate, { color: colors.textMuted }]}>
                                                {veh.registrationNumber} • {veh.batteryCapacity} kWh ({veh.connectorType})
                                            </ThemedText>
                                        </View>

                                        {isCurrent && (
                                            <View style={[styles.modalCheckBadge, { backgroundColor: colors.primary }]}>
                                                <Check size={14} color="#FFFFFF" strokeWidth={3} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },

    // ── 1. Top Bar ──
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingTop: 8,
        paddingBottom: 8,
    },
    backChevronBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    stationInfoWrap: {
        flex: 1,
    },
    stationTitle: {
        fontSize: 15,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    stationSub: {
        fontSize: 11,
        fontFamily: 'RedHatDisplay_500Medium',
        fontWeight: '500',
        marginTop: 1,
    },
    activeStatusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: RADIUS.pill,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    activeStatusText: {
        fontSize: 11,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },

    content: {
        paddingHorizontal: SPACING.md,
        paddingTop: 6,
        gap: 12,
    },

    // ── 2. HERO BATTERY & TIME STATUS CARD ──
    heroCard: {
        borderRadius: RADIUS.card,
        paddingVertical: 18,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    ringCenterWrap: {
        position: 'relative',
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringInterior: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boltPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginBottom: 2,
    },
    boltRateText: {
        fontSize: 12,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    ringBigPercent: {
        fontSize: 38,
        fontFamily: 'RedHatDisplay_800ExtraBold',
        fontWeight: '800',
        lineHeight: 44,
        letterSpacing: -1,
    },
    ringRangeAdded: {
        fontSize: 12,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
        marginTop: 2,
    },

    // Time Countdown Banner
    timeCountdownBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        marginTop: 16,
    },
    countdownPrimaryText: {
        fontSize: 13,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    countdownEtaText: {
        fontSize: 12,
        fontFamily: 'RedHatDisplay_500Medium',
        fontWeight: '500',
        marginLeft: 4,
    },

    // Target Limit Controls
    targetLimitSection: {
        width: '100%',
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.04)',
    },
    targetLimitHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    targetLimitLabel: {
        fontSize: 12,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
    },
    targetLimitValue: {
        fontSize: 12,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    targetPresetRow: {
        flexDirection: 'row',
        gap: 8,
    },
    targetPresetBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    targetPresetText: {
        fontSize: 12,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
    },
    bmsAdviceNote: {
        fontSize: 10,
        fontFamily: 'RedHatDisplay_500Medium',
        fontWeight: '500',
        marginTop: 8,
        textAlign: 'center',
    },

    // ── 3. TELEMETRY DASHBOARD ──
    telemetryCard: {
        borderRadius: RADIUS.card,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    telemetryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    telemetryQuadrant: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 6,
    },
    telemetryLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    telemetryLabel: {
        fontSize: 11,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
    },
    telemetryMainVal: {
        fontSize: 18,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    telemetryUnit: {
        fontSize: 12,
        fontFamily: 'RedHatDisplay_500Medium',
        fontWeight: '500',
    },
    telemetrySubText: {
        fontSize: 10,
        fontFamily: 'RedHatDisplay_500Medium',
        fontWeight: '500',
        marginTop: 2,
    },
    verticalDivider: {
        width: 1,
        height: '75%',
    },
    horizontalDivider: {
        height: 1,
        width: '100%',
        marginVertical: 4,
    },

    // ── 4. POWER INTAKE CURVE CARD ──
    curveCard: {
        borderRadius: RADIUS.card,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    curveHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    curveCardTitle: {
        fontSize: 14,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    curveCardSub: {
        fontSize: 11,
        fontFamily: 'RedHatDisplay_500Medium',
        fontWeight: '500',
        marginTop: 1,
    },
    miniToggleWrap: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 2,
    },
    miniToggleBtn: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    miniToggleBtnActive: {
        // active background applied inline
    },
    miniToggleText: {
        fontSize: 11,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },

    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    yAxisColumn: {
        width: 32,
        height: CHART_HEIGHT,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 4,
    },
    yTickText: {
        fontSize: 10,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
    },
    yAxisLabel: {
        fontSize: 9,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
        transform: [{ rotate: '-90deg' }],
        width: 60,
        textAlign: 'center',
        marginLeft: -14,
    },
    canvasBox: {
        position: 'relative',
        borderRadius: 6,
        overflow: 'hidden',
    },
    watermarkWrap: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    watermarkText: {
        fontSize: 42,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
        letterSpacing: -1,
    },
    trickleTag: {
        position: 'absolute',
        right: 8,
        bottom: 18,
    },
    trickleTagText: {
        fontSize: 10,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
    },
    xAxisRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
        paddingRight: 6,
    },
    xTickText: {
        fontSize: 10,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
    },
    xAxisLabel: {
        fontSize: 10,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
    },

    // ── 5. CONNECTED VEHICLE CARD ──
    vehicleCard: {
        borderRadius: RADIUS.card,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 10,
    },
    vehicleCardMainRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vehicleInfoCol: {
        flex: 1,
    },
    vehicleModelName: {
        fontSize: 14,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    vehiclePlateSpecs: {
        fontSize: 12,
        fontFamily: 'RedHatDisplay_500Medium',
        fontWeight: '500',
        marginTop: 2,
    },
    editPencilBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    autochargeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    autochargeDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        marginRight: 8,
    },
    autochargeRowTitle: {
        fontSize: 12,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
        flex: 1,
    },

    // ── 6. STATION AMENITIES ──
    amenitiesCard: {
        borderRadius: RADIUS.card,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    amenitiesHeader: {
        fontSize: 11,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
        marginBottom: 8,
    },
    amenitiesRow: {
        flexDirection: 'row',
        gap: 8,
    },
    amenityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: RADIUS.pill,
    },
    amenityText: {
        fontSize: 11,
        fontFamily: 'RedHatDisplay_600SemiBold',
        fontWeight: '600',
    },

    // ── 7. STOP BUTTON ──
    stopChargingBtn: {
        paddingVertical: 15,
        borderRadius: RADIUS.button,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    stopChargingBtnText: {
        fontSize: 15,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // ── 8. MODALS ──
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        borderTopLeftRadius: RADIUS.bottomSheet,
        borderTopRightRadius: RADIUS.bottomSheet,
        paddingHorizontal: SPACING.md,
        paddingTop: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    modalTitle: {
        fontSize: 16,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    modalCloseBtn: {
        padding: 4,
    },
    modalSub: {
        fontSize: 12,
        fontFamily: 'RedHatDisplay_500Medium',
        fontWeight: '500',
        marginBottom: 14,
    },
    modalSummaryBox: {
        flexDirection: 'row',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 16,
    },
    modalSummaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    modalSummaryLabel: {
        fontSize: 11,
        fontFamily: 'RedHatDisplay_500Medium',
        fontWeight: '500',
        marginBottom: 2,
    },
    modalSummaryVal: {
        fontSize: 15,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    modalActionButtonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: RADIUS.button,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelText: {
        fontSize: 14,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    modalConfirmStopBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: RADIUS.button,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalConfirmStopText: {
        fontSize: 14,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
        color: '#FFFFFF',
    },

    modalVehicleList: {
        gap: 8,
    },
    modalVehicleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    modalVehName: {
        fontSize: 14,
        fontFamily: 'RedHatDisplay_700Bold',
        fontWeight: '700',
    },
    modalVehPlate: {
        fontSize: 12,
        fontFamily: 'RedHatDisplay_500Medium',
        fontWeight: '500',
        marginTop: 2,
    },
    modalCheckBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
