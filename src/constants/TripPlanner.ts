import { Vehicle } from '../context/VehicleContext';
import { Connector, MOCK_STATIONS, Station, isConnectorCompatible } from './Stations';

export type TripFocus = 'Fastest' | 'Comfort' | 'Family' | 'Budget';

export type TripLocation = {
    id: string;
    label: string;
    subtitle: string;
    latitude: number;
    longitude: number;
    altitudeM: number;
    hint: string;
};

export type TripCrowdLabel = 'Light' | 'Moderate' | 'Busy';
export type TripAvailabilityLabel = 'Open' | 'Tight' | 'Full';

export type TripStationRecommendation = {
    station: Station;
    connector: Connector;
    score: number;
    detourKm: number;
    progress: number;
    distanceFromOriginKm: number;
    distanceToDestinationKm: number;
    amenityMatches: string[];
    amenityScore: number;
    reason: string;
    arrivalBatteryPercent: number;
    arrivalTimeMinutes: number;
    arrivalTimeLabel: string;
    elevationDeltaM: number;
    elevationImpactPercent: number;
    predictedCrowdLabel: TripCrowdLabel;
    availabilityLabel: TripAvailabilityLabel;
    predictedOpenConnectors: number;
    predictedCompatibleConnectors: number;
    predictedWaitMinutes: number;
    bestPricePerKWh: number;
    pricingLabel: string;
};

export type TripStop = TripStationRecommendation & {
    distanceFromPreviousKm: number;
    departureBatteryPercent: number;
    chargeMinutes: number;
    queueMinutes: number;
    totalStopMinutes: number;
    departureTimeMinutes: number;
    departureTimeLabel: string;
    addedEnergyKWh: number;
    chargeCost: number;
};

export type ElevationWaypoint = {
    id: string;
    label: string;
    distanceKm: number;
    altitudeM: number;
    batteryPercent: number;
    type: 'start' | 'stop' | 'destination';
};

export type TripPlan = {
    origin: TripLocation;
    destination: TripLocation;
    focus: TripFocus;
    totalDistanceKm: number;
    driveMinutes: number;
    departureTimeMinutes: number;
    departureTimeLabel: string;
    arrivalTimeMinutes: number;
    arrivalTimeLabel: string;
    energyNeededKWh: number;
    fullRangeKm: number;
    stops: TripStop[];
    recommendedStations: TripStationRecommendation[];
    backupStations: TripStationRecommendation[];
    destinationStations: TripStationRecommendation[];
    arrivalBatteryPercent: number;
    reservePercent: number;
    routeCoordinates: { latitude: number; longitude: number }[];
    summary: string;
    checklist: string[];
    needsPreTripTopUp: boolean;
    // Elevation & terrain metadata
    totalElevationGainM: number;
    totalElevationLossM: number;
    netElevationDeltaM: number;
    totalElevationImpactPercent: number;
    elevationWaypoints: ElevationWaypoint[];
};

type StationRhythm = 'urban' | 'highway' | 'retail' | 'destination';

type StationProfile = {
    altitudeM: number;
    rhythm: StationRhythm;
};

const AVERAGE_SPEED_KMH = 79;
const RESERVE_PERCENT = 12;
const MIN_STOP_GAP_KM = 24;
const NEAR_ROUTE_DETOUR_LIMIT_KM = 120;

export const TRIP_LOCATIONS: TripLocation[] = [
    {
        id: 'mumbai',
        label: 'Mumbai',
        subtitle: 'City departure with dense charger access',
        latitude: 19.0760,
        longitude: 72.8777,
        altitudeM: 14,
        hint: 'Good starting point for highway trips',
    },
    {
        id: 'pune',
        label: 'Pune',
        subtitle: 'Comfort stop with strong charging access',
        latitude: 18.5204,
        longitude: 73.8567,
        altitudeM: 560,
        hint: 'Works well for western routes',
    },
    {
        id: 'delhi',
        label: 'Delhi',
        subtitle: 'Capital route with plenty of amenities',
        latitude: 28.6139,
        longitude: 77.2090,
        altitudeM: 216,
        hint: 'Good for northbound journeys',
    },
    {
        id: 'bengaluru',
        label: 'Bengaluru',
        subtitle: 'Tech hub with rapid chargers',
        latitude: 12.9716,
        longitude: 77.5946,
        altitudeM: 920,
        hint: 'Ideal for southern road trips',
    },
    {
        id: 'hyderabad',
        label: 'Hyderabad',
        subtitle: 'Central interchange with fast hubs',
        latitude: 17.3850,
        longitude: 78.4867,
        altitudeM: 542,
        hint: 'Useful junction for central journeys',
    },
    {
        id: 'chennai',
        label: 'Chennai',
        subtitle: 'Coastal departure with ultra-fast charging',
        latitude: 13.0827,
        longitude: 80.2707,
        altitudeM: 6,
        hint: 'Strong base for southern trips',
    },
    {
        id: 'kolkata',
        label: 'Kolkata',
        subtitle: 'Eastbound route with city charging',
        latitude: 22.5726,
        longitude: 88.3639,
        altitudeM: 9,
        hint: 'Scenic option for eastern travel',
    },
    {
        id: 'ahmedabad',
        label: 'Ahmedabad',
        subtitle: 'Western city with reliable hubs',
        latitude: 23.0225,
        longitude: 72.5714,
        altitudeM: 53,
        hint: 'Ideal for longer highway trips',
    },
    {
        id: 'jaipur',
        label: 'Jaipur',
        subtitle: 'Tourist route with highway-friendly superhubs',
        latitude: 26.9124,
        longitude: 75.7873,
        altitudeM: 431,
        hint: 'Good for northern travel',
    },
    {
        id: 'chandigarh',
        label: 'Chandigarh',
        subtitle: 'Northern destination',
        latitude: 30.7333,
        longitude: 76.7794,
        altitudeM: 321,
        hint: 'Plan for one or two highway stops',
    },
    {
        id: 'coimbatore',
        label: 'Coimbatore',
        subtitle: 'Southern EV corridor hub with Casa Grand & Saravanampatti plazas',
        latitude: 11.0168,
        longitude: 76.9558,
        altitudeM: 411,
        hint: 'Strong fast-charging base in Tamil Nadu',
    },
    {
        id: 'ooty',
        label: 'Ooty (Nilgiris)',
        subtitle: 'Hill station climb requiring high elevation reserve',
        latitude: 11.4102,
        longitude: 76.6950,
        altitudeM: 2240,
        hint: 'High elevation gain — charge to 90% before ascent',
    },
];

