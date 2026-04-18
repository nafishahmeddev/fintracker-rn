import { BlurBackground } from '@/src/components/ui/BlurBackground';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { TransactionRow } from '@/src/components/ui/TransactionRow';
import type { Account } from '@/src/features/accounts/api/accounts';
import type { Category } from '@/src/features/categories/api/categories';
import type { TransactionListItem } from '@/src/features/transactions/api/transactions';
import { useTheme } from '@/src/providers/ThemeProvider';
import { ThemeColors } from '@/src/theme/colors';
import { RADIUS, SPACING } from '@/src/theme/tokens';
import { TYPOGRAPHY } from '@/src/theme/typography';
import { resolveIcon } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  SectionListData,
  SectionListRenderItemInfo,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalSearch } from '../hooks/useGlobalSearch';

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

type SearchItem =
  | { kind: 'transaction'; data: TransactionListItem }
  | { kind: 'account'; data: Account }
  | { kind: 'category'; data: Category };

type SearchSection = {
  title: string;
  count: number;
  data: SearchItem[];
};

// ─── AccountRow ──────────────────────────────────────────────────────────────

const AccountRow = React.memo(function AccountRow({
  account,
  onPress,
  isFirst,
  isLast,
}: {
  account: Account;
  onPress: (id: number) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { colors } = useTheme();
  const accentColor = useMemo(() => toHexColor(account.color), [account.color]);
  const handlePress = useCallback(() => onPress(account.id), [onPress, account.id]);

  const containerStyle = useMemo(() => ({
    backgroundColor: colors.surface,
    borderTopLeftRadius: isFirst ? RADIUS.lg : 0,
    borderTopRightRadius: isFirst ? RADIUS.lg : 0,
    borderBottomLeftRadius: isLast ? RADIUS.lg : 0,
    borderBottomRightRadius: isLast ? RADIUS.lg : 0,
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: colors.text + '08',
  }), [isFirst, isLast, colors]);

  return (
    <TouchableOpacity
      style={[accountRowStyles.container, containerStyle]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <View style={[accountRowStyles.iconBox, { backgroundColor: accentColor + '18' }]}>
        <Ionicons name={resolveIcon(account.icon, 'wallet-outline')} size={18} color={accentColor} />
      </View>
      <View style={accountRowStyles.info}>
        <Text style={[accountRowStyles.name, { color: colors.text }]}>{account.name}</Text>
        <Text style={[accountRowStyles.meta, { color: colors.textMuted }]}>
          {account.currency} · {account.accountNumber && account.accountNumber !== 'N/A'
            ? `•••• ${account.accountNumber.slice(-4)}`
            : 'Account'}
        </Text>
      </View>
      <MoneyText
        amount={account.balance}
        currency={account.currency}
        weight="bold"
        style={accountRowStyles.balance}
      />
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </TouchableOpacity>
  );
});

const accountRowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING['3'],
    paddingHorizontal: SPACING['4'],
    gap: SPACING['3'],
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: SPACING['0.5'],
  },
  name: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 14,
  },
  meta: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 12,
  },
  balance: {
    fontSize: 14,
  },
});

// ─── CategoryRow ─────────────────────────────────────────────────────────────

const CategoryRow = React.memo(function CategoryRow({
  category,
  onPress,
  isFirst,
  isLast,
}: {
  category: Category;
  onPress: (id: number) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { colors } = useTheme();
  const catColor = useMemo(() => toHexColor(category.color), [category.color]);
  const handlePress = useCallback(() => onPress(category.id), [onPress, category.id]);

  const containerStyle = useMemo(() => ({
    backgroundColor: colors.surface,
    borderTopLeftRadius: isFirst ? RADIUS.lg : 0,
    borderTopRightRadius: isFirst ? RADIUS.lg : 0,
    borderBottomLeftRadius: isLast ? RADIUS.lg : 0,
    borderBottomRightRadius: isLast ? RADIUS.lg : 0,
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: colors.text + '08',
  }), [isFirst, isLast, colors]);

  return (
    <TouchableOpacity
      style={[categoryRowStyles.container, containerStyle]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <View style={[categoryRowStyles.iconBox, { backgroundColor: catColor + '18' }]}>
        <Ionicons name={resolveIcon(category.icon, 'pricetag-outline')} size={18} color={catColor} />
      </View>
      <Text style={[categoryRowStyles.name, { color: colors.text }]}>{category.name}</Text>
      <View style={[
        categoryRowStyles.typeBadge,
        { backgroundColor: (category.type === 'CR' ? colors.success : colors.danger) + '15' },
      ]}>
        <Text style={[
          categoryRowStyles.typeBadgeText,
          { color: category.type === 'CR' ? colors.success : colors.danger },
        ]}>
          {category.type === 'CR' ? 'Income' : 'Expense'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </TouchableOpacity>
  );
});

const categoryRowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING['3'],
    paddingHorizontal: SPACING['4'],
    gap: SPACING['3'],
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 14,
  },
  typeBadge: {
    paddingHorizontal: SPACING['2'],
    height: 22,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 11,
  },
});

// ─── SearchScreen ─────────────────────────────────────────────────────────────

