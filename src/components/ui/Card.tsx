import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Card({ children, style }: CardProps) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <BlurView intensity={25} tint={isDark ? "dark" : "light"} style={[styles.card, style]}>
      {children}
    </BlurView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
});
