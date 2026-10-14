import React from 'react';
import {
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewProps,
    ViewStyle,
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { RADIUS } from '../../constants/Tokens';

type MaterialCardProps = ViewProps & {
    mode?: 'elevated' | 'filled' | 'outlined';
    compact?: boolean;
};

export function MaterialCard({
    children,
    style,
    mode = 'elevated',
    compact = false,
    ...props
}: MaterialCardProps) {
    const { colors } = useAppTheme();

    return (
        <View
            style={[
                styles.card,
                compact ? styles.cardCompact : null,
                mode === 'elevated'
                    ? {
                          backgroundColor: colors.surface,
                          borderColor: 'transparent',
                      }
                    : null,
                mode === 'filled'
                    ? {
                          backgroundColor: colors.surfaceMuted,
                          borderColor: 'transparent',
                      }
                    : null,
                mode === 'outlined'
                    ? {
                          backgroundColor: colors.surfaceMuted,
                          borderColor: 'transparent',
                      }
                    : null,
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
}

type MaterialButtonProps = TouchableOpacityProps & {
    label: string;
    icon?: React.ReactNode;
    mode?: 'filled' | 'tonal' | 'outlined' | 'text';
    compact?: boolean;
    align?: 'center' | 'start';
};

export function MaterialButton({
    label,
    icon,
    mode = 'filled',
    compact = false,
    align = 'center',
    style,
    disabled,
    ...props
}: MaterialButtonProps) {
    const { colors } = useAppTheme();

    const containerStyle: StyleProp<ViewStyle> = [
        styles.button,
        compact ? styles.buttonCompact : null,
        align === 'start' ? styles.buttonAlignStart : null,
        mode === 'filled'
            ? {
                  backgroundColor: colors.primary,
              }
            : null,
        mode === 'tonal'
            ? {
                  backgroundColor: colors.primarySoft,
              }
            : null,
        mode === 'outlined'
            ? {
                  backgroundColor: colors.surfaceMuted,
              }
            : null,
        mode === 'text'
            ? {
                  backgroundColor: 'transparent',
              }
            : null,
        disabled ? styles.buttonDisabled : null,
        style,
    ];

    const labelColor =
        mode === 'filled' ? '#FFFFFF' : mode === 'tonal' ? colors.primaryStrong : colors.text;

    return (
        <TouchableOpacity
            activeOpacity={0.86}
            disabled={disabled}
            style={containerStyle}
            {...props}
        >
            {icon}
            <ThemedText
                style={[
                    styles.buttonLabel,
                    compact ? styles.buttonLabelCompact : null,
                    { color: labelColor },
                    icon ? styles.buttonLabelWithIcon : null,
                ]}
            >
                {label}
            </ThemedText>
        </TouchableOpacity>
    );
}

type MaterialIconButtonProps = TouchableOpacityProps & {
    icon: React.ReactNode;
    mode?: 'filled' | 'tonal' | 'outlined';
    compact?: boolean;
};

export function MaterialIconButton({
    icon,
    mode = 'outlined',
    compact = false,
    style,
    ...props
}: MaterialIconButtonProps) {
    const { colors } = useAppTheme();

    return (
        <TouchableOpacity
            activeOpacity={0.84}
            style={[
                styles.iconButton,
                compact ? styles.iconButtonCompact : null,
                mode === 'filled'
                    ? {
                          backgroundColor: colors.primary,
                      }
                    : null,
                mode === 'tonal'
                    ? {
                          backgroundColor: colors.primarySoft,
                      }
                    : {
                          backgroundColor: colors.surfaceMuted,
                      },
                style,
            ]}
            {...props}
        >
            {icon}
        </TouchableOpacity>
    );
}

type MaterialChipProps = ViewProps & {
    label: string;
    icon?: React.ReactNode;
    tone?: 'default' | 'tonal' | 'success' | 'warning' | 'error';
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
};

export function MaterialChip({
    label,
    icon,
    tone = 'default',
    backgroundColor,
    borderColor,
    textColor,
    style,
    ...props
}: MaterialChipProps) {
    const { colors } = useAppTheme();

    const chipColors =
        tone === 'tonal'
            ? { backgroundColor: colors.primarySoft, textColor: colors.primaryStrong }
            : tone === 'success'
              ? { backgroundColor: colors.primarySoft, textColor: colors.primaryStrong }
              : tone === 'warning'
                ? { backgroundColor: 'rgba(185, 125, 21, 0.16)', textColor: colors.warning }
                : tone === 'error'
                  ? { backgroundColor: 'rgba(200, 79, 71, 0.16)', textColor: colors.error }
                  : { backgroundColor: colors.surfaceMuted, textColor: colors.textMuted };

    return (
        <View
            style={[
                styles.chip,
                {
                    backgroundColor: backgroundColor ?? chipColors.backgroundColor,
                },
                style,
            ]}
            {...props}
        >
            {icon}
            <ThemedText
                style={[
                    styles.chipLabel,
                    { color: textColor ?? chipColors.textColor },
                    icon ? styles.chipLabelWithIcon : null,
                ]}
            >
                {label}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: RADIUS.card,
        borderWidth: 0,
        padding: 16,
    },
    cardCompact: {
        borderRadius: RADIUS.card,
        padding: 12,
    },
    button: {
        minHeight: 52,
        borderRadius: RADIUS.button,
        borderWidth: 0,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonCompact: {
        minHeight: 42,
        borderRadius: RADIUS.button,
        paddingHorizontal: 14,
    },
    buttonAlignStart: {
        justifyContent: 'flex-start',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    buttonLabelCompact: {
        fontSize: 14,
    },
    buttonLabelWithIcon: {
        marginLeft: 8,
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.button,
        borderWidth: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconButtonCompact: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.button,
    },
    chip: {
        borderRadius: RADIUS.chip,
        borderWidth: 0,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    chipLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
    chipLabelWithIcon: {
        marginLeft: 6,
    },
});
