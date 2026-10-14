import { Connector, Station } from '../constants/Stations';
import { getGoogleMapsApiKey } from './googleMaps';

const GOOGLE_PLACES_NEARBY_URL =
    'https://places.googleapis.com/v1/places:searchNearby';
const REAL_STATION_IMAGE =
    'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=1000';
const IN_EV_SEARCH_CENTERS = [
    { latitude: 19.0760, longitude: 72.8777 }, // Mumbai
    { latitude: 28.6139, longitude: 77.2090 }, // Delhi
    { latitude: 12.9716, longitude: 77.5946 }, // Bengaluru
    { latitude: 17.3850, longitude: 78.4867 }, // Hyderabad
    { latitude: 13.0827, longitude: 80.2707 }, // Chennai
    { latitude: 22.5726, longitude: 88.3639 }, // Kolkata
    { latitude: 18.5204, longitude: 73.8567 }, // Pune
    { latitude: 23.0225, longitude: 72.5714 }, // Ahmedabad
    { latitude: 26.9124, longitude: 75.7873 }, // Jaipur
    { latitude: 30.7333, longitude: 76.7794 }, // Chandigarh
    { latitude: 26.8467, longitude: 80.9462 }, // Lucknow
    { latitude: 26.4499, longitude: 80.3319 }, // Kanpur
    { latitude: 21.1458, longitude: 79.0882 }, // Nagpur
    { latitude: 22.7196, longitude: 75.8577 }, // Indore
    { latitude: 23.2599, longitude: 77.4126 }, // Bhopal
    { latitude: 17.6868, longitude: 83.2185 }, // Visakhapatnam
    { latitude: 25.5941, longitude: 85.1376 }, // Patna
    { latitude: 22.3072, longitude: 73.1812 }, // Vadodara
    { latitude: 28.6692, longitude: 77.4538 }, // Ghaziabad
    { latitude: 30.9010, longitude: 75.8573 }, // Ludhiana
    { latitude: 27.1767, longitude: 78.0081 }, // Agra
    { latitude: 25.3176, longitude: 82.9739 }, // Varanasi
];

type GooglePlacesNearbyResponse = {
    places?: GoogleEvPlace[];
};

type GoogleEvPlace = {
    id?: string;
    displayName?: {
        text?: string;
    };
    formattedAddress?: string;
    location?: {
        latitude?: number;
        longitude?: number;
    };
    rating?: number;
    evChargeOptions?: {
        connectorCount?: number;
        connectorAggregation?: GoogleConnectorAggregation[];
    };
};

type GoogleConnectorAggregation = {
    type?: string;
    maxChargeRateKw?: number;
    count?: number;
    availableCount?: number;
    outOfServiceCount?: number;
};

function mapConnectorType(type?: string): Connector['type'] {
    if (type === 'EV_CONNECTOR_TYPE_TYPE_2') {
        return 'Type 2';
    }

    if (type === 'EV_CONNECTOR_TYPE_CHADEMO') {
        return 'CHAdeMO';
    }

    return 'CCS2';
}

function estimateConnectorPrice(powerKw: number) {
    if (powerKw >= 250) {
        return 0.69;
    }

    if (powerKw >= 150) {
        return 0.62;
    }

    if (powerKw >= 75) {
        return 0.54;
    }

    return 0.39;
}

function mapConnectorStatus(
    connector: GoogleConnectorAggregation
): Connector['status'] {
    if ((connector.availableCount ?? 0) > 0) {
        return 'Available';
    }

    const totalCount = connector.count ?? 1;
    const outOfServiceCount = connector.outOfServiceCount ?? 0;

    if (outOfServiceCount >= totalCount) {
        return 'Maintenance';
    }

    return 'Busy';
}

function createFallbackConnector(placeId: string): Connector[] {
    return [
        {
            id: `${placeId}-default-1`,
            type: 'CCS2',
            power: 120,
            status: 'Available',
            pricePerKWh: estimateConnectorPrice(120),
            waitMinutes: 0,
        },
    ];
}

