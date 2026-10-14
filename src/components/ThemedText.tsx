import { Text, type TextProps, StyleSheet } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { FONTS } from '../constants/Tokens';

export type ThemedTextProps = TextProps & {
    lightColor?: string;
    darkColor?: string;
    type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'label' | 'caption' | 'eyebrow' | 'heroStat' | 'display';
};

export function ThemedText({
    style,
    lightColor,
    darkColor,
    type = 'default',
    ...rest
}: ThemedTextProps) {
    const { theme, colors } = useAppTheme();
    const color = theme === 'light' ? lightColor ?? colors.text : darkColor ?? colors.text;

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
});
