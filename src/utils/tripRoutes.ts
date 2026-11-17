import { TripLocation, TripStop, interpolateRouteCoordinates } from '../constants/TripPlanner';

// Route corridor helpers (moved from the trip planner screen unchanged)
export function getRouteCorridorNames(originId: string, destinationId: string): [string, string, string] {
    const key = `${originId}-${destinationId}`;
    const reverseKey = `${destinationId}-${originId}`;

    const CORRIDOR_MAP: Record<string, [string, string, string]> = {
        'coimbatore-bengaluru': [
            'Via NH 44 (Salem Expressway)',
            'Via NH 948 (Chamarajanagar)',
            'Via Erode & Dharmapuri',
        ],
        'coimbatore-ooty': [
            'Via NH 181 (Mettupalayam Ghat)',
            'Via Kotagiri Pass',
            'Via Coonoor Heritage Corridor',
        ],
        'coimbatore-chennai': [
            'Via NH 544 & NH 48 (Salem-Vellore)',
            'Via Ulundurpet & Tindivanam (NH 79)',
            'Via Villupuram & GST Corridor',
        ],
        'bengaluru-chennai': [
            'Via NH 48 (Hosur & Vellore)',
            'Via Chittoor & Ranipet Expressway',
            'Via Kolar & Palamaner Highway',
        ],
        'mumbai-pune': [
            'Via Mumbai-Pune Expressway',
            'Via Old NH 48 (Khandala Ghat)',
            'Via Atal Setu & Panvel Bypass',
        ],
        'delhi-jaipur': [
            'Via Delhi-Mumbai Expressway (NE 4)',
            'Via NH 48 (Neemrana Corridor)',
            'Via Alwar & Dausa Bypass',
        ],
        'bengaluru-hyderabad': [
            'Via NH 44 (Anantapur & Kurnool)',
            'Via Gooty & Mahbubnagar',
            'Via Kadapa & Nandyal',
        ],
    };

    if (CORRIDOR_MAP[key]) return CORRIDOR_MAP[key];
    if (CORRIDOR_MAP[reverseKey]) return CORRIDOR_MAP[reverseKey];

    return [
        'Via Primary Highway',
        'Via State Highway Corridor',
        'Via Ring Bypass',
    ];
}

export function buildRouteOptionCoordinates(
    origin: TripLocation,
    destination: TripLocation,
    stops: TripStop[],
    variant: 'fastest' | 'scenic' | 'eco'
): Array<{ latitude: number; longitude: number }> {
    if (variant === 'fastest') {
        return interpolateRouteCoordinates([
            origin,
            ...stops.map((s) => s.station),
            destination,
        ]);
    }

    const dLat = destination.latitude - origin.latitude;
    const dLon = destination.longitude - origin.longitude;
    const len = Math.sqrt(dLat * dLat + dLon * dLon) || 1;

    // Perpendicular unit vector
    const pLat = -dLon / len;
    const pLon = dLat / len;

    const offsetMagnitude = variant === 'scenic' ? 0.22 : -0.16;

    const quarterPoint = {
        latitude: origin.latitude + dLat * 0.32 + pLat * (offsetMagnitude * 0.8),
        longitude: origin.longitude + dLon * 0.32 + pLon * (offsetMagnitude * 0.8),
    };
    const threeQuarterPoint = {
        latitude: origin.latitude + dLat * 0.68 + pLat * (offsetMagnitude * 0.6),
        longitude: origin.longitude + dLon * 0.68 + pLon * (offsetMagnitude * 0.6),
    };

    return interpolateRouteCoordinates([
        origin,
        quarterPoint,
        ...stops.slice(0, 1).map((s) => s.station),
        threeQuarterPoint,
        destination,
    ]);
}

