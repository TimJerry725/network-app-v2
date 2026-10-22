const GOOGLE_MAPS_GEOCODE_URL =
    'https://maps.googleapis.com/maps/api/geocode/json';
const GOOGLE_MAPS_ELEVATION_URL =
    'https://maps.googleapis.com/maps/api/elevation/json';
const GOOGLE_MAPS_ROUTES_URL =
    'https://routes.googleapis.com/directions/v2:computeRoutes';
const GOOGLE_WEATHER_HOURLY_URL =
    'https://weather.googleapis.com/v1/forecast/hours:lookup';

const GOOGLE_MAPS_API_KEY =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    'AIzaSyBwqLIWDCYD1eeQIbS9olF8ad87eU9cGoI';

type GoogleGeocodeResponse = {
    results?: Array<{
        formatted_address?: string;
    }>;
    status?: string;
};

type GoogleElevationResponse = {
    results?: Array<{
        elevation: number;
        location: { lat: number; lng: number };
        resolution: number;
    }>;
    status?: string;
};

type GoogleRoutesResponse = {
    routes?: Array<{
        duration?: string;
        staticDuration?: string;
        distanceMeters?: number;
    }>;
};

type GoogleWeatherForecastResponse = {
    forecastHours?: GoogleForecastHour[];
    nextPageToken?: string;
};

type GoogleForecastHour = {
    interval?: {
        startTime?: string;
        endTime?: string;
    };
    weatherCondition?: {
        description?: {
            text?: string;
        };
        type?: string;
        iconBaseUri?: string;
    };
    temperature?: {
        degrees?: number;
        unit?: string;
    };
    feelsLikeTemperature?: {
        degrees?: number;
        unit?: string;
    };
    precipitation?: {
        probability?: {
            percent?: number;
            type?: string;
        };
    };
    isDaytime?: boolean;
};

export type RouteTrafficSummary = {
    durationMinutes: number;
    staticDurationMinutes: number;
    trafficDelayMinutes: number;
    trafficLevel: 'Light' | 'Moderate' | 'Heavy';
};

export type HourlyWeatherSummary = {
    startTime: string | null;
    description: string | null;
    conditionType: string | null;
    temperatureC: number | null;
    feelsLikeC: number | null;
    precipitationChance: number | null;
    isDaytime: boolean | null;
};

export function hasGoogleMapsGeocodeKey() {
    return Boolean(GOOGLE_MAPS_API_KEY);
}

export function getGoogleMapsApiKey() {
    return GOOGLE_MAPS_API_KEY ?? null;
}

function parseDurationSeconds(duration: string | undefined) {
    if (!duration) {
        return 0;
    }

    const normalizedDuration = duration.trim();

    if (!normalizedDuration.endsWith('s')) {
        return 0;
    }

    return Number.parseFloat(normalizedDuration.slice(0, -1)) || 0;
}

function resolveTrafficLevel(delayMinutes: number): RouteTrafficSummary['trafficLevel'] {
    if (delayMinutes <= 3) {
        return 'Light';
    }

    if (delayMinutes <= 10) {
        return 'Moderate';
    }

    return 'Heavy';
}

function buildForecastLookupUrl(
    latitude: number,
    longitude: number,
    pageToken?: string
) {
    const params = new URLSearchParams({
        key: GOOGLE_MAPS_API_KEY ?? '',
        'location.latitude': latitude.toString(),
        'location.longitude': longitude.toString(),
        unitsSystem: 'METRIC',
        hours: '72',
        pageSize: '24',
        languageCode: 'en',
    });

    if (pageToken) {
        params.set('pageToken', pageToken);
    }

    return `${GOOGLE_WEATHER_HOURLY_URL}?${params.toString()}`;
}

function toHourlyWeatherSummary(forecastHour: GoogleForecastHour): HourlyWeatherSummary {
    return {
        startTime: forecastHour.interval?.startTime ?? null,
        description: forecastHour.weatherCondition?.description?.text ?? null,
        conditionType: forecastHour.weatherCondition?.type ?? null,
        temperatureC:
            typeof forecastHour.temperature?.degrees === 'number'
                ? forecastHour.temperature.degrees
                : null,
        feelsLikeC:
            typeof forecastHour.feelsLikeTemperature?.degrees === 'number'
                ? forecastHour.feelsLikeTemperature.degrees
                : null,
        precipitationChance:
            typeof forecastHour.precipitation?.probability?.percent === 'number'
                ? forecastHour.precipitation.probability.percent
                : null,
        isDaytime:
            typeof forecastHour.isDaytime === 'boolean'
                ? forecastHour.isDaytime
                : null,
    };
}

/**
 * Perform reverse geocoding using the Google Maps Geocoding API.
 */
