import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from '../sf/icons';
import { ThemedText } from '../ThemedText';
import { AppLogo } from '../AppLogo';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FONT_FAMILIES } from '../../constants/Tokens';

/**
 * Shared frame for the sign-up flow: Sign in → Verify → My profile → Add vehicle.
 * Logo and step dots on top, one title, the form, and the main action pinned at the bottom.
 */
export function AuthShell({
    step,
    total = 4,
    title,
    subtitle,
    onBack,
    children,
    footer,
}: {
    step: number;
    total?: number;
    title: string;
    subtitle?: string;
    onBack?: () => void;
    children: React.ReactNode;
    footer: React.ReactNode;
}) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.top}>
                    {onBack ? (
                        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={8} style={[styles.back, { backgroundColor: colors.surface, borderColor: 'transparent' }]}>
                            <ChevronLeft size={20} color={colors.text} strokeWidth={2.5} />
                        </Pressable>
                    ) : (
                        <View style={styles.back} />
                    )}
                    <AppLogo width={104} height={22} solidColor={isDark ? '#FFFFFF' : '#000000'} />
                    <View style={styles.back} />
                </View>

                <View style={styles.dots} accessibilityLabel={`Step ${step} of ${total}`}>
                    {Array.from({ length: total }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                { backgroundColor: i < step ? (isDark ? '#FFFFFF' : '#0B0B0F') : isDark ? '#3A3A3C' : '#D9DCE1', flex: i === step - 1 ? 2.2 : 1 },
                            ]}
                        />
                    ))}
                </View>

                <ThemedText style={[styles.title, { color: colors.text }]}>{title}</ThemedText>
                {subtitle ? <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</ThemedText> : null}

                <View style={{ marginTop: 24 }}>{children}</View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14), backgroundColor: colors.background, borderTopColor: colors.border }]}>
                {footer}
            </View>
        </KeyboardAvoidingView>
    );
}

export const authStyles = StyleSheet.create({
    label: { fontSize: 15, fontWeight: '600', marginBottom: 8, marginTop: 16 },
    input: {
        height: 62,
        borderRadius: 22,
        borderWidth: 2,
        paddingHorizontal: 20,
        fontWeight: '600',
        fontSize: 20,
    },
});

const styles = StyleSheet.create({
    root: { flex: 1 },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    back: { width: 44, height: 44, borderRadius: 14, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },
    dots: { flexDirection: 'row', gap: 8, marginTop: 16 },
    dot: { height: 6, borderRadius: 3 },
    title: { fontSize: 42, fontWeight: '800', lineHeight: 48, letterSpacing: -1.4, marginTop: 24 },
    subtitle: { fontSize: 18, fontWeight: '500', lineHeight: 25, marginTop: 8 },
    footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
