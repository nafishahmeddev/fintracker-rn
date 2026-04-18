import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useCallback } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';

type IconName = keyof typeof Ionicons.glyphMap;

export type OptionsDialogOption = {
  key: string;
  label: string;
  icon?: IconName;
  selected?: boolean;
  destructive?: boolean;
  closeOnPress?: boolean;
  onPress: () => void;
};

type OptionsDialogProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: OptionsDialogOption[];
  closeLabel?: string;
};

export const OptionsDialog = React.memo(function OptionsDialog({
  visible,
  onClose,
  title,
  subtitle,
  options,
  closeLabel = 'Close',
}: OptionsDialogProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleOptionPress = useCallback((option: OptionsDialogOption) => {
    if (option.closeOnPress !== false) {
      onClose();
    }
    option.onPress();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.optionsWrap}>
            {options.map((option) => {
              const selected = !!option.selected;
              const iconColor = selected
                ? colors.background
                : option.destructive
                  ? colors.danger
                  : colors.textMuted;

              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionRow,
                    selected && styles.optionRowActive,
                    option.destructive && !selected && styles.optionRowDestructive,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => handleOptionPress(option)}
                >
                  {option.icon ? (
                    <View style={[styles.optionIconWrap, selected && styles.optionIconWrapActive]}>
                      <Ionicons name={option.icon} size={16} color={iconColor} />
                    </View>
                  ) : null}

                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextActive,
                      option.destructive && !selected && styles.optionTextDestructive,
                    ]}
                  >
                    {option.label}
                  </Text>

                  {selected ? <Ionicons name="checkmark" size={16} color={colors.background} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.9}>
            <Text style={styles.closeButtonText}>{closeLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.52)',
      justifyContent: 'flex-end',
      paddingHorizontal: 24,
      paddingBottom: 42,
    },
    card: {
      alignSelf: 'stretch',
      borderRadius: 22,
      backgroundColor: Platform.OS === 'ios' ? colors.background + 'F2' : colors.background,
      borderWidth: 1,
      borderColor: colors.text + '18',
      padding: 18,
      shadowColor: '#000000',
      shadowOpacity: 0.22,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    },
    title: {
      fontFamily: TYPOGRAPHY.fonts.headingRegular,
      fontSize: 24,
      color: colors.text,
      letterSpacing: -0.6,
    },
    subtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
      marginBottom: 16,
    },
    optionsWrap: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    optionRow: {
      height: 48,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.text + '10',
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionRowActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    optionRowDestructive: {
      borderColor: colors.danger + '35',
      backgroundColor: colors.danger + '10',
    },
    optionIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.background + 'CC',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    optionIconWrapActive: {
      backgroundColor: colors.background + '66',
    },
    optionText: {
      flex: 1,
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 13,
      color: colors.text,
    },
    optionTextActive: {
      color: colors.background,
    },
    optionTextDestructive: {
      color: colors.danger,
    },
    closeButton: {
      marginTop: 8,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary + '22',
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 14,
      color: colors.text,
    },
  });
