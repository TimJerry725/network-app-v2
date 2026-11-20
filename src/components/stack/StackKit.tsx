import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    LayoutAnimation,
    PanResponder,
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    UIManager,
    View,
    ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ChevronLeft } from '../sf/icons';
import { ThemedText } from '../ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FONT_FAMILIES } from '../../constants/Tokens';
import { Squish } from '../pulse/PulseKit';
import { GlassButton } from '../glass/Glass';

try {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
} catch {
    // Fabric handles layout animation
}

/* ────────────────────────────────────────────────────────────
 * Stack kit: everything in the app is a payment-style card.
 * Skins: each card type has a fixed skin so users learn the
 * meaning by colour (lime = live/go, violet = money, paper = car/receipt).
 * ──────────────────────────────────────────────────────────── */

export type CardSkin = 'violet' | 'lime' | 'pink' | 'sky' | 'sun' | 'ink' | 'paper' | 'aurora' | 'mint';

type SkinDef = {
    colors: readonly [string, string, ...string[]];
    fg: string;
    sub: string;
    line: string;
};

// Four real skins: violet (money, info), lime (live, go), ink (busy, dark), paper (car, receipts).
// The older names stay as aliases so nothing breaks, but they all resolve to those four.
const SKIN_VIOLET: SkinDef = { colors: ['#007AFF', '#0A60D6', '#084BA8'], fg: '#FFFFFF', sub: 'rgba(255,255,255,0.75)', line: 'rgba(255,255,255,0.16)' };
const SKIN_LIME: SkinDef = { colors: ['#4DA3FF', '#007AFF', '#0A60D6'], fg: '#FFFFFF', sub: 'rgba(255,255,255,0.8)', line: 'rgba(255,255,255,0.16)' };
const SKIN_INK: SkinDef = { colors: ['#2C2C2E', '#1C1C1E', '#000000'], fg: '#FFFFFF', sub: 'rgba(255,255,255,0.6)', line: 'rgba(255,255,255,0.07)' };
const SKIN_PAPER: SkinDef = { colors: ['#FFFFFF', '#FFFFFF'], fg: '#000000', sub: '#6C6C70', line: 'rgba(0,0,0,0.06)' };

export const SKINS: Record<CardSkin, SkinDef> = {
    violet: SKIN_VIOLET,
    lime: SKIN_LIME,
    ink: SKIN_INK,
    paper: SKIN_PAPER,
    aurora: SKIN_VIOLET,
    pink: SKIN_VIOLET,
    sky: SKIN_INK,
    sun: SKIN_LIME,
    mint: SKIN_LIME,
};

function tap(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
    if (Platform.OS !== 'web') Haptics.impactAsync(style).catch(() => {});
}

/** EMV-style chip: the small detail that makes a card read as a "payment card". */
export function CardChip({ tone = 'gold' }: { tone?: 'gold' | 'silver' | 'ink' }) {
    const bg = tone === 'gold' ? '#E9C46A' : tone === 'silver' ? '#D9D9E0' : '#0B0B0F';
    const line = tone === 'ink' ? 'rgba(255,255,255,0.25)' : 'rgba(11,11,15,0.25)';
    return (
        <View style={[styles.chip, { backgroundColor: bg }]}>
            <View style={[styles.chipLineH, { backgroundColor: line, top: 9 }]} />
            <View style={[styles.chipLineH, { backgroundColor: line, top: 18 }]} />
            <View style={[styles.chipLineV, { backgroundColor: line }]} />
        </View>
    );
}

