import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
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

export function CategoryFormModal({ visible, onClose, category }: CategoryFormModalProps) {
  const isEditing = !!category;
  const { mutateAsync: createCategory, isPending: creating } = useCreateCategory();
  const { mutateAsync: updateCategory, isPending: updating } = useUpdateCategory();

  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    if (category && visible) {
      setName(category.name);
      setBudget(category.budget?.toString() || '');
    } else if (visible) {
      setName('');
      setBudget('');
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
          }
        });
      } else {
        await createCategory({
          name,
          icon: 58000,
          color: parseInt(colors.card.replace('#', '0x')),
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
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Save Category" onPress={handleSave} isLoading={isPending} style={{ width: '100%' }} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  footer: { padding: 24, paddingBottom: 48 },
});
