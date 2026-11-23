import React from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';

/** Shows the error on screen instead of letting the app close, so a startup problem can be read and reported. */
export function ErrorScreen({ error }: { error: unknown }) {
    const e = error as any;
    const message = String(e?.message ?? e ?? 'Unknown error');
    const stack = String(e?.stack ?? '');
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B0F' }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={{ color: '#FF6B6B', fontSize: 18, fontWeight: '800' }}>The app hit an error</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 14, marginTop: 12 }} selectable>{message}</Text>
                <View style={{ height: 12 }} />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }} selectable>{stack.slice(0, 2500)}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

export class CrashGuard extends React.Component<{ children: React.ReactNode }, { error: unknown }> {
    state = { error: null as unknown };
    static getDerivedStateFromError(error: unknown) {
        return { error };
    }
    render() {
        if (this.state.error) return <ErrorScreen error={this.state.error} />;
        return this.props.children;
    }
}