export async function reverseGeocodeLocation(
    latitude: number,
    longitude: number
) {
    if (!GOOGLE_MAPS_API_KEY) {
        return null;
    }

    const geocodeUrl = `${GOOGLE_MAPS_GEOCODE_URL}?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    
    try {
        const response = await fetch(geocodeUrl);

        if (!response.ok) {
            throw new Error(`Google geocode request failed with ${response.status}`);
        }

        const payload = (await response.json()) as GoogleGeocodeResponse;

        if (payload.status !== 'OK' || !payload.results?.length) {
            return null;
        }

        return payload.results[0]?.formatted_address ?? null;
    } catch (error) {
        console.error('Reverse Geocoding Error:', error);
        return null;
    }
}

/**
 * Fetch elevation samples for a path of coordinates.
 */
export async function getElevationForPath(
    path: Array<{ latitude: number; longitude: number }>,
    samples: number = 60
) {
    if (!GOOGLE_MAPS_API_KEY || path.length < 2) {
        return null;
    }

    const pathString = path
        .map((coord) => `${coord.latitude},${coord.longitude}`)
        .join('|');

    const elevationUrl = `${GOOGLE_MAPS_ELEVATION_URL}?path=${encodeURIComponent(
        pathString
    )}&samples=${samples}&key=${GOOGLE_MAPS_API_KEY}`;

    try {
        const response = await fetch(elevationUrl);

        if (!response.ok) {
            throw new Error(`Google elevation request failed with ${response.status}`);
        }

        const payload = (await response.json()) as GoogleElevationResponse;

        if (payload.status !== 'OK' || !payload.results?.length) {
            return null;
        }

        return payload.results.map((result) => result.elevation);
    } catch (error) {
        console.error('Elevation API Error:', error);
        return null;
    }
}

export async function getTrafficSummaryForRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    departureTime: string
) {
    if (!GOOGLE_MAPS_API_KEY) {
        return null;
    }

    try {
        const response = await fetch(GOOGLE_MAPS_ROUTES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'routes.duration,routes.staticDuration,routes.distanceMeters',
            },
            body: JSON.stringify({
                origin: {
                    location: {
                        latLng: {
                            latitude: origin.latitude,
                            longitude: origin.longitude,
                        },
                    },
                },
                destination: {
                    location: {
                        latLng: {
                            latitude: destination.latitude,
                            longitude: destination.longitude,
                        },
                    },
                },
                travelMode: 'DRIVE',
                routingPreference: 'TRAFFIC_AWARE',
                departureTime,
                languageCode: 'en-GB',
                units: 'METRIC',
            }),
        });

        if (!response.ok) {
            throw new Error(`Google routes request failed with ${response.status}`);
        }

        const payload = (await response.json()) as GoogleRoutesResponse;
        const route = payload.routes?.[0];

        if (!route) {
            return null;
        }

        const durationMinutes = Math.round(parseDurationSeconds(route.duration) / 60);
        const staticDurationMinutes = Math.round(
            parseDurationSeconds(route.staticDuration) / 60
        );
        const trafficDelayMinutes = Math.max(
            0,
            durationMinutes - staticDurationMinutes
        );

        return {
            durationMinutes,
            staticDurationMinutes,
            trafficDelayMinutes,
            trafficLevel: resolveTrafficLevel(trafficDelayMinutes),
        } satisfies RouteTrafficSummary;
    } catch (error) {
        console.error('Routes API Error:', error);
        return null;
    }
}

export async function getHourlyWeatherForTime(
    latitude: number,
    longitude: number,
    targetTime: string
) {
    if (!GOOGLE_MAPS_API_KEY) {
        return null;
    }

    const targetTimestamp = new Date(targetTime).getTime();

    if (Number.isNaN(targetTimestamp)) {
        return null;
    }

    let pageToken: string | undefined;
    let closestForecast: GoogleForecastHour | null = null;
    let closestDiff = Number.POSITIVE_INFINITY;
    let pageCount = 0;

    try {
        while (pageCount < 6) {
            pageCount += 1;
            const response = await fetch(
                buildForecastLookupUrl(latitude, longitude, pageToken)
            );

            if (!response.ok) {
                throw new Error(`Google weather request failed with ${response.status}`);
            }

            const payload = (await response.json()) as GoogleWeatherForecastResponse;
            const forecastHours = payload.forecastHours ?? [];

            for (const forecastHour of forecastHours) {
                const forecastTimestamp = forecastHour.interval?.startTime
                    ? new Date(forecastHour.interval.startTime).getTime()
                    : Number.NaN;

                if (Number.isNaN(forecastTimestamp)) {
                    continue;
                }

                const diff = Math.abs(forecastTimestamp - targetTimestamp);

                if (diff < closestDiff) {
                    closestDiff = diff;
                    closestForecast = forecastHour;
                }
            }

            const lastForecastTimestamp = forecastHours.at(-1)?.interval?.startTime
                ? new Date(forecastHours[forecastHours.length - 1].interval!.startTime!).getTime()
                : Number.NaN;

            if (
                !payload.nextPageToken ||
                !Number.isFinite(lastForecastTimestamp) ||
                lastForecastTimestamp >= targetTimestamp
            ) {
                break;
            }

            pageToken = payload.nextPageToken;
        }

        return closestForecast ? toHourlyWeatherSummary(closestForecast) : null;
    } catch (error) {
        console.error('Weather API Error:', error);
        return null;
    }
}