export const TRIP_FOCUS_OPTIONS: {
    value: TripFocus;
    label: string;
    description: string;
}[] = [
    {
        value: 'Fastest',
        label: 'Fastest arrival',
        description: 'Bias toward high-power chargers and low wait time',
    },
    {
        value: 'Comfort',
        label: 'Coffee + comfort',
        description: 'Prefer lounges, cafes, WiFi, and calm stations',
    },
    {
        value: 'Family',
        label: 'Family-friendly',
        description: 'Prioritize food, restrooms, and easy break stops',
    },
    {
        value: 'Budget',
        label: 'Lowest cost',
        description: 'Keep charging cost and detours lower',
    },
];

export const POPULAR_ROUTES: Array<{
    id: string;
    originId: TripLocation['id'];
    destinationId: TripLocation['id'];
    label: string;
}> = [
    { id: 'route-cbe-blr', originId: 'coimbatore', destinationId: 'bengaluru', label: 'Coimbatore → Bengaluru' },
    { id: 'route-cbe-ooty', originId: 'coimbatore', destinationId: 'ooty', label: 'Coimbatore → Ooty' },
    { id: 'route-cbe-maa', originId: 'coimbatore', destinationId: 'chennai', label: 'Coimbatore → Chennai' },
    { id: 'route-3', originId: 'bengaluru', destinationId: 'chennai', label: 'Bengaluru → Chennai' },
    { id: 'route-1', originId: 'mumbai', destinationId: 'pune', label: 'Mumbai → Pune' },
    { id: 'route-2', originId: 'delhi', destinationId: 'jaipur', label: 'Delhi → Jaipur' },
];

const STATION_PROFILES: Record<string, StationProfile> = {
    '1': { altitudeM: 14, rhythm: 'urban' },
    '2': { altitudeM: 8, rhythm: 'retail' },
    '3': { altitudeM: 322, rhythm: 'highway' },
    '4': { altitudeM: 154, rhythm: 'urban' },
    '5': { altitudeM: 11, rhythm: 'urban' },
    '6': { altitudeM: 110, rhythm: 'highway' },
    '7': { altitudeM: 15, rhythm: 'urban' },
    '8': { altitudeM: 140, rhythm: 'urban' },
    '9': { altitudeM: 262, rhythm: 'retail' },
    '10': { altitudeM: 11, rhythm: 'destination' },
    '11': { altitudeM: 38, rhythm: 'destination' },
    '12': { altitudeM: 210, rhythm: 'highway' },
    '13': { altitudeM: 270, rhythm: 'urban' },
    '14': { altitudeM: 95, rhythm: 'urban' },
    '15': { altitudeM: 47, rhythm: 'destination' },
    '16': { altitudeM: 40, rhythm: 'destination' },
    'cbe-casagrand-01': { altitudeM: 415, rhythm: 'highway' },
    'cbe-sp-01': { altitudeM: 420, rhythm: 'urban' },
    'tn-avinashi-01': { altitudeM: 315, rhythm: 'highway' },
    'tn-erode-01': { altitudeM: 185, rhythm: 'highway' },
    'tn-salem-01': { altitudeM: 278, rhythm: 'highway' },
    'tn-dharmapuri-01': { altitudeM: 468, rhythm: 'highway' },
    'tn-krishnagiri-01': { altitudeM: 631, rhythm: 'highway' },
    'tn-hosur-01': { altitudeM: 879, rhythm: 'highway' },
    'tn-vellore-01': { altitudeM: 216, rhythm: 'highway' },
    'tn-ulundurpet-01': { altitudeM: 72, rhythm: 'highway' },
    'tn-mettupalayam-01': { altitudeM: 350, rhythm: 'highway' },
    'tn-coonoor-01': { altitudeM: 1850, rhythm: 'destination' },
};

const focusAmenityMap: Record<TripFocus, string[]> = {
    Fastest: ['Coffee', 'Restroom'],
    Comfort: ['Cafe', 'Restroom', 'Lounge', 'WiFi'],
    Family: ['Food Court', 'Restroom', 'Mall', 'Lounge', 'Coffee'],
    Budget: ['Restroom', 'WiFi'],
};

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function round(value: number, decimals = 1) {
    const power = 10 ** decimals;
    return Math.round(value * power) / power;
}

function toRadians(value: number) {
    return (value * Math.PI) / 180;
}

function formatClockTime(totalMinutes: number) {
    const normalizedMinutes = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
    const hours24 = Math.floor(normalizedMinutes / 60);
    const minutes = normalizedMinutes % 60;
    const meridiem = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;

    return `${hours12}:${minutes.toString().padStart(2, '0')} ${meridiem}`;
}

function estimateDriveMinutes(distanceKm: number) {
    return Math.max(8, Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60));
}

