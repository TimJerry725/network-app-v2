import { Text, type TextProps, StyleSheet } from 'react-native';
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

export function ThemedText({
    style,
    lightColor,
    darkColor,
    type = 'default',
    neo3d,
    ...rest
}: ThemedTextProps) {
    const { theme, colors } = useAppTheme();
    const color = theme === 'light' ? lightColor ?? colors.text : darkColor ?? colors.text;

    const neo3dOffset = typeof neo3d === 'number' ? neo3d : 2;
    const neo3dStyle = neo3d ? {
        textShadowColor: '#000000',
        textShadowOffset: { width: neo3dOffset, height: neo3dOffset },
        textShadowRadius: 0,
    } : undefined;

    return (
        <Text
            style={[
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
                neo3dStyle,
                style,
            ]}
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
