/**
 * Station Discovery & Hardware Details Service
 * Derived from mobile-openapi.json
 */

import { apiClient } from './client';
import {
    ChargePointConnectorDetails,
    RawApiStation,
    normalizeStation,
} from './types';
import { Station } from '../../constants/Stations';

export interface StationSearchParams {
    device_lat: number;
    device_long: number;
    tenantid?: string;
    search?: string;
    connector_type?: string;
    station_type?: string;
    is_expand?: boolean;
    search_lat?: number;
    search_long?: number;
    bound_lat_and_long?: string;
}

export const stationService = {
    /**
     * Search public stations without signing in
     * Endpoint: GET /api/v1/discover-stations/open_list
     */
    async getOpenStations(params: StationSearchParams): Promise<Station[]> {
        const raw = await apiClient.get<RawApiStation[] | { stations?: RawApiStation[] }>(
            '/api/v1/discover-stations/open_list',
            { params: params as any }
        );

        const list = Array.isArray(raw) ? raw : raw?.stations ?? [];
        return list.map(normalizeStation);
    },

    /**
     * Search public stations within viewport map bounds
     * Endpoint: GET /api/v1/discover-stations/open_list_withfilter
     */
    async getStationsInBounds(params: StationSearchParams): Promise<Station[]> {
        const raw = await apiClient.get<RawApiStation[] | { stations?: RawApiStation[] }>(
            '/api/v1/discover-stations/open_list_withfilter',
            { params: params as any }
        );

        const list = Array.isArray(raw) ? raw : raw?.stations ?? [];
        return list.map(normalizeStation);
    },

    /**
     * Get public single station details
     * Endpoint: GET /api/v1/discover-stations/open_single/{stationId}
     */
    async getPublicStationDetails(stationId: string, lat = 28.6139, lng = 77.2090): Promise<Station> {
        const raw = await apiClient.get<RawApiStation>(
            `/api/v1/discover-stations/open_single/${encodeURIComponent(stationId)}`,
            {
                params: {
                    stationId,
                    device_lat: lat,
                    device_long: lng,
                    is_expand: true,
                },
            }
        );

        return normalizeStation(raw);
    },

    /**
     * Get authenticated customer station details
     * Endpoint: GET /api/v1/discover-stations/{stationId}
     */
    async getStationDetails(stationId: string, lat = 28.6139, lng = 77.2090): Promise<Station> {
        const raw = await apiClient.get<RawApiStation>(
            `/api/v1/discover-stations/${encodeURIComponent(stationId)}`,
            {
                requiresAuth: true,
                params: {
                    stationId,
                    device_lat: lat,
                    device_long: lng,
                    is_expand: true,
                },
            }
        );

        return normalizeStation(raw);
    },

    /**
     * Resolve a station from a charge point ID (CPID)
     * Endpoint: GET /api/v1/discover-stations/get_single/chargepoint/{chargePointId}
     */
    async getStationByChargePointId(chargePointId: string): Promise<Station> {
        const raw = await apiClient.get<RawApiStation>(
            `/api/v1/discover-stations/get_single/chargepoint/${encodeURIComponent(chargePointId)}`,
            {
                params: { chargePointId },
            }
        );

        return normalizeStation(raw);
    },

    /**
     * Get dispenser and connector hardware details before charging
     * Endpoint: GET /api/v1/charging-points/{chargePointId}/{connectorId}/details
     */
    async getChargePointConnectorDetails(
        chargePointId: string,
        connectorId: string | number
    ): Promise<ChargePointConnectorDetails> {
        return apiClient.get<ChargePointConnectorDetails>(
            `/api/v1/charging-points/${encodeURIComponent(chargePointId)}/${encodeURIComponent(String(connectorId))}/details`,
            {
                requiresAuth: true,
            }
        );
    },

    /**
     * Get station tariff details
     * Endpoint: GET /api/v1/discover-stations/tariff_details/{stationId}
     */
    async getTariffDetails(stationId: string): Promise<any> {
        return apiClient.get(`/api/v1/discover-stations/tariff_details/${encodeURIComponent(stationId)}`, {
            requiresAuth: true,
            params: { stationId },
        });
    },
};
