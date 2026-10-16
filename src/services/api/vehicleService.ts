/**
 * Vehicles Management Service
 * Derived from mobile-openapi.json
 */

import { apiClient } from './client';
import { VehicleInput } from './types';
import { Vehicle } from '../../context/VehicleContext';

export interface RawApiVehicle {
    id?: string;
    vehicle_id?: string;
    nickname?: string;
    manufacturer?: string;
    make?: string;
    model?: string;
    number?: string;
    registration_number?: string;
    connectortype?: string;
    connector_type?: string;
    battery_capacity?: number;
    power?: number;
    range?: number;
    is_default?: boolean;
    current_battery?: number;
}

export function normalizeVehicle(raw: RawApiVehicle): Vehicle {
    const power = Number(raw.power ?? 150);
    const capacity = Number(raw.battery_capacity ?? 60);

    return {
        id: String(raw.id ?? raw.vehicle_id ?? Math.random().toString()),
        nickname: raw.nickname ?? `${raw.manufacturer ?? raw.make ?? 'My'} ${raw.model ?? 'EV'}`,
        make: raw.manufacturer ?? raw.make ?? 'Tata',
        model: raw.model ?? 'Nexon EV',
        year: '2024',
        registrationNumber: raw.number ?? raw.registration_number ?? 'DL 01 EV 1024',
        connectorType: (raw.connectortype ?? raw.connector_type ?? 'CCS2') as any,
        batteryCapacity: capacity,
        maxDcRateKw: power,
        currentBattery: Number(raw.current_battery ?? 74),
        estRangeKm: Number(raw.range ?? Math.round(capacity * 4.8)),
        chargeTarget: 80,
        autochargeEnabled: true,
        perks: ['Priority DC Queue', 'Off-peak 10% Discount'],
    };
}

export const vehicleService = {
    /**
     * List customer's vehicles
     * Endpoint: GET /api/v1/d2s/vehicles
     */
    async getVehicles(): Promise<Vehicle[]> {
        const raw = await apiClient.get<RawApiVehicle[] | { vehicles?: RawApiVehicle[] }>(
            '/api/v1/d2s/vehicles',
            { requiresAuth: true }
        );

        const list = Array.isArray(raw) ? raw : raw?.vehicles ?? [];
        return list.map(normalizeVehicle);
    },

    /**
     * Add a new vehicle
     * Endpoint: POST /api/v1/d2s/vehicles
     */
    async addVehicle(input: VehicleInput): Promise<Vehicle> {
        const raw = await apiClient.post<RawApiVehicle>(
            '/api/v1/d2s/vehicles',
            input,
            { requiresAuth: true }
        );
        return normalizeVehicle(raw);
    },

    /**
     * List supported vehicle makes and models
     * Endpoint: GET /api/v1/d2s/vehicles/vehicledetails
     */
    async getSupportedVehicleModels(): Promise<any[]> {
        const raw = await apiClient.get<any[] | { models?: any[] }>(
            '/api/v1/d2s/vehicles/vehicledetails',
            { requiresAuth: true }
        );

        return Array.isArray(raw) ? raw : raw?.models ?? [];
    },

    /**
     * Update vehicle details
     * Endpoint: PATCH /api/v1/d2s/vehicles/{vehicleId}
     */
    async updateVehicle(vehicleId: string, updates: Partial<VehicleInput>): Promise<boolean> {
        await apiClient.patch(
            `/api/v1/d2s/vehicles/${encodeURIComponent(vehicleId)}`,
            updates,
            { requiresAuth: true }
        );
        return true;
    },

    /**
     * Delete a vehicle
     * Endpoint: DELETE /api/v1/d2s/vehicles/{vehicleId}
     */
    async deleteVehicle(vehicleId: string): Promise<boolean> {
        await apiClient.delete(
            `/api/v1/d2s/vehicles/${encodeURIComponent(vehicleId)}`,
            { requiresAuth: true }
        );
        return true;
    },
};
