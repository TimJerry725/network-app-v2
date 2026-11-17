import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
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
                        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={8} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <ChevronLeft size={20} color={colors.text} strokeWidth={2.5} />
                        </Pressable>
                    ) : (
                        <View style={styles.back} />
                    )}
                    <AppLogo width={96} height={20} solidColor={isDark ? '#FFFFFF' : '#0B0B0F'} />
                    <View style={styles.back} />
                </View>

                <View style={styles.dots} accessibilityLabel={`Step ${step} of ${total}`}>
                    {Array.from({ length: total }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                { backgroundColor: i < step ? colors.violet : colors.surfaceMuted, flex: i === step - 1 ? 2 : 1 },
                            ]}
                        />
                    ))}
                </View>

                <ThemedText style={[styles.title, { color: colors.text }]}>{title}</ThemedText>
                {subtitle ? <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</ThemedText> : null}

                <View style={{ marginTop: 22 }}>{children}</View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14), backgroundColor: colors.background, borderTopColor: colors.border }]}>
                {footer}
            </View>
        </KeyboardAvoidingView>
    );
}

export const authStyles = StyleSheet.create({
    label: { fontFamily: FONT_FAMILIES.bold, fontSize: 13.5, marginBottom: 8, marginTop: 18 },
    input: {
        height: 54,
        borderRadius: 16,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        fontFamily: FONT_FAMILIES.semiBold,
        fontSize: 16,
    },
});

const styles = StyleSheet.create({
    root: { flex: 1 },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    back: { width: 44, height: 44, borderRadius: 14, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },
    dots: { flexDirection: 'row', gap: 6, marginTop: 18 },
    dot: { height: 5, borderRadius: 3 },
    title: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 30, lineHeight: 36, letterSpacing: -1, marginTop: 22 },
    subtitle: { fontFamily: FONT_FAMILIES.medium, fontSize: 14.5, lineHeight: 21, marginTop: 6 },
    footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
