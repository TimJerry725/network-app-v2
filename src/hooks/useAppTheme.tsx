import React, { createContext, useContext, useState } from 'react';
import { Colors, ThemeName } from '../constants/Colors';

type ThemeContextType = {
    theme: ThemeName;
    colors: typeof Colors[ThemeName];
    isDark: boolean;
    setTheme: (theme: ThemeName) => void;
};

const DEFAULT_THEME: ThemeName = 'light' as ThemeName;

const ThemeContext = createContext<ThemeContextType>({
    theme: DEFAULT_THEME,
    colors: Colors[DEFAULT_THEME],
    isDark: DEFAULT_THEME === 'dark',
    setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<ThemeName>(DEFAULT_THEME);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                colors: Colors[theme],
                isDark: theme === 'dark',
                setTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export function useAppTheme() {
    return useContext(ThemeContext);
}
