import React, { useState } from 'react';
import {
    LayoutAnimation,
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronDown, ChevronLeft, ChevronRight } from '../sf/icons';
import { ThemedText } from '../ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { GlassButton } from '../glass/Glass';
import { FONT_FAMILIES } from '../../constants/Tokens';

/* ────────────────────────────────────────────────────────────
 * Flat kit: plain, calm screens (everything except Home).
 * Same colours and type as Home; no card skins, chips or stacks.
 * One <Panel tone="highlight"> at most per screen for the key number.
 * ──────────────────────────────────────────────────────────── */

function tap() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function tintIcon(icon: React.ReactNode, color: string) {
    return React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { color }) : icon;
}

export function ScreenTitle({
    title,
    subtitle,
    onBack,
    right,
}: {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    right?: React.ReactNode;
}) {
    const { colors } = useAppTheme();
    return (
        <View style={styles.titleWrap}>
            {onBack || right ? (
                <View style={styles.titleTop}>
                    {onBack ? (
                        <GlassButton label="Back" size={48} onPress={onBack}>
                            <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
                        </GlassButton>
                    ) : (
                        <View />
                    )}
                    <View style={styles.titleRight}>{right}</View>
                </View>
            ) : null}
            {title ? <ThemedText style={[styles.title, { color: colors.text }]}>{title}</ThemedText> : null}
            {subtitle ? <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</ThemedText> : null}
        </View>
    );
}

export function HeaderIcon({ children, onPress, label, active }: { children: React.ReactNode; onPress: () => void; label: string; active?: boolean }) {
    const { colors } = useAppTheme();
    return (
        <GlassButton label={label} size={48} onPress={onPress} tint={active ? colors.primary : undefined}>
            {children}
        </GlassButton>
    );
}

export function Section({
    title,
    action,
    onAction,
    children,
    style,
}: {
    title?: string;
    action?: string;
    onAction?: () => void;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}) {
    const { colors } = useAppTheme();
    return (
        <View style={[styles.section, style]}>
            {title ? (
                <View style={styles.sectionHead}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>{title}</ThemedText>
                    {action ? (
                        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
                            <ThemedText style={[styles.sectionAction, { color: colors.primary }]}>{action}</ThemedText>
                        </Pressable>
                    ) : null}
                </View>
            ) : null}
            {children}
        </View>
    );
}

/** Plain surface. tone="highlight" = the one lime block for a screen's key number. */
export function Panel({
    children,
    style,
    tone = 'default',
    onPress,
    accessibilityLabel,
    padded = true,
}: {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    tone?: 'default' | 'highlight' | 'warning' | 'danger';
    onPress?: () => void;
    accessibilityLabel?: string;
    padded?: boolean;
}) {
    const { colors } = useAppTheme();
    const toneStyle =
        tone === 'highlight'
            ? { backgroundColor: colors.lime, borderColor: colors.lime }
            : tone === 'warning'
            ? { backgroundColor: 'rgba(255,149,0,0.12)', borderColor: colors.sun }
            : tone === 'danger'
            ? { backgroundColor: 'rgba(255,90,95,0.10)', borderColor: colors.error }
            : { backgroundColor: colors.surface, borderColor: 'transparent' };
    const body = [styles.panel, padded && styles.panelPad, toneStyle, style];
    if (onPress) {
        return (
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                onPress={() => {
                    tap();
                    onPress();
                }}
                style={({ pressed }) => [...body, pressed && { opacity: 0.75 }]}
            >
                {children}
            </Pressable>
        );
    }
    return <View style={body}>{children}</View>;
}

/** Ink text colour helpers for content inside a highlight panel. */
export const ON_HIGHLIGHT = { fg: '#FFFFFF', sub: 'rgba(255,255,255,0.8)' };

export function Divider({ inset = 0 }: { inset?: number }) {
    const { colors } = useAppTheme();
    return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: inset }} />;
}

