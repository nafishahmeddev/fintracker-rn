import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { LIGHT_THEME, DARK_THEME, ThemeColors } from '../theme/colors';
import { useSettings } from './SettingsProvider';

type ThemeContextType = {
  colors: ThemeColors;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: DARK_THEME,
  isDark: true,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = React.memo(function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useSettings();
  const systemColorScheme = useColorScheme();

  const isDark = profile.theme === 'system'
    ? systemColorScheme === 'dark'
    : profile.theme === 'dark';

  const colors = useMemo(() => isDark ? DARK_THEME : LIGHT_THEME, [isDark]);

  const contextValue = useMemo(() => ({ colors, isDark }), [colors, isDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
});
