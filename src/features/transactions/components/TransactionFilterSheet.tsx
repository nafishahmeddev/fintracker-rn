import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../../theme/colors';
import { TYPOGRAPHY } from '../../../theme/typography';
import { Account } from '../../accounts/api/accounts';
import { Category } from '../../categories/api/categories';

interface TransactionFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  typeFilter: 'ALL' | 'CR' | 'DR';
  setTypeFilter: (type: 'ALL' | 'CR' | 'DR') => void;
  accountFilterId: number | null;
  setAccountFilterId: (id: number | null) => void;
  categoryFilterId: number | null;
  setCategoryFilterId: (id: number | null) => void;
  accounts: Account[];
  categories: Category[];
  totalCount: number;
  activeFilterCount: number;
  onClear: () => void;
  colors: ThemeColors;
}

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

export const TransactionFilterSheet: React.FC<TransactionFilterSheetProps> = ({
  visible,
  onClose,
  typeFilter,
  setTypeFilter,
  accountFilterId,
  setAccountFilterId,
  categoryFilterId,
  setCategoryFilterId,
  accounts,
  categories,
  totalCount,
  activeFilterCount,
  onClear,
  colors,
}) => {
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  // Staged state
  const [localType, setLocalType] = React.useState(typeFilter);
  const [localAccount, setLocalAccount] = React.useState(accountFilterId);
  const [localCategory, setLocalCategory] = React.useState(categoryFilterId);

  // Sync staged state when modal opens
  React.useEffect(() => {
    if (visible) {
      setLocalType(typeFilter);
      setLocalAccount(accountFilterId);
      setLocalCategory(categoryFilterId);
    }
  }, [visible, typeFilter, accountFilterId, categoryFilterId]);

  const handleApply = () => {
    setTypeFilter(localType);
    setAccountFilterId(localAccount);
    setCategoryFilterId(localCategory);
    onClose();
  };

  const handleReset = () => {
    setLocalType('ALL');
    setLocalAccount(null);
    setLocalCategory(null);
    onClear();
  };

  const stagedActiveCount = 
    (localType !== 'ALL' ? 1 : 0) + 
    (localAccount !== null ? 1 : 0) + 
    (localCategory !== null ? 1 : 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetCard}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeadRow}>
            <Text style={styles.sheetTitle}>Filters</Text>
            {stagedActiveCount > 0 && (
              <TouchableOpacity style={styles.sheetClearBtn} onPress={handleReset}>
                <Text style={styles.sheetClearBtnText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
            <View style={styles.sheetSection}>
              <Text style={styles.sheetLabel}>TYPE</Text>
              <View style={styles.sheetGrid}>
                {([
                  { key: 'ALL' as const, label: 'All', icon: 'list-outline' as const },
                  { key: 'CR' as const, label: 'Income', icon: 'arrow-down-outline' as const },
                  { key: 'DR' as const, label: 'Expense', icon: 'arrow-up-outline' as const },
                ]).map((typeOption) => {
                  const selected = localType === typeOption.key;
                  return (
                    <TouchableOpacity
                      key={typeOption.key}
                      style={[
                        styles.sheetPill,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        selected && { backgroundColor: colors.text, borderColor: colors.text }
                      ]}
                      onPress={() => setLocalType(typeOption.key)}
                    >
                      <Ionicons
                        name={typeOption.icon}
                        size={18}
                        color={selected ? colors.background : colors.textMuted}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[styles.sheetPillText, selected && { color: colors.background }]}>
                        {typeOption.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.sheetSection}>
              <Text style={styles.sheetLabel}>ACCOUNT</Text>
              <View style={styles.sheetGrid}>
                <TouchableOpacity
                  style={[
                    styles.sheetPill,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    localAccount === null && { backgroundColor: colors.text, borderColor: colors.text }
                  ]}
                  onPress={() => setLocalAccount(null)}
                >
                  <Text style={[styles.sheetPillText, localAccount === null && { color: colors.background }]}>All</Text>
                </TouchableOpacity>
                {accounts.map((account) => {
                  const selected = localAccount === account.id;
                  const accColor = toHexColor(account.color);
                  return (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.sheetPill,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        selected && { backgroundColor: accColor, borderColor: accColor }
                      ]}
                      onPress={() => setLocalAccount(account.id)}
                    >
                      <Ionicons
                        name={(account.icon as any) || 'wallet-outline'}
                        size={16}
                        color={selected ? colors.background : colors.textMuted}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[styles.sheetPillText, selected && { color: colors.background }]}>{account.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.sheetSection}>
              <Text style={styles.sheetLabel}>CATEGORY</Text>
              <View style={styles.sheetGrid}>
                <TouchableOpacity
                  style={[
                    styles.sheetPill,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    localCategory === null && { backgroundColor: colors.text, borderColor: colors.text }
                  ]}
                  onPress={() => setLocalCategory(null)}
                >
                  <Text style={[styles.sheetPillText, localCategory === null && { color: colors.background }]}>All</Text>
                </TouchableOpacity>
                {categories.map((category) => {
                  const selected = localCategory === category.id;
                  const catColor = toHexColor(category.color);
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.sheetPill,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        selected && { backgroundColor: catColor, borderColor: catColor }
                      ]}
                      onPress={() => setLocalCategory(category.id)}
                    >
                      <Ionicons
                        name={(category.icon as any) || 'grid-outline'}
                        size={16}
                        color={selected ? colors.background : colors.textMuted}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[styles.sheetPillText, selected && { color: colors.background }]}>{category.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.sheetApplyBtn} onPress={handleApply}>
            <Text style={styles.sheetApplyBtnText}>Show Transactions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    sheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    sheetCard: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      paddingBottom: 40,
      maxHeight: '85%',
    },
    sheetHandle: {
      width: 48,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 8,
    },
    sheetHeadRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 28,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    sheetTitle: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 26,
      color: colors.text,
      letterSpacing: -0.5,
    },
    sheetClearBtn: {
      paddingHorizontal: 16,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetClearBtnText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.text,
      fontSize: 12,
    },
    sheetScroll: {
      paddingHorizontal: 28,
      paddingTop: 24,
      paddingBottom: 100,
    },
    sheetSection: {
      marginBottom: 28,
    },
    sheetLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: 16,
    },
    sheetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    sheetPill: {
      paddingHorizontal: 20,
      height: 48, // Normalized to bubble height
      borderRadius: 24,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetPillText: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 14,
      color: colors.text,
    },
    sheetApplyBtn: {
      position: 'absolute',
      bottom: 34,
      left: 28,
      right: 28,
      height: 64, // Normalized to bubble height
      borderRadius: 32,
      backgroundColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 6,
    },
    sheetApplyBtnText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.background,
      fontSize: 16,
    },
  });
