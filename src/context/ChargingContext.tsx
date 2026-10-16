import React, { createContext, useState, useContext, useEffect } from 'react';
import { chargingService } from '../services/api/chargingService';

export type SessionStatus = 'CONNECTING' | 'PREPARATION' | 'CHARGING' | 'SUSPENDED' | 'FINISHING' | 'COMPLETED' | 'STOPPED';

export type SessionTelemetry = {
    // Identity & CPO Handshake
    transactionId: string;
    stationId: string;
    stationName: string;
    stationAddress: string;
    chargerId: string;
    connectorId: string;
    connectorType: 'CCS2' | 'Type 2' | 'CHAdeMO' | 'GB/T';
    maxConnectorPowerKw: number;
    
    // User & Car association
    userId: string;
    userName: string;
    vehicleId: string;
    vehicleModel: string;
    vehicleRegNo: string;
    userRfidTag?: string;

    // Live Metrics
    status: SessionStatus;
    startTime: Date;
    endTime?: Date;
    elapsedSeconds: number;
    startSoc: number;
    currentSoc: number;
    targetSoc: number;
    currentPowerKw: number;
    currentVoltageV: number;
    currentAmperageA: number;
    energyDeliveredKwh: number;
    batteryTempCelsius: number;

    // Pricing & Tariff
    baseRatePerKwh: number;
    taxRatePercent: number; // e.g. 18% (9% CGST + 9% SGST)
    energyCost: number;
    taxCost: number;
    totalCost: number;
    currency: string;

    // Telemetry trend for graphs
    powerHistory: { time: string; powerKw: number; soc: number }[];

    // Post-charge
    gracePeriodRemainingSeconds: number; // Idle fee grace countdown (e.g. 15 min = 900s)
    idleFeePerMinute: number;
};

export type CompletedSessionReceipt = {
    transactionId: string;
    invoiceNo: string;
    stationName: string;
    chargerId: string;
    connectorType: string;
    vehicleModel: string;
    startTime: string;
    endTime: string;
    durationFormatted: string;
    startSoc: number;
    endSoc: number;
    energyDeliveredKwh: number;
    peakPowerKw: number;
    avgPowerKw: number;
    energyCost: number;
    cgstAmount: number;
    sgstAmount: number;
    totalAmountPaid: number;
    currency: string;
    paymentMethod: string;
};

type ChargingContextType = {
    activeSession: SessionTelemetry | null;
    startChargingSession: (params: {
        stationId: string;
        stationName: string;
        stationAddress: string;
        chargerId: string;
        connectorId: string;
        connectorType: 'CCS2' | 'Type 2' | 'CHAdeMO' | 'GB/T';
        powerRatingKw: number;
        pricePerKWh: number;
        vehicleId: string;
        vehicleModel: string;
        vehicleRegNo: string;
        startSoc: number;
        targetSoc?: number;
    }) => void;
    stopChargingSession: (reason?: string) => CompletedSessionReceipt | null;
    clearSession: () => void;
    updateTargetSoc: (target: number) => void;
    sessionHistory: CompletedSessionReceipt[];
    latestReceipt: CompletedSessionReceipt | null;
    isSimulating: boolean;
};

