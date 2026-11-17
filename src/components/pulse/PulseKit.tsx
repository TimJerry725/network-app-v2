import React, { useRef } from 'react';
import {
    Animated,
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '../ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FONT_FAMILIES } from '../../constants/Tokens';

/* ────────────────────────────────────────────────────────────
 * Pulse kit: playful payment-app primitives
 * - Chunky radii, colour-blocked tiles, black text on lime
 * - Tactile press (scale + haptic), stickers with a slight tilt
 * ──────────────────────────────────────────────────────────── */

export const PULSE_RADIUS = { tile: 26, pass: 30, button: 22, chip: 999 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function haptic(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
    if (Platform.OS !== 'web') Haptics.impactAsync(style).catch(() => {});
}

/** Pressable that squishes on press, the core "funky" feel. */
export function Squish({
    children,
    onPress,
    style,
    disabled,
    accessibilityLabel,
    hapticStyle,
}: {
    children: React.ReactNode;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
    accessibilityLabel?: string;
    hapticStyle?: Haptics.ImpactFeedbackStyle;
}) {
    const scale = useRef(new Animated.Value(1)).current;
    return (
        <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ disabled: !!disabled }}
            disabled={disabled}
            onPressIn={() =>
                Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 40, bounciness: 0 }).start()
            }
            onPressOut={() =>
                Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10 }).start()
            }
            onPress={() => {
                haptic(hapticStyle);
                onPress?.();
            }}
            style={[style, { transform: [{ scale }], opacity: disabled ? 0.45 : 1 }]}
        >
            {children}
        </AnimatedPressable>
    );
}

type ButtonVariant = 'lime' | 'ink' | 'ghost' | 'violet' | 'danger';

export function PulseButton({
    title,
    onPress,
    variant = 'lime',
    icon,
    style,
    disabled,
    size = 'lg',
    accessibilityLabel,
}: {
    accessibilityLabel?: string;
    title: string;
    onPress?: () => void;
    variant?: ButtonVariant;
    icon?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
    size?: 'md' | 'lg';
}) {
    const { colors, isDark } = useAppTheme();
    const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
        lime: { bg: colors.lime, fg: colors.onLime, border: colors.lime },
        ink: { bg: isDark ? '#FFFFFF' : colors.ink, fg: isDark ? colors.ink : '#FFFFFF', border: 'transparent' },
        ghost: { bg: 'transparent', fg: colors.text, border: colors.border },
        violet: { bg: colors.violet, fg: '#FFFFFF', border: colors.violet },
        danger: { bg: colors.error, fg: '#FFFFFF', border: colors.error },
    };
    const p = palette[variant];
    return (
        <Squish
            onPress={onPress}
            disabled={disabled}
            accessibilityLabel={accessibilityLabel ?? title}
            hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
            style={[
                styles.button,
                size === 'md' && styles.buttonMd,
                { backgroundColor: p.bg, borderColor: p.border, borderWidth: variant === 'ghost' ? 1.5 : 0 },
                style,
            ]}
        >
            {icon}
            {title ? <ThemedText style={[styles.buttonText, size === 'md' && { fontSize: 14 }, { color: p.fg }]}>{title}</ThemedText> : null}
        </Squish>
    );
}

/** Small tilted label, e.g. "LIVE", "NEW", "+25 VOLTS". */
export function Sticker({
    label,
    bg,
    fg = '#0B0B0F',
    tilt = -4,
    style,
}: {
    label: string;
    bg: string;
    fg?: string;
    tilt?: number;
    style?: StyleProp<ViewStyle>;
}) {
    return (
        <View style={[styles.sticker, { backgroundColor: bg, transform: [{ rotate: `${tilt}deg` }] }, style]}>
            <ThemedText style={[styles.stickerText, { color: fg }]}>{label}</ThemedText>
        </View>
    );
}