export function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const { data, isFetching, isEnabled, debouncedQuery } = useGlobalSearch(query);

  React.useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  const handleClear = useCallback(() => setQuery(''), []);

  const handleBack = useCallback(() => router.back(), [router]);

  const handleTransactionPress = useCallback((tx: { id: number }) => {
    router.push(`/transactions/edit/${tx.id}`);
  }, [router]);

  const handleAccountPress = useCallback((id: number) => {
    router.push(`/transactions?accountId=${id}`);
  }, [router]);

  const handleCategoryPress = useCallback((id: number) => {
    router.push(`/transactions?categoryId=${id}`);
  }, [router]);

  const sections = useMemo((): SearchSection[] => {
    if (!data) return [];
    const result: SearchSection[] = [];

    if (data.transactions.length > 0) {
      result.push({
        title: 'TRANSACTIONS',
        count: data.transactions.length,
        data: data.transactions.map(item => ({ kind: 'transaction' as const, data: item })),
      });
    }
    if (data.accounts.length > 0) {
      result.push({
        title: 'ACCOUNTS',
        count: data.accounts.length,
        data: data.accounts.map(item => ({ kind: 'account' as const, data: item })),
      });
    }
    if (data.categories.length > 0) {
      result.push({
        title: 'CATEGORIES',
        count: data.categories.length,
        data: data.categories.map(item => ({ kind: 'category' as const, data: item })),
      });
    }
    return result;
  }, [data]);

  const hasResults = sections.length > 0;
  const noResults = isEnabled && !isFetching && debouncedQuery.length >= 2 && !hasResults;

  const renderItem = useCallback(
    ({ item, index, section }: SectionListRenderItemInfo<SearchItem, SearchSection>) => {
      const isFirst = index === 0;
      const isLast = index === section.data.length - 1;

      if (item.kind === 'transaction') {
        return (
          <TransactionRow
            tx={item.data}
            colors={colors}
            isFirst={isFirst}
            isLast={isLast}
            showDate
            onPress={handleTransactionPress}
          />
        );
      }
      if (item.kind === 'account') {
        return (
          <AccountRow
            account={item.data}
            onPress={handleAccountPress}
            isFirst={isFirst}
            isLast={isLast}
          />
        );
      }
      return (
        <CategoryRow
          category={item.data}
          onPress={handleCategoryPress}
          isFirst={isFirst}
          isLast={isLast}
        />
      );
    },
    [colors, handleTransactionPress, handleAccountPress, handleCategoryPress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<SearchItem, SearchSection> }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
        <Text style={styles.sectionHeaderCount}>{section.count}</Text>
      </View>
    ),
    [styles],
  );

  const renderSectionFooter = useCallback(() => <View style={{ height: SPACING['5'] }} />, []);

  const keyExtractor = useCallback((item: SearchItem) => {
    if (item.kind === 'transaction') return `tx-${item.data.id}`;
    if (item.kind === 'account') return `acc-${item.data.id}`;
    return `cat-${item.data.id}`;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Search</Text>
        </View>
        {isFetching && isEnabled && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loadingIndicator} />
        )}
      </View>

      {/* Search input */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Transactions, accounts, categories..."
            placeholderTextColor={colors.textMuted + '80'}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results / States */}
      {!isEnabled ? (
        <View style={styles.promptWrap}>
          <View style={styles.promptIconBox}>
            <Ionicons name="search" size={28} color={colors.textMuted} />
          </View>
          <Text style={styles.promptTitle}>Find anything</Text>
          <Text style={styles.promptSubtitle}>
            Search across transactions, accounts{'\n'}and categories in one place.
          </Text>
        </View>
      ) : noResults ? (
        <View style={styles.promptWrap}>
          <View style={styles.promptIconBox}>
            <Ionicons name="file-tray-outline" size={28} color={colors.textMuted} />
          </View>
          <Text style={styles.promptTitle}>No results</Text>
          <Text style={styles.promptSubtitle}>
            {`Nothing matched "${debouncedQuery}".\nTry a different term.`}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // ─── Header ────────────────────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING['6'],
      paddingTop: SPACING['3'],
      paddingBottom: SPACING['2'],
      gap: SPACING['4'],
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 28,
      color: colors.text,
      letterSpacing: -1,
    },
    loadingIndicator: {
      marginRight: SPACING['1'],
    },

    // ─── Search input ───────────────────────────────────────────────────────
    searchRow: {
      paddingHorizontal: SPACING['6'],
      paddingBottom: SPACING['4'],
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 52,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING['4'],
      gap: SPACING['2'],
    },
    searchInput: {
      flex: 1,
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 16,
      color: colors.text,
      padding: 0,
    },

    // ─── Empty / prompt states ─────────────────────────────────────────────
    promptWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 80,
      gap: SPACING['3'],
    },
    promptIconBox: {
      width: 68,
      height: 68,
      borderRadius: RADIUS['2xl'],
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING['1'],
    },
    promptTitle: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 18,
      color: colors.text,
      letterSpacing: -0.3,
    },
    promptSubtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },

    // ─── Results list ───────────────────────────────────────────────────────
    listContent: {
      paddingHorizontal: SPACING['6'],
      paddingBottom: 60,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: SPACING['1'],
      marginBottom: SPACING['2'],
    },
    sectionHeaderText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    sectionHeaderCount: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
    },
  });