export function haversineKm(
    left: { latitude: number; longitude: number },
    right: { latitude: number; longitude: number }
) {
    const earthRadiusKm = 6371;
    const latitudeDelta = toRadians(right.latitude - left.latitude);
    const longitudeDelta = toRadians(right.longitude - left.longitude);
    const latitudeA = toRadians(left.latitude);
    const latitudeB = toRadians(right.latitude);

    const area =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(latitudeA) *
            Math.cos(latitudeB) *
            Math.sin(longitudeDelta / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(area), Math.sqrt(1 - area));
}

function estimateFullRangeKm(vehicle: Vehicle) {
    if (vehicle.currentBattery > 0) {
        return round(vehicle.estRangeKm / (vehicle.currentBattery / 100));
    }

    return round(vehicle.batteryCapacity * 5.4);
}

function percentNeededForDistance(distanceKm: number, fullRangeKm: number) {
    return (distanceKm / fullRangeKm) * 100;
}

function usableDistanceKm(fullRangeKm: number, batteryPercent: number, reservePercent = RESERVE_PERCENT) {
    return Math.max(0, (fullRangeKm * Math.max(batteryPercent - reservePercent, 0)) / 100);
}

function estimateChargeMinutes(
    currentPercent: number,
    targetPercent: number,
    powerKw: number,
    batteryCapacity: number
) {
    const deltaPercent = Math.max(targetPercent - currentPercent, 0);
    const addedEnergyKWh = (batteryCapacity * deltaPercent) / 100;
    const averagePowerKw = Math.max(45, Math.min(powerKw * 0.72, 160));

    return Math.max(6, Math.round((addedEnergyKWh / averagePowerKw) * 60));
}

export function interpolateRouteCoordinates(
    coordinates: Array<{ latitude: number; longitude: number }>
) {
    if (coordinates.length < 2) {
        return coordinates;
    }

    const routePoints: Array<{ latitude: number; longitude: number }> = [];

    for (let index = 0; index < coordinates.length - 1; index += 1) {
        const current = coordinates[index];
        const next = coordinates[index + 1];
        const steps = 6;

        for (let step = 0; step < steps; step += 1) {
            const progress = step / steps;
            routePoints.push({
                latitude: current.latitude + (next.latitude - current.latitude) * progress,
                longitude: current.longitude + (next.longitude - current.longitude) * progress,
            });
        }
    }

    routePoints.push(coordinates[coordinates.length - 1]);
    return routePoints;
}

function getTripLocationById(id: TripLocation['id']) {
    return TRIP_LOCATIONS.find((location) => location.id === id);
}

export function getStationProfile(stationId: string) {
    return STATION_PROFILES[stationId] ?? { altitudeM: 18, rhythm: 'highway' as const };
}

function getCompatibleRouteConnectors(
    station: Station,
    vehicleConnectorType: Vehicle['connectorType']
) {
    return station.connectors
        .filter(
            (connector) =>
                connector.status !== 'Maintenance' &&
                isConnectorCompatible(connector.type, vehicleConnectorType)
        )
        .sort((left, right) => {
            const leftExactMatch = left.type === vehicleConnectorType ? 1 : 0;
            const rightExactMatch = right.type === vehicleConnectorType ? 1 : 0;

            if (leftExactMatch !== rightExactMatch) {
                return rightExactMatch - leftExactMatch;
            }

            if (left.power !== right.power) {
                return right.power - left.power;
            }

            return left.pricePerKWh - right.pricePerKWh;
        });
}

function amenityMatchesForFocus(amenities: string[], focus: TripFocus) {
    const preferredAmenities = focusAmenityMap[focus];

    return preferredAmenities.filter((amenity) => amenities.includes(amenity));
}

function amenityScoreForStation(station: Station, amenityMatches: string[]) {
    return round(
        clamp(
            station.rating +
                amenityMatches.length * 0.15 +
                Math.min(station.amenities.length, 4) * 0.05,
            0,
            5
        ),
        1
    );
}

function demandShiftForHour(rhythm: StationRhythm, hour: number) {
    if (hour < 6) {
        return -0.18;
    }

    if (rhythm === 'urban') {
        if (hour >= 7 && hour < 10) {
            return 0.16;
        }
        if (hour >= 12 && hour < 14) {
            return 0.08;
        }
        if (hour >= 17 && hour < 20) {
            return 0.2;
        }

        return 0;
    }

    if (rhythm === 'highway') {
        if (hour >= 7 && hour < 10) {
            return 0.12;
        }
        if (hour >= 11 && hour < 15) {
            return 0.22;
        }
        if (hour >= 16 && hour < 20) {
            return 0.18;
        }
        if (hour >= 20 && hour < 23) {
            return 0.08;
        }

        return -0.05;
    }

    if (rhythm === 'retail') {
        if (hour >= 10 && hour < 14) {
            return 0.14;
        }
        if (hour >= 16 && hour < 20) {
            return 0.18;
        }

        return -0.04;
    }

    if (hour >= 8 && hour < 11) {
        return 0.08;
    }
    if (hour >= 15 && hour < 19) {
        return 0.18;
    }

    return 0;
}