/** A card with a skin, decorative arcs and optional press handling. */
export function SkinCard({
    skin,
    children,
    style,
    onPress,
    accessibilityLabel,
    pattern = 'none',
}: {
    skin: CardSkin;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    accessibilityLabel?: string;
    pattern?: 'arcs' | 'stripes' | 'none';
}) {
    const s = SKINS[skin];
    const body = (
        <>
            <LinearGradient colors={s.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            {pattern === 'arcs' ? (
                <>
                    <View style={[styles.arc, { borderColor: s.line, width: 260, height: 260, right: -110, top: -120 }]} />
                    <View style={[styles.arc, { borderColor: s.line, width: 170, height: 170, right: -50, top: -70 }]} />
                    <View style={[styles.arc, { borderColor: s.line, width: 90, height: 90, right: 6, top: -30 }]} />
                </>
            ) : null}
            {pattern === 'stripes' ? (
                <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.stripe,
                                { backgroundColor: s.line, left: -60 + i * 46, transform: [{ rotate: '24deg' }] },
                            ]}
                        />
                    ))}
                </View>
            ) : null}
            {children}
        </>
    );
    if (onPress) {
        return (
            <Squish onPress={onPress} accessibilityLabel={accessibilityLabel} style={[styles.card, style]}>
                {body}
            </Squish>
        );
    }
    return <View style={[styles.card, style]}>{body}</View>;
}

export function skinText(skin: CardSkin) {
    return SKINS[skin];
}

/* ── Swipe deck: stacked cards, swipe left/right to move through ── */

export function SwipeDeck<T>({
    data,
    index,
    onIndexChange,
    renderCard,
    keyExtractor,
    cardHeight,
    peek = 3,
}: {
    data: T[];
    index: number;
    onIndexChange: (i: number) => void;
    renderCard: (item: T, isTop: boolean, i: number) => React.ReactNode;
    keyExtractor: (item: T) => string;
    cardHeight: number;
    peek?: number;
}) {
    const pan = useRef(new Animated.Value(0)).current;
    const indexRef = useRef(index);
    const lenRef = useRef(data.length);
    indexRef.current = index;
    lenRef.current = data.length;

    const go = (dir: 1 | -1) => {
        const len = lenRef.current;
        if (len < 2) {
            Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
            return;
        }
        tap();
        Animated.timing(pan, { toValue: dir * -420, duration: 180, useNativeDriver: true }).start(() => {
            pan.setValue(0);
            onIndexChange((indexRef.current + dir + len) % len);
        });
    };

    const responder = useMemo(
        () =>
            PanResponder.create({
                onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
                // Capture horizontal drags that start on the card's own buttons, so swiping always works
                onMoveShouldSetPanResponderCapture: (_e, g) => Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6,
                onPanResponderTerminationRequest: () => false,
                onPanResponderMove: (_e, g) => pan.setValue(g.dx),
                onPanResponderRelease: (_e, g) => {
                    if (g.dx < -80 || g.vx < -0.6) go(1);
                    else if (g.dx > 80 || g.vx > 0.6) go(-1);
                    else Animated.spring(pan, { toValue: 0, useNativeDriver: true, bounciness: 8 }).start();
                },
                onPanResponderTerminate: () => Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start(),
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    if (data.length === 0) return null;

    const visible = Math.min(peek + 1, data.length);
    const layers = Array.from({ length: visible }).map((_, depth) => {
        const i = (index + depth) % data.length;
        return { item: data[i], depth, i };
    });

    const rotate = pan.interpolate({ inputRange: [-300, 0, 300], outputRange: ['-9deg', '0deg', '9deg'] });

    return (
        <View style={{ height: cardHeight + peek * 12 }}>
            {layers
                .slice()
                .reverse()
                .map(({ item, depth, i }) => {
                    const isTop = depth === 0;
                    const scale = 1 - depth * 0.05;
                    const translateY = peek * 12 - depth * 12;
                    return (
                        <Animated.View
                            key={`${keyExtractor(item)}-${depth}`}
                            {...(isTop ? responder.panHandlers : {})}
                            style={[
                                { position: 'absolute', left: 0, right: 0, height: cardHeight, top: 0 },
                                isTop
                                    ? { transform: [{ translateY }, { translateX: pan }, { rotate }] }
                                    : { transform: [{ translateY }, { scale }], opacity: 1 - depth * 0.18 },
                            ]}
                            pointerEvents={isTop ? 'auto' : 'none'}
                        >
                            {renderCard(item, isTop, i)}
                        </Animated.View>
                    );
                })}
        </View>
    );
}

export function DeckDots({ count, index, color }: { count: number; index: number; color: string }) {
    if (count < 2) return null;
    const max = Math.min(count, 8);
    const active = index % max;
    return (
        <View style={styles.dots}>
            {Array.from({ length: max }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.dot,
                        { backgroundColor: color, opacity: i === active ? 1 : 0.25, width: i === active ? 18 : 6 },
                    ]}
                />
            ))}
            {count > max ? <ThemedText style={[styles.dotsMore, { color }]}>+{count - max}</ThemedText> : null}
        </View>
    );
}

