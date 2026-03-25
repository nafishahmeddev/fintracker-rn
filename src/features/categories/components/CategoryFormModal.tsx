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
  TouchableOpacity,
  View,
} from 'react-native';
import { Input } from '../../../components/ui/Input';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../../constants/picker';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { Category } from '../api/categories';
import { useCreateCategory, useUpdateCategory } from '../hooks/categories';

type CategoryFormValues = {
  name: string;
  budget: string;
};

export type CategoryFormModalProps = {
  visible: boolean;
  onClose: () => void;
  category?: Category;
};

export function CategoryFormModal({ visible, onClose, category }: CategoryFormModalProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEditing = !!category;
  const iconCellSize = 48;
  const swatchSize = iconCellSize;

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
    defaultValues: { name: '', budget: '' },
  });

  useEffect(() => {
    if (!visible) return;

    if (category) {
      reset({
        name: category.name,
        budget: category.budget > 0 ? String(category.budget) : '',
      });
      setType(category.type);
      setIcon(typeof category.icon === 'string' ? category.icon : CATEGORY_ICONS[0]);
      setColorHex(`#${category.color.toString(16).padStart(6, '0').toUpperCase()}`);
      return;
    }

    reset({ name: '', budget: '' });
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
      budget: data.budget.trim() ? parseFloat(data.budget) : undefined,
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
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

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.label}>Name</Text>
              <Controller
                control={control}
                name="name"
                rules={{ required: 'Category name is required' }}
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Groceries"
                    autoFocus={!isEditing}
                    style={styles.formInput}
                    error={errors.name?.message}
                  />
                )}
              />

              <Text style={[styles.label, styles.labelSpaced]}>Monthly Budget (Optional)</Text>
              <Controller
                control={control}
                name="budget"
                rules={{
                  validate: (v) =>
                    !v.trim() || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0) || 'Enter a valid budget',
                }}
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    style={styles.formInput}
                    error={errors.budget?.message}
                  />
                )}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => !isEditing && setType('DR')}
                  disabled={isEditing}
                  style={[styles.typeBtn, type === 'DR' && styles.typeBtnDanger]}
                >
                  <Ionicons name="arrow-down-circle-outline" size={16} color={type === 'DR' ? colors.danger : colors.textMuted} />
                  <Text style={[styles.typeBtnText, type === 'DR' && styles.typeBtnTextDanger]}>Expense</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => !isEditing && setType('CR')}
                  disabled={isEditing}
                  style={[styles.typeBtn, type === 'CR' && styles.typeBtnSuccess]}
                >
                  <Ionicons name="arrow-up-circle-outline" size={16} color={type === 'CR' ? colors.success : colors.textMuted} />
                  <Text style={[styles.typeBtnText, type === 'CR' && styles.typeBtnTextSuccess]}>Income</Text>
                </TouchableOpacity>
              </View>
              {isEditing && <Text style={styles.lockHint}>Type cannot be changed for existing categories</Text>}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Icon</Text>
              <View style={styles.iconGrid}>
                {CATEGORY_ICONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.9}
                    onPress={() => setIcon(item)}
                    style={[styles.iconCell, { width: iconCellSize, height: iconCellSize }, icon === item && styles.iconCellActive]}
                  >
                    <Ionicons name={item as any} size={18} color={icon === item ? colorHex : colors.textMuted} />
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
                      { backgroundColor: item, width: swatchSize, height: swatchSize },
                      colorHex === item && styles.colorCellActive,
                    ]}
                  >
                    {colorHex === item ? <Ionicons name="checkmark" size={13} color="#FFF" /> : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
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
      </KeyboardAvoidingView>
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
      fontFamily: typography.fonts.heading,
      fontSize: 30,
      color: colors.text,
      letterSpacing: -1,
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
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
      fontFamily: typography.fonts.semibold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    labelSpaced: {
      marginTop: 18,
    },
    formInput: {
      height: 56,
    },
    typeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    typeBtn: {
      flex: 1,
      height: 56,
      borderRadius: 14,
      backgroundColor: colors.background + '88',
      borderWidth: 1.5,
      borderColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    typeBtnDanger: {
      backgroundColor: colors.danger + '12',
      borderColor: colors.danger + '48',
    },
    typeBtnSuccess: {
      backgroundColor: colors.success + '12',
      borderColor: colors.success + '48',
    },
    typeBtnText: {
      marginLeft: 6,
      fontFamily: typography.fonts.semibold,
      fontSize: 12,
      color: colors.textMuted,
    },
    typeBtnTextDanger: {
      color: colors.danger,
    },
    typeBtnTextSuccess: {
      color: colors.success,
    },
    lockHint: {
      marginTop: 8,
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    iconCell: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.text + '10',
      backgroundColor: colors.background + 'B8',
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconCellActive: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorCell: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorCellActive: {
      borderColor: colors.text,
      transform: [{ scale: 1.1 }],
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: Platform.OS === 'ios' ? 36 : 22,
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
      fontFamily: typography.fonts.heading,
      fontSize: 14,
      color: '#FFFFFF',
      letterSpacing: 0.3,
      marginRight: 10,
    },
  });
