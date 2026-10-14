import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import {
    BatteryCharging,
    CheckCircle2,
    Clock,
    Coffee,
    Compass,
    Heart,
    History,
    MapPin,
    MapPinned,
    Plug,
    ScanLine,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    Tag,
    Zap,
} from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';

export interface Neo3DMorphIconProps {
    name?: string;
    outlineIcon?: React.ReactNode;
    selected3DIcon?: React.ReactNode;
    isSelected: boolean;
    size?: number;
    activeColor?: string;
    inactiveColor?: string;
    show3DPlate?: boolean;
    style?: ViewStyle;
}

/**
 * Returns a crisp, wireframe OUTLINED icon from lucide-react-native for unselected state
 */
export function getOutlinedIcon(name?: string, size: number = 20, color: string = '#8E8E93') {
    switch (name) {
        case 'map':
        case 'map-location-dot':
        case 'map-pin':
            return <MapPin size={size} color={color} strokeWidth={1.8} />;
        case 'explore':
        case 'compass':
            return <Compass size={size} color={color} strokeWidth={1.8} />;
        case 'scan':
        case 'scan-line':
        case 'qr':
            return <ScanLine size={size} color={color} strokeWidth={1.9} />;
        case 'heart':
        case 'favorite':
            return <Heart size={size} color={color} strokeWidth={1.8} />;
        case 'history':
        case 'sessions':
        case 'clock-rotate-left':
            return <History size={size} color={color} strokeWidth={1.8} />;
        case 'clock':
        case '24/7':
        case 'time':
            return <Clock size={size} color={color} strokeWidth={1.8} />;
        case 'bolt':
        case 'zap':
        case 'bolt-lightning':
        case 'fast':
        case 'fastest':
            return <Zap size={size} color={color} strokeWidth={1.8} />;
        case 'tag':
        case 'tags':
        case 'cheapest':
            return <Tag size={size} color={color} strokeWidth={1.8} />;
        case 'check':
        case 'circle-check':
        case 'available':
            return <CheckCircle2 size={size} color={color} strokeWidth={1.8} />;
        case 'coffee':
        case 'mug-hot':
        case 'amenities':
            return <Coffee size={size} color={color} strokeWidth={1.8} />;
        case 'sliders':
        case 'sliders-horizontal':
        case 'filter':
            return <SlidersHorizontal size={size} color={color} strokeWidth={1.8} />;
        case 'battery':
        case 'battery-charging':
        case 'charging':
            return <BatteryCharging size={size} color={color} strokeWidth={1.8} />;
        case 'sparkles':
        case 'ultra':
            return <Sparkles size={size} color={color} strokeWidth={1.8} />;
        case 'plug':
        case 'connector':
            return <Plug size={size} color={color} strokeWidth={1.8} />;
        case 'trip':
        case 'trip-planner':
            return <MapPinned size={size} color={color} strokeWidth={1.8} />;
        case 'shield':
        case 'security':
            return <ShieldCheck size={size} color={color} strokeWidth={1.8} />;
        default:
            return <Zap size={size} color={color} strokeWidth={1.8} />;
    }
}

/**
 * Returns FontAwesome6 solid glyph name for 3D depth rendering
 */
function getSolidGlyphName(name?: string): string {
    switch (name) {
        case 'map':
        case 'map-location-dot':
        case 'map-pin':
            return 'map-location-dot';
        case 'explore':
        case 'compass':
            return 'compass';
        case 'scan':
        case 'scan-line':
        case 'qr':
        case 'bolt':
        case 'zap':
        case 'bolt-lightning':
        case 'fast':
        case 'fastest':
            return 'bolt-lightning';
        case 'heart':
        case 'favorite':
            return 'heart';
        case 'history':
        case 'sessions':
        case 'clock-rotate-left':
            return 'clock-rotate-left';
        case 'clock':
        case '24/7':
        case 'time':
            return 'clock';
        case 'tag':
        case 'tags':
        case 'cheapest':
            return 'tags';
        case 'check':
        case 'circle-check':
        case 'available':
            return 'circle-check';
        case 'coffee':
        case 'mug-hot':
        case 'amenities':
            return 'mug-hot';
        case 'sliders':
        case 'sliders-horizontal':
        case 'filter':
            return 'sliders';
        case 'battery':
        case 'battery-charging':
        case 'charging':
            return 'battery-full';
        case 'sparkles':
        case 'ultra':
            return 'wand-magic-sparkles';
        case 'plug':
        case 'connector':
            return 'plug';
        case 'trip':
        case 'trip-planner':
            return 'map-location-dot';
        case 'shield':
        case 'security':
            return 'shield-halved';
        default:
            return name || 'bolt';
    }
}

