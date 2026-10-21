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
    ShieldCheck,
} from 'lucide-react-native';

import { AppLogo } from '../../components/AppLogo';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../constants/Tokens';

export default function LoginScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();

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
                    isDark
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
                        {/* 1. Header with Official Vector App Logo */}
                        <View style={styles.brandHeader}>
                            <View
                                style={[
                                    styles.logoPill,
                                    {
                                        backgroundColor: isDark
                                            ? 'rgba(22, 24, 35, 0.85)'
                                            : 'rgba(255, 255, 255, 0.95)',
                                        borderColor: isDark
                                            ? 'rgba(56, 189, 248, 0.25)'
                                            : 'rgba(56, 189, 248, 0.18)',
                                    },
                                ]}
                            >
                                <AppLogo width={200} height={42} />
                            </View>
                        </View>

                        {/* 2. Modern Glassmorphic Login Card */}
                        <View
                            style={[
                                styles.loginCard,
                                {
                                    backgroundColor: isDark
                                        ? 'rgba(20, 22, 32, 0.88)'
                                        : 'rgba(255, 255, 255, 0.96)',
                                    borderColor: isDark
                                        ? 'rgba(255, 255, 255, 0.10)'
                                        : 'rgba(0, 0, 0, 0.08)',
                                },
                            ]}
                        >
                            {/* Email Input */}
                            <View style={styles.inputGroup}>
                                <ThemedText style={[styles.inputLabel, { color: colors.textMuted }]}>
                                    REGISTERED EMAIL
                                </ThemedText>
                                <View
                                    style={[
                                        styles.inputWrap,
                                        {
                                            backgroundColor: isDark ? '#141622' : '#F8FAFC',
                                            borderColor: isDark
                                                ? 'rgba(255, 255, 255, 0.12)'
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
                                        <View style={styles.verifiedDot}>
                                            <Check size={11} color="#10B981" />
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputGroup}>
                                <View style={styles.labelRow}>
                                    <ThemedText style={[styles.inputLabel, { color: colors.textMuted }]}>
                                        ACCESS KEY / PASSWORD
                                    </ThemedText>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                    >
                                        <ThemedText style={styles.forgotLink}>
                                            Forgot?
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>
                                <View
                                    style={[
                                        styles.inputWrap,
                                        {
                                            backgroundColor: isDark ? '#141622' : '#F8FAFC',
                                            borderColor: isDark
                                                ? 'rgba(255, 255, 255, 0.12)'
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
                                        rememberMe && { backgroundColor: colors.primary },
                                    ]}
                                >
                                    {rememberMe && <Check size={11} color="#FFFFFF" />}
                                </View>
                                <ThemedText style={[styles.rememberText, { color: colors.textMuted }]}>
                                    Remember this vehicle device
                                </ThemedText>
                            </TouchableOpacity>

                            {/* Primary Sign In Button */}
                            <TouchableOpacity
                                style={styles.signInButton}
                                activeOpacity={0.85}
                                onPress={handleContinue}
                                disabled={isLoading}
                            >
                                <LinearGradient
                                    colors={['#FF5B45', '#FF7A66']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.signInGradient}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <ThemedText style={styles.signInText}>
                                                AUTHENTICATE & ENTER
                                            </ThemedText>
                                            <ArrowRight size={15} color="#FFFFFF" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* 3. Footer Protocol Info */}
                        <View style={styles.footer}>
                            <View style={styles.footerProtocolRow}>
                                <ShieldCheck size={12} color="#10B981" />
                                <ThemedText style={[styles.footerProtocolText, { color: colors.textMuted }]}>
                                    256-Bit Encrypted EV Charging Network
                                </ThemedText>
                            </View>
                            <ThemedText style={[styles.footerTerms, { color: colors.textSoft }]}>
                                Iris Protocol v2.5 • Privacy • Terms
                            </ThemedText>
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
        marginBottom: 28,
    },
    logoPill: {
        paddingHorizontal: 22,
        paddingVertical: 14,
        borderRadius: RADIUS.card,
        borderWidth: 1.2,
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 14,
        elevation: 6,
        alignItems: 'center',
        justifyContent: 'center',
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
    footer: {
        alignItems: 'center',
        marginTop: 24,
    },
    footerProtocolRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    footerProtocolText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
    },
    footerTerms: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.regular,
    },
});
