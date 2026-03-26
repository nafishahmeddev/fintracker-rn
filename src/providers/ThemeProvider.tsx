import React, { createContext, useContext } from 'react';
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

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile } = useSettings();
  const systemColorScheme = useColorScheme();
  
  const isDark = profile.theme === 'system' 
    ? systemColorScheme === 'dark' 
    : profile.theme === 'dark';
    
  const colors = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};