/* ── Fan stack: Apple-Wallet-style vertical stack, tap to open one card ── */

export function FanStack<T>({
    items,
    keyExtractor,
    renderCard,
    renderDetail,
    cardHeight = 200,
    peekHeight = 64,
}: {
    items: T[];
    keyExtractor: (item: T) => string;
    renderCard: (item: T, isOpen: boolean) => React.ReactNode;
    renderDetail?: (item: T) => React.ReactNode;
    cardHeight?: number;
    peekHeight?: number;
}) {
    const [openKey, setOpenKey] = useState<string | null>(null);

    useEffect(() => {
        if (openKey && !items.some((it) => keyExtractor(it) === openKey)) setOpenKey(null);
    }, [items, openKey, keyExtractor]);

    const toggle = (key: string) => {
        tap();
        LayoutAnimation.configureNext(LayoutAnimation.create(260, 'easeInEaseOut', 'opacity'));
        setOpenKey((k) => (k === key ? null : key));
    };

    return (
        <View>
            {items.map((item, i) => {
                const key = keyExtractor(item);
                const isOpen = openKey === key;
                const isLast = i === items.length - 1;
                // Wallet effect: every card shows only its top strip, the next card overlaps the rest.
                // The open card (or the last card when none is open) shows in full.
                const showFull = isOpen || (openKey === null && isLast);
                return (
                    <View
                        key={key}
                        style={{
                            height: showFull ? undefined : peekHeight,
                            marginBottom: isOpen && !isLast ? 12 : 0,
                            zIndex: i,
                        }}
                    >
                        <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => toggle(key)}>
                            <View style={{ height: cardHeight }}>{renderCard(item, isOpen)}</View>
                        </Pressable>
                        {isOpen && renderDetail ? <View style={{ marginTop: 8, marginBottom: 16 }}>{renderDetail(item)}</View> : null}
                    </View>
                );
            })}
        </View>
    );
}

/* ── Headers, chips, segmented ── */

export function StackHeader({
    title,
    eyebrow,
    onBack,
    right,
}: {
    title: string;
    eyebrow?: string;
    onBack?: () => void;
    right?: React.ReactNode;
}) {
    const { colors } = useAppTheme();
    return (
        <View style={styles.header}>
            <View style={styles.headerRow}>
                {onBack ? (
                    <GlassButton label="Back" size={48} onPress={onBack}>
                        <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
                    </GlassButton>
                ) : (
                    <View />
                )}
                <View style={styles.headerRight}>{right}</View>
            </View>
            {eyebrow ? <ThemedText style={[styles.eyebrow, { color: colors.textMuted }]}>{eyebrow}</ThemedText> : null}
            {title ? <ThemedText style={[styles.title, { color: colors.text }]}>{title}</ThemedText> : null}
        </View>
    );
}

export function IconBtn({
    children,
    onPress,
    label,
    active,
}: {
    children: React.ReactNode;
    onPress: () => void;
    label: string;
    active?: boolean;
}) {
    const { colors } = useAppTheme();
    return (
        <GlassButton label={label} size={48} onPress={onPress} tint={active ? colors.primary : undefined}>
            {children}
        </GlassButton>
    );
}

