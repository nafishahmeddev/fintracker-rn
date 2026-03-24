import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const handleThemeChange = () => {
    Alert.alert("Appearance", "Select your preferred theme", [
      { text: "Light Mode", onPress: () => updateProfile({ theme: 'light' }) },
      { text: "Dark Mode", onPress: () => updateProfile({ theme: 'dark' }) },
      { text: "Follow System", onPress: () => updateProfile({ theme: 'system' }) },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const handleCurrencyChange = () => {
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AED', 'BTC'];
    Alert.alert("Default Currency", "Set application-wide standard",
      currencies.map(c => ({ text: c, onPress: () => updateProfile({ defaultCurrency: c }) })),
      { cancelable: true }
    );
  };

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

      <BlurView intensity={Platform.OS === 'ios' ? 80 : 96}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod={"dimezisBlurView"}
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
});
