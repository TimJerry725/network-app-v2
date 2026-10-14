import React, { useEffect, useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../constants/Tokens';
import { useAppTheme } from '../hooks/useAppTheme';

const GRACE_PERIOD_SECONDS = 10 * 60;

export type PostChargeGraceSession = {
    stationName: string;
    connectorLabel: string;
    chargeEndedAtMs: number;
    isChargerPluggedIn: boolean;
    vehicleName?: string;
};

type PostChargeGraceModalProps = {
    session: PostChargeGraceSession | null;
    visible: boolean;
    onDismiss: () => void;
};

function formatDuration(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function PostChargeGraceModal({
    session,
    visible,
    onDismiss,
}: PostChargeGraceModalProps) {
    const { colors } = useAppTheme();
    const [nowMs, setNowMs] = useState(Date.now());

    useEffect(() => {
        if (!visible) {
            return undefined;
        }

        setNowMs(Date.now());
        const intervalId = setInterval(() => setNowMs(Date.now()), 1000);

        return () => clearInterval(intervalId);
    }, [visible]);

    const elapsedSeconds = session
        ? Math.max(0, Math.floor((nowMs - session.chargeEndedAtMs) / 1000))
        : 0;
    const graceRemainingSeconds = Math.max(0, GRACE_PERIOD_SECONDS - elapsedSeconds);
    const graceExceededSeconds = Math.max(0, elapsedSeconds - GRACE_PERIOD_SECONDS);
    const isGraceActive = elapsedSeconds <= GRACE_PERIOD_SECONDS;
    const timerLabel = isGraceActive
        ? 'Grace time left'
        : 'Grace time over';
    const timerValue = isGraceActive
        ? formatDuration(graceRemainingSeconds)
        : formatDuration(graceExceededSeconds);
    const statusTone = isGraceActive ? colors.primary : colors.error;

    if (!session || !session.isChargerPluggedIn) {
        return null;
    }

    return (
        <Modal
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={onDismiss}
        >
            <View style={styles.backdrop}>
                <Pressable
                    style={styles.dismissLayer}
                    onPress={onDismiss}
                />
                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: colors.card,
                        },
                    ]}
                >
                    <ThemedText style={styles.title}>Grace period</ThemedText>

                    <View style={styles.timerBlock}>
                        <ThemedText style={[styles.timerLabel, { color: statusTone }]}>
                            {timerLabel}
                        </ThemedText>
                        <ThemedText style={[styles.timerValue, { color: statusTone }]}>
                            {timerValue}
                        </ThemedText>
                    </View>

                    <View
                        style={[
                            styles.feeNote,
                            {
                                backgroundColor: colors.surfaceMuted,
                            },
                        ]}
                    >
                        <ThemedText style={[styles.feeTitle, { color: colors.text }]}>
                            After grace period
                        </ThemedText>
                        <ThemedText style={[styles.feeText, { color: colors.textMuted }]}>
                            ₹10 for 10 min
                        </ThemedText>
                        <ThemedText style={[styles.feeText, { color: colors.textMuted }]}>
                            ₹20 for another 10 min
                        </ThemedText>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
        backgroundColor: 'rgba(8, 17, 12, 0.58)',
    },
    dismissLayer: {
        ...StyleSheet.absoluteFill,
    },
    card: {
        width: '100%',
        maxWidth: 340,
        borderRadius: RADIUS.bottomSheet,
        borderWidth: 0,
        padding: SPACING.lg,
        alignItems: 'center',
    },
    title: {
        ...FONTS.h3,
        textAlign: 'center',
    },
    timerBlock: {
        width: '100%',
        marginTop: SPACING.md,
        alignItems: 'center',
    },
    timerLabel: {
        ...FONTS.bodyStrong,
        textAlign: 'center',
    },
    timerValue: {
        ...FONTS.h1,
        fontSize: 48,
        lineHeight: 56,
        marginTop: 10,
        fontVariant: ['tabular-nums'],
    },
    feeNote: {
        width: '100%',
        marginTop: SPACING.md,
        borderWidth: 0,
        borderRadius: RADIUS.card,
        padding: SPACING.md,
        alignItems: 'center',
    },
    feeTitle: {
        ...FONTS.bodyStrong,
        textAlign: 'center',
        marginBottom: 8,
    },
    feeText: {
        ...FONTS.body,
        textAlign: 'center',
    },
});
