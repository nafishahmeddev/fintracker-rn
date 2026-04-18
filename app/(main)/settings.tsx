import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import React from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../src/components/ui/BlurBackground';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { Header } from '../../src/components/ui/Header';
import { OptionsDialog } from '../../src/components/ui/OptionsDialog';
import { db } from '../../src/db/client';
import { accounts, categories, payments } from '../../src/db/schema';
import { useSettings } from '../../src/providers/SettingsProvider';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { TYPOGRAPHY } from '../../src/theme/typography';
import { usePremium } from '@/src/providers/PremiumProvider';
import { NotificationService } from '../../src/services/notification.service';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { isPremium, resetPremium } = usePremium();
  const { profile, updateProfile } = useSettings();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [showAppearanceDialog, setShowAppearanceDialog] = React.useState(false);
  const [showResetConfirmDialog, setShowResetConfirmDialog] = React.useState(false);
  const [showEditNameModal, setShowEditNameModal] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [nameInput, setNameInput] = React.useState('');
  const [devClickCount, setDevClickCount] = React.useState(0);

  const themeOptions: { label: string; value: 'light' | 'dark' | 'system'; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Light Mode', value: 'light', icon: 'sunny-outline' },
    { label: 'Dark Mode', value: 'dark', icon: 'moon-outline' },
    { label: 'Follow System', value: 'system', icon: 'phone-portrait-outline' },
  ];

  const handleResetData = () => {
    setShowResetConfirmDialog(true);
  };

  const runResetData = async () => {
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
  };

  const handleThemeChange = () => setShowAppearanceDialog(true);

  const openEditName = () => {
    setNameInput(profile.name || '');
    setShowEditNameModal(true);
  };

  const saveEditName = async () => {
    await updateProfile({ name: nameInput.trim() });
    setShowEditNameModal(false);
  };

  const handleToggleReminders = async () => {
    const nextState = !profile.reminderEnabled;
    
    if (nextState) {
      // If turning on, we must ensure permissions
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        Alert.alert(
          "Permission Required", 
          "Luno needs notification access to send reminders. Please enable this in your device settings."
        );
        return;
      }
    }
    
    await updateProfile({ reminderEnabled: nextState });
  };

  const onTimeChange = async (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate && event.type === 'set') {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      await updateProfile({ reminderTime: `${hours}:${minutes}` });
    }
  };

  const handleFooterClick = () => {
    const nextCount = devClickCount + 1;
    if (nextCount === 7) {
      router.push('/developer' as any);
      setDevClickCount(0);
    } else {
      setDevClickCount(nextCount);
    }
  };

  type PreferenceRowProps = {
    icon: any;
    title: string;
    value?: string;
    subtitle?: string;
    onPress: () => void;
    destructive?: boolean;
    color?: string;
    isLast?: boolean;
  };

  const PreferenceRow = ({ icon, title, value, subtitle, onPress, destructive, color, isLast }: PreferenceRowProps) => {
    const iconColor = color || (destructive ? colors.danger : colors.text);

    return (
      <TouchableOpacity
        style={[styles.row, isLast && { borderBottomWidth: 0 }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.textDetails}>
          <Text style={[styles.rowTitle, destructive && { color: colors.danger }]}>{title}</Text>
          {subtitle && <Text style={styles.rowSubtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
        <View style={styles.rowRightSide}>
          {value ? <Text style={styles.rowValue}>{value}</Text> : null}
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  const activeTheme = (profile.theme || 'system').toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />

      <Header title="Settings" subtitle="System preferences" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroPanel}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroKicker}>DEVICE PROFILE</Text>
              <Text style={styles.heroTitle}>App Configuration</Text>
            </View>
            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>ACTIVE</Text>
            </View>
          </View>

          <View style={styles.heroGrid}>
            <View style={styles.heroGridItem}>
              <Text style={styles.heroGridLabel}>APPEARANCE</Text>
              <Text style={styles.heroGridValue}>{activeTheme}</Text>
            </View>
            <View style={styles.heroGridDivider} />
            <View style={styles.heroGridItem}>
              <Text style={styles.heroGridLabel}>VERSION</Text>
              <Text style={styles.heroGridValue}>v{Constants.expoConfig?.version || '1.0.0'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
          <View style={[styles.card, isPremium && { borderColor: colors.primary, borderWidth: 1.5 }]}>
            <PreferenceRow
              icon="sparkles"
              title={isPremium ? 'Luno Pro (Lifetime)' : 'Upgrade to Pro'}
              value={isPremium ? "ACTIVE" : "FREE"}
              subtitle={
                isPremium ? "Enjoying full access to all features" :
                "Unlock advanced analytics & insights"
              }
              onPress={() => router.push('/premium' as any)}
              color={isPremium ? colors.primary : undefined}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.card}>
            <PreferenceRow
              icon="person-outline"
              title="Display Name"
              value={profile.name ? undefined : 'NOT SET'}
              subtitle={profile.name || 'Personalize your dashboard'}
              onPress={openEditName}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          <View style={styles.card}>
            <PreferenceRow
              icon="notifications-outline"
              title="Daily Reminder"
              value={profile.reminderEnabled ? 'ON' : 'OFF'}
              subtitle="Get notified to track your daily spend"
              onPress={handleToggleReminders}
            />
            <PreferenceRow
              icon="time-outline"
              title="Reminder Time"
              value={profile.reminderTime}
              subtitle="Preferred time for daily alert"
              onPress={() => setShowTimePicker(true)}
              isLast
            />
          </View>
        </View>

        {showTimePicker && (() => {
          // Convert HH:mm to a Date object for the picker
          const [h, m] = profile.reminderTime.split(':').map(Number);
          const date = new Date();
          date.setHours(h, m, 0, 0);
          
          return (
            <DateTimePicker
              value={date}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
            />
          );
        })()}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GENERAL</Text>
          <View style={styles.card}>
            <PreferenceRow
              icon="contrast-outline"
              title="Appearance"
              value={activeTheme}
              subtitle="Dark mode or high-contrast theme"
              onPress={handleThemeChange}
            />
            <PreferenceRow
              icon="grid-outline"
              title="Categories"
              subtitle="Customize income and expense tags"
              onPress={() => router.push('/categories')}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATA</Text>
          <View style={styles.card}>
            <PreferenceRow
              icon="download-outline"
              title="Export CSV"
              subtitle="Download transactions as spreadsheet"
              onPress={() => router.push('/export' as any)}
            />
            <PreferenceRow
              icon="cloud-outline"
              title="Backup & Restore"
              subtitle="Full data backup and restore"
              onPress={() => router.push('/backup' as any)}
            />
            <PreferenceRow
              icon="trash-bin-outline"
              title="Factory Reset"
              destructive
              subtitle="Permanently wipe all local data"
              onPress={handleResetData}
              isLast
            />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleFooterClick} activeOpacity={1}>
            <Text style={styles.footerBrand}>LUNO / CORE</Text>
          </TouchableOpacity>
          <Text style={styles.footerCopy}>ALL DATA IS ENCRYPTED AND STORED LOCALLY BY DEFAULT.</Text>
          
          {devClickCount > 0 && (
            <TouchableOpacity 
              style={{ marginTop: 20, padding: 10 }} 
              onPress={async () => {
                await resetPremium();
                Alert.alert("Premium Reset", "Account downgraded to Free.");
              }}
            >
              <Text style={{ color: colors.danger, fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 10 }}>RESET SUBSCRIPTION ({7 - devClickCount})</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <OptionsDialog
        visible={showAppearanceDialog}
        onClose={() => setShowAppearanceDialog(false)}
        title="Appearance"
        subtitle="Set your preferred interface style"
        options={themeOptions.map((option) => ({
          key: option.value,
          label: option.label,
          icon: option.icon,
          selected: (profile.theme || 'system') === option.value,
          onPress: async () => {
            await updateProfile({ theme: option.value });
          },
        }))}
      />

      <Modal
        visible={showEditNameModal}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowEditNameModal(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowEditNameModal(false)} />
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Display Name</Text>
              <Text style={styles.modalSubtitle}>{"How you'll be greeted in the dashboard"}</Text>
              <TextInput
                style={styles.modalInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Name"
                placeholderTextColor={colors.textMuted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveEditName}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowEditNameModal(false)} activeOpacity={0.8}>
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnSave} onPress={saveEditName} activeOpacity={0.8}>
                  <Text style={styles.modalBtnSaveText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog
        visible={showResetConfirmDialog}
        onClose={() => setShowResetConfirmDialog(false)}
        title="Factory Reset"
        message="This operation is destructive and cannot be undone."
        confirmLabel="Wipe Data"
        destructive
        onConfirm={runResetData}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 48,
  },
  heroPanel: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: colors.surface,
    marginBottom: 28,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  heroKicker: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: TYPOGRAPHY.fonts.heading,
    fontSize: 26,
    color: colors.text,
    letterSpacing: -0.5,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  heroBadgeText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  heroGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  heroGridItem: {
    flex: 1,
  },
  heroGridLabel: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroGridValue: {
    fontFamily: TYPOGRAPHY.fonts.heading,
    fontSize: 18,
    color: colors.text,
    letterSpacing: -0.2,
  },
  heroGridDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.text + '08',
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 12,
    paddingLeft: 4,
  },
  card: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginRight: 14,
  },
  textDetails: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  rowSubtitle: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowRightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    fontFamily: TYPOGRAPHY.fonts.medium,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 1,
  },
  footer: {
    marginTop: 12,
    alignItems: 'center',
    gap: 6,
  },
  footerBrand: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 10,
    color: colors.text,
    letterSpacing: 3,
  },
  footerCopy: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 200,
    lineHeight: 14,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontFamily: TYPOGRAPHY.fonts.heading,
    fontSize: 24,
    color: colors.text,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
  },
  modalInput: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  modalBtnCancelText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.text,
  },
  modalBtnSave: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.text,
  },
  modalBtnSaveText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.background,
  },
  devCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  devText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 13,
    color: colors.text,
    letterSpacing: 0.5,
  },
});
