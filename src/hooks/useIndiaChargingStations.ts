import { useEffect, useState } from 'react';
import { MOCK_STATIONS, Station } from '../constants/Stations';
import { fetchIndiaGoogleChargingStations } from '../services/googlePlaces';

let cachedIndiaStations: Station[] | null = null;
let indiaStationsPromise: Promise<Station[]> | null = null;

export function useIndiaChargingStations() {
    const [stations, setStations] = useState<Station[]>(
        cachedIndiaStations ?? MOCK_STATIONS
    );
    const [isLoading, setIsLoading] = useState(!cachedIndiaStations);

    useEffect(() => {
        let isCancelled = false;

        const loadStations = async () => {
            if (cachedIndiaStations) {
                setStations(cachedIndiaStations);
                setIsLoading(false);
                return;
            }

            try {
                indiaStationsPromise ??= fetchIndiaGoogleChargingStations();
                const fetchedStations = await indiaStationsPromise;
                cachedIndiaStations =
                    fetchedStations.length >= 100 ? fetchedStations : MOCK_STATIONS;

                if (isCancelled) {
                    return;
                }

                setStations(cachedIndiaStations);
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
