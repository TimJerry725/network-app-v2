import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { tripPlannerService } from '../services/api/tripPlannerService';

/** A trip the driver saved from the Trip Planner. Shown in Trips and in Saved. */
export type SavedTrip = {
    id: string;
    origin: { id?: string; name: string };
    destination: { id?: string; name: string };
    distanceKm?: number;
    durationMins?: number;
    routeTag?: string;
    plannedAt?: string;
};

// Example trips shown until the account has real saved trips
const SAMPLE_SAVED_TRIPS: SavedTrip[] = [
    { id: 'sample-1', origin: { id: 'coimbatore', name: 'Coimbatore' }, destination: { id: 'bengaluru', name: 'Bengaluru' }, distanceKm: 365, durationMins: 375, routeTag: 'Fastest' },
    { id: 'sample-2', origin: { id: 'coimbatore', name: 'Coimbatore' }, destination: { id: 'ooty', name: 'Ooty' }, distanceKm: 87, durationMins: 150, routeTag: 'Fastest' },
    { id: 'sample-3', origin: { id: 'bengaluru', name: 'Bengaluru' }, destination: { id: 'chennai', name: 'Chennai' }, distanceKm: 346, durationMins: 340, routeTag: 'Route 2' },
    { id: 'sample-4', origin: { id: 'mumbai', name: 'Mumbai' }, destination: { id: 'pune', name: 'Pune' }, distanceKm: 149, durationMins: 175, routeTag: 'Fastest' },
];

type SavedTripsContextType = {
    savedTrips: SavedTrip[];
    addTrip: (trip: Omit<SavedTrip, 'id'> & { id?: string }) => void;
    removeTrip: (id: string) => void;
    isTripSaved: (originId: string, destinationId: string) => boolean;
};

const SavedTripsContext = createContext<SavedTripsContextType | undefined>(undefined);

export function SavedTripsProvider({ children }: { children: React.ReactNode }) {
    const [savedTrips, setSavedTrips] = useState<SavedTrip[]>(SAMPLE_SAVED_TRIPS);

    useEffect(() => {
        let alive = true;
        tripPlannerService
            .getSavedTrips()
            .then((trips) => {
                if (alive && trips.length > 0) setSavedTrips(trips as SavedTrip[]);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    const addTrip = useCallback((trip: Omit<SavedTrip, 'id'> & { id?: string }) => {
        setSavedTrips((prev) => [{ ...trip, id: trip.id ?? `local-${Date.now()}` }, ...prev]);
    }, []);

    const removeTrip = useCallback((id: string) => {
        setSavedTrips((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const isTripSaved = useCallback(
        (originId: string, destinationId: string) =>
            savedTrips.some((t) => t.origin?.id === originId && t.destination?.id === destinationId),
        [savedTrips]
    );

    const value = useMemo(() => ({ savedTrips, addTrip, removeTrip, isTripSaved }), [savedTrips, addTrip, removeTrip, isTripSaved]);

    return <SavedTripsContext.Provider value={value}>{children}</SavedTripsContext.Provider>;
}

export function useSavedTrips() {
    const ctx = useContext(SavedTripsContext);
    if (!ctx) throw new Error('useSavedTrips must be used within a SavedTripsProvider');
    return ctx;
}
