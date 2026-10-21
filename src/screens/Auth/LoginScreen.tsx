import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
    ArrowRight,
    Check,
    Eye,
    EyeOff,
    Lock,
    Mail,
} from 'lucide-react-native';

import { AppLogo } from '../../components/AppLogo';
import { CredButton } from '../../components/CredButton';
import { RetroButton } from '../../components/RetroButton';
import { RetroMascot } from '../../components/RetroMascot';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../constants/Tokens';

export default function LoginScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();

    const isCred =
        !(colors as any).lavender &&
        (colors.primary === '#FFFFFF' || colors.primary === '#000000' || colors.primary === '#F6F6F6');

    const [email, setEmail] = useState('tim.vance@example.com');
    const [password, setPassword] = useState('••••••••••••');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            navigation.replace('Main', {
                screen: 'Map',
                params: { showGracePeriod: true },
            });
        }, 500);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Top Ambient Glow */}
            <LinearGradient
                colors={
                    isCred
                        ? isDark
                            ? ['rgba(255, 255, 255, 0.06)', 'transparent']
                            : ['rgba(0, 0, 0, 0.03)', 'transparent']
                        : isDark
                        ? [
                              'rgba(56, 189, 248, 0.18)',
                              'rgba(129, 140, 248, 0.08)',
                              'transparent',
                          ]
                        : [
                              'rgba(56, 189, 248, 0.12)',
                              'rgba(16, 185, 129, 0.08)',
                              'transparent',
                          ]
                }
                style={styles.ambientGlow}
                pointerEvents="none"
            />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* 1. Header with Official Vector App Logo & Playful Mascot */}
                        <View style={styles.brandHeader}>
                            <RetroMascot size={110} expression="wink" animated style={{ marginBottom: 12 }} />
                            <AppLogo width={220} height={46} />
                            <ThemedText style={[styles.brandSubtitle, { color: colors.textMuted }]}>
                                Pilot Authentication • EV Space Grid
                            </ThemedText>
                        </View>

                        {/* 2. Modern Glassmorphic Login Card */}
                        <View
                            style={[
                                styles.loginCard,
                                {
                                    backgroundColor: isDark
                                        ? '#102548'
                                        : '#FFFFFF',
                                    borderColor: isDark
                                        ? 'rgba(59, 130, 246, 0.28)'
                                        : 'rgba(0, 0, 0, 0.08)',
                                },
                            ]}
                        >
                            {/* Email Input */}
                            <View style={styles.inputGroup}>
                                <ThemedText style={[styles.inputLabel, { color: colors.textMuted }]}>
                                    REGISTERED PILOT EMAIL
                                </ThemedText>
                                <View
                                    style={[
                                        styles.inputWrap,
                                        {
                                            backgroundColor: isDark ? '#0E2140' : '#F8FAFC',
                                            borderColor: isDark
                                                ? 'rgba(59, 130, 246, 0.24)'
                                                : 'rgba(0, 0, 0, 0.08)',
                                        },
                                    ]}
                                >
                                    <Mail size={16} color={colors.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="driver@irisnetwork.in"
                                        placeholderTextColor={colors.textSoft}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        returnKeyType="next"
                                    />
                                    {email.length > 3 && (
                                        <View
                                            style={[
                                                styles.verifiedDot,
                                                { backgroundColor: 'rgba(34, 211, 167, 0.18)' },
                                            ]}
                                        >
                                            <Check size={11} color="#22D3A7" />
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputGroup}>
                                <View style={styles.labelRow}>
                                    <ThemedText style={[styles.inputLabel, { color: colors.textMuted }]}>
                                        ACCESS CODE / PASSWORD
                                    </ThemedText>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                    >
                                        <ThemedText style={[styles.forgotLink, { color: colors.primary }]}>
                                            Forgot?
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>
                                <View
                                    style={[
                                        styles.inputWrap,
                                        {
                                            backgroundColor: isDark ? '#0E2140' : '#F8FAFC',
                                            borderColor: isDark
                                                ? 'rgba(59, 130, 246, 0.24)'
                                                : 'rgba(0, 0, 0, 0.08)',
                                        },
                                    ]}
                                >
                                    <Lock size={16} color={colors.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="••••••••••••"
                                        placeholderTextColor={colors.textSoft}
                                        secureTextEntry={!showPassword}
                                        returnKeyType="done"
                                        onSubmitEditing={handleContinue}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeBtn}
                                        activeOpacity={0.7}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff size={16} color={colors.textMuted} />
                                        ) : (
                                            <Eye size={16} color={colors.textMuted} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Remember Me Option */}
                            <TouchableOpacity
                                style={styles.rememberRow}
                                activeOpacity={0.8}
                                onPress={() => {
                                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setRememberMe(!rememberMe);
                                }}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        rememberMe && styles.checkboxActive,
                                        rememberMe && { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
                                    ]}
                                >
                                    {rememberMe && <Check size={11} color="#FFFFFF" />}
                                </View>
                                <ThemedText style={[styles.rememberText, { color: colors.textMuted }]}>
                                    Remember this vehicle device
                                </ThemedText>
                            </TouchableOpacity>

                            {/* Primary Sign In Button: RetroButton / CredButton */}
                            {isCred ? (
                                <CredButton
                                    title={isLoading ? 'AUTHENTICATING...' : 'AUTHENTICATE & ENTER'}
                                    onPress={handleContinue}
                                    disabled={isLoading}
                                    variant="neon"
                                    showTrailingIcon={true}
                                    trailingIcon={
                                        isLoading ? (
                                            <ActivityIndicator size="small" color="#000000" />
                                        ) : undefined
                                    }
                                />
                            ) : (
                                <RetroButton
                                    title="AUTHENTICATE & ENTER"
                                    onPress={handleContinue}
                                    loading={isLoading}
                                    variant="primary"
                                    pill={true}
                                    size="lg"
                                />
                            )}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    ambientGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 280,
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.lg,
        paddingTop: 24,
        paddingBottom: 36,
        justifyContent: 'center',
    },
    brandHeader: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        paddingTop: 8,
    },
    brandSubtitle: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.medium,
        marginTop: 6,
        letterSpacing: 0.5,
    },
    loginCard: {
        borderRadius: RADIUS.card,
        padding: 22,
        borderWidth: 1.2,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 6,
    },
    inputGroup: {
        marginBottom: 16,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    inputLabel: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 1.1,
        marginBottom: 6,
        marginLeft: 2,
    },
    forgotLink: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
        color: '#FF5B45',
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderRadius: RADIUS.input,
        borderWidth: 1,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 13,
        fontFamily: FONT_FAMILIES.regular,
    },
    verifiedDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(16, 185, 129, 0.16)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    eyeBtn: {
        padding: 6,
    },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        marginTop: 2,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: 'rgba(150, 150, 150, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        borderColor: 'transparent',
    },
    rememberText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.regular,
    },
    signInButton: {
        height: 50,
        borderRadius: RADIUS.button,
        overflow: 'hidden',
        shadowColor: '#FF5B45',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    signInGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    signInText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 1.2,
    },
});
