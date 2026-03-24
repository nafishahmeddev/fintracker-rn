import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/ui/Header';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { Category } from '../../src/features/categories/api/categories';
import { CategoryFormModal } from '../../src/features/categories/components/CategoryFormModal';
import { useCategories, useDeleteCategory } from '../../src/features/categories/hooks/categories';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';


export default function CategoriesScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { data: categories, isLoading } = useCategories();
  const { mutateAsync: deleteCategory } = useDeleteCategory();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [activeType, setActiveType] = useState<'CR' | 'DR'>('DR');

  const filteredCategories = React.useMemo(() => {
    return categories?.filter(cat => cat.type === activeType) || [];
  }, [categories, activeType]);

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
    const catColor = item.color ? '#' + item.color.toString(16).padStart(6, '0') : colors.primary;

    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleEdit(item)}
        onLongPress={() => {
          Alert.alert("Manage category", item.name, [
            { text: "Cancel", style: "cancel" },
            { text: "Edit", onPress: () => handleEdit(item) },
            { text: "Delete", style: "destructive", onPress: () => handleDelete(item.id) },
          ]);
        }}
        delayLongPress={500}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.categoryIconBox, { backgroundColor: catColor + '15' }]}>
            <Ionicons name={item.icon as any || "grid-outline"} size={20} color={catColor} />
          </View>
          <Ionicons name="ellipsis-vertical" size={14} color={colors.textMuted} />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
          <MoneyText amount={item.expense} style={styles.categoryValue} weight="bold" />
          
          {item.budget > 0 && (
            <View style={styles.budgetRow}>
              <Text style={styles.categoryValueMuted}>of </Text>
              <MoneyText amount={item.budget} style={styles.categoryValueMuted} />
            </View>
          )}
        </View>

        {item.budget > 0 && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min((item.expense / item.budget) * 100, 100)}%`,
                  backgroundColor: isOverBudget ? colors.danger : catColor
                }
              ]}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Categories" showBack />

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segment, activeType === 'DR' && styles.segmentActive]}
              onPress={() => setActiveType('DR')}
              activeOpacity={0.9}
            >
              <Text style={[styles.segmentText, activeType === 'DR' && styles.segmentTextActive]}>EXPENSES</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, activeType === 'CR' && styles.segmentActive]}
              onPress={() => setActiveType('CR')}
              activeOpacity={0.9}
            >
              <Text style={[styles.segmentText, activeType === 'CR' && styles.segmentTextActive]}>INCOME</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            key={`${activeType}-grid`} // Re-render when numColumns would change or content shifts
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No {activeType === 'DR' ? 'expense' : 'income'} categories found.</Text>
              </View>
            }
          />
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={handleCreate}>
        <Ionicons name="add" size={28} color="#000" />
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
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 4,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: colors.text,
  },
  segmentText: {
    fontFamily: typography.fonts.monoBold,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  segmentTextActive: {
    color: colors.background,
  },

  categoryCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryName: {
    fontFamily: typography.fonts.headingRegular,
    color: colors.text,
    fontSize: typography.sizes.md,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  categoryValue: {
    fontFamily: typography.fonts.monoBold,
    color: colors.text,
    fontSize: typography.sizes.sm + 2,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  categoryValueMuted: {
    fontFamily: typography.fonts.mono,
    color: colors.textMuted,
    fontSize: 10,
  },
  progressContainer: {
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },

  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    width: '200%', // Adjust for numColumns={2}
    position: 'absolute',
  },
  emptyText: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