function mapConnectors(placeId: string, place: GoogleEvPlace): Connector[] {
    const aggregations = place.evChargeOptions?.connectorAggregation ?? [];

    if (aggregations.length === 0) {
        return createFallbackConnector(placeId);
    }

    const connectors = aggregations.map((connector, index) => {
        const power = Math.max(22, Math.round(connector.maxChargeRateKw ?? 120));
        const status = mapConnectorStatus(connector);

        return {
            id: `${placeId}-${index + 1}`,
            type: mapConnectorType(connector.type),
            power,
            status,
            pricePerKWh: estimateConnectorPrice(power),
            waitMinutes: status === 'Available' ? 0 : status === 'Busy' ? 12 : 0,
        };
    });

    return connectors.length > 0 ? connectors : createFallbackConnector(placeId);
}

function mapOccupancyLabel(connectors: Connector[]): Station['occupancyLabel'] {
    const availableCount = connectors.filter(
        (connector) => connector.status === 'Available'
    ).length;

    if (availableCount >= Math.max(1, Math.ceil(connectors.length / 2))) {
        return 'Calm';
    }

    if (availableCount > 0) {
        return 'Balanced';
    }

    return 'Busy';
}

function mapPlaceToStation(place: GoogleEvPlace): Station | null {
    const placeId = place.id?.trim();
    const latitude = place.location?.latitude;
    const longitude = place.location?.longitude;

    if (!placeId || latitude === undefined || longitude === undefined) {
        return null;
    }

    const connectors = mapConnectors(placeId, place);
    const rating = Number(place.rating ?? 4.3);
    const occupancyLabel = mapOccupancyLabel(connectors);
    const maxPower = Math.max(...connectors.map((connector) => connector.power));

    return {
        id: placeId,
        name: place.displayName?.text?.trim() || 'EV charging station',
        address: place.formattedAddress?.trim() || 'India',
        latitude,
        longitude,
        connectors,
        amenities: [],
        openTime: 'Hours vary',
        closeTime: 'Check Google Maps',
        image: REAL_STATION_IMAGE,
        rating,
        distanceKm: 0,
        etaMinutes: 0,
        rewardBoost: Math.max(16, Math.round(rating * 8)),
        occupancyLabel,
        tagline: `Live Google charger data • up to ${maxPower} kW`,
    };
}

async function fetchNearbyEvStations(
    latitude: number,
    longitude: number,
    apiKey: string
) {
    const response = await fetch(GOOGLE_PLACES_NEARBY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
                'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.evChargeOptions',
        },
        body: JSON.stringify({
            includedTypes: ['electric_vehicle_charging_station'],
            maxResultCount: 20,
            languageCode: 'en',
            regionCode: 'IN',
            rankPreference: 'POPULARITY',
            locationRestriction: {
                circle: {
                    center: {
                        latitude,
                        longitude,
                    },
                    radius: 35000,
                },
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`Google Places request failed with ${response.status}`);
    }

    const payload = (await response.json()) as GooglePlacesNearbyResponse;
    return payload.places ?? [];
}

export async function fetchIndiaGoogleChargingStations() {
    const apiKey = getGoogleMapsApiKey();

    if (!apiKey) {
        return [];
    }

    const placeGroups = await Promise.all(
        IN_EV_SEARCH_CENTERS.map((center) =>
            fetchNearbyEvStations(center.latitude, center.longitude, apiKey)
        )
    );

    const uniqueStations = new Map<string, Station>();

    placeGroups.flat().forEach((place) => {
        const station = mapPlaceToStation(place);

        if (!station || uniqueStations.has(station.id)) {
            return;
        }

        uniqueStations.set(station.id, station);
    });

    return Array.from(uniqueStations.values())
        .filter(
            (station) =>
                station.latitude >= 8.0 && station.latitude <= 37.0 && station.longitude >= 68.0 && station.longitude <= 97.0
        )
        .slice(0, 140);
}