/**
 * Neo3DMorphIcon:
 * - Unselected: Clean, wireframe OUTLINED icon package (lucide-react-native)
 * - Selected: Morphs into a tactile 3D Neo-Brutalist icon with spring bounce,
 *   dual-layer relief (offset drop-shadow + solid foreground), and optional 3D beveled plate.
 */
export function Neo3DMorphIcon({
    name = 'bolt',
    outlineIcon,
    selected3DIcon,
    isSelected,
    size = 20,
    activeColor,
    inactiveColor,
    show3DPlate = false,
    style,
}: Neo3DMorphIconProps) {
    const { isDark } = useAppTheme();
    const primaryActive = activeColor ?? (isDark ? '#000000' : '#FFFFFF');
    const mutedInactive = inactiveColor ?? (isDark ? '#8E8E93' : '#6B6B70');

    // Spring bounce physics on selection transition
    const bounceAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isSelected) {
            Animated.sequence([
                Animated.spring(bounceAnim, {
                    toValue: 1.18,
                    tension: 340,
                    friction: 10,
                    useNativeDriver: true,
                }),
                Animated.spring(bounceAnim, {
                    toValue: 1.0,
                    tension: 200,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isSelected, bounceAnim]);

    if (!isSelected) {
        // ── UNSELECTED: WIREFRAME OUTLINE ICON ──
        return (
            <View style={[styles.outlineWrap, style]}>
                {outlineIcon ?? getOutlinedIcon(name, size, mutedInactive)}
            </View>
        );
    }

    // ── SELECTED: 3D NEO-BRUTALIST TACTILE ICON ──
    const solidGlyph = getSolidGlyphName(name);

    const rendered3D = (
        <Animated.View
            style={[
                styles.layered3DWrap,
                { transform: [{ scale: bounceAnim }] },
                style,
            ]}
        >
            {selected3DIcon ?? (
                <FontAwesome6
                    name={solidGlyph}
                    size={size}
                    color={primaryActive}
                    style={styles.frontGlyph}
                    solid
                />
            )}
        </Animated.View>
    );

    if (show3DPlate) {
        return (
            <View
                style={[
                    styles.plate3DBase,
                    {
                        backgroundColor: isDark ? '#FFFFFF' : '#000000',
                        borderColor: isDark ? '#FFFFFF' : '#000000',
                        borderBottomColor: isDark ? '#A0A0A8' : '#222228',
                        width: size + 24,
                        height: size + 16,
                    },
                ]}
            >
                {/* Specular top reflection line */}
                <View style={styles.plateSpecular} />
                {rendered3D}
                {/* Active indicator micro-dot */}
                <View
                    style={[
                        styles.plateActiveDot,
                        { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
                    ]}
                />
            </View>
        );
    }

    return rendered3D;
}

const styles = StyleSheet.create({
    outlineWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    layered3DWrap: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shadowGlyph: {
        position: 'absolute',
        top: 2,
        left: 1,
    },
    frontGlyph: {
        // crisp foreground layer
    },
    plate3DBase: {
        borderRadius: 12,
        borderWidth: 1.5,
        borderBottomWidth: 3.5,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    plateSpecular: {
        position: 'absolute',
        top: 0,
        left: 4,
        right: 4,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 1,
    },
    plateActiveDot: {
        position: 'absolute',
        bottom: 2,
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
});
