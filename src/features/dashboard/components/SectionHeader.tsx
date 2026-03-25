import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { typography } from '../../../theme/typography';

type SectionHeaderProps = {
  title: string;
  rightText?: string;
  onPressRight?: () => void;
};

export function SectionHeader({ title, rightText, onPressRight }: SectionHeaderProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {rightText ? (
        onPressRight ? (
          <TouchableOpacity onPress={onPressRight} activeOpacity={0.8}>
            <Text style={styles.right}>{rightText}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.right}>{rightText}</Text>
        )
      ) : null}
    </View>
  );
}

const createStyles = (colors: { [key: string]: string }) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 12,
    },
    title: {
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      fontSize: 10,
      letterSpacing: 1.5,
    },
    right: {
      fontFamily: typography.fonts.semibold,
      color: colors.primary,
      fontSize: 12,
    },
  });
