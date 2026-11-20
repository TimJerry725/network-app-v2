import React, { useState } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { TextInput } from './ThemedTextInput';
import * as Haptics from 'expo-haptics';
import { Mic, Plus, Search, Sparkles, Zap, MapPin, BatteryCharging, ArrowUpRight, Route, CheckCircle2 } from './sf/icons';
import { ThemedText } from './ThemedText';
import { FONT_FAMILIES, RADIUS } from '../constants/Tokens';
import { useAppTheme } from '../hooks/useAppTheme';

export interface ChatPromptChip {
    id: string;
    label: string;
    icon?: React.ReactNode;
    color?: string;
    bg?: string;
    action?: () => void;
}

export interface ChatPromptBarProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    onSelectPrompt?: (prompt: string) => void;
    onActionPress?: () => void;
    onSearchSubmit?: (query: string) => void;
    onVoicePress?: () => void;
    onPlusPress?: () => void;
    chips?: ChatPromptChip[];
    style?: any;
}

/**
 * Chat-Style Conversational Copilot Prompt Bar
 * Matches the chat-first UI from the reference design:
 * - Circular Coral (+) Action Button
 * - Capsule Pill Text Input ("Ask something to start...")
 * - Soundwave / Mic Indicator
 * - Horizontal Conversational Prompt Chips Carousel
 */
export function ChatPromptBar({
    placeholder = 'Ask Iris or search stations...',
    value,
    onChangeText,
    onSelectPrompt,
    onActionPress,
    onSearchSubmit,
    onVoicePress,
    onPlusPress,
    chips,
    style,
}: ChatPromptBarProps) {
    const { colors, isDark } = useAppTheme();
    const [internalQuery, setInternalQuery] = useState('');
    const query = value !== undefined ? value : internalQuery;
    const handleTextChange = onChangeText ?? setInternalQuery;
    const [isFocused, setIsFocused] = useState(false);

    const defaultChips: ChatPromptChip[] = [
        {
            id: 'trip',
            label: 'Plan Trip to Mysuru',
            icon: <Route size={13} color={colors.primary} />,
            color: colors.primary,
            bg: isDark ? 'rgba(0, 122, 255, 0.16)' : '#E5F1FF',
        },
        {
            id: 'fast',
            label: '60kW+ Fast Chargers',
            icon: <Zap size={13} color={colors.secondary} fill={colors.secondary} />,
            color: colors.secondary,
            bg: isDark ? 'rgba(0, 122, 255, 0.16)' : '#FFF0ED',
        },
        {
            id: 'avail',
            label: 'Available Right Now',
            icon: <CheckCircle2 size={13} color={colors.tertiary} />,
            color: colors.tertiary,
            bg: isDark ? 'rgba(52, 199, 89, 0.16)' : '#ECFDF5',
        },
        {
            id: 'battery',
            label: 'Check Range',
            icon: <BatteryCharging size={13} color={colors.primary} />,
            color: colors.primary,
            bg: isDark ? 'rgba(0, 122, 255, 0.16)' : '#E5F1FF',
        },
    ];

    const activeChips = chips ?? defaultChips;

    const handleChipPress = (chip: ChatPromptChip) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        if (chip.action) {
            chip.action();
        } else if (onSelectPrompt) {
            onSelectPrompt(chip.label);
        } else {
            handleTextChange(chip.label.trim());
            onSearchSubmit?.(chip.label.trim());
        }
    };

    const handleSubmit = () => {
        if (!query.trim()) return;
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onSearchSubmit?.(query.trim());
    };

    return (
        <View style={[styles.container, style]}>
            {/* Horizontal Prompt Chips Carousel */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
            >
                {activeChips.map((chip) => (
                    <TouchableOpacity
                        key={chip.id}
                        style={[
                            styles.chipPill,
                            {
                                backgroundColor: chip.bg ?? (isDark ? colors.surfaceMuted : colors.backgroundAlt),
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                            },
                        ]}
                        activeOpacity={0.8}
                        onPress={() => handleChipPress(chip)}
                    >
                        {chip.icon ? chip.icon : null}
                        <ThemedText
                            style={[
                                styles.chipText,
                                { color: chip.color ?? (isDark ? '#FFFFFF' : '#0B0B0F') },
                            ]}
                        >
                            {chip.label}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Chat Input Capsule Bar */}
            <View style={styles.inputBarRow}>
                {/* Circular Primary Ice Blue Action Trigger (+) */}
                <TouchableOpacity
                    style={[styles.plusCircleBtn, { backgroundColor: colors.primary }]}
                    activeOpacity={0.85}
                    onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        (onActionPress ?? onPlusPress)?.();
                    }}
                >
                    <Plus size={18} color={isDark ? '#0B0B0F' : '#FFFFFF'} strokeWidth={2.6} />
                </TouchableOpacity>

                {/* Pill Capsule Input Field */}
                <View
                    style={[
                        styles.inputCapsule,
                        {
                            backgroundColor: isDark ? colors.surfaceMuted : '#FFFFFF',
                            borderColor: isFocused
                                ? colors.primary
                                : isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.07)',
                        },
                    ]}
                >
                    <Search size={15} color={colors.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.textInput, { color: colors.text }]}
                        placeholder={placeholder}
                        placeholderTextColor={colors.textMuted}
                        value={query}
                        onChangeText={handleTextChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onSubmitEditing={handleSubmit}
                        returnKeyType="search"
                    />

                    {/* Soundwave Mic Indicator (||||) */}
                    <TouchableOpacity
                        style={styles.micBtn}
                        activeOpacity={0.7}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onVoicePress?.();
                        }}
                    >
                        <View style={styles.waveformWrap}>
                            <View style={[styles.waveBar, { height: 10, backgroundColor: colors.textMuted }]} />
                            <View style={[styles.waveBar, { height: 16, backgroundColor: colors.primary }]} />
                            <View style={[styles.waveBar, { height: 8, backgroundColor: colors.textMuted }]} />
                            <View style={[styles.waveBar, { height: 13, backgroundColor: colors.primary }]} />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        gap: 8,
    },
    chipsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 2.0,
    },
    chipPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 11.5,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
    },
    inputBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    plusCircleBtn: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputCapsule: {
        flex: 1,
        height: 44,
        borderRadius: RADIUS.pill,
        borderWidth: 1.2,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 13,
        fontFamily: FONT_FAMILIES.sansMedium,
        fontWeight: '500',
        paddingVertical: 0.0,
    },
    micBtn: {
        paddingLeft: 8,
        paddingVertical: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    waveformWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2.0,
        paddingHorizontal: 4,
    },
    waveBar: {
        width: 2.2,
        borderRadius: 1,
    },
});
