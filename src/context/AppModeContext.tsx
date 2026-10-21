import React, { createContext, useContext, useState } from 'react';

export type AppUIMode = 'ai' | 'bento';

interface AppModeContextType {
    mode: AppUIMode;
    setMode: (mode: AppUIMode) => void;
    toggleMode: () => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
    // On the dev/AI-style branch, default to AI mode with seamless switching to bento mode
    const [mode, setMode] = useState<AppUIMode>('ai');

    const toggleMode = () => {
        setMode((prev) => (prev === 'ai' ? 'bento' : 'ai'));
    };

    return (
        <AppModeContext.Provider value={{ mode, setMode, toggleMode }}>
            {children}
        </AppModeContext.Provider>
    );
}

export function useAppMode() {
    const context = useContext(AppModeContext);
    if (!context) {
        throw new Error('useAppMode must be used within an AppModeProvider');
    }
    return context;
}