export function Row({
    icon,
    title,
    subtitle,
    right,
    onPress,
    chevron,
    titleStyle,
}: {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
    onPress?: () => void;
    chevron?: boolean;
    titleStyle?: StyleProp<TextStyle>;
}) {
    const { colors } = useAppTheme();
    const content = (
        <>
            {icon ? <View style={[styles.rowIcon, { backgroundColor: 'rgba(0,122,255,0.12)' }]}>{tintIcon(icon, colors.primary)}</View> : null}
            <View style={{ flex: 1 }}>
                <ThemedText style={[styles.rowTitle, { color: colors.text }, titleStyle]} numberOfLines={1}>
                    {title}
                </ThemedText>
                {subtitle ? (
                    <ThemedText style={[styles.rowSub, { color: colors.textMuted }]} numberOfLines={2}>
                        {subtitle}
                    </ThemedText>
                ) : null}
            </View>
            {right}
            {chevron ? <ChevronRight size={18} color={colors.textSoft} /> : null}
        </>
    );
    if (onPress) {
        return (
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={title}
                onPress={() => {
                    tap();
                    onPress();
                }}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
            >
                {content}
            </Pressable>
        );
    }
    return <View style={styles.row}>{content}</View>;
}

/** Tap to expand: replaces the old fan stacks with a calm list. */
export function ExpandRow({
    title,
    subtitle,
    right,
    icon,
    children,
}: {
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    const { colors } = useAppTheme();
    const [open, setOpen] = useState(false);
    return (
        <View>
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={title}
                onPress={() => {
                    tap();
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setOpen((o) => !o);
                }}
                style={styles.row}
            >
                {icon ? <View style={[styles.rowIcon, { backgroundColor: 'rgba(0,122,255,0.12)' }]}>{tintIcon(icon, colors.primary)}</View> : null}
                <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                        {title}
                    </ThemedText>
                    {subtitle ? (
                        <ThemedText style={[styles.rowSub, { color: colors.textMuted }]} numberOfLines={1}>
                            {subtitle}
                        </ThemedText>
                    ) : null}
                </View>
                {right}
                <ChevronDown size={18} color={colors.textSoft} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
            </Pressable>
            {open ? <View style={styles.expandBody}>{children}</View> : null}
        </View>
    );
}

export function KeyValue({ label, value, strong, valueColor }: { label: string; value: string; strong?: boolean; valueColor?: string }) {
    const { colors } = useAppTheme();
    return (
        <View style={[styles.kv, strong && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: 8, paddingTop: 12 }]}>
            <ThemedText style={[styles.kvLabel, { color: strong ? colors.text : colors.textMuted }, strong && { fontFamily: FONT_FAMILIES.extraBold }]}>{label}</ThemedText>
            <ThemedText style={[styles.kvValue, { color: valueColor ?? colors.text }, strong && { fontSize: 17 }]}>{value}</ThemedText>
        </View>
    );
}

export function StatGrid({ items, columns = 2, onHighlight }: { items: { label: string; value: string }[]; columns?: 2 | 3; onHighlight?: boolean }) {
    const { colors } = useAppTheme();
    const fg = onHighlight ? ON_HIGHLIGHT.fg : colors.text;
    const sub = onHighlight ? ON_HIGHLIGHT.sub : colors.textMuted;
    return (
        <View style={styles.grid}>
            {items.map((it) => (
                <View key={it.label} style={{ width: columns === 3 ? '33.33%' : '50%', paddingVertical: 8 }}>
                    <ThemedText style={[styles.statValue, { color: fg }]} numberOfLines={1}>
                        {it.value}
                    </ThemedText>
                    <ThemedText style={[styles.statLabel, { color: sub }]}>{it.label}</ThemedText>
                </View>
            ))}
        </View>
    );
}

