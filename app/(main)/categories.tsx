import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../src/components/ui/BlurBackground';
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

  const totals = React.useMemo(() => {
    const selected = filteredCategories;
    const spent = selected.reduce((sum, cat) => sum + cat.expense, 0);
    const budget = selected.reduce((sum, cat) => sum + Math.max(cat.budget, 0), 0);
    return {
      count: selected.length,
      spent,
      budget,
    };
  }, [filteredCategories]);

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
    const progress = item.budget > 0 ? Math.min((item.expense / item.budget) * 100, 100) : 0;

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
        activeOpacity={0.92}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.categoryIconBox, { backgroundColor: catColor + '1C' }]}> 
            <Ionicons name={item.icon as any || 'grid-outline'} size={20} color={catColor} />
          </View>
          <View style={[styles.typeBadge, activeType === 'DR' ? styles.typeBadgeDanger : styles.typeBadgeSuccess]}>
            <Text style={[styles.typeBadgeText, activeType === 'DR' ? styles.typeBadgeTextDanger : styles.typeBadgeTextSuccess]}>
              {activeType === 'DR' ? 'EXPENSE' : 'INCOME'}
            </Text>
          </View>
        </View>

        <View style={styles.cardMainRow}>
          <View style={styles.cardInfo}>
            <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.categorySubtext}>Tap to edit • Hold for actions</Text>
          </View>
          <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
        </View>

        <View style={styles.amountRow}>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>SPENT</Text>
            <MoneyText amount={item.expense} style={styles.categoryValue} weight="bold" />
          </View>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>BUDGET</Text>
            {item.budget > 0 ? (
              <MoneyText amount={item.budget} style={styles.budgetAmountText} />
            ) : (
              <Text style={styles.noBudgetText}>Not set</Text>
            )}
          </View>
        </View>

        {item.budget > 0 && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progress}%`,
                  backgroundColor: isOverBudget ? colors.danger : catColor
                }
              ]}
            />
            <Text style={[styles.progressText, isOverBudget && { color: colors.danger }]}>{Math.round(progress)}%</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />

      <Header title="Categories" showBack />

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.heroWrap}>
            <Text style={styles.heroKicker}>{activeType === 'DR' ? 'Expense Landscape' : 'Income Landscape'}</Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatCol}>
                <Text style={styles.heroStatLabel}>Categories</Text>
                <Text style={styles.heroStatValue}>{totals.count}</Text>
              </View>
              <View style={styles.heroStatCol}>
                <Text style={styles.heroStatLabel}>{activeType === 'DR' ? 'Spent' : 'Received'}</Text>
                <MoneyText amount={totals.spent} style={styles.heroStatMoney} weight="bold" />
              </View>
              <View style={styles.heroStatCol}>
                <Text style={styles.heroStatLabel}>Budget</Text>
                <MoneyText amount={totals.budget} style={styles.heroStatMoney} weight="regular" />
              </View>
            </View>
          </View>

          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segment, activeType === 'DR' && styles.segmentActive]}
              onPress={() => setActiveType('DR')}
              activeOpacity={0.9}
            >
              <Ionicons name="arrow-down-circle-outline" size={14} color={activeType === 'DR' ? colors.background : colors.textMuted} />
              <Text style={[styles.segmentText, activeType === 'DR' && styles.segmentTextActive]}>EXPENSES</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, activeType === 'CR' && styles.segmentActive]}
              onPress={() => setActiveType('CR')}
              activeOpacity={0.9}
            >
              <Ionicons name="arrow-up-circle-outline" size={14} color={activeType === 'CR' ? colors.background : colors.textMuted} />
              <Text style={[styles.segmentText, activeType === 'CR' && styles.segmentTextActive]}>INCOME</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            numColumns={1}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            key={`${activeType}-list`}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="sparkles-outline" size={22} color={colors.textMuted} />
                <Text style={styles.emptyText}>No {activeType === 'DR' ? 'expense' : 'income'} categories found.</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={handleCreate}>
                  <Text style={styles.emptyBtnText}>Create First Category</Text>
                </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  heroWrap: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroKicker: {
    fontFamily: typography.fonts.headingRegular,
    color: colors.text,
    fontSize: 16,
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  heroStatsRow: {
    flexDirection: 'row',
  },
  heroStatCol: {
    flex: 1,
  },
  heroStatLabel: {
    fontFamily: typography.fonts.medium,
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroStatValue: {
    fontFamily: typography.fonts.heading,
    color: colors.text,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  heroStatMoney: {
    fontSize: 14,
  },

  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 4,
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
    flexDirection: 'row',
    gap: 6,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: colors.text,
  },
  segmentText: {
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  segmentTextActive: {
    color: colors.background,
  },

  categoryCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    height: 24,
    borderRadius: 999,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadgeDanger: {
    backgroundColor: colors.danger + '18',
  },
  typeBadgeSuccess: {
    backgroundColor: colors.success + '18',
  },
  typeBadgeText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  typeBadgeTextDanger: {
    color: colors.danger,
  },
  typeBadgeTextSuccess: {
    color: colors.success,
  },
  cardMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  categoryName: {
    fontFamily: typography.fonts.headingRegular,
    color: colors.text,
    fontSize: typography.sizes.lg,
    letterSpacing: -0.2,
  },
  categorySubtext: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  amountRow: {
    flexDirection: 'row',
    marginTop: 14,
    marginBottom: 6,
  },
  amountCol: {
    flex: 1,
  },
  amountLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  categoryValue: {
    fontFamily: typography.fonts.amountBold,
    color: colors.text,
    fontSize: typography.sizes.md,
  },
  budgetAmountText: {
    fontFamily: typography.fonts.amountRegular,
    color: colors.textMuted,
    fontSize: 13,
  },
  noBudgetText: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: 13,
  },
  progressContainer: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 999,
    marginTop: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
  },
  progressText: {
    position: 'absolute',
    top: -20,
    right: 0,
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
  },

  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: 10,
    marginBottom: 14,
  },
  emptyBtn: {
    height: 38,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBtnText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 12,
    color: colors.text,
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
