/**
 * TypeScript Data Transfer Objects (DTOs) and Models
 * Extracted and mapped from mobile-openapi.json
 */

import { Connector, Station } from '../../constants/Stations';

// ── Generic API Envelopes ──

export interface ApiResponse<T = any> {
    error: boolean;
    success?: boolean;
    code: number;
    message?: string;
    data: T;
}

export interface ErrorResponse {
    error: boolean;
    success?: boolean;
    code: number;
    message: string;
    details?: any;
}

// ── Common OpenAPI Schemas ──

export interface LocationInput {
    name?: string;
    latitude: number;
    longitude: number;
}

export interface VehicleInput {
    nickname?: string;
    manufacturer: string;
    model: string;
    number: string;
    type?: string;
    connectortype?: string;
    power?: number;
    is_temporary?: boolean;
    is_default?: boolean;
    range?: number;
    master_vehicle_id?: number;
}

// ── Station Discovery DTOs ──

export interface RawApiConnector {
    id: string | number;
    connector_id?: string | number;
    charge_point_id?: string;
    charger_id?: string;
    type?: string;
    standard?: string;
    power?: number;
    power_kw?: number;
    status?: string;
    tariff?: number;
    price_per_kwh?: number;
    rate_per_kwh?: number;
    gun_label?: string;
    current_type?: 'AC' | 'DC';
    wait_time_minutes?: number;
}

export interface RawApiStation {
    id?: string;
    station_id?: string;
    stationid?: string;
    name?: string;
    station_name?: string;
    address?: string;
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    latitude?: number | string;
    longitude?: number | string;
    lat?: number | string;
    long?: number | string;
    distance_km?: number;
    distance?: number;
    distanceKm?: number;
    eta_minutes?: number;
    etaMinutes?: number;
    rating?: number;
    average_rating?: number;
    occupancy_label?: string;
    open_time?: string;
    close_time?: string;
    is_open_24_7?: boolean;
    amenities?: string[];
    image?: string;
    image_url?: string;
    gallery_images?: string[];
    tagline?: string;
    reward_boost?: number;
    rewardBoost?: number;
    connectors?: RawApiConnector[];
    charge_points?: Array<{
        charge_point_id: string;
        connectors?: RawApiConnector[];
    }>;
}

// ── Charging & Hardware DTOs ──

export interface ChargePointConnectorDetails {
    charge_point_id: string;
    connector_id: string | number;
    station_id?: string;
    station_name?: string;
    status: 'Available' | 'Preparing' | 'Charging' | 'Busy' | 'Faulted' | 'Unavailable';
    type: string;
    power_kw: number;
    price_per_kwh: number;
    tariff_details?: {
        base_rate: number;
        tax_percent?: number;
        parking_fee?: number;
    };
    max_voltage?: number;
    max_current?: number;
}

export interface StartSessionRequest {
    charge_point_id: string;
    connector_id: number | string;
    vehicle_details: {
        id?: string;
        number?: string;
        model?: string;
        make?: string;
    };
    user_id: string;
    source: 'Mobile';
    evse_uid?: string;
    location_id?: string;
    tid?: number;
    pairName?: string;
    session_rule?: Array<Record<string, string>>;
}

export interface LiveSessionData {
    session_id: string;
    status: 'Starting' | 'Charging' | 'Suspended' | 'Stopping' | 'Completed' | 'Faulted';
    current_soc_percent: number;
    target_soc_percent?: number;
    charging_power_kw: number;
    energy_delivered_kwh: number;
    voltage: number;
    current_amps: number;
    elapsed_seconds: number;
    estimated_remaining_seconds: number;
    total_cost: number;
    currency: string;
    station_name?: string;
    charge_point_id?: string;
    connector_type?: string;
}

// ── Normalization Utilities ──

export function normalizeConnectorType(rawType?: string): Connector['type'] {
    if (!rawType) return 'CCS2';
    const upper = rawType.toUpperCase();
    if (upper.includes('CCS') || upper.includes('CCS2')) return 'CCS2';
    if (upper.includes('TYPE 2') || upper.includes('TYPE2')) return 'Type 2';
    if (upper.includes('CHAD') || upper.includes('CHA')) return 'CHAdeMO';
    if (upper.includes('GB/T') || upper.includes('GBT')) return 'GB/T';
    return 'CCS2';
}