function predictStationWindow(
    station: Station,
    compatibleConnectors: Connector[],
    arrivalTimeMinutes: number
) {
    if (compatibleConnectors.length === 0) {
        return {
            crowdLabel: 'Busy' as TripCrowdLabel,
            availabilityLabel: 'Full' as TripAvailabilityLabel,
            predictedOpenConnectors: 0,
            predictedWaitMinutes: 16,
        };
    }

    const normalizedMinutes = ((arrivalTimeMinutes % 1440) + 1440) % 1440;
    const hour = normalizedMinutes / 60;
    const baseDemand =
        station.occupancyLabel === 'Calm'
            ? 0.28
            : station.occupancyLabel === 'Balanced'
              ? 0.48
              : 0.7;
    const liveBusyRatio =
        compatibleConnectors.filter((connector) => connector.status === 'Busy').length /
        compatibleConnectors.length;
    const rhythmShift = demandShiftForHour(getStationProfile(station.id).rhythm, hour);
    const amenityPull =
        station.amenities.includes('Food Court') || station.amenities.includes('Mall')
            ? 0.05
            : station.amenities.includes('Lounge')
              ? 0.03
              : 0;
    const demand = clamp(
        baseDemand * 0.55 + liveBusyRatio * 0.22 + rhythmShift + amenityPull,
        0.12,
        0.96
    );
    const predictedBusyConnectors = clamp(
        Math.round(demand * compatibleConnectors.length),
        0,
        compatibleConnectors.length
    );
    const predictedOpenConnectors = compatibleConnectors.length - predictedBusyConnectors;
    const predictedWaitMinutes =
        predictedOpenConnectors > 0
            ? Math.max(
                  0,
                  Math.round(
                      compatibleConnectors[0].waitMinutes * 0.45 +
                          (1 - predictedOpenConnectors / compatibleConnectors.length) * 7
                  )
              )
            : Math.max(
                  8,
                  Math.round(
                      compatibleConnectors[0].waitMinutes + 8 + demand * 12
                  )
              );
    const crowdLabel: TripCrowdLabel =
        demand >= 0.72 ? 'Busy' : demand >= 0.45 ? 'Moderate' : 'Light';
    const availabilityLabel: TripAvailabilityLabel =
        predictedOpenConnectors === 0
            ? 'Full'
            : predictedOpenConnectors <= Math.ceil(compatibleConnectors.length / 3)
              ? 'Tight'
              : 'Open';

    return {
        crowdLabel,
        availabilityLabel,
        predictedOpenConnectors,
        predictedWaitMinutes,
    };
}

function estimateElevationImpactPercent(fromAltitudeM: number, toAltitudeM: number) {
    const deltaM = toAltitudeM - fromAltitudeM;

    if (deltaM > 0) {
        return round(clamp(deltaM / 180, 0, 12), 1);
    }

    if (deltaM < 0) {
        return round(clamp(deltaM / 550, -3, 0), 1);
    }

    return 0;
}

function pricingLabelForStation(pricePerKWh: number, routeAveragePrice: number) {
    if (pricePerKWh <= routeAveragePrice - 0.04) {
        return 'Best price';
    }

    if (pricePerKWh <= routeAveragePrice + 0.01) {
        return 'Good price';
    }

    if (pricePerKWh >= routeAveragePrice + 0.08) {
        return 'Peak price';
    }

    return 'Standard price';
}

function summarizeAmenities(amenities: string[]) {
    const topAmenities = amenities.filter(Boolean).slice(0, 2);

    if (topAmenities.length === 0) {
        return 'a reliable break point';
    }

    if (topAmenities.length === 1) {
        return topAmenities[0];
    }

    return `${topAmenities[0]} and ${topAmenities[1]}`;
}

function availabilitySummary(recommendation: TripStationRecommendation) {
    if (recommendation.availabilityLabel === 'Open') {
        return `${recommendation.predictedOpenConnectors}/${recommendation.predictedCompatibleConnectors} chargers should be free`;
    }

    if (recommendation.availabilityLabel === 'Tight') {
        return `you may wait about ${recommendation.predictedWaitMinutes} minutes`;
    }

    return `expect a busier stop with about ${recommendation.predictedWaitMinutes} minutes of waiting`;
}

function batteryBufferSummary(
    recommendation: TripStationRecommendation,
    vehicle: Vehicle
) {
    const arrivalBattery = Math.round(recommendation.arrivalBatteryPercent);

    if (arrivalBattery <= 15) {
        return `This is a good place to charge before the battery gets too low.`;
    }

    if (arrivalBattery <= 25) {
        return 'It catches the battery at a comfortable charge level.';
    }

    return 'It keeps a healthy buffer for the next leg.';
}

function stationReason(
    recommendation: TripStationRecommendation,
    focus: TripFocus,
    vehicle: Vehicle
) {
    const arrivalBattery = Math.round(recommendation.arrivalBatteryPercent);
    const amenitySummary = summarizeAmenities(recommendation.amenityMatches);
    const crowdSummary = recommendation.predictedCrowdLabel.toLowerCase();
    const availability = availabilitySummary(recommendation);
    const batteryBuffer = batteryBufferSummary(recommendation, vehicle);

    if (focus === 'Fastest') {
        return `Arrive around ${recommendation.arrivalTimeLabel} with about ${arrivalBattery}% battery. ${availability}. ${batteryBuffer}`;
    }

    if (focus === 'Budget') {
        return `This is a lower-cost stop at ₹${recommendation.bestPricePerKWh.toFixed(2)}/kWh. You should reach it with about ${arrivalBattery}% battery.`;
    }

    if (focus === 'Family') {
        return `This is an easier family stop with ${amenitySummary}. You should arrive with about ${arrivalBattery}% battery, and it is usually ${crowdSummary} then.`;
    }

    return `This is a comfortable stop with ${amenitySummary}. You should arrive with about ${arrivalBattery}% battery, and ${availability}.`;
}