/** Plain status text with a dot, for "Free", "Busy", "Processing". */
export function StatusText({ label, tone }: { label: string; tone: 'ok' | 'wait' | 'stop' | 'muted' }) {
    const { colors } = useAppTheme();
    const c = tone === 'ok' ? colors.mint : tone === 'wait' ? colors.sun : tone === 'stop' ? colors.error : colors.textMuted;
    return (
        <View style={styles.status}>
            <View style={[styles.statusDot, { backgroundColor: c }]} />
            <ThemedText style={[styles.statusText, { color: c }]}>{label}</ThemedText>
        </View>
    );
}

/** Simple selectable option (radio-like) used for targets, connectors, methods. */
export function Option({
    label,
    sub,
    selected,
    onPress,
    icon,
    style,
}: {
    label: string;
    sub?: string;
    selected: boolean;
    onPress: () => void;
    icon?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}) {
    const { colors } = useAppTheme();
    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={label}
            onPress={() => {
                tap();
                onPress();
            }}
            style={[
                styles.option,
                { borderColor: selected ? colors.primary : 'transparent', backgroundColor: selected ? 'rgba(0,122,255,0.1)' : colors.surface },
                style,
            ]}
        >
            {icon}
            <View style={{ alignItems: icon ? 'flex-start' : 'center', flexShrink: 1 }}>
                <ThemedText style={[styles.optionLabel, { color: colors.text }]} numberOfLines={1}>
                    {label}
                </ThemedText>
                {sub ? (
                    <ThemedText style={[styles.optionSub, { color: colors.textMuted }]} numberOfLines={1}>
                        {sub}
                    </ThemedText>
                ) : null}
            </View>
        </Pressable>
    );
}

export const flat = StyleSheet.create({
    screen: { flex: 1 },
    bigNumber: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 40, lineHeight: 46, letterSpacing: -1.5 },
    h2: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 20, letterSpacing: -0.4 },
    body: { fontFamily: FONT_FAMILIES.medium, fontSize: 14, lineHeight: 20 },
    caption: { fontFamily: FONT_FAMILIES.medium, fontSize: 12.5, lineHeight: 17 },
    rowGap: { flexDirection: 'row', gap: 8 },
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
});

const styles = StyleSheet.create({
    titleWrap: { marginBottom: 8 },
    titleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, marginBottom: 8 },
    titleRight: { flexDirection: 'row', gap: 8 },
    back: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 34, fontWeight: '800', lineHeight: 42, letterSpacing: -1.2 },
    subtitle: { fontFamily: FONT_FAMILIES.medium, fontSize: 14, marginTop: 4, lineHeight: 20 },
    section: { marginTop: 24 },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    sectionTitle: { fontFamily: FONT_FAMILIES.bold, fontSize: 18 },
    sectionAction: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 15 },
    panel: { borderRadius: 24, borderWidth: 0, overflow: 'hidden' },
    panelPad: { padding: 16 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, minHeight: 56 },
    rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    rowTitle: { fontFamily: FONT_FAMILIES.bold, fontSize: 15 },
    rowSub: { fontFamily: FONT_FAMILIES.medium, fontSize: 12.5, marginTop: 1.0, lineHeight: 17 },
    expandBody: { paddingHorizontal: 16, paddingBottom: 16 },
    kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, gap: 12 },
    kvLabel: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 14, flexShrink: 1 },
    kvValue: { fontFamily: FONT_FAMILIES.bold, fontSize: 14, textAlign: 'right' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    statValue: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 18 },
    statLabel: { fontFamily: FONT_FAMILIES.medium, fontSize: 12, marginTop: 1.0 },
    status: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontFamily: FONT_FAMILIES.bold, fontSize: 12.5 },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 2,
        borderRadius: 16,
        minHeight: 48,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    optionLabel: { fontFamily: FONT_FAMILIES.bold, fontSize: 14 },
    optionSub: { fontFamily: FONT_FAMILIES.medium, fontSize: 11.5, marginTop: 1.0 },
});
