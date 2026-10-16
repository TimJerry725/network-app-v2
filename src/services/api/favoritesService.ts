/**
 * Favourites Service
 * Derived from mobile-openapi.json
 */

import { apiClient } from './client';
import { RawApiStation, normalizeStation } from './types';
import { Station } from '../../constants/Stations';

export const favoritesService = {
    /**
     * List customer's favourite stations
     * Endpoint: GET /api/v1/favorite-stations
     */
    async getFavoriteStations(): Promise<Station[]> {
        const raw = await apiClient.get<RawApiStation[] | { stations?: RawApiStation[] }>(
            '/api/v1/favorite-stations',
            {
                requiresAuth: true,
            }
        );

        const list = Array.isArray(raw) ? raw : raw?.stations ?? [];
        return list.map(normalizeStation);
    },

    /**
     * Add a station to favourites
     * Endpoint: POST /api/v1/favorite-stations
     */
    async addFavoriteStation(stationId: string): Promise<boolean> {
        await apiClient.post(
            '/api/v1/favorite-stations',
            { stationid: stationId },
            { requiresAuth: true }
        );
        return true;
    },

    /**
     * Remove a station from favourites
     * Endpoint: DELETE /api/v1/d2s/favorite-stations/{stationId}
     */
    async removeFavoriteStation(stationId: string): Promise<boolean> {
        await apiClient.delete(
            `/api/v1/d2s/favorite-stations/${encodeURIComponent(stationId)}`,
            { requiresAuth: true }
        );
        return true;
    },
};
