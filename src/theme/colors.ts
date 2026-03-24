export type ThemePalette = {
  background: string;
  card: string;
  surface: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  danger: string;
  warning: string;
};

export const darkTheme: ThemePalette = {
  background: '#000000', // Pitch OLED Black
  card: 'rgba(255, 255, 255, 0.02)', // Extremely subtle phantom bounds
  surface: 'rgba(255, 255, 255, 0.05)',
  primary: '#8B5CF6', // Electric Violet
  primaryLight: '#A78BFA',
  primaryDark: '#6D28D9',
  secondary: '#FFFFFF', // Pure White Action
  text: '#FFFFFF',
  textMuted: '#71717A', // Deep Slate
  border: 'transparent', // Edgeless UI implies no literal borders
  success: '#10B981', // Emerald
  danger: '#EF4444', // Red
  warning: '#F59E0B',
};

export const lightTheme: ThemePalette = {
  background: '#FFFFFF', // Pure White
  card: 'rgba(0, 0, 0, 0.02)', 
  surface: 'rgba(0, 0, 0, 0.05)',
  primary: '#7C3AED', // Deeper Violet for light mode contrast
  primaryLight: '#8B5CF6',
  primaryDark: '#5B21B6',
  secondary: '#000000', // Pure Black Action
  text: '#09090B', 
  textMuted: '#A1A1AA', 
  border: 'transparent',
  success: '#059669', 
  danger: '#DC2626', 
  warning: '#D97706',
};

export type ThemeColors = ThemePalette;