function baseStationScore(
    recommendation: Omit<TripStationRecommendation, 'score' | 'reason' | 'pricingLabel'> & {
        pricingLabel: string;
    },
    vehicleConnectorType: Vehicle['connectorType'],
    focus: TripFocus
) {
    const exactMatchBonus = recommendation.connector.type === vehicleConnectorType ? 8 : 3;
    const powerScore = Math.min(recommendation.connector.power, 320) / 10;
    const ratingScore = recommendation.station.rating * 4;
    const priceScore = (0.62 - recommendation.bestPricePerKWh) * 90;
    const amenityScore = recommendation.amenityScore * 6;
    const availabilityScore =
        recommendation.predictedOpenConnectors * 7 +
        (recommendation.availabilityLabel === 'Open'
            ? 6
            : recommendation.availabilityLabel === 'Tight'
              ? -2
              : -10);
    const crowdScore =
        recommendation.predictedCrowdLabel === 'Light'
            ? 6
            : recommendation.predictedCrowdLabel === 'Moderate'
              ? 0
              : -8;
    const waitPenalty = recommendation.predictedWaitMinutes * 1.8;
    const detourPenalty = recommendation.detourKm * 2.2;
    const elevationPenalty = Math.max(recommendation.elevationImpactPercent, 0) * 3.5;
    const arrivalBufferScore =
        recommendation.arrivalBatteryPercent >= 30
            ? 12
            : recommendation.arrivalBatteryPercent >= 20
              ? 6
              : recommendation.arrivalBatteryPercent >= 10
                ? -5
                : -18;

    let focusAdjustment = 0;

    if (focus === 'Fastest') {
        focusAdjustment =
            powerScore * 0.9 +
            availabilityScore * 0.7 -
            recommendation.predictedWaitMinutes * 1.3;
    } else if (focus === 'Comfort') {
        focusAdjustment =
            amenityScore * 0.8 +
            crowdScore * 1.2 +
            (recommendation.station.amenities.includes('Lounge') ? 6 : 0);
    } else if (focus === 'Family') {
        focusAdjustment =
            recommendation.amenityMatches.length * 9 +
            (recommendation.station.amenities.includes('Restroom') ? 6 : 0) +
            (recommendation.station.amenities.includes('Food Court') ? 5 : 0);
    } else {
        focusAdjustment = priceScore * 0.8 - recommendation.detourKm * 0.6;
    }

    return round(
        powerScore +
            ratingScore +
            priceScore +
            amenityScore +
            availabilityScore +
            crowdScore +
            arrivalBufferScore +
            exactMatchBonus +
            focusAdjustment -
            waitPenalty -
            detourPenalty -
            elevationPenalty,
        1
    );
}

function buildRecommendations(
    origin: TripLocation,
    destination: TripLocation,
    vehicle: Vehicle,
    focus: TripFocus,
    departureTimeMinutes: number
) {
    const totalDistanceKm = haversineKm(origin, destination);
    const fullRangeKm = estimateFullRangeKm(vehicle);

    const draftRecommendations = MOCK_STATIONS.map((station: Station) => {
        const compatibleConnectors = getCompatibleRouteConnectors(
            station,
            vehicle.connectorType
        );
        const connector = compatibleConnectors[0];

        if (!connector) {
            return null;
        }

        const distanceFromOriginKm = haversineKm(origin, station);
        const distanceToDestinationKm = haversineKm(station, destination);
        const detourKm =
            distanceFromOriginKm + distanceToDestinationKm - totalDistanceKm;
        const progress = clamp(
            distanceFromOriginKm /
                Math.max(distanceFromOriginKm + distanceToDestinationKm, 1),
            0,
            1
        );
        const amenityMatches = amenityMatchesForFocus(station.amenities, focus);
        const amenityScore = amenityScoreForStation(station, amenityMatches);
        const arrivalTimeMinutes =
            departureTimeMinutes + estimateDriveMinutes(distanceFromOriginKm);
        const arrivalTimeLabel = formatClockTime(arrivalTimeMinutes);
        const elevationDeltaM = getStationProfile(station.id).altitudeM - origin.altitudeM;
        const elevationImpactPercent = estimateElevationImpactPercent(
            origin.altitudeM,
            getStationProfile(station.id).altitudeM
        );
        const arrivalBatteryPercent = round(
            clamp(
                vehicle.currentBattery -
                    percentNeededForDistance(distanceFromOriginKm, fullRangeKm) -
                    elevationImpactPercent,
                3,
                100
            )
        );
        const windowPrediction = predictStationWindow(
            station,
            compatibleConnectors,
            arrivalTimeMinutes
        );
        const bestPricePerKWh = Math.min(
            ...compatibleConnectors.map((item) => item.pricePerKWh)
        );

        return {
            station,
            connector,
            detourKm: round(detourKm),
            progress,
            distanceFromOriginKm: round(distanceFromOriginKm),
            distanceToDestinationKm: round(distanceToDestinationKm),
            amenityMatches,
            amenityScore,
            arrivalBatteryPercent,
            arrivalTimeMinutes,
            arrivalTimeLabel,
            elevationDeltaM: round(elevationDeltaM),
            elevationImpactPercent,
            predictedCrowdLabel: windowPrediction.crowdLabel,
            availabilityLabel: windowPrediction.availabilityLabel,
            predictedOpenConnectors: windowPrediction.predictedOpenConnectors,
            predictedCompatibleConnectors: compatibleConnectors.length,
            predictedWaitMinutes: windowPrediction.predictedWaitMinutes,
            bestPricePerKWh,
        };
    }).filter(
        (
            recommendation
        ): recommendation is Omit<
            TripStationRecommendation,
            'score' | 'reason' | 'pricingLabel'
        > => recommendation !== null
    );

    const routeAveragePrice =
        draftRecommendations.reduce(
            (total, recommendation) => total + recommendation.bestPricePerKWh,
            0
        ) / Math.max(draftRecommendations.length, 1);

    return draftRecommendations
        .map((recommendation) => {
            const pricingLabel = pricingLabelForStation(
                recommendation.bestPricePerKWh,
                routeAveragePrice
            );
            const scoredRecommendation: TripStationRecommendation = {
                ...recommendation,
                pricingLabel,
                score: baseStationScore(
                    { ...recommendation, pricingLabel },
                    vehicle.connectorType,
                    focus
                ),
                reason: '',
            };

            return {
                ...scoredRecommendation,
                reason: stationReason(scoredRecommendation, focus, vehicle),
            };
        })
        .sort((left, right) => right.score - left.score);
}

