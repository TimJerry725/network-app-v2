import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, TextInputInstance, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LogIn } from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AuthShell } from '../../components/auth/AuthShell';
import { PulseButton } from '../../components/pulse/PulseKit';
import { useVehicles } from '../../context/VehicleContext';
import { FONT_FAMILIES } from '../../constants/Tokens';

const LENGTH = 4;
export const DEMO_OTP = '1234'; // demo only: nothing is sent by SMS
const RESEND_SECONDS = 30;

/** Step 2: verify the 4-digit code sent to the phone. */
export default function OtpScreen({ navigation, route }: any) {
    const { colors } = useAppTheme();
    const { updateUser } = useVehicles();
    const phone: string = route.params?.phone ?? '';

    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [left, setLeft] = useState(RESEND_SECONDS);
    const inputRef = useRef<TextInputInstance>(null);

    useEffect(() => {
        const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
        return () => clearInterval(t);
    }, []);

    const masked = phone.length === 10 ? `+91 ${phone.slice(0, 5)} ${phone.slice(5, 8)}…` : `+91 ${phone}`;

    const verify = () => {
        if (code.length !== LENGTH) return;
        if (code !== DEMO_OTP) {
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
            setError('Wrong code. Use the demo code shown below.');
            return;
        }
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        updateUser({ phone: `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` });
        navigation.navigate('ProfileSetup', { phone });
    };

    const resend = () => {
        if (left > 0) return;
        setLeft(RESEND_SECONDS);
        setCode('');
        setError('');
        inputRef.current?.focus();
    };

    return (
        <AuthShell
            step={2}
            title="Verify number"
            subtitle={`Enter the 4-digit code for ${masked}`}
            onBack={() => navigation.goBack()}
            footer={
                <PulseButton
                    variant="violet"
                    title="Verify and sign in"
                    icon={<LogIn size={18} color="#FFFFFF" />}
                    onPress={verify}
                    disabled={code.length !== LENGTH}
                />
            }
        >
            <Pressable accessibilityRole="button" accessibilityLabel="Enter code" onPress={() => inputRef.current?.focus()} style={styles.boxes}>
                {Array.from({ length: LENGTH }).map((_, i) => {
                    const digit = code[i] ?? '';
                    const active = i === code.length || (code.length === LENGTH && i === LENGTH - 1);
                    return (
                        <View
                            key={i}
                            style={[
                                styles.box,
                                { backgroundColor: colors.surface, borderColor: error ? colors.error : active ? colors.violet : digit ? colors.text : colors.border },
                            ]}
                        >
                            <ThemedText style={[styles.digit, { color: colors.text }]}>{digit}</ThemedText>
                        </View>
                    );
                })}
            </Pressable>

            {/* One hidden input captures the digits (also enables SMS autofill) */}
            <TextInput
                ref={inputRef}
                value={code}
                onChangeText={(t) => {
                    setCode(t.replace(/[^0-9]/g, '').slice(0, LENGTH));
                    setError('');
                }}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={LENGTH}
                autoFocus
                style={styles.hidden}
                accessibilityLabel="One-time code"
            />

            {error ? <ThemedText style={[styles.error, { color: colors.error }]}>{error}</ThemedText> : null}
            <View style={[styles.demo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ThemedText style={[styles.demoText, { color: colors.textMuted }]}>
                    Demo code: <ThemedText style={[styles.demoCode, { color: colors.text }]}>{DEMO_OTP}</ThemedText>
                </ThemedText>
            </View>

            <View style={styles.resendRow}>
                <ThemedText style={[styles.hint, { color: colors.textMuted, marginTop: 0 }]}>Did not receive the code?</ThemedText>
                <Pressable accessibilityRole="button" onPress={resend} disabled={left > 0} hitSlop={10}>
                    <ThemedText style={[styles.resend, { color: left > 0 ? colors.textSoft : colors.primary }]}>
                        {left > 0 ? `Resend in ${left}s` : 'Resend OTP'}
                    </ThemedText>
                </Pressable>
            </View>
        </AuthShell>
    );
}

const styles = StyleSheet.create({
    boxes: { flexDirection: 'row', gap: 12 },
    box: { flex: 1, height: 62, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    digit: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 26 },
    hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
    error: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13, marginTop: 12 },
    hint: { fontFamily: FONT_FAMILIES.medium, fontSize: 12.5, marginTop: 12 },
    demo: { marginTop: 16, borderRadius: 14, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 14, alignSelf: 'flex-start' },
    demoText: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13 },
    demoCode: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 15, letterSpacing: 3 },
    resendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 },
    resend: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 13.5 },
});
