import React, { createContext, useState, useContext, useEffect } from 'react';
import { vehicleService } from '../services/api/vehicleService';
import { profileService } from '../services/api/profileService';

export type ConnectorStandard = 'CCS2' | 'Type 2' | 'CHAdeMO' | 'GB/T';

export type UserProfile = {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    rfidTag: string;
    walletBalance: number;
    currency: string;
    membershipTier: 'Standard' | 'Pro' | 'Iris Fleet';
    isSeniorMode: boolean; // Enables larger buttons & high contrast
};

export type Vehicle = {
    id: string;
    nickname: string;
    make: string;
    model: string;
    year: string;
    registrationNumber: string;
    connectorType: ConnectorStandard;
    batteryCapacity: number; // in kWh
    maxDcRateKw: number; // maximum DC charging speed
    currentBattery: number; // percentage (0-100)
    estRangeKm: number;
    chargeTarget: number; // target percentage (default 80 or 90)
    autochargeEnabled: boolean;
    vidTag?: string; // Vehicle identification tag for Plug & Charge / CPO
    perks: string[];
};

type VehicleContextType = {
    user: UserProfile;
    updateUser: (updates: Partial<UserProfile>) => void;
    topUpWallet: (amount: number) => void;
    toggleSeniorMode: () => void;
    vehicles: Vehicle[];
    addVehicle: (vehicle: Vehicle) => void;
    updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
    removeVehicle: (id: string) => void;
    selectedVehicleId: string | null;
    selectedVehicle: Vehicle | null;
    selectVehicle: (id: string) => void;
};

const INITIAL_USER: UserProfile = {
    id: 'usr_cpo_982',
    fullName: 'Timothee Vance',
    phone: '+91 98452 71092',
    email: 'tim.vance@example.com',
    rfidTag: 'IRIS-RFID-7729',
    walletBalance: 1250.00,
    currency: '₹',
    membershipTier: 'Iris Fleet',
    isSeniorMode: false,
};

const INITIAL_VEHICLES: Vehicle[] = [
    {
        id: '1',
        nickname: 'Daily Sprint',
        make: 'Hyundai',
        model: 'IONIQ 5',
        year: '2024',
        registrationNumber: 'TN 38 BZ 9021',
        connectorType: 'CCS2',
        batteryCapacity: 72.6,
        maxDcRateKw: 220,
        currentBattery: 58,
        estRangeKm: 270,
        chargeTarget: 85,
        autochargeEnabled: true,
        vidTag: 'VID-HY-IONIQ5-9021',
        perks: ['Fast Charge Capable (350kW)', 'Autocharge Active', 'Battery Preheating'],
    },
    {
        id: '2',
        nickname: 'City Commuter',
        make: 'Tata',
        model: 'Nexon EV Empowered',
        year: '2024',
        registrationNumber: 'MH 02 EQ 4410',
        connectorType: 'CCS2',
        batteryCapacity: 40.5,
        maxDcRateKw: 50,
        currentBattery: 38,
        estRangeKm: 145,
        chargeTarget: 90,
        autochargeEnabled: false,
        vidTag: 'VID-TT-NXON-4410',
        perks: ['City Friendly', 'Smart Regen', 'Eco Mode'],
    },
    {
        id: '3',
        nickname: 'Highway Cruiser',
        make: 'Kia',
        model: 'EV6 GT-Line',
        year: '2023',
        registrationNumber: 'DL 01 EV 8800',
        connectorType: 'CCS2',
        batteryCapacity: 77.4,
        maxDcRateKw: 240,
        currentBattery: 72,
        estRangeKm: 340,
        chargeTarget: 80,
        autochargeEnabled: true,
        vidTag: 'VID-KA-EV6-8800',
        perks: ['Ultra-fast 800V Architecture', 'V2L Enabled', 'Lounge Access'],
    },
];

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile>(INITIAL_USER);
    const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>('1');

    // Fetch live vehicles and profile from Iris Mobile BFF API
    useEffect(() => {
        let isMounted = true;

        (async () => {
            try {
                const liveVehicles = await vehicleService.getVehicles();
                if (isMounted && liveVehicles && liveVehicles.length > 0) {
                    setVehicles(liveVehicles);
                    setSelectedVehicleId(liveVehicles[0].id);
                }
            } catch {
                // Keep local defaults if offline or unauthenticated
            }

            try {
                const liveProfile = await profileService.getProfile();
                if (isMounted && liveProfile) {
                    setUser(liveProfile);
                }
            } catch {
                // Keep local defaults if offline or unauthenticated
            }
        })();

        return () => {
            isMounted = false;
        };
    }, []);

    const updateUser = (updates: Partial<UserProfile>) => {
        setUser((prev) => ({ ...prev, ...updates }));
        profileService.updateProfile(user.id, updates as any).catch(() => {});
    };

    const topUpWallet = (amount: number) => {
        setUser((prev) => ({ ...prev, walletBalance: Number((prev.walletBalance + amount).toFixed(2)) }));
    };

    const toggleSeniorMode = () => {
        setUser((prev) => ({ ...prev, isSeniorMode: !prev.isSeniorMode }));
    };

    const addVehicle = (vehicle: Vehicle) => {
        setVehicles((current) => [...current, vehicle]);
        setSelectedVehicleId(vehicle.id);
        vehicleService
            .addVehicle({
                nickname: vehicle.nickname,
                manufacturer: vehicle.make,
                model: vehicle.model,
                number: vehicle.registrationNumber,
                connectortype: vehicle.connectorType,
                power: vehicle.maxDcRateKw,
                range: vehicle.estRangeKm,
            })
            .catch(() => {});
    };

    const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
        setVehicles((current) =>
            current.map((v) => (v.id === id ? { ...v, ...updates } : v))
        );
        vehicleService
            .updateVehicle(id, {
                nickname: updates.nickname,
                number: updates.registrationNumber,
                range: updates.estRangeKm,
            })
            .catch(() => {});
    };

    const removeVehicle = (id: string) => {
        setVehicles((current) => {
            const nextVehicles = current.filter((vehicle) => vehicle.id !== id);
            if (selectedVehicleId === id) {
                setSelectedVehicleId(nextVehicles[0]?.id ?? null);
            }
            return nextVehicles;
        });
        vehicleService.deleteVehicle(id).catch(() => {});
    };

    const selectVehicle = (id: string) => {
        setSelectedVehicleId(id);
    };

    const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? vehicles[0] ?? null;

    return (
        <VehicleContext.Provider
            value={{
                user,
                updateUser,
                topUpWallet,
                toggleSeniorMode,
                vehicles,
                addVehicle,
                updateVehicle,
                removeVehicle,
                selectedVehicleId,
                selectedVehicle,
                selectVehicle,
            }}
        >
            {children}
        </VehicleContext.Provider>
    );
}

export function useVehicles() {
    const context = useContext(VehicleContext);
    if (context === undefined) {
        throw new Error('useVehicles must be used within a VehicleProvider');
    }
    return context;
}
