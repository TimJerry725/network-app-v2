import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BENTO, BentoTone } from '../../constants/Colors';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ThemedText } from '../ThemedText';

/** Neo-bento building blocks: pastel tiles, eyebrow labels, big numbers, small pills. */

export function useBento(tone: BentoTone) {
    const { isDark } = useAppTheme();
    return (isDark ? BENTO.dark : BENTO.light)[tone];
}

export function Tile({
    tone = 'white',
    children,
    style,
    onPress,
    label,
    padded = true,
}: {
    tone?: BentoTone;
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    label?: string;
    padded?: boolean;
}) {
    const t = useBento(tone);
    const base = [styles.tile, padded && styles.pad, { backgroundColor: t.bg }, style];
    if (!onPress) return <View style={base}>{children}</View>;
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onPress();
            }}
            style={({ pressed }) => [...base, pressed && { transform: [{ scale: 0.985 }], opacity: 0.95 }]}
        >
            {children}
        </Pressable>
    );
}

/** Tiny label above a number or title ("NEAREST FAST CHARGER"). */
export function Eyebrow({ children, tone = 'white', style }: { children: React.ReactNode; tone?: BentoTone; style?: StyleProp<ViewStyle> }) {
    const t = useBento(tone);
    return <ThemedText style={[styles.eyebrow, { color: t.sub }, style as any]}>{children}</ThemedText>;
}

export function BigNumber({ children, unit, tone = 'white', size = 44 }: { children: React.ReactNode; unit?: string; tone?: BentoTone; size?: number }) {
    const t = useBento(tone);
    return (
        <View style={styles.bigRow}>
            <ThemedText style={{ color: t.fg, fontSize: size, lineHeight: size * 1.1, fontWeight: '800', letterSpacing: -1 }} numberOfLines={1} adjustsFontSizeToFit>
                {children}
            </ThemedText>
            {unit ? <ThemedText style={{ color: t.fg, fontSize: 17, fontWeight: '700', marginBottom: 6, marginLeft: 4 }}>{unit}</ThemedText> : null}
        </View>
    );
}

/** Round icon chip that sits in a tile corner. */
export function IconDot({ children, tone = 'white', size = 44 }: { children: React.ReactNode; tone?: BentoTone; size?: number }) {
    const t = useBento(tone);
    return <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: t.chip }]}>{children}</View>;
}

export function Pill({ children, tone = 'white', onPress, style }: { children: React.ReactNode; tone?: BentoTone; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
    const t = useBento(tone);
    const body = <View style={[styles.pill, { backgroundColor: t.chip }, style]}>{children}</View>;
    return onPress ? (
        <Pressable accessibilityRole="button" onPress={onPress}>
            {body}
        </Pressable>
    ) : (
        body
    );
}

const styles = StyleSheet.create({
    tile: { borderRadius: 24, overflow: 'hidden' },
    pad: { padding: 12 },
    eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
    bigRow: { flexDirection: 'row', alignItems: 'flex-end' },
    dot: { alignItems: 'center', justifyContent: 'center' },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingHorizontal: 12, borderRadius: 15, alignSelf: 'flex-start' },
});
