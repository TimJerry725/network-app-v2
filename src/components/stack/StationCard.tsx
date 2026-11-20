import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Heart, Navigation } from '../sf/icons';
import { ThemedText } from '../ThemedText';
import { Connector, Station } from '../../constants/Stations';
import { FONT_FAMILIES } from '../../constants/Tokens';
import { allInPrice, formatAgo, isStatusFresh, statusAgeSeconds } from '../../utils/pulse';
import { Ccs2Icon } from '../Ccs2Icon';
import { Type2Icon } from '../Type2Icon';
import { ChademoIcon } from '../ChademoIcon';
import { Zap } from '../sf/icons';
import { CardField, CardSkin, SkinCard, SKINS, stackStyles } from './StackKit';
import { Sticker } from '../pulse/PulseKit';

export function ConnectorIcon({ type, size = 18, color }: { type: Connector['type']; size?: number; color: string }) {
    if (type === 'CCS2') return <Ccs2Icon size={size} color={color} />;
    if (type === 'Type 2') return <Type2Icon size={size} color={color} />;
    if (type === 'CHAdeMO') return <ChademoIcon size={size} color={color} />;
    return <Zap size={size} color={color} />;
}

export function stationSkin(station: Station): CardSkin {
    const free = station.connectors.filter((c) => c.status === 'Available').length;
    if (free === 0) return 'ink';
    const best = [...station.connectors].sort((a, b) => b.power - a.power)[0];
    if (!best) return 'violet';
    if (best.type === 'CCS2') return 'aurora';
    if (best.type === 'Type 2') return 'sky';
    if (best.type === 'CHAdeMO') return 'sun';
    return 'violet';
}

/** Group connectors by type for the compact "plug row". */
function plugSummary(station: Station) {
    const map = new Map<Connector['type'], { power: number; free: number; total: number }>();
    station.connectors.forEach((c) => {
        const cur = map.get(c.type) ?? { power: 0, free: 0, total: 0 };
        map.set(c.type, {
            power: Math.max(cur.power, c.power),
            free: cur.free + (c.status === 'Available' ? 1 : 0),
            total: cur.total + 1,
        });
    });
    return Array.from(map.entries());
}

export function StationCard({
    station,
    onPress,
    isFavorite,
    compact,
    vehicleConnector,
}: {
    station: Station;
    onPress?: () => void;
    isFavorite?: boolean;
    compact?: boolean;
    vehicleConnector?: Connector['type'];
}) {
    const skin = stationSkin(station);
    const s = SKINS[skin];
    const free = station.connectors.filter((c) => c.status === 'Available').length;
    const minPrice = Math.min(...station.connectors.map((c) => c.pricePerKWh));
    const age = statusAgeSeconds(station.id);
    const fresh = isStatusFresh(age);
    const fits = vehicleConnector ? station.connectors.some((c) => c.type === vehicleConnector) : true;

    return (
        <SkinCard skin={skin} onPress={onPress} accessibilityLabel={`${station.name}, ${free} free`}>
            <View style={stackStyles.cardPad}>
                <View style={stackStyles.cardTopRow}>
                    <View style={styles.row}>
                        <Sticker
                            label={free > 0 ? `${free} FREE` : 'ALL BUSY'}
                            bg={free > 0 ? '#0B0B0F' : '#FF9500'}
                            fg={free > 0 ? '#007AFF' : '#0B0B0F'}
                            tilt={-3}
                        />
                        {!fits ? <Sticker label="NOT FOR YOUR CAR" bg="#FF3B30" fg="#FFFFFF" tilt={2} /> : null}
                    </View>
                    <View style={styles.row}>
                        {isFavorite ? <Heart size={16} color={s.fg} fill={s.fg} /> : null}
                    </View>
                </View>

                <ThemedText style={[stackStyles.cardTitle, { color: s.fg, marginTop: 16 }]} numberOfLines={compact ? 1 : 2}>
                    {station.name}
                </ThemedText>
                <ThemedText style={[stackStyles.cardSub, { color: s.sub }]} numberOfLines={1}>
                    {station.address}
                </ThemedText>

                {!compact ? (
                    <View style={styles.plugs}>
                        {plugSummary(station).map(([type, info]) => (
                            <View key={type} style={[styles.plug, { backgroundColor: s.line }]}>
                                <ConnectorIcon type={type} size={15} color={s.fg} />
                                <ThemedText style={[styles.plugText, { color: s.fg }]}>
                                    {type} · {info.power}kW · {info.free}/{info.total}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                ) : null}

                <View style={stackStyles.cardBottomRow}>
                    <CardField label="All-in price" value={`₹${allInPrice(minPrice).toFixed(0)}/kWh`} fg={s.fg} sub={s.sub} />
                    <CardField label="Distance" value={`${station.distanceKm} km`} fg={s.fg} sub={s.sub} />
                    <View style={{ alignItems: 'flex-end' }}>
                        <View style={styles.row}>
                            <View style={[styles.freshDot, { backgroundColor: fresh ? '#007AFF' : '#FF9500' }]} />
                            <ThemedText style={[styles.fresh, { color: s.sub }]}>{formatAgo(age)}</ThemedText>
                        </View>
                        <View style={[styles.row, { marginTop: 4 }]}>
                            <Navigation size={11} color={s.sub} />
                            <ThemedText style={[styles.fresh, { color: s.sub }]}>{station.etaMinutes} min</ThemedText>
                        </View>
                    </View>
                </View>
            </View>
        </SkinCard>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    arrow: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    plugs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    plug: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    plugText: { fontFamily: FONT_FAMILIES.bold, fontSize: 11.5 },
    freshDot: { width: 7, height: 7, borderRadius: 4 },
    fresh: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 11 },
});
