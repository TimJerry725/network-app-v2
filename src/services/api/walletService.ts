/**
 * Wallet & Billing Service
 * Derived from mobile-openapi.json
 */

import { apiClient } from './client';

export interface WalletTransactionItem {
    id: string;
    amount: number;
    currency: string;
    type: 'Credit' | 'Debit' | 'TopUp' | 'Refund' | 'ChargingSession';
    description: string;
    created_at: string;
    status: 'Success' | 'Pending' | 'Failed';
    reference_id?: string;
}

export interface TopUpRequest {
    amount: number;
    currency?: string;
    userid: string;
    payment_gateway_type?: string;
}

export const walletService = {
    /**
     * List wallet transactions
     * Endpoint: GET /api/v1/wallet/transactions
     */
    async getTransactions(page = 1, size = 10, startDate?: string, endDate?: string): Promise<WalletTransactionItem[]> {
        const raw = await apiClient.get<WalletTransactionItem[] | { transactions?: WalletTransactionItem[] }>(
            '/api/v1/wallet/transactions',
            {
                requiresAuth: true,
                params: {
                    page,
                    size,
                    start_date: startDate,
                    end_date: endDate,
                },
            }
        );

        return Array.isArray(raw) ? raw : raw?.transactions ?? [];
    },

    /**
     * Create a wallet top-up order
     * Endpoint: POST /api/v1/wallet/top-up
     */
    async createTopUpOrder(data: TopUpRequest): Promise<{ order_id: string; [key: string]: any }> {
        return apiClient.post(
            '/api/v1/wallet/top-up',
            {
                amount: data.amount,
                currency: data.currency ?? 'INR',
                userid: data.userid,
                payment_gateway_type: data.payment_gateway_type ?? 'Razorpay',
            },
            { requiresAuth: true }
        );
    },

    /**
     * Verify payment order
     * Endpoint: POST /api/v1/d2s/wallet/payment/order-verify
     */
    async verifyPaymentOrder(verificationData: any): Promise<{ success: boolean; balance?: number }> {
        return apiClient.post(
            '/api/v1/d2s/wallet/payment/order-verify',
            verificationData,
            { requiresAuth: true }
        );
    },

    /**
     * Redeem voucher
     * Endpoint: POST /api/v1/voucher/redeem
     */
    async redeemVoucher(voucherCode: string): Promise<{ success: boolean; message: string; amount?: number }> {
        return apiClient.post(
            '/api/v1/voucher/redeem',
            { code: voucherCode },
            { requiresAuth: true }
        );
    },
};
