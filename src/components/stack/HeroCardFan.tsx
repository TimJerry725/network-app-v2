import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { FONT_FAMILIES } from '../../constants/Tokens';
import { CardChip, SkinCard, SKINS } from './StackKit';

const CAR_IMAGE = require('../../../assets/images/profile-car.webp');

/**
 * Three cards that fan out on mount: wallet pass, live charge, car.
 * Used on splash and login so the very first screen says "your charging lives in a wallet".
 */
export function HeroCardFan({ width, animate = true }: { width: number; animate?: boolean }) {
    const t = useRef(new Animated.Value(animate ? 0 : 1)).current;

    useEffect(() => {
        if (!animate) return;
        Animated.spring(t, { toValue: 1, useNativeDriver: true, tension: 40, friction: 7, delay: 150 } as any).start();
    }, [animate, t]);

    const cardW = Math.min(300, width * 0.74);
    const cardH = cardW / 1.586;

    const layer = (rot: number, dx: number, dy: number) => ({
        transform: [
            { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [40, dy] }) },
            { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${rot}deg`] }) },
        ],
        opacity: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
    });

    return (
        <View style={{ height: cardH + 70, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
            <Animated.View style={[styles.abs, { width: cardW, height: cardH }, layer(-12, -34, 10)]}>
                <SkinCard skin="paper" pattern="none">
                    <View style={styles.pad}>
                        <ThemedText style={[styles.kind, { color: SKINS.paper.sub }]}>MY CAR</ThemedText>
                        <Image source={CAR_IMAGE} style={{ width: cardW * 0.8, height: cardH * 0.62, alignSelf: 'center' }} resizeMode="contain" />
                    </View>
                </SkinCard>
            </Animated.View>
            <Animated.View style={[styles.abs, { width: cardW, height: cardH }, layer(9, 36, 0)]}>
                <SkinCard skin="lime">
                    <View style={styles.pad}>
                        <ThemedText style={[styles.kind, { color: SKINS.lime.sub }]}>● CHARGING</ThemedText>
                        <ThemedText style={[styles.big, { color: '#0B0B0F' }]}>82%</ThemedText>
                    </View>
                </SkinCard>
            </Animated.View>
            <Animated.View style={[styles.abs, { width: cardW, height: cardH }, layer(-2, 0, -14)]}>
                <SkinCard skin="violet">
                    <View style={styles.pad}>
                        <View style={styles.row}>
                            <CardChip />
                            <ThemedText style={[styles.kind, { color: SKINS.violet.sub }]}>IRIS PASS</ThemedText>
                        </View>
                        <ThemedText style={[styles.number, { color: '#FFFFFF' }]}>••••  ••••  7729</ThemedText>
                    </View>
                </SkinCard>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    abs: { position: 'absolute' },
    pad: { padding: 16, flex: 1 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    kind: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 10.5, letterSpacing: 1.3 },
    big: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 52, letterSpacing: -2, marginTop: 'auto' },
    number: { fontFamily: FONT_FAMILIES.extraBold, fontSize: 18, letterSpacing: 2.4, marginTop: 'auto' },
});
