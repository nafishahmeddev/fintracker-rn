import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../src/db/client';
import { accounts, categories, payments } from '../../src/db/schema';
import { useSettings } from '../../src/providers/SettingsProvider';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { profile, updateProfile } = useSettings();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [showAppearanceDialog, setShowAppearanceDialog] = React.useState(false);
  const [showCurrencyDialog, setShowCurrencyDialog] = React.useState(false);

  const themeOptions: { label: string; value: 'light' | 'dark' | 'system'; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Light Mode', value: 'light', icon: 'sunny-outline' },
    { label: 'Dark Mode', value: 'dark', icon: 'moon-outline' },
    { label: 'Follow System', value: 'system', icon: 'phone-portrait-outline' },
  ];

  const currencyOptions = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AED', 'BTC'] as const;

  const handleResetData = () => {
    Alert.alert(
      "FACTORY RESET",
      "THIS WILL PERMANENTLY WIPE ALL DATA. ACCOUNTS, CATEGORIES, AND PAYMENTS WILL BE DESTROYED.",
      [
        { text: "CANCEL", style: "cancel" },
        {
          text: "WIPE EVERYTHING",
          style: "destructive",
          onPress: async () => {
            try {
              await db.delete(payments);
              await db.delete(categories);
              await db.delete(accounts);
              await AsyncStorage.clear();
              Alert.alert("Wipe Complete", "Application state has been purged. Please restart the app.");
              router.replace('/(onboarding)');
            } catch {
              Alert.alert("Critical Error", "Failed to clear physical storage.");
            }
          }
        }
      ]
    );
  };

  const handleThemeChange = () => setShowAppearanceDialog(true);
  const handleCurrencyChange = () => setShowCurrencyDialog(true);

  type PreferenceRowProps = {
    icon: any;
    title: string;
    value?: string;
    subtitle?: string;
    onPress: () => void;
    destructive?: boolean;
    color?: string;
  };

  const PreferenceRow = ({ icon, title, value, subtitle, onPress, destructive, color }: PreferenceRowProps) => {
    const iconColor = color || (destructive ? colors.danger : colors.text);

    return (
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.92}>
        <View style={[styles.iconBox, { backgroundColor: iconColor + '18' }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.textDetails}>
          <Text style={[styles.rowTitle, destructive && { color: colors.danger }]}>{title}</Text>
          {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
        </View>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={[styles.bgCircle, { top: -70, left: -70, width: 330, height: 330, backgroundColor: colors.primary + '2E' }]} />
        <View style={[styles.bgCircle, { top: 260, right: -140, width: 480, height: 480, backgroundColor: colors.text + '0E' }]} />
        <View style={[styles.bgCircle, { bottom: -90, left: 40, width: 320, height: 320, backgroundColor: colors.primary + '1C' }]} />
      </View>

      <BlurView blurAmount={Platform.OS === 'ios' ? 80 : 96}
        blurType={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
      />
      {Platform.OS === 'android' && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background + '60' }]} pointerEvents="none" />}

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>FINTRACKER.</Text>
          <Text style={styles.headerSubtitle}>Preferences And Control Center</Text>
        </View>
        <View style={styles.headerBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroPanel}>
          <Text style={styles.heroPanelKicker}>PROFILE</Text>
          <Text style={styles.heroPanelTitle}>Current Defaults</Text>
          <View style={styles.heroPillsRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillLabel}>THEME</Text>
              <Text style={styles.heroPillValue}>{(profile.theme || 'system').toUpperCase()}</Text>
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillLabel}>CURRENCY</Text>
              <Text style={styles.heroPillValue}>{profile.defaultCurrency}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>FINANCE STRUCTURE</Text>
          <View style={styles.sectionCard}>
            <PreferenceRow
              icon="grid-outline"
              title="Categories"
              subtitle="Manage your income and expense taxonomy"
              onPress={() => router.push('/categories')}
            />
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>APPEARANCE & REGION</Text>
          <View style={styles.sectionCard}>
            <PreferenceRow
              icon="contrast-outline"
              title="Appearance"
              value={(profile.theme || 'system').toUpperCase()}
              subtitle="Light, dark, or follow device"
              onPress={handleThemeChange}
            />
            <PreferenceRow
              icon="cash-outline"
              title="Primary Currency"
              value={profile.defaultCurrency}
              subtitle="Default used in new records"
              onPress={handleCurrencyChange}
            />
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>RISK OPERATIONS</Text>
          <View style={styles.sectionCard}>
            <PreferenceRow
              icon="trash-bin-outline"
              title="Factory Reset"
              destructive
              subtitle="Wipe local SQLite database and app storage"
              onPress={handleResetData}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>BUILT FOR PERFORMANCE</Text>
          <Text style={styles.footerText}>LOCAL-FIRST. PRIVATE. FAST.</Text>
        </View>
      </ScrollView>

      <Modal
        visible={showAppearanceDialog}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowAppearanceDialog(false)}
      >
        <View style={styles.dialogOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowAppearanceDialog(false)} />
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Appearance</Text>
            <Text style={styles.dialogSubtitle}>Select your preferred theme</Text>

            <View style={styles.dialogOptionsWrap}>
              {themeOptions.map((option) => {
                const selected = (profile.theme || 'system') === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.dialogOptionRow, selected && styles.dialogOptionRowActive]}
                    onPress={() => {
                      updateProfile({ theme: option.value });
                      setShowAppearanceDialog(false);
                    }}
                    activeOpacity={0.9}
                  >
                    <View style={[styles.dialogOptionIconWrap, selected && styles.dialogOptionIconWrapActive]}>
                      <Ionicons name={option.icon} size={16} color={selected ? colors.background : colors.textMuted} />
                    </View>
                    <Text style={[styles.dialogOptionText, selected && styles.dialogOptionTextActive]}>{option.label}</Text>
                    {selected && <Ionicons name="checkmark" size={16} color={colors.background} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.dialogCloseBtn} onPress={() => setShowAppearanceDialog(false)}>
              <Text style={styles.dialogCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCurrencyDialog}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowCurrencyDialog(false)}
      >
        <View style={styles.dialogOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowCurrencyDialog(false)} />
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Default Currency</Text>
            <Text style={styles.dialogSubtitle}>Set application-wide standard</Text>

            <View style={styles.currencyDialogGrid}>
              {currencyOptions.map((option) => {
                const selected = profile.defaultCurrency === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.currencyDialogChip, selected && styles.currencyDialogChipActive]}
                    onPress={() => {
                      updateProfile({ defaultCurrency: option });
                      setShowCurrencyDialog(false);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.currencyDialogChipText, selected && styles.currencyDialogChipTextActive]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.dialogCloseBtn} onPress={() => setShowCurrencyDialog(false)}>
              <Text style={styles.dialogCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  header: {
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnPlaceholder: {
    width: 44,
  },
  headerCopy: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: 26,
    color: colors.text,
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  headerSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 42,
  },
  heroPanel: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  heroPanelKicker: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroPanelTitle: {
    fontFamily: typography.fonts.headingRegular,
    fontSize: 20,
    color: colors.text,
    letterSpacing: -0.3,
  },
  heroPillsRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  heroPill: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.background + 'A6',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  sectionCard: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textDetails: {
    flex: 1,
    paddingRight: 10,
  },
  rowTitle: {
    fontFamily: typography.fonts.headingRegular,
    fontSize: typography.sizes.md + 1,
    color: colors.text,
    letterSpacing: -0.2,
  },
  rowSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowValue: {
    fontFamily: typography.fonts.semibold,
    fontSize: 11,
    color: colors.textMuted,
    marginRight: 8,
    letterSpacing: 1,
  },
  heroPillLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  heroPillValue: {
    fontFamily: typography.fonts.semibold,
    fontSize: 14,
    color: colors.text,
    marginTop: 6,
  },
  footer: {
    marginTop: 14,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: typography.fonts.medium,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1,
    opacity: 0.65,
    marginBottom: 2,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    alignSelf: 'stretch',
    borderRadius: 18,
    backgroundColor: Platform.OS === 'ios' ? colors.background + 'F2' : colors.background,
    borderWidth: 1,
    borderColor: colors.text + '14',
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  dialogTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: 22,
    color: colors.text,
    letterSpacing: -0.5,
  },
  dialogSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 14,
  },
  dialogOptionsWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  dialogOptionRow: {
    height: 46,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.text + '10',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dialogOptionRowActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  dialogOptionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.background + 'CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dialogOptionIconWrapActive: {
    backgroundColor: colors.background + '66',
  },
  dialogOptionText: {
    flex: 1,
    fontFamily: typography.fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  dialogOptionTextActive: {
    color: colors.background,
  },
  currencyDialogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currencyDialogChip: {
    width: '31%',
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.text + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  currencyDialogChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  currencyDialogChipText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 12,
    color: colors.text,
    letterSpacing: 0.4,
  },
  currencyDialogChipTextActive: {
    color: colors.background,
  },
  dialogCloseBtn: {
    marginTop: 6,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogCloseBtnText: {
    fontFamily: typography.fonts.heading,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
