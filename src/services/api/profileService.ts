/**
 * Customer Profile & Account Service
 * Derived from mobile-openapi.json
 */

import { apiClient } from './client';
import { UserProfile } from '../../context/VehicleContext';

export interface RawApiProfile {
    id?: string;
    user_id?: string;
    userid?: string;
    full_name?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
    rfid_tag?: string;
    wallet_balance?: number;
    currency?: string;
    membership_tier?: 'Standard' | 'Pro' | 'Iris Fleet';
    is_senior_mode?: boolean;
}

export function normalizeProfile(raw: RawApiProfile): UserProfile {
    const fullName = (raw.full_name ?? raw.name ?? [raw.first_name, raw.last_name].filter(Boolean).join(' ')) || 'Iris Driver';

    return {
        id: String(raw.id ?? raw.user_id ?? raw.userid ?? 'usr_current'),
        fullName,
        phone: raw.phone ?? '+91 98452 71092',
        email: raw.email ?? 'driver@irisnetwork.com',
        rfidTag: raw.rfid_tag ?? 'IRIS-RFID-7729',
        walletBalance: Number(raw.wallet_balance ?? 1250.0),
        currency: raw.currency ?? '₹',
        membershipTier: raw.membership_tier ?? 'Iris Fleet',
        isSeniorMode: Boolean(raw.is_senior_mode),
    };
}

export const profileService = {
    /**
     * Get authenticated customer profile
     * Endpoint: GET /api/v1/users/profile
     */
    async getProfile(): Promise<UserProfile> {
        const raw = await apiClient.get<RawApiProfile>(
            '/api/v1/users/profile',
            { requiresAuth: true }
        );

        return normalizeProfile(raw);
    },

    /**
     * Update customer profile
     * Endpoint: PATCH /api/v1/users/{userId}
     */
    async updateProfile(userId: string, updates: Partial<RawApiProfile>): Promise<UserProfile> {
        const raw = await apiClient.patch<RawApiProfile>(
            `/api/v1/users/${encodeURIComponent(userId)}`,
            updates,
            { requiresAuth: true }
        );

        return normalizeProfile(raw);
    },

    /**
     * List customer's RFID or VID records
     * Endpoint: GET /api/v1/d2s/idtag
     */
    async getIdTags(): Promise<any[]> {
        const raw = await apiClient.get<any[] | { idtags?: any[] }>(
            '/api/v1/d2s/idtag',
            { requiresAuth: true }
        );

        return Array.isArray(raw) ? raw : raw?.idtags ?? [];
    },
};
