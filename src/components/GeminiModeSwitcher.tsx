import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Sparkles, LayoutGrid } from 'lucide-react-native';
import { ThemedText } from './ThemedText';
import { FONT_FAMILIES, RADIUS } from '../constants/Tokens';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAppMode, AppUIMode } from '../context/AppModeContext';

export interface GeminiModeSwitcherProps {
    compact?: boolean;
    style?: any;
}

/**
 * Gemini Ambient Mode Switcher
 * Provides an effortless toggle between:
 * 1. [ ✦ Gemini AI ] - Minimal Conversational Copilot style
 * 2. [ ⊞ Bento Grid ] - Rich Bento visual dashboard style
 */
export function GeminiModeSwitcher({ compact = false, style }: GeminiModeSwitcherProps) {
    const { colors, isDark } = useAppTheme();
    const { mode, setMode } = useAppMode();
    const anim = useRef(new Animated.Value(mode === 'ai' ? 0 : 1)).current;

    useEffect(() => {
        Animated.spring(anim, {
            toValue: mode === 'ai' ? 0 : 1,
            tension: 280,
            friction: 20,
            useNativeDriver: false,
        }).start();
    }, [mode]);

    const handleSwitch = (newMode: AppUIMode) => {
        if (newMode === mode) return;
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        setMode(newMode);
    };

    const isAi = mode === 'ai';

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: isDark ? 'rgba(16, 17, 24, 0.90)' : 'rgba(255, 255, 255, 0.94)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                },
                compact && styles.compactContainer,
                style,
            ]}
        >
            {/* AI Mode Option */}
            <TouchableOpacity
                activeOpacity={0.85}
                style={[
                    styles.tabButton,
                    isAi && styles.activeTabAi,
                    isAi && {
                        backgroundColor: isDark ? '#222533' : '#F0F7FF',
                        borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(56, 189, 248, 0.3)',
                    },
                ]}
                onPress={() => handleSwitch('ai')}
            >
                <Sparkles
                    size={compact ? 13 : 15}
                    color={isAi ? '#38BDF8' : colors.textMuted}
                    fill={isAi ? (isDark ? '#38BDF8' : '#7DD3FC') : 'none'}
                />
                <ThemedText
                    style={[
                        styles.tabLabel,
                        compact && styles.compactLabel,
                        {
                            color: isAi ? (isDark ? '#FFFFFF' : '#0369A1') : colors.textMuted,
                            fontFamily: isAi ? FONT_FAMILIES.bold : FONT_FAMILIES.medium,
                        },
                    ]}
                >
                    Gemini AI
                </ThemedText>
            </TouchableOpacity>

            {/* Bento Grid Option */}
            <TouchableOpacity
                activeOpacity={0.85}
                style={[
                    styles.tabButton,
                    !isAi && styles.activeTabBento,
                    !isAi && {
                        backgroundColor: isDark ? '#222533' : '#FFF5F3',
                        borderColor: isDark ? 'rgba(255, 91, 69, 0.4)' : 'rgba(255, 91, 69, 0.3)',
                    },
                ]}
                onPress={() => handleSwitch('bento')}
            >
                <LayoutGrid
                    size={compact ? 13 : 15}
                    color={!isAi ? '#FF5B45' : colors.textMuted}
                />
                <ThemedText
                    style={[
                        styles.tabLabel,
                        compact && styles.compactLabel,
                        {
                            color: !isAi ? (isDark ? '#FFFFFF' : '#E0422D') : colors.textMuted,
                            fontFamily: !isAi ? FONT_FAMILIES.bold : FONT_FAMILIES.medium,
                        },
                    ]}
                >
                    Bento Grid
                </ThemedText>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 3,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 3,
        alignSelf: 'center',
    },
    compactContainer: {
        padding: 2,
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 13,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeTabAi: {
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 2,
    },
    activeTabBento: {
        shadowColor: '#FF5B45',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 2,
    },
    tabLabel: {
        fontSize: 12,
        letterSpacing: 0.2,
    },
    compactLabel: {
        fontSize: 11,
    },
});
