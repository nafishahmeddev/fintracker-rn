import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { DEFAULT_CURRENCY } from '../../src/constants/currency';
import { AccountFormModal } from '../../src/features/accounts/components/AccountFormModal';
import { useAccounts, useDeleteAccount } from '../../src/features/accounts/hooks/accounts';
import { useTransactions } from '../../src/features/transactions/hooks/transactions';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const circleOneAnim = React.useRef(new Animated.Value(0)).current;
  const circleTwoAnim = React.useRef(new Animated.Value(0)).current;
  const circleThreeAnim = React.useRef(new Animated.Value(0)).current;
  const circleOneOpac = React.useRef(new Animated.Value(0)).current;
  const circleTwoOpac = React.useRef(new Animated.Value(0)).current;
  const circleThreeOpac = React.useRef(new Animated.Value(0)).current;

  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { mutateAsync: deleteAccount } = useDeleteAccount();

  const [showAccountForm, setShowAccountForm] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<any>(undefined);

  const balancesByCurrency = React.useMemo(() => {
    return accounts?.reduce((acc, account) => {
      acc[account.currency] = (acc[account.currency] || 0) + account.balance;
      return acc;
    }, {} as Record<string, number>) || {};
  }, [accounts]);

  const currencyKeys = React.useMemo(() => {
    const keys = Object.keys(balancesByCurrency);
    return keys.length > 0 ? keys : [DEFAULT_CURRENCY];
  }, [balancesByCurrency]);

  const [selectedCurrency, setSelectedCurrency] = React.useState<string>(currencyKeys[0]);


  React.useEffect(() => {
    if (!currencyKeys.includes(selectedCurrency)) {
      setSelectedCurrency(currencyKeys[0]);
    }
  }, [currencyKeys, selectedCurrency]);

  React.useEffect(() => {
    const createLoop = (
      animatedValue: Animated.Value,
      duration: number,
      toValue: number
    ) => Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const animations = [
      createLoop(circleOneAnim, 9000, 1),
      createLoop(circleTwoAnim, 12000, 1),
      createLoop(circleThreeAnim, 10500, 1),
      createLoop(circleOneOpac, 7000, 1),
      createLoop(circleTwoOpac, 11000, 1),
      createLoop(circleThreeOpac, 8500, 1),
    ];

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
      circleOneAnim.stopAnimation();
      circleTwoAnim.stopAnimation();
      circleThreeAnim.stopAnimation();
      circleOneOpac.stopAnimation();
      circleTwoOpac.stopAnimation();
      circleThreeOpac.stopAnimation();
    };
  }, [circleOneAnim, circleTwoAnim, circleThreeAnim, circleOneOpac, circleTwoOpac, circleThreeOpac]);

  const circleOneStyle = React.useMemo(
    () => ({
      opacity: circleOneOpac.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] }),
      transform: [
        {
          translateX: circleOneAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 36],
          }),
        },
        {
          translateY: circleOneAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 28],
          }),
        },
        {
          scale: circleOneAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.22],
          }),
        },
      ],
    }),
    [circleOneAnim, circleOneOpac]
  );

  const circleTwoStyle = React.useMemo(
    () => ({
      opacity: circleTwoOpac.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] }),
      transform: [
        {
          translateX: circleTwoAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -44],
          }),
        },
        {
          translateY: circleTwoAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 32],
          }),
        },
        {
          scale: circleTwoAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.16],
          }),
        },
      ],
    }),
    [circleTwoAnim, circleTwoOpac]
  );

  const circleThreeStyle = React.useMemo(
    () => ({
      opacity: circleThreeOpac.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] }),
      transform: [
        {
          translateX: circleThreeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 28],
          }),
        },
        {
          translateY: circleThreeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -30],
          }),
        },
        {
          scale: circleThreeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.18],
          }),
        },
      ],
    }),
    [circleThreeAnim, circleThreeOpac]
  );

  const handleAccountLongPress = (acc: any) => {
    Alert.alert(
      "Manage Account",
      `${acc.name}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Edit", onPress: () => { setEditingAccount(acc); setShowAccountForm(true); } },
        {
          text: "Delete", style: "destructive", onPress: () => {
            Alert.alert("Confirm Delete", `Are you sure you want to delete ${acc.name}?`, [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => deleteAccount(acc.id) }
            ]);
          }
        }
      ]
    );
  };

  if (txLoading || accountsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Decorative Circles */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View style={[styles.bgCircle, { top: -60, left: -60, width: 340, height: 340, backgroundColor: colors.primary }, circleOneStyle]} />
        <Animated.View style={[styles.bgCircle, { top: 180, right: -110, width: 440, height: 440, backgroundColor: colors.primaryDark }, circleTwoStyle]} />
        <Animated.View style={[styles.bgCircle, { bottom: -110, left: 40, width: 380, height: 380, backgroundColor: colors.primary }, circleThreeStyle]} />
      </View>

      {/* Frosted Glass Overlay */}
      <BlurView
        blurAmount={Platform.OS === 'ios' ? 80 : 95}
        blurType={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Subtle Tint Layer for Android */}
      {Platform.OS === 'android' && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background + '60' }]} pointerEvents="none" />}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Refined Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.editorialTitle}>FINTRACKER.</Text>
            <Text style={styles.editorialSubtitle}>Your tactical financial overview</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
            <Ionicons name="options" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Brutalist Typographic Currency Switcher */}
        {currencyKeys.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyTabsContent}>
            {currencyKeys.map(curr => (
              <TouchableOpacity
                key={curr}
                style={[styles.currencyTab, selectedCurrency === curr && styles.currencyTabActive]}
                onPress={() => setSelectedCurrency(curr)}
              >
                <Text style={[styles.currencyTabText, selectedCurrency === curr && styles.currencyTabTextActive]}>
                  {curr}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Global Balance */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>TOTAL ASSETS</Text>
          <MoneyText
            amount={balancesByCurrency[selectedCurrency] || 0}
            currency={selectedCurrency}
            style={styles.balanceHuge}
            weight="bold"
          />
        </View>

        {/* Accounts Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.accountsScroll}
          contentContainerStyle={styles.accountsScrollContent}
        >
          {accounts?.map(acc => {
            const accColor = '#' + acc.color.toString(16).padStart(6, '0');
            return (
              <TouchableOpacity
                key={acc.id}
                style={[styles.accountCard, { borderTopWidth: 4, borderTopColor: accColor }]}
                onPress={() => router.push(`/transactions?accountId=${acc.id}`)}
                onLongPress={() => handleAccountLongPress(acc)}
                delayLongPress={250}
              >
                <View style={styles.accountCardHeader}>
                  <View style={[styles.accountIconBox, { backgroundColor: accColor + '15' }]}>
                    <Ionicons name={acc.icon as any || "wallet-outline"} size={20} color={accColor} />
                  </View>
                  <View style={styles.accountCardMeta}>
                    <Text style={styles.accountCardName}>{acc.name}</Text>
                    {acc.accountNumber && acc.accountNumber !== 'N/A' && (
                      <Text style={styles.accountCardNumber}>•••• {acc.accountNumber.slice(-4)}</Text>
                    )}
                  </View>
                </View>
                <MoneyText
                  amount={acc.balance}
                  currency={acc.currency}
                  style={styles.accountCardBalance}
                  weight="bold"
                />
                {acc.holderName && acc.holderName !== 'N/A' && (
                  <Text style={styles.accountCardHolder}>{acc.holderName}</Text>
                )}

                <View style={styles.accountCardStats}>
                  <View style={styles.accountCardStatCol}>
                    <Text style={styles.accountCardStatLabel}>IN</Text>
                    <MoneyText amount={acc.income} currency={acc.currency} style={styles.accountCardStatValue} type="CR" />
                  </View>
                  <View style={styles.accountCardStatCol}>
                    <Text style={styles.accountCardStatLabel}>OUT</Text>
                    <MoneyText amount={acc.expense} currency={acc.currency} style={styles.accountCardStatValue} type="DR" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.accountCard, { borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', minHeight: 70 }]}
            onPress={() => { setEditingAccount(undefined); setShowAccountForm(true); }}
          >
            <Ionicons name="add" size={24} color={colors.textMuted} />
            <Text style={[styles.accountCardName, { marginLeft: 0, marginTop: 4 }]}>New Account</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Editorial Activity List */}
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>LEDGER</Text>
          <TouchableOpacity onPress={() => router.push('/transactions')}>
            <Text style={styles.activityLink}>READ ALL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {transactions?.slice(0, 5).map(tx => {
            const catColor = tx.category.color ? '#' + tx.category.color.toString(16).padStart(6, '0') : colors.primary;
            return (
              <View key={tx.id} style={styles.activityRow}>
                <View style={styles.txLeft}>
                  <View style={[styles.activityIconBox, { backgroundColor: catColor + '15' }]}>
                    <Ionicons name={tx.category.icon as any || 'pricetag'} size={22} color={catColor} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle} numberOfLines={1}>{tx.note || 'Untitled'}</Text>
                    <Text style={styles.txCategory}>
                      {tx.category.name} • {tx.account.name}
                    </Text>
                  </View>
                </View>
                <View style={styles.txRight}>
                  <MoneyText amount={tx.amount} currency={tx.account.currency} type={tx.type} style={styles.txAmount} weight="bold" />
                  <Text style={styles.txDate}>{new Date(tx.datetime).toLocaleDateString()}</Text>
                </View>
              </View>
            );
          })}

          {(!transactions || transactions.length === 0) && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No financial data registered.</Text>
            </View>
          )}
        </View>

      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-transaction')}>
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      <AccountFormModal
        visible={showAccountForm}
        onClose={() => setShowAccountForm(false)}
        account={editingAccount}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: 24,
    paddingBottom: 100,
  },

  header: {
    marginTop: 10,
    marginBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  // @ts-ignore
  editorialTitle: {
    fontFamily: typography.fonts.heading,
    color: colors.text,
    fontSize: 32,
    letterSpacing: -1,
  },
  editorialSubtitle: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: 4,
  },

  balanceSection: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  balanceLabel: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  currencyTabsContent: {
    paddingHorizontal: 24,
    marginBottom: 8,
    flexDirection: 'row',
  },
  currencyTab: {
    marginRight: 24,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  currencyTabActive: {
    borderColor: colors.text,
  },
  currencyTabText: {
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
    fontSize: typography.sizes.lg,
  },
  currencyTabTextActive: {
    color: colors.text,
  },

  balanceHuge: {
    fontFamily: typography.fonts.amountBold,
    fontSize: typography.sizes.xxxl,
    color: colors.text,
    letterSpacing: -1.5,
  },

  accountsScroll: {
    paddingLeft: 24,
    marginBottom: 32,
  },
  accountsScrollContent: {
    paddingRight: 48,
  },
  accountCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    minWidth: 220,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20, // Circular subtle wash
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountCardMeta: {
    marginLeft: 8,
  },
  accountCardName: {
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    fontSize: typography.sizes.sm,
  },
  accountCardNumber: {
    fontFamily: typography.fonts.medium,
    color: colors.textMuted,
    fontSize: typography.sizes.xs - 2,
    marginTop: 2,
  },
  accountCardBalance: {
    fontFamily: typography.fonts.amountBold,
    color: colors.text,
    fontSize: typography.sizes.lg,
  },
  accountCardHolder: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountCardStats: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  accountCardStatCol: {
    flex: 1,
  },
  accountCardStatLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 9,
    color: colors.textMuted,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  accountCardStatValue: {
    fontFamily: typography.fonts.amountRegular,
    fontSize: typography.sizes.xs,
  },

  fab: {
    position: 'absolute',
    bottom: 32,
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

  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  // @ts-ignore
  activityTitle: {
    fontFamily: typography.fonts.heading,
    color: colors.text,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  activityLink: {
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  activityList: {
    marginTop: 8,
    paddingHorizontal: 24,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 16,
  },
  activityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22, // Circular subtle wash
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontFamily: typography.fonts.headingRegular,
    color: colors.text,
    fontSize: typography.sizes.md,
    letterSpacing: -0.2,
  },
  txCategory: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 6,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontFamily: typography.fonts.amountBold,
    fontSize: typography.sizes.md,
  },
  txDate: {
    fontFamily: typography.fonts.medium,
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },

  emptyCard: {
    paddingVertical: 32,
    alignItems: 'flex-start',
  },
  emptyText: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
});
