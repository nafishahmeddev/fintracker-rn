import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, ThemeColors } from '../theme/colors';
import { useSettings } from './SettingsProvider';

type ThemeContextType = {
  colors: ThemeColors;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: darkTheme,
  isDark: true,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile } = useSettings();
  const systemColorScheme = useColorScheme();
  
  const isDark = profile.theme === 'system' 
    ? systemColorScheme === 'dark' 
    : profile.theme === 'dark';
    
  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};
