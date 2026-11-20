import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '../../components/ThemedText';
import { AppLogo } from '../../components/AppLogo';
import { useAppTheme } from '../../hooks/useAppTheme';
const CAR_IMAGE = require('../../../assets/images/profile-car.webp');
import { FONT_FAMILIES } from '../../constants/Tokens';

export default function SplashScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const progress = useRef(new Animated.Value(0)).current;
    const fade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, duration: 700, delay: 300, useNativeDriver: true }),
            Animated.timing(progress, { toValue: 1, duration: 1900, useNativeDriver: false }),
        ]).start();
        const timer = setTimeout(() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            navigation.replace('Login');
        }, 2200);
        return () => clearTimeout(timer);
    }, [navigation, fade, progress]);

    const skip = () => navigation.replace('Login');

    return (
        <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Skip intro" onPress={skip} style={styles.skip}>
                <ThemedText style={[styles.skipText, { color: colors.primary }]}>Skip</ThemedText>
            </Pressable>
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <Animated.View style={{ opacity: fade, marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 28, paddingVertical: 8, alignItems: 'center' }}>
                    <Image source={CAR_IMAGE} style={{ width: width - 40, height: (width - 40) * 0.5 }} resizeMode="contain" />
                </Animated.View>
            </View>
            <Animated.View style={{ opacity: fade, alignItems: 'center', paddingHorizontal: 24 }}>
                <AppLogo width={150} height={31} solidColor={isDark ? '#FFFFFF' : '#000000'} />
                <ThemedText style={[styles.tag, { color: colors.textMuted }]}>Find. Charge. Pay. Done.</ThemedText>
                <View style={styles.track}>
                    <Animated.View style={[styles.fill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    skip: { alignSelf: 'flex-end', paddingHorizontal: 20, paddingVertical: 12, minHeight: 44 },
    skipText: { fontSize: 16, fontWeight: '600' },
    tag: { fontSize: 17, fontWeight: '500', marginTop: 12 },
    track: { width: 140, height: 4, borderRadius: 2, backgroundColor: 'rgba(120,120,128,0.2)', marginTop: 24, overflow: 'hidden' },
    fill: { height: 4, borderRadius: 2, backgroundColor: '#007AFF' },
});