const INITIAL_HISTORY: CompletedSessionReceipt[] = [
    {
        transactionId: 'TRX-783921',
        invoiceNo: 'INV-IRIS-2026-0891',
        stationName: 'Iris Saravanampatti Hub',
        chargerId: 'SP-01',
        connectorType: 'CCS2',
        vehicleModel: 'Hyundai IONIQ 5',
        startTime: 'Yesterday, 18:30',
        endTime: 'Yesterday, 19:12',
        durationFormatted: '42m 15s',
        startSoc: 24,
        endSoc: 85,
        energyDeliveredKwh: 44.2,
        peakPowerKw: 148,
        avgPowerKw: 62.8,
        energyCost: 795.60,
        cgstAmount: 71.60,
        sgstAmount: 71.60,
        totalAmountPaid: 938.80,
        currency: '₹',
        paymentMethod: 'Iris Wallet',
    },
    {
        transactionId: 'TRX-782410',
        invoiceNo: 'INV-IRIS-2026-0865',
        stationName: 'Tata Power EZ Charge - Electronic City',
        chargerId: 'TP-04',
        connectorType: 'CCS2',
        vehicleModel: 'Hyundai IONIQ 5',
        startTime: 'Oct 09, 11:15',
        endTime: 'Oct 09, 11:50',
        durationFormatted: '35m 20s',
        startSoc: 28,
        endSoc: 80,
        energyDeliveredKwh: 38.6,
        peakPowerKw: 120,
        avgPowerKw: 65.4,
        energyCost: 694.80,
        cgstAmount: 62.53,
        sgstAmount: 62.53,
        totalAmountPaid: 819.86,
        currency: '₹',
        paymentMethod: 'UPI AutoPay',
    },
    {
        transactionId: 'TRX-781890',
        invoiceNo: 'INV-IRIS-2026-0852',
        stationName: 'Zeon Charging - Avinashi Highway',
        chargerId: 'ZN-02',
        connectorType: 'CCS2',
        vehicleModel: 'Hyundai IONIQ 5',
        startTime: 'Oct 06, 09:40',
        endTime: 'Oct 06, 10:18',
        durationFormatted: '38m 10s',
        startSoc: 18,
        endSoc: 75,
        energyDeliveredKwh: 41.0,
        peakPowerKw: 150,
        avgPowerKw: 64.7,
        energyCost: 738.00,
        cgstAmount: 66.42,
        sgstAmount: 66.42,
        totalAmountPaid: 870.84,
        currency: '₹',
        paymentMethod: 'Iris Wallet',
    },
    {
        transactionId: 'TRX-781004',
        invoiceNo: 'INV-IRIS-2026-0842',
        stationName: 'Iris Mumbai Hub - BKC',
        chargerId: 'IM-01',
        connectorType: 'CCS2',
        vehicleModel: 'Hyundai IONIQ 5',
        startTime: 'Oct 04, 14:10',
        endTime: 'Oct 04, 14:48',
        durationFormatted: '38m 00s',
        startSoc: 30,
        endSoc: 80,
        energyDeliveredKwh: 36.5,
        peakPowerKw: 172,
        avgPowerKw: 57.6,
        energyCost: 766.50,
        cgstAmount: 68.98,
        sgstAmount: 68.98,
        totalAmountPaid: 904.46,
        currency: '₹',
        paymentMethod: 'UPI AutoPay',
    },
    {
        transactionId: 'TRX-780412',
        invoiceNo: 'INV-IRIS-2026-0820',
        stationName: 'Statiq EV Hub - OMR IT Corridor',
        chargerId: 'SQ-03',
        connectorType: 'CCS2',
        vehicleModel: 'Hyundai IONIQ 5',
        startTime: 'Oct 01, 16:25',
        endTime: 'Oct 01, 17:02',
        durationFormatted: '37m 15s',
        startSoc: 22,
        endSoc: 78,
        energyDeliveredKwh: 39.2,
        peakPowerKw: 120,
        avgPowerKw: 63.1,
        energyCost: 705.60,
        cgstAmount: 63.50,
        sgstAmount: 63.50,
        totalAmountPaid: 832.60,
        currency: '₹',
        paymentMethod: 'Credit Card',
    },
    {
        transactionId: 'TRX-779840',
        invoiceNo: 'INV-IRIS-2026-0795',
        stationName: 'Jio-bp pulse - Hinjewadi Phase 1',
        chargerId: 'JB-01',
        connectorType: 'CCS2',
        vehicleModel: 'Hyundai IONIQ 5',
        startTime: 'Sep 27, 20:10',
        endTime: 'Sep 27, 20:45',
        durationFormatted: '35m 00s',
        startSoc: 35,
        endSoc: 85,
        energyDeliveredKwh: 35.0,
        peakPowerKw: 150,
        avgPowerKw: 60.0,
        energyCost: 630.00,
        cgstAmount: 56.70,
        sgstAmount: 56.70,
        totalAmountPaid: 743.40,
        currency: '₹',
        paymentMethod: 'Iris Wallet',
    },
    {
        transactionId: 'TRX-778910',
        invoiceNo: 'INV-IRIS-2026-0761',
        stationName: 'ChargeZone Fast Hub - SG Highway',
        chargerId: 'CZ-05',
        connectorType: 'CCS2',
        vehicleModel: 'Hyundai IONIQ 5',
        startTime: 'Sep 23, 12:30',
        endTime: 'Sep 23, 13:08',
        durationFormatted: '38m 20s',
        startSoc: 15,
        endSoc: 75,
        energyDeliveredKwh: 42.0,
        peakPowerKw: 180,
        avgPowerKw: 65.6,
        energyCost: 756.00,
        cgstAmount: 68.04,
        sgstAmount: 68.04,
        totalAmountPaid: 892.08,
        currency: '₹',
        paymentMethod: 'UPI AutoPay',
    },
    {
        transactionId: 'TRX-777650',
        invoiceNo: 'INV-IRIS-2026-0720',
        stationName: 'Glida EV Station - Cyber City',
        chargerId: 'GL-02',
        connectorType: 'CCS2',
        vehicleModel: 'Hyundai IONIQ 5',
        startTime: 'Sep 19, 15:00',
        endTime: 'Sep 19, 15:36',
        durationFormatted: '36m 10s',
        startSoc: 25,
        endSoc: 80,
        energyDeliveredKwh: 37.8,
        peakPowerKw: 120,
        avgPowerKw: 62.5,
        energyCost: 680.40,
        cgstAmount: 61.24,
        sgstAmount: 61.24,
        totalAmountPaid: 802.88,
        currency: '₹',
        paymentMethod: 'Iris Wallet',
    },
];

