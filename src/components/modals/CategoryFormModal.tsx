import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useCreateCategory, useUpdateCategory } from '../../hooks/categories';

import { Category } from '../../api/categories';

export type CategoryFormModalProps = {
  visible: boolean;
  onClose: () => void;
  category?: Category;
};

const ICONS = ['grid', 'fast-food', 'cafe', 'car', 'bus', 'airplane', 'home', 'medkit', 'barbell', 'book', 'game-controller', 'gift', 'heart', 'star'];
const COLORS = ['#00FFAA', '#00F0FF', '#8B5CF6', '#EC4899', '#F43F5E', '#EAB308', '#F97316', '#10B981', '#3B82F6', '#64748B'];

export function CategoryFormModal({ visible, onClose, category }: CategoryFormModalProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const isEditing = !!category;
  const { mutateAsync: createCategory, isPending: creating } = useCreateCategory();
  const { mutateAsync: updateCategory, isPending: updating } = useUpdateCategory();

  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [type, setType] = useState<'CR' | 'DR'>('DR');
  const [icon, setIcon] = useState('grid');
  const [colorHex, setColorHex] = useState(COLORS[0]);

  useEffect(() => {
    if (category && visible) {
      setName(category.name);
      setName(category.name);
      setBudget(category.budget?.toString() || '');
      setType(category.type as 'CR' | 'DR' || 'DR');
      setIcon(typeof category.icon === 'string' ? category.icon : 'grid');
      const hex = '#' + category.color.toString(16).padStart(6, '0').toUpperCase();
      setColorHex(COLORS.includes(hex) ? hex : hex);
    } else if (visible) {
      setName('');
      setBudget('');
      setType('DR');
      setIcon('grid');
      setColorHex(COLORS[0]);
    }
  }, [category, visible]);

  const handleSave = async () => {
    if (!name) return alert("Category Name is required");

    try {
      if (isEditing) {
        await updateCategory({
          id: category.id,
          data: {
            name,
            budget: parseFloat(budget) || 0,
            type,
            icon,
            color: parseInt(colorHex.replace('#', '0x')),
          }
        });
      } else {
        await createCategory({
          name,
          icon,
          type,
          color: parseInt(colorHex.replace('#', '0x')),
          budget: parseFloat(budget) || 0,
          expense: 0,
        });
      }
      onClose();
    } catch {
      alert("Failed to save category.");
    }
  };

  const isPending = creating || updating;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Category' : 'New Category'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.formContainer}>
          <Input label="Category Name" value={name} onChangeText={setName} placeholder="e.g. Groceries, Rent" />
          <Input label="Monthly Budget (Optional)" value={budget} onChangeText={setBudget} placeholder="0.00" keyboardType="decimal-pad" />
          
          <Text style={styles.sectionLabel}>Category Type</Text>
          <View style={styles.typeRow}>
            <Button title="Expense (DR)" variant={type === 'DR' ? 'danger' : 'outline'} onPress={() => setType('DR')} style={styles.typeBtn} />
            <Button title="Income (CR)" variant={type === 'CR' ? 'success' : 'outline'} onPress={() => setType('CR')} style={styles.typeBtn} />
          </View>

          <Text style={styles.sectionLabel}>Select Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll} contentContainerStyle={styles.pickerContent}>
            {ICONS.map((i) => (
              <TouchableOpacity key={i} style={[styles.pickerItem, icon === i && styles.pickerSelected]} onPress={() => setIcon(i)}>
                <Ionicons name={i as any} size={24} color={icon === i ? colors.primary : colors.textMuted} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>Select Color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll} contentContainerStyle={styles.pickerContent}>
            {COLORS.map((c) => (
              <TouchableOpacity 
                key={c} 
                style={[styles.colorItem, { backgroundColor: c }, colorHex === c && styles.colorSelected]} 
                onPress={() => setColorHex(c)}
              />
            ))}
          </ScrollView>
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Save Category" onPress={handleSave} isLoading={isPending} style={{ width: '100%' }} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: { padding: 4 },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text },
  formContainer: { padding: 24 },
  sectionLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textMuted, marginTop: 16, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  typeBtn: { flex: 1 },
  pickerScroll: { marginBottom: 8 },
  pickerContent: { paddingRight: 20 },
  pickerItem: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', paddingVertical: 12, paddingHorizontal: 16, marginRight: 8, minWidth: 64 },
  pickerSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  colorItem: { width: 44, height: 44, borderRadius: 22, marginRight: 12, borderWidth: 2, borderColor: 'transparent' },
  colorSelected: { borderColor: colors.text, transform: [{ scale: 1.1 }] },
  footer: { padding: 24, paddingBottom: 48 },
});
