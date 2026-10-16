/**
 * Charging & Session Management Service
 * Derived from mobile-openapi.json
 */

import { apiClient } from './client';
import { LiveSessionData, StartSessionRequest } from './types';

export const chargingService = {
    /**
     * Start a live charging session
     * Endpoint: POST /api/v1/charging-sessions
     */
    async startChargingSession(
        data: StartSessionRequest,
        isOcpiSession = false
    ): Promise<{ session_id: string; [key: string]: any }> {
        return apiClient.post(
            '/api/v1/charging-sessions',
            data,
            {
                requiresAuth: true,
                params: { is_ocpi_session: isOcpiSession },
            }
        );
    },

    /**
     * Get live charging-session details and telemetry
     * Endpoint: GET /api/v1/charging-sessions/{sessionId}
     */
    async getSessionDetails(
        sessionId: string,
        timePeriod?: string,
        isEmspSession = false
    ): Promise<LiveSessionData> {
        return apiClient.get<LiveSessionData>(
            `/api/v1/charging-sessions/${encodeURIComponent(sessionId)}`,
            {
                requiresAuth: true,
                params: {
                    time_period: timePeriod,
                    emsp_session: isEmspSession,
                },
            }
        );
    },

    /**
     * Stop a charging session
     * Endpoint: POST /api/v1/charging-sessions/stop/{sessionId}
     */
    async stopChargingSession(
        sessionId: string,
        isOcpiSession = false
    ): Promise<{ success: boolean; message?: string }> {
        return apiClient.post(
            `/api/v1/charging-sessions/stop/${encodeURIComponent(sessionId)}`,
            { closed_by: 'Mobile' },
            {
                requiresAuth: true,
                params: { is_ocpi_session: isOcpiSession },
            }
        );
    },

    /**
     * Get the customer's active charging sessions
     * Endpoint: GET /api/v1/charging-sessions/customer_active_sessions/{userId}
     */
    async getActiveSessions(userId: string): Promise<LiveSessionData[]> {
        const raw = await apiClient.get<LiveSessionData[] | { sessions?: LiveSessionData[] }>(
            `/api/v1/charging-sessions/customer_active_sessions/${encodeURIComponent(userId)}`,
            { requiresAuth: true }
        );

        return Array.isArray(raw) ? raw : raw?.sessions ?? [];
    },

    /**
     * List past completed charging history
     * Endpoint: GET /api/v1/charging-history
     */
    async getChargingHistory(page = 1, size = 20): Promise<any[]> {
        const raw = await apiClient.get<any[] | { items?: any[] }>(
            '/api/v1/charging-history',
            {
                requiresAuth: true,
                params: { page, size },
            }
        );

        return Array.isArray(raw) ? raw : raw?.items ?? [];
    },
};
