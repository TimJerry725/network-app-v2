import React, { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AuthShell, authStyles } from '../../components/auth/AuthShell';
import { PulseButton } from '../../components/pulse/PulseKit';
import { FONT_FAMILIES } from '../../constants/Tokens';

/** Step 1: sign in with a phone number. */
export default function LoginScreen({ navigation }: any) {
    const { colors } = useAppTheme();
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');

    const valid = phone.length === 10;

    // Demo sign-in: no SMS is sent. The code is fixed (see OtpScreen).
    const getOtp = () => {
        if (!valid) return;
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        navigation.navigate('Otp', { phone });
    };

    return (
        <AuthShell
            step={1}
            title="Sign in"
            subtitle="Enter your mobile number to continue."
            footer={
                <PulseButton
                    variant="violet"
                    title="Get OTP"
                    onPress={getOtp}
                    disabled={!valid}
                />
            }
        >
            <ThemedText style={[authStyles.label, { color: colors.text, marginTop: 0 }]}>Phone number</ThemedText>
            <View style={styles.row}>
                <View style={[styles.country, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ThemedText style={styles.flag}>🇮🇳</ThemedText>
                    <ThemedText style={[styles.code, { color: colors.text }]}>+91</ThemedText>
                </View>
                <TextInput
                    value={phone}
                    onChangeText={(t) => {
                        setPhone(t.replace(/[^0-9]/g, '').slice(0, 10));
                        setError('');
                    }}
                    keyboardType="number-pad"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    placeholderTextColor={colors.textSoft}
                    maxLength={10}
                    style={[authStyles.input, styles.phone, { color: colors.text, backgroundColor: colors.surface, borderColor: phone.length > 0 && !valid ? colors.border : valid ? colors.violet : colors.border }]}
                    accessibilityLabel="Phone number"
                />
            </View>
            {error ? <ThemedText style={[styles.error, { color: colors.error }]}>{error}</ThemedText> : null}
            <ThemedText style={[styles.hint, { color: colors.textMuted }]}>By continuing you agree to the Terms and Privacy Policy.</ThemedText>
        </AuthShell>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 10 },
    country: { height: 54, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
    flag: { fontSize: 20 },
    code: { fontFamily: FONT_FAMILIES.bold, fontSize: 15 },
    phone: { flex: 1, letterSpacing: 1 },
    error: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13, marginTop: 8 },
    hint: { fontFamily: FONT_FAMILIES.medium, fontSize: 12.5, marginTop: 14 },
});
