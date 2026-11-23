import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ChevronLeft } from './sf/icons';
import { GlassButton } from './glass/Glass';
import { useAppTheme } from '../hooks/useAppTheme';

/** Round back button for the top-left of a screen. */
export function BackButton({ onPress }: { onPress: () => void }) {
    const { colors } = useAppTheme();
    return (
        <View style={styles.wrap}>
            <GlassButton label="Back" size={48} onPress={onPress}>
                <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
            </GlassButton>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { alignItems: 'flex-start', marginBottom: 12 },
});