function findOriginTopUp(
    recommendations: TripStationRecommendation[],
    origin: TripLocation
) {
    return recommendations
        .filter(
            (recommendation) =>
                haversineKm(origin, recommendation.station) <= 35 &&
                recommendation.progress <= 0.2
        )
        .sort((left, right) => right.score - left.score)[0];
}

function buildStop(
    recommendation: TripStationRecommendation,
    currentPoint: { latitude: number; longitude: number },
    currentAltitudeM: number,
    currentBatteryPercent: number,
    destination: TripLocation,
    vehicle: Vehicle,
    fullRangeKm: number,
    currentTimeMinutes: number,
    targetArrivalSoc = RESERVE_PERCENT
) {
    const distanceFromPreviousKm = haversineKm(currentPoint, recommendation.station);
    const stationAltitudeM = getStationProfile(recommendation.station.id).altitudeM;
    const driveMinutes = estimateDriveMinutes(distanceFromPreviousKm);
    const arrivalTimeMinutes = currentTimeMinutes + driveMinutes;
    const windowPrediction = predictStationWindow(
        recommendation.station,
        getCompatibleRouteConnectors(recommendation.station, vehicle.connectorType),
        arrivalTimeMinutes
    );
    const elevationImpactPercent = estimateElevationImpactPercent(
        currentAltitudeM,
        stationAltitudeM
    );
    const arrivalBatteryPercent = round(
        clamp(
            currentBatteryPercent -
                percentNeededForDistance(distanceFromPreviousKm, fullRangeKm) -
                elevationImpactPercent,
            4,
            100
        )
    );
    const distanceToDestinationKm = haversineKm(recommendation.station, destination);
    const onwardElevationImpact = Math.max(
        estimateElevationImpactPercent(stationAltitudeM, destination.altitudeM),
        0
    );
    const requiredReserve = Math.max(RESERVE_PERCENT, targetArrivalSoc);
    const targetPercent = clamp(
        Math.max(
            vehicle.chargeTarget,
            percentNeededForDistance(distanceToDestinationKm, fullRangeKm) +
                requiredReserve +
                onwardElevationImpact +
                (distanceToDestinationKm > fullRangeKm * 0.65 ? 10 : 3)
        ),
        Math.min(98, Math.max(arrivalBatteryPercent + 10, 60)),
        98
    );
    const chargeMinutes = estimateChargeMinutes(
        arrivalBatteryPercent,
        targetPercent,
        recommendation.connector.power,
        vehicle.batteryCapacity
    );
    const queueMinutes = windowPrediction.predictedWaitMinutes;
    const departureTimeMinutes = arrivalTimeMinutes + queueMinutes + chargeMinutes;
    const addedEnergyKWh =
        (vehicle.batteryCapacity * (targetPercent - arrivalBatteryPercent)) / 100;

    return {
        ...recommendation,
        distanceFromPreviousKm: round(distanceFromPreviousKm),
        arrivalBatteryPercent,
        arrivalTimeMinutes,
        arrivalTimeLabel: formatClockTime(arrivalTimeMinutes),
        departureBatteryPercent: round(targetPercent),
        chargeMinutes,
        queueMinutes,
        totalStopMinutes: chargeMinutes + queueMinutes,
        departureTimeMinutes,
        departureTimeLabel: formatClockTime(departureTimeMinutes),
        addedEnergyKWh: round(addedEnergyKWh),
        chargeCost: round(addedEnergyKWh * recommendation.connector.pricePerKWh, 2),
        elevationDeltaM: round(stationAltitudeM - currentAltitudeM),
        elevationImpactPercent,
        predictedCrowdLabel: windowPrediction.crowdLabel,
        availabilityLabel: windowPrediction.availabilityLabel,
        predictedOpenConnectors: windowPrediction.predictedOpenConnectors,
        predictedWaitMinutes: queueMinutes,
    };
}

function buildSummary(
    origin: TripLocation,
    destination: TripLocation,
    focus: TripFocus,
    stops: TripStop[],
    departureTimeLabel: string,
    arrivalTimeLabel: string,
    arrivalBatteryPercent: number,
    needsPreTripTopUp: boolean
) {
    const focusLabel = TRIP_FOCUS_OPTIONS.find((option) => option.value === focus)?.label;

    if (stops.length === 0) {
        return `${focusLabel}: leave ${origin.label} at ${departureTimeLabel} and reach ${destination.label} around ${arrivalTimeLabel} with about ${arrivalBatteryPercent}% battery remaining.`;
    }

    if (needsPreTripTopUp) {
        return `${focusLabel}: quick top-up recommended near departure, then ${stops.length} charging stop${stops.length === 1 ? '' : 's'} on the way to ${destination.label} for a ${arrivalTimeLabel} arrival.`;
    }

    if (stops.length >= 2) {
        return `${focusLabel}: ${stops.length} smart stops (first at ${stops[0].station.name} for ${stops[0].chargeMinutes} min) to ensure arrival at ${destination.label} by ${arrivalTimeLabel} with optimal SoC.`;
    }

    return `${focusLabel}: single stop at ${stops[0].station.name} (${stops[0].arrivalTimeLabel}), arriving in ${destination.label} by ${arrivalTimeLabel} with ${arrivalBatteryPercent}% battery.`;
}