export function Chip({
    label,
    active,
    onPress,
    icon,
}: {
    label: string;
    active?: boolean;
    onPress: () => void;
    icon?: React.ReactNode;
}) {
    const { colors } = useAppTheme();
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: !!active }}
            onPress={() => {
                tap();
                onPress();
            }}
            style={[
                styles.chipPill,
                active
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.surface, borderColor: 'transparent' },
            ]}
        >
            {icon}
            <ThemedText style={[styles.chipPillText, { color: active ? '#FFFFFF' : colors.text }]}>{label}</ThemedText>
        </Pressable>
    );
}

export function Segmented<T extends string>({
    options,
    value,
    onChange,
}: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
}) {
    const { colors } = useAppTheme();
    return (
        <View style={[styles.segment, { backgroundColor: 'rgba(118,118,128,0.16)' }]}>
            {options.map((o) => {
                const active = o.value === value;
                return (
                    <Pressable
                        key={o.value}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                            tap();
                            onChange(o.value);
                        }}
                        style={[styles.segmentItem, active && { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 }]}
                    >
                        <ThemedText style={[styles.segmentText, { color: active ? colors.text : colors.textMuted }]}>
                            {o.label}
                        </ThemedText>
                    </Pressable>
                );
            })}
        </View>
    );
}

/** Label + value pair used on cards ("VALID THRU" style). */
export function CardField({ label, value, fg, sub, align = 'left' }: { label: string; value: string; fg: string; sub: string; align?: 'left' | 'right' }) {
    return (
        <View style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
            <ThemedText style={[styles.fieldLabel, { color: sub }]}>{label}</ThemedText>
            <ThemedText style={[styles.fieldValue, { color: fg }]} numberOfLines={1}>
                {value}
            </ThemedText>
        </View>
    );
}

export const stackStyles = StyleSheet.create({
    cardPad: { padding: 20, flex: 1 },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' },
    bigNumber: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 40, lineHeight: 46, letterSpacing: -1.5 },
    cardTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 22, lineHeight: 27, letterSpacing: -0.6 },
    cardSub: { fontFamily: FONT_FAMILIES.medium, fontSize: 13, lineHeight: 18 },
    mono: { fontFamily: FONT_FAMILIES.bold, fontSize: 14 },
    sectionLabel: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 13 },
});

const styles = StyleSheet.create({
    card: { borderRadius: 24, overflow: 'hidden', flex: 1 },
    arc: { position: 'absolute', borderRadius: 999, borderWidth: 1.5 },
    stripe: { position: 'absolute', top: -60, width: 18, height: 420 },
    chip: { width: 40, height: 30, borderRadius: 7, overflow: 'hidden' },
    chipLineH: { position: 'absolute', left: 0, right: 0, height: 1 },
    chipLineV: { position: 'absolute', top: 0, bottom: 0, left: 19, width: 1 },
    dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12 },
    dot: { height: 6, borderRadius: 3 },
    dotsMore: { fontFamily: FONT_FAMILIES.bold, fontSize: 11, marginLeft: 4 },
    header: { marginBottom: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
    headerRight: { flexDirection: 'row', gap: 8 },
    eyebrow: { fontSize: 15, fontWeight: '600', marginTop: 16 },
    title: { fontSize: 34, fontWeight: '800', lineHeight: 42, letterSpacing: -0.8, marginTop: 4 },
    iconBtn: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    chipPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 38,
        paddingHorizontal: 16,
        borderRadius: 19,
        borderWidth: 1,
    },
    chipPillText: { fontFamily: FONT_FAMILIES.bold, fontSize: 13 },
    segment: { flexDirection: 'row', borderRadius: 14, padding: 4 },
    segmentItem: { flex: 1, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
    segmentText: { fontFamily: FONT_FAMILIES.bold, fontSize: 13 },
    fieldLabel: { fontFamily: FONT_FAMILIES.bold, fontSize: 11 },
    fieldValue: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 15, marginTop: 2.0 },
});