const ChargingContext = createContext<ChargingContextType | undefined>(undefined);

export function ChargingProvider({ children }: { children: React.ReactNode }) {
    const [activeSession, setActiveSession] = useState<SessionTelemetry | null>(null);
    const [sessionHistory, setSessionHistory] = useState<CompletedSessionReceipt[]>(INITIAL_HISTORY);
    const [latestReceipt, setLatestReceipt] = useState<CompletedSessionReceipt | null>(null);
    const [isSimulating, setIsSimulating] = useState<boolean>(false);

    // Live Session Telemetry Simulation Loop
    useEffect(() => {
        if (!activeSession || activeSession.status !== 'CHARGING') {
            setIsSimulating(false);
            return;
        }

        setIsSimulating(true);
        const timer = setInterval(() => {
            setActiveSession((prev) => {
                if (!prev || prev.status !== 'CHARGING') return prev;

                // Stop condition reached
                if (prev.currentSoc >= prev.targetSoc) {
                    return {
                        ...prev,
                        status: 'COMPLETED',
                        currentPowerKw: 0,
                        currentAmperageA: 0,
                    };
                }

                const elapsedSeconds = prev.elapsedSeconds + 2;
                // Add energy increment
                const deltaKwh = Number((prev.currentPowerKw * (2 / 3600)).toFixed(3));
                const energyDeliveredKwh = Number((prev.energyDeliveredKwh + deltaKwh).toFixed(2));
                
                // SoC increases as energy adds up
                const nextSoc = Math.min(prev.targetSoc, prev.currentSoc + 0.15);

                // Simulate realistic BMS tapering (charging slows as battery fills up past 75%)
                let targetPower = prev.maxConnectorPowerKw * 0.9;
                if (nextSoc > 80) {
                    targetPower = prev.maxConnectorPowerKw * 0.35; // thermal / taper drop
                } else if (nextSoc > 65) {
                    targetPower = prev.maxConnectorPowerKw * 0.65;
                }
                const jitter = (Math.random() - 0.5) * 4;
                const currentPowerKw = Math.max(12, Math.min(prev.maxConnectorPowerKw, Math.round(targetPower + jitter)));
                const currentVoltageV = Math.round(380 + (nextSoc * 0.4));
                const currentAmperageA = Math.round((currentPowerKw * 1000) / currentVoltageV);

                // Cost calculation
                const energyCost = Number((energyDeliveredKwh * prev.baseRatePerKwh).toFixed(2));
                const taxCost = Number((energyCost * (prev.taxRatePercent / 100)).toFixed(2));
                const totalCost = Number((energyCost + taxCost).toFixed(2));

                // Time format for graph
                const mins = Math.floor(elapsedSeconds / 60);
                const secs = elapsedSeconds % 60;
                const timeLabel = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

                const powerHistory = [
                    ...prev.powerHistory.slice(-8),
                    { time: timeLabel, powerKw: currentPowerKw, soc: Math.round(nextSoc) },
                ];

                return {
                    ...prev,
                    elapsedSeconds,
                    currentSoc: Number(nextSoc.toFixed(1)),
                    energyDeliveredKwh,
                    currentPowerKw,
                    currentVoltageV,
                    currentAmperageA,
                    energyCost,
                    taxCost,
                    totalCost,
                    powerHistory,
                };
            });
        }, 1500);

        return () => clearInterval(timer);
    }, [activeSession?.status]);

    const startChargingSession: ChargingContextType['startChargingSession'] = (params) => {
        const initialPower = Math.round(params.powerRatingKw * 0.85);
        const newSession: SessionTelemetry = {
            transactionId: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
            stationId: params.stationId,
            stationName: params.stationName,
            stationAddress: params.stationAddress,
            chargerId: params.chargerId,
            connectorId: params.connectorId,
            connectorType: params.connectorType,
            maxConnectorPowerKw: params.powerRatingKw,
            userId: 'usr_cpo_982',
            userName: 'Timothee Vance',
            vehicleId: params.vehicleId,
            vehicleModel: params.vehicleModel,
            vehicleRegNo: params.vehicleRegNo,
            userRfidTag: 'IRIS-RFID-7729',
            status: 'CHARGING',
            startTime: new Date(),
            elapsedSeconds: 0,
            startSoc: params.startSoc,
            currentSoc: params.startSoc,
            targetSoc: params.targetSoc || 85,
            currentPowerKw: initialPower,
            currentVoltageV: 400,
            currentAmperageA: Math.round((initialPower * 1000) / 400),
            energyDeliveredKwh: 0,
            batteryTempCelsius: 31,
            baseRatePerKwh: params.pricePerKWh,
            taxRatePercent: 18,
            energyCost: 0,
            taxCost: 0,
            totalCost: 0,
            currency: '₹',
            powerHistory: [
                { time: '0:00', powerKw: initialPower, soc: params.startSoc },
            ],
            gracePeriodRemainingSeconds: 900, // 15 mins grace period
            idleFeePerMinute: 5.0,
        };

        // Dispatch session start to real API
        chargingService
            .startChargingSession({
                charge_point_id: params.chargerId,
                connector_id: params.connectorId,
                vehicle_details: {
                    id: params.vehicleId,
                    number: params.vehicleRegNo,
                    model: params.vehicleModel,
                },
                user_id: 'usr_cpo_982',
                source: 'Mobile',
                location_id: params.stationId,
            })
            .catch((err) => {
                console.warn('[IrisAPI] Live session start notice:', err?.message);
            });

        setActiveSession(newSession);
    };

    const stopChargingSession = (reason = 'Driver initiated stop'): CompletedSessionReceipt | null => {
        if (!activeSession) return null;

        // Dispatch session stop to real API
        chargingService
            .stopChargingSession(activeSession.transactionId)
            .catch((err) => {
                console.warn('[IrisAPI] Live session stop notice:', err?.message);
            });

        const durationMinutes = Math.floor(activeSession.elapsedSeconds / 60);
        const durationSecs = activeSession.elapsedSeconds % 60;
        const durationFormatted = `${durationMinutes}m ${durationSecs}s`;

        const cgstAmount = Number((activeSession.energyCost * 0.09).toFixed(2));
        const sgstAmount = Number((activeSession.energyCost * 0.09).toFixed(2));
        const totalAmount = Number((activeSession.energyCost + cgstAmount + sgstAmount).toFixed(2));

        const receipt: CompletedSessionReceipt = {
            transactionId: activeSession.transactionId,
            invoiceNo: `INV-IRIS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            stationName: activeSession.stationName,
            chargerId: activeSession.chargerId,
            connectorType: activeSession.connectorType,
            vehicleModel: activeSession.vehicleModel,
            startTime: activeSession.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            durationFormatted,
            startSoc: activeSession.startSoc,
            endSoc: Math.round(activeSession.currentSoc),
            energyDeliveredKwh: activeSession.energyDeliveredKwh,
            peakPowerKw: Math.max(...activeSession.powerHistory.map((p) => p.powerKw), activeSession.currentPowerKw),
            avgPowerKw: Math.round(activeSession.maxConnectorPowerKw * 0.72),
            energyCost: activeSession.energyCost,
            cgstAmount,
            sgstAmount,
            totalAmountPaid: totalAmount,
            currency: activeSession.currency,
            paymentMethod: 'Iris Wallet Deduction',
        };

        setLatestReceipt(receipt);
        setSessionHistory((prev) => [receipt, ...prev]);
        setActiveSession(null);
        return receipt;
    };

    const clearSession = () => {
        setActiveSession(null);
    };

    const updateTargetSoc = (target: number) => {
        setActiveSession((prev) => (prev ? { ...prev, targetSoc: target } : null));
    };

    return (
        <ChargingContext.Provider
            value={{
                activeSession,
                startChargingSession,
                stopChargingSession,
                clearSession,
                updateTargetSoc,
                sessionHistory,
                latestReceipt,
                isSimulating,
            }}
        >
            {children}
        </ChargingContext.Provider>
    );
}

export function useCharging() {
    const context = useContext(ChargingContext);
    if (context === undefined) {
        throw new Error('useCharging must be used within a ChargingProvider');
    }
    return context;
}
