import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../src/components/ui/BlurBackground';
import { Button } from '../../src/components/ui/Button';
import { db } from '../../src/db/client';
import { accounts, categories, payments } from '../../src/db/schema';
import { useSettings } from '../../src/providers/SettingsProvider';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { profile, updateProfile } = useSettings();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [showAppearanceDialog, setShowAppearanceDialog] = React.useState(false);

  const themeOptions: { label: string; value: 'light' | 'dark' | 'system'; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Light Mode', value: 'light', icon: 'sunny-outline' },
    { label: 'Dark Mode', value: 'dark', icon: 'moon-outline' },
    { label: 'Follow System', value: 'system', icon: 'phone-portrait-outline' },
  ];

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

  const activeTheme = (profile.theme || 'system').toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={21} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerKicker}>CONTROL CENTER</Text>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <View style={styles.headerBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroPanel}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroPanelKicker}>PROFILE DEFAULTS</Text>
            <View style={styles.heroStatusPill}>
              <View style={styles.heroStatusDot} />
              <Text style={styles.heroStatusText}>SYNCED</Text>
            </View>
          </View>
          <Text style={styles.heroPanelTitle}>Your app behavior at a glance</Text>

          <View style={styles.heroStatGrid}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>THEME</Text>
              <Text style={styles.heroStatValue}>{activeTheme}</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>STORAGE</Text>
              <Text style={styles.heroStatValue}>LOCAL</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.sectionCard}>
            <PreferenceRow
              icon="contrast-outline"
              title="Appearance"
              value={activeTheme}
              subtitle="Light, dark, or system color mode"
              onPress={handleThemeChange}
            />
            <PreferenceRow
              icon="grid-outline"
              title="Categories"
              subtitle="Manage transaction classification"
              onPress={() => router.push('/categories')}
            />
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>DANGER ZONE</Text>
          <View style={styles.sectionCard}>
            <PreferenceRow
              icon="trash-bin-outline"
              title="Factory Reset"
              destructive
              subtitle="Erase local database and app state permanently"
              onPress={handleResetData}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>LOCAL-FIRST. PRIVATE. FAST.</Text>
          <Text style={styles.footerText}>ALL DATA STAYS ON DEVICE UNLESS YOU EXPORT.</Text>
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
            <Text style={styles.dialogSubtitle}>Choose how FinTracker should look</Text>

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

            <Button title="Close" variant="secondary" onPress={() => setShowAppearanceDialog(false)} style={styles.dialogCloseButton} />
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
    marginTop: 12,
    marginBottom: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    paddingHorizontal: 14,
  },
  headerKicker: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: typography.fonts.headingRegular,
    fontSize: 30,
    color: colors.text,
    letterSpacing: -0.9,
    lineHeight: 34,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  heroPanel: {
    borderRadius: 22,
    padding: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroPanelKicker: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  heroStatusPill: {
    height: 24,
    borderRadius: 999,
    paddingHorizontal: 10,
    backgroundColor: colors.background + 'BF',
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  heroStatusText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textMuted,
  },
  heroPanelTitle: {
    fontFamily: typography.fonts.headingRegular,
    fontSize: 22,
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 27,
    marginBottom: 14,
  },
  heroStatGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStatItem: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: colors.background + 'B3',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroStatLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 5,
  },
  heroStatValue: {
    fontFamily: typography.fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  sectionCard: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
    fontSize: 17,
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
    fontSize: 10,
    color: colors.primary,
    marginRight: 7,
    letterSpacing: 1,
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: typography.fonts.medium,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1,
    opacity: 0.72,
    marginBottom: 2,
    textAlign: 'center',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 42,
  },
  dialogCard: {
    alignSelf: 'stretch',
    borderRadius: 22,
    backgroundColor: Platform.OS === 'ios' ? colors.background + 'F2' : colors.background,
    borderWidth: 1,
    borderColor: colors.text + '18',
    padding: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  dialogTitle: {
    fontFamily: typography.fonts.headingRegular,
    fontSize: 24,
    color: colors.text,
    letterSpacing: -0.6,
  },
  dialogSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  dialogOptionsWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  dialogOptionRow: {
    height: 48,
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
  dialogCloseButton: {
    marginTop: 8,
    height: 44,
    borderRadius: 12,
  },
});
