import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../hooks/useAppTheme';

/**
 * Liquid Glass.
 *  - iOS 26+: the real system glass (GlassView).
 *  - Older iOS, Android, web: a blur with a soft translucent fill and a hairline edge,
 *    so the same layout still reads as glass.
 */
let HAS_GLASS = false;
try {
    HAS_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable();
} catch {
    HAS_GLASS = false;
}

export function Glass({
    children,
    style,
    radius = 24,
    interactive = false,
    tint,
    clear = false,
}: {
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    radius?: number;
    interactive?: boolean;
    /** Optional tint (for example the accent blue on the Scan button) */
    tint?: string;
    clear?: boolean;
}) {
    const { colors, isDark } = useAppTheme();
    const flat = StyleSheet.flatten(style) ?? {};
    // Neo-bento: solid white/ink surfaces with a soft shadow instead of blur
    return (
        <View
            style={[
                {
                    borderRadius: radius,
                    overflow: 'hidden',
                    backgroundColor: tint ?? colors.surface,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.3 : 0.07,
                    shadowRadius: 14,
                    elevation: 2,
                },
                flat,
            ]}
        >
            {children}
        </View>
    );
}

/** Round or pill glass button (back, share, filter, mic). */
export function GlassButton({
    children,
    onPress,
    label,
    size = 44,
    width,
    style,
    tint,
    disabled,
}: {
    children: React.ReactNode;
    onPress?: () => void;
    label: string;
    size?: number;
    width?: number;
    style?: StyleProp<ViewStyle>;
    tint?: string;
    disabled?: boolean;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            disabled={disabled}
            onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onPress?.();
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : disabled ? 0.45 : 1 }, style]}
        >
            <Glass radius={width ? size / 2 : size / 2} interactive tint={tint} style={{ width: width ?? size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                {children}
            </Glass>
        </Pressable>
    );
}
