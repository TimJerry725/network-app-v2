import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, {
    Circle,
    Defs,
    Ellipse,
    G,
    LinearGradient,
    Path,
    RadialGradient,
    Rect,
    Stop,
} from 'react-native-svg';

export type MascotExpression = 'happy' | 'wink' | 'chill';

export interface RetroMascotProps {
    size?: number;
    expression?: MascotExpression;
    showCable?: boolean;
    animated?: boolean;
    style?: StyleProp<ViewStyle>;
}

/**
 * Volt — The Playful Retro-Futuristic EV Charging Mascot
 * Designed per the Playful Retro-Futurism design specification.
 */
export function RetroMascot({
    size = 140,
    expression = 'happy',
    showCable = true,
    animated = true,
    style,
}: RetroMascotProps) {
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!animated) return;

        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -8,
                    duration: 1600,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 1600,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();

        return () => loop.stop();
    }, [animated, floatAnim]);

    const scale = size / 200;

    return (
        <Animated.View
            style={[
                styles.container,
                { width: size, height: size * 1.1 },
                animated && { transform: [{ translateY: floatAnim }] },
                style,
            ]}
        >
            <Svg width={size} height={size * 1.1} viewBox="0 0 200 220" fill="none">
                <Defs>
                    {/* Helmet White Gradient */}
                    <LinearGradient id="helmetGrad" x1="50" y1="20" x2="150" y2="120" gradientUnits="userSpaceOnUse">
                        <Stop offset="0" stopColor="#FFFFFF" />
                        <Stop offset="0.7" stopColor="#E2E8F0" />
                        <Stop offset="1" stopColor="#CBD5E1" />
                    </LinearGradient>

                    {/* Visor Deep Cosmic Gradient */}
                    <LinearGradient id="visorGrad" x1="100" y1="40" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                        <Stop offset="0" stopColor="#0B1E3B" />
                        <Stop offset="0.6" stopColor="#102548" />
                        <Stop offset="1" stopColor="#07152B" />
                    </LinearGradient>

                    {/* Electric Blue Suit Gradient */}
                    <LinearGradient id="blueGrad" x1="70" y1="110" x2="130" y2="180" gradientUnits="userSpaceOnUse">
                        <Stop offset="0" stopColor="#60A5FA" />
                        <Stop offset="0.5" stopColor="#3B82F6" />
                        <Stop offset="1" stopColor="#2563EB" />
                    </LinearGradient>

                    {/* Cyan Glow Gradient */}
                    <RadialGradient id="cyanGlow" cx="50%" cy="50%" r="50%">
                        <Stop offset="0" stopColor="#22D3EE" stopOpacity="0.8" />
                        <Stop offset="1" stopColor="#22D3EE" stopOpacity="0" />
                    </RadialGradient>

                    {/* Mint Energy Gradient */}
                    <LinearGradient id="mintEnergy" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#22D3A7" />
                        <Stop offset="1" stopColor="#059669" />
                    </LinearGradient>
                </Defs>

                {/* 1. Ambient Thruster Glow (Under Base) */}
                <Ellipse cx="100" cy="195" rx="35" ry="10" fill="url(#cyanGlow)" />
                <Ellipse cx="100" cy="190" rx="18" ry="5" fill="#22D3EE" opacity="0.6" />

                {/* 2. Coiled Charging Cable (Behind Body) */}
                {showCable && (
                    <Path
                        d="M35 140 C 15 170, 30 205, 80 200 C 120 196, 175 205, 170 160 C 166 125, 140 135, 130 145"
                        stroke="#1E293B"
                        strokeWidth="7"
                        strokeLinecap="round"
                    />
                )}
                {showCable && (
                    <Path
                        d="M35 140 C 15 170, 30 205, 80 200 C 120 196, 175 205, 170 160 C 166 125, 140 135, 130 145"
                        stroke="#38BDF8"
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity="0.8"
                    />
                )}

                {/* 3. Mascot Body / Torso */}
                <G>
                    {/* Main White Body Torso */}
                    <Ellipse cx="100" cy="148" rx="34" ry="32" fill="url(#helmetGrad)" />

                    {/* Electric Blue Lower Suit & Belt */}
                    <Path
                        d="M72 152 C 72 174, 128 174, 128 152 C 128 168, 120 182, 100 182 C 80 182, 72 168, 72 152 Z"
                        fill="url(#blueGrad)"
                    />

                    {/* Chest Lightning Emblem */}
                    <Circle cx="100" cy="145" r="14" fill="#3B82F6" />
                    <Circle cx="100" cy="145" r="14" stroke="#22D3EE" strokeWidth="1.5" />
                    <Path
                        d="M101 136 L94 146 L100 146 L98 154 L107 143 L101 143 Z"
                        fill="#FBBF24"
                    />
                </G>

                {/* 4. Left Arm with EV Charging Gun */}
                <G>
                    {/* Left Arm (Reaching forward) */}
                    <Path
                        d="M72 140 C 55 138, 40 145, 34 140"
                        stroke="#CBD5E1"
                        strokeWidth="13"
                        strokeLinecap="round"
                    />
                    <Circle cx="72" cy="140" r="8" fill="#3B82F6" />

                    {/* Charging Handle / Gun */}
                    <Rect x="20" y="128" width="18" height="22" rx="4" fill="#1E293B" transform="rotate(-15 29 139)" />
                    <Rect x="26" y="122" width="14" height="8" rx="2" fill="#3B82F6" transform="rotate(-15 29 139)" />
                    {/* Plug Pins & Glow */}
                    <Circle cx="24" cy="122" r="4" fill="#22D3A7" />
                    <Circle cx="24" cy="122" r="7" fill="#22D3A7" opacity="0.4" />
                </G>

                {/* 5. Right Arm (Friendly Wave) */}
                <G>
                    <Path
                        d="M128 140 C 145 135, 155 125, 162 112"
                        stroke="#CBD5E1"
                        strokeWidth="13"
                        strokeLinecap="round"
                    />
                    <Circle cx="128" cy="140" r="8" fill="#3B82F6" />
                    {/* Hand Glove */}
                    <Circle cx="163" cy="110" r="9" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
                    <Circle cx="166" cy="107" r="4" fill="#3B82F6" />
                </G>

                {/* 6. Helmet Ear Pods (Left & Right) */}
                <G>
                    {/* Left Pod */}
                    <Rect x="36" y="55" width="14" height="26" rx="7" fill="#3B82F6" />
                    <Rect x="40" y="60" width="6" height="16" rx="3" fill="#22D3EE" />

                    {/* Right Pod */}
                    <Rect x="150" y="55" width="14" height="26" rx="7" fill="#3B82F6" />
                    <Rect x="154" y="60" width="6" height="16" rx="3" fill="#22D3EE" />
                </G>

                {/* 7. Rounded Helmet Dome */}
                <Circle cx="100" cy="68" r="54" fill="url(#helmetGrad)" />

                {/* 8. Top Antenna with Four-Point Glowing Star */}
                <G>
                    <Rect x="97" y="10" width="6" height="8" rx="3" fill="#3B82F6" />
                    {/* 4-Point Star Sparkle */}
                    <Path
                        d="M100 0 C 100 5, 102 7, 107 7 C 102 7, 100 9, 100 14 C 100 9, 98 7, 93 7 C 98 7, 100 5, 100 0 Z"
                        fill="#22D3EE"
                    />
                    <Circle cx="100" cy="7" r="8" fill="url(#cyanGlow)" />
                </G>

                {/* 9. Cosmic Visor */}
                <G>
                    <Rect
                        x="56"
                        y="38"
                        width="88"
                        height="58"
                        rx="28"
                        fill="url(#visorGrad)"
                        stroke="#3B82F6"
                        strokeWidth="3"
                    />

                    {/* Visor Top Specular Reflection Highlight */}
                    <Path
                        d="M68 45 C 80 41, 120 41, 132 45"
                        stroke="rgba(255, 255, 255, 0.45)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />

                    {/* 10. Expressive LED Eyes & Mouth */}
                    {expression === 'happy' && (
                        <G>
                            {/* Left Happy Curved Eye */}
                            <Path
                                d="M74 65 C 74 58, 86 58, 86 65"
                                stroke="#22D3EE"
                                strokeWidth="4.5"
                                strokeLinecap="round"
                            />
                            {/* Right Happy Curved Eye */}
                            <Path
                                d="M114 65 C 114 58, 126 58, 126 65"
                                stroke="#22D3EE"
                                strokeWidth="4.5"
                                strokeLinecap="round"
                            />
                            {/* Cute Cyan Blush */}
                            <Circle cx="72" cy="72" r="3.5" fill="#22D3A7" opacity="0.6" />
                            <Circle cx="128" cy="72" r="3.5" fill="#22D3A7" opacity="0.6" />
                            {/* Gentle LED Smile */}
                            <Path
                                d="M96 75 C 98 78, 102 78, 104 75"
                                stroke="#22D3EE"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                        </G>
                    )}

                    {expression === 'wink' && (
                        <G>
                            {/* Left Open Joyful Eye */}
                            <Ellipse cx="80" cy="63" rx="5" ry="6" fill="#22D3EE" />
                            <Circle cx="78" cy="61" r="2" fill="#FFFFFF" />
                            {/* Right Winking Eye */}
                            <Path
                                d="M114 65 C 117 62, 123 62, 126 65"
                                stroke="#22D3EE"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                            {/* Cute Cyan Blush */}
                            <Circle cx="72" cy="72" r="3.5" fill="#FBBF24" opacity="0.8" />
                            <Circle cx="128" cy="72" r="3.5" fill="#22D3A7" opacity="0.6" />
                            {/* Playful Smirk */}
                            <Path
                                d="M96 74 C 99 78, 105 76, 106 74"
                                stroke="#22D3EE"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                        </G>
                    )}

                    {expression === 'chill' && (
                        <G>
                            {/* Left Relaxed Eye */}
                            <Path
                                d="M74 65 L86 65"
                                stroke="#22D3EE"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                            {/* Right Relaxed Eye */}
                            <Path
                                d="M114 65 L126 65"
                                stroke="#22D3EE"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                            {/* Soft Smile */}
                            <Path
                                d="M96 73 C 98 76, 102 76, 104 73"
                                stroke="#22D3EE"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </G>
                    )}
                </G>
            </Svg>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default RetroMascot;