function buildChecklist(
    vehicle: Vehicle,
    destination: TripLocation,
    stops: TripStop[],
    departureTimeLabel: string,
    arrivalBatteryPercent: number
) {
    const checklist = [
        `Leave around ${departureTimeLabel} with ${vehicle.currentBattery}% battery and keep a ${RESERVE_PERCENT}% reserve.`,
        `Use ${vehicle.connectorType} compatible chargers and target ${vehicle.chargeTarget}% on the main stop.`,
        `Aim to reach ${destination.label} with about ${arrivalBatteryPercent}% so you can reroute if the last station is crowded.`,
    ];

    if (stops[0]) {
        checklist.push(
            `Main stop window: ${stops[0].station.name} at ${stops[0].arrivalTimeLabel} when it is usually ${stops[0].predictedCrowdLabel.toLowerCase()}.`
        );
    }

    if (stops[1]) {
        checklist.push('Keep the second stop as a fallback if weather or traffic reduces range.');
    }

    return checklist;
}

export function createTripPlan(options: {
    originId: TripLocation['id'];
    destinationId: TripLocation['id'];
    vehicle: Vehicle;
    focus: TripFocus;
    departureTimeMinutes?: number;
    targetArrivalSoc?: number;
}) {
    const origin = getTripLocationById(options.originId) ?? TRIP_LOCATIONS[0];
    const destination =
        getTripLocationById(options.destinationId) ?? TRIP_LOCATIONS[TRIP_LOCATIONS.length - 1];
    const departureTimeMinutes = options.departureTimeMinutes ?? 10 * 60;
    const departureTimeLabel = formatClockTime(departureTimeMinutes);
    const fullRangeKm = estimateFullRangeKm(options.vehicle);
    const totalDistanceKm = haversineKm(origin, destination);
    const driveMinutes = estimateDriveMinutes(totalDistanceKm);
    const tripElevationImpact = Math.max(
        estimateElevationImpactPercent(origin.altitudeM, destination.altitudeM),
        0
    );
    const energyNeededKWh = round(
        totalDistanceKm * (options.vehicle.batteryCapacity / fullRangeKm) +
            (options.vehicle.batteryCapacity * tripElevationImpact) / 100,
        1
    );
    const recommendations = buildRecommendations(
        origin,
        destination,
        options.vehicle,
        options.focus,
        departureTimeMinutes
    );
    const alongRouteRecommendations = recommendations.filter(
        (recommendation: TripStationRecommendation) =>
            recommendation.detourKm <= NEAR_ROUTE_DETOUR_LIMIT_KM &&
            recommendation.progress >= 0.05 &&
            recommendation.progress <= 0.95
    );

    const stops: TripStop[] = [];
    const usedStationIds = new Set<string>();
    let currentBatteryPercent = options.vehicle.currentBattery;
    let currentPoint: { latitude: number; longitude: number } = origin;
    let currentAltitudeM = origin.altitudeM;
    let currentProgress = 0;
    let currentTimeMinutes = departureTimeMinutes;
    let remainingDistanceKm = totalDistanceKm;
    let needsPreTripTopUp = false;
    let guard = 0;
    const effectiveArrivalReserve = Math.max(RESERVE_PERCENT, options.targetArrivalSoc ?? RESERVE_PERCENT);

    while (
        remainingDistanceKm > usableDistanceKm(fullRangeKm, currentBatteryPercent, effectiveArrivalReserve) &&
        guard < 3
    ) {
        guard += 1;

        const currentReachKm = usableDistanceKm(fullRangeKm, currentBatteryPercent, RESERVE_PERCENT);
        const reachableCandidates = alongRouteRecommendations
            .filter(
                (recommendation: TripStationRecommendation) =>
                    !usedStationIds.has(recommendation.station.id) &&
                    recommendation.progress > currentProgress &&
                    haversineKm(currentPoint, recommendation.station) <= currentReachKm &&
                    haversineKm(currentPoint, recommendation.station) >= MIN_STOP_GAP_KM
            )
            .sort((left, right) => {
                const leftLegDistance = haversineKm(currentPoint, left.station);
                const rightLegDistance = haversineKm(currentPoint, right.station);
                const leftLegFit = 1 - Math.abs(leftLegDistance / Math.max(currentReachKm, 1) - 0.78);
                const rightLegFit = 1 - Math.abs(rightLegDistance / Math.max(currentReachKm, 1) - 0.78);

                // Priority to stations with better pricing and amenities if focus matches
                return (
                    right.score +
                    rightLegFit * 28 +
                    (right.pricingLabel === 'Best price' ? 6 : 0) -
                    (left.score + leftLegFit * 28 + (left.pricingLabel === 'Best price' ? 6 : 0))
                );
            });

        const chosenRecommendation =
            reachableCandidates[0] ??
            (stops.length === 0 ? findOriginTopUp(recommendations, origin) : undefined);

        if (!chosenRecommendation) {
            break;
        }

        const stop = buildStop(
            chosenRecommendation,
            currentPoint,
            currentAltitudeM,
            currentBatteryPercent,
            destination,
            options.vehicle,
            fullRangeKm,
            currentTimeMinutes,
            effectiveArrivalReserve
        );

        if (stops.length === 0 && stop.distanceFromPreviousKm < MIN_STOP_GAP_KM) {
            needsPreTripTopUp = true;
        }

        stops.push(stop);
        usedStationIds.add(stop.station.id);
        currentPoint = stop.station;
        currentAltitudeM = getStationProfile(stop.station.id).altitudeM;
        currentBatteryPercent = stop.departureBatteryPercent;
        currentProgress = Math.max(currentProgress, stop.progress);
        currentTimeMinutes = stop.departureTimeMinutes;
        remainingDistanceKm = haversineKm(currentPoint, destination);
    }

    const finalLegElevationImpact = estimateElevationImpactPercent(
        currentAltitudeM,
        destination.altitudeM
    );
    const arrivalBatteryPercent = round(
        clamp(
            currentBatteryPercent -
                percentNeededForDistance(remainingDistanceKm, fullRangeKm) -
                finalLegElevationImpact,
            2,
            100
        )
    );
    const arrivalTimeMinutes = currentTimeMinutes + estimateDriveMinutes(remainingDistanceKm);
    const arrivalTimeLabel = formatClockTime(arrivalTimeMinutes);
    const backupStations = recommendations
        .filter(
            (recommendation) =>
                !usedStationIds.has(recommendation.station.id) &&
                recommendation.detourKm <= 24 &&
                (stops[0]
                    ? haversineKm(stops[0].station, recommendation.station) <= 40
                    : recommendation.distanceToDestinationKm <= 40)
        )
        .slice(0, 3);
    const destinationStations = recommendations
        .filter(
            (recommendation: TripStationRecommendation) =>
                recommendation.distanceToDestinationKm <= 35
        )
        .slice(0, 3)
        .map((recommendation) => {
            const compatibleConnectors = getCompatibleRouteConnectors(
                recommendation.station,
                options.vehicle.connectorType
            );
            const windowPrediction = predictStationWindow(
                recommendation.station,
                compatibleConnectors,
                arrivalTimeMinutes
            );
            const destinationRecommendation: TripStationRecommendation = {
                ...recommendation,
                arrivalTimeMinutes,
                arrivalTimeLabel,
                arrivalBatteryPercent,
                predictedCrowdLabel: windowPrediction.crowdLabel,
                availabilityLabel: windowPrediction.availabilityLabel,
                predictedOpenConnectors: windowPrediction.predictedOpenConnectors,
                predictedCompatibleConnectors: compatibleConnectors.length,
                predictedWaitMinutes: windowPrediction.predictedWaitMinutes,
                reason: recommendation.reason,
            };

            return {
                ...destinationRecommendation,
                reason: stationReason(destinationRecommendation, options.focus, options.vehicle),
            };
        });
    const routeCoordinates = interpolateRouteCoordinates([
        origin,
        ...stops.map((stop) => stop.station),
        destination,
    ]);

    const combinedRecommended = [
        ...alongRouteRecommendations,
        ...recommendations.filter(
            (r) => !alongRouteRecommendations.some((a) => a.station.id === r.station.id)
        ),
    ]
        .slice(0, 8)
        .sort((a, b) => a.distanceFromOriginKm - b.distanceFromOriginKm);

    // Calculate overall elevation metrics
    const netElevationDeltaM = destination.altitudeM - origin.altitudeM;
    let totalElevationGainM = 0;
    let totalElevationLossM = 0;

    let previousAlt = origin.altitudeM;
    stops.forEach((stop) => {
        const stopAlt = getStationProfile(stop.station.id).altitudeM;
        const diff = stopAlt - previousAlt;
        if (diff > 0) totalElevationGainM += diff;
        else totalElevationLossM += Math.abs(diff);
        previousAlt = stopAlt;
    });
    const finalLegDiff = destination.altitudeM - previousAlt;
    if (finalLegDiff > 0) totalElevationGainM += finalLegDiff;
    else totalElevationLossM += Math.abs(finalLegDiff);

    // Build key elevation milestones for the chart
    const elevationWaypoints: ElevationWaypoint[] = [
        {
            id: 'origin',
            label: origin.label,
            distanceKm: 0,
            altitudeM: origin.altitudeM,
            batteryPercent: options.vehicle.currentBattery,
            type: 'start',
        },
        ...stops.map((stop) => ({
            id: stop.station.id,
            label: stop.station.name,
            distanceKm: round(stop.distanceFromOriginKm),
            altitudeM: getStationProfile(stop.station.id).altitudeM,
            batteryPercent: stop.arrivalBatteryPercent,
            type: 'stop' as const,
        })),
        {
            id: 'destination',
            label: destination.label,
            distanceKm: round(totalDistanceKm),
            altitudeM: destination.altitudeM,
            batteryPercent: arrivalBatteryPercent,
            type: 'destination',
        },
    ];

    return {
        origin,
        destination,
        focus: options.focus,
        totalDistanceKm: round(totalDistanceKm),
        driveMinutes,
        departureTimeMinutes,
        departureTimeLabel,
        arrivalTimeMinutes,
        arrivalTimeLabel,
        energyNeededKWh,
        fullRangeKm,
        stops,
        recommendedStations: combinedRecommended,
        backupStations,
        destinationStations,
        arrivalBatteryPercent,
        reservePercent: RESERVE_PERCENT,
        routeCoordinates,
        summary: buildSummary(
            origin,
            destination,
            options.focus,
            stops,
            departureTimeLabel,
            arrivalTimeLabel,
            arrivalBatteryPercent,
            needsPreTripTopUp
        ),
        checklist: buildChecklist(
            options.vehicle,
            destination,
            stops,
            departureTimeLabel,
            arrivalBatteryPercent
        ),
        needsPreTripTopUp,
        totalElevationGainM: Math.round(totalElevationGainM),
        totalElevationLossM: Math.round(totalElevationLossM),
        netElevationDeltaM: Math.round(netElevationDeltaM),
        totalElevationImpactPercent: round(tripElevationImpact, 1),
        elevationWaypoints,
    };
}