/** Colour-blocked bento tile with icon, big value and caption. */
export function PulseTile({
    bg,
    fg = '#0B0B0F',
    icon,
    label,
    value,
    caption,
    onPress,
    style,
}: {
    bg: string;
    fg?: string;
    icon?: React.ReactNode;
    label: string;
    value?: string;
    caption?: string;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
}) {
    return (
        <Squish onPress={onPress} accessibilityLabel={label} style={[styles.tile, { backgroundColor: bg }, style]}>
            <View style={styles.tileTop}>
                {icon ? <View style={styles.tileIcon}>{icon}</View> : null}
            </View>
            {value ? (
                <ThemedText style={[styles.tileValue, { color: fg }]} numberOfLines={1} adjustsFontSizeToFit>
                    {value}
                </ThemedText>
            ) : null}
            <ThemedText style={[styles.tileLabel, { color: fg }]} numberOfLines={1}>
                {label}
            </ThemedText>
            {caption ? (
                <ThemedText style={[styles.tileCaption, { color: fg, opacity: 0.7 }]} numberOfLines={2}>
                    {caption}
                </ThemedText>
            ) : null}
        </Squish>
    );
}

/** Gradient "pass" card used for the wallet. */
export function PassCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
    const { colors } = useAppTheme();
    return (
        <View style={[styles.passShell, style]}>
            <LinearGradient
                colors={colors.passGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            {/* Decorative orbit rings, the "funky" signature */}
            <View style={[styles.ring, { width: 220, height: 220, right: -70, top: -90 }]} />
            <View style={[styles.ring, { width: 140, height: 140, right: -20, top: -40 }]} />
            <View style={styles.passInner}>{children}</View>
        </View>
    );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
    const { colors } = useAppTheme();
    return (
        <View style={styles.sectionRow}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>{title}</ThemedText>
            {action ? (
                <Squish onPress={onAction} accessibilityLabel={action}>
                    <ThemedText style={[styles.sectionAction, { color: colors.primary }]}>{action}</ThemedText>
                </Squish>
            ) : null}
        </View>
    );
}

/** Status chip that always shows how fresh the data is. */
export function StatusChip({
    label,
    tone,
    style,
    textStyle,
}: {
    label: string;
    tone: 'ok' | 'wait' | 'stop' | 'info';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}) {
    const { colors } = useAppTheme();
    const map = {
        ok: colors.mint,
        wait: colors.sun,
        stop: colors.error,
        info: colors.sky,
    };
    const c = map[tone];
    return (
        <View style={[styles.statusChip, { backgroundColor: `${c}22`, borderColor: `${c}55` }, style]}>
            <View style={[styles.statusDot, { backgroundColor: c }]} />
            <ThemedText style={[styles.statusText, { color: c }, textStyle]}>{label}</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 58,
        borderRadius: PULSE_RADIUS.button,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 20,
    },
    buttonMd: { height: 46, borderRadius: 16 },
    buttonText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 16, letterSpacing: -0.2 },
    sticker: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    stickerText: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 11, letterSpacing: 0.6 },
    tile: {
        borderRadius: PULSE_RADIUS.tile,
        padding: 16,
        minHeight: 132,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    tileTop: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row' },
    tileIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(11, 11, 15, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tileValue: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 24, letterSpacing: -0.8, lineHeight: 30 },
    tileLabel: { fontFamily: FONT_FAMILIES.bold, fontSize: 14, lineHeight: 18 },
    tileCaption: { fontFamily: FONT_FAMILIES.medium, fontSize: 11, lineHeight: 15, marginTop: 2 },
    passShell: { borderRadius: PULSE_RADIUS.pass, overflow: 'hidden' },
    passInner: { padding: 20 },
    ring: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.22)',
    },
    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 26,
        marginBottom: 12,
    },
    sectionTitle: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 20, letterSpacing: -0.5 },
    sectionAction: { fontFamily: FONT_FAMILIES.bold, fontSize: 13 },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusText: { fontFamily: FONT_FAMILIES.bold, fontSize: 11.5 },
});
