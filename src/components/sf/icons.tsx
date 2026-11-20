import React from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Lucide from 'lucide-react-native';

/**
 * SF Symbols icon layer.
 * Every icon in the app is an Apple SF Symbol on iOS. Other platforms (Android, web) fall back
 * to the matching line icon so the app still runs there. Props match the old icon API
 * (size, color, strokeWidth, fill, style), so screens keep working unchanged.
 */

export type IconProps = {
    size?: number;
    color?: string;
    strokeWidth?: number;
    fill?: string;
    style?: StyleProp<ViewStyle>;
};

type Weight = 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';

function weightFor(strokeWidth?: number): Weight {
    if (strokeWidth === undefined) return 'medium';
    if (strokeWidth <= 1.6) return 'regular';
    if (strokeWidth <= 2.3) return 'medium';
    if (strokeWidth <= 2.7) return 'semibold';
    return 'bold';
}

function make(lucideName: string, sf: string, sfFilled?: string) {
    const Fallback = (Lucide as any)[lucideName];
    function Icon({ size = 24, color = '#000000', strokeWidth, fill, style }: IconProps) {
        if (Platform.OS === 'ios') {
            const filled = !!fill && fill !== 'none' && !!sfFilled;
            return (
                <SymbolView
                    name={(filled ? sfFilled : sf) as any}
                    size={size}
                    tintColor={color}
                    type="monochrome"
                    weight={weightFor(strokeWidth)}
                    resizeMode="scaleAspectFit"
                    style={[{ width: size, height: size }, style as any]}
                />
            );
        }
        return Fallback ? <Fallback size={size} color={color} strokeWidth={strokeWidth} fill={fill} style={style} /> : null;
    }
    Icon.displayName = lucideName;
    return Icon;
}

