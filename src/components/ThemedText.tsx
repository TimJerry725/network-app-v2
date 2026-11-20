import { Text, type TextProps, StyleSheet, useWindowDimensions, type TextStyle } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { FONTS } from '../constants/Tokens';

export type ThemedTextProps = TextProps & {
    lightColor?: string;
    darkColor?: string;
    neo3d?: boolean | number;
    type?:
        | 'default'
        | 'title'
        | 'defaultSemiBold'
        | 'subtitle'
        | 'link'
        | 'label'
        | 'caption'
        | 'eyebrow'
        | 'heroStat'
        | 'display'
        | 'editorial'
        | 'serif'
        | 'neo3d'
        | 'neo3dHero'
        | 'neo3dButton';
};

const SF_WEIGHTS: Record<string, TextStyle['fontWeight']> = {
    'SF-400': '400',
    'SF-500': '500',
    'SF-600': '600',
    'SF-700': '700',
    'SF-800': '800',
    'SF-900': '900',
};

const TYPE_SCALE = [11, 12, 13, 15, 17, 20, 22, 24, 28, 34, 40, 48];

/** One weight scale for the whole app: 400 body, 600 emphasis, 700 headings and numbers. */
function normalizeWeight(w: TextStyle['fontWeight']): TextStyle['fontWeight'] {
    const n = w === 'bold' ? 700 : w === 'normal' ? 400 : Number(w);
    if (!n) return '400';
    if (n <= 500) return '400';
    if (n <= 600) return '600';
    return '700';
}

/**
 * System font (SF Pro) with one type system: weight markers become fontWeight,
 * weights snap to 400/600/700, sizes snap to the type scale, tracking follows size.
 */
export function systemFont(style: TextStyle) {
    if (!style) return style;
    const out = { ...style } as { -readonly [K in keyof TextStyle]: TextStyle[K] };
    const fam = out.fontFamily;
    if (typeof fam === 'string' && SF_WEIGHTS[fam]) {
        out.fontWeight = SF_WEIGHTS[fam];
    }
    if (typeof fam === 'string' && (SF_WEIGHTS[fam] || fam.startsWith('SF-'))) out.fontFamily = undefined;
    if (out.fontWeight != null) out.fontWeight = normalizeWeight(out.fontWeight);
    if (typeof out.fontSize === 'number' && out.fontSize <= 48) {
        const fs = out.fontSize;
        out.fontSize = TYPE_SCALE.reduce((best, v) => (Math.abs(v - fs) < Math.abs(best - fs) || (Math.abs(v - fs) === Math.abs(best - fs) && v > best) ? v : best), TYPE_SCALE[0]);
        if (typeof out.lineHeight === 'number' && out.lineHeight < out.fontSize * 1.15) out.lineHeight = Math.ceil(out.fontSize * 1.25);
    }
    if (typeof out.fontSize === 'number' && out.letterSpacing != null) {
        out.letterSpacing = out.fontSize >= 28 ? -0.5 : out.fontSize >= 20 ? -0.3 : 0;
    }
    return out as TextStyle;
}

/** Scale type with screen width (390pt design baseline) so small phones don't clip and big ones stay balanced. */
function scaleType(style: TextStyle, width: number) {
    const k = Math.max(0.82, Math.min(1.12, width / 390));
    const out = { ...style } as { -readonly [K in keyof TextStyle]: TextStyle[K] };
    // Without an explicit line height, large text (and shrink-to-fit text) gets its tops clipped on iOS
    if (typeof out.fontSize === 'number' && out.lineHeight == null) out.lineHeight = Math.ceil(out.fontSize * 1.25);
    if (Math.abs(k - 1) < 0.02) return out;
    if (typeof out.fontSize === 'number') out.fontSize = Math.round(out.fontSize * k * 10) / 10;
    if (typeof out.lineHeight === 'number') out.lineHeight = Math.round(out.lineHeight * k * 10) / 10;
    if (typeof out.letterSpacing === 'number') out.letterSpacing = out.letterSpacing * k;
    return out;
}

export function ThemedText({
    style,
    lightColor,
    darkColor,
    type = 'default',
    neo3d,
    ...rest
}: ThemedTextProps) {
    const { theme, colors } = useAppTheme();
    const { width } = useWindowDimensions();
    const color = theme === 'light' ? lightColor ?? colors.text : darkColor ?? colors.text;

    return (
        <Text
            maxFontSizeMultiplier={1.25}
            style={scaleType(systemFont(StyleSheet.flatten([
                { color },
                type === 'default' ? styles.default : undefined,
                type === 'title' ? styles.title : undefined,
                type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
                type === 'subtitle' ? styles.subtitle : undefined,
                type === 'link' ? styles.link : undefined,
                type === 'label' ? styles.label : undefined,
                type === 'caption' ? styles.caption : undefined,
                type === 'eyebrow' ? styles.eyebrow : undefined,
                type === 'heroStat' ? styles.heroStat : undefined,
                type === 'display' ? styles.display : undefined,
                type === 'editorial' || type === 'serif' ? styles.editorial : undefined,
                type === 'neo3d' ? styles.neo3d : undefined,
                type === 'neo3dHero' ? styles.neo3dHero : undefined,
                type === 'neo3dButton' ? styles.neo3dButton : undefined,
                style,
            ]) as TextStyle), width)}
            {...(rest.numberOfLines === 1 ? { adjustsFontSizeToFit: true, minimumFontScale: 0.75 } : null)}
            {...rest}
        />
    );
}

const styles = StyleSheet.create({
    default: {
        ...FONTS.body,
    },
    defaultSemiBold: {
        ...FONTS.bodyStrong,
    },
    title: {
        ...FONTS.h1,
    },
    subtitle: {
        ...FONTS.h2,
    },
    link: {
        ...FONTS.bodyStrong,
    },
    label: {
        ...FONTS.label,
    },
    caption: {
        ...FONTS.caption,
    },
    eyebrow: {
        ...FONTS.eyebrow,
    },
    heroStat: {
        ...FONTS.heroStat,
    },
    display: {
        ...FONTS.display,
    },
    editorial: {
        ...FONTS.editorialTitle,
    },
    neo3d: {
        ...FONTS.neo3d,
    },
    neo3dHero: {
        ...FONTS.neo3dHero,
    },
    neo3dButton: {
        ...FONTS.neo3dButton,
    },
});
