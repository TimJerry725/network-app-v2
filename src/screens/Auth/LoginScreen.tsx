import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Zap, ShieldCheck } from 'lucide-react-native';
import { CredButton } from '../../components/CredButton';
import { CredCard } from '../../components/CredCard';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FONT_FAMILIES, FONTS, RADIUS, SPACING } from '../../constants/Tokens';

export default function LoginScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleContinue = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        navigation.replace('Main', {
            screen: 'Map',
            params: { showGracePeriod: true },
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.content}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header Branding */}
                        <View style={styles.brandHeader}>
                            <View
                                style={[
                                    styles.logoWrap,
                                    {
                                        backgroundColor: isDark ? '#1C1C24' : '#FFFFFF',
                                        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                                        borderBottomColor: isDark ? '#050508' : '#C8C8D0',
                                    },
                                ]}
                            >
                                <Zap size={28} color={isDark ? '#FFFFFF' : '#121214'} strokeWidth={2.5} />
                            </View>
                            <ThemedText style={[styles.brandTitle, { color: colors.text }]}>
                                IRIS NETWORK
                            </ThemedText>
                            <ThemedText style={[styles.brandSubtitle, { color: colors.textMuted }]}>
                                SECURE EV CHARGING PROTOCOL
                            </ThemedText>
                        </View>

                        <CredCard variant="default" style={styles.loginCard}>
                            <View style={styles.cardHeaderRow}>
                                <ShieldCheck size={16} color={colors.primary} />
                                <ThemedText style={[styles.cardHeaderTitle, { color: colors.text }]}>
                                    DRIVER AUTHENTICATION
                                </ThemedText>
                            </View>

                            {/* Email input field */}
                            <View style={styles.inputGroup}>
                                <ThemedText style={[styles.inputLabel, { color: colors.textMuted }]}>
                                    REGISTERED EMAIL
                                </ThemedText>
                                <View
                                    style={[
                                        styles.inputWrap,
                                        {
                                            backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                            borderBottomColor: isDark ? '#08080C' : '#D0D0D8',
                                        },
                                    ]}
                                >
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
                                </View>
                            </View>

                            {/* Password input field */}
                            <View style={styles.inputGroup}>
                                <ThemedText style={[styles.inputLabel, { color: colors.textMuted }]}>
                                    ACCESS KEY
                                </ThemedText>
                                <View
                                    style={[
                                        styles.inputWrap,
                                        {
                                            backgroundColor: isDark ? '#141418' : '#F6F6F8',
                                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                            borderBottomColor: isDark ? '#08080C' : '#D0D0D8',
                                        },
                                    ]}
                                >
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="••••••••••••"
                                        placeholderTextColor={colors.textSoft}
                                        secureTextEntry
                                        returnKeyType="done"
                                    />
                                </View>
                            </View>

                            <CredButton
                                title="AUTHENTICATE & ENTER"
                                variant="primary"
                                containerStyle={styles.loginButton}
                                onPress={handleContinue}
                            />
                        </CredCard>
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
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: SPACING.lg,
        justifyContent: 'center',
    },
    brandHeader: {
        alignItems: 'center',
        marginBottom: 28,
    },
    logoWrap: {
        width: 68,
        height: 68,
        borderRadius: RADIUS.squircle,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginBottom: 16,
    },
    brandTitle: {
        fontFamily: FONT_FAMILIES.bold,
        fontSize: 22,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    brandSubtitle: {
        fontFamily: FONT_FAMILIES.semiBold,
        fontSize: 10,
        letterSpacing: 1.5,
        marginTop: 4,
    },
    loginCard: {
        paddingTop: SPACING.md,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
    },
    cardHeaderTitle: {
        fontFamily: FONT_FAMILIES.bold,
        fontSize: 11,
        letterSpacing: 1.5,
    },
    inputGroup: {
        marginBottom: 18,
    },
    inputLabel: {
        fontFamily: FONT_FAMILIES.bold,
        fontSize: 10,
        letterSpacing: 1.2,
        marginBottom: 8,
        marginLeft: 2,
    },
    inputWrap: {
        borderRadius: RADIUS.pill,
        minHeight: 52,
        justifyContent: 'center',
        paddingHorizontal: SPACING.md + 4,
        borderWidth: 1,
    },
    input: {
        fontFamily: FONT_FAMILIES.medium,
        fontSize: 14,
    },
    loginButton: {
        marginTop: SPACING.sm,
    },
});
