import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AuthShell, authStyles } from '../../components/auth/AuthShell';
import { PulseButton } from '../../components/pulse/PulseKit';
import { useVehicles } from '../../context/VehicleContext';
import { FONT_FAMILIES } from '../../constants/Tokens';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Step 3: my profile (name, mobile, email). */
export default function ProfileSetupScreen({ navigation, route }: any) {
    const { colors } = useAppTheme();
    const { updateUser } = useVehicles();
    const phone: string = route.params?.phone ?? '';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [touched, setTouched] = useState(false);

    const nameOk = name.trim().length >= 2;
    const emailOk = EMAIL_RE.test(email.trim());
    const valid = nameOk && emailOk;

    const next = () => {
        setTouched(true);
        if (!valid) return;
        updateUser({ fullName: name.trim(), email: email.trim(), phone: `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` });
        navigation.navigate('AddVehicle');
    };

    const border = (ok: boolean, hasValue: boolean) => (touched && !ok ? colors.error : ok && hasValue ? colors.violet : colors.border);

    return (
        <AuthShell
            step={3}
            title="My profile"
            subtitle="Tell us who is driving. We use this for your receipts."
            onBack={() => navigation.goBack()}
            footer={<PulseButton variant="violet" title="Save & proceed" onPress={next} disabled={!valid} />}
        >
            <ThemedText style={[authStyles.label, { color: colors.text, marginTop: 0 }]}>Name *</ThemedText>
            <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textSoft}
                autoCapitalize="words"
                autoComplete="name"
                style={[authStyles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: border(nameOk, name.length > 0) }]}
                accessibilityLabel="Name"
            />
            {touched && !nameOk ? <ThemedText style={[styles.error, { color: colors.error }]}>Enter your full name</ThemedText> : null}

            <ThemedText style={[authStyles.label, { color: colors.text }]}>Mobile number *</ThemedText>
            <View style={[styles.readonly, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                <ThemedText style={styles.flag}>🇮🇳</ThemedText>
                <ThemedText style={[styles.phone, { color: colors.textMuted }]}>+91 {phone.slice(0, 5)} {phone.slice(5)}</ThemedText>
            </View>

            <ThemedText style={[authStyles.label, { color: colors.text }]}>Email address *</ThemedText>
            <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSoft}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={[authStyles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: border(emailOk, email.length > 0) }]}
                accessibilityLabel="Email address"
            />
            {touched && !emailOk ? <ThemedText style={[styles.error, { color: colors.error }]}>Enter a valid email address</ThemedText> : null}
        </AuthShell>
    );
}

const styles = StyleSheet.create({
    readonly: { height: 54, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
    flag: { fontSize: 20 },
    phone: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 16 },
    error: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 12.5, marginTop: 6 },
});
