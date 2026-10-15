import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';
import {
    BatteryCharging,
    CheckCircle2,
    Clock,
    Coffee,
    Compass,
    Heart,
    History,
    Map,
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
import { RADIUS } from '../constants/Tokens';

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
 * Returns a crisp, unified Lucide icon across both unselected and selected states.
 */
export function getLucideIcon(
    name?: string,
    size: number = 20,
    color: string = '#8E8E93',
    isSelected: boolean = false
) {
    const strokeWidth = isSelected ? 2.4 : 1.8;
    const fillColor = isSelected ? color : 'none';

    switch (name) {
        case 'map':
        case 'map-location-dot':
            return <Map size={size} color={color} strokeWidth={strokeWidth} />;
        case 'map-pin':
            return <MapPin size={size} color={color} fill={fillColor} strokeWidth={strokeWidth} />;
        case 'explore':
        case 'compass':
            return <Compass size={size} color={color} strokeWidth={strokeWidth} />;
        case 'scan':
        case 'scan-line':
        case 'qr':
            return <ScanLine size={size} color={color} strokeWidth={strokeWidth} />;
        case 'heart':
        case 'favorite':
            return <Heart size={size} color={color} fill={fillColor} strokeWidth={strokeWidth} />;
        case 'history':
        case 'sessions':
        case 'clock-rotate-left':
            return <History size={size} color={color} strokeWidth={strokeWidth} />;
        case 'clock':
        case '24/7':
        case 'time':
            return <Clock size={size} color={color} strokeWidth={strokeWidth} />;
        case 'bolt':
        case 'zap':
        case 'bolt-lightning':
        case 'fast':
        case 'fastest':
            return <Zap size={size} color={color} fill={fillColor} strokeWidth={strokeWidth} />;
        case 'tag':
        case 'tags':
        case 'cheapest':
            return <Tag size={size} color={color} fill={fillColor} strokeWidth={strokeWidth} />;
        case 'check':
        case 'circle-check':
        case 'available':
            return <CheckCircle2 size={size} color={color} fill={fillColor} strokeWidth={strokeWidth} />;
        case 'coffee':
        case 'mug-hot':
        case 'amenities':
            return <Coffee size={size} color={color} strokeWidth={strokeWidth} />;
        case 'sliders':
        case 'sliders-horizontal':
        case 'filter':
            return <SlidersHorizontal size={size} color={color} strokeWidth={strokeWidth} />;
        case 'battery':
        case 'battery-charging':
        case 'charging':
            return <BatteryCharging size={size} color={color} strokeWidth={strokeWidth} />;
        case 'sparkles':
        case 'ultra':
            return <Sparkles size={size} color={color} fill={fillColor} strokeWidth={strokeWidth} />;
        case 'plug':
        case 'connector':
            return <Plug size={size} color={color} strokeWidth={strokeWidth} />;
        case 'trip':
        case 'trip-planner':
            return <MapPinned size={size} color={color} strokeWidth={strokeWidth} />;
        case 'shield':
        case 'security':
            return <ShieldCheck size={size} color={color} strokeWidth={strokeWidth} />;
        default:
            return <Zap size={size} color={color} fill={fillColor} strokeWidth={strokeWidth} />;
    }
}

export function getOutlinedIcon(name?: string, size: number = 20, color: string = '#8E8E93') {
    return getLucideIcon(name, size, color, false);
}

/**
 * Neo3DMorphIcon:
 * Unified Lucide icon component with smooth spring physics and optional neo-brutalist plate.
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
                {outlineIcon ?? getLucideIcon(name, size, mutedInactive, false)}
            </View>
        );
    }

    // ── SELECTED: 3D NEO-BRUTALIST TACTILE ICON ──
    const rendered3D = (
        <Animated.View
            style={[
                styles.layered3DWrap,
                { transform: [{ scale: bounceAnim }] },
                style,
            ]}
        >
            {selected3DIcon ?? getLucideIcon(name, size, primaryActive, true)}
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
    plate3DBase: {
        borderRadius: RADIUS.tile,
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
        borderRadius: RADIUS.circle,
    },
});
