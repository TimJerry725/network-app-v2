import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '../../components/ThemedText';
import { AppLogo } from '../../components/AppLogo';
const CAR_IMAGE = require('../../../assets/images/profile-car.webp');
import { FONT_FAMILIES } from '../../constants/Tokens';

export default function SplashScreen({ navigation }: any) {
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
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Skip intro" onPress={skip} style={styles.skip}>
                <ThemedText style={styles.skipText}>Skip</ThemedText>
            </Pressable>
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <Animated.View style={{ opacity: fade, marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 28, paddingVertical: 10, alignItems: 'center' }}>
                    <Image source={CAR_IMAGE} style={{ width: width - 40, height: (width - 40) * 0.5 }} resizeMode="contain" />
                </Animated.View>
            </View>
            <Animated.View style={{ opacity: fade, alignItems: 'center', paddingHorizontal: 24 }}>
                <AppLogo width={150} height={31} solidColor="#FFFFFF" />
                <ThemedText style={styles.tag}>Find. Charge. Pay. Done.</ThemedText>
                <View style={styles.track}>
                    <Animated.View style={[styles.fill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0B0B0F' },
    skip: { alignSelf: 'flex-end', paddingHorizontal: 20, paddingVertical: 12, minHeight: 44 },
    skipText: { fontFamily: FONT_FAMILIES.bold, fontSize: 14, color: 'rgba(255,255,255,0.6)' },
    tag: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 12 },
    track: { width: 140, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 24, overflow: 'hidden' },
    fill: { height: 4, borderRadius: 2, backgroundColor: '#A996FF' },
});
