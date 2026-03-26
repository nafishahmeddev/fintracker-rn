import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';

export type HeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
};

export function Header({ title, subtitle, showBack, rightAction }: HeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </View>

      {rightAction ? (
        <View style={styles.rightActionWrap}>{rightAction}</View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: TYPOGRAPHY.fonts.heading,
    color: colors.text,
    fontSize: 28,
    letterSpacing: -1,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 0.1,
    marginTop: 2,
  },
  rightActionWrap: {
    justifyContent: 'center',
  },
});
