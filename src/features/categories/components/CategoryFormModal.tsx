import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { Input } from '../../../components/ui/Input';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { Category } from '../api/categories';
import { useCreateCategory, useUpdateCategory } from '../hooks/categories';

export type CategoryFormModalProps = {
  visible: boolean;
  onClose: () => void;
  category?: Category;
};

const ICONS = [
  'grid-outline',
  'fast-food-outline',
  'cafe-outline',
  'car-outline',
  'bus-outline',
  'airplane-outline',
  'home-outline',
  'medkit-outline',
  'barbell-outline',
  'book-outline',
  'game-controller-outline',
  'gift-outline',
  'heart-outline',
  'star-outline',
] as const;

const COLORS = [
  '#00FFAA',
  '#00F0FF',
  '#8B5CF6',
  '#EC4899',
  '#F43F5E',
  '#EAB308',
  '#F97316',
  '#10B981',
  '#3B82F6',
  '#64748B',
] as const;

export function CategoryFormModal({ visible, onClose, category }: CategoryFormModalProps) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEditing = !!category;
  const iconCellSize = useMemo(() => Math.max(42, Math.floor((width - 24 * 2 - 8 * 5) / 6)), [width]);
  const swatchSize = iconCellSize;

  const { mutateAsync: createCategory } = useCreateCategory();
  const { mutateAsync: updateCategory } = useUpdateCategory();

  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [type, setType] = useState<'CR' | 'DR'>('DR');
  const [icon, setIcon] = useState<string>(ICONS[0]);
  const [colorHex, setColorHex] = useState<string>(COLORS[0]);

  useEffect(() => {
    if (!visible) return;

    if (category) {
      setName(category.name);
      setBudget(category.budget > 0 ? String(category.budget) : '');
      setType(category.type);
      setIcon(typeof category.icon === 'string' ? category.icon : ICONS[0]);
      setColorHex(`#${category.color.toString(16).padStart(6, '0').toUpperCase()}`);
      return;
    }

    setName('');
    setBudget('');
    setType('DR');
    setIcon(ICONS[0]);
    setColorHex(COLORS[0]);
  }, [category, visible]);

  const handleSave = async () => {
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      type,
      icon,
      color: parseInt(colorHex.replace('#', ''), 16),
      budget: budget.trim() ? parseFloat(budget) : undefined,
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
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={[styles.glow, { top: -120, right: -80, width: 280, height: 280, backgroundColor: colors.primary + '1F' }]} />
            <View style={[styles.glow, { bottom: -100, left: -70, width: 260, height: 260, backgroundColor: colorHex + '20' }]} />
          </View>

          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 94}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod={'dimezisBlurView' as any}
            style={StyleSheet.absoluteFillObject}
          />

          {Platform.OS === 'android' && (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? 'rgba(0,0,0,0.46)' : 'rgba(255,255,255,0.44)' }]}
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
              <Input value={name} onChangeText={setName} placeholder="Groceries" autoFocus={!isEditing} style={styles.formInput} />

              <Text style={[styles.label, styles.labelSpaced]}>Monthly Budget (Optional)</Text>
              <Input value={budget} onChangeText={setBudget} placeholder="0.00" keyboardType="decimal-pad" style={styles.formInput} />
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
                {ICONS.map((item) => (
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
                {COLORS.map((item) => (
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
              style={[styles.primaryBtn, !name.trim() && styles.primaryBtnDisabled]}
              onPress={handleSave}
              disabled={!name.trim()}
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
      width: 42,
      height: 4,
      borderRadius: 999,
      marginTop: 10,
      backgroundColor: colors.textMuted + '55',
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 14,
      paddingBottom: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 20,
    },
    sectionLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    label: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.4,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    labelSpaced: {
      marginTop: 16,
    },
    formInput: {
      height: 58,
    },
    typeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    typeBtn: {
      flex: 1,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.background + 'AA',
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: 4,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    typeBtnDanger: {
      backgroundColor: colors.danger + '16',
      borderColor: colors.danger + '44',
    },
    typeBtnSuccess: {
      backgroundColor: colors.success + '16',
      borderColor: colors.success + '44',
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
      justifyContent: 'space-between',
      marginTop: 4,
    },
    iconCell: {
      borderRadius: 12,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    iconCellActive: {
      backgroundColor: colors.primary + '18',
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    colorCell: {
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    colorCellActive: {
      borderColor: colors.text,
      transform: [{ scale: 1.05 }],
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: Platform.OS === 'ios' ? 36 : 22,
    },
    primaryBtn: {
      height: 58,
      borderRadius: 18,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
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
