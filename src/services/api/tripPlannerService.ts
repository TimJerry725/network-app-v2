/**
 * Trip Planner Service
 * Derived from mobile-openapi.json
 */

import { apiClient } from './client';
import { RawApiStation, normalizeStation } from './types';
import { Station } from '../../constants/Stations';

export interface RouteChargersRequest {
    encodedPolyline: string;
}

export interface RoutePlanRequest {
    origin: { latitude: number; longitude: number; name?: string };
    destination: { latitude: number; longitude: number; name?: string };
    encodedPolyline: string;
    vehicleId?: string;
    batteryCapacityKwh?: number;
    initialSocPercent?: number;
    targetArrivalSocPercent?: number;
}

export const tripPlannerService = {
    /**
     * Get chargers along an encoded route
     * Endpoint: POST /api/v1/trip-planner/getAllChargers
     */
    async getAllChargersAlongRoute(encodedPolyline: string): Promise<Station[]> {
        const raw = await apiClient.post<RawApiStation[] | { chargers?: RawApiStation[] }>(
            '/api/v1/trip-planner/getAllChargers',
            { encodedPolyline },
            { requiresAuth: true }
        );

        const list = Array.isArray(raw) ? raw : raw?.chargers ?? [];
        return list.map(normalizeStation);
    },

    /**
     * Build an EV charging plan for a route
     * Endpoint: POST /api/v1/trip-planner/getChargeStationsPlanOla
     */
    async buildRouteChargingPlan(data: RoutePlanRequest): Promise<any> {
        return apiClient.post(
            '/api/v1/trip-planner/getChargeStationsPlanOla',
            data,
            { requiresAuth: true }
        );
    },

    /**
     * Fetch saved or recent trips
     * Endpoint: GET /api/v1/d2s/savedTrips
     */
    async getSavedTrips(): Promise<any[]> {
        const raw = await apiClient.get<any[] | { trips?: any[] }>(
            '/api/v1/d2s/savedTrips',
            { requiresAuth: true }
        );

        return Array.isArray(raw) ? raw : raw?.trips ?? [];
    },

    /**
     * Save a planned or recent trip
     * Endpoint: POST /api/v1/d2s/savedTrips
     */
    async saveTrip(tripData: any): Promise<{ id: string; success: boolean }> {
        return apiClient.post(
            '/api/v1/d2s/savedTrips',
            tripData,
            { requiresAuth: true }
        );
    },
};
