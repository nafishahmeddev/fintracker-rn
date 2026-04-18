import { BlurView } from '@sbaiahmed1/react-native-blur';
import React, { useMemo } from 'react';
import { StyleSheet, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export const Card = React.memo(function Card({ children, style }: CardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const blurStyle = useMemo(() => ({
    backgroundColor: Platform.OS === 'android' ? colors.card : 'transparent'
  }), [colors.card]);

  return (
    <BlurView
      blurAmount={Platform.OS === 'ios' ? 25 : 0}
      blurType={isDark ? "dark" : "light"}
      style={[styles.card, style, blurStyle]}
    >
      {children}
    </BlurView>
  );
});

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
