/**
 * Authentication Service
 * Derived from mobile-openapi.json
 */

import { apiClient } from './client';
import { ApiConfig } from './config';

export interface SendOtpRequest {
    phone: string; // E.164 format, e.g. +919876543210
    tenantid?: string;
    signature?: string;
}

export interface VerifyOtpRequest {
    phone: string;
    otp: string;
    tenantId?: string;
    deviceType?: 'android' | 'ios';
    deviceToken?: string;
    deviceName?: string;
    deviceModel?: string;
}

export interface AuthSessionResponse {
    token?: string;
    jwt?: string;
    access_token?: string;
    refresh_token?: string;
    user?: {
        id: string;
        phone: string;
        email?: string;
        name?: string;
    };
}

export const authService = {
    /**
     * Send a login OTP
     * Endpoint: POST /api/v1/auth/otp
     */
    async sendOtp(data: SendOtpRequest): Promise<{ success: boolean; message?: string }> {
        return apiClient.post('/api/v1/auth/otp', {
            phone: data.phone,
            tenantid: data.tenantid ?? ApiConfig.getTenantId(),
            signature: data.signature,
        });
    },

    /**
     * Verify OTP and receive JWT session
     * Endpoint: POST /api/v1/auth/otp/verify
     */
    async verifyOtp(data: VerifyOtpRequest): Promise<AuthSessionResponse> {
        const response = await apiClient.post<AuthSessionResponse>('/api/v1/auth/otp/verify', {
            phone: data.phone,
            otp: data.otp,
            tenantId: data.tenantId ?? ApiConfig.getTenantId(),
            deviceType: data.deviceType ?? 'ios',
            deviceToken: data.deviceToken ?? 'dev_token_mobile',
            deviceName: data.deviceName,
            deviceModel: data.deviceModel,
        });

        // If a JWT token is returned, automatically store in ApiConfig
        const token = response.token ?? response.jwt ?? response.access_token;
        if (token) {
            ApiConfig.setAuthToken(token);
        }

        return response;
    },

    /**
     * Register a new customer
     * Endpoint: POST /api/v1/auth/signup
     */
    async signup(phone: string, tenantId?: string): Promise<{ success: boolean; message?: string }> {
        return apiClient.post('/api/v1/auth/signup', {
            phone,
            tenantId: tenantId ?? ApiConfig.getTenantId(),
        });
    },
};
