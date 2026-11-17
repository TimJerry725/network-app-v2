/**
 * Pulse style helpers for the data users told us they need to see
 * (live status freshness, all-in price, wallet holds).
 */

export const GST_RATE = 0.18;

/** Price per kWh including 18% GST, so the number on screen is the number on the bill. */
export function allInPrice(pricePerKWh: number) {
    return Number((pricePerKWh * (1 + GST_RATE)).toFixed(2));
}

export function formatRupees(value: number, decimals = 0) {
    return `₹${value.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })}`;
}

/**
 * Seconds since the station last reported status.
 * Mock data has no timestamp, so we derive a stable value from the station id.
 * Replace with the CPO feed's `last_updated` once the API exposes it.
 */
export function statusAgeSeconds(stationId: string) {
    let hash = 0;
    for (let i = 0; i < stationId.length; i += 1) {
        hash = (hash * 31 + stationId.charCodeAt(i)) % 997;
    }
    return 12 + (hash % 170);
}

export function formatAgo(seconds: number) {
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
}

/** Fresh = under 2 minutes. Older status is shown with a softer, "check" tone. */
export function isStatusFresh(seconds: number) {
    return seconds < 120;
}

/** Pre-authorised amount held while a session runs (never less than ₹300). */
export function sessionHoldAmount(totalCostSoFar: number) {
    return Math.max(300, Math.ceil((totalCostSoFar * 1.5) / 50) * 50);
}

/** Plain-language explanation for each session state, so users know who or what stopped a charge. */
export function explainSessionStatus(status: string): { title: string; detail: string; tone: 'ok' | 'wait' | 'stop' } {
    switch (status) {
        case 'CONNECTING':
            return { title: 'Talking to the charger', detail: 'Keep the gun plugged in. This takes up to 30 seconds.', tone: 'wait' };
        case 'PREPARATION':
            return { title: 'Car and charger are handshaking', detail: 'Power starts as soon as your car accepts it.', tone: 'wait' };
        case 'CHARGING':
            return { title: 'Charging', detail: 'You only pay for energy delivered. Stop anytime.', tone: 'ok' };
        case 'SUSPENDED':
            return { title: 'Paused by your car', detail: 'Your car paused power (battery temperature or schedule). You are not billed while paused.', tone: 'wait' };
        case 'FINISHING':
            return { title: 'Wrapping up', detail: 'Unlocking the connector and finalising your bill.', tone: 'wait' };
        case 'COMPLETED':
            return { title: 'Target reached', detail: 'Your car hit its charge target. Unplug within the grace period to avoid idle fees.', tone: 'ok' };
        case 'STOPPED':
            return { title: 'Session stopped', detail: 'If you did not stop it, the charger reported a fault. Any unused hold is refunded automatically.', tone: 'stop' };
        default:
            return { title: status, detail: '', tone: 'wait' };
    }
}
