import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { useCategories, useDeleteCategory } from '../../src/hooks/categories';
import { Category } from '../../src/api/categories';
import { CategoryFormModal } from '../../src/components/modals/CategoryFormModal';
import { Header } from '../../src/components/ui/Header';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { data: categories, isLoading } = useCategories();
  const { mutateAsync: deleteCategory } = useDeleteCategory();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleCreate = () => {
    setSelectedCategory(null);
    setModalVisible(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Category",
      "Are you sure? This will delete the category and all associated transactions.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteCategory(id) }
      ]
    );
  };

  const renderItem = ({ item }: { item: Category }) => {
    const isOverBudget = item.budget > 0 && item.expense > item.budget;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="grid" size={24} color={colors.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.name}>{item.name}</Text>
            {item.budget > 0 ? (
              <Text style={styles.budget}>
                ${item.expense.toFixed(2)} / ${item.budget.toFixed(2)}
              </Text>
            ) : (
              <Text style={styles.expense}>Total Exp: ${item.expense.toFixed(2)}</Text>
            )}
          </View>
          
          <TouchableOpacity style={styles.optionsButton} onPress={() => {
            Alert.alert("Category Options", "Select an action", [
              { text: "Cancel", style: "cancel" },
              { text: "Edit", onPress: () => handleEdit(item) },
              { text: "Delete", style: "destructive", onPress: () => handleDelete(item.id) },
            ]);
          }}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {item.budget > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${Math.min((item.expense / item.budget) * 100, 100)}%`, backgroundColor: isOverBudget ? colors.danger : colors.primary }]} />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Categories" />

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleCreate}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <CategoryFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        category={selectedCategory || undefined}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 16 },
  
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  budget: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  expense: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  optionsButton: {
    padding: 8,
  },
  
  progressContainer: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
