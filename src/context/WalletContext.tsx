import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useVehicles } from './VehicleContext';

/**
 * Wallet trust layer (Pulse style).
 * Review research showed money trust is the #1 reason for 1-star reviews:
 * top-up then cannot charge, double billing, refunds that never arrive.
 * This context makes every rupee traceable: ledger, refund tracker, disputes, rewards.
 */

export type TxnKind = 'topup' | 'refund' | 'cashback' | 'dispute';
export type TxnStatus = 'Success' | 'Processing' | 'Pending' | 'Refunded' | 'Failed';

export type WalletTxn = {
    id: string;
    kind: TxnKind;
    title: string;
    subtitle: string;
    amount: number; // positive = money in, negative = money out
    dateLabel: string;
    status: TxnStatus;
    etaLabel?: string; // For refunds and disputes in flight
    ticketId?: string;
    relatedRef?: string; // Session transaction ID
};

type WalletContextType = {
    ledger: WalletTxn[];
    rewardVolts: number;
    pendingRefundTotal: number;
    addMoney: (amount: number, method: string) => void;
    raiseDispute: (relatedRef: string, stationName: string, amount: number, reason: string) => string;
    redeemVolts: (volts: number) => boolean;
};

const INITIAL_LEDGER: WalletTxn[] = [
    {
        id: 'TXN-REF-7712',
        kind: 'refund',
        title: 'Refund on its way',
        subtitle: 'Session stopped by charger fault · Iris Gandhipuram',
        amount: 184.2,
        dateLabel: 'Nov 15, 7:42 PM',
        status: 'Processing',
        etaLabel: 'Back in wallet by Nov 18',
        relatedRef: 'TRX-771204',
    },
    {
        id: 'TXN-CB-6620',
        kind: 'cashback',
        title: 'Volts cashback',
        subtitle: 'Off-peak charge bonus',
        amount: 25,
        dateLabel: 'Nov 14, 11:05 PM',
        status: 'Success',
    },
    {
        id: 'TXN-TOP-6519',
        kind: 'topup',
        title: 'Money added',
        subtitle: 'UPI · GPay',
        amount: 1000,
        dateLabel: 'Nov 12, 9:18 AM',
        status: 'Success',
    },
];

const WalletContext = createContext<WalletContextType | undefined>(undefined);

function nowLabel() {
    const d = new Date();
    return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const { topUpWallet } = useVehicles();
    const [ledger, setLedger] = useState<WalletTxn[]>(INITIAL_LEDGER);
    const [rewardVolts, setRewardVolts] = useState(1240);

    const addMoney = useCallback(
        (amount: number, method: string) => {
            topUpWallet(amount);
            setLedger((prev) => [
                {
                    id: `TXN-TOP-${Math.floor(1000 + Math.random() * 9000)}`,
                    kind: 'topup',
                    title: 'Money added',
                    subtitle: method,
                    amount,
                    dateLabel: nowLabel(),
                    status: 'Success',
                },
                ...prev,
            ]);
            // 1 Volt per ₹20 added: small, honest reward loop
            setRewardVolts((v) => v + Math.floor(amount / 20));
        },
        [topUpWallet]
    );

    const raiseDispute = useCallback(
        (relatedRef: string, stationName: string, amount: number, reason: string) => {
            const ticketId = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
            setLedger((prev) => [
                {
                    id: `TXN-DSP-${Math.floor(1000 + Math.random() * 9000)}`,
                    kind: 'dispute',
                    title: 'Dispute raised',
                    subtitle: `${reason} · ${stationName}`,
                    amount,
                    dateLabel: nowLabel(),
                    status: 'Pending',
                    etaLabel: 'Reply within 24 hours',
                    ticketId,
                    relatedRef,
                },
                ...prev,
            ]);
            return ticketId;
        },
        []
    );

    const redeemVolts = useCallback(
        (volts: number) => {
            if (volts <= 0 || volts > rewardVolts) return false;
            setRewardVolts((v) => v - volts);
            // 10 Volts = ₹1
            const rupees = Number((volts / 10).toFixed(2));
            topUpWallet(rupees);
            setLedger((prev) => [
                {
                    id: `TXN-CB-${Math.floor(1000 + Math.random() * 9000)}`,
                    kind: 'cashback',
                    title: 'Volts redeemed',
                    subtitle: `${volts} Volts → wallet`,
                    amount: rupees,
                    dateLabel: nowLabel(),
                    status: 'Success',
                },
                ...prev,
            ]);
            return true;
        },
        [rewardVolts, topUpWallet]
    );

    const pendingRefundTotal = useMemo(
        () =>
            ledger
                .filter((t) => t.kind === 'refund' && (t.status === 'Processing' || t.status === 'Pending'))
                .reduce((sum, t) => sum + t.amount, 0),
        [ledger]
    );

    return (
        <WalletContext.Provider
            value={{ ledger, rewardVolts, pendingRefundTotal, addMoney, raiseDispute, redeemVolts }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
    return ctx;
}
