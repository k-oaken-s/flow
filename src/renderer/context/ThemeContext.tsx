import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('light');
    const [isInitialized, setIsInitialized] = useState(false);

    // 初期テーマの設定
    useEffect(() => {
        let mounted = true;

        const handleThemeToggle = (isDark: boolean) => {
            if (mounted) {
                setTheme(isDark ? 'dark' : 'light');
                setIsInitialized(true);
            }
        };

        // メインプロセスからの初期テーマ設定を待つ
        const unsubscribe = window.electronAPI.onMenuToggleTheme(handleThemeToggle);

        // マウント時に初期テーマを要求
        window.electronAPI.requestInitialTheme?.().then((isDark: boolean) => {
            if (mounted) {
                setTheme(isDark ? 'dark' : 'light');
                setIsInitialized(true);
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    // テーマの適用
    useEffect(() => {
        if (isInitialized) {
            document.documentElement.classList.toggle('dark', theme === 'dark');
            window.electronAPI.notifyThemeChanged(theme === 'dark');
        }
    }, [theme, isInitialized]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};