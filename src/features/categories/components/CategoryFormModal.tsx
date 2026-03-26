import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../../constants/picker';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { TYPOGRAPHY } from '../../../theme/typography';
import { Category } from '../api/categories';
import { useCreateCategory, useUpdateCategory } from '../hooks/categories';

type CategoryFormValues = {
  name: string;
};

export type CategoryFormModalProps = {
  visible: boolean;
  onClose: () => void;
  category?: Category;
};

export function CategoryFormModal({ visible, onClose, category }: CategoryFormModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEditing = !!category;
  const ModalWrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;

  const { mutateAsync: createCategory } = useCreateCategory();
  const { mutateAsync: updateCategory } = useUpdateCategory();

  const [type, setType] = useState<'CR' | 'DR'>('DR');
  const [icon, setIcon] = useState<string>(CATEGORY_ICONS[0]);
  const [colorHex, setColorHex] = useState<string>(CATEGORY_COLORS[0]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CategoryFormValues>({
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (!visible) return;

    if (category) {
      reset({
        name: category.name,
      });
      setType(category.type);
      setIcon(typeof category.icon === 'string' ? category.icon : CATEGORY_ICONS[0]);
      setColorHex(`#${category.color.toString(16).padStart(6, '0').toUpperCase()}`);
      return;
    }

    reset({ name: '' });
    setType('DR');
    setIcon(CATEGORY_ICONS[0]);
    setColorHex(CATEGORY_COLORS[0]);
  }, [category, visible, reset]);

  const handleSave = handleSubmit(async (data) => {
    const payload = {
      name: data.name.trim(),
      type,
      icon,
      color: parseInt(colorHex.replace('#', ''), 16),
    };

    try {
      if (isEditing && category) {
        await updateCategory({ id: category.id, data: payload });
      } else {
        await createCategory(payload);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <ModalWrapper
        style={styles.overlay}
        {...(Platform.OS === 'ios' ? { behavior: 'padding' as const, keyboardVerticalOffset: 0 } : {})}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={[styles.glow, { top: -70, left: -70, width: 330, height: 330, backgroundColor: colors.primary + '2E' }]} />
            <View style={[styles.glow, { top: 260, right: -140, width: 480, height: 480, backgroundColor: colors.text + '0E' }]} />
            <View style={[styles.glow, { bottom: -90, left: 40, width: 320, height: 320, backgroundColor: colors.primary + '1C' }]} />
          </View>

          <BlurView
            blurAmount={Platform.OS === 'ios' ? 80 : 96}
            blurType={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />

          {Platform.OS === 'android' && (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background + '60' }]}
            />
          )}

          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{isEditing ? 'Edit Category' : 'New Category'}</Text>
              <Text style={styles.subtitle}>Make your transaction groups clear and clean</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeTabsRow}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => !isEditing && setType('DR')}
                  disabled={isEditing}
                  style={[styles.typeTab, type === 'DR' && styles.typeTabActive]}
                >
                  <Text style={[styles.typeTabText, type === 'DR' && styles.typeTabTextActive]}>EXPENSE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => !isEditing && setType('CR')}
                  disabled={isEditing}
                  style={[styles.typeTab, type === 'CR' && styles.typeTabActive]}
                >
                  <Text style={[styles.typeTabText, type === 'CR' && styles.typeTabTextActive]}>INCOME</Text>
                </TouchableOpacity>
              </View>
              {isEditing && <Text style={styles.lockHint}>Type cannot be changed for existing categories</Text>}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Name</Text>
              <Controller
                control={control}
                name="name"
                rules={{ required: 'Category name is required' }}
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Groceries"
                    placeholderTextColor={colors.textMuted + '50'}
                    autoFocus={!isEditing}
                    style={styles.answerInput}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                )}
              />
              <View style={[styles.answerLine, errors.name && styles.answerLineError]} />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Icon</Text>
              <View style={styles.iconGrid}>
                {CATEGORY_ICONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.9}
                    onPress={() => setIcon(item)}
                    style={[
                      styles.iconCell,
                      icon === item && { backgroundColor: colorHex, borderColor: colorHex },
                      icon === item && styles.iconCellActive,
                    ]}
                  >
                    <Ionicons name={item as any} size={18} color={icon === item ? '#000100' : colors.text} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.section, styles.sectionLast]}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {CATEGORY_COLORS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.9}
                    onPress={() => setColorHex(item)}
                    style={[
                      styles.colorCell,
                      { backgroundColor: item },
                      colorHex === item && styles.colorCellActive,
                    ]}
                  >
                    {colorHex === item ? <Ionicons name="checkmark" size={14} color="#000100" /> : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View
            style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, Platform.OS === 'ios' ? 36 : 22) }]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
              onPress={handleSave}
              disabled={!isValid}
            >
              <Text style={styles.primaryBtnText}>{isEditing ? 'Save Category' : 'Create Category'}</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ModalWrapper>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    backdrop: {
      flex: 1,
    },
    sheet: {
      height: '86%',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      borderTopWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      backgroundColor: 'transparent',
    },
    glow: {
      position: 'absolute',
      borderRadius: 999,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 3,
      borderRadius: 999,
      marginTop: 12,
      marginBottom: 8,
      backgroundColor: colors.textMuted + '44',
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 6,
      paddingBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    title: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 30,
      color: colors.text,
      letterSpacing: -1,
    },
    subtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 3,
    },
    closeBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: 20,
    },
    scroll: {
      flex: 1,
    },
    section: {
      paddingBottom: 22,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 22,
    },
    sectionLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    label: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 13,
      color: colors.textMuted,
      letterSpacing: 0.1,
      marginBottom: 6,
    },
    answerInput: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 28,
      lineHeight: 34,
      color: colors.text,
      letterSpacing: -0.7,
      paddingHorizontal: 0,
      paddingVertical: 4,
    },
    answerLine: {
      height: 2,
      borderRadius: 999,
      backgroundColor: colors.primary + '55',
      marginTop: 4,
    },
    answerLineError: {
      backgroundColor: colors.danger + '88',
    },
    typeTabsRow: {
      flexDirection: 'row',
      gap: 6,
      alignSelf: 'flex-start',
    },
    typeTab: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colors.background + 'AA',
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    typeTabActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    typeTabText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 11,
      color: colors.textMuted,
      letterSpacing: 0.4,
    },
    typeTabTextActive: {
      color: colors.background,
    },
    lockHint: {
      marginTop: 8,
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    iconCell: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: colors.text + '10',
      backgroundColor: colors.background + 'B8',
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconCellActive: {},
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorCell: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 2,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorCellActive: {
      borderColor: colors.text,
      transform: [{ scale: 1.08 }],
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: Platform.OS === 'ios' ? 36 : 22,
      backgroundColor: colors.background + 'F2',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    primaryBtn: {
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 5,
    },
    primaryBtnDisabled: {
      opacity: 0.45,
    },
    primaryBtnText: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 14,
      color: '#FFFFFF',
      letterSpacing: 0.3,
      marginRight: 10,
    },
  });
