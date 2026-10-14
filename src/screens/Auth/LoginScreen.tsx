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
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import { GradientButton } from '../../components/GradientButton';
import { NeoCard } from '../../components/NeoCard';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FONTS, RADIUS, SPACING } from '../../constants/Tokens';

export default function LoginScreen({ navigation }: any) {
    const { colors } = useAppTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleContinue = () => {
        navigation.replace('Main', {
            screen: 'Map',
            params: { showGracePeriod: true },
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={colors.heroGradient}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />
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
                        <NeoCard gradientBorder style={styles.loginCard}>
                            <View style={[styles.logoWrap, { backgroundColor: colors.primarySoft }]}>
                                <Zap size={30} color={colors.primary} />
                            </View>

                            <ThemedText type="subtitle" style={styles.title}>
                                Login
                            </ThemedText>

                            {/* NeonInput-style email field */}
                            <View style={styles.inputGroup}>
                                <ThemedText type="label" style={[styles.inputLabel, { color: colors.textMuted }]}>
                                    EMAIL
                                </ThemedText>
                                <View
                                    style={[
                                        styles.inputWrap,
                                        {
                                            backgroundColor: colors.inputBackground,
                                        },
                                    ]}
                                >
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="Enter your email"
                                        placeholderTextColor={colors.textSoft}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            {/* NeonInput-style password field */}
                            <View style={styles.inputGroup}>
                                <ThemedText type="label" style={[styles.inputLabel, { color: colors.textMuted }]}>
                                    PASSWORD
                                </ThemedText>
                                <View
                                    style={[
                                        styles.inputWrap,
                                        {
                                            backgroundColor: colors.inputBackground,
                                        },
                                    ]}
                                >
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="Enter your password"
                                        placeholderTextColor={colors.textSoft}
                                        secureTextEntry
                                        returnKeyType="done"
                                    />
                                </View>
                            </View>

                            <GradientButton
                                title="Login"
                                style={styles.loginButton}
                                onPress={handleContinue}
                            />
                        </NeoCard>
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
    loginCard: {
        paddingTop: 28,
    },
    logoWrap: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    title: {
        textAlign: 'center',
        marginTop: 18,
        marginBottom: 22,
    },
    inputGroup: {
        marginBottom: 14,
    },
    inputLabel: {
        marginBottom: 6,
        marginLeft: 4,
    },
    inputWrap: {
        borderRadius: RADIUS.input,
        minHeight: 56,
        justifyContent: 'center',
        paddingHorizontal: SPACING.md,
    },
    input: {
        ...FONTS.body,
    },
    loginButton: {
        marginTop: SPACING.sm,
    },
});
