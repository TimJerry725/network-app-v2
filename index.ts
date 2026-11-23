import React from 'react';
import { registerRootComponent } from 'expo';
import { CrashGuard, ErrorScreen } from './src/components/CrashGuard';

// Load the app inside a guard so a startup error is shown on screen instead of closing the app.
let App: React.ComponentType | null = null;
let bootError: unknown = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    App = require('./App').default;
} catch (e) {
    bootError = e;
}

function Root() {
    if (bootError || !App) return React.createElement(ErrorScreen, { error: bootError ?? new Error('App failed to load') });
    return React.createElement(CrashGuard, null, React.createElement(App));
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => Root);
registerRootComponent(Root);
