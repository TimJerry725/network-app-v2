import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, {
    Defs,
    Ellipse,
    G,
    LinearGradient,
    Path,
    Rect,
    Stop,
} from 'react-native-svg';

export interface RetroAppIconProps {
    size?: number;
    style?: StyleProp<ViewStyle>;
}

/**
 * Playful Retro-Futuristic App Icon
 * Implements the lightning bolt with celestial orbital ring from the design board.
 */
export function RetroAppIcon({ size = 72, style }: RetroAppIconProps) {
    const rx = Math.round(size * 0.24);

    return (
        <View style={[{ width: size, height: size }, style]}>
            <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
                <Defs>
                    {/* Deep Space Squircle Gradient */}
                    <LinearGradient id="iconBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                        <Stop offset="0" stopColor="#1E40AF" />
                        <Stop offset="0.45" stopColor="#3B82F6" />
                        <Stop offset="1" stopColor="#1D4ED8" />
                    </LinearGradient>

                    {/* Lightning Bolt Pure White to Cyan Glow */}
                    <LinearGradient id="boltGrad" x1="50" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
                        <Stop offset="0" stopColor="#FFFFFF" />
                        <Stop offset="0.6" stopColor="#E0F2FE" />
                        <Stop offset="1" stopColor="#22D3EE" />
                    </LinearGradient>

                    {/* Orbit Ring Gradient */}
                    <LinearGradient id="orbitGrad" x1="20" y1="30" x2="80" y2="70" gradientUnits="userSpaceOnUse">
                        <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
                        <Stop offset="0.5" stopColor="#22D3EE" stopOpacity="0.8" />
                        <Stop offset="1" stopColor="#60A5FA" stopOpacity="0.4" />
                    </LinearGradient>
                </Defs>

                {/* Rounded Icon Squircle Background */}
                <Rect x="0" y="0" width="100" height="100" rx={rx} fill="url(#iconBg)" />

                {/* Subtle Inner Border */}
                <Rect
                    x="1"
                    y="1"
                    width="98"
                    height="98"
                    rx={rx - 1}
                    stroke="rgba(255, 255, 255, 0.35)"
                    strokeWidth="1.5"
                />

                {/* Outer Celestial Orbital Ring (Tilted Oval) */}
                <G transform="rotate(-22 50 50)">
                    <Ellipse
                        cx="50"
                        cy="50"
                        rx="40"
                        ry="16"
                        stroke="url(#orbitGrad)"
                        strokeWidth="3.2"
                        fill="none"
                    />

                    {/* Four-Point Sparkle on Upper-Right of Orbit */}
                    <Path
                        d="M86 44 C 86 48, 88 50, 92 50 C 88 50, 86 52, 86 56 C 86 52, 84 50, 80 50 C 84 50, 86 48, 86 44 Z"
                        fill="#FFFFFF"
                    />
                </G>

                {/* Central Futuristic Electric Lightning Bolt */}
                <Path
                    d="M56 16 L34 50 L48 50 L42 84 L68 46 L53 46 Z"
                    fill="url(#boltGrad)"
                />

                {/* Soft Lightning Specular Highlight */}
                <Path
                    d="M54 20 L38 48 L48 48 L44 76 L48 50 L36 50 Z"
                    fill="rgba(255, 255, 255, 0.45)"
                />
            </Svg>
        </View>
    );
}

export default RetroAppIcon;
