import React from 'react';
import { StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import { FONT_FAMILIES } from '../constants/Tokens';
import { useAppTheme } from '../hooks/useAppTheme';

export interface Neo3DTextProps extends TextProps {
    children: React.ReactNode;
    depth?: number;
    shadowColor?: string;
    textColor?: string;
    variant?: 'sans' | 'serif' | 'editorial' | 'hero';
    size?: number;
    uppercase?: boolean;
    containerStyle?: ViewStyle;
}

/**
 * Neo-Brutalist 3D Pop Typography Component
 * 
 * Features:
 * - Hard, zero-blur extruded drop shadow block (`textShadowRadius: 0`)
 * - Multi-layer isometric step extrusion for deep hero letters/numbers
 * - Compatible with CRED Grotesque (Plus Jakarta Sans) and Editorial Serif (Cinzel / Playfair)
 */
export function Neo3DText({
    children,
    depth = 3,
    shadowColor,
    textColor,
    variant = 'sans',
    size,
    uppercase = false,
    style,
    containerStyle,
    ...rest
}: Neo3DTextProps) {
    const { isDark } = useAppTheme();

    const getFontFamily = () => {
        switch (variant) {
            case 'hero':
                return FONT_FAMILIES.serifDisplayBlack;
            case 'serif':
                return FONT_FAMILIES.serifDisplay;
            case 'editorial':
                return FONT_FAMILIES.serifHeading;
            case 'sans':
            default:
                return FONT_FAMILIES.sansExtraBold;
        }
    };

    const font = getFontFamily();
    const resolvedTextColor = textColor ?? (isDark ? '#FFFFFF' : '#070709');
    const resolvedShadowColor = shadowColor ?? '#000000';

    const customTextStyle: TextStyle = {
        fontFamily: font,
        fontWeight: '800',
        ...(size ? { fontSize: size } : {}),
        ...(uppercase ? { textTransform: 'uppercase' } : {}),
    };

    // If depth is 0 or disabled, render normal text
    if (depth <= 0) {
        return (
            <Text
                {...rest}
                style={[
                    styles.baseText,
                    customTextStyle,
                    { color: resolvedTextColor },
                    style,
                ]}
            >
                {children}
            </Text>
        );
    }

    // For intense 3D extrusion, layer background offset shadows
    return (
        <View style={[styles.inlineContainer, containerStyle]}>
            {/* Step 2 Back Extrusion Layer (if depth >= 4) */}
            {depth >= 4 && (
                <Text
                    {...rest}
                    style={[
                        styles.baseText,
                        customTextStyle,
                        styles.shadowLayer,
                        {
                            color: resolvedShadowColor,
                            left: depth,
                            top: depth,
                        },
                        style,
                    ]}
                    accessible={false}
                    aria-hidden
                >
                    {children}
                </Text>
            )}

            {/* Step 1 Intermediate Extrusion Layer (if depth >= 3) */}
            {depth >= 3 && (
                <Text
                    {...rest}
                    style={[
                        styles.baseText,
                        customTextStyle,
                        styles.shadowLayer,
                        {
                            color: resolvedShadowColor,
                            left: Math.round(depth * 0.5),
                            top: Math.round(depth * 0.5),
                        },
                        style,
                    ]}
                    accessible={false}
                    aria-hidden
                >
                    {children}
                </Text>
            )}

            {/* Foreground Face Layer with sharp zero-blur textShadow */}
            <Text
                {...rest}
                style={[
                    styles.baseText,
                    customTextStyle,
                    {
                        color: resolvedTextColor,
                        textShadowColor: resolvedShadowColor,
                        textShadowOffset: { width: Math.min(depth, 2), height: Math.min(depth, 2) },
                        textShadowRadius: 0,
                    },
                    style,
                ]}
            >
                {children}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    inlineContainer: {
        position: 'relative',
        alignSelf: 'flex-start',
    },
    baseText: {
        letterSpacing: 0.5,
    },
    shadowLayer: {
        position: 'absolute',
    },
});