export const ArrowDownLeft = make('ArrowDownLeft', 'arrow.down.left');
export const ArrowLeftRight = make('ArrowLeftRight', 'arrow.left.arrow.right');
export const ArrowRight = make('ArrowRight', 'arrow.right');
export const ArrowUpRight = make('ArrowUpRight', 'arrow.up.right');
export const Bath = make('Bath', 'toilet');
export const BatteryCharging = make('BatteryCharging', 'battery.100.bolt');
export const BedDouble = make('BedDouble', 'bed.double');
export const Bell = make('Bell', 'bell', 'bell.fill');
export const BellRing = make('BellRing', 'bell.badge', 'bell.badge.fill');
export const Bookmark = make('Bookmark', 'bookmark', 'bookmark.fill');
export const BookmarkCheck = make('BookmarkCheck', 'bookmark.fill', 'bookmark.fill');
export const Camera = make('Camera', 'camera', 'camera.fill');
export const Car = make('Car', 'car', 'car.fill');
export const Check = make('Check', 'checkmark');
export const CheckCircle2 = make('CheckCircle2', 'checkmark.circle', 'checkmark.circle.fill');
export const ChevronDown = make('ChevronDown', 'chevron.down');
export const ChevronLeft = make('ChevronLeft', 'chevron.left');
export const ChevronRight = make('ChevronRight', 'chevron.right');
export const ChevronUp = make('ChevronUp', 'chevron.up');
export const CircleCheck = make('CircleCheck', 'checkmark.circle', 'checkmark.circle.fill');
export const CircleGauge = make('CircleGauge', 'gauge.medium');
export const Clock = make('Clock', 'clock', 'clock.fill');
export const Clock3 = make('Clock3', 'clock', 'clock.fill');
export const Coffee = make('Coffee', 'cup.and.saucer', 'cup.and.saucer.fill');
export const Compass = make('Compass', 'safari', 'safari.fill');
export const Cpu = make('Cpu', 'cpu');
export const CreditCard = make('CreditCard', 'creditcard', 'creditcard.fill');
export const Crown = make('Crown', 'crown', 'crown.fill');
export const Download = make('Download', 'arrow.down.to.line');
export const Eye = make('Eye', 'eye', 'eye.fill');
export const Filter = make('Filter', 'line.3.horizontal.decrease');
export const Flag = make('Flag', 'flag', 'flag.fill');
export const Flashlight = make('Flashlight', 'flashlight.on.fill');
export const FlashlightOff = make('FlashlightOff', 'flashlight.off.fill');
export const Gauge = make('Gauge', 'gauge.medium');
export const Heart = make('Heart', 'heart', 'heart.fill');
export const History = make('History', 'clock.arrow.circlepath');
export const Home = make('Home', 'house', 'house.fill');
export const House = make('House', 'house', 'house.fill');
export const Info = make('Info', 'info.circle', 'info.circle.fill');
export const Keyboard = make('Keyboard', 'keyboard');
export const Landmark = make('Landmark', 'building.columns');
export const Layers = make('Layers', 'square.3.layers.3d');
export const Leaf = make('Leaf', 'leaf', 'leaf.fill');
export const LifeBuoy = make('LifeBuoy', 'lifepreserver', 'lifepreserver.fill');
export const LocateFixed = make('LocateFixed', 'location', 'location.fill');
export const Lock = make('Lock', 'lock', 'lock.fill');
export const LogIn = make('LogIn', 'rectangle.portrait.and.arrow.right');
export const LogOut = make('LogOut', 'rectangle.portrait.and.arrow.right');
export const Map = make('Map', 'map', 'map.fill');
export const MapPin = make('MapPin', 'mappin');
export const MapPinned = make('MapPinned', 'mappin.and.ellipse');
export const Mic = make('Mic', 'mic', 'mic.fill');
export const Minus = make('Minus', 'minus');
export const Moon = make('Moon', 'moon', 'moon.fill');
export const Navigation = make('Navigation', 'location.north', 'location.north.fill');
export const Pencil = make('Pencil', 'pencil');
export const Plug = make('Plug', 'powerplug', 'powerplug.fill');
export const Plus = make('Plus', 'plus');
export const Receipt = make('Receipt', 'doc.text', 'doc.text.fill');
export const Repeat = make('Repeat', 'arrow.triangle.2.circlepath');
export const RotateCcw = make('RotateCcw', 'arrow.counterclockwise');
export const Route = make('Route', 'point.topleft.down.to.point.bottomright.curvepath');
export const ScanLine = make('ScanLine', 'qrcode.viewfinder');
export const Search = make('Search', 'magnifyingglass');
export const Share2 = make('Share2', 'square.and.arrow.up');
export const ShieldCheck = make('ShieldCheck', 'checkmark.shield', 'checkmark.shield.fill');
export const ShoppingBag = make('ShoppingBag', 'bag', 'bag.fill');
export const SlidersHorizontal = make('SlidersHorizontal', 'slider.horizontal.3');
export const Smartphone = make('Smartphone', 'iphone');
export const Sofa = make('Sofa', 'sofa', 'sofa.fill');
export const Sparkles = make('Sparkles', 'sparkles');
export const Square = make('Square', 'square', 'square.fill');
export const Star = make('Star', 'star', 'star.fill');
export const Store = make('Store', 'storefront', 'storefront.fill');
export const Sun = make('Sun', 'sun.max', 'sun.max.fill');
export const Tag = make('Tag', 'tag', 'tag.fill');
export const Ticket = make('Ticket', 'ticket', 'ticket.fill');
export const Trash2 = make('Trash2', 'trash', 'trash.fill');
export const User = make('User', 'person', 'person.fill');
export const Utensils = make('Utensils', 'fork.knife');
export const Wallet = make('Wallet', 'wallet.pass', 'wallet.pass.fill');
export const Wifi = make('Wifi', 'wifi');
export const X = make('X', 'xmark');
export const Zap = make('Zap', 'bolt', 'bolt.fill');
export const Headphones = make('Headphones', 'headphones');
export const Image = make('Image', 'photo', 'photo.fill');
