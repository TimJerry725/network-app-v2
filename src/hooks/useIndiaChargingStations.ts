import { useEffect, useState } from 'react';
import { MOCK_STATIONS, Station } from '../constants/Stations';
import { stationService } from '../services/api/stationService';
import { fetchIndiaGoogleChargingStations } from '../services/googlePlaces';

let cachedRealStations: Station[] | null = null;
let realStationsPromise: Promise<Station[]> | null = null;

export function useIndiaChargingStations() {
    const [stations, setStations] = useState<Station[]>(
        cachedRealStations ?? MOCK_STATIONS
    );
    const [isLoading, setIsLoading] = useState(!cachedRealStations);

    useEffect(() => {
        let isCancelled = false;

        const loadStations = async () => {
            if (cachedRealStations && cachedRealStations.length > 0) {
                setStations(cachedRealStations);
                setIsLoading(false);
                return;
            }

            try {
                // 1. Primary: Fetch live stations from Iris Mobile BFF API
                realStationsPromise ??= (async () => {
                    try {
                        const liveStations = await stationService.getOpenStations({
                            device_lat: 28.6139,
                            device_long: 77.2090,
                            is_expand: true,
                        });
                        if (liveStations && liveStations.length > 0) {
                            return liveStations;
                        }
                    } catch (apiErr) {
                        console.warn('[IrisAPI] Live station fetch note:', (apiErr as any)?.message);
                    }

                    // 2. Secondary fallback if dev environment requires authenticated tenant
                    try {
                        const googleStations = await fetchIndiaGoogleChargingStations();
                        if (googleStations && googleStations.length > 0) {
                            return googleStations;
                        }
                    } catch {
                        // fallback to base mock
                    }

                    return MOCK_STATIONS;
                })();

                const fetchedStations = await realStationsPromise;
                cachedRealStations = fetchedStations;

                if (isCancelled) {
                    return;
                }

                setStations(fetchedStations);
            } catch {
                if (!isCancelled) {
                    setStations(MOCK_STATIONS);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadStations();

        return () => {
            isCancelled = true;
        };
    }, []);

    return { stations, isLoading };
}