export function normalizeStation(raw: RawApiStation): Station {
    const rawId = String(raw.id ?? raw.station_id ?? raw.stationid ?? Math.random().toString());
    const name = raw.name ?? raw.station_name ?? 'Charging Plaza';
    const lat = Number(raw.latitude ?? raw.lat ?? 28.6139);
    const lng = Number(raw.longitude ?? raw.long ?? 77.2090);

    const connectors: Connector[] = [];
    if (Array.isArray(raw.connectors) && raw.connectors.length > 0) {
        raw.connectors.forEach((c, idx) => {
            const power = Number(c.power ?? c.power_kw ?? 60);
            connectors.push({
                id: String(c.id ?? c.connector_id ?? `${rawId}-G${idx + 1}`),
                chargerId: c.charger_id ?? c.charge_point_id ?? 'CP1233',
                gunLabel: c.gun_label ?? `Gun ${idx + 1}`,
                type: normalizeConnectorType(c.type ?? c.standard),
                currentType: c.current_type ?? (power > 22 ? 'DC' : 'AC'),
                power,
                status: (c.status as Connector['status']) ?? 'Available',
                pricePerKWh: Number(c.price_per_kwh ?? c.rate_per_kwh ?? c.tariff ?? 18.0),
                waitMinutes: Number(c.wait_time_minutes ?? 0),
            });
        });
    } else if (Array.isArray(raw.charge_points)) {
        raw.charge_points.forEach((cp) => {
            if (Array.isArray(cp.connectors)) {
                cp.connectors.forEach((c, idx) => {
                    const power = Number(c.power ?? c.power_kw ?? 60);
                    connectors.push({
                        id: String(c.id ?? c.connector_id ?? `${cp.charge_point_id}-G${idx + 1}`),
                        chargerId: cp.charge_point_id,
                        gunLabel: c.gun_label ?? `Gun ${idx + 1}`,
                        type: normalizeConnectorType(c.type ?? c.standard),
                        currentType: c.current_type ?? (power > 22 ? 'DC' : 'AC'),
                        power,
                        status: (c.status as Connector['status']) ?? 'Available',
                        pricePerKWh: Number(c.price_per_kwh ?? c.rate_per_kwh ?? 18.0),
                        waitMinutes: Number(c.wait_time_minutes ?? 0),
                    });
                });
            }
        });
    }

    if (connectors.length === 0) {
        connectors.push({
            id: `${rawId}-G1`,
            chargerId: 'CP1233',
            gunLabel: 'Gun 1',
            type: 'CCS2',
            currentType: 'DC',
            power: 60,
            status: 'Available',
            pricePerKWh: 18.0,
            waitMinutes: 0,
        });
    }

    const dist = raw.distance_km ?? raw.distanceKm ?? raw.distance;

    return {
        id: rawId,
        name,
        address: (raw.address ?? [raw.street, raw.city, raw.state].filter(Boolean).join(', ')) || 'Charging Plaza Address',
        latitude: lat,
        longitude: lng,
        connectors,
        amenities: Array.isArray(raw.amenities) && raw.amenities.length > 0 ? raw.amenities : ['Restroom', 'WiFi', 'Cafe'],
        openTime: raw.open_time ?? '00:00',
        closeTime: raw.close_time ?? '24:00',
        image: raw.image ?? raw.image_url ?? 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=1000',
        galleryImages: raw.gallery_images,
        rating: Number(raw.rating ?? raw.average_rating ?? 4.8),
        distanceKm: dist !== undefined ? Math.round(Number(dist) * 10) / 10 : 12,
        etaMinutes: raw.eta_minutes ?? raw.etaMinutes ?? (dist ? Math.round(Number(dist) * 1.2) : 15),
        rewardBoost: Number(raw.reward_boost ?? raw.rewardBoost ?? 1.5),
        occupancyLabel: (raw.occupancy_label as any) ?? 'Calm',
        tagline: raw.tagline ?? 'High-speed EV fast-charging hub on the Iris Network',
    };
}
